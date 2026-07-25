from pathlib import Path

from app.migrations import apply_schema_migrations


class FakeCursor:
    def __init__(self) -> None:
        self.queries: list[str] = []

    def __enter__(self) -> "FakeCursor":
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> None:
        return None

    def execute(self, query: str) -> None:
        self.queries.append(query)


class FakeConnection:
    def __init__(self) -> None:
        self.cursor_instance = FakeCursor()
        self.committed = False

    def cursor(self) -> FakeCursor:
        return self.cursor_instance

    def commit(self) -> None:
        self.committed = True


def test_startup_migrations_add_hero_display_name_idempotently() -> None:
    connection = FakeConnection()

    apply_schema_migrations(connection)

    assert connection.committed is True
    assert any(
        'ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "hero_display_name" text'
        in query
        for query in connection.cursor_instance.queries
    )


def test_backend_dockerfile_runs_migrations_before_server_command() -> None:
    dockerfile = Path("apps/backend/Dockerfile").read_text(encoding="utf-8")

    assert "ENTRYPOINT" in dockerfile
    assert "docker-entrypoint.sh" in dockerfile


def test_backend_entrypoint_runs_schema_migrations_then_execs_command() -> None:
    entrypoint = Path("apps/backend/docker-entrypoint.sh").read_text(encoding="utf-8")

    assert "python -m app.migrations" in entrypoint
    assert 'exec "$@"' in entrypoint
