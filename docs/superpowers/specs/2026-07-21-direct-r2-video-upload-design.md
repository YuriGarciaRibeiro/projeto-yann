# Direct R2 Video Upload Design

## Goal

Move admin video uploads out of the Next.js front service so large video files no longer pass through the Railway front container. The browser should upload raw videos directly to Cloudflare R2 with a signed URL, then ask the backend to process that uploaded object into the existing media variants.

This should reduce front-service RAM, CPU, and network usage while preserving automatic video optimization.

## Current Flow

The admin currently uploads videos through the web app route:

```txt
Browser -> Next /admin/uploads/video -> Backend /admin/uploads/video -> Storage
```

The Next route streams the multipart request body to the backend, but the front service still participates in the heavy upload path. The web app also keeps large Next body/proxy limits to support this path.

Images already use a lighter pattern:

```txt
Browser -> signed storage URL
Browser -> backend metadata save
```

Video should follow the same upload shape while retaining backend processing.

## Proposed Flow

```txt
Admin selects video
-> Front asks backend for a signed raw-video upload URL
-> Backend validates file metadata and returns uploadUrl + sourceStorageKey
-> Browser PUTs the video file directly to R2
-> Front asks backend to process sourceStorageKey
-> Backend reads the raw object from R2
-> Backend generates standard/scrub variants
-> Backend writes final variants to R2
-> Backend creates media_assets records
-> Front refreshes the media library
```

The front service will never receive the raw video body.

## Backend API

Add or adapt backend endpoints under the existing admin upload area.

### `POST /admin/uploads/video/sign`

Input:

```json
{
  "fileName": "project-video.mp4",
  "mimeType": "video/mp4",
  "size": 123456789
}
```

Behavior:

- Require admin authentication.
- Validate MIME type and size using the existing media upload validation rules.
- Require a video MIME type.
- Generate a raw source storage key under a dedicated prefix such as `uploads/raw/YYYY/MM/{uuid}-{filename}`.
- Return a signed R2 `PUT` URL for that key.

Response:

```json
{
  "uploadUrl": "https://storage.example/upload-signature",
  "sourceStorageKey": "uploads/raw/2026/07/018f7d7a-8b6f-7123-9abc-project-video.mp4"
}
```

### `POST /admin/uploads/video/process`

Input:

```json
{
  "sourceStorageKey": "uploads/raw/2026/07/018f7d7a-8b6f-7123-9abc-project-video.mp4",
  "altText": "Project Video",
  "usageScope": "project",
  "projectId": "project_123"
}
```

Behavior:

- Require admin authentication.
- Validate `sourceStorageKey` as a raw upload key.
- Process the raw object from R2 with the existing video processing pipeline.
- Store final `standard` and `scrub` variants in the normal media upload area.
- Create the same media asset records the current video route creates.
- Delete the raw source object after successful processing when practical.
- Return progress events in the same newline-delimited JSON style used today, so the front can preserve the existing modal/progress UI.

## Frontend Changes

Update `MediaUploadField` video handling:

1. Request a signed video upload URL from a server action or lightweight API route.
2. Upload the selected video directly to `uploadUrl` with `PUT`.
3. Call the backend processing endpoint with `sourceStorageKey`, `altText`, `usageScope`, and optional `projectId`.
4. Read processing progress events from the response body and update the existing modal message.
5. Refresh the admin media library after processing completes.

The UI should keep the blocking upload dialog, but messages should distinguish upload and processing phases:

- `Enviando vídeo para o storage.`
- `Processando vídeo.`
- backend progress messages during processing.

Once video no longer passes through the Next proxy, reduce or remove the `501mb` Next proxy/body limits and update tests that currently assert the proxy path.

## Storage Rules

- Raw upload keys use a separate prefix, for example `uploads/raw/YYYY/MM/{uuid}-{filename}`.
- Final assets keep the existing delivery URL behavior.
- Backend validation must reject arbitrary keys outside the raw upload prefix for processing.
- Raw source objects should be deleted after successful processing to avoid unnecessary storage growth.
- If processing fails, retaining the raw object is acceptable for debugging, but the error response should include the existing request id pattern.

## Error Handling

- If signing fails, show a controlled upload preparation error.
- If direct R2 `PUT` fails, do not call processing.
- If processing fails, show the backend progress error and request id.
- If raw object deletion fails after successful processing, do not fail the user-facing upload; log it server-side.

## Testing

Backend tests should cover:

- Signed video upload accepts valid video metadata.
- Signed video upload rejects non-video MIME types.
- Processing rejects storage keys outside the raw prefix.
- Processing creates the expected media asset records for generated variants.

Frontend/source tests should cover:

- Video upload no longer posts the file to `/admin/uploads/video`.
- Video upload uses a direct `PUT` to the signed URL.
- Processing progress still reads `response.body.getReader()`.
- Next config no longer requires the full 500 MB proxy limit.

## Deployment Notes

Cloudflare R2 has no standard egress fees, so Railway backend reads from R2 should avoid the typical S3-style egress penalty. The backend will still spend Railway CPU/RAM while running video processing, but the front service should no longer accumulate upload-related memory, CPU, or network usage.

## Out Of Scope

- Moving video processing to a separate worker or queue.
- Replacing the existing video encoding settings.
- Changing public media delivery URLs.
- Adding resumable multipart uploads.
