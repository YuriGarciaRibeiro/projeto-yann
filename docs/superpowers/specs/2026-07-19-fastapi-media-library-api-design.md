# FastAPI Media Library API Design

## Goal

Move admin media asset listing and metadata creation from Next.js database calls to JWT-protected FastAPI endpoints, while keeping upload signing, S3 verification, and video processing in Next.js until the next migration phase.

## Scope

In scope:

- List global site media assets through FastAPI.
- List project-scoped media assets through FastAPI.
- Create a single media asset metadata row through FastAPI after an image upload has already been signed, uploaded, and verified by the existing Next flow.
- Keep the existing `media_assets` schema and scoping rules.
- Switch admin pages and image-upload save action to use the FastAPI media client.

Out of scope:

- `/api/uploads/sign` migration.
- `/api/uploads/video` migration.
- Batch video variant creation currently used by the Next video upload route.
- S3 object verification migration.
- Removing `apps/web/src/lib/db/queries.ts` or `apps/web/src/lib/storage/*`.

## API

All endpoints require `Authorization: Bearer <admin_access_token>` and reuse the existing FastAPI admin auth dependency.

- `GET /admin/media?scope=site`
- `GET /admin/projects/{project_id}/media`
- `POST /admin/media`

`POST /admin/media` accepts:

```json
{
  "storageKey": "uploads/example.webp",
  "url": "http://localhost:9000/architecture-portfolio/uploads/example.webp",
  "mimeType": "image/webp",
  "sizeBytes": 120000,
  "altText": "Example",
  "usageScope": "project",
  "projectId": "project-uuid-or-null",
  "width": null,
  "height": null,
  "durationSeconds": null,
  "videoVariant": null
}
```

## Validation

- `usageScope` must be `site` or `project`.
- Site media must not have `projectId`.
- Project media must have `projectId`.
- `storageKey`, `url`, `mimeType`, and `altText` must be non-empty strings.
- `sizeBytes` must be greater than zero.
- If `videoVariant` is present, it must be `standard` or `scrub`.
- Project-scoped creates must verify that the project exists before inserting metadata.
- Duplicate `storage_key` errors return a predictable `400` detail instead of leaking a database exception.

## Frontend Data Flow

- `apps/web/src/lib/api/admin-media.ts` reads `admin_access_token` from the HTTP-only cookie and calls the FastAPI media endpoints.
- `apps/web/src/app/admin/page.tsx` loads site media through `getAdminSiteMediaAssets()` from the API client.
- `apps/web/src/app/admin/projetos/[id]/page.tsx` loads project media through `getAdminProjectMediaAssets(project.id)` from the API client.
- `saveMediaAssetAction` keeps validating upload input and verifying S3 object existence in Next, then calls `createAdminMediaAsset()` instead of writing directly with Drizzle.
- The video upload route keeps using the existing DB helper for batch variant creation until Phase 6.

## Testing

- Backend fake cursor tests cover row mapping, list SQL scoping, create SQL parameterization, project existence validation, scope validation, and duplicate storage key handling.
- Backend route tests cover auth requirement, site listing, project listing, successful create, validation errors, duplicate storage key, and missing project.
- Web lint/build verify the API client and admin page/action imports.
- Grep verifies admin pages/actions no longer import media listing or single create helpers from `@/lib/db/queries`, while the video route may still import `createMediaAssets`.

## Self-Review

- No schema changes are required.
- Upload/video migration remains explicitly out of scope.
- The spec keeps media creation single-row only because current image upload uses a single metadata row and video batch creation belongs to Phase 6.
