# FastAPI Upload and Video API Design

## Goal

Move upload signing, S3/MinIO object operations, video optimization, media metadata creation for video variants, and media proxying from Next.js route handlers to FastAPI.

## Selected Approach

Use direct FastAPI ownership. The admin UI calls FastAPI endpoints directly for image signed uploads and video uploads. The existing Next upload route handlers are removed after the UI no longer calls them. FastAPI also owns media proxy delivery for deployments that do not expose a public S3 base URL.

## API

All admin upload endpoints require `Authorization: Bearer <admin_access_token>`.

- `POST /admin/uploads/sign`
- `POST /admin/uploads/video`
- `GET /media/{storage_key:path}`

`POST /admin/uploads/sign` accepts JSON:

```json
{
  "fileName": "image.webp",
  "mimeType": "image/webp",
  "size": 120000
}
```

It rejects videos because videos must pass through server-side optimization. It returns:

```json
{
  "storageKey": "uploads/2026/07/uuid-image.webp",
  "uploadUrl": "https://signed-put-url",
  "url": "http://localhost:8000/media/uploads/2026/07/uuid-image.webp"
}
```

`POST /admin/uploads/video` accepts multipart form data:

- `file`: uploaded video file.
- `altText`: display name.
- `usageScope`: `site` or `project`.
- `projectId`: required when `usageScope=project`.

It creates two MP4 variants with FFmpeg:

- `scrub`: no audio, H.264, `scale='min(1920,iw)':-2`, `preset=slow`, `crf=22`, `maxrate=5500k`, `bufsize=9000k`, `yuv420p`, `faststart`, fixed GOP 12.
- `standard`: audio preserved as AAC, H.264, `scale='min(1920,iw)':-2`, `preset=slow`, `crf=20`, `yuv420p`, `faststart`.

It uploads both objects to S3/MinIO, inserts two `media_assets` rows through the existing FastAPI admin media repository, and returns `{ "ok": true, "requestId": "..." }`.

`GET /media/{storage_key:path}` validates storage keys, fetches objects from S3/MinIO, forwards `Range` headers, and returns cacheable media responses with `Accept-Ranges` where available.

## Storage Configuration

FastAPI gains backend settings for:

- `BACKEND_S3_ENDPOINT`
- `BACKEND_S3_REGION`
- `BACKEND_S3_BUCKET`
- `BACKEND_S3_ACCESS_KEY_ID`
- `BACKEND_S3_SECRET_ACCESS_KEY`
- `BACKEND_S3_PUBLIC_BASE_URL` optional

When `BACKEND_S3_PUBLIC_BASE_URL` exists, media URLs use that public base. Otherwise media URLs use `BACKEND_PUBLIC_URL` if configured, falling back to `/media/{storage_key}`.

## Frontend Data Flow

- `MediaUploadField` uses the FastAPI admin upload client for both signing and video upload.
- Image uploads still PUT directly to the signed S3 URL, then call `saveMediaAssetAction`, which already creates metadata through FastAPI from Phase 5.
- Video uploads post the `File` directly to FastAPI; FastAPI writes storage objects and metadata.
- Admin UI no longer calls `/api/uploads/sign` or `/api/uploads/video`.
- Public/media rendering receives URLs returned by FastAPI media rows. If no public S3 base exists, those URLs point at FastAPI `/media/...`.

## Cleanup

After the UI calls FastAPI directly, delete obsolete Next route handlers:

- `apps/web/src/app/api/uploads/sign/route.ts`
- `apps/web/src/app/api/uploads/video/route.ts`
- `apps/web/src/app/api/media/[...key]/route.ts`

Do not remove `apps/web/src/lib/storage/s3.ts` yet if `saveMediaAssetAction` still uses validation helpers. Removing all Next storage helpers belongs to Phase 7 cleanup after any remaining imports are gone.

## Testing

- Backend storage unit tests cover MIME/size validation, storage key sanitization/pattern validation, media URL generation, signed PUT creation, object verification, delete cleanup, and range proxy behavior with mocked S3.
- Backend upload route tests cover auth, image signing, video rejection in signing, validation errors, video success path with mocked FFmpeg/storage/repository, and video cleanup on failure after partial upload.
- Web client tests or lint/build cover direct FastAPI upload client usage.
- Grep verifies the admin UI no longer references `/api/uploads/sign`, `/api/uploads/video`, or `/api/media` route handlers.

## Self-Review

- The design implements direct FastAPI ownership, not wrapper-based migration.
- It preserves the current video encoding parameters.
- It leaves only validation helpers in Next if still needed, with final removal deferred to Phase 7.
