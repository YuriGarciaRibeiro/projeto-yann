from collections.abc import Generator
from typing import List, Mapping, Optional, Tuple

import pytest
from fastapi.testclient import TestClient

import app.admin_media as admin_media
from app.admins import AdminUser
from app.admin_media import PostgresAdminMediaRepository, map_media_asset_row
from app.dependencies import get_current_admin
from app.main import create_app


DEFAULT_STORAGE_KEY = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-asset.jpg"


class FakeCursor:
    def __init__(
        self,
        one_rows: Optional[List[Optional[dict[str, object]]]] = None,
        all_rows: Optional[List[List[dict[str, object]]]] = None,
        execute_errors: Optional[List[BaseException]] = None,
    ) -> None:
        self.one_rows = one_rows or []
        self.all_rows = all_rows or []
        self.execute_errors = execute_errors or []
        self.queries: List[str] = []
        self.params: List[Tuple[object, ...]] = []

    def __enter__(self) -> "FakeCursor":
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> None:
        return None

    def execute(self, query: str, params: Tuple[object, ...] = ()) -> None:
        self.queries.append(query)
        self.params.append(params)
        if self.execute_errors:
            raise self.execute_errors.pop(0)

    def fetchone(self) -> Optional[dict[str, object]]:
        return self.one_rows.pop(0)

    def fetchall(self) -> List[dict[str, object]]:
        return self.all_rows.pop(0)


class FakeConnection:
    def __init__(
        self,
        one_rows: Optional[List[Optional[dict[str, object]]]] = None,
        all_rows: Optional[List[List[dict[str, object]]]] = None,
        execute_errors: Optional[List[BaseException]] = None,
    ) -> None:
        self.cursor_instance = FakeCursor(one_rows, all_rows, execute_errors)
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


def media_row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "id": "asset-id",
        "storage_key": DEFAULT_STORAGE_KEY,
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


def media_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "storageKey": DEFAULT_STORAGE_KEY,
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
    }
    payload.update(overrides)
    return payload


class FakeAdminMediaRepository:
    def __init__(self) -> None:
        self.site_assets = [map_media_asset_row(media_row(usage_scope="site", project_id=None))]
        self.project_assets = [map_media_asset_row(media_row())]
        self.created_asset = map_media_asset_row(media_row(id="created-asset-id"))
        self.calls: List[Tuple[str, Tuple[object, ...]]] = []

    def list_site_media_assets(self) -> List[dict[str, object]]:
        self.calls.append(("list_site_media_assets", ()))
        return self.site_assets

    def list_project_media_assets(self, project_id: str) -> List[dict[str, object]]:
        self.calls.append(("list_project_media_assets", (project_id,)))
        return self.project_assets

    def create_media_asset(self, input_data: Mapping[str, object]) -> dict[str, object]:
        self.calls.append(("create_media_asset", (dict(input_data),)))
        return {**self.created_asset, **dict(input_data)}

    def create_media_assets(self, inputs: List[Mapping[str, object]]) -> List[dict[str, object]]:
        created_assets = [{**self.created_asset, **dict(input_data)} for input_data in inputs]
        self.calls.append(("create_media_assets", (tuple(dict(input_data) for input_data in inputs),)))
        return created_assets

    def delete_media_asset(self, asset_id: str) -> dict[str, object]:
        self.calls.append(("delete_media_asset", (asset_id,)))
        return map_media_asset_row(media_row(id=asset_id))


@pytest.fixture
def admin_user() -> AdminUser:
    return AdminUser(id="admin-id", email="admin@example.com", password_hash="hash")


@pytest.fixture
def route_repository() -> FakeAdminMediaRepository:
    return FakeAdminMediaRepository()


@pytest.fixture
def client(route_repository: FakeAdminMediaRepository, admin_user: AdminUser) -> Generator[TestClient, None, None]:
    app = create_app()
    app.dependency_overrides[get_current_admin] = lambda: admin_user
    app.dependency_overrides[admin_media.get_admin_media_repository] = lambda: route_repository
    with TestClient(app) as test_client:
        yield test_client


def test_map_media_asset_row_returns_camel_case_keys() -> None:
    asset = map_media_asset_row(media_row())

    assert asset == {
        "id": "asset-id",
        "storageKey": DEFAULT_STORAGE_KEY,
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
    }
    assert "storage_key" not in asset


def test_list_site_media_assets_filters_site_scope_and_orders_by_created_at_desc() -> None:
    connection = FakeConnection(all_rows=[[media_row(usage_scope="site", project_id=None)]])

    assets = PostgresAdminMediaRepository(connection).list_site_media_assets()

    assert assets[0]["usageScope"] == "site"
    assert assets[0]["projectId"] is None
    assert "from media_assets" in connection.cursor_instance.queries[0]
    assert "where usage_scope = %s" in connection.cursor_instance.queries[0]
    assert "order by created_at desc" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("site",)


def test_list_project_media_assets_filters_project_scope_and_project_id() -> None:
    connection = FakeConnection(all_rows=[[media_row()]])

    assets = PostgresAdminMediaRepository(connection).list_project_media_assets("project-id")

    assert assets[0]["projectId"] == "project-id"
    assert "where usage_scope = %s and project_id = %s" in connection.cursor_instance.queries[0]
    assert "order by created_at desc" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("project", "project-id")


def test_create_media_asset_uses_parameterized_sql_and_clears_site_project_id() -> None:
    connection = FakeConnection(one_rows=[media_row(usage_scope="site", project_id=None)])


    asset = PostgresAdminMediaRepository(connection).create_media_asset(
        media_payload(usageScope="site", projectId="ignored-project-id")
    )

    assert asset["usageScope"] == "site"
    assert "insert into media_assets" in connection.cursor_instance.queries[0]
    assert "%s" in connection.cursor_instance.queries[0]
    assert DEFAULT_STORAGE_KEY in connection.cursor_instance.params[0]
    assert None in connection.cursor_instance.params[0]
    assert "ignored-project-id" not in connection.cursor_instance.params[0]
    assert connection.commits == 0
    assert connection.closes == 0


def test_create_media_asset_ignores_input_url_and_stores_derived_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    storage_key = "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-asset.jpg"
    derived_url = f"/media/{storage_key}"
    connection = FakeConnection(one_rows=[media_row(storage_key=storage_key, url=derived_url)])
    monkeypatch.setattr(admin_media.storage, "get_media_delivery_url", lambda key: f"/media/{key}")

    asset = PostgresAdminMediaRepository(connection).create_media_asset(
        media_payload(
            storageKey=storage_key,
            url=f"https://evil.example.com/{storage_key}",
            usageScope="site",
            projectId=None,
        )
    )

    assert asset["url"] == derived_url
    assert derived_url in connection.cursor_instance.params[0]
    assert f"https://evil.example.com/{storage_key}" not in connection.cursor_instance.params[0]


def test_create_media_assets_inserts_multiple_rows_in_one_transaction() -> None:
    connection = FakeConnection(
        one_rows=[
            {"id": "project-id"},
            media_row(id="asset-1", storage_key="scrub-key", video_variant="scrub"),
            media_row(id="asset-2", storage_key="standard-key", video_variant="standard"),
        ]
    )

    assets = PostgresAdminMediaRepository(connection).create_media_assets(
        [
            media_payload(
                storageKey="uploads/2026/07/123e4567-e89b-12d3-a456-426614174001-scrub.mp4",
                videoVariant="scrub",
            ),
            media_payload(
                storageKey="uploads/2026/07/123e4567-e89b-12d3-a456-426614174002-standard.mp4",
                videoVariant="standard",
            ),
        ]
    )

    assert [asset["id"] for asset in assets] == ["asset-1", "asset-2"]
    assert "from projects" in connection.cursor_instance.queries[0]
    assert "insert into media_assets" in connection.cursor_instance.queries[1]
    assert "insert into media_assets" in connection.cursor_instance.queries[2]


def test_create_media_assets_rolls_back_owned_connection_when_any_insert_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = FakeConnection(
        one_rows=[media_row(id="asset-1")],
        execute_errors=[RuntimeError("database failed")],
    )
    monkeypatch.setattr(admin_media.psycopg, "connect", lambda *args, **kwargs: connection)

    with pytest.raises(RuntimeError, match="database failed"):
        PostgresAdminMediaRepository().create_media_assets(
            [
                media_payload(
                    usageScope="site",
                    projectId=None,
                    storageKey="uploads/2026/07/123e4567-e89b-12d3-a456-426614174001-scrub.mp4",
                ),
                media_payload(
                    usageScope="site",
                    projectId=None,
                    storageKey="uploads/2026/07/123e4567-e89b-12d3-a456-426614174002-standard.mp4",
                ),
            ]
        )

    assert connection.commits == 0
    assert connection.rollbacks == 1
    assert connection.closes == 1


def test_create_project_media_asset_validates_project_exists_before_insert() -> None:
    connection = FakeConnection(one_rows=[{"id": "project-id"}, media_row()])

    asset = PostgresAdminMediaRepository(connection).create_media_asset(media_payload())

    assert asset["id"] == "asset-id"
    assert "from projects" in connection.cursor_instance.queries[0]
    assert connection.cursor_instance.params[0] == ("project-id",)
    assert "insert into media_assets" in connection.cursor_instance.queries[1]


def test_create_project_media_asset_rejects_missing_project() -> None:
    connection = FakeConnection(one_rows=[None])

    with pytest.raises(ValueError, match="Project not found"):
        PostgresAdminMediaRepository(connection).create_media_asset(media_payload())

    assert len(connection.cursor_instance.queries) == 1
    assert "from projects" in connection.cursor_instance.queries[0]


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("usageScope", "global", "usageScope must be site or project"),
        ("projectId", None, "projectId is required"),
        ("storageKey", " ", "storageKey is required"),
        ("mimeType", " ", "mimeType is required"),
        ("altText", " ", "altText is required"),
        ("sizeBytes", 0, "sizeBytes must be greater than 0"),
        ("videoVariant", "preview", "videoVariant must be standard or scrub"),
    ],
)
def test_create_media_asset_validates_scope_and_required_fields(
    field: str,
    value: object,
    message: str,
) -> None:
    input_data = media_payload(**{field: value})

    with pytest.raises(ValueError, match=message):
        PostgresAdminMediaRepository(FakeConnection()).create_media_asset(input_data)


def test_create_media_asset_commits_and_closes_owned_connection(monkeypatch: pytest.MonkeyPatch) -> None:
    connection = FakeConnection(one_rows=[media_row(usage_scope="site", project_id=None)])
    monkeypatch.setattr(admin_media.psycopg, "connect", lambda *args, **kwargs: connection)

    PostgresAdminMediaRepository().create_media_asset(media_payload(usageScope="site", projectId=None))

    assert connection.commits == 1
    assert connection.rollbacks == 0
    assert connection.closes == 1


def test_create_media_asset_rolls_back_and_closes_owned_connection_on_exception(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connection = FakeConnection(one_rows=[])
    monkeypatch.setattr(admin_media.psycopg, "connect", lambda *args, **kwargs: connection)

    with pytest.raises(IndexError):
        PostgresAdminMediaRepository().create_media_asset(media_payload(usageScope="site", projectId=None))

    assert connection.commits == 0
    assert connection.rollbacks == 1
    assert connection.closes == 1


def test_create_media_asset_raises_value_error_for_duplicate_storage_key() -> None:
    duplicate_error = admin_media.psycopg.errors.UniqueViolation(
        'duplicate key value violates unique constraint "media_assets_storage_key_unique"'
    )
    connection = FakeConnection(execute_errors=[duplicate_error])

    with pytest.raises(ValueError, match="media_assets_storage_key_unique"):
        PostgresAdminMediaRepository(connection).create_media_asset(
            media_payload(usageScope="site", projectId=None)
        )


def test_create_media_asset_reraises_other_database_errors() -> None:
    connection = FakeConnection(execute_errors=[RuntimeError("database failed")])

    with pytest.raises(RuntimeError, match="database failed"):
        PostgresAdminMediaRepository(connection).create_media_asset(
            media_payload(usageScope="site", projectId=None)
        )


def test_delete_media_asset_removes_unused_row_and_storage_object(monkeypatch: pytest.MonkeyPatch) -> None:
    deleted_storage_keys: List[List[str]] = []
    connection = FakeConnection(one_rows=[media_row(), None, media_row()])
    monkeypatch.setattr(admin_media.storage, "delete_media_objects", lambda keys: deleted_storage_keys.append(list(keys)))

    asset = PostgresAdminMediaRepository(connection).delete_media_asset("asset-id")

    assert asset["id"] == "asset-id"
    assert "from media_assets" in connection.cursor_instance.queries[0]
    assert "from projects" in connection.cursor_instance.queries[1]
    assert "from project_sections" in connection.cursor_instance.queries[1]
    assert "media_references" in connection.cursor_instance.queries[1]
    assert ") references" not in connection.cursor_instance.queries[1]
    assert "delete from media_assets" in connection.cursor_instance.queries[2]
    assert connection.cursor_instance.queries[2].count("not exists") == 6
    assert "hero_video_asset_id = %s" in connection.cursor_instance.queries[2]
    assert "fallback_image_asset_id = %s" in connection.cursor_instance.queries[2]
    assert "client_architect_image_asset_id = %s" in connection.cursor_instance.queries[2]
    assert "portrait_image_asset_id = %s" in connection.cursor_instance.queries[2]
    assert "primary_media_asset_id = %s" in connection.cursor_instance.queries[2]
    assert "poster_media_asset_id = %s" in connection.cursor_instance.queries[2]
    assert connection.cursor_instance.params[0] == ("asset-id",)
    assert connection.cursor_instance.params[1] == ("asset-id",) * 6
    assert connection.cursor_instance.params[2] == ("asset-id",) * 7
    assert deleted_storage_keys == [[DEFAULT_STORAGE_KEY]]


def test_delete_media_asset_raises_not_found_when_asset_is_missing() -> None:
    connection = FakeConnection(one_rows=[None])

    with pytest.raises(admin_media.MediaAssetNotFound, match="Media asset not found"):
        PostgresAdminMediaRepository(connection).delete_media_asset("missing-id")

    assert len(connection.cursor_instance.queries) == 1
    assert "delete from media_assets" not in " ".join(connection.cursor_instance.queries)


def test_delete_media_asset_blocks_when_asset_is_referenced() -> None:
    connection = FakeConnection(one_rows=[media_row(), {"source": "projects"}])

    with pytest.raises(admin_media.MediaAssetInUse, match="Arquivo em uso"):
        PostgresAdminMediaRepository(connection).delete_media_asset("asset-id")

    assert len(connection.cursor_instance.queries) == 2
    assert "delete from media_assets" not in " ".join(connection.cursor_instance.queries)


def test_delete_media_asset_blocks_when_reference_appears_before_delete(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    deleted_storage_keys: List[List[str]] = []
    connection = FakeConnection(one_rows=[media_row(), None, None])
    monkeypatch.setattr(admin_media.storage, "delete_media_objects", lambda keys: deleted_storage_keys.append(list(keys)))

    with pytest.raises(admin_media.MediaAssetInUse, match="Arquivo em uso"):
        PostgresAdminMediaRepository(connection).delete_media_asset("asset-id")

    assert "delete from media_assets" in connection.cursor_instance.queries[2]
    assert deleted_storage_keys == []


def test_delete_media_asset_commits_and_closes_owned_connection(monkeypatch: pytest.MonkeyPatch) -> None:
    connection = FakeConnection(one_rows=[media_row(), None, media_row()])
    monkeypatch.setattr(admin_media.psycopg, "connect", lambda *args, **kwargs: connection)
    monkeypatch.setattr(admin_media.storage, "delete_media_objects", lambda keys: None)

    PostgresAdminMediaRepository().delete_media_asset("asset-id")

    assert connection.commits == 1
    assert connection.rollbacks == 0
    assert connection.closes == 1


def test_admin_list_site_media_route_requires_auth(route_repository: FakeAdminMediaRepository) -> None:
    app = create_app()
    app.dependency_overrides[admin_media.get_admin_media_repository] = lambda: route_repository
    test_client = TestClient(app)

    response = test_client.get("/admin/media", params={"scope": "site"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_admin_list_project_media_route_requires_auth(route_repository: FakeAdminMediaRepository) -> None:
    app = create_app()
    app.dependency_overrides[admin_media.get_admin_media_repository] = lambda: route_repository
    test_client = TestClient(app)

    response = test_client.get("/admin/projects/project-id/media")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}
    assert route_repository.calls == []


def test_admin_list_site_media_route(client: TestClient, route_repository: FakeAdminMediaRepository) -> None:
    response = client.get("/admin/media", params={"scope": "site"})

    assert response.status_code == 200
    assert response.json()[0]["usageScope"] == "site"
    assert route_repository.calls == [("list_site_media_assets", ())]


def test_admin_list_site_media_route_rejects_unsupported_scope(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
) -> None:
    response = client.get("/admin/media", params={"scope": "project"})

    assert response.status_code == 400
    assert response.json() == {"detail": "Unsupported media scope."}
    assert route_repository.calls == []


def test_admin_list_project_media_route(client: TestClient, route_repository: FakeAdminMediaRepository) -> None:
    response = client.get("/admin/projects/project-id/media")

    assert response.status_code == 200
    assert response.json()[0]["projectId"] == "project-id"
    assert route_repository.calls == [("list_project_media_assets", ("project-id",))]


def test_admin_create_media_route(client: TestClient, route_repository: FakeAdminMediaRepository) -> None:
    payload = media_payload()

    response = client.post("/admin/media", json=payload)

    assert response.status_code == 200
    assert response.json()["id"] == "created-asset-id"
    assert response.json()["storageKey"] == DEFAULT_STORAGE_KEY
    assert route_repository.calls == [("create_media_asset", (payload,))]


@pytest.mark.parametrize("duration_seconds", [1.5, 1.0, True])
def test_admin_create_media_route_rejects_non_integer_duration_seconds(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    duration_seconds: object,
) -> None:
    response = client.post("/admin/media", json=media_payload(durationSeconds=duration_seconds))

    assert response.status_code == 422
    assert route_repository.calls == []


def test_admin_create_media_route_requires_auth(route_repository: FakeAdminMediaRepository) -> None:
    app = create_app()
    app.dependency_overrides[admin_media.get_admin_media_repository] = lambda: route_repository
    test_client = TestClient(app)

    response = test_client.post("/admin/media", json=media_payload())

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}
    assert route_repository.calls == []


def test_admin_create_media_route_returns_400_for_repository_error(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(input_data: Mapping[str, object]) -> dict[str, object]:
        raise ValueError("Project not found")

    monkeypatch.setattr(route_repository, "create_media_asset", raise_error)

    response = client.post("/admin/media", json=media_payload())

    assert response.status_code == 400
    assert response.json() == {"detail": "Project not found"}


def test_admin_delete_media_route_requires_auth(route_repository: FakeAdminMediaRepository) -> None:
    app = create_app()
    app.dependency_overrides[admin_media.get_admin_media_repository] = lambda: route_repository
    test_client = TestClient(app)

    response = test_client.delete("/admin/media/asset-id")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}
    assert route_repository.calls == []


def test_admin_delete_media_route(client: TestClient, route_repository: FakeAdminMediaRepository) -> None:
    response = client.delete("/admin/media/asset-id")

    assert response.status_code == 200
    assert response.json()["id"] == "asset-id"
    assert route_repository.calls == [("delete_media_asset", ("asset-id",))]


def test_admin_delete_media_route_returns_404_for_missing_asset(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(asset_id: str) -> dict[str, object]:
        raise admin_media.MediaAssetNotFound("Media asset not found")

    monkeypatch.setattr(route_repository, "delete_media_asset", raise_error)

    response = client.delete("/admin/media/missing-id")

    assert response.status_code == 404
    assert response.json() == {"detail": "Media asset not found"}


def test_admin_delete_media_route_returns_409_for_referenced_asset(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(asset_id: str) -> dict[str, object]:
        raise admin_media.MediaAssetInUse("Arquivo em uso. Remova-o do projeto antes de apagar.")

    monkeypatch.setattr(route_repository, "delete_media_asset", raise_error)

    response = client.delete("/admin/media/asset-id")

    assert response.status_code == 409
    assert response.json() == {"detail": "Arquivo em uso. Remova-o do projeto antes de apagar."}
