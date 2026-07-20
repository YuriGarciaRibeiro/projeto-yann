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


@router.get("/me", response_model=CurrentAdminResponse)
def me(current_admin: Annotated[AdminUser, Depends(get_current_admin)]) -> CurrentAdminResponse:
    return CurrentAdminResponse(id=current_admin.id, email=current_admin.email)
