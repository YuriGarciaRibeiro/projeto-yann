from datetime import timedelta
from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "Paralax API"
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "postgresql://portfolio:portfolio@localhost:5432/architecture_portfolio"
    jwt_secret: str = Field(min_length=32)
    jwt_expires_minutes: int = Field(default=60, gt=0)
    public_url: Optional[str] = None
    s3_endpoint: str = "http://localhost:9000"
    s3_presign_endpoint: Optional[str] = None
    s3_region: str = "us-east-1"
    s3_bucket: str = "portfolio-media"
    s3_access_key_id: str = "minio"
    s3_secret_access_key: str = "minioadmin"
    s3_public_base_url: Optional[str] = None

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
