# FastAPI Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the repository into `apps/web` and `apps/backend`, add a minimal FastAPI backend, and keep the existing Next.js app working.

**Architecture:** This is the first safe migration slice. The existing Next.js app moves into `apps/web` without changing its runtime behavior. A new `apps/backend` FastAPI service starts independently with config, CORS, tests, and `/health`, but does not yet take over auth, data, uploads, or storage.

**Tech Stack:** Next.js 16, React 19, TypeScript, npm workspaces, FastAPI, Uvicorn, Pytest, Python `pip`, Docker Compose, Postgres, MinIO.

---

## Scope

This plan implements only the monorepo foundation. The larger backend migration will need follow-up plans for JWT auth, data APIs, upload/media APIs, and removing Next.js backend code.

## File Structure

Create or modify these files:

- Modify: `package.json` to become the monorepo root package with npm workspace scripts.
- Move: current web app files into `apps/web/`.
- Modify: `apps/web/package.json` to keep existing Next scripts and dependencies.
- Modify: `apps/web/tsconfig.json` if path aliases need to remain relative to the web app.
- Modify: `apps/web/drizzle.config.ts` so Drizzle still resolves `src/lib/db/schema.ts` from `apps/web`.
- Modify: `Dockerfile` to build and run the web app from `apps/web`.
- Modify: `docker-compose.yml` to add `backend`, keep `web`, and mount MinIO CORS from the new path if needed.
- Modify: `.dockerignore` to ignore new backend virtualenv/cache files.
- Modify: `README.md` with monorepo local setup commands.
- Create: `apps/backend/requirements.txt` for Python dependencies.
- Create: `apps/backend/requirements-dev.txt` for test dependencies.
- Create: `apps/backend/app/__init__.py`.
- Create: `apps/backend/app/config.py` for environment parsing.
- Create: `apps/backend/app/main.py` for FastAPI app creation and `/health`.
- Create: `apps/backend/tests/test_health.py` for backend health tests.
- Create: `apps/backend/.env.example` documenting backend env vars.

Do not migrate authentication, database access, uploads, or Server Actions in this plan.

## Tasks

### Task 1: Add FastAPI Health Endpoint With Tests

**Files:**

- Create: `apps/backend/requirements.txt`
- Create: `apps/backend/requirements-dev.txt`
- Create: `apps/backend/app/__init__.py`
- Create: `apps/backend/app/config.py`
- Create: `apps/backend/app/main.py`
- Create: `apps/backend/tests/test_health.py`
- Create: `apps/backend/.env.example`

- [ ] **Step 1: Write backend dependencies**

Create `apps/backend/requirements.txt`:

```txt
fastapi==0.116.1
uvicorn[standard]==0.35.0
pydantic-settings==2.10.1
```

Create `apps/backend/requirements-dev.txt`:

```txt
-r requirements.txt
pytest==8.4.1
httpx==0.28.1
```

- [ ] **Step 2: Write backend config**

Create `apps/backend/app/__init__.py` as an empty file.

Create `apps/backend/app/config.py`:

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Paralax API"
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="BACKEND_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 3: Write FastAPI app and health endpoint**

Create `apps/backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


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

    return app


app = create_app()
```

- [ ] **Step 4: Write backend health test**

Create `apps/backend/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 5: Write backend env example**

Create `apps/backend/.env.example`:

```dotenv
BACKEND_APP_NAME="Paralax API"
BACKEND_CORS_ORIGINS='["http://localhost:3000"]'
```

- [ ] **Step 6: Run backend tests**

Run:

```bash
python3 -m venv apps/backend/.venv
apps/backend/.venv/bin/pip install -r apps/backend/requirements-dev.txt
PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests -v
```

Expected: `test_health_returns_ok` passes.

- [ ] **Step 7: Checkpoint**

Do not commit unless the user explicitly requested commits. If commits are authorized, run:

```bash
git add apps/backend
git commit -m "feat: add fastapi backend foundation"
```

### Task 2: Move Existing Next App Into `apps/web`

**Files:**

- Move to `apps/web/`: `src`, `public`, `scripts`, `drizzle`, `package.json`, `next.config.ts`, `tsconfig.json`, `next-env.d.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `drizzle.config.ts`
- Keep at root: `.env`, `.env.example`, `README.md`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.gitignore`, docs, AGENTS/CLAUDE files
- Modify: `apps/web/package.json`

- [ ] **Step 1: Read Next.js migration-relevant docs**

Because `AGENTS.md` says this Next.js version has breaking changes, inspect the local Next docs before moving project files.

Run:

```bash
ls node_modules/next/dist/docs
```

Expected: docs directory exists. Read the relevant app/config docs before editing Next files.

- [ ] **Step 2: Create app directory**

Run:

```bash
mkdir -p apps/web
```

Expected: `apps/web` exists.

- [ ] **Step 3: Copy current package into web workspace**

Run this before replacing root `package.json`:

```bash
cp package.json apps/web/package.json
```

Expected: `apps/web/package.json` contains the current Next app dependencies and scripts.

- [ ] **Step 4: Move web app files**

Run:

```bash
mv src public scripts drizzle next.config.ts tsconfig.json next-env.d.ts postcss.config.mjs eslint.config.mjs drizzle.config.ts apps/web/
```

Expected: those files now exist under `apps/web`.

- [ ] **Step 5: Update `apps/web/package.json` name**

Change only the package name in `apps/web/package.json`:

```json
{
  "name": "@paralax/web",
  "version": "0.1.0",
  "private": true
}
```

Preserve the existing `scripts`, `dependencies`, and `devDependencies` from the original file.

- [ ] **Step 6: Verify TypeScript path alias remains valid**

Confirm `apps/web/tsconfig.json` still contains:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

Expected: no change required because `src` moved with `tsconfig.json`.

- [ ] **Step 7: Verify Drizzle config remains valid**

Confirm `apps/web/drizzle.config.ts` still contains:

```ts
schema: "./src/lib/db/schema.ts",
out: "./drizzle",
```

Expected: no change required when Drizzle is run from the `apps/web` workspace.

- [ ] **Step 8: Checkpoint**

Do not commit unless the user explicitly requested commits. If commits are authorized, run:

```bash
git add apps/web
git commit -m "chore: move next app into web workspace"
```

### Task 3: Convert Root Package Into npm Workspace

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Replace root `package.json` with workspace scripts**

Root `package.json` should be:

```json
{
  "name": "paralax-monorepo",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/web"
  ],
  "scripts": {
    "dev": "npm run dev:web",
    "dev:web": "npm --workspace apps/web run dev",
    "dev:backend": "PYTHONPATH=apps/backend apps/backend/.venv/bin/uvicorn app.main:app --reload --app-dir apps/backend --host 0.0.0.0 --port 8000",
    "build": "npm run build:web",
    "build:web": "npm --workspace apps/web run build",
    "start": "npm run start:web",
    "start:web": "npm --workspace apps/web run start",
    "start:prod": "npm --workspace apps/web run start:prod",
    "lint": "npm run lint:web",
    "lint:web": "npm --workspace apps/web run lint",
    "db:generate": "npm --workspace apps/web run db:generate",
    "db:migrate": "npm --workspace apps/web run db:migrate",
    "db:studio": "npm --workspace apps/web run db:studio",
    "seed": "npm --workspace apps/web run seed",
    "backend:install": "python3 -m venv apps/backend/.venv && apps/backend/.venv/bin/pip install -r apps/backend/requirements-dev.txt",
    "backend:test": "PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests -v"
  }
}
```

- [ ] **Step 2: Run npm install**

Run:

```bash
npm install
```

Expected: root `package-lock.json` updates to include workspace metadata.

- [ ] **Step 3: Run web lint**

Run:

```bash
npm run lint:web
```

Expected: lint passes with the same warnings, if any, as before the move.

- [ ] **Step 4: Run web build**

Run:

```bash
npm run build:web
```

Expected: Next build passes from `apps/web`.

- [ ] **Step 5: Checkpoint**

Do not commit unless the user explicitly requested commits. If commits are authorized, run:

```bash
git add package.json package-lock.json apps/web/package.json
git commit -m "chore: configure npm workspace"
```

### Task 4: Update Docker and Compose for Monorepo Apps

**Files:**

- Modify: `Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `.dockerignore`

- [ ] **Step 1: Update Dockerfile for workspace build**

Replace `Dockerfile` with:

```Dockerfile
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN npm run build:web

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN apk add --no-cache ffmpeg

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/src ./apps/web/src
COPY --from=builder /app/apps/web/scripts ./apps/web/scripts
COPY --from=builder /app/apps/web/drizzle ./apps/web/drizzle
COPY --from=builder /app/apps/web/drizzle.config.ts ./apps/web/drizzle.config.ts
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

- [ ] **Step 2: Update Docker Compose services**

Modify `docker-compose.yml` so `web` remains on port `3000` and add `backend` on port `8000`:

```yaml
  backend:
    image: python:3.12-slim
    working_dir: /app/apps/backend
    command: >
      sh -c "pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000"
    restart: unless-stopped
    volumes:
      - .:/app
    environment:
      BACKEND_APP_NAME: Paralax API
      BACKEND_CORS_ORIGINS: '["http://localhost:3000"]'
    ports:
      - "8000:8000"
```

Keep the existing `postgres`, `minio`, and `minio-init` services unchanged unless file moves break their mounted paths.

- [ ] **Step 3: Update `.dockerignore`**

Ensure `.dockerignore` includes:

```gitignore
apps/backend/.venv
apps/backend/__pycache__
apps/backend/.pytest_cache
**/__pycache__
**/.pytest_cache
```

Preserve existing ignores for secrets, dependencies, build output, local media, and tool state.

- [ ] **Step 4: Build web Docker image**

Run:

```bash
docker build .
```

Expected: Docker image builds successfully.

- [ ] **Step 5: Check backend service health through Compose**

Run:

```bash
docker compose up -d backend
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

- [ ] **Step 6: Stop backend service**

Run:

```bash
docker compose stop backend
```

Expected: backend service stops without affecting persisted Postgres/MinIO volumes.

- [ ] **Step 7: Checkpoint**

Do not commit unless the user explicitly requested commits. If commits are authorized, run:

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "chore: update docker for monorepo apps"
```

### Task 5: Update Documentation and Final Verification

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Update README local setup commands**

In `README.md`, update the local setup section to show monorepo commands:

```bash
docker compose up -d postgres minio minio-init
npm install
npm run backend:install
npm run db:migrate
npm run seed
npm run dev:web
npm run dev:backend
```

Explain that the public site remains at `http://localhost:3000`, admin remains at `http://localhost:3000/admin`, and FastAPI runs at `http://localhost:8000` with health at `/health`.

- [ ] **Step 2: Document app responsibilities**

Add a short monorepo section to `README.md`:

```md
## Monorepo Layout

- `apps/web`: Next.js frontend and current admin UI. During migration it still contains the existing Server Actions and Next route handlers.
- `apps/backend`: FastAPI backend. It starts with `/health` and will gradually take over auth, data, uploads, and media processing.
```

- [ ] **Step 3: Run backend tests**

Run:

```bash
npm run backend:test
```

Expected: backend tests pass.

- [ ] **Step 4: Run web lint**

Run:

```bash
npm run lint:web
```

Expected: lint passes.

- [ ] **Step 5: Run web build**

Run:

```bash
npm run build:web
```

Expected: build passes.

- [ ] **Step 6: Run Docker build**

Run:

```bash
docker build .
```

Expected: Docker build passes.

- [ ] **Step 7: Check Git status**

Run:

```bash
git status --short
```

Expected: only files touched by this plan are modified or added.

- [ ] **Step 8: Checkpoint**

Do not commit unless the user explicitly requested commits. If commits are authorized, run:

```bash
git add README.md docs/superpowers/plans/2026-07-18-fastapi-monorepo-foundation.md
git commit -m "docs: document fastapi monorepo setup"
```

## Self-Review

- Spec coverage: this plan covers the initial monorepo structure, independent FastAPI `/health`, local dev commands, Docker Compose shape, and preservation of the current web app. JWT auth, project APIs, upload APIs, and removing old Next backend code are explicitly deferred to follow-up plans.
- Placeholder scan: no placeholder markers or undefined implementation instructions remain.
- Type consistency: backend module paths consistently use `app.main:app`; root scripts and tests set `PYTHONPATH=apps/backend`; web scripts consistently use the `apps/web` npm workspace.
