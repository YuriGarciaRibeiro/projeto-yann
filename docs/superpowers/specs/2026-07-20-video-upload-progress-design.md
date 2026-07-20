# Video Upload Progress Design

## Goal

Improve the admin video upload experience without adding a worker, Redis, or a separate queue. The upload should keep the current request-time FFmpeg processing, but the UI should update as the backend completes each processing step.

## Current Behavior

`POST /admin/uploads/video` receives the uploaded video, writes it to a temporary file, creates scrub and standard MP4 variants with FFmpeg, uploads both variants to storage, creates two `media_assets` rows, and returns a final JSON response only after all work is done.

The admin UI shows one fixed message while this happens and refreshes the media library only at the end.

## Approach

Keep the same endpoint and conversion pipeline, but return a streamed response for successful admin video uploads. The backend emits newline-delimited JSON events as each stage starts or finishes. The frontend reads the stream, updates the visible status message, and refreshes the admin route after the final success event.

This is intentionally not a background worker. If the browser tab closes or the request is interrupted, the request-time processing model remains the source of truth.

## Backend Design

`upload_admin_video` will stream progress events instead of waiting to return one JSON payload. The existing validation, temporary file handling, FFmpeg arguments, storage uploads, metadata creation, cleanup, and request id logging remain in the same backend path.

Events should include:

- `request-started`
- `file-received`
- `scrub-started`
- `scrub-finished`
- `standard-started`
- `standard-finished`
- `storage-upload-started`
- `storage-upload-finished`
- `database-write-started`
- `database-write-finished`
- `completed`
- `failed`

Each event includes the `requestId` and a human-readable message. Failure events include the error text and keep the existing storage cleanup behavior for partial uploads.

## Frontend Design

The admin video upload action will read the backend response stream and expose progress events to `MediaUploadField`. The UI will replace the current fixed message with the latest backend step message.

The upload still runs one file at a time. Images keep the existing signed direct upload flow. Videos use the streamed backend upload flow, then `router.refresh()` runs after completion so the newly created scrub and standard video assets appear in the library.

The UI will not show a numeric FFmpeg percentage. It will show discrete, honest processing stages because the backend does not currently parse FFmpeg progress by duration.

## Error Handling

Validation errors before streaming starts still return an error response. Errors during processing emit a `failed` progress event with the `requestId`, and the frontend shows the same kind of actionable message it shows today.

If storage upload succeeds partially and a later step fails, the backend deletes uploaded objects as it does today.

## Testing

Backend tests should cover streamed video upload events, successful creation of both media rows, and cleanup behavior on failure. Existing media proxy tests remain unchanged.

Frontend tests should confirm that upload code does not expose backend auth details to the client and that the client-side video path consumes progress updates rather than waiting silently for the final response.

## Out Of Scope

- Redis, RQ, Celery, or any separate worker service.
- Persisted video job status.
- Exact FFmpeg percentage progress.
- Concurrent video processing.
