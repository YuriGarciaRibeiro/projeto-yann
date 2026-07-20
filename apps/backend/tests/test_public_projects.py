from typing import List, Optional, Tuple

from fastapi.testclient import TestClient

from app.main import create_app
from app.public_projects import (
    PostgresPublicProjectRepository,
    get_public_project_repository,
    map_media_asset,
    map_project_payload,
)


class FakePublicProjectRepository:
    def __init__(
        self,
        featured_project: Optional[dict[str, object]] = None,
        published_projects: Optional[List[dict[str, object]]] = None,
        project_by_slug: Optional[dict[str, object]] = None,
    ) -> None:
        self.featured_project = featured_project
        self.published_projects = published_projects or []
        self.project_by_slug = project_by_slug

    def get_featured_project(self) -> Optional[dict[str, object]]:
        return self.featured_project

    def get_published_projects(self) -> List[dict[str, object]]:
        return self.published_projects

    def get_project_by_slug(self, slug: str) -> Optional[dict[str, object]]:
        return self.project_by_slug


def client_with_repository(repository: FakePublicProjectRepository) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_public_project_repository] = lambda: repository
    return TestClient(app)


class FakeCursor:
    def __init__(self, one_rows: List[Optional[dict[str, object]]], all_rows: List[List[dict[str, object]]]) -> None:
        self.one_rows = one_rows
        self.all_rows = all_rows
        self.queries: List[str] = []
        self.params: List[Tuple[object, ...]] = []

    def __enter__(self) -> "FakeCursor":
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> None:
        return None

    def execute(self, query: str, params: Tuple[object, ...] = ()) -> None:
        self.queries.append(query)
        self.params.append(params)

    def fetchone(self) -> Optional[dict[str, object]]:
        return self.one_rows.pop(0)

    def fetchall(self) -> List[dict[str, object]]:
        return self.all_rows.pop(0)


class FakeConnection:
    def __init__(
        self,
        one_rows: Optional[List[Optional[dict[str, object]]]] = None,
        all_rows: Optional[List[List[dict[str, object]]]] = None,
    ) -> None:
        self.cursor_instance = FakeCursor(one_rows or [], all_rows or [])

    def cursor(self) -> FakeCursor:
        return self.cursor_instance


def project_row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "id": "project-id",
        "slug": "project-slug",
        "title": "Project Title",
        "subtitle": "Project Subtitle",
        "category": "Residential",
        "location": "Sao Paulo",
        "year": 2026,
        "short_description": "Short project description",
        "client_architect_name": "Architect Name",
        "client_architect_email": "architect@example.com",
        "client_architect_phone": "+5511999999999",
        "client_architect_website": "https://example.com",
        "client_architect_instagram": "@architect",
        "client_architect_image_asset_id": "client-image-id",
        "is_published": True,
        "hero_video_asset_id": "hero-video-id",
        "fallback_image_asset_id": "fallback-image-id",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-02T00:00:00Z",
    }
    row.update(overrides)
    return row


def section_row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "id": "section-id",
        "project_id": "project-id",
        "sort_order": 1,
        "type": "text_media",
        "title": "Section Title",
        "body": "Section body",
        "primary_media_asset_id": "primary-media-id",
        "poster_media_asset_id": "poster-media-id",
        "caption": "Section caption",
        "metadata": {"layout": "wide"},
        "is_enabled": True,
        "created_at": "2026-01-03T00:00:00Z",
        "updated_at": "2026-01-04T00:00:00Z",
    }
    row.update(overrides)
    return row


def media_row(prefix: str = "") -> dict[str, object]:
    return {
        f"{prefix}id": f"{prefix}asset-id",
        f"{prefix}storage_key": f"{prefix}storage-key",
        f"{prefix}url": f"https://cdn.example.com/{prefix}asset.mp4",
        f"{prefix}mime_type": "video/mp4",
        f"{prefix}size_bytes": 1024,
        f"{prefix}alt_text": "Asset alt text",
        f"{prefix}usage_scope": "project",
        f"{prefix}project_id": "project-id",
        f"{prefix}width": 1920,
        f"{prefix}height": 1080,
        f"{prefix}duration_seconds": 12,
        f"{prefix}video_variant": "desktop",
        f"{prefix}created_at": "2026-01-05T00:00:00Z",
    }


def test_featured_route_returns_project_summary_or_null() -> None:
    project = {"id": "project-id", "slug": "project-slug"}
    client = client_with_repository(FakePublicProjectRepository(featured_project=project))

    response = client.get("/projects/featured")

    assert response.status_code == 200
    assert response.json() == project

    client = client_with_repository(FakePublicProjectRepository(featured_project=None))

    response = client.get("/projects/featured")

    assert response.status_code == 200
    assert response.json() is None


def test_published_route_returns_project_list() -> None:
    projects = [{"id": "project-id", "slug": "project-slug", "title": "Project Title"}]
    client = client_with_repository(FakePublicProjectRepository(published_projects=projects))

    response = client.get("/projects/published")

    assert response.status_code == 200
    assert response.json() == projects


def test_project_by_slug_route_returns_payload() -> None:
    payload = {"project": {"id": "project-id", "slug": "project-slug"}, "sections": []}
    client = client_with_repository(FakePublicProjectRepository(project_by_slug=payload))

    response = client.get("/projects/project-slug")

    assert response.status_code == 200
    assert response.json() == payload


def test_project_by_slug_route_returns_404_for_missing_project() -> None:
    client = client_with_repository(FakePublicProjectRepository(project_by_slug=None))

    response = client.get("/projects/missing-slug")

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}


def test_map_media_asset_converts_snake_case_row_to_camel_case_dict() -> None:
    media = map_media_asset(media_row())

    assert media == {
        "id": "asset-id",
        "storageKey": "storage-key",
        "url": "https://cdn.example.com/asset.mp4",
        "mimeType": "video/mp4",
        "sizeBytes": 1024,
        "altText": "Asset alt text",
        "usageScope": "project",
        "projectId": "project-id",
        "width": 1920,
        "height": 1080,
        "durationSeconds": 12,
        "videoVariant": "desktop",
        "createdAt": "2026-01-05T00:00:00Z",
    }


def test_map_media_asset_returns_none_without_row() -> None:
    assert map_media_asset(None) is None


def test_map_project_payload_includes_project_assets_and_sections() -> None:
    row = project_row(
        **media_row("hero_video_"),
        **media_row("fallback_image_"),
        **media_row("client_architect_image_"),
    )
    section = section_row(
        **media_row("section_primary_media_"),
        **media_row("section_poster_media_"),
    )

    payload = map_project_payload(row, [section])

    assert payload["project"]["shortDescription"] == "Short project description"
    assert payload["heroVideoAsset"]["id"] == "hero_video_asset-id"
    assert payload["fallbackImageAsset"]["id"] == "fallback_image_asset-id"
    assert payload["clientArchitectImageAsset"]["id"] == "client_architect_image_asset-id"
    assert payload["sections"] == [
        {
            "section": {
                "id": "section-id",
                "projectId": "project-id",
                "sortOrder": 1,
                "type": "text_media",
                "title": "Section Title",
                "body": "Section body",
                "primaryMediaAssetId": "primary-media-id",
                "posterMediaAssetId": "poster-media-id",
                "caption": "Section caption",
                "metadata": {"layout": "wide"},
                "isEnabled": True,
                "createdAt": "2026-01-03T00:00:00Z",
                "updatedAt": "2026-01-04T00:00:00Z",
            },
            "primaryMediaAsset": {
                "id": "section_primary_media_asset-id",
                "storageKey": "section_primary_media_storage-key",
                "url": "https://cdn.example.com/section_primary_media_asset.mp4",
                "mimeType": "video/mp4",
                "sizeBytes": 1024,
                "altText": "Asset alt text",
                "usageScope": "project",
                "projectId": "project-id",
                "width": 1920,
                "height": 1080,
                "durationSeconds": 12,
                "videoVariant": "desktop",
                "createdAt": "2026-01-05T00:00:00Z",
            },
            "posterMediaAsset": {
                "id": "section_poster_media_asset-id",
                "storageKey": "section_poster_media_storage-key",
                "url": "https://cdn.example.com/section_poster_media_asset.mp4",
                "mimeType": "video/mp4",
                "sizeBytes": 1024,
                "altText": "Asset alt text",
                "usageScope": "project",
                "projectId": "project-id",
                "width": 1920,
                "height": 1080,
                "durationSeconds": 12,
                "videoVariant": "desktop",
                "createdAt": "2026-01-05T00:00:00Z",
            },
        }
    ]


def test_get_featured_project_uses_published_filter_and_returns_id_slug() -> None:
    connection = FakeConnection([{"id": "project-id", "slug": "project-slug"}])

    project = PostgresPublicProjectRepository(connection).get_featured_project()

    assert project == {"id": "project-id", "slug": "project-slug"}
    assert "is_published = true" in connection.cursor_instance.queries[0]
    assert "order by updated_at desc" in connection.cursor_instance.queries[0]
    assert "limit 1" in connection.cursor_instance.queries[0]


def test_get_project_by_slug_returns_none_when_project_row_missing_and_passes_slug() -> None:
    connection = FakeConnection([None])

    project = PostgresPublicProjectRepository(connection).get_project_by_slug("missing-slug")

    assert project is None
    assert "slug = %s" in connection.cursor_instance.queries[0]
    assert "is_published = true" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("missing-slug",)


def test_get_project_by_slug_filters_hero_video_to_scrub_variant() -> None:
    connection = FakeConnection([None])

    PostgresPublicProjectRepository(connection).get_project_by_slug("missing-slug")

    assert "hero_video.video_variant = 'scrub'" in connection.cursor_instance.queries[0]
