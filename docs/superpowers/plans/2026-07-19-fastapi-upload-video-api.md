# FastAPI Upload and Video API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move upload signing, video processing, storage operations, and media proxying from Next route handlers to FastAPI.

**Architecture:** FastAPI gets a storage helper module for S3/MinIO, an authenticated upload router for image signing and video optimization, and a public media proxy route. The Next admin UI calls FastAPI directly for signing/video uploads, while image metadata creation continues through the Phase 5 FastAPI media client.

**Tech Stack:** FastAPI, Pytest, boto3, botocore, FFmpeg CLI, psycopg, Next.js 16, TypeScript, S3/MinIO, Docker Compose.

---

## Scope

In scope:

- Add backend S3/MinIO configuration.
- Add Python storage helpers equivalent to the existing Next storage helpers.
- Add `POST /admin/uploads/sign`.
- Add `POST /admin/uploads/video` with FFmpeg scrub/standard variants.
- Add `GET /media/{storage_key:path}`.
- Switch admin UI to call FastAPI directly for sign/video.
- Delete obsolete Next upload/media route handlers after the UI no longer calls them.
- Update Docker/Compose/backend requirements for FFmpeg and S3 client support.

Out of scope:

- Removing all Next storage helper code if still used by `saveMediaAssetAction` validation.
- Redesigning video encoding settings.
- Background job queues.
- Chunked/resumable uploads.

## Files

- Modify: `apps/backend/requirements.txt`
- Modify: `apps/backend/requirements-dev.txt` if test dependencies need botocore stubs.
- Modify: `apps/backend/app/config.py`
- Create: `apps/backend/app/storage.py`
- Create: `apps/backend/app/upload_routes.py`
- Create: `apps/backend/tests/test_storage.py`
- Create: `apps/backend/tests/test_upload_routes.py`
- Modify: `apps/backend/app/main.py`
- Modify: `apps/backend/.env.example`
- Modify: `docker-compose.yml`
- Modify: `Dockerfile`
- Create: `apps/web/src/lib/api/admin-uploads.ts`
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
- Delete: `apps/web/src/app/api/uploads/sign/route.ts`
- Delete: `apps/web/src/app/api/uploads/video/route.ts`
- Delete: `apps/web/src/app/api/media/[...key]/route.ts`
- Modify: `README.md`

## Tasks

### Task 1: Backend Storage Helpers

- [ ] Add `boto3` to `apps/backend/requirements.txt`.
- [ ] Extend `apps/backend/app/config.py` with S3 settings and optional `public_url`/`s3_public_base_url`.
- [ ] Create `apps/backend/tests/test_storage.py` covering allowed MIME validation, max upload sizes, storage key generation, storage key validation, delivery URL generation with and without public S3 base URL, signed upload creation with mocked S3 client, object verification, delete batching, and media object retrieval with range.
- [ ] Create `apps/backend/app/storage.py` with constants matching `apps/web/src/lib/storage/s3.ts`, `validate_media_upload_input()`, `validate_upload_storage_key()`, `create_media_storage_key()`, `get_media_delivery_url()`, `create_signed_put_upload()`, `put_media_object()`, `head_media_object()`, `get_media_object()`, `delete_media_objects()`, and `verify_uploaded_media_object()`.
- [ ] Run `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_storage.py -v`.

### Task 2: Backend Upload and Media Proxy Routes

- [ ] Create `apps/backend/tests/test_upload_routes.py` with route tests using auth dependency overrides and monkeypatched storage/FFmpeg/media repository functions.
- [ ] Create `apps/backend/app/upload_routes.py` with `admin_uploads_router = APIRouter(prefix="/admin", tags=["admin-uploads"])` and `media_router = APIRouter(tags=["media"])`.
- [ ] Implement `POST /admin/uploads/sign`: require auth, parse `fileName`, `mimeType`, `size`, reject videos, call `create_signed_put_upload()`, and return JSON.
- [ ] Implement `POST /admin/uploads/video`: require auth, parse multipart file/altText/usageScope/projectId, validate video MIME and size, write temp input, run FFmpeg twice with current parameters, upload both outputs, create two media rows with `videoVariant` `scrub` and `standard`, cleanup temp files, delete uploaded objects on metadata/processing failure after upload, and return `{ ok: true, requestId }`.
- [ ] Implement `GET /media/{storage_key:path}`: validate key, pass `Range` header to S3, stream bytes, forward content type/length/range metadata where available, and set cache headers.
- [ ] Include routers in `apps/backend/app/main.py`.
- [ ] Run `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_upload_routes.py -v` and `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests -v`.

### Task 3: Web FastAPI Upload Client and UI Switch

- [ ] Create `apps/web/src/lib/api/admin-uploads.ts` with `getAdminUploadHeaders()`, `createSignedAdminUpload(input)`, `uploadAdminVideo(formData)`, and `getBackendMediaUrl(storageKey)` if needed.
- [ ] Update `apps/web/src/app/admin/components/MediaUploadField.tsx` so image signing calls `createSignedAdminUpload()` and video upload calls `uploadAdminVideo()` instead of fetching `/api/uploads/sign` and `/api/uploads/video`.
- [ ] Preserve the direct PUT to signed S3 URL for image files.
- [ ] Preserve the call to `saveMediaAssetAction()` for image metadata after upload.
- [ ] Keep user-facing Portuguese upload messages unchanged unless an endpoint error is passed through.
- [ ] Run grep to verify `MediaUploadField.tsx` no longer references `/api/uploads/sign` or `/api/uploads/video`.
- [ ] Run `npm run lint:web && npm run build:web`.

### Task 4: Remove Obsolete Next Route Handlers and Wire Runtime Config

- [ ] Delete `apps/web/src/app/api/uploads/sign/route.ts`.
- [ ] Delete `apps/web/src/app/api/uploads/video/route.ts`.
- [ ] Delete `apps/web/src/app/api/media/[...key]/route.ts`.
- [ ] Update `docker-compose.yml` with backend S3 environment variables and `BACKEND_PUBLIC_URL=http://backend:8000` for server-side container URLs where appropriate.
- [ ] Update `apps/backend/.env.example` with S3 settings.
- [ ] Update `Dockerfile` so the production image still has FFmpeg where video processing now runs. If backend is not included in the production Dockerfile, document that Compose backend image installs FFmpeg or add backend Docker support as minimally as possible.
- [ ] Run grep to verify no admin UI code calls `/api/uploads/sign`, `/api/uploads/video`, or `/api/media`.
- [ ] Run `npm run lint:web && npm run build:web && docker compose config`.

### Task 5: Docs and Full Verification

- [ ] Update `README.md` to document that FastAPI now owns upload signing, video processing, and media proxying.
- [ ] Run:

```bash
npm run backend:install
npm run backend:test
npm run lint:web
npm run build:web
rm -rf apps/backend/.venv
git status --short --untracked-files=all
```

Expected: all checks pass and no generated `.venv`, `.pytest_cache`, `__pycache__`, or `.next` entries appear in normal status.

## Self-Review

- Spec coverage: storage helpers, signing, video processing, media proxying, UI switch, obsolete route deletion, config, and verification are covered.
- Placeholder scan: tasks define concrete files, endpoints, helper names, and verification commands.
- Type consistency: frontend upload client names are used by the UI task, and backend route names match the spec endpoints.
