# FastAPI Full Migration Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every backend responsibility out of Next.js and into FastAPI without breaking the current portfolio/admin app.

**Architecture:** Complete the migration in small, independently testable plans. `apps/web` remains the rendering/admin UI layer; `apps/backend` becomes the owner of auth, database access, project CRUD, media CRUD, upload signing, video processing, and storage integration. Each phase keeps the app runnable and removes old Next backend code only after the replacement path is verified.

**Tech Stack:** Next.js 16, React 19, TypeScript, FastAPI, Pydantic, Pytest, Postgres, SQLAlchemy or direct SQL, bcrypt, JWT, S3/MinIO, FFmpeg, Docker Compose.

---

## Migration Order

### Phase 0: Monorepo Foundation

**Plan:** `docs/superpowers/plans/2026-07-18-fastapi-monorepo-foundation.md`

**Status:** Implemented in branch `fastapi-monorepo-foundation`.

**Result:** The repo has `apps/web`, `apps/backend`, npm workspace scripts, FastAPI `/health`, Docker/Compose updates, and README setup docs.

### Phase 1: FastAPI JWT Auth

**Plan:** `docs/superpowers/plans/2026-07-18-fastapi-jwt-auth.md`

**Goal:** Add FastAPI login, bcrypt password verification, signed JWT access tokens, and a protected `/auth/me` endpoint.

**Done When:** Backend tests cover valid login, invalid login, protected route access, missing token, and expired/invalid token.

### Phase 2: Backend Database Ownership Decision

**Goal:** Pick the short-term database owner before migrating CRUD.

**Decision:** Use Python-owned DB access for FastAPI endpoints, while keeping existing Drizzle migration files for the first migration slice. Do not change schema during this phase.

**Deliverables:** Add backend database connection module, typed project/media models, and tests that read seeded data through the backend using the existing schema.

### Phase 3: Public Project Read API

**Goal:** Move public project reads from direct Next database calls to FastAPI.

**Endpoints:**

- `GET /projects/published`
- `GET /projects/featured`
- `GET /projects/{slug}`

**Frontend Change:** `apps/web` fetches public project data from FastAPI instead of importing `@/lib/db/queries` in public route rendering.

**Done When:** `/` and `/projetos/[slug]` render from FastAPI responses and existing public pages still pass `npm run build:web`.

### Phase 4: Admin Project and Section CRUD API

**Goal:** Move admin project and project section mutations from Server Actions to FastAPI.

**Endpoints:**

- `GET /admin/projects`
- `GET /admin/projects/{id}`
- `POST /admin/projects`
- `PATCH /admin/projects/{id}`
- `DELETE /admin/projects/{id}`
- `POST /admin/projects/{id}/sections`
- `PATCH /admin/project-sections/{section_id}`
- `DELETE /admin/project-sections/{section_id}`

**Frontend Change:** Admin forms submit through HTTP calls with `Authorization: Bearer <token>` instead of Server Actions.

**Done When:** Admin can create, edit, delete, publish, and reorder project sections using FastAPI.

### Phase 5: Media Library API

**Goal:** Move media asset listing, scoped media validation, and metadata creation to FastAPI.

**Endpoints:**

- `GET /admin/media?scope=site`
- `GET /admin/projects/{id}/media`
- `POST /admin/media`

**Done When:** Project media selectors and site media selectors read from FastAPI and preserve the project/site scoping rules.

### Phase 6: Upload Signing and Video Processing API

**Goal:** Move S3/MinIO signing, upload verification, and FFmpeg video optimization to FastAPI.

**Endpoints:**

- `POST /admin/uploads/sign`
- `POST /admin/uploads/video`
- `GET /media/{key:path}` if proxying media remains necessary.

**Done When:** Image uploads use signed storage URLs from FastAPI; videos upload to FastAPI, produce standard and scrub variants, and create media asset records.

### Phase 7: Remove Next Backend Surface

**Goal:** Delete obsolete Next Server Actions, Next API route handlers, and server-only DB/storage/auth helpers after their callers are migrated.

**Remove Candidates:**

- `apps/web/src/app/api/uploads/sign/route.ts`
- `apps/web/src/app/api/uploads/video/route.ts`
- `apps/web/src/app/api/media/[...key]/route.ts` if FastAPI or public storage replaces it.
- `apps/web/src/app/admin/actions.ts`
- `apps/web/src/app/admin/login/actions.ts`
- `apps/web/src/lib/db/*` after no web imports remain.
- `apps/web/src/lib/storage/*` after no web imports remain.
- `apps/web/src/lib/auth/session.ts` after JWT replaces the cookie session flow.

**Done When:** Grep finds no remaining web imports of server-only DB/storage/auth modules, and `npm run lint:web`, `npm run build:web`, `npm run backend:test`, and `docker build .` pass.

## Cross-Phase Rules

- Do not remove a Next backend path until the frontend uses the FastAPI replacement.
- Do not change database schema while moving API boundaries unless a phase explicitly requires it.
- Keep Portuguese admin-facing error messages in the frontend.
- Keep backend errors predictable JSON and avoid leaking stack traces.
- Keep the current Postgres and S3/MinIO local development stack.
- Run backend tests, web lint, web build, and Docker build before calling any phase complete.

## Self-Review

- Spec coverage: all backend responsibilities from the design are represented: auth, public data, admin CRUD, media, uploads/video, DB/storage ownership, Docker/local development, and removal of old Next backend code.
- Placeholder scan: no placeholder implementation step is present; each phase has explicit endpoints, files, or done criteria.
- Scope control: each phase is independently testable and should get its own detailed implementation plan before execution.
