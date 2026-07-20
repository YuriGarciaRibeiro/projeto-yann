from contextlib import contextmanager
from dataclasses import dataclass
from typing import Iterator, Optional, Protocol

import psycopg
from psycopg.rows import dict_row

from app.config import get_settings


@dataclass(frozen=True)
class AdminUser:
    id: str
    email: str
    password_hash: str


class AdminRepository(Protocol):
    def get_by_email(self, email: str) -> Optional[AdminUser]:
        ...

    def get_by_id(self, admin_id: str) -> Optional[AdminUser]:
        ...


def map_admin_row(row: dict[str, object]) -> AdminUser:
    return AdminUser(
        id=str(row["id"]),
        email=str(row["email"]),
        password_hash=str(row["password_hash"]),
    )


class PostgresAdminRepository:
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

    def get_by_email(self, email: str) -> Optional[AdminUser]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                select id, email, password_hash
                from admin_users
                where lower(email) = lower(%s)
                limit 1
                """,
                (email,),
            )
            row = cursor.fetchone()

        return map_admin_row(row) if row else None

    def get_by_id(self, admin_id: str) -> Optional[AdminUser]:
        with self._connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                select id, email, password_hash
                from admin_users
                where id = %s
                limit 1
                """,
                (admin_id,),
            )
            row = cursor.fetchone()

        return map_admin_row(row) if row else None
