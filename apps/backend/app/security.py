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
