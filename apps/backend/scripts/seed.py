import os
from pathlib import Path

import bcrypt
import psycopg

from app.config import get_settings


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def load_local_env() -> None:
    repo_root = BACKEND_ROOT.parent.parent
    web_root = repo_root / "apps" / "web"

    for env_path in (
        BACKEND_ROOT / ".env",
        repo_root / ".env",
        web_root / ".env.local",
        web_root / ".env",
    ):
        if not env_path.exists():
            continue

        for line in env_path.read_text().splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#") or "=" not in trimmed:
                continue

            key, raw_value = trimmed.split("=", 1)
            value = raw_value.strip().strip('"\'')
            os.environ.setdefault(key.strip(), value)


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required to seed admin users.")
    return value


def main() -> None:
    load_local_env()
    admin_email = required_env("ADMIN_EMAIL")
    admin_password = required_env("ADMIN_PASSWORD")
    if len(admin_password) < 8:
        raise RuntimeError("ADMIN_PASSWORD must be at least 8 characters.")

    password_hash = bcrypt.hashpw(admin_password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")

    with psycopg.connect(get_settings().database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                insert into admin_users (email, password_hash, updated_at)
                values (%s, %s, now())
                on conflict (email) do update set
                    password_hash = excluded.password_hash,
                    updated_at = now()
                """,
                (admin_email, password_hash),
            )

    print("Admin seed completed.")


if __name__ == "__main__":
    main()
