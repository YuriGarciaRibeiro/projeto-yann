from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, unquote, urlparse

import pytest
from botocore.exceptions import ClientError

from app.config import Settings
from app import storage


class FakeS3Client:
    def __init__(self) -> None:
        self.presigned_calls: List[Dict[str, Any]] = []
        self.put_calls: List[Dict[str, Any]] = []
        self.head_calls: List[Dict[str, Any]] = []
        self.get_calls: List[Dict[str, Any]] = []
        self.delete_calls: List[Dict[str, Any]] = []
        self.head_response: Dict[str, Any] = {"ContentType": "image/jpeg", "ContentLength": 1024}
        self.get_response: Dict[str, Any] = {
            "Body": b"partial-bytes",
            "ContentLength": 13,
            "ContentRange": "bytes 0-12/100",
            "ContentType": "video/mp4",
        }

    def generate_presigned_url(
        self,
        client_method: str,
        Params: Dict[str, Any],
        ExpiresIn: int,
        HttpMethod: str,
    ) -> str:
        self.presigned_calls.append(
            {
                "client_method": client_method,
                "params": Params,
                "expires_in": ExpiresIn,
                "http_method": HttpMethod,
            }
        )
        return "https://uploads.example.com/signed-put"

    def put_object(self, **kwargs: Any) -> Dict[str, Any]:
        self.put_calls.append(kwargs)
        return {"ETag": "etag"}

    def head_object(self, **kwargs: Any) -> Dict[str, Any]:
        self.head_calls.append(kwargs)
        return self.head_response

    def get_object(self, **kwargs: Any) -> Dict[str, Any]:
        self.get_calls.append(kwargs)
        return self.get_response

    def delete_objects(self, **kwargs: Any) -> Dict[str, Any]:
        self.delete_calls.append(kwargs)
        return {}


def settings(**overrides: Any) -> Settings:
    values: Dict[str, Any] = {
        "jwt_secret": "x" * 32,
        "public_url": None,
        "s3_endpoint": "http://localhost:9000/minio",
        "s3_region": "us-east-1",
        "s3_bucket": "portfolio-media",
        "s3_access_key_id": "minio",
        "s3_secret_access_key": "minio-secret",
        "s3_public_base_url": None,
    }
    values.update(overrides)
    return Settings(**values)


@pytest.mark.parametrize(
    "mime_type",
    ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
)
def test_validate_media_upload_input_allows_supported_mime_types(mime_type: str) -> None:
    storage.validate_media_upload_input({"mime_type": mime_type, "size_bytes": 1024})


def test_validate_media_upload_input_rejects_unsupported_mime_type() -> None:
    with pytest.raises(ValueError, match="Only JPEG, PNG, WebP, GIF, MP4, and WebM uploads are allowed"):
        storage.validate_media_upload_input({"mime_type": "image/svg+xml", "size_bytes": 1024})


@pytest.mark.parametrize(
    ("mime_type", "size_bytes", "message"),
    [
        ("image/jpeg", 0, "Upload size must be greater than zero"),
        ("image/jpeg", storage.IMAGE_MAX_SIZE_BYTES + 1, "Images must be 25MB or smaller"),
        ("video/mp4", storage.VIDEO_MAX_SIZE_BYTES + 1, "Videos must be 500MB or smaller"),
    ],
)
def test_validate_media_upload_input_enforces_upload_sizes(
    mime_type: str,
    size_bytes: int,
    message: str,
) -> None:
    with pytest.raises(ValueError, match=message):
        storage.validate_media_upload_input({"mime_type": mime_type, "size_bytes": size_bytes})


def test_create_media_storage_key_sanitizes_filename_and_uses_utc_month(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(storage.uuid, "uuid4", lambda: "123e4567-e89b-12d3-a456-426614174000")

    key = storage.create_media_storage_key("Átrio Final 01.JPG", datetime(2026, 7, 19, tzinfo=timezone.utc))

    assert key == "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-atrio-final-01.jpg"


def test_validate_upload_storage_key_rejects_invalid_keys() -> None:
    with pytest.raises(ValueError, match="Upload storage key is invalid"):
        storage.validate_upload_storage_key("../private/object.jpg")


def test_get_media_delivery_url_uses_backend_media_proxy_without_public_s3_base_url() -> None:
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-image.jpg"

    assert storage.get_media_delivery_url(key, settings()) == "/media/uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-image.jpg"


def test_get_media_delivery_url_prefixes_backend_media_proxy_with_public_url() -> None:
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-image.jpg"

    assert (
        storage.get_media_delivery_url(key, settings(public_url="https://api.example.com/"))
        == "https://api.example.com/media/uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-image.jpg"
    )


def test_get_media_delivery_url_uses_public_s3_base_url_when_configured() -> None:
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-image.jpg"

    assert (
        storage.get_media_delivery_url(key, settings(s3_public_base_url="https://cdn.example.com/media/"))
        == "https://cdn.example.com/media/uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-image.jpg"
    )


def test_create_signed_put_upload_validates_and_presigns_put(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_client = FakeS3Client()
    monkeypatch.setattr(storage, "get_s3_presign_client", lambda settings: fake_client)
    monkeypatch.setattr(
        storage,
        "create_media_storage_key",
        lambda file_name: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
    )

    signed_upload = storage.create_signed_put_upload(
        {"file_name": "Hero.JPG", "mime_type": "image/jpeg", "size_bytes": 1024},
        settings(s3_public_base_url="https://cdn.example.com"),
    )

    assert signed_upload == {
        "storageKey": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
        "uploadUrl": "https://uploads.example.com/signed-put",
        "url": "https://cdn.example.com/uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
    }
    assert fake_client.presigned_calls == [
        {
            "client_method": "put_object",
            "params": {
                "Bucket": "portfolio-media",
                "Key": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
                "ContentType": "image/jpeg",
                "ContentLength": 1024,
            },
            "expires_in": 300,
            "http_method": "PUT",
        }
    ]


def test_get_s3_client_uses_sigv4_and_path_style_config(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: List[Dict[str, Any]] = []

    def fake_boto3_client(*args: Any, **kwargs: Any) -> FakeS3Client:
        calls.append({"args": args, "kwargs": kwargs})
        return FakeS3Client()

    storage._get_cached_s3_client.cache_clear()
    monkeypatch.setattr(storage.boto3, "client", fake_boto3_client)

    storage.get_s3_client(settings())

    config = calls[0]["kwargs"]["config"]
    assert config.signature_version == "s3v4"
    assert config.s3 == {"addressing_style": "path"}


def test_create_signed_put_upload_presigned_url_signs_required_put_headers() -> None:
    storage._get_cached_s3_client.cache_clear()

    signed_upload = storage.create_signed_put_upload(
        {"file_name": "Hero.JPG", "mime_type": "image/jpeg", "size_bytes": 1024},
        settings(s3_endpoint="http://localhost:9000"),
    )

    parsed_url = urlparse(signed_upload["uploadUrl"])
    query = parse_qs(parsed_url.query)
    signed_headers = set(query["X-Amz-SignedHeaders"][0].split(";"))

    assert signed_upload["storageKey"] in unquote(parsed_url.path)
    assert parsed_url.path.startswith("/portfolio-media/")
    assert {"content-length", "content-type", "host"}.issubset(signed_headers)


def test_create_signed_put_upload_uses_presign_endpoint_for_browser_put_url() -> None:
    storage._get_cached_s3_client.cache_clear()

    signed_upload = storage.create_signed_put_upload(
        {"file_name": "Hero.JPG", "mime_type": "image/jpeg", "size_bytes": 1024},
        settings(s3_endpoint="http://minio:9000", s3_presign_endpoint="http://localhost:9000"),
    )

    parsed_url = urlparse(signed_upload["uploadUrl"])
    query = parse_qs(parsed_url.query)
    signed_headers = set(query["X-Amz-SignedHeaders"][0].split(";"))

    assert parsed_url.scheme == "http"
    assert parsed_url.netloc == "localhost:9000"
    assert signed_upload["storageKey"] in unquote(parsed_url.path)
    assert parsed_url.path.startswith("/portfolio-media/")
    assert {"content-length", "content-type", "host"}.issubset(signed_headers)


def test_backend_media_object_operations_use_internal_s3_endpoint_when_presign_endpoint_is_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    endpoints: List[str] = []

    def fake_boto3_client(*args: Any, **kwargs: Any) -> FakeS3Client:
        endpoints.append(kwargs["endpoint_url"])
        return FakeS3Client()

    storage._get_cached_s3_client.cache_clear()
    monkeypatch.setattr(storage.boto3, "client", fake_boto3_client)
    configured_settings = settings(s3_endpoint="http://minio:9000", s3_presign_endpoint="http://localhost:9000")
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg"

    storage.put_media_object({"body": b"data", "content_type": "image/jpeg", "storage_key": key}, configured_settings)
    storage.head_media_object(key, configured_settings)
    storage.get_media_object({"storage_key": key}, configured_settings)
    storage.delete_media_objects([key], configured_settings)

    assert endpoints == ["http://minio:9000"]


def test_put_head_and_verify_uploaded_media_object(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_client = FakeS3Client()
    monkeypatch.setattr(storage, "get_s3_client", lambda settings: fake_client)
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg"

    storage.put_media_object({"body": b"data", "content_type": "image/jpeg", "storage_key": key}, settings())
    head = storage.head_media_object(key, settings())
    storage.verify_uploaded_media_object({"mime_type": "image/jpeg", "size_bytes": 1024, "storage_key": key}, settings())

    assert head == {"ContentType": "image/jpeg", "ContentLength": 1024}
    assert fake_client.put_calls[0] == {
        "Bucket": "portfolio-media",
        "Key": key,
        "Body": b"data",
        "ContentType": "image/jpeg",
        "ContentLength": 4,
        "CacheControl": "public, max-age=31536000, immutable",
    }
    assert fake_client.head_calls == [{"Bucket": "portfolio-media", "Key": key}, {"Bucket": "portfolio-media", "Key": key}]


def test_put_media_object_accepts_file_like_body_with_explicit_content_length(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_client = FakeS3Client()
    monkeypatch.setattr(storage, "get_s3_client", lambda settings: fake_client)
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4"
    body = BytesIO(b"video-data")

    storage.put_media_object(
        {"body": body, "content_type": "video/mp4", "content_length": 10, "storage_key": key},
        settings(),
    )

    assert fake_client.put_calls[0] == {
        "Bucket": "portfolio-media",
        "Key": key,
        "Body": body,
        "ContentType": "video/mp4",
        "ContentLength": 10,
        "CacheControl": "public, max-age=31536000, immutable",
    }


def test_verify_uploaded_media_object_rejects_metadata_mismatch(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_client = FakeS3Client()
    fake_client.head_response = {"ContentType": "image/png", "ContentLength": 1024}
    monkeypatch.setattr(storage, "get_s3_client", lambda settings: fake_client)

    with pytest.raises(ValueError, match="Uploaded object content type does not match metadata"):
        storage.verify_uploaded_media_object(
            {
                "mime_type": "image/jpeg",
                "size_bytes": 1024,
                "storage_key": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.jpg",
            },
            settings(),
        )


def test_delete_media_objects_deduplicates_and_batches(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_client = FakeS3Client()
    monkeypatch.setattr(storage, "get_s3_client", lambda settings: fake_client)
    keys = [
        f"uploads/2026/07/123e4567-e89b-12d3-a456-{i:012x}-hero.jpg"
        for i in range(1001)
    ]

    storage.delete_media_objects(keys + [keys[0]], settings())

    assert len(fake_client.delete_calls) == 2
    assert len(fake_client.delete_calls[0]["Delete"]["Objects"]) == 1000
    assert len(fake_client.delete_calls[1]["Delete"]["Objects"]) == 1
    assert fake_client.delete_calls[0]["Delete"]["Quiet"] is True


def test_get_media_object_passes_range(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_client = FakeS3Client()
    monkeypatch.setattr(storage, "get_s3_client", lambda settings: fake_client)
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-video.mp4"

    media_object = storage.get_media_object({"storage_key": key, "range": "bytes=0-12"}, settings())

    assert media_object == fake_client.get_response
    assert fake_client.get_calls == [{"Bucket": "portfolio-media", "Key": key, "Range": "bytes=0-12"}]


def test_get_media_object_maps_invalid_range(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_client = FakeS3Client()
    key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-video.mp4"

    def raise_invalid_range(**kwargs: Any) -> Dict[str, Any]:
        raise ClientError(
            {"Error": {"Code": "InvalidRange", "Message": "The requested range is not satisfiable"}},
            "GetObject",
        )

    fake_client.get_object = raise_invalid_range
    monkeypatch.setattr(storage, "get_s3_client", lambda settings: fake_client)

    with pytest.raises(storage.MediaRangeNotSatisfiable, match="Range header is not satisfiable"):
        storage.get_media_object({"storage_key": key, "range": "bytes=1000-2000"}, settings())
