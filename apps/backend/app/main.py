import json
import logging
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin_media import admin_media_router
from app.admin_projects import admin_projects_router
from app.auth_routes import router as auth_router
from app.config import get_settings
from app.public_projects import public_projects_router
from app.upload_routes import admin_uploads_router, media_router


logger = logging.getLogger(__name__)


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

    @app.middleware("http")
    async def log_unauthorized_video_upload(request, call_next):
        response = await call_next(request)
        if request.url.path == "/admin/uploads/video" and response.status_code == 401:
            logger.info(
                json.dumps(
                    {
                        "message": "unauthorized",
                        "requestId": str(uuid.uuid4()),
                        "scope": "video-upload",
                    }
                )
            )
        return response

    app.include_router(auth_router)
    app.include_router(admin_media_router)
    app.include_router(admin_projects_router)
    app.include_router(admin_uploads_router)
    app.include_router(media_router)
    app.include_router(public_projects_router)

    return app


app = create_app()
