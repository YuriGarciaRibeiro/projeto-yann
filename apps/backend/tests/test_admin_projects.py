from collections.abc import Generator
from typing import Mapping, List, Optional, Tuple
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

import app.admin_projects as admin_projects
from app.admins import AdminUser
from app.admin_projects import (
    PostgresAdminProjectRepository,
    get_admin_project_repository,
    map_admin_project_section_row,
    map_project_row,
    normalize_http_url,
    normalize_instagram_value,
)
from app.dependencies import get_current_admin
from app.main import create_app


class FakeCursor:
    def __init__(
        self,
        one_rows: Optional[List[Optional[dict[str, object]]]] = None,
        all_rows: Optional[List[List[dict[str, object]]]] = None,
    ) -> None:
        self.one_rows = one_rows or []
        self.all_rows = all_rows or []
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
        self.cursor_instance = FakeCursor(one_rows, all_rows)
        self.commits = 0
        self.rollbacks = 0
        self.closes = 0

    def cursor(self) -> FakeCursor:
        return self.cursor_instance

    def commit(self) -> None:
        self.commits += 1

    def rollback(self) -> None:
        self.rollbacks += 1

    def close(self) -> None:
        self.closes += 1


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
        "client_architect_website": "https://example.com/",
        "client_architect_instagram": "https://instagram.com/architect",
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
        "type": "image_block",
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


def media_row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "id": "asset-id",
        "storage_key": "asset-key",
        "url": "https://cdn.example.com/asset.jpg",
        "mime_type": "image/jpeg",
        "size_bytes": 1024,
        "alt_text": "Alt text",
        "usage_scope": "project",
        "project_id": "project-id",
        "width": 1200,
        "height": 800,
        "duration_seconds": None,
        "video_variant": None,
        "created_at": "2026-01-05T00:00:00Z",
    }
    row.update(overrides)
    return row


def test_normalize_instagram_accepts_handle_and_rejects_invalid_value() -> None:
    assert normalize_instagram_value("@studio.name") == "https://instagram.com/studio.name"
    assert normalize_instagram_value("studio_name") == "https://instagram.com/studio_name"

    with pytest.raises(ValueError, match="Client architect Instagram"):
        normalize_instagram_value("bad handle!")


def test_normalize_http_url_lowercases_scheme_and_host_and_preserves_path_query() -> None:
    assert normalize_http_url("HTTP://Example.COM/about?ref=Hero", "Website") == "http://example.com/about?ref=Hero"
    assert normalize_http_url("HTTPS://Example.COM", "Website") == "https://example.com/"


@pytest.mark.parametrize("value", ["ftp://example.com", "not a url"])
def test_normalize_http_url_rejects_non_http_or_invalid_url(value: str) -> None:
    with pytest.raises(ValueError, match="Website"):
        normalize_http_url(value, "Website")


def test_map_project_row_returns_camel_case_keys() -> None:
    project = map_project_row(project_row())

    assert project["shortDescription"] == "Short project description"
    assert project["clientArchitectName"] == "Architect Name"
    assert project["clientArchitectImageAssetId"] == "client-image-id"
    assert project["isPublished"] is True
    assert project["heroVideoAssetId"] == "hero-video-id"
    assert project["fallbackImageAssetId"] == "fallback-image-id"
    assert project["createdAt"] == "2026-01-01T00:00:00Z"
    assert "short_description" not in project


def test_list_projects_orders_by_updated_at_desc() -> None:
    connection = FakeConnection(all_rows=[[project_row()]])

    projects = PostgresAdminProjectRepository(connection).list_projects()

    assert projects[0]["id"] == "project-id"
    assert "from projects" in connection.cursor_instance.queries[0]
    assert "order by updated_at desc" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ()


def test_list_projects_does_not_commit_owned_connection(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = FakeConnection(all_rows=[[]])
    monkeypatch.setattr(admin_projects.psycopg, "connect", lambda *args, **kwargs: connection)

    projects = PostgresAdminProjectRepository().list_projects()

    assert projects == []
    assert connection.commits == 0
    assert connection.rollbacks == 0
    assert connection.closes == 1


def test_create_project_uses_parameterized_sql_and_normalizes_urls() -> None:
    connection = FakeConnection(one_rows=[project_row()])
    input_data = {
        "id": "project-id",
        "slug": "project-slug",
        "title": "Project Title",
        "subtitle": "Project Subtitle",
        "category": "Residential",
        "location": "Sao Paulo",
        "year": 2026,
        "shortDescription": "Short project description",
        "clientArchitectName": "Architect Name",
        "clientArchitectEmail": "architect@example.com",
        "clientArchitectPhone": "+5511999999999",
        "clientArchitectWebsite": "https://example.com",
        "clientArchitectInstagram": "@architect",
        "clientArchitectImageAssetId": None,
        "isPublished": True,
        "heroVideoAssetId": None,
        "fallbackImageAssetId": None,
    }

    project = PostgresAdminProjectRepository(connection).create_project(input_data)

    assert project["id"] == "project-id"
    assert "insert into projects" in connection.cursor_instance.queries[0]
    assert "%s" in connection.cursor_instance.queries[0]
    assert "https://example.com/" in connection.cursor_instance.params[0]
    assert "https://instagram.com/architect" in connection.cursor_instance.params[0]
    assert "@architect" not in connection.cursor_instance.params[0]
    assert connection.commits == 0
    assert connection.closes == 0


@pytest.mark.parametrize("client_project_key", ["id", "projectId", "project_id"])
def test_create_project_ignores_client_project_id_for_asset_validation(client_project_key: str) -> None:
    connection = FakeConnection(
        one_rows=[
            media_row(
                id="hero-video-id",
                mime_type="video/mp4",
                project_id="client-project-id",
                video_variant="scrub",
            ),
            project_row(),
        ]
    )
    input_data = {
        client_project_key: "client-project-id",
        "slug": "project-slug",
        "title": "Project Title",
        "clientArchitectName": "Architect Name",
        "heroVideoAssetId": "hero-video-id",
    }

    with pytest.raises(ValueError, match="precisa pertencer a este projeto"):
        PostgresAdminProjectRepository(connection).create_project(input_data)

    assert len(connection.cursor_instance.queries) == 1


def test_create_project_commits_and_closes_owned_connection(monkeypatch: pytest.MonkeyPatch) -> None:
    connection = FakeConnection(one_rows=[project_row()])
    monkeypatch.setattr(admin_projects.psycopg, "connect", lambda *args, **kwargs: connection)

    PostgresAdminProjectRepository().create_project(
        {
            "slug": "project-slug",
            "title": "Project Title",
            "clientArchitectName": "Architect Name",
        }
    )

    assert connection.commits == 1
    assert connection.rollbacks == 0
    assert connection.closes == 1


def test_create_project_rolls_back_and_closes_owned_connection_on_exception(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = FakeConnection(one_rows=[])
    monkeypatch.setattr(admin_projects.psycopg, "connect", lambda *args, **kwargs: connection)

    with pytest.raises(IndexError):
        PostgresAdminProjectRepository().create_project(
            {
                "slug": "project-slug",
                "title": "Project Title",
                "clientArchitectName": "Architect Name",
            }
        )

    assert connection.commits == 0
    assert connection.rollbacks == 1
    assert connection.closes == 1


def test_update_project_uses_parameterized_sql_and_normalizes_urls() -> None:
    connection = FakeConnection(one_rows=[project_row()])
    input_data = {
        "clientArchitectName": "Architect Name",
        "clientArchitectWebsite": "https://example.com/about",
        "clientArchitectInstagram": "architect",
        "heroVideoAssetId": None,
        "fallbackImageAssetId": None,
        "clientArchitectImageAssetId": None,
    }

    project = PostgresAdminProjectRepository(connection).update_project("project-id", input_data)

    assert project is not None
    assert "update projects" in connection.cursor_instance.queries[0]
    assert "where id = %s" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0][-1] == "project-id"
    assert "https://example.com/about" in connection.cursor_instance.params[0]
    assert "https://instagram.com/architect" in connection.cursor_instance.params[0]


def test_update_project_raises_accented_message_for_wrong_hero_video_variant() -> None:
    connection = FakeConnection(
        one_rows=[media_row(mime_type="video/mp4", video_variant="standard"), project_row()]
    )

    with pytest.raises(ValueError, match="Vídeo de abertura.*versão otimizada"):
        PostgresAdminProjectRepository(connection).update_project(
            "project-id",
            {"heroVideoAssetId": "hero-video-id"},
        )


def test_delete_project_uses_parameterized_sql() -> None:
    connection = FakeConnection(one_rows=[project_row()])

    project = PostgresAdminProjectRepository(connection).delete_project("project-id")

    assert project is not None
    assert "delete from projects" in connection.cursor_instance.queries[0]
    assert "where id = %s" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("project-id",)


def test_get_project_by_id_does_not_commit_owned_connection(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = FakeConnection(one_rows=[project_row()])
    monkeypatch.setattr(admin_projects.psycopg, "connect", lambda *args, **kwargs: connection)

    project = PostgresAdminProjectRepository().get_project_by_id("project-id")

    assert project is not None
    assert connection.commits == 0
    assert connection.rollbacks == 0
    assert connection.closes == 1


def test_list_project_sections_returns_section_and_media_assets() -> None:
    connection = FakeConnection(
        all_rows=[
            [
                {
                    **section_row(),
                    **{"section_primary_media_" + key: value for key, value in media_row(id="primary-id").items()},
                    **{"section_poster_media_" + key: value for key, value in media_row(id="poster-id").items()},
                }
            ]
        ]
    )

    sections = PostgresAdminProjectRepository(connection).list_project_sections("project-id")

    assert sections == [
        {
            "section": map_admin_project_section_row(section_row()),
            "primaryMediaAsset": {
                "id": "primary-id",
                "storageKey": "asset-key",
                "url": "https://cdn.example.com/asset.jpg",
                "mimeType": "image/jpeg",
                "sizeBytes": 1024,
                "altText": "Alt text",
                "usageScope": "project",
                "projectId": "project-id",
                "width": 1200,
                "height": 800,
                "durationSeconds": None,
                "videoVariant": None,
                "createdAt": "2026-01-05T00:00:00Z",
            },
            "posterMediaAsset": {
                "id": "poster-id",
                "storageKey": "asset-key",
                "url": "https://cdn.example.com/asset.jpg",
                "mimeType": "image/jpeg",
                "sizeBytes": 1024,
                "altText": "Alt text",
                "usageScope": "project",
                "projectId": "project-id",
                "width": 1200,
                "height": 800,
                "durationSeconds": None,
                "videoVariant": None,
                "createdAt": "2026-01-05T00:00:00Z",
            },
        }
    ]
    assert "order by s.sort_order asc, s.created_at asc" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("project-id",)


def test_list_project_sections_does_not_commit_owned_connection(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = FakeConnection(all_rows=[[]])
    monkeypatch.setattr(admin_projects.psycopg, "connect", lambda *args, **kwargs: connection)

    sections = PostgresAdminProjectRepository().list_project_sections("project-id")

    assert sections == []
    assert connection.commits == 0
    assert connection.rollbacks == 0
    assert connection.closes == 1


def test_delete_project_section_uses_id_and_project_id_parameters() -> None:
    connection = FakeConnection(one_rows=[section_row()])

    section = PostgresAdminProjectRepository(connection).delete_project_section(
        "section-id",
        "project-id",
    )

    assert section is not None
    assert "delete from project_sections" in connection.cursor_instance.queries[0]
    assert "where id = %s and project_id = %s" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("section-id", "project-id")


def test_update_project_section_accepts_partial_body_without_type() -> None:
    existing_section = section_row(type="text_block", primary_media_asset_id=None, poster_media_asset_id=None)
    updated_section = section_row(
        type="text_block",
        title="Updated Section Title",
        primary_media_asset_id=None,
        poster_media_asset_id=None,
    )
    connection = FakeConnection(one_rows=[existing_section, updated_section])

    section = PostgresAdminProjectRepository(connection).update_project_section(
        "section-id",
        {"projectId": "project-id", "title": "Updated Section Title"},
    )

    assert section is not None
    assert section["title"] == "Updated Section Title"
    assert "select" in connection.cursor_instance.queries[0]
    assert "from project_sections" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("section-id",)
    assert "update project_sections" in connection.cursor_instance.queries[1]
    assert "where id = %s and project_id = %s" in connection.cursor_instance.queries[1]
    assert connection.cursor_instance.params[1] == ("Updated Section Title", "section-id", "project-id")


def test_update_project_section_returns_none_when_section_does_not_exist() -> None:
    connection = FakeConnection(one_rows=[None])

    section = PostgresAdminProjectRepository(connection).update_project_section(
        "missing-section",
        {"projectId": "project-id", "title": "Updated Section Title"},
    )

    assert section is None
    assert len(connection.cursor_instance.queries) == 1
    assert "from project_sections" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("missing-section",)


@pytest.mark.parametrize(
    ("method_name", "args"),
    [
        (
            "create_project_section",
            (
                "project-id",
                {
                    "type": "text_block",
                    "title": "Section Title",
                    "sortOrder": 1,
                },
            ),
        ),
        (
            "update_project_section",
            (
                "section-id",
                {
                    "projectId": "project-id",
                    "type": "text_block",
                    "title": "Updated Section Title",
                },
            ),
        ),
        ("delete_project_section", ("section-id", "project-id")),
    ],
)
def test_project_section_writes_commit_and_close_owned_connection(
    method_name: str,
    args: Tuple[object, ...],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    one_rows = [section_row()]
    if method_name == "update_project_section":
        one_rows = [
            section_row(type="text_block", primary_media_asset_id=None, poster_media_asset_id=None),
            section_row(type="text_block", primary_media_asset_id=None, poster_media_asset_id=None),
        ]
    connection = FakeConnection(one_rows=one_rows)
    monkeypatch.setattr(admin_projects.psycopg, "connect", lambda *args, **kwargs: connection)

    getattr(PostgresAdminProjectRepository(), method_name)(*args)

    assert connection.commits == 1
    assert connection.rollbacks == 0
    assert connection.closes == 1


@pytest.mark.parametrize(
    ("method_name", "args"),
    [
        (
            "create_project_section",
            (
                "project-id",
                {
                    "type": "text_block",
                    "title": "Section Title",
                    "sortOrder": 1,
                },
            ),
        ),
        (
            "update_project_section",
            (
                "section-id",
                {
                    "projectId": "project-id",
                    "type": "text_block",
                    "title": "Updated Section Title",
                },
            ),
        ),
        ("delete_project_section", ("section-id", "project-id")),
    ],
)
def test_project_section_writes_roll_back_and_close_owned_connection_on_exception(
    method_name: str,
    args: Tuple[object, ...],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = FakeConnection(one_rows=[])
    monkeypatch.setattr(admin_projects.psycopg, "connect", lambda *args, **kwargs: connection)

    with pytest.raises(IndexError):
        getattr(PostgresAdminProjectRepository(), method_name)(*args)

    assert connection.commits == 0
    assert connection.rollbacks == 1
    assert connection.closes == 1


def test_validate_scoped_asset_raises_for_wrong_project() -> None:
    connection = FakeConnection(one_rows=[media_row(project_id="other-project")])

    with pytest.raises(ValueError, match="precisa pertencer a este projeto"):
        PostgresAdminProjectRepository(connection).validate_scoped_asset(
            "asset-id",
            expected_mime_prefix="image/",
            label="Imagem alternativa",
            project_id="project-id",
            usage_scope="project",
        )


def test_validate_scoped_asset_accepts_uuid_project_id_row_for_string_project_input() -> None:
    project_id = UUID("11111111-1111-1111-1111-111111111111")
    connection = FakeConnection(one_rows=[media_row(project_id=project_id)])

    PostgresAdminProjectRepository(connection).validate_scoped_asset(
        "asset-id",
        expected_mime_prefix="image/",
        label="Imagem alternativa",
        project_id=str(project_id),
        usage_scope="project",
    )


def test_validate_scoped_asset_raises_for_wrong_video_variant() -> None:
    connection = FakeConnection(one_rows=[media_row(mime_type="video/mp4", video_variant="standard")])

    with pytest.raises(ValueError, match="versão otimizada"):
        PostgresAdminProjectRepository(connection).validate_scoped_asset(
            "asset-id",
            expected_mime_prefix="video/",
            label="Video de abertura",
            project_id="project-id",
            usage_scope="project",
            video_variant="scrub",
        )


class FakeAdminProjectRepository:
    def __init__(self) -> None:
        self.projects = [map_project_row(project_row())]
        self.project = map_project_row(project_row())
        self.section = map_admin_project_section_row(section_row())
        self.sections = [{"section": self.section, "primaryMediaAsset": None, "posterMediaAsset": None}]
        self.calls: List[Tuple[str, Tuple[object, ...]]] = []

    def list_projects(self) -> List[dict[str, object]]:
        self.calls.append(("list_projects", ()))
        return self.projects

    def get_project_by_id(self, project_id: str) -> Optional[dict[str, object]]:
        self.calls.append(("get_project_by_id", (project_id,)))
        return self.project

    def create_project(self, input_data: Mapping[str, object]) -> dict[str, object]:
        self.calls.append(("create_project", (dict(input_data),)))
        return {**self.project, **dict(input_data), "id": "created-project-id"}

    def update_project(self, project_id: str, input_data: Mapping[str, object]) -> Optional[dict[str, object]]:
        self.calls.append(("update_project", (project_id, dict(input_data))))
        return {**self.project, **dict(input_data), "id": project_id}

    def delete_project(self, project_id: str) -> Optional[dict[str, object]]:
        self.calls.append(("delete_project", (project_id,)))
        return {**self.project, "id": project_id}

    def list_project_sections(self, project_id: str) -> List[dict[str, object]]:
        self.calls.append(("list_project_sections", (project_id,)))
        return self.sections

    def create_project_section(self, project_id: str, input_data: Mapping[str, object]) -> dict[str, object]:
        self.calls.append(("create_project_section", (project_id, dict(input_data))))
        return {**self.section, **dict(input_data), "id": "created-section-id", "projectId": project_id}

    def update_project_section(self, section_id: str, input_data: Mapping[str, object]) -> Optional[dict[str, object]]:
        self.calls.append(("update_project_section", (section_id, dict(input_data))))
        return {**self.section, **dict(input_data), "id": section_id}

    def delete_project_section(self, section_id: str, project_id: str) -> Optional[dict[str, object]]:
        self.calls.append(("delete_project_section", (section_id, project_id)))
        return {**self.section, "id": section_id, "projectId": project_id}


@pytest.fixture
def admin_user() -> AdminUser:
    return AdminUser(id="admin-id", email="admin@example.com", password_hash="hash")


@pytest.fixture
def route_repository() -> FakeAdminProjectRepository:
    return FakeAdminProjectRepository()


@pytest.fixture
def client(route_repository: FakeAdminProjectRepository, admin_user: AdminUser) -> Generator[TestClient, None, None]:
    app = create_app()
    app.dependency_overrides[get_current_admin] = lambda: admin_user
    app.dependency_overrides[get_admin_project_repository] = lambda: route_repository
    with TestClient(app) as test_client:
        yield test_client


def project_payload() -> dict[str, object]:
    return {
        "slug": "created-project",
        "title": "Created Project",
        "subtitle": "Created Subtitle",
        "category": "Residential",
        "location": "Sao Paulo",
        "year": 2026,
        "shortDescription": "Short description",
        "clientArchitectName": "Architect Name",
        "clientArchitectEmail": "architect@example.com",
        "clientArchitectPhone": "+5511999999999",
        "clientArchitectWebsite": "https://example.com/",
        "clientArchitectInstagram": "https://instagram.com/architect",
        "clientArchitectImageAssetId": "client-image-id",
        "isPublished": True,
        "heroVideoAssetId": "hero-video-id",
        "fallbackImageAssetId": "fallback-image-id",
    }


def section_payload() -> dict[str, object]:
    return {
        "projectId": "project-id",
        "sortOrder": 2,
        "type": "text_block",
        "title": "Created Section",
        "body": "Section body",
        "primaryMediaAssetId": "primary-media-id",
        "posterMediaAssetId": "poster-media-id",
        "caption": "Section caption",
        "metadata": {"layout": "narrow"},
        "isEnabled": True,
    }


def test_admin_list_projects_route_requires_auth(route_repository: FakeAdminProjectRepository) -> None:
    app = create_app()
    app.dependency_overrides[get_admin_project_repository] = lambda: route_repository
    test_client = TestClient(app)

    response = test_client.get("/admin/projects")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_admin_list_projects_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    response = client.get("/admin/projects")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "project-id"
    assert route_repository.calls == [("list_projects", ())]


def test_admin_get_project_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    response = client.get("/admin/projects/project-id")

    assert response.status_code == 200
    assert response.json()["id"] == "project-id"
    assert route_repository.calls == [("get_project_by_id", ("project-id",))]


def test_admin_get_project_route_returns_404(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    route_repository.project = None  # type: ignore[assignment]

    response = client.get("/admin/projects/missing-project")

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}


def test_admin_create_project_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    payload = project_payload()

    response = client.post("/admin/projects", json=payload)

    assert response.status_code == 200
    assert response.json()["id"] == "created-project-id"
    assert route_repository.calls == [("create_project", (payload,))]


def test_admin_create_project_route_returns_400_for_repository_error(
    client: TestClient,
    route_repository: FakeAdminProjectRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(input_data: Mapping[str, object]) -> dict[str, object]:
        raise ValueError("Client architect name is required.")

    monkeypatch.setattr(route_repository, "create_project", raise_error)

    response = client.post("/admin/projects", json=project_payload())

    assert response.status_code == 400
    assert response.json() == {"detail": "Client architect name is required."}


def test_admin_create_project_route_returns_400_for_duplicate_slug(
    client: TestClient,
    route_repository: FakeAdminProjectRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(input_data: Mapping[str, object]) -> dict[str, object]:
        raise admin_projects.psycopg.errors.UniqueViolation(
            'duplicate key value violates unique constraint "projects_slug_unique"'
        )

    monkeypatch.setattr(route_repository, "create_project", raise_error)

    response = client.post("/admin/projects", json=project_payload())

    assert response.status_code == 400
    assert response.json() == {"detail": "projects_slug_unique"}


def test_admin_update_project_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    payload = {"title": "Updated Project", "clientArchitectName": "Architect Name"}

    response = client.patch("/admin/projects/project-id", json=payload)

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Project"
    assert route_repository.calls == [("update_project", ("project-id", payload))]


def test_admin_update_project_route_returns_400_for_duplicate_slug(
    client: TestClient,
    route_repository: FakeAdminProjectRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(project_id: str, input_data: Mapping[str, object]) -> dict[str, object]:
        raise admin_projects.psycopg.errors.UniqueViolation(
            'duplicate key value violates unique constraint "projects_slug_unique"'
        )

    monkeypatch.setattr(route_repository, "update_project", raise_error)

    response = client.patch("/admin/projects/project-id", json={"slug": "duplicate-slug"})

    assert response.status_code == 400
    assert response.json() == {"detail": "projects_slug_unique"}


def test_admin_update_project_route_returns_404(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    route_repository.update_project = lambda project_id, input_data: None  # type: ignore[assignment]

    response = client.patch("/admin/projects/missing-project", json={"title": "Missing"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}


def test_admin_delete_project_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    response = client.delete("/admin/projects/project-id")

    assert response.status_code == 200
    assert response.json()["id"] == "project-id"
    assert route_repository.calls == [("delete_project", ("project-id",))]


def test_admin_delete_project_route_returns_404(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    route_repository.delete_project = lambda project_id: None  # type: ignore[assignment]

    response = client.delete("/admin/projects/missing-project")

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}


def test_admin_list_sections_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    response = client.get("/admin/projects/project-id/sections")

    assert response.status_code == 200
    assert response.json()[0]["section"]["id"] == "section-id"
    assert route_repository.calls == [("list_project_sections", ("project-id",))]


def test_admin_create_section_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    payload = section_payload()

    response = client.post("/admin/projects/project-id/sections", json=payload)

    assert response.status_code == 200
    assert response.json()["id"] == "created-section-id"
    assert route_repository.calls == [("create_project_section", ("project-id", payload))]


def test_admin_update_section_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    payload = section_payload()

    response = client.patch("/admin/project-sections/section-id", json=payload)

    assert response.status_code == 200
    assert response.json()["id"] == "section-id"
    assert route_repository.calls == [("update_project_section", ("section-id", payload))]


def test_admin_update_section_route_returns_404(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    route_repository.update_project_section = lambda section_id, input_data: None  # type: ignore[assignment]

    response = client.patch("/admin/project-sections/missing-section", json=section_payload())
    assert response.status_code == 404
    assert response.json() == {"detail": "Project section not found."}


def test_admin_delete_section_route(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    response = client.delete("/admin/project-sections/section-id", params={"projectId": "project-id"})

    assert response.status_code == 200
    assert response.json()["id"] == "section-id"
    assert route_repository.calls == [("delete_project_section", ("section-id", "project-id"))]


def test_admin_delete_section_route_returns_404(client: TestClient, route_repository: FakeAdminProjectRepository) -> None:
    route_repository.delete_project_section = lambda section_id, project_id: None  # type: ignore[assignment]

    response = client.delete("/admin/project-sections/missing-section", params={"projectId": "project-id"})
    assert response.status_code == 404
    assert response.json() == {"detail": "Project section not found."}
