import psycopg

from app.config import get_settings


SCHEMA_MIGRATIONS = (
    'ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "hero_display_name" text;',
    """
    CREATE TABLE IF NOT EXISTS project_parallax_group_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        section_id uuid NOT NULL REFERENCES project_sections(id) ON DELETE CASCADE,
        sort_order integer NOT NULL,
        title text,
        body text,
        primary_media_asset_id uuid REFERENCES media_assets(id),
        poster_media_asset_id uuid REFERENCES media_assets(id),
        caption text,
        is_enabled boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
    );
    """,
    """
    CREATE INDEX IF NOT EXISTS project_parallax_group_items_section_order_idx
    ON project_parallax_group_items(section_id, sort_order, created_at);
    """,
)


def apply_schema_migrations(connection: psycopg.Connection) -> None:
    with connection.cursor() as cursor:
        for query in SCHEMA_MIGRATIONS:
            cursor.execute(query)
    connection.commit()


def run_schema_migrations() -> None:
    with psycopg.connect(get_settings().database_url) as connection:
        apply_schema_migrations(connection)


if __name__ == "__main__":
    run_schema_migrations()
