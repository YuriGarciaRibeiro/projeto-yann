# FastAPI Public Project API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move public project reads for `/` and `/projetos/[slug]` from direct Next.js database access to FastAPI endpoints.

**Architecture:** FastAPI exposes public read-only project endpoints backed by the existing Postgres schema. The API response intentionally mirrors the current `getPublishedProjectBySlugWithMedia()` shape so `ProjectPage` needs minimal changes. `apps/web` gets a small server-side API client and public routes stop importing `@/lib/db/queries`.

**Tech Stack:** FastAPI, psycopg, Pydantic, Pytest, Next.js 16 server components, TypeScript, Docker Compose.

---

## API Contract

### `GET /projects/featured`

Returns the first published project for the root redirect.

```json
{
  "id": "project-id",
  "slug": "sala-02"
}
```

If there is no published project, returns `null` with status `200`.

### `GET /projects/{slug}`

Returns the published project page payload currently rendered by `ProjectPage`.

If the slug does not exist or is unpublished, returns `404` with:

```json
{
  "detail": "Project not found."
}
```

### `GET /projects/published`

Returns a list of published project rows ordered by year desc and creation date desc. This endpoint is included now for the migration roadmap even if the web UI does not consume it yet.

## File Structure

- Create: `apps/backend/app/public_projects.py` for SQL repository, row mapping, and router.
- Create: `apps/backend/tests/test_public_projects.py` for mapper/repository/route tests with fake connections.
- Modify: `apps/backend/app/main.py` to include public project routes.
- Modify: `apps/web/src/lib/env.ts` to add `BACKEND_PUBLIC_URL` for server-side API fetches.
- Modify: `apps/web/.env.example` to document `BACKEND_PUBLIC_URL`.
- Create: `apps/web/src/lib/api/public-projects.ts` for server-side fetch helpers and exported project payload types.
- Modify: `apps/web/src/app/page.tsx` to call `getFeaturedProject()` from the API client.
- Modify: `apps/web/src/app/projetos/[slug]/page.tsx` to call `getPublishedProjectBySlug()` from the API client.
- Modify: `apps/web/src/app/components/project-page/ProjectPage.tsx` to import the API payload type instead of deriving it from DB queries.
- Modify: `README.md` to document public project API migration.

## Tasks

### Task 1: Backend Public Project Repository

**Files:**

- Create: `apps/backend/app/public_projects.py`
- Create: `apps/backend/tests/test_public_projects.py`

- [ ] **Step 1: Write mapper and repository tests**

Create tests that use fake connection/cursor objects and verify:

```python
def test_map_media_asset_converts_row_to_camel_case_or_none(): ...
def test_map_project_payload_includes_media_and_sections(): ...
def test_repository_get_featured_project_uses_published_filter(): ...
def test_repository_get_by_slug_returns_none_when_project_missing(): ...
```

The fake cursor must record SQL and params. The featured SQL must include `is_published = true`. The slug SQL must pass the slug as a parameter.

- [ ] **Step 2: Run tests to verify they fail**

Run: `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_public_projects.py -v`

Expected: FAIL because `app.public_projects` does not exist.

- [ ] **Step 3: Implement `apps/backend/app/public_projects.py`**

Implement:

- `public_projects_router = APIRouter(prefix="/projects", tags=["projects"])`
- `map_media_asset(row: Optional[dict[str, object]]) -> Optional[dict[str, object]]`
- `map_project(row: dict[str, object]) -> dict[str, object]`
- `map_section(row: dict[str, object]) -> dict[str, object]`
- `PostgresPublicProjectRepository.get_featured_project()`
- `PostgresPublicProjectRepository.get_published_projects()`
- `PostgresPublicProjectRepository.get_project_by_slug(slug: str)`

Use SQL aliases that already match the web payload keys, including `shortDescription`, `clientArchitectName`, `heroVideoAssetId`, `fallbackImageAssetId`, `sortOrder`, `primaryMediaAssetId`, `posterMediaAssetId`, `isEnabled`, `storageKey`, `mimeType`, `sizeBytes`, `altText`, `usageScope`, `projectId`, `durationSeconds`, and `videoVariant`.

For media URLs, return `url` from the database for now; CDN/proxy behavior remains unchanged until media migration.

- [ ] **Step 4: Run backend public project tests**

Run: `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_public_projects.py -v`

Expected: PASS.

### Task 2: Backend Public Project Routes

**Files:**

- Modify: `apps/backend/app/public_projects.py`
- Modify: `apps/backend/app/main.py`
- Modify: `apps/backend/tests/test_public_projects.py`

- [ ] **Step 1: Add route tests with dependency override**

Add tests for:

```python
def test_featured_route_returns_project_summary_or_null(): ...
def test_published_route_returns_project_list(): ...
def test_project_by_slug_route_returns_payload(): ...
def test_project_by_slug_route_returns_404_for_missing_project(): ...
```

- [ ] **Step 2: Implement route dependency and routes**

Add:

- `get_public_project_repository() -> PublicProjectRepository`
- `GET /projects/featured`
- `GET /projects/published`
- `GET /projects/{slug}`

Use `HTTPException(status_code=404, detail="Project not found.")` for missing slug.

- [ ] **Step 3: Include router in `main.py`**

Add `app.include_router(public_projects_router)` while preserving auth router and `/health`.

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests -v`

Expected: PASS.

### Task 3: Web Public Project API Client

**Files:**

- Modify: `apps/web/src/lib/env.ts`
- Modify: `apps/web/.env.example`
- Create: `apps/web/src/lib/api/public-projects.ts`

- [ ] **Step 1: Add `BACKEND_PUBLIC_URL` env field**

Add `BACKEND_PUBLIC_URL` as optional URL with default fallback in API client to `http://localhost:8000`.

- [ ] **Step 2: Add web env example**

Add `BACKEND_PUBLIC_URL="http://localhost:8000"` to `apps/web/.env.example`.

- [ ] **Step 3: Create API client**

Create helpers:

- `getFeaturedProject(): Promise<{ id: string; slug: string } | null>`
- `getPublishedProjectBySlug(slug: string): Promise<PublishedProjectPageData | null>`

Use `fetch(..., { cache: "no-store" })`. Return `null` for `404` on project slug. Throw for other non-OK statuses.

Export `PublishedProjectPageData` matching the existing `ProjectPage` data shape.

### Task 4: Switch Public Web Routes to FastAPI

**Files:**

- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/projetos/[slug]/page.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectPage.tsx`

- [ ] **Step 1: Replace root route DB import**

Use `getFeaturedProject()` from `@/lib/api/public-projects` in `apps/web/src/app/page.tsx`.

- [ ] **Step 2: Replace project route DB import**

Use `getPublishedProjectBySlug()` from `@/lib/api/public-projects` in metadata and page rendering.

- [ ] **Step 3: Replace `ProjectPage` data type import**

Import `type PublishedProjectPageData` from `@/lib/api/public-projects`.

- [ ] **Step 4: Verify no public route DB imports remain**

Run: `rg '@/lib/db/queries|getPublishedProjectBySlugWithMedia|getFirstPublishedProjectForRoot' apps/web/src/app/page.tsx apps/web/src/app/projetos apps/web/src/app/components/project-page/ProjectPage.tsx`

Expected: no matches.

### Task 5: Documentation and Verification

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Document public project API**

Add a note under `FastAPI Auth` or `Monorepo Layout`:

```md
The public project pages now read project data from FastAPI:

- `GET /projects/featured`
- `GET /projects/published`
- `GET /projects/{slug}`

Set `BACKEND_PUBLIC_URL` in `apps/web/.env.local` when the backend is not running at `http://localhost:8000`.
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run backend:install
npm run backend:test
npm run lint:web
npm run build:web
rm -rf apps/backend/.venv
git status --short
```

Expected: backend tests pass, web lint/build pass, Docker build passes, Compose config succeeds, and no generated `.venv`, `.pytest_cache`, `__pycache__`, or `.next` files appear in normal status.

## Self-Review

- Spec coverage: this plan implements the roadmap phase for public project reads and switches `/` plus `/projetos/[slug]` away from direct web DB queries.
- Placeholder scan: each task has concrete files, endpoint names, commands, and expected results.
- Type consistency: the web client exports `PublishedProjectPageData`, and `ProjectPage` consumes that same type.
