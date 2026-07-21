from contextlib import contextmanager
import re
from typing import Annotated, Iterator, List, Mapping, Optional, Protocol, Tuple
from urllib.parse import urlparse, urlunparse

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from psycopg.rows import dict_row
from psycopg.types.json import Json

from app.admins import AdminUser
from app.config import get_settings
from app.dependencies import get_current_admin


admin_projects_router = APIRouter(prefix="/admin", tags=["admin-projects"])


class ProjectUpsertRequest(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    year: Optional[int] = None
    shortDescription: Optional[str] = None
    clientArchitectName: Optional[str] = None
    clientArchitectEmail: Optional[str] = None
    clientArchitectPhone: Optional[str] = None
    clientArchitectWebsite: Optional[str] = None
    clientArchitectInstagram: Optional[str] = None
    clientArchitectImageAssetId: Optional[str] = None
    isPublished: Optional[bool] = None
    heroVideoAssetId: Optional[str] = None
    fallbackImageAssetId: Optional[str] = None


class ProjectSectionUpsertRequest(BaseModel):
    projectId: Optional[str] = None
    sortOrder: Optional[int] = None
    type: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    primaryMediaAssetId: Optional[str] = None
    posterMediaAssetId: Optional[str] = None
    caption: Optional[str] = None
    metadata: Optional[dict[str, object]] = None
    isEnabled: Optional[bool] = None


class AdminProjectRepository(Protocol):
    def list_projects(self) -> List[dict[str, object]]:
        ...

    def get_project_by_id(self, project_id: str) -> Optional[dict[str, object]]:
        ...

    def create_project(self, input_data: Mapping[str, object]) -> dict[str, object]:
        ...

    def update_project(self, project_id: str, input_data: Mapping[str, object]) -> Optional[dict[str, object]]:
        ...

    def delete_project(self, project_id: str) -> Optional[dict[str, object]]:
        ...

    def list_project_sections(self, project_id: str) -> List[dict[str, object]]:
        ...

    def create_project_section(self, project_id: str, input_data: Mapping[str, object]) -> dict[str, object]:
        ...

    def update_project_section(self, section_id: str, input_data: Mapping[str, object]) -> Optional[dict[str, object]]:
        ...

    def delete_project_section(self, section_id: str, project_id: str) -> Optional[dict[str, object]]:
        ...


PROJECT_COLUMNS = """
    id,
    slug,
    title,
    subtitle,
    category,
    location,
    year,
    short_description,
    client_architect_name,
    client_architect_email,
    client_architect_phone,
    client_architect_website,
    client_architect_instagram,
    client_architect_image_asset_id,
    is_published,
    hero_video_asset_id,
    fallback_image_asset_id,
    created_at,
    updated_at
"""

SECTION_COLUMNS = """
    id,
    project_id,
    sort_order,
    type,
    title,
    body,
    primary_media_asset_id,
    poster_media_asset_id,
    caption,
    metadata,
    is_enabled,
    created_at,
    updated_at
"""

PROJECT_INPUT_COLUMNS = {
    "slug": "slug",
    "title": "title",
    "subtitle": "subtitle",
    "category": "category",
    "location": "location",
    "year": "year",
    "shortDescription": "short_description",
    "clientArchitectName": "client_architect_name",
    "clientArchitectEmail": "client_architect_email",
    "clientArchitectPhone": "client_architect_phone",
    "clientArchitectWebsite": "client_architect_website",
    "clientArchitectInstagram": "client_architect_instagram",
    "clientArchitectImageAssetId": "client_architect_image_asset_id",
    "isPublished": "is_published",
    "heroVideoAssetId": "hero_video_asset_id",
    "fallbackImageAssetId": "fallback_image_asset_id",
}

SECTION_INPUT_COLUMNS = {
    "projectId": "project_id",
    "sortOrder": "sort_order",
    "type": "type",
    "title": "title",
    "body": "body",
    "primaryMediaAssetId": "primary_media_asset_id",
    "posterMediaAssetId": "poster_media_asset_id",
    "caption": "caption",
    "metadata": "metadata",
    "isEnabled": "is_enabled",
}

PROJECT_SECTION_TYPES = {
    "parallax_video",
    "video_block",
    "image_block",
    "text_block",
    "technical_info",
    "contact_credit",
}


def _media_aliases(table_alias: str, prefix: str) -> str:
    return f"""
        {table_alias}.id as {prefix}id,
        {table_alias}.storage_key as {prefix}storage_key,
        {table_alias}.url as {prefix}url,
        {table_alias}.mime_type as {prefix}mime_type,
        {table_alias}.size_bytes as {prefix}size_bytes,
        {table_alias}.alt_text as {prefix}alt_text,
        {table_alias}.usage_scope as {prefix}usage_scope,
        {table_alias}.project_id as {prefix}project_id,
        {table_alias}.width as {prefix}width,
        {table_alias}.height as {prefix}height,
        {table_alias}.duration_seconds as {prefix}duration_seconds,
        {table_alias}.video_variant as {prefix}video_variant,
        {table_alias}.created_at as {prefix}created_at
    """


def normalize_http_url(value: object, label: str) -> Optional[str]:
    trimmed_value = str(value).strip() if value is not None else ""

    if not trimmed_value:
        return None

    parsed_url = urlparse(trimmed_value)
    scheme = parsed_url.scheme.lower()
    try:
        port = parsed_url.port
    except ValueError as exc:
        raise ValueError(f"{label} must be a valid http or https URL.") from exc

    if scheme not in ("http", "https") or not parsed_url.hostname:
        raise ValueError(f"{label} must be a valid http or https URL.")

    netloc = parsed_url.hostname.lower()
    if port is not None:
        netloc = f"{netloc}:{port}"

    path = parsed_url.path or "/"
    return urlunparse(
        (
            scheme,
            netloc,
            path,
            parsed_url.params,
            parsed_url.query,
            parsed_url.fragment,
        )
    )


def normalize_instagram_value(value: object) -> Optional[str]:
    trimmed_value = str(value).strip() if value is not None else ""

    if not trimmed_value:
        return None

    if "://" in trimmed_value:
        return normalize_http_url(trimmed_value, "Client architect Instagram")

    handle = re.sub(r"^@", "", trimmed_value)
    if not re.match(r"^[A-Za-z0-9._]{1,30}$", handle):
        raise ValueError("Client architect Instagram must be a valid http or https URL, @handle, or handle.")

    return f"https://instagram.com/{handle}"


def _input_value(input_data: Mapping[str, object], camel_key: str) -> object:
    snake_key = PROJECT_INPUT_COLUMNS.get(camel_key) or SECTION_INPUT_COLUMNS.get(camel_key)
    if camel_key in input_data:
        return input_data[camel_key]
    if snake_key and snake_key in input_data:
        return input_data[snake_key]
    return None


def _project_id_for_validation(input_data: Mapping[str, object], fallback: Optional[str] = None) -> Optional[str]:
    value = input_data.get("id") or input_data.get("projectId") or input_data.get("project_id") or fallback
    return str(value) if value is not None else None


def _project_values(input_data: Mapping[str, object]) -> dict[str, object]:
    values: dict[str, object] = {}
    for camel_key, column in PROJECT_INPUT_COLUMNS.items():
        if camel_key in input_data:
            values[column] = input_data[camel_key]
        elif column in input_data:
            values[column] = input_data[column]

    if "client_architect_website" in values:
        values["client_architect_website"] = normalize_http_url(
            values["client_architect_website"],
            "Client architect website",
        )
    if "client_architect_instagram" in values:
        values["client_architect_instagram"] = normalize_instagram_value(
            values["client_architect_instagram"]
        )

    return values


def _section_values(input_data: Mapping[str, object]) -> dict[str, object]:
    values: dict[str, object] = {}
    for camel_key, column in SECTION_INPUT_COLUMNS.items():
        if camel_key in input_data:
            values[column] = input_data[camel_key]
        elif column in input_data:
            values[column] = input_data[column]
    if isinstance(values.get("metadata"), dict):
        values["metadata"] = Json(values["metadata"])
    return values


def _prefixed_media_row(row: Mapping[str, object], prefix: str) -> Optional[dict[str, object]]:
    if row.get(f"{prefix}id") is None:
        return None

    return {
        "id": row.get(f"{prefix}id"),
        "storage_key": row.get(f"{prefix}storage_key"),
        "url": row.get(f"{prefix}url"),
        "mime_type": row.get(f"{prefix}mime_type"),
        "size_bytes": row.get(f"{prefix}size_bytes"),
        "alt_text": row.get(f"{prefix}alt_text"),
        "usage_scope": row.get(f"{prefix}usage_scope"),
        "project_id": row.get(f"{prefix}project_id"),
        "width": row.get(f"{prefix}width"),
        "height": row.get(f"{prefix}height"),
        "duration_seconds": row.get(f"{prefix}duration_seconds"),
        "video_variant": row.get(f"{prefix}video_variant"),
        "created_at": row.get(f"{prefix}created_at"),
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


def map_project_row(row: Mapping[str, object]) -> dict[str, object]:
    return {
        "id": row["id"],
        "slug": row["slug"],
        "title": row["title"],
        "subtitle": row["subtitle"],
        "category": row["category"],
        "location": row["location"],
        "year": row["year"],
        "shortDescription": row["short_description"],
        "clientArchitectName": row["client_architect_name"],
        "clientArchitectEmail": row["client_architect_email"],
        "clientArchitectPhone": row["client_architect_phone"],
        "clientArchitectWebsite": row["client_architect_website"],
        "clientArchitectInstagram": row["client_architect_instagram"],
        "clientArchitectImageAssetId": row["client_architect_image_asset_id"],
        "isPublished": row["is_published"],
        "heroVideoAssetId": row["hero_video_asset_id"],
        "fallbackImageAssetId": row["fallback_image_asset_id"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def map_admin_project_section_row(row: Mapping[str, object]) -> dict[str, object]:
    return {
        "id": row["id"],
        "projectId": row["project_id"],
        "sortOrder": row["sort_order"],
        "type": row["type"],
        "title": row["title"],
        "body": row["body"],
        "primaryMediaAssetId": row["primary_media_asset_id"],
        "posterMediaAssetId": row["poster_media_asset_id"],
        "caption": row["caption"],
        "metadata": row["metadata"],
        "isEnabled": row["is_enabled"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def map_admin_project_section_payload(row: Mapping[str, object]) -> dict[str, object]:
    return {
        "section": map_admin_project_section_row(row),
        "primaryMediaAsset": map_media_asset_row(_prefixed_media_row(row, "section_primary_media_")),
        "posterMediaAsset": map_media_asset_row(_prefixed_media_row(row, "section_poster_media_")),
    }


class PostgresAdminProjectRepository:
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

    def validate_scoped_asset(
        self,
        asset_id: object,
        expected_mime_prefix: str,
        label: str,
        project_id: Optional[str],
        usage_scope: str,
        video_variant: Optional[str] = None,
    ) -> None:
        if not asset_id:
            return

        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                select mime_type, project_id, usage_scope, video_variant
                from media_assets
                where id = %s
                limit 1
                """,
                (asset_id,),
            )
            asset = cursor.fetchone()

        if asset is None or not str(asset["mime_type"]).startswith(expected_mime_prefix):
            raise ValueError(f"{label} precisa ser um arquivo valido.")

        if asset["usage_scope"] != usage_scope:
            raise ValueError(f"{label} nao pertence ao contexto correto.")

        if usage_scope == "project" and str(asset["project_id"]) != str(project_id):
            raise ValueError(f"{label} precisa pertencer a este projeto.")

        if usage_scope == "site" and asset["project_id"]:
            raise ValueError(f"{label} precisa ser um arquivo do site.")

        if video_variant and asset["video_variant"] != video_variant:
            raise ValueError(f"{label} precisa usar a versão otimizada para rolagem.")

    def _validate_project_input(
        self,
        input_data: Mapping[str, object],
        project_id: Optional[str] = None,
        require_name: bool = True,
    ) -> None:
        name = _input_value(input_data, "clientArchitectName")
        if require_name or name is not None:
            if not str(name or "").strip():
                raise ValueError("Client architect name is required.")

        self.validate_scoped_asset(
            _input_value(input_data, "heroVideoAssetId"),
            "video/",
            "Vídeo de abertura",
            project_id,
            "project",
            "scrub",
        )
        self.validate_scoped_asset(
            _input_value(input_data, "fallbackImageAssetId"),
            "image/",
            "Imagem alternativa",
            project_id,
            "project",
        )
        self.validate_scoped_asset(
            _input_value(input_data, "clientArchitectImageAssetId"),
            "image/",
            "Imagem do arquiteto",
            project_id,
            "project",
        )

    def _validate_project_section_input(self, input_data: Mapping[str, object], project_id: str) -> None:
        section_type = _input_value(input_data, "type")
        if section_type not in PROJECT_SECTION_TYPES:
            raise ValueError(f"Unsupported project section type: {section_type}")

        if section_type in ("parallax_video", "video_block"):
            self.validate_scoped_asset(
                _input_value(input_data, "primaryMediaAssetId"),
                "video/",
                "Foto ou video principal",
                project_id,
                "project",
            )

        if section_type in ("image_block", "contact_credit"):
            self.validate_scoped_asset(
                _input_value(input_data, "primaryMediaAssetId"),
                "image/",
                "Foto ou video principal",
                project_id,
                "project",
            )

        self.validate_scoped_asset(
            _input_value(input_data, "posterMediaAssetId"),
            "image/",
            "Imagem alternativa",
            project_id,
            "project",
        )

    def list_projects(self) -> List[dict[str, object]]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                select {PROJECT_COLUMNS}
                from projects
                order by updated_at desc
                """,
            )
            rows = cursor.fetchall()

        return [map_project_row(row) for row in rows]

    def get_project_by_id(self, project_id: str) -> Optional[dict[str, object]]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                select {PROJECT_COLUMNS}
                from projects
                where id = %s
                limit 1
                """,
                (project_id,),
            )
            row = cursor.fetchone()

        return map_project_row(row) if row else None

    def create_project(self, input_data: Mapping[str, object]) -> dict[str, object]:
        self._validate_project_input(input_data)
        values = _project_values(input_data)
        columns = list(values.keys())
        placeholders = ", ".join(["%s"] * len(columns))

        with self._connection(write=True) as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                insert into projects ({", ".join(columns)})
                values ({placeholders})
                returning {PROJECT_COLUMNS}
                """,
                tuple(values[column] for column in columns),
            )
            row = cursor.fetchone()

        return map_project_row(row)

    def update_project(self, project_id: str, input_data: Mapping[str, object]) -> Optional[dict[str, object]]:
        self._validate_project_input(input_data, project_id=project_id, require_name=False)
        values = _project_values(input_data)
        assignments = [f"{column} = %s" for column in values.keys()]
        assignments.append("updated_at = now()")
        params: Tuple[object, ...] = tuple(values.values()) + (project_id,)

        with self._connection(write=True) as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                update projects
                set {", ".join(assignments)}
                where id = %s
                returning {PROJECT_COLUMNS}
                """,
                params,
            )
            row = cursor.fetchone()

        return map_project_row(row) if row else None

    def delete_project(self, project_id: str) -> Optional[dict[str, object]]:
        # Project media storage cleanup remains in the media migration phase.
        with self._connection(write=True) as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                delete from projects
                where id = %s
                returning {PROJECT_COLUMNS}
                """,
                (project_id,),
            )
            row = cursor.fetchone()

        return map_project_row(row) if row else None

    def list_project_sections(self, project_id: str) -> List[dict[str, object]]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                select
                    s.id,
                    s.project_id,
                    s.sort_order,
                    s.type,
                    s.title,
                    s.body,
                    s.primary_media_asset_id,
                    s.poster_media_asset_id,
                    s.caption,
                    s.metadata,
                    s.is_enabled,
                    s.created_at,
                    s.updated_at,
                    {_media_aliases("section_primary_media", "section_primary_media_")},
                    {_media_aliases("section_poster_media", "section_poster_media_")}
                from project_sections s
                left join media_assets section_primary_media
                    on section_primary_media.id = s.primary_media_asset_id
                left join media_assets section_poster_media
                    on section_poster_media.id = s.poster_media_asset_id
                where s.project_id = %s
                order by s.sort_order asc, s.created_at asc
                """,
                (project_id,),
            )
            rows = cursor.fetchall()

        return [map_admin_project_section_payload(row) for row in rows]

    def create_project_section(self, project_id: str, input_data: Mapping[str, object]) -> dict[str, object]:
        self._validate_project_section_input(input_data, project_id)
        values = _section_values(input_data)
        values["project_id"] = project_id
        columns = list(values.keys())
        placeholders = ", ".join(["%s"] * len(columns))

        with self._connection(write=True) as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                insert into project_sections ({", ".join(columns)})
                values ({placeholders})
                returning {SECTION_COLUMNS}
                """,
                tuple(values[column] for column in columns),
            )
            row = cursor.fetchone()

        return map_admin_project_section_row(row)

    def update_project_section(self, section_id: str, input_data: Mapping[str, object]) -> Optional[dict[str, object]]:
        with self._connection(write=True) as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                select {SECTION_COLUMNS}
                from project_sections
                where id = %s
                limit 1
                """,
                (section_id,),
            )
            existing_row = cursor.fetchone()
            if existing_row is None:
                return None

            project_id = _project_id_for_validation(input_data, str(existing_row["project_id"]))
            if project_id is None:
                raise ValueError("Project id is required.")

            validation_input = map_admin_project_section_row(existing_row)
            validation_input.update(dict(input_data))
            validation_input["projectId"] = project_id
            self._validate_project_section_input(validation_input, project_id)

            values = _section_values(input_data)
            values.pop("project_id", None)
            assignments = [f"{column} = %s" for column in values.keys()]
            assignments.append("updated_at = now()")
            params: Tuple[object, ...] = tuple(values.values()) + (section_id, project_id)
            cursor.execute(
                f"""
                update project_sections
                set {", ".join(assignments)}
                where id = %s and project_id = %s
                returning {SECTION_COLUMNS}
                """,
                params,
            )
            row = cursor.fetchone()

        return map_admin_project_section_row(row) if row else None

    def delete_project_section(self, section_id: str, project_id: str) -> Optional[dict[str, object]]:
        with self._connection(write=True) as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                delete from project_sections
                where id = %s and project_id = %s
                returning {SECTION_COLUMNS}
                """,
                (section_id, project_id),
            )
            row = cursor.fetchone()

        return map_admin_project_section_row(row) if row else None


def get_admin_project_repository() -> AdminProjectRepository:
    return PostgresAdminProjectRepository()


def _request_data(body: BaseModel) -> dict[str, object]:
    return body.model_dump(exclude_unset=True)


def _bad_request(error: ValueError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(error))


def _is_project_slug_unique_violation(error: psycopg.errors.UniqueViolation) -> bool:
    constraint_name = getattr(getattr(error, "diag", None), "constraint_name", None)
    return constraint_name == "projects_slug_unique" or "projects_slug_unique" in str(error)


def _project_write_error(error: psycopg.errors.UniqueViolation) -> HTTPException:
    if _is_project_slug_unique_violation(error):
        return HTTPException(status_code=400, detail="projects_slug_unique")
    raise error


@admin_projects_router.get("/projects")
def list_admin_projects(
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> List[dict[str, object]]:
    return repository.list_projects()


@admin_projects_router.get("/projects/{project_id}")
def get_admin_project(
    project_id: str,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> dict[str, object]:
    project = repository.get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    return project


@admin_projects_router.post("/projects")
def create_admin_project(
    body: ProjectUpsertRequest,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> dict[str, object]:
    try:
        return repository.create_project(_request_data(body))
    except ValueError as error:
        raise _bad_request(error) from error
    except psycopg.errors.UniqueViolation as error:
        raise _project_write_error(error) from error


@admin_projects_router.patch("/projects/{project_id}")
def update_admin_project(
    project_id: str,
    body: ProjectUpsertRequest,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> dict[str, object]:
    try:
        project = repository.update_project(project_id, _request_data(body))
    except ValueError as error:
        raise _bad_request(error) from error
    except psycopg.errors.UniqueViolation as error:
        raise _project_write_error(error) from error

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    return project


@admin_projects_router.delete("/projects/{project_id}")
def delete_admin_project(
    project_id: str,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> dict[str, object]:
    try:
        project = repository.delete_project(project_id)
    except ValueError as error:
        raise _bad_request(error) from error

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    return project


@admin_projects_router.get("/projects/{project_id}/sections")
def list_admin_project_sections(
    project_id: str,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> List[dict[str, object]]:
    return repository.list_project_sections(project_id)


@admin_projects_router.post("/projects/{project_id}/sections")
def create_admin_project_section(
    project_id: str,
    body: ProjectSectionUpsertRequest,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> dict[str, object]:
    try:
        return repository.create_project_section(project_id, _request_data(body))
    except ValueError as error:
        raise _bad_request(error) from error


@admin_projects_router.patch("/project-sections/{section_id}")
def update_admin_project_section(
    section_id: str,
    body: ProjectSectionUpsertRequest,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> dict[str, object]:
    try:
        section = repository.update_project_section(section_id, _request_data(body))
    except ValueError as error:
        raise _bad_request(error) from error

    if section is None:
        raise HTTPException(status_code=404, detail="Project section not found.")

    return section


@admin_projects_router.delete("/project-sections/{section_id}")
def delete_admin_project_section(
    section_id: str,
    project_id: Annotated[str, Query(alias="projectId")],
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminProjectRepository, Depends(get_admin_project_repository)],
) -> dict[str, object]:
    try:
        section = repository.delete_project_section(section_id, project_id)
    except ValueError as error:
        raise _bad_request(error) from error

    if section is None:
        raise HTTPException(status_code=404, detail="Project section not found.")

    return section
