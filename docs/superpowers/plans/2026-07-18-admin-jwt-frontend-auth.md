# Admin JWT Frontend Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch the Next admin authentication gate from the old local signed session cookie to FastAPI JWT auth.

**Architecture:** The login Server Action calls FastAPI `POST /auth/login` and stores the returned access token in an HTTP-only cookie named `admin_access_token`. Admin pages, proxy, upload routes, and existing Server Actions validate that cookie by calling FastAPI `GET /auth/me`. CRUD still uses existing Next DB actions for now, but access control is backed by FastAPI JWT.

**Tech Stack:** Next.js Server Actions, Next proxy, FastAPI JWT endpoints, HTTP-only cookies, TypeScript.

---

## Files

- Create: `apps/web/src/lib/api/admin-auth.ts`
- Modify: `apps/web/src/app/admin/login/actions.ts`
- Modify: `apps/web/src/app/admin/login/page.tsx`
- Modify: `apps/web/src/proxy.ts`
- Modify: `apps/web/src/app/admin/actions.ts`
- Modify: `apps/web/src/app/admin/page.tsx`
- Modify: `apps/web/src/app/admin/projetos/[id]/page.tsx`
- Modify: `apps/web/src/app/admin/projetos/novo/page.tsx`
- Modify: `apps/web/src/app/api/uploads/sign/route.ts`
- Modify: `apps/web/src/app/api/uploads/video/route.ts`
- Modify: `README.md`

## Tasks

### Task 1: Admin Auth API Client

- [ ] Create `apps/web/src/lib/api/admin-auth.ts` with `server-only`.
- [ ] Export `ADMIN_ACCESS_TOKEN_COOKIE = "admin_access_token"`.
- [ ] Export cookie helpers `getAdminAccessTokenCookieOptions(expiresInSeconds)` and `getExpiredAdminAccessTokenCookieOptions()`.
- [ ] Export `loginAdminWithPassword(email, password)` that calls `POST /auth/login` at `BACKEND_PUBLIC_URL` fallback `http://localhost:8000`, returns `{ accessToken, expiresIn }`, returns `null` on `401`, throws on other failures.
- [ ] Export `verifyAdminAccessToken(token)` that calls `GET /auth/me` with `Authorization: Bearer`, returns current admin or null on `401`, throws on other failures.
- [ ] Run `npm run lint:web`.

### Task 2: Login and Logout Use FastAPI JWT

- [ ] Update `apps/web/src/app/admin/login/actions.ts` to remove DB/password/session imports and call `loginAdminWithPassword`.
- [ ] Set `ADMIN_ACCESS_TOKEN_COOKIE` on successful login using returned `expiresIn`.
- [ ] Expire `ADMIN_ACCESS_TOKEN_COOKIE` on logout.
- [ ] Update `apps/web/src/app/admin/login/page.tsx` to redirect when `verifyAdminAccessToken(cookie)` succeeds.
- [ ] Run `npm run lint:web`.

### Task 3: Admin Guards Use FastAPI JWT

- [ ] Update `apps/web/src/proxy.ts` to validate `ADMIN_ACCESS_TOKEN_COOKIE` with `GET /auth/me`.
- [ ] Update `apps/web/src/app/admin/actions.ts` `requireAdminSession()` to validate `ADMIN_ACCESS_TOKEN_COOKIE` via `verifyAdminAccessToken`.
- [ ] Update admin page guards in `admin/page.tsx`, `admin/projetos/[id]/page.tsx`, and `admin/projetos/novo/page.tsx`.
- [ ] Update upload route guards in `api/uploads/sign/route.ts` and `api/uploads/video/route.ts`.
- [ ] Run grep to confirm no admin route/action/proxy imports `@/lib/auth/session`.

### Task 4: Docs and Verification

- [ ] Update README to say admin login now uses FastAPI JWT and stores it in `admin_access_token` HTTP-only cookie.
- [ ] Run:

```bash
npm run backend:install
npm run backend:test
npm run lint:web
npm run build:web
rm -rf apps/backend/.venv
git status --short
```

Expected: backend tests, lint, build, Docker build, and Compose config pass. Normal git status does not show generated `.venv`, `.pytest_cache`, `__pycache__`, or `.next` entries.

## Self-Review

- Spec coverage: this plan migrates frontend admin auth to FastAPI JWT while preserving existing admin CRUD implementation for later phases.
- Placeholder scan: no placeholders remain; each task has concrete files and verification.
- Type consistency: cookie name and auth helpers are centralized in `admin-auth.ts`.
