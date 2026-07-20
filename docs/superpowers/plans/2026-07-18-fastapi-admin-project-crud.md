# FastAPI Admin Project CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move admin project and section reads/mutations from direct Next.js database calls to JWT-protected FastAPI endpoints.

**Architecture:** FastAPI gets an authenticated admin project router backed by the existing Postgres schema. Next Server Components and Server Actions keep the same UI/FormData flow but call FastAPI with `Authorization: Bearer <admin_access_token>`. Media listing/upload remains in Next for the next migration phase.

**Tech Stack:** FastAPI, psycopg, Pytest, Next.js Server Actions, HTTP-only JWT cookie, TypeScript.

---

## Scope

In scope:

- Admin project list/read/create/update/delete via FastAPI.
- Admin project sections list/create/update/delete via FastAPI.
- Existing Next admin pages/actions call FastAPI for project and section data.

Out of scope:

- Media asset listing and upload migration.
- Project media storage cleanup on delete until the media migration phase.
- Video processing migration.
- Removing `apps/web/src/lib/db/*` entirely.

## Files

- Create: `apps/backend/app/admin_projects.py`
- Create: `apps/backend/tests/test_admin_projects.py`
- Modify: `apps/backend/app/main.py`
- Create: `apps/web/src/lib/api/admin-projects.ts`
- Modify: `apps/web/src/app/admin/actions.ts`
- Modify: `apps/web/src/app/admin/page.tsx`
- Modify: `apps/web/src/app/admin/projetos/[id]/page.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectForm.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectSectionsEditor.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx`
- Modify: `apps/web/src/app/admin/components/DeleteProjectForm.tsx`
- Modify: `README.md`

## API Endpoints

- `GET /admin/projects`
- `GET /admin/projects/{project_id}`
- `POST /admin/projects`
- `PATCH /admin/projects/{project_id}`
- `DELETE /admin/projects/{project_id}`
- `GET /admin/projects/{project_id}/sections`
- `POST /admin/projects/{project_id}/sections`
- `PATCH /admin/project-sections/{section_id}`
- `DELETE /admin/project-sections/{section_id}?projectId=<project_id>`

All endpoints require `Authorization: Bearer <token>` and reuse `get_current_admin`.

## Tasks

### Task 1: Backend Admin Project Repository

- [ ] Create `apps/backend/tests/test_admin_projects.py` with fake connection/cursor tests for mapping project rows, mapping section rows, insert/update/delete SQL parameterization, and section ordering.
- [ ] Create `apps/backend/app/admin_projects.py` with `AdminProjectRepository`, row mappers, URL normalization helpers for website/Instagram, and project/section CRUD methods.
- [ ] Preserve existing validation behavior from Next actions/queries: slug uniqueness errors surface as backend errors, website/Instagram validation rejects invalid values, hero video requires `video_variant = 'scrub'` when provided, section media scope/type validation remains enforced.
- [ ] Run `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_admin_projects.py -v`.

### Task 2: Backend Admin Project Routes

- [ ] Add `admin_projects_router = APIRouter(prefix="/admin", tags=["admin-projects"])`.
- [ ] Add Pydantic request/response models for project upsert and section upsert.
- [ ] Add endpoints listed above, all depending on `get_current_admin`.
- [ ] Include `admin_projects_router` in `apps/backend/app/main.py`.
- [ ] Add route tests using dependency overrides for auth and repository.
- [ ] Run `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests -v`.

### Task 3: Web Admin Project API Client

- [ ] Create `apps/web/src/lib/api/admin-projects.ts` with `server-only`.
- [ ] Read `ADMIN_ACCESS_TOKEN_COOKIE` and call FastAPI admin endpoints with bearer auth.
- [ ] Export types `AdminProject`, `AdminProjectSectionRow`, `ProjectUpsertInput`, `ProjectSectionUpsertInput`.
- [ ] Export helpers: `getAdminProjects`, `getAdminProjectById`, `getAdminProjectSections`, `upsertAdminProject`, `deleteAdminProject`, `upsertAdminProjectSection`, `deleteAdminProjectSection`.
- [ ] Return `null` on `404` for project reads and throw useful errors for non-OK responses.
- [ ] Run `npm run lint:web`.

### Task 4: Switch Next Admin Reads and Actions to FastAPI

- [ ] Update `apps/web/src/app/admin/page.tsx` to import `getAdminProjects` from the API client.
- [ ] Update `apps/web/src/app/admin/projetos/[id]/page.tsx` to import `getAdminProjectById` and `getAdminProjectSections` from the API client. Keep media assets from `@/lib/db/queries` until media phase.
- [ ] Update `apps/web/src/app/admin/actions.ts` so project/section save/delete actions call API client helpers instead of `upsertProject`, `deleteProject`, `upsertProjectSection`, and `deleteProjectSection`.
- [ ] Keep `saveMediaAssetAction` using existing Next DB/storage until media phase.
- [ ] Update admin component types to use API client exported types instead of DB query types where needed.
- [ ] Run grep to confirm `apps/web/src/app/admin/actions.ts`, `admin/page.tsx`, and `admin/projetos/[id]/page.tsx` no longer import project/section CRUD helpers from `@/lib/db/queries`.
- [ ] Run `npm run lint:web && npm run build:web`.

### Task 5: Docs and Full Verification

- [ ] Update README to document that admin project/section CRUD now goes through FastAPI, while media upload/listing remains in Next until the next phase.
- [ ] Run:

```bash
npm run backend:install
npm run backend:test
npm run lint:web
npm run build:web
rm -rf apps/backend/.venv
git status --short
```

Expected: all checks pass and no generated `.venv`, `.pytest_cache`, `__pycache__`, or `.next` entries appear in normal status.

## Self-Review

- Spec coverage: this plan moves admin project and section CRUD to FastAPI without touching media/upload migration.
- Placeholder scan: tasks specify concrete files, endpoints, and verification commands.
- Type consistency: frontend API types become the source for admin project/section payloads used by pages/actions.
