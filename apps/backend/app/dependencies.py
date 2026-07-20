from typing import Annotated, Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.admins import AdminRepository, AdminUser, PostgresAdminRepository
from app.config import get_settings
from app.security import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_admin_repository() -> AdminRepository:
    return PostgresAdminRepository()


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
