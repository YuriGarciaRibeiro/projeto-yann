from collections.abc import Generator
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
import pytest
from fastapi.testclient import TestClient

from app.admins import AdminUser
from app.config import get_settings
from app.dependencies import get_admin_repository
from app.main import app


@pytest.fixture(autouse=True)
def restore_dependency_overrides() -> Generator[None, None, None]:
    previous_overrides = app.dependency_overrides.copy()
    try:
        yield
    finally:
        app.dependency_overrides = previous_overrides


@dataclass
class FakeAdminRepository:
    admin: Optional[AdminUser]

    def get_by_email(self, email: str) -> Optional[AdminUser]:
        if self.admin and self.admin.email.lower() == email.lower():
            return self.admin
        return None

    def get_by_id(self, admin_id: str) -> Optional[AdminUser]:
        if self.admin and self.admin.id == admin_id:
            return self.admin
        return None


def password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def test_login_returns_bearer_token() -> None:
    admin = AdminUser(
        id="admin-id",
        email="admin@example.com",
        password_hash=password_hash("admin123456"),
    )
    app.dependency_overrides[get_admin_repository] = lambda: FakeAdminRepository(admin)
    client = TestClient(app)

    response = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "admin123456"},
    )

    assert response.status_code == 200
    assert response.json()["tokenType"] == "bearer"
    assert response.json()["expiresIn"] == get_settings().jwt_expires_minutes * 60
    assert response.json()["accessToken"]


def test_login_rejects_invalid_password() -> None:
    admin = AdminUser(
        id="admin-id",
        email="admin@example.com",
        password_hash=password_hash("admin123456"),
    )
    app.dependency_overrides[get_admin_repository] = lambda: FakeAdminRepository(admin)
    client = TestClient(app)

    response = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password."}


def test_auth_me_requires_token() -> None:
    client = TestClient(app)

    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_auth_me_rejects_malformed_token_without_database() -> None:
    client = TestClient(app)

    response = client.get("/auth/me", headers={"Authorization": "Bearer malformed-token"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_auth_me_rejects_expired_token_without_database() -> None:
    token = jwt.encode(
        {"sub": "admin-id", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        get_settings().jwt_secret,
        algorithm="HS256",
    )
    client = TestClient(app)

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_auth_me_returns_current_admin() -> None:
    admin = AdminUser(
        id="admin-id",
        email="admin@example.com",
        password_hash=password_hash("admin123456"),
    )
    app.dependency_overrides[get_admin_repository] = lambda: FakeAdminRepository(admin)
    client = TestClient(app)

    login_response = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "admin123456"},
    )
    token = login_response.json()["accessToken"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json() == {"id": "admin-id", "email": "admin@example.com"}
