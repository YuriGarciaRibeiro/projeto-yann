import psycopg

from app.config import get_settings


SCHEMA_MIGRATIONS = (
    'ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "hero_display_name" text;',
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
