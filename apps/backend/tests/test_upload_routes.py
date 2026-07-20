from collections.abc import Generator
import json
import tempfile
from typing import Any, Dict, List, Mapping

import anyio
import pytest
from fastapi.testclient import TestClient

import app.admin_media as admin_media
import app.storage as storage
from app.admins import AdminUser
from app.dependencies import get_current_admin
from app.main import create_app


def parse_progress_events(response: object) -> List[Dict[str, object]]:
    content = getattr(response, "content")
    return [json.loads(line) for line in content.decode("utf-8").splitlines() if line.strip()]


class FakeAdminMediaRepository:
    def __init__(self) -> None:
        self.created_assets: List[Dict[str, object]] = []
        self.raise_on_create = False

    def create_media_asset(self, input_data: Mapping[str, object]) -> Dict[str, object]:
        if self.raise_on_create:
            raise ValueError("metadata failed")
        asset = dict(input_data)
        asset["id"] = f"asset-{len(self.created_assets) + 1}"
        self.created_assets.append(asset)
        return asset

    def create_media_assets(self, inputs: List[Mapping[str, object]]) -> List[Dict[str, object]]:
        if self.raise_on_create:
            raise ValueError("metadata failed")
        assets = []
        for input_data in inputs:
            asset = dict(input_data)
            asset["id"] = f"asset-{len(self.created_assets) + len(assets) + 1}"
            assets.append(asset)
        self.created_assets.extend(assets)
        return assets


@pytest.fixture
def route_repository() -> FakeAdminMediaRepository:
    return FakeAdminMediaRepository()


@pytest.fixture
def client(route_repository: FakeAdminMediaRepository) -> Generator[TestClient, None, None]:
    app = create_app()
    admin_user = AdminUser(id="admin-id", email="admin@example.com", password_hash="hash")
    app.dependency_overrides[get_current_admin] = lambda: admin_user
    app.dependency_overrides[admin_media.get_admin_media_repository] = lambda: route_repository
    with TestClient(app) as test_client:
        yield test_client


def test_sign_upload_requires_admin() -> None:
    with TestClient(create_app()) as test_client:
        response = test_client.post(
            "/admin/uploads/sign",
            json={"fileName": "hero.jpg", "mimeType": "image/jpeg", "size": 1024},
        )

    assert response.status_code == 401


def test_sign_upload_rejects_video_mime_type(client: TestClient) -> None:
    response = client.post(
        "/admin/uploads/sign",
        json={"fileName": "hero.mp4", "mimeType": "video/mp4", "size": 1024},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Video uploads must use the optimized video endpoint."


def test_sign_upload_returns_signed_put_payload(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    calls: List[Mapping[str, object]] = []

    def fake_create_signed_put_upload(input_data: Mapping[str, object]) -> Dict[str, str]:
        calls.append(dict(input_data))
        return {
            "storageKey": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
            "uploadUrl": "https://uploads.example.com/signed-put",
            "url": "/media/uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
        }

    monkeypatch.setattr(storage, "create_signed_put_upload", fake_create_signed_put_upload)

    response = client.post(
        "/admin/uploads/sign",
        json={"fileName": "hero.jpg", "mimeType": "image/jpeg", "size": 1024},
    )

    assert response.status_code == 200
    assert response.json() == {
        "storageKey": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
        "uploadUrl": "https://uploads.example.com/signed-put",
        "url": "/media/uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
    }
    assert calls == [{"fileName": "hero.jpg", "mimeType": "image/jpeg", "sizeBytes": 1024}]


def test_video_upload_processes_two_variants_and_creates_media_rows(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.upload_routes as upload_routes

    ffmpeg_calls: List[List[str]] = []
    put_calls: List[Mapping[str, object]] = []

    def fake_run_ffmpeg(args: List[str]) -> None:
        ffmpeg_calls.append(args)
        output_path = args[-1]
        with open(output_path, "wb") as output_file:
            output_file.write(b"scrub-bytes" if "scroll" in output_path else b"standard-bytes")

    def fake_create_media_storage_key(file_name: str) -> str:
        if file_name == "hero-rolagem.mp4":
            return "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-rolagem.mp4"
        return "uploads/2026/07/123e4567-e89b-12d3-a456-426614174001-hero-normal.mp4"

    def fake_put_media_object(input_data: Mapping[str, object]) -> None:
        body = input_data["body"]
        put_calls.append({**dict(input_data), "body": body.read()})

    monkeypatch.setattr(upload_routes, "run_ffmpeg", fake_run_ffmpeg)
    monkeypatch.setattr(storage, "create_media_storage_key", fake_create_media_storage_key)
    monkeypatch.setattr(storage, "get_media_delivery_url", lambda key: f"/media/{key}")
    monkeypatch.setattr(storage, "put_media_object", fake_put_media_object)

    response = client.post(
        "/admin/uploads/video",
        files={"file": ("hero.mp4", b"source-video", "video/mp4")},
        data={"altText": "Hero video", "usageScope": "project", "projectId": "project-id"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/x-ndjson")
    events = parse_progress_events(response)
    assert [event["event"] for event in events] == [
        "request-started",
        "file-received",
        "scrub-started",
        "scrub-finished",
        "standard-started",
        "standard-finished",
        "storage-upload-started",
        "storage-upload-finished",
        "database-write-started",
        "database-write-finished",
        "completed",
    ]
    assert [event["message"] for event in events] == [
        "Recebendo video...",
        "Video recebido. Preparando conversao...",
        "Convertendo versao para rolagem...",
        "Versao para rolagem pronta.",
        "Convertendo versao normal...",
        "Versao normal pronta.",
        "Enviando videos otimizados...",
        "Videos enviados.",
        "Salvando dados do video...",
        "Dados do video salvos.",
        "Upload concluido.",
    ]
    assert all(isinstance(event["requestId"], str) and event["requestId"] for event in events)
    assert events[-1]["ok"] is True
    assert len(ffmpeg_calls) == 2
    assert [call[0:2] for call in ffmpeg_calls] == [["-y", "-i"], ["-y", "-i"]]
    assert "-an" in ffmpeg_calls[0]
    assert "-g" in ffmpeg_calls[0]
    assert "-c:a" in ffmpeg_calls[1]
    assert put_calls == [
        {
            "body": b"scrub-bytes",
            "contentType": "video/mp4",
            "contentLength": 11,
            "storageKey": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-rolagem.mp4",
        },
        {
            "body": b"standard-bytes",
            "contentType": "video/mp4",
            "contentLength": 14,
            "storageKey": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174001-hero-normal.mp4",
        },
    ]
    assert route_repository.created_assets == [
        {
            "storageKey": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-rolagem.mp4",
            "mimeType": "video/mp4",
            "sizeBytes": 11,
            "altText": "Hero video - rolagem otimizado",
            "usageScope": "project",
            "projectId": "project-id",
            "videoVariant": "scrub",
            "id": "asset-1",
        },
        {
            "storageKey": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174001-hero-normal.mp4",
            "mimeType": "video/mp4",
            "sizeBytes": 14,
            "altText": "Hero video - normal com áudio",
            "usageScope": "project",
            "projectId": "project-id",
            "videoVariant": "standard",
            "id": "asset-2",
        },
    ]


def test_video_upload_deletes_uploaded_objects_when_metadata_fails(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.upload_routes as upload_routes

    deleted_keys: List[List[str]] = []

    def fake_run_ffmpeg(args: List[str]) -> None:
        with open(args[-1], "wb") as output_file:
            output_file.write(b"video-bytes")

    route_repository.raise_on_create = True
    monkeypatch.setattr(upload_routes, "run_ffmpeg", fake_run_ffmpeg)
    monkeypatch.setattr(
        storage,
        "create_media_storage_key",
        lambda file_name: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-" + file_name,
    )
    monkeypatch.setattr(storage, "get_media_delivery_url", lambda key: f"/media/{key}")
    monkeypatch.setattr(storage, "put_media_object", lambda input_data: None)
    monkeypatch.setattr(storage, "delete_media_objects", lambda keys: deleted_keys.append(list(keys)))

    response = client.post(
        "/admin/uploads/video",
        files={"file": ("hero.mp4", b"source-video", "video/mp4")},
        data={"altText": "Hero video", "usageScope": "site"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/x-ndjson")
    events = parse_progress_events(response)
    assert events[-1]["event"] == "failed"
    assert events[-1]["ok"] is False
    assert events[-1]["error"] == "metadata failed"
    assert events[-1]["requestId"]
    assert deleted_keys == [
        [
            "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-rolagem.mp4",
            "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-normal.mp4",
        ]
    ]
    assert route_repository.created_assets == []


def test_video_upload_does_not_yield_between_storage_upload_and_metadata_persistence(
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.upload_routes as upload_routes

    deleted_keys: List[List[str]] = []
    call_order: List[str] = []

    class FakeUploadFile:
        def __init__(self, file: object) -> None:
            self.content_type = "video/mp4"
            self.file = file
            self.filename = "hero.mp4"

    def fake_run_ffmpeg(args: List[str]) -> None:
        with open(args[-1], "wb") as output_file:
            output_file.write(b"video-bytes")

    def fake_put_media_object(input_data: Mapping[str, object]) -> None:
        call_order.append(f"put:{input_data['storageKey']}")

    def fake_create_media_assets(inputs: List[Mapping[str, object]]) -> List[Dict[str, object]]:
        call_order.append("database-persisted")
        return FakeAdminMediaRepository.create_media_assets(route_repository, inputs)

    async def run_response(response: object) -> None:
        async def receive() -> Dict[str, object]:
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message: Mapping[str, object]) -> None:
            if message["type"] != "http.response.body" or not message.get("body"):
                return
            event = json.loads(message["body"])
            call_order.append(f"event:{event['event']}")

        await response(
            {"type": "http", "asgi": {"spec_version": "2.4"}},
            receive,
            send,
        )

    monkeypatch.setattr(route_repository, "create_media_assets", fake_create_media_assets)
    monkeypatch.setattr(upload_routes, "run_ffmpeg", fake_run_ffmpeg)
    monkeypatch.setattr(
        storage,
        "create_media_storage_key",
        lambda file_name: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-" + file_name,
    )
    monkeypatch.setattr(storage, "get_media_delivery_url", lambda key: f"/media/{key}")
    monkeypatch.setattr(storage, "put_media_object", fake_put_media_object)
    monkeypatch.setattr(storage, "delete_media_objects", lambda keys: deleted_keys.append(list(keys)))

    with tempfile.TemporaryFile() as source_file:
        source_file.write(b"source-video")
        source_file.seek(0)
        response = upload_routes.upload_admin_video(
            current_admin=AdminUser(id="admin-id", email="admin@example.com", password_hash="hash"),
            repository=route_repository,
            file=FakeUploadFile(source_file),
            altText="Hero video",
            usageScope="site",
        )
        anyio.run(run_response, response)

    assert call_order.index("put:uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-normal.mp4") < call_order.index(
        "database-persisted"
    )
    assert call_order.index("database-persisted") < call_order.index("event:storage-upload-finished")
    assert call_order.index("database-persisted") < call_order.index("event:database-write-started")
    assert deleted_keys == []
    assert len(route_repository.created_assets) == 2


def test_video_upload_deletes_first_uploaded_object_when_second_upload_fails(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.upload_routes as upload_routes

    deleted_keys: List[List[str]] = []
    put_count = 0

    def fake_run_ffmpeg(args: List[str]) -> None:
        with open(args[-1], "wb") as output_file:
            output_file.write(b"video-bytes")

    def fake_put_media_object(input_data: Mapping[str, object]) -> None:
        nonlocal put_count
        put_count += 1
        if put_count == 2:
            raise RuntimeError("storage failed")

    monkeypatch.setattr(upload_routes, "run_ffmpeg", fake_run_ffmpeg)
    monkeypatch.setattr(
        storage,
        "create_media_storage_key",
        lambda file_name: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-" + file_name,
    )
    monkeypatch.setattr(storage, "put_media_object", fake_put_media_object)
    monkeypatch.setattr(storage, "delete_media_objects", lambda keys: deleted_keys.append(list(keys)))

    response = client.post(
        "/admin/uploads/video",
        files={"file": ("hero.mp4", b"source-video", "video/mp4")},
        data={"altText": "Hero video", "usageScope": "site"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/x-ndjson")
    events = parse_progress_events(response)
    assert events[-1]["event"] == "failed"
    assert events[-1]["ok"] is False
    assert events[-1]["error"] == "storage failed"
    assert deleted_keys == [["uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-rolagem.mp4"]]


def test_video_upload_missing_multipart_fields_returns_request_id(client: TestClient) -> None:
    response = client.post(
        "/admin/uploads/video",
        files={"file": ("hero.mp4", b"source-video", "video/mp4")},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/x-ndjson")
    events = parse_progress_events(response)
    assert events[-1]["event"] == "failed"
    assert events[-1]["ok"] is False
    assert events[-1]["error"] == "Adicione um nome para identificar o arquivo."
    assert events[-1]["requestId"]


def test_media_proxy_streams_object_with_range_headers(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    calls: List[Mapping[str, object]] = []
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4"

    def fake_get_media_object(input_data: Mapping[str, object]) -> Dict[str, Any]:
        calls.append(dict(input_data))
        return {
            "Body": b"partial-bytes",
            "ContentLength": 13,
            "ContentRange": "bytes 0-12/100",
            "AcceptRanges": "bytes",
            "ContentType": "video/mp4",
        }

    monkeypatch.setattr(storage, "get_media_object", fake_get_media_object)

    response = client.get(f"/media/{key}", headers={"Range": "bytes=0-12"})

    assert response.status_code == 206
    assert response.content == b"partial-bytes"
    assert response.headers["content-type"] == "video/mp4"
    assert response.headers["content-length"] == "13"
    assert response.headers["content-range"] == "bytes 0-12/100"
    assert response.headers["accept-ranges"] == "bytes"
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"
    assert calls == [{"storageKey": key, "range": "bytes=0-12"}]


def test_media_proxy_head_returns_headers_without_body(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4"

    monkeypatch.setattr(
        storage,
        "head_media_object",
        lambda storage_key: {"ContentLength": 100, "ContentType": "video/mp4"},
    )

    response = client.head(f"/media/{key}")

    assert response.status_code == 200
    assert response.content == b""
    assert response.headers["content-type"] == "video/mp4"
    assert response.headers["content-length"] == "100"
    assert response.headers["accept-ranges"] == "bytes"


def test_media_proxy_rejects_invalid_range_header(client: TestClient) -> None:
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4"

    response = client.get(f"/media/{key}", headers={"Range": "items=0-12"})

    assert response.status_code == 416
    assert response.json()["detail"] == "Range header is invalid."


def test_media_proxy_returns_416_for_unsatisfiable_range(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4"

    def fake_get_media_object(input_data: Mapping[str, object]) -> Dict[str, Any]:
        raise storage.MediaRangeNotSatisfiable("Range header is not satisfiable.")

    monkeypatch.setattr(storage, "get_media_object", fake_get_media_object)

    response = client.get(f"/media/{key}", headers={"Range": "bytes=1000-2000"})

    assert response.status_code == 416
    assert response.json()["detail"] == "Range header is not satisfiable."


def test_media_proxy_returns_404_for_missing_object(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-missing.mp4"

    def fake_get_media_object(input_data: Mapping[str, object]) -> Dict[str, Any]:
        raise storage.MediaObjectNotFound("Media object not found.")

    monkeypatch.setattr(storage, "get_media_object", fake_get_media_object)

    response = client.get(f"/media/{key}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Media object not found."


def test_media_proxy_rejects_invalid_storage_key(client: TestClient) -> None:
    response = client.get("/media/uploads/invalid/secret.mp4")

    assert response.status_code == 400
    assert response.json()["detail"] == "Upload storage key is invalid."
