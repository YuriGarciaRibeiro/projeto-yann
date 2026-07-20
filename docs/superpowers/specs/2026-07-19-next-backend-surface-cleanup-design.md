# Next Backend Surface Cleanup Design

## Goal

Remove obsolete backend responsibilities from `apps/web` after auth, public reads, admin CRUD, media library, upload signing, video processing, and media proxying have moved to FastAPI.

## Selected Approach

Use a safe layered cleanup. Remove only web-side database, storage, and legacy auth modules after their remaining imports are migrated to frontend-safe API types or FastAPI-backed glue. Keep `apps/web/src/lib/api/admin-auth.ts` and server actions that are still needed as UI/form transport, but ensure they do not access the database, S3, FFmpeg, password hashing, or session storage directly.

## Current Remaining Web Backend Surface

Known legacy files still present:

- `apps/web/src/lib/db/client.ts`
- `apps/web/src/lib/db/queries.ts`
- `apps/web/src/lib/db/schema.ts`
- `apps/web/src/lib/storage/s3.ts`
- `apps/web/src/lib/auth/password.ts`
- `apps/web/src/lib/auth/session.ts`

Known remaining imports to eliminate or classify:

- `@/lib/db/schema` used for enum/type imports in admin actions/components/API client.
- `@/lib/storage/s3` used for upload validation helpers in admin actions.
- `@/lib/api/admin-auth` used for JWT cookie validation and login/logout glue. This is retained because it calls FastAPI and does not own persisted auth state.

There are no remaining `apps/web/src/app/api/**/route.ts` files after Phase 6.

## Target State

- No `apps/web` runtime code imports `@/lib/db/*`.
- No `apps/web` runtime code imports `@/lib/storage/*`.
- No `apps/web` runtime code imports `@/lib/auth/*`.
- Admin forms still use server actions where needed for progressive enhancement, redirects, revalidation, and safe HTTP-only cookie access.
- Server actions call FastAPI clients only; they do not access Postgres, S3, FFmpeg, or bcrypt directly.
- Shared frontend types live under `apps/web/src/lib/api` or another frontend-safe module, not Drizzle schema files.
- Root Docker and npm workspace files still build both apps correctly.

## Type Cleanup

Create a frontend-safe type module for constants and union types currently imported from Drizzle schema:

```ts
export const mediaUsageScopes = ["site", "project"] as const;
export type MediaUsageScope = (typeof mediaUsageScopes)[number];

export const videoVariants = ["standard", "scrub"] as const;
export type VideoVariant = (typeof videoVariants)[number];

export const projectSectionTypes = [
  "parallax_video",
  "video_block",
  "image_block",
  "text_block",
  "technical_info",
  "contact_credit",
] as const;
export type ProjectSectionType = (typeof projectSectionTypes)[number];
```

This module has no database dependency and becomes the source for admin components, API clients, and actions.

## Upload Validation Cleanup

Move the small browser/server-safe upload validation constants from `apps/web/src/lib/storage/s3.ts` into a frontend-safe module, without S3 client code:

- allowed MIME types;
- image/video max sizes;
- storage key regex;
- `validateMediaUploadInput()`;
- `validateUploadStorageKey()`.

The FastAPI backend remains authoritative for storage operations and metadata URLs. The web validators are only preflight checks for better UI errors before calling FastAPI.

## Removal Rules

Delete legacy files only after grep confirms no imports remain:

- Delete `apps/web/src/lib/db/*` after schema type imports are migrated.
- Delete `apps/web/src/lib/storage/s3.ts` after validation helpers are migrated.
- Delete `apps/web/src/lib/auth/password.ts` and `apps/web/src/lib/auth/session.ts` after grep confirms no imports.

Do not delete `apps/web/src/lib/api/admin-auth.ts`; it is the FastAPI auth client/cookie bridge.

## Verification

Required checks:

```bash
rg '@/lib/(db|storage|auth)' apps/web/src
rg 'apps/web/src/app/api/.*/route.ts'
npm run backend:test
node --import tsx apps/web/src/app/admin/upload-actions.test.ts
node --import tsx apps/web/src/app/admin/project-form-errors.test.ts
npm run lint:web
npm run build:web
docker build .
docker compose config
```

Expected results:

- First grep has no matches except allowed `@/lib/api/admin-auth` imports, which do not match `@/lib/auth`.
- Route handler glob finds no files.
- Tests, lint, build, Docker build, and Compose config pass.

## Self-Review

- Scope is limited to removing obsolete Next backend surface, not changing FastAPI behavior.
- Server actions remain where they are UI glue and safe cookie transport.
- The design avoids a risky all-at-once deletion by migrating types/validators first, then deleting dead files.
