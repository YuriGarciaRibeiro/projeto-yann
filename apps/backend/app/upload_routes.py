import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from typing import Annotated, Any, Dict, Iterable, Iterator, Mapping, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

import app.admin_media as admin_media
import app.storage as storage
from app.admins import AdminUser
from app.dependencies import get_current_admin


admin_uploads_router = APIRouter(prefix="/admin", tags=["admin-uploads"])
media_router = APIRouter(tags=["media"])

OUTPUT_MIME_TYPE = "video/mp4"
UPLOAD_CHUNK_SIZE = 1024 * 1024
RANGE_HEADER_PATTERN = re.compile(r"^bytes=(\d+-\d*|\d*-\d+)$")
logger = logging.getLogger(__name__)


class SignedUploadRequest(BaseModel):
    fileName: str
    mimeType: str
    size: int


def _extensionless_file_name(file_name: str) -> str:
    base_name = os.path.basename(file_name or "video.mp4")
    extensionless_name = os.path.splitext(base_name)[0]
    return extensionless_name or "video"


def optimized_video_file_name(file_name: str) -> str:
    return f"{_extensionless_file_name(file_name)}-rolagem.mp4"


def standard_video_file_name(file_name: str) -> str:
    return f"{_extensionless_file_name(file_name)}-normal.mp4"


def safe_temporary_file_name(file_name: str) -> str:
    safe_name = "".join(char if char.isalnum() or char in "._-" else "-" for char in file_name or "input-video")
    return safe_name or "input-video"


def run_ffmpeg(args: Iterable[str]) -> None:
    completed_process = subprocess.run(
        ["ffmpeg", *args],
        stderr=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        check=False,
    )
    if completed_process.returncode != 0:
        error_message = completed_process.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(error_message or "FFmpeg nao conseguiu processar o video.")


def log_video_upload(request_id: str, message: str, metadata: Optional[Mapping[str, object]] = None) -> None:
    logger.info(json.dumps({"message": message, "requestId": request_id, "scope": "video-upload", **(metadata or {})}))


def log_video_upload_error(
    request_id: str,
    message: str,
    error: Exception,
    metadata: Optional[Mapping[str, object]] = None,
) -> None:
    logger.error(
        json.dumps(
            {
                "error": str(error),
                "message": message,
                "requestId": request_id,
                "scope": "video-upload",
                **(metadata or {}),
            }
        ),
        exc_info=True,
    )


def video_progress_event(
    event: str,
    request_id: str,
    message: str,
    metadata: Optional[Mapping[str, object]] = None,
) -> str:
    return json.dumps(
        {
            "event": event,
            "message": message,
            "requestId": request_id,
            **(metadata or {}),
        }
    ) + "\n"


def create_scrub_video(input_path: str, output_path: str) -> None:
    run_ffmpeg(
        [
            "-y",
            "-i",
            input_path,
            "-an",
            "-vf",
            "scale='min(1920,iw)':-2",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "22",
            "-maxrate",
            "5500k",
            "-bufsize",
            "9000k",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-g",
            "12",
            "-keyint_min",
            "12",
            "-sc_threshold",
            "0",
            output_path,
        ]
    )


def create_standard_video(input_path: str, output_path: str) -> None:
    run_ffmpeg(
        [
            "-y",
            "-i",
            input_path,
            "-vf",
            "scale='min(1920,iw)':-2",
            "-c:v",
            "libx264",
            "-preset",
            "slow",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            output_path,
        ]
    )


def _bad_request(error: Exception) -> HTTPException:
    return HTTPException(status_code=400, detail=str(error))


def _parse_usage_scope(value: str) -> str:
    usage_scope = value.strip()
    if usage_scope not in {"site", "project"}:
        raise ValueError("Escolha onde este arquivo sera usado.")
    return usage_scope


def _body_iterator(body: Any) -> Iterable[bytes]:
    if isinstance(body, bytes):
        yield body
        return
    if isinstance(body, bytearray):
        yield bytes(body)
        return
    if hasattr(body, "iter_chunks"):
        yield from body.iter_chunks()
        return
    if hasattr(body, "read"):
        while True:
            chunk = body.read(1024 * 1024)
            if not chunk:
                break
            yield chunk
        return
    yield bytes(body)


@admin_uploads_router.post("/uploads/sign")
def sign_admin_upload(
    body: SignedUploadRequest,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
) -> Dict[str, str]:
    if body.mimeType.startswith("video/"):
        raise HTTPException(status_code=400, detail="Video uploads must use the optimized video endpoint.")

    try:
        return storage.create_signed_put_upload(
            {"fileName": body.fileName, "mimeType": body.mimeType, "sizeBytes": body.size}
        )
    except ValueError as error:
        raise _bad_request(error) from error


@admin_uploads_router.post("/uploads/video")
def upload_admin_video(
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[admin_media.AdminMediaRepository, Depends(admin_media.get_admin_media_repository)],
    file: Optional[UploadFile] = File(None),
    altText: Optional[str] = Form(None),
    usageScope: Optional[str] = Form(None),
    projectId: Annotated[Optional[str], Form()] = None,
) -> StreamingResponse:
    request_id = str(uuid.uuid4())
    source_upload_fd = os.dup(file.file.fileno()) if file is not None else None

    def stream_video_upload() -> Iterator[str]:
        temporary_directory: Optional[str] = None
        uploaded_storage_keys = []
        source_upload_file: Optional[Any] = None
        database_persisted = False

        def cleanup_uploaded_storage() -> None:
            if not uploaded_storage_keys:
                return
            try:
                storage.delete_media_objects(uploaded_storage_keys)
                log_video_upload(request_id, "storage-cleanup-finished", {"uploadedStorageKeys": uploaded_storage_keys})
                uploaded_storage_keys.clear()
            except Exception as cleanup_error:
                log_video_upload_error(
                    request_id,
                    "storage-cleanup-failed",
                    cleanup_error,
                    {"uploadedStorageKeys": uploaded_storage_keys},
                )

        try:
            log_video_upload(request_id, "request-started")
            yield video_progress_event("request-started", request_id, "Recebendo video...")
            if file is None:
                raise ValueError("Escolha um video para enviar.")

            content_type = file.content_type or ""
            if not content_type.startswith("video/"):
                raise ValueError("Este envio otimizado aceita apenas videos.")

            alt_text = altText.strip() if altText else ""
            if not alt_text:
                raise ValueError("Adicione um nome para identificar o arquivo.")

            usage_scope = _parse_usage_scope(usageScope or "")
            project_id = projectId.strip() if projectId else None
            if usage_scope == "project" and not project_id:
                raise ValueError("Escolha um projeto para este video.")

            temporary_directory = tempfile.mkdtemp(prefix="paralax-video-")
            input_path = os.path.join(temporary_directory, safe_temporary_file_name(file.filename or "input-video"))
            scrub_output_path = os.path.join(temporary_directory, "output-scroll.mp4")
            standard_output_path = os.path.join(temporary_directory, "output-standard.mp4")

            source_upload_file = os.fdopen(source_upload_fd, "rb") if source_upload_fd is not None else None
            source_size = 0
            with open(input_path, "wb") as input_file:
                while True:
                    chunk = source_upload_file.read(UPLOAD_CHUNK_SIZE) if source_upload_file else b""
                    if not chunk:
                        break
                    source_size += len(chunk)
                    if source_size > storage.VIDEO_MAX_SIZE_BYTES:
                        raise ValueError("Videos must be 500MB or smaller.")
                    input_file.write(chunk)
            storage.validate_media_upload_input({"mimeType": content_type, "sizeBytes": source_size})

            file_metadata = {
                "fileName": file.filename or "video.mp4",
                "fileSize": source_size,
                "fileType": content_type,
                "projectId": project_id,
                "usageScope": usage_scope,
            }
            log_video_upload(request_id, "file-received", file_metadata)
            yield video_progress_event("file-received", request_id, "Video recebido. Preparando conversao...", file_metadata)

            source_file_name = file.filename or "video.mp4"
            log_video_upload(request_id, "scrub-started", {"fileName": source_file_name})
            yield video_progress_event("scrub-started", request_id, "Convertendo versao para rolagem...", {"fileName": source_file_name})
            create_scrub_video(input_path, scrub_output_path)
            log_video_upload(request_id, "scrub-finished", {"fileName": source_file_name})
            yield video_progress_event("scrub-finished", request_id, "Versao para rolagem pronta.", {"fileName": source_file_name})

            log_video_upload(request_id, "standard-started", {"fileName": source_file_name})
            yield video_progress_event("standard-started", request_id, "Convertendo versao normal...", {"fileName": source_file_name})
            create_standard_video(input_path, standard_output_path)
            log_video_upload(request_id, "standard-finished", {"fileName": source_file_name})
            yield video_progress_event("standard-finished", request_id, "Versao normal pronta.", {"fileName": source_file_name})

            scrub_size = os.path.getsize(scrub_output_path)
            standard_size = os.path.getsize(standard_output_path)

            scrub_storage_key = storage.create_media_storage_key(optimized_video_file_name(source_file_name))
            standard_storage_key = storage.create_media_storage_key(standard_video_file_name(source_file_name))

            storage_metadata = {"scrubSize": scrub_size, "standardSize": standard_size}
            log_video_upload(request_id, "storage-upload-started", storage_metadata)
            yield video_progress_event("storage-upload-started", request_id, "Enviando videos otimizados...", storage_metadata)
            with open(scrub_output_path, "rb") as scrub_file:
                storage.put_media_object(
                    {
                        "body": scrub_file,
                        "contentType": OUTPUT_MIME_TYPE,
                        "contentLength": scrub_size,
                        "storageKey": scrub_storage_key,
                    }
                )
            uploaded_storage_keys.append(scrub_storage_key)
            with open(standard_output_path, "rb") as standard_file:
                storage.put_media_object(
                    {
                        "body": standard_file,
                        "contentType": OUTPUT_MIME_TYPE,
                        "contentLength": standard_size,
                        "storageKey": standard_storage_key,
                    }
                )
            uploaded_storage_keys.append(standard_storage_key)
            uploaded_metadata = {"standardStorageKey": standard_storage_key, "scrubStorageKey": scrub_storage_key}
            log_video_upload(request_id, "storage-upload-finished", uploaded_metadata)
            yield video_progress_event("storage-upload-finished", request_id, "Videos enviados.", uploaded_metadata)

            log_video_upload(request_id, "database-write-started")
            yield video_progress_event("database-write-started", request_id, "Salvando dados do video...")
            repository.create_media_assets(
                [
                    {
                        "storageKey": scrub_storage_key,
                        "mimeType": OUTPUT_MIME_TYPE,
                        "sizeBytes": scrub_size,
                        "altText": f"{alt_text} - rolagem otimizado",
                        "usageScope": usage_scope,
                        "projectId": project_id,
                        "videoVariant": "scrub",
                    },
                    {
                        "storageKey": standard_storage_key,
                        "mimeType": OUTPUT_MIME_TYPE,
                        "sizeBytes": standard_size,
                        "altText": f"{alt_text} - normal com áudio",
                        "usageScope": usage_scope,
                        "projectId": project_id,
                        "videoVariant": "standard",
                    },
                ]
            )
            database_persisted = True
            log_video_upload(request_id, "database-write-finished")
            yield video_progress_event("database-write-finished", request_id, "Dados do video salvos.")

            log_video_upload(request_id, "request-finished", {"fileName": source_file_name})
            yield video_progress_event("completed", request_id, "Upload concluido.", {"ok": True})
        except Exception as error:
            log_video_upload_error(request_id, "request-failed", error)
            cleanup_uploaded_storage()
            yield video_progress_event("failed", request_id, "Nao foi possivel concluir o upload.", {"ok": False, "error": str(error)})
        finally:
            if uploaded_storage_keys and not database_persisted:
                cleanup_uploaded_storage()
            if source_upload_file:
                source_upload_file.close()
            elif source_upload_fd is not None:
                os.close(source_upload_fd)
            if temporary_directory:
                shutil.rmtree(temporary_directory, ignore_errors=True)

    return StreamingResponse(stream_video_upload(), media_type="application/x-ndjson")


def _media_headers(media_object: Mapping[str, object]) -> Dict[str, str]:
    headers = {"Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes"}
    if media_object.get("ContentLength") is not None:
        headers["Content-Length"] = str(media_object["ContentLength"])
    if media_object.get("ContentRange"):
        headers["Content-Range"] = str(media_object["ContentRange"])
    return headers


def _validate_range_header(range_header: Optional[str]) -> None:
    if range_header and not RANGE_HEADER_PATTERN.match(range_header):
        raise HTTPException(status_code=416, detail="Range header is invalid.")


@media_router.head("/media/{storage_key:path}")
def head_media(storage_key: str) -> Response:
    try:
        media_object = storage.head_media_object(storage_key)
    except storage.MediaObjectNotFound as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except storage.MediaRangeNotSatisfiable as error:
        raise HTTPException(status_code=416, detail=str(error)) from error
    except ValueError as error:
        raise _bad_request(error) from error

    return Response(
        content=b"",
        media_type=str(media_object.get("ContentType") or "application/octet-stream"),
        headers=_media_headers(media_object),
    )


@media_router.get("/media/{storage_key:path}")
def get_media(
    storage_key: str,
    range_header: Annotated[Optional[str], Header(alias="Range")] = None,
) -> StreamingResponse:
    try:
        _validate_range_header(range_header)
        media_object = storage.get_media_object({"storageKey": storage_key, "range": range_header})
    except storage.MediaObjectNotFound as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except storage.MediaRangeNotSatisfiable as error:
        raise HTTPException(status_code=416, detail=str(error)) from error
    except ValueError as error:
        raise _bad_request(error) from error

    status_code = 206 if media_object.get("ContentRange") else 200
    return StreamingResponse(
        _body_iterator(media_object["Body"]),
        status_code=status_code,
        media_type=str(media_object.get("ContentType") or "application/octet-stream"),
        headers=_media_headers(media_object),
    )
