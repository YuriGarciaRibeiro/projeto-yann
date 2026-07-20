from datetime import timedelta

import bcrypt
import pytest
from pydantic import ValidationError

from app.config import Settings
from app.security import create_access_token, decode_access_token, verify_password


def test_settings_include_auth_fields() -> None:
    settings = Settings(
        database_url="postgresql://portfolio:portfolio@localhost:5432/architecture_portfolio",
        jwt_secret="x" * 32,
        jwt_expires_minutes=15,
    )

    assert settings.database_url.startswith("postgresql://")
    assert settings.jwt_secret == "x" * 32
    assert settings.jwt_expires_delta == timedelta(minutes=15)


def test_settings_requires_jwt_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("BACKEND_JWT_SECRET", raising=False)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_rejects_short_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        Settings(jwt_secret="short")


@pytest.mark.parametrize("expires_minutes", [0, -1])
def test_settings_rejects_invalid_jwt_expiry(expires_minutes: int) -> None:
    with pytest.raises(ValidationError):
        Settings(jwt_secret="x" * 32, jwt_expires_minutes=expires_minutes)


def test_verify_password_accepts_existing_bcrypt_hash() -> None:
    password_hash = bcrypt.hashpw(b"admin123456", bcrypt.gensalt(rounds=12)).decode("utf-8")

    assert verify_password("admin123456", password_hash) is True
    assert verify_password("wrong-password", password_hash) is False


def test_access_token_round_trip() -> None:
    token = create_access_token(
        subject="admin-id",
        secret="x" * 32,
        expires_delta=timedelta(minutes=5),
    )

    payload = decode_access_token(token, secret="x" * 32)

    assert payload.subject == "admin-id"


def test_decode_access_token_rejects_invalid_token() -> None:
    with pytest.raises(ValueError, match="Invalid access token"):
        decode_access_token("not-a-token", secret="x" * 32)
