from contextlib import contextmanager
from typing import Iterator, List, Optional, Protocol

import psycopg
from fastapi import APIRouter, Depends, HTTPException
from psycopg.rows import dict_row

from app.config import get_settings


public_projects_router = APIRouter(prefix="/projects", tags=["projects"])


class PublicProjectRepository(Protocol):
    def get_featured_project(self) -> Optional[dict[str, object]]:
        ...

    def get_published_projects(self) -> List[dict[str, object]]:
        ...

    def get_project_by_slug(self, slug: str) -> Optional[dict[str, object]]:
        ...


def get_public_project_repository() -> PublicProjectRepository:
    return PostgresPublicProjectRepository()


@public_projects_router.get("/featured")
def get_featured_project(
    repository: PublicProjectRepository = Depends(get_public_project_repository),
) -> Optional[dict[str, object]]:
    return repository.get_featured_project()


@public_projects_router.get("/published")
def get_published_projects(
    repository: PublicProjectRepository = Depends(get_public_project_repository),
) -> List[dict[str, object]]:
    return repository.get_published_projects()


@public_projects_router.get("/{slug}")
def get_project_by_slug(
    slug: str,
    repository: PublicProjectRepository = Depends(get_public_project_repository),
) -> dict[str, object]:
    project = repository.get_project_by_slug(slug)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    return project


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


def _prefixed_media_row(row: dict[str, object], prefix: str) -> Optional[dict[str, object]]:
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


def map_media_asset(row: Optional[dict[str, object]]) -> Optional[dict[str, object]]:
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


def map_project(row: dict[str, object]) -> dict[str, object]:
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


def map_section(row: dict[str, object]) -> dict[str, object]:
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


def map_project_payload(project_row: dict[str, object], section_rows: List[dict[str, object]]) -> dict[str, object]:
    return {
        "project": map_project(project_row),
        "heroVideoAsset": map_media_asset(_prefixed_media_row(project_row, "hero_video_")),
        "fallbackImageAsset": map_media_asset(_prefixed_media_row(project_row, "fallback_image_")),
        "clientArchitectImageAsset": map_media_asset(_prefixed_media_row(project_row, "client_architect_image_")),
        "sections": [
            {
                "section": map_section(section_row),
                "primaryMediaAsset": map_media_asset(
                    _prefixed_media_row(section_row, "section_primary_media_")
                ),
                "posterMediaAsset": map_media_asset(
                    _prefixed_media_row(section_row, "section_poster_media_")
                ),
            }
            for section_row in section_rows
        ],
    }


class PostgresPublicProjectRepository:
    def __init__(self, connection: Optional[psycopg.Connection] = None) -> None:
        self.connection = connection

    @contextmanager
    def _connection(self) -> Iterator[psycopg.Connection]:
        if self.connection is not None:
            yield self.connection
            return

        connection = psycopg.connect(get_settings().database_url, row_factory=dict_row)
        try:
            yield connection
        finally:
            connection.close()

    def get_featured_project(self) -> Optional[dict[str, object]]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                select id, slug
                from projects
                where is_published = true
                order by updated_at desc
                limit 1
                """,
            )
            row = cursor.fetchone()

        if row is None:
            return None


        return {"id": row["id"], "slug": row["slug"]}

    def get_published_projects(self) -> List[dict[str, object]]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                select {PROJECT_COLUMNS}
                from projects
                where is_published = true
                order by year desc, created_at desc
                """,
            )
            rows = cursor.fetchall()

        return [map_project(row) for row in rows]

    def get_project_by_slug(self, slug: str) -> Optional[dict[str, object]]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                select
                    p.id,
                    p.slug,
                    p.title,
                    p.subtitle,
                    p.category,
                    p.location,
                    p.year,
                    p.short_description,
                    p.client_architect_name,
                    p.client_architect_email,
                    p.client_architect_phone,
                    p.client_architect_website,
                    p.client_architect_instagram,
                    p.client_architect_image_asset_id,
                    p.is_published,
                    p.hero_video_asset_id,
                    p.fallback_image_asset_id,
                    p.created_at,
                    p.updated_at,
                    {_media_aliases("hero_video", "hero_video_")},
                    {_media_aliases("fallback_image", "fallback_image_")},
                    {_media_aliases("client_architect_image", "client_architect_image_")}
                from projects p
                left join media_assets hero_video
                    on hero_video.id = p.hero_video_asset_id
                    and hero_video.video_variant = 'scrub'
                left join media_assets fallback_image on fallback_image.id = p.fallback_image_asset_id
                left join media_assets client_architect_image
                    on client_architect_image.id = p.client_architect_image_asset_id
                where slug = %s and is_published = true
                limit 1
                """,
                (slug,),
            )
            project_row = cursor.fetchone()

            if project_row is None:
                return None

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
                where s.project_id = %s and s.is_enabled = true
                order by s.sort_order asc, s.created_at asc
                """,
                (project_row["id"],),
            )
            section_rows = cursor.fetchall()

        return map_project_payload(project_row, section_rows)
