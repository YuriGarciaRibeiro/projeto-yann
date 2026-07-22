import re
import unicodedata
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any, Dict, Mapping, Optional, Sequence
from urllib.parse import quote

import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

from app.config import Settings, get_settings


IMAGE_MAX_SIZE_BYTES = 25 * 1024 * 1024
VIDEO_MAX_SIZE_BYTES = 500 * 1024 * 1024
ALLOWED_UPLOAD_MIME_TYPES = (
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
)

MAX_FILENAME_LENGTH = 120
UPLOAD_STORAGE_KEY_PATTERN = re.compile(
    r"^uploads/\d{4}/\d{2}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[a-z0-9._-]{1,120}$",
    re.IGNORECASE,
)
RAW_UPLOAD_STORAGE_KEY_PATTERN = re.compile(
    r"^uploads/raw/\d{4}/\d{2}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[a-z0-9._-]{1,120}$",
    re.IGNORECASE,
)


class MediaObjectNotFound(ValueError):
    pass


class MediaRangeNotSatisfiable(ValueError):
    pass


def _resolve_settings(settings: Optional[Settings]) -> Settings:
    return settings if settings is not None else get_settings()


@lru_cache(maxsize=8)
def _get_cached_s3_client(
    endpoint: str,
    region: str,
    access_key_id: str,
    secret_access_key: str,
) -> Any:
    return boto3.client(
        "s3",
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        endpoint_url=endpoint,
        region_name=region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def get_s3_client(settings: Optional[Settings] = None) -> Any:
    resolved_settings = _resolve_settings(settings)
    return _get_cached_s3_client(
        resolved_settings.s3_endpoint,
        resolved_settings.s3_region,
        resolved_settings.s3_access_key_id,
        resolved_settings.s3_secret_access_key,
    )


def get_s3_presign_client(settings: Optional[Settings] = None) -> Any:
    resolved_settings = _resolve_settings(settings)
    endpoint = resolved_settings.s3_presign_endpoint or resolved_settings.s3_endpoint
    return _get_cached_s3_client(
        endpoint,
        resolved_settings.s3_region,
        resolved_settings.s3_access_key_id,
        resolved_settings.s3_secret_access_key,
    )


def _input_value(input_data: Mapping[str, Any], snake_name: str, camel_name: str) -> Any:
    if snake_name in input_data:
        return input_data[snake_name]
    return input_data.get(camel_name)


def is_allowed_media_mime_type(mime_type: str) -> bool:
    return mime_type in ALLOWED_UPLOAD_MIME_TYPES


def validate_media_upload_input(input_data: Mapping[str, Any]) -> None:
    mime_type = _input_value(input_data, "mime_type", "mimeType")
    size_bytes = _input_value(input_data, "size_bytes", "sizeBytes")

    if not isinstance(mime_type, str) or not is_allowed_media_mime_type(mime_type):
        raise ValueError("Only JPEG, PNG, WebP, GIF, MP4, and WebM uploads are allowed.")

    if isinstance(size_bytes, bool) or not isinstance(size_bytes, (int, float)) or size_bytes <= 0:
        raise ValueError("Upload size must be greater than zero.")

    max_size = IMAGE_MAX_SIZE_BYTES if mime_type.startswith("image/") else VIDEO_MAX_SIZE_BYTES
    if size_bytes > max_size:
        if mime_type.startswith("image/"):
            raise ValueError("Images must be 25MB or smaller.")
        raise ValueError("Videos must be 500MB or smaller.")


def validate_upload_storage_key(storage_key: str) -> None:
    if not isinstance(storage_key, str) or not UPLOAD_STORAGE_KEY_PATTERN.match(storage_key):
        raise ValueError("Upload storage key is invalid.")


def validate_raw_upload_storage_key(storage_key: str) -> None:
    if not isinstance(storage_key, str) or not RAW_UPLOAD_STORAGE_KEY_PATTERN.match(storage_key):
        raise ValueError("Raw upload storage key is invalid.")


def _encode_storage_key(storage_key: str) -> str:
    return "/".join(quote(part, safe="") for part in storage_key.split("/"))


def _sanitize_file_name(file_name: str) -> str:
    normalized = unicodedata.normalize("NFD", file_name)
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    sanitized = re.sub(r"[^a-zA-Z0-9._-]+", "-", without_accents)
    sanitized = sanitized.strip("-").lower()
    return (sanitized or "upload")[:MAX_FILENAME_LENGTH]


def create_media_storage_key(file_name: str, now: Optional[datetime] = None) -> str:
    current_time = now if now is not None else datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    current_time = current_time.astimezone(timezone.utc)

    return "uploads/{year}/{month}/{identifier}-{file_name}".format(
        year=current_time.year,
        month=str(current_time.month).zfill(2),
        identifier=uuid.uuid4(),
        file_name=_sanitize_file_name(file_name),
    )


def create_raw_media_storage_key(file_name: str, now: Optional[datetime] = None) -> str:
    current_time = now if now is not None else datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    current_time = current_time.astimezone(timezone.utc)

    return "uploads/raw/{year}/{month}/{identifier}-{file_name}".format(
        year=current_time.year,
        month=str(current_time.month).zfill(2),
        identifier=uuid.uuid4(),
        file_name=_sanitize_file_name(file_name),
    )


def get_media_delivery_url(storage_key: str, settings: Optional[Settings] = None) -> str:
    validate_upload_storage_key(storage_key)
    resolved_settings = _resolve_settings(settings)
    encoded_key = _encode_storage_key(storage_key)

    if resolved_settings.s3_public_base_url:
        return f"{resolved_settings.s3_public_base_url.rstrip('/')}/{encoded_key}"

    media_path = f"/media/{encoded_key}"
    if resolved_settings.public_url:
        return f"{resolved_settings.public_url.rstrip('/')}{media_path}"
    return media_path


def create_signed_put_upload(input_data: Mapping[str, Any], settings: Optional[Settings] = None) -> Dict[str, str]:
    validate_media_upload_input(input_data)
    resolved_settings = _resolve_settings(settings)
    file_name = _input_value(input_data, "file_name", "fileName")
    mime_type = _input_value(input_data, "mime_type", "mimeType")
    size_bytes = _input_value(input_data, "size_bytes", "sizeBytes")

    storage_key = create_media_storage_key(str(file_name))
    validate_upload_storage_key(storage_key)
    upload_url = get_s3_presign_client(resolved_settings).generate_presigned_url(
        "put_object",
        Params={
            "Bucket": resolved_settings.s3_bucket,
            "Key": storage_key,
            "ContentType": mime_type,
            "ContentLength": size_bytes,
        },
        ExpiresIn=60 * 5,
        HttpMethod="PUT",
    )

    return {
        "storageKey": storage_key,
        "uploadUrl": upload_url,
        "url": get_media_delivery_url(storage_key, resolved_settings),
    }


def create_signed_raw_video_upload(input_data: Mapping[str, Any], settings: Optional[Settings] = None) -> Dict[str, str]:
    validate_media_upload_input(input_data)
    resolved_settings = _resolve_settings(settings)
    file_name = _input_value(input_data, "file_name", "fileName")
    mime_type = _input_value(input_data, "mime_type", "mimeType")
    size_bytes = _input_value(input_data, "size_bytes", "sizeBytes")

    if not isinstance(mime_type, str) or mime_type not in {"video/mp4", "video/webm"}:
        raise ValueError("Raw video uploads require MP4 or WebM video files.")

    storage_key = create_raw_media_storage_key(str(file_name))
    validate_raw_upload_storage_key(storage_key)
    upload_url = get_s3_presign_client(resolved_settings).generate_presigned_url(
        "put_object",
        Params={
            "Bucket": resolved_settings.s3_bucket,
            "Key": storage_key,
            "ContentType": mime_type,
            "ContentLength": size_bytes,
        },
        ExpiresIn=60 * 5,
        HttpMethod="PUT",
    )

    return {"sourceStorageKey": storage_key, "uploadUrl": upload_url}


def put_media_object(input_data: Mapping[str, Any], settings: Optional[Settings] = None) -> Any:
    resolved_settings = _resolve_settings(settings)
    storage_key = str(_input_value(input_data, "storage_key", "storageKey"))
    content_type = str(_input_value(input_data, "content_type", "contentType"))
    content_length = _input_value(input_data, "content_length", "contentLength")
    body = input_data["body"]
    validate_upload_storage_key(storage_key)
    if content_length is None:
        content_length = len(body)

    return get_s3_client(resolved_settings).put_object(
        Bucket=resolved_settings.s3_bucket,
        Key=storage_key,
        Body=body,
        ContentType=content_type,
        ContentLength=content_length,
        CacheControl="public, max-age=31536000, immutable",
    )


def head_media_object(storage_key: str, settings: Optional[Settings] = None) -> Dict[str, Any]:
    resolved_settings = _resolve_settings(settings)
    validate_upload_storage_key(storage_key)

    try:
        return get_s3_client(resolved_settings).head_object(
            Bucket=resolved_settings.s3_bucket,
            Key=storage_key,
        )
    except ClientError as error:
        error_code = error.response.get("Error", {}).get("Code")
        if error_code in {"NoSuchKey", "404", "NotFound"}:
            raise MediaObjectNotFound("Media object not found.") from error
        raise ValueError("Uploaded object could not be verified.") from error
    except Exception as error:
        raise ValueError("Uploaded object could not be verified.") from error


def get_media_object(input_data: Mapping[str, Any], settings: Optional[Settings] = None) -> Dict[str, Any]:
    resolved_settings = _resolve_settings(settings)
    storage_key = str(_input_value(input_data, "storage_key", "storageKey"))
    range_header = input_data.get("range")
    validate_upload_storage_key(storage_key)

    params: Dict[str, Any] = {
        "Bucket": resolved_settings.s3_bucket,
        "Key": storage_key,
    }
    if range_header:
        params["Range"] = range_header

    try:
        return get_s3_client(resolved_settings).get_object(**params)
    except ClientError as error:
        error_code = error.response.get("Error", {}).get("Code")
        status_code = error.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        if error_code in {"NoSuchKey", "404", "NotFound"}:
            raise MediaObjectNotFound("Media object not found.") from error
        if error_code == "InvalidRange" or status_code == 416:
            raise MediaRangeNotSatisfiable("Range header is not satisfiable.") from error
        raise


def get_raw_media_object(storage_key: str, settings: Optional[Settings] = None) -> Dict[str, Any]:
    resolved_settings = _resolve_settings(settings)
    validate_raw_upload_storage_key(storage_key)

    try:
        return get_s3_client(resolved_settings).get_object(
            Bucket=resolved_settings.s3_bucket,
            Key=storage_key,
        )
    except ClientError as error:
        error_code = error.response.get("Error", {}).get("Code")
        if error_code in {"NoSuchKey", "404", "NotFound"}:
            raise MediaObjectNotFound("Media object not found.") from error
        raise


def delete_media_objects(storage_keys: Sequence[str], settings: Optional[Settings] = None) -> None:
    resolved_settings = _resolve_settings(settings)
    unique_storage_keys = list(dict.fromkeys(storage_keys))
    if not unique_storage_keys:
        return

    for storage_key in unique_storage_keys:
        validate_upload_storage_key(storage_key)

    client = get_s3_client(resolved_settings)
    for index in range(0, len(unique_storage_keys), 1000):
        batch = unique_storage_keys[index : index + 1000]
        response = client.delete_objects(
            Bucket=resolved_settings.s3_bucket,
            Delete={
                "Objects": [{"Key": storage_key} for storage_key in batch],
                "Quiet": True,
            },
        )
        if response.get("Errors"):
            raise ValueError("Media object could not be deleted.")


def delete_raw_media_object(storage_key: str, settings: Optional[Settings] = None) -> None:
    resolved_settings = _resolve_settings(settings)
    validate_raw_upload_storage_key(storage_key)
    response = get_s3_client(resolved_settings).delete_objects(
        Bucket=resolved_settings.s3_bucket,
        Delete={"Objects": [{"Key": storage_key}], "Quiet": True},
    )
    if response.get("Errors"):
        raise ValueError("Media object could not be deleted.")


def verify_uploaded_media_object(input_data: Mapping[str, Any], settings: Optional[Settings] = None) -> None:
    validate_media_upload_input(input_data)
    storage_key = str(_input_value(input_data, "storage_key", "storageKey"))
    mime_type = _input_value(input_data, "mime_type", "mimeType")
    size_bytes = _input_value(input_data, "size_bytes", "sizeBytes")

    media_object = head_media_object(storage_key, settings)
    if media_object.get("ContentType") and media_object.get("ContentType") != mime_type:
        raise ValueError("Uploaded object content type does not match metadata.")

    if isinstance(media_object.get("ContentLength"), int) and media_object.get("ContentLength") != size_bytes:
        raise ValueError("Uploaded object size does not match metadata.")
