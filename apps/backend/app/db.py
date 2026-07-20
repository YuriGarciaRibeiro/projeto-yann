from collections.abc import Generator

import psycopg
from psycopg.rows import dict_row

from app.config import get_settings


def get_connection() -> Generator[psycopg.Connection, None, None]:
    connection = psycopg.connect(get_settings().database_url, row_factory=dict_row)
    try:
        yield connection
    finally:
        connection.close()
