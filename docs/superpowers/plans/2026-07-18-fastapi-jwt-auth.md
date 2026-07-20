# FastAPI JWT Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add FastAPI admin authentication with bcrypt password verification, JWT access tokens, and a protected current-user endpoint.

**Architecture:** FastAPI owns the new JWT auth API while the existing Next cookie login remains in place until the admin frontend is migrated. Auth code is split into focused modules: config, database connection, admin repository, password verification, JWT token handling, request dependencies, and routes. Tests use dependency overrides so auth behavior is verified without requiring Postgres.

**Tech Stack:** FastAPI, Pydantic Settings, PyJWT, bcrypt, psycopg, Pytest, HTTPX/TestClient, Postgres.

---

## File Structure

- Modify: `apps/backend/requirements.txt` to add `bcrypt`, `PyJWT`, and `psycopg[binary]`.
- Modify: `apps/backend/requirements-dev.txt` only if the test dependency list changes.
- Modify: `apps/backend/.env.example` with auth/database values.
- Modify: `apps/backend/app/config.py` with `database_url`, `jwt_secret`, and `jwt_expires_minutes`.
- Create: `apps/backend/app/db.py` for Postgres connection creation.
- Create: `apps/backend/app/admins.py` for admin lookup by email/id.
- Create: `apps/backend/app/security.py` for bcrypt verification and JWT encode/decode.
- Create: `apps/backend/app/dependencies.py` for bearer-token auth dependency.
- Create: `apps/backend/app/auth_routes.py` for `/auth/login` and `/auth/me`.
- Modify: `apps/backend/app/main.py` to include auth routes.
- Create: `apps/backend/tests/test_security.py` for token/password tests.
- Create: `apps/backend/tests/test_auth_routes.py` for route tests with fake repositories.
- Modify: `README.md` to document backend auth env variables and endpoints.

## API Contract

### `POST /auth/login`

Request:

```json
{
  "email": "admin@example.com",
  "password": "admin123456"
}
```

Success response:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "bearer",
  "expiresIn": 3600
}
```

Invalid credentials response:

```json
{
  "detail": "Invalid email or password."
}
```

Status: `401`.

### `GET /auth/me`

Request header:

```http
Authorization: Bearer jwt-token
```

Success response:

```json
{
  "id": "admin-user-id",
  "email": "admin@example.com"
}
```

Missing or invalid token response:

```json
{
  "detail": "Authentication required."
}
```

Status: `401`.

## Tasks

### Task 1: Add Auth Dependencies and Config

**Files:**

- Modify: `apps/backend/requirements.txt`
- Modify: `apps/backend/.env.example`
- Modify: `apps/backend/app/config.py`
- Test: `apps/backend/tests/test_security.py`

- [ ] **Step 1: Add dependencies**

Update `apps/backend/requirements.txt`:

```txt
fastapi==0.116.1
uvicorn[standard]==0.35.0
pydantic-settings==2.10.1
bcrypt==4.2.1
PyJWT==2.10.1
psycopg[binary]==3.2.13
email-validator==2.2.0
```

- [ ] **Step 2: Extend backend env example**

Update `apps/backend/.env.example`:

```dotenv
BACKEND_APP_NAME="Paralax API"
BACKEND_CORS_ORIGINS='["http://localhost:3000"]'
BACKEND_DATABASE_URL="postgresql://portfolio:portfolio@localhost:5432/architecture_portfolio"
BACKEND_JWT_SECRET="replace-with-at-least-32-random-characters"
BACKEND_JWT_EXPIRES_MINUTES="60"
```

- [ ] **Step 3: Write failing config test**

Create or update `apps/backend/tests/test_security.py` with this first test:

```python
from datetime import timedelta

from app.config import Settings


def test_settings_include_auth_fields() -> None:
    settings = Settings(
        database_url="postgresql://portfolio:portfolio@localhost:5432/architecture_portfolio",
        jwt_secret="x" * 32,
        jwt_expires_minutes=15,
    )

    assert settings.database_url.startswith("postgresql://")
    assert settings.jwt_secret == "x" * 32
    assert settings.jwt_expires_delta == timedelta(minutes=15)
```

- [ ] **Step 4: Run test to verify it fails**

Run:

```bash
npm run backend:install
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_security.py::test_settings_include_auth_fields -v
```

Expected: FAIL because `Settings` does not have auth/database fields yet.

- [ ] **Step 5: Implement config fields**

Update `apps/backend/app/config.py`:

```python
from datetime import timedelta
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "Paralax API"
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "postgresql://portfolio:portfolio@localhost:5432/architecture_portfolio"
    jwt_secret: str = Field(min_length=32)
    jwt_expires_minutes: int = Field(default=60, gt=0)

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_prefix="BACKEND_",
        extra="ignore",
    )

    @property
    def jwt_expires_delta(self) -> timedelta:
        return timedelta(minutes=self.jwt_expires_minutes)


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 6: Run config test**

Run:

```bash
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_security.py::test_settings_include_auth_fields -v
```

Expected: PASS.

### Task 2: Add Password and JWT Security Module

**Files:**

- Create: `apps/backend/app/security.py`
- Modify: `apps/backend/tests/test_security.py`

- [ ] **Step 1: Add failing security tests**

Append to `apps/backend/tests/test_security.py`:

```python
from datetime import timedelta

import bcrypt
import pytest

from app.security import create_access_token, decode_access_token, verify_password


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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_security.py -v
```

Expected: FAIL because `app.security` does not exist.

- [ ] **Step 3: Implement security module**

Create `apps/backend/app/security.py`:

```python
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt


ALGORITHM = "HS256"


@dataclass(frozen=True)
class TokenPayload:
    subject: str
    expires_at: datetime


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str, secret: str, expires_delta: timedelta) -> str:
    expires_at = datetime.now(timezone.utc) + expires_delta
    return jwt.encode({"sub": subject, "exp": expires_at}, secret, algorithm=ALGORITHM)


def decode_access_token(token: str, secret: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
    except jwt.PyJWTError as error:
        raise ValueError("Invalid access token") from error

    subject = payload.get("sub")
    expires_at = payload.get("exp")

    if not isinstance(subject, str) or not subject:
        raise ValueError("Invalid access token")

    if not isinstance(expires_at, int):
        raise ValueError("Invalid access token")

    return TokenPayload(
        subject=subject,
        expires_at=datetime.fromtimestamp(expires_at, tz=timezone.utc),
    )
```

- [ ] **Step 4: Run security tests**

Run:

```bash
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_security.py -v
```

Expected: PASS.

### Task 3: Add Admin Repository and Database Connection

**Files:**

- Create: `apps/backend/app/db.py`
- Create: `apps/backend/app/admins.py`
- Create: `apps/backend/tests/test_admins.py`

- [ ] **Step 1: Add repository unit tests for row mapping**

Create `apps/backend/tests/test_admins.py`:

```python
from app.admins import AdminUser, map_admin_row


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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_admins.py -v
```

Expected: FAIL because `app.admins` does not exist.

- [ ] **Step 3: Add database connection module**

Create `apps/backend/app/db.py`:

```python
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
```

- [ ] **Step 4: Add admin repository module**

Create `apps/backend/app/admins.py`:

```python
from dataclasses import dataclass
from typing import Optional, Protocol

import psycopg


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
    def __init__(self, connection: psycopg.Connection) -> None:
        self.connection = connection

    def get_by_email(self, email: str) -> Optional[AdminUser]:
        with self.connection.cursor() as cursor:
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
        with self.connection.cursor() as cursor:
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
```

- [ ] **Step 5: Run repository tests**

Run:

```bash
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_admins.py -v
```

Expected: PASS.

### Task 4: Add Auth Routes and Dependencies

**Files:**

- Create: `apps/backend/app/dependencies.py`
- Create: `apps/backend/app/auth_routes.py`
- Modify: `apps/backend/app/main.py`
- Create: `apps/backend/tests/test_auth_routes.py`

- [ ] **Step 1: Add failing route tests**

Create `apps/backend/tests/test_auth_routes.py`:

```python
from dataclasses import dataclass
from typing import Optional

import bcrypt
from fastapi.testclient import TestClient

from app.admins import AdminUser
from app.dependencies import get_admin_repository
from app.config import get_settings
from app.main import app


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
    app.dependency_overrides.clear()


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
    app.dependency_overrides.clear()


def test_auth_me_requires_token() -> None:
    client = TestClient(app)

    response = client.get("/auth/me")

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
    app.dependency_overrides.clear()
```

- [ ] **Step 2: Run route tests to verify they fail**

Run:

```bash
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_auth_routes.py -v
```

Expected: FAIL because auth route modules do not exist.

- [ ] **Step 3: Add dependencies module**

Create `apps/backend/app/dependencies.py`:

```python
from typing import Annotated, Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import psycopg

from app.admins import AdminRepository, AdminUser, PostgresAdminRepository
from app.config import get_settings
from app.db import get_connection
from app.security import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_admin_repository(
    connection: Annotated[psycopg.Connection, Depends(get_connection)],
) -> AdminRepository:
    return PostgresAdminRepository(connection)


def authentication_error() -> HTTPException:
    return HTTPException(status_code=401, detail="Authentication required.")


def get_current_admin(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)],
    repository: Annotated[AdminRepository, Depends(get_admin_repository)],
) -> AdminUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise authentication_error()

    try:
        payload = decode_access_token(credentials.credentials, get_settings().jwt_secret)
    except ValueError as error:
        raise authentication_error() from error

    admin = repository.get_by_id(payload.subject)

    if admin is None:
        raise authentication_error()

    return admin
```

- [ ] **Step 4: Add auth routes**

Create `apps/backend/app/auth_routes.py`:

```python
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.admins import AdminRepository, AdminUser
from app.config import get_settings
from app.dependencies import get_admin_repository, get_current_admin
from app.security import create_access_token, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int


class CurrentAdminResponse(BaseModel):
    id: str
    email: str


def invalid_login_error() -> HTTPException:
    return HTTPException(status_code=401, detail="Invalid email or password.")


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    repository: Annotated[AdminRepository, Depends(get_admin_repository)],
) -> LoginResponse:
    admin = repository.get_by_email(body.email)

    if admin is None or not verify_password(body.password, admin.password_hash):
        raise invalid_login_error()

    settings = get_settings()
    token = create_access_token(
        subject=admin.id,
        secret=settings.jwt_secret,
        expires_delta=settings.jwt_expires_delta,
    )

    return LoginResponse(
        accessToken=token,
        expiresIn=settings.jwt_expires_minutes * 60,
    )
```

Add `/auth/me` to the same `apps/backend/app/auth_routes.py` file:

```python
@router.get("/me", response_model=CurrentAdminResponse)
def me(current_admin: Annotated[AdminUser, Depends(get_current_admin)]) -> CurrentAdminResponse:
    return CurrentAdminResponse(id=current_admin.id, email=current_admin.email)
```

- [ ] **Step 5: Include auth router**

Update `apps/backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth_routes import router as auth_router
from app.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth_router)

    return app


app = create_app()
```

- [ ] **Step 6: Run route tests**

Run:

```bash
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_auth_routes.py -v
```

Expected: PASS.

### Task 5: Documentation and Full Backend Verification

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Document auth endpoints**

Add this section to `README.md` after `## Monorepo Layout`:

```md
## FastAPI Auth

The FastAPI backend exposes JWT auth endpoints for the migration path:

- `POST http://localhost:8000/auth/login` accepts `{ "email": "admin@example.com", "password": "admin123456" }` and returns a bearer token.
- `GET http://localhost:8000/auth/me` requires `Authorization: Bearer <token>` and returns the current admin id/email.

During migration, the existing Next admin cookie login remains available. Admin UI calls will move to JWT-backed FastAPI endpoints in later phases.
```

- [ ] **Step 2: Run all backend tests**

Run:

```bash
npm run backend:install
npm run backend:test
```

Expected: all backend tests pass.

- [ ] **Step 3: Run web checks**

Run:

```bash
npm run lint:web
npm run build:web
```

Expected: both pass because existing Next auth is still unchanged.

- [ ] **Step 4: Run Docker build**

Run:

```bash
docker build .
```

Expected: build passes.

- [ ] **Step 5: Remove local backend venv**

Run:

```bash
rm -rf apps/backend/.venv
git status --short
```

Expected: no generated `.venv`, `.pytest_cache`, `__pycache__`, or `.next` files appear.

## Self-Review

- Spec coverage: this plan implements JWT login, JWT verification, protected current-user endpoint, config, tests, and docs. It intentionally does not migrate the Next admin UI yet.
- Placeholder scan: no placeholder task remains; every task lists files, concrete code, commands, and expected results.
- Type consistency: response names use `accessToken`, `tokenType`, and `expiresIn` consistently; backend modules use `AdminUser`, `AdminRepository`, and `get_admin_repository` consistently.
