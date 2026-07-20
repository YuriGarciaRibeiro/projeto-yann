# FastAPI Media Library API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move admin media asset listing and single metadata creation from Next.js database calls to JWT-protected FastAPI endpoints.

**Architecture:** Add a focused FastAPI admin media router backed by direct SQL against the existing `media_assets` and `projects` tables. Add a server-only Next API client that uses the existing JWT cookie, then switch admin pages and the image metadata save action to that client while leaving upload signing, S3 verification, and video batch creation in Next until Phase 6.

**Tech Stack:** FastAPI, Pydantic, psycopg, Pytest, Next.js 16, TypeScript, HTTP-only JWT cookie, Postgres, S3/MinIO.

---

## Scope

In scope:

- `GET /admin/media?scope=site`
- `GET /admin/projects/{project_id}/media`
- `POST /admin/media`
- FastAPI repository, route tests, and predictable validation errors.
- Next server-only admin media API client.
- Admin page/project page media listing through FastAPI.
- `saveMediaAssetAction` metadata creation through FastAPI after the existing Next upload verification.

Out of scope:

- `POST /api/uploads/sign` migration.
- `POST /api/uploads/video` migration.
- Batch `createMediaAssets` migration for video variants.
- S3 object verification migration.
- Removing `apps/web/src/lib/db/*` or `apps/web/src/lib/storage/*`.

## Files

- Create: `apps/backend/app/admin_media.py`
- Create or modify: `apps/backend/tests/test_admin_media.py`
- Modify: `apps/backend/app/main.py`
- Create: `apps/web/src/lib/api/admin-media.ts`
- Modify: `apps/web/src/app/admin/page.tsx`
- Modify: `apps/web/src/app/admin/projetos/[id]/page.tsx`
- Modify: `apps/web/src/app/admin/actions.ts`
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
- Modify if needed: `apps/web/src/app/admin/components/ProjectForm.tsx`
- Modify if needed: `apps/web/src/app/admin/components/ProjectSectionsEditor.tsx`
- Modify if needed: `apps/web/src/app/admin/components/ProjectSectionForm.tsx`
- Modify: `README.md`

## Tasks

### Task 1: Backend Admin Media Repository

- [ ] Create `apps/backend/tests/test_admin_media.py` with fake connection/cursor tests for mapping media rows to camelCase, listing site media, listing project media, create SQL parameterization, project existence validation, scope validation, owned connection commit/rollback, and duplicate storage key handling.
- [ ] Create `apps/backend/app/admin_media.py` with `AdminMediaRepository`, media row mapper, validation helpers, `list_site_media_assets()`, `list_project_media_assets(project_id)`, and `create_media_asset(input_data)`.
- [ ] Validation rules: `usageScope` is `site` or `project`; site media clears/rejects `projectId`; project media requires `projectId` and existing project; `storageKey`, `url`, `mimeType`, and `altText` are non-empty; `sizeBytes > 0`; optional `videoVariant` is `standard` or `scrub`.
- [ ] `create_media_asset()` catches duplicate `storage_key` as a `ValueError("media_assets_storage_key_unique")`; other database errors still raise.
- [ ] Run `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_admin_media.py -v`.

### Task 2: Backend Admin Media Routes

- [ ] Add `admin_media_router = APIRouter(prefix="/admin", tags=["admin-media"])` in `apps/backend/app/admin_media.py`.
- [ ] Add Pydantic request models for media create input.
- [ ] Add `GET /admin/media?scope=site`; reject unsupported scopes with `400`.
- [ ] Add `GET /admin/projects/{project_id}/media`.
- [ ] Add `POST /admin/media`; return created media asset and map `ValueError` to `400`.
- [ ] Include `admin_media_router` in `apps/backend/app/main.py`.
- [ ] Add route tests with dependency overrides for auth and repository.
- [ ] Run `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests -v`.

### Task 3: Web Admin Media API Client

- [ ] Create `apps/web/src/lib/api/admin-media.ts` with `server-only`.
- [ ] Read `ADMIN_ACCESS_TOKEN_COOKIE` using `cookies()` and send `Authorization: Bearer <token>` to FastAPI.
- [ ] Export types `AdminMediaAsset`, `MediaUsageScope`, `VideoVariant`, and `MediaAssetCreateInput`.
- [ ] Export helpers `getAdminSiteMediaAssets()`, `getAdminProjectMediaAssets(projectId)`, and `createAdminMediaAsset(input)`.
- [ ] Throw useful errors for non-OK responses, preserving backend `detail` where available.
- [ ] Run `npm run lint:web`.

### Task 4: Switch Admin Media Reads and Image Metadata Create to FastAPI

- [ ] Update `apps/web/src/app/admin/page.tsx` to import `getAdminSiteMediaAssets` from `@/lib/api/admin-media` instead of `@/lib/db/queries`.
- [ ] Update `apps/web/src/app/admin/projetos/[id]/page.tsx` to import `getAdminProjectMediaAssets` from `@/lib/api/admin-media` instead of `@/lib/db/queries`.
- [ ] Update `apps/web/src/app/admin/actions.ts` so `saveMediaAssetAction` calls `createAdminMediaAsset()` instead of `createMediaAsset()`.
- [ ] Keep `validateMediaUploadInput`, `validateUploadStorageKey`, `verifyUploadedMediaObject`, and `getMediaDeliveryUrl` in `saveMediaAssetAction` until Phase 6.
- [ ] Update media-related component imports/types from DB schema to API client types where needed.
- [ ] Do not change `apps/web/src/app/api/uploads/video/route.ts`; it may continue using `createMediaAssets()` until Phase 6.
- [ ] Run grep to confirm `apps/web/src/app/admin/actions.ts`, `apps/web/src/app/admin/page.tsx`, and `apps/web/src/app/admin/projetos/[id]/page.tsx` no longer import media listing or single-create helpers from `@/lib/db/queries`.
- [ ] Run `npm run lint:web && npm run build:web`.

### Task 5: Docs and Full Verification

- [ ] Update `README.md` to document that admin media listing and image metadata creation now go through FastAPI, while upload signing and video processing remain in Next until Phase 6.
- [ ] Run:

```bash
npm run backend:install
npm run backend:test
npm run lint:web
npm run build:web
docker build .
docker compose config
rm -rf apps/backend/.venv
git status --short --untracked-files=all
```

Expected: all checks pass and no generated `.venv`, `.pytest_cache`, `__pycache__`, or `.next` entries appear in normal status.

## Self-Review

- Spec coverage: the plan covers media listing and single metadata creation, and explicitly leaves upload signing/video processing for Phase 6.
- Placeholder scan: every task has concrete files, endpoints, helpers, and verification commands.
- Type consistency: API client type names are reused by admin media components and actions.
