from typing import Optional

from app.admins import AdminUser, PostgresAdminRepository, map_admin_row


class FakeCursor:
    def __init__(self, row: Optional[dict[str, object]]) -> None:
        self.row = row
        self.query = ""
        self.params: tuple[object, ...] = ()

    def __enter__(self) -> "FakeCursor":
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> None:
        return None

    def execute(self, query: str, params: tuple[object, ...]) -> None:
        self.query = query
        self.params = params

    def fetchone(self) -> Optional[dict[str, object]]:
        return self.row


class FakeConnection:
    def __init__(self, row: Optional[dict[str, object]]) -> None:
        self.cursor_instance = FakeCursor(row)

    def cursor(self) -> FakeCursor:
        return self.cursor_instance


def test_map_admin_row() -> None:
    admin = map_admin_row(
        {
            "id": "admin-id",
            "email": "admin@example.com",
            "password_hash": "hash-value",
        }
    )

    assert admin == AdminUser(
        id="admin-id",
        email="admin@example.com",
        password_hash="hash-value",
    )


def test_postgres_admin_repository_get_by_email_returns_mapped_admin() -> None:
    connection = FakeConnection(
        {
            "id": "admin-id",
            "email": "admin@example.com",
            "password_hash": "hash-value",
        }
    )

    admin = PostgresAdminRepository(connection).get_by_email("admin@example.com")

    assert admin == AdminUser(
        id="admin-id",
        email="admin@example.com",
        password_hash="hash-value",
    )


def test_postgres_admin_repository_get_by_email_uses_parameterized_query() -> None:
    connection = FakeConnection(None)

    PostgresAdminRepository(connection).get_by_email("admin@example.com")

    assert "where lower(email) = lower(%s)" in connection.cursor_instance.query
    assert connection.cursor_instance.params == ("admin@example.com",)


def test_postgres_admin_repository_get_by_id_returns_none_without_row() -> None:
    connection = FakeConnection(None)

    admin = PostgresAdminRepository(connection).get_by_id("admin-id")

    assert admin is None


def test_postgres_admin_repository_get_by_id_uses_parameterized_query() -> None:
    connection = FakeConnection(None)

    PostgresAdminRepository(connection).get_by_id("admin-id")

    assert "where id = %s" in connection.cursor_instance.query
    assert connection.cursor_instance.params == ("admin-id",)
