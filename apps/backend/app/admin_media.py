from contextlib import contextmanager
from typing import Annotated, Iterator, List, Mapping, Optional, Protocol, Tuple

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, StrictInt
from psycopg.rows import dict_row

from app.admins import AdminUser
import app.storage as storage
from app.config import get_settings
from app.dependencies import get_current_admin


admin_media_router = APIRouter(prefix="/admin", tags=["admin-media"])


class MediaAssetNotFound(ValueError):
    pass


class MediaAssetInUse(ValueError):
    pass


class MediaAssetCreateRequest(BaseModel):
    storageKey: Optional[str] = None
    url: Optional[str] = None
    mimeType: Optional[str] = None
    sizeBytes: Optional[int] = None
    altText: Optional[str] = None
    usageScope: Optional[str] = None
    projectId: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    durationSeconds: Optional[StrictInt] = None
    videoVariant: Optional[str] = None


class AdminMediaRepository(Protocol):
    def list_site_media_assets(self) -> List[dict[str, object]]:
        ...

    def list_project_media_assets(self, project_id: str) -> List[dict[str, object]]:
        ...

    def create_media_asset(self, input_data: Mapping[str, object]) -> dict[str, object]:
        ...

    def create_media_assets(self, inputs: List[Mapping[str, object]]) -> List[dict[str, object]]:
        ...

    def delete_media_asset(self, asset_id: str) -> dict[str, object]:
        ...


MEDIA_COLUMNS = """
    id,
    storage_key,
    url,
    mime_type,
    size_bytes,
    alt_text,
    usage_scope,
    project_id,
    width,
    height,
    duration_seconds,
    video_variant,
    created_at
"""

MEDIA_INPUT_COLUMNS = {
    "storageKey": "storage_key",
    "url": "url",
    "mimeType": "mime_type",
    "sizeBytes": "size_bytes",
    "altText": "alt_text",
    "usageScope": "usage_scope",
    "projectId": "project_id",
    "width": "width",
    "height": "height",
    "durationSeconds": "duration_seconds",
    "videoVariant": "video_variant",
}

MEDIA_USAGE_SCOPES = {"site", "project"}
VIDEO_VARIANTS = {"standard", "scrub"}


def _input_value(input_data: Mapping[str, object], camel_key: str) -> object:
    snake_key = MEDIA_INPUT_COLUMNS[camel_key]
    if camel_key in input_data:
        return input_data[camel_key]
    if snake_key in input_data:
        return input_data[snake_key]
    return None


def _required_text(input_data: Mapping[str, object], camel_key: str) -> str:
    value = _input_value(input_data, camel_key)
    trimmed_value = str(value).strip() if value is not None else ""
    if not trimmed_value:
        raise ValueError(f"{camel_key} is required")
    return trimmed_value


def _optional_text(input_data: Mapping[str, object], camel_key: str) -> Optional[str]:
    value = _input_value(input_data, camel_key)
    trimmed_value = str(value).strip() if value is not None else ""
    return trimmed_value or None


def _optional_value(input_data: Mapping[str, object], camel_key: str) -> object:
    return _input_value(input_data, camel_key)


def _validate_size_bytes(value: object) -> object:
    if not isinstance(value, (int, float)) or isinstance(value, bool) or value <= 0:
        raise ValueError("sizeBytes must be greater than 0")
    return value


def _media_values(input_data: Mapping[str, object]) -> dict[str, object]:
    usage_scope = _required_text(input_data, "usageScope")
    if usage_scope not in MEDIA_USAGE_SCOPES:
        raise ValueError("usageScope must be site or project")

    project_id = _optional_text(input_data, "projectId")
    if usage_scope == "project" and not project_id:
        raise ValueError("projectId is required")
    if usage_scope == "site":
        project_id = None

    video_variant = _optional_text(input_data, "videoVariant")
    if video_variant is not None and video_variant not in VIDEO_VARIANTS:
        raise ValueError("videoVariant must be standard or scrub")

    storage_key = _required_text(input_data, "storageKey")

    return {
        "storage_key": storage_key,
        "url": storage.get_media_delivery_url(storage_key),
        "mime_type": _required_text(input_data, "mimeType"),
        "size_bytes": _validate_size_bytes(_input_value(input_data, "sizeBytes")),
        "alt_text": _required_text(input_data, "altText"),
        "usage_scope": usage_scope,
        "project_id": project_id,
        "width": _optional_value(input_data, "width"),
        "height": _optional_value(input_data, "height"),
        "duration_seconds": _optional_value(input_data, "durationSeconds"),
        "video_variant": video_variant,
    }


def map_media_asset_row(row: Optional[Mapping[str, object]]) -> Optional[dict[str, object]]:
    if row is None:
        return None

    return {
        "id": row["id"],
        "storageKey": row["storage_key"],
        "url": row["url"],
        "mimeType": row["mime_type"],
        "sizeBytes": row["size_bytes"],
        "altText": row["alt_text"],
        "usageScope": row["usage_scope"],
        "projectId": row["project_id"],
        "width": row["width"],
        "height": row["height"],
        "durationSeconds": row["duration_seconds"],
        "videoVariant": row["video_variant"],
        "createdAt": row["created_at"],
    }


def _is_storage_key_unique_violation(error: psycopg.errors.UniqueViolation) -> bool:
    constraint_name = getattr(getattr(error, "diag", None), "constraint_name", None)
    return constraint_name == "media_assets_storage_key_unique" or "media_assets_storage_key_unique" in str(error)


class PostgresAdminMediaRepository:
    def __init__(self, connection: Optional[psycopg.Connection] = None) -> None:
        self.connection = connection

    @contextmanager
    def _connection(self, write: bool = False) -> Iterator[psycopg.Connection]:
        if self.connection is not None:
            yield self.connection
            return

        connection = psycopg.connect(get_settings().database_url, row_factory=dict_row)
        try:
            yield connection
            if write:
                connection.commit()
        except Exception:
            if write:
                connection.rollback()
            raise
        finally:
            connection.close()

    def _validate_project_exists(self, project_id: object, connection: Optional[psycopg.Connection] = None) -> None:
        def fetch_project(current_connection: psycopg.Connection) -> Optional[Mapping[str, object]]:
            with current_connection.cursor() as cursor:
                cursor.execute(
                    """
                    select id
                    from projects
                    where id = %s
                    limit 1
                    """,
                    (project_id,),
                )
                return cursor.fetchone()

        if connection is not None:
            row = fetch_project(connection)
        else:
            with self._connection() as current_connection:
                row = fetch_project(current_connection)

        if row is None:
            raise ValueError("Project not found")

    def list_site_media_assets(self) -> List[dict[str, object]]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                select {MEDIA_COLUMNS}
                from media_assets
                where usage_scope = %s
                order by created_at desc
                """,
                ("site",),
            )
            rows = cursor.fetchall()

        return [map_media_asset_row(row) for row in rows]

    def list_project_media_assets(self, project_id: str) -> List[dict[str, object]]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                select {MEDIA_COLUMNS}
                from media_assets
                where usage_scope = %s and project_id = %s
                order by created_at desc
                """,
                ("project", project_id),
            )
            rows = cursor.fetchall()

        return [map_media_asset_row(row) for row in rows]

    def create_media_asset(self, input_data: Mapping[str, object]) -> dict[str, object]:
        return self.create_media_assets([input_data])[0]

    def create_media_assets(self, inputs: List[Mapping[str, object]]) -> List[dict[str, object]]:
        values_list = [_media_values(input_data) for input_data in inputs]
        project_ids = list(
            dict.fromkeys(values["project_id"] for values in values_list if values["usage_scope"] == "project")
        )
        rows: List[dict[str, object]] = []

        if not values_list:
            return []

        try:
            with self._connection(write=True) as connection:
                for project_id in project_ids:
                    self._validate_project_exists(project_id, connection)

                for values in values_list:
                    columns = list(values.keys())
                    placeholders = ", ".join(["%s"] * len(columns))
                    params: Tuple[object, ...] = tuple(values[column] for column in columns)
                    with connection.cursor() as cursor:
                        cursor.execute(
                            f"""
                            insert into media_assets ({", ".join(columns)})
                            values ({placeholders})
                            returning {MEDIA_COLUMNS}
                            """,
                            params,
                        )
                        row = cursor.fetchone()
                    mapped_row = map_media_asset_row(row)
                    if mapped_row is not None:
                        rows.append(mapped_row)
        except psycopg.errors.UniqueViolation as error:
            if _is_storage_key_unique_violation(error):
                raise ValueError("media_assets_storage_key_unique") from error
            raise

        return rows

    def _get_media_asset(self, asset_id: str, connection: psycopg.Connection) -> Optional[dict[str, object]]:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                select {MEDIA_COLUMNS}
                from media_assets
                where id = %s
                limit 1
                """,
                (asset_id,),
            )
            return map_media_asset_row(cursor.fetchone())

    def _get_media_asset_reference(self, asset_id: str, connection: psycopg.Connection) -> Optional[Mapping[str, object]]:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select source
                from (
                    select 'projects' as source from projects where hero_video_asset_id = %s
                    union all
                    select 'projects' as source from projects where fallback_image_asset_id = %s
                    union all
                    select 'projects' as source from projects where client_architect_image_asset_id = %s
                    union all
                    select 'project_sections' as source from project_sections where primary_media_asset_id = %s
                    union all
                    select 'project_sections' as source from project_sections where poster_media_asset_id = %s
                ) media_references
                limit 1
                """,
                (asset_id, asset_id, asset_id, asset_id, asset_id),
            )
            return cursor.fetchone()

    def delete_media_asset(self, asset_id: str) -> dict[str, object]:
        with self._connection(write=True) as connection:
            asset = self._get_media_asset(asset_id, connection)
            if asset is None:
                raise MediaAssetNotFound("Media asset not found")

            if self._get_media_asset_reference(asset_id, connection) is not None:
                raise MediaAssetInUse("Arquivo em uso. Remova-o do projeto antes de apagar.")

            with connection.cursor() as cursor:
                cursor.execute(
                    f"""
                    delete from media_assets
                    where id = %s
                    and not exists (select 1 from projects where hero_video_asset_id = %s)
                    and not exists (select 1 from projects where fallback_image_asset_id = %s)
                    and not exists (select 1 from projects where client_architect_image_asset_id = %s)
                    and not exists (select 1 from project_sections where primary_media_asset_id = %s)
                    and not exists (select 1 from project_sections where poster_media_asset_id = %s)
                    returning {MEDIA_COLUMNS}
                    """,
                    (asset_id, asset_id, asset_id, asset_id, asset_id, asset_id),
                )
                deleted_asset = map_media_asset_row(cursor.fetchone())
                if deleted_asset is None:
                    raise MediaAssetInUse("Arquivo em uso. Remova-o do projeto antes de apagar.")

            storage.delete_media_objects([str(deleted_asset["storageKey"])])
        return deleted_asset


def get_admin_media_repository() -> AdminMediaRepository:
    return PostgresAdminMediaRepository()


def _request_data(body: BaseModel) -> dict[str, object]:
    return body.model_dump(exclude_unset=True)


def _bad_request(error: ValueError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(error))


@admin_media_router.get("/media")
def list_admin_site_media(
    scope: Annotated[str, Query()] = "site",
    *,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminMediaRepository, Depends(get_admin_media_repository)],
) -> List[dict[str, object]]:
    if scope != "site":
        raise HTTPException(status_code=400, detail="Unsupported media scope.")

    return repository.list_site_media_assets()


@admin_media_router.get("/projects/{project_id}/media")
def list_admin_project_media(
    project_id: str,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminMediaRepository, Depends(get_admin_media_repository)],
) -> List[dict[str, object]]:
    return repository.list_project_media_assets(project_id)


@admin_media_router.post("/media")
def create_admin_media(
    body: MediaAssetCreateRequest,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminMediaRepository, Depends(get_admin_media_repository)],
) -> dict[str, object]:
    try:
        return repository.create_media_asset(_request_data(body))
    except ValueError as error:
        raise _bad_request(error) from error


@admin_media_router.delete("/media/{asset_id}")
def delete_admin_media(
    asset_id: str,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminMediaRepository, Depends(get_admin_media_repository)],
) -> dict[str, object]:
    try:
        return repository.delete_media_asset(asset_id)
    except MediaAssetNotFound as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except MediaAssetInUse as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except ValueError as error:
        raise _bad_request(error) from error
