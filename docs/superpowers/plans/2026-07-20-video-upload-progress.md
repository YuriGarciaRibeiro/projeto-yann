# Video Upload Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stream backend video-processing progress to the admin UI while keeping the current simple request-time FFmpeg conversion model.

**Architecture:** Keep `POST /admin/uploads/video` as the only video upload endpoint, but return newline-delimited JSON progress events from a `StreamingResponse`. The admin client uploads videos directly to FastAPI with browser `fetch`, reads the response stream, updates the visible message per event, and refreshes the media library after the final `completed` event.

**Tech Stack:** FastAPI, Python generators, newline-delimited JSON, Next.js App Router, React client component state, browser `fetch` streaming, pytest, Node assertion tests.

---

## File Structure

- Modify `apps/backend/app/upload_routes.py`: add progress event helpers, move the current synchronous upload body into a streaming generator, and return `StreamingResponse` for video uploads.
- Modify `apps/backend/tests/test_upload_routes.py`: update video upload tests to parse streamed NDJSON events and assert successful and failed progress behavior.
- Modify `apps/web/src/app/admin/upload-actions.ts`: remove the server action wrapper for video upload, keep signed image upload behavior, and export shared response/event types only.
- Modify `apps/web/src/app/admin/components/MediaUploadField.tsx`: upload videos from the browser with `fetch`, include the admin token through a server action helper, consume progress events, and update messages as events arrive.
- Modify `apps/web/src/app/admin/upload-actions.test.ts`: ensure auth/backend details are not exposed except through the intentionally scoped video upload helper.
- Modify `README.md`: document streamed progress and clarify that video processing is still request-time, not a worker.

## Task 1: Backend Progress Events

**Files:**
- Modify: `apps/backend/app/upload_routes.py`
- Test: `apps/backend/tests/test_upload_routes.py`

- [ ] **Step 1: Write the failing backend success test**

Add these helpers near the top of `apps/backend/tests/test_upload_routes.py`, after imports:

```python
import json


def parse_progress_events(response: object) -> List[Dict[str, object]]:
    content = getattr(response, "content")
    return [json.loads(line) for line in content.decode("utf-8").splitlines() if line.strip()]
```

Replace the final response assertions in `test_video_upload_processes_two_variants_and_creates_media_rows` with:

```python
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/x-ndjson")
    events = parse_progress_events(response)
    assert [event["event"] for event in events] == [
        "request-started",
        "file-received",
        "scrub-started",
        "scrub-finished",
        "standard-started",
        "standard-finished",
        "storage-upload-started",
        "storage-upload-finished",
        "database-write-started",
        "database-write-finished",
        "completed",
    ]
    assert all(isinstance(event["requestId"], str) and event["requestId"] for event in events)
    assert events[-1]["ok"] is True
```

- [ ] **Step 2: Run the backend success test and verify it fails**

Run: `npm run backend:test -- apps/backend/tests/test_upload_routes.py::test_video_upload_processes_two_variants_and_creates_media_rows`

Expected: FAIL because `/admin/uploads/video` still returns `application/json` with one final JSON object instead of NDJSON events.

- [ ] **Step 3: Implement progress event helpers**

In `apps/backend/app/upload_routes.py`, add `Iterator` to the typing import:

```python
from typing import Annotated, Any, Dict, Iterable, Iterator, Mapping, Optional
```

Add this helper after `log_video_upload_error`:

```python
def video_progress_event(
    event: str,
    request_id: str,
    message: str,
    metadata: Optional[Mapping[str, object]] = None,
) -> str:
    return json.dumps(
        {
            "event": event,
            "message": message,
            "requestId": request_id,
            **(metadata or {}),
        }
    ) + "\n"
```

- [ ] **Step 4: Move upload work into a generator**

Replace the body of `upload_admin_video` with a generator-returning response. Keep the existing function signature exactly the same and use this implementation:

```python
) -> StreamingResponse:
    request_id = str(uuid.uuid4())

    def stream_video_upload() -> Iterator[str]:
        temporary_directory: Optional[str] = None
        uploaded_storage_keys = []

        try:
            log_video_upload(request_id, "request-started")
            yield video_progress_event("request-started", request_id, "Recebendo video...")
            if file is None:
                raise ValueError("Escolha um video para enviar.")

            content_type = file.content_type or ""
            if not content_type.startswith("video/"):
                raise ValueError("Este envio otimizado aceita apenas videos.")

            alt_text = altText.strip() if altText else ""
            if not alt_text:
                raise ValueError("Adicione um nome para identificar o arquivo.")

            usage_scope = _parse_usage_scope(usageScope or "")
            project_id = projectId.strip() if projectId else None
            if usage_scope == "project" and not project_id:
                raise ValueError("Escolha um projeto para este video.")

            temporary_directory = tempfile.mkdtemp(prefix="paralax-video-")
            input_path = os.path.join(temporary_directory, safe_temporary_file_name(file.filename or "input-video"))
            scrub_output_path = os.path.join(temporary_directory, "output-scroll.mp4")
            standard_output_path = os.path.join(temporary_directory, "output-standard.mp4")

            source_size = 0
            with open(input_path, "wb") as input_file:
                while True:
                    chunk = file.file.read(UPLOAD_CHUNK_SIZE)
                    if not chunk:
                        break
                    source_size += len(chunk)
                    if source_size > storage.VIDEO_MAX_SIZE_BYTES:
                        raise ValueError("Videos must be 500MB or smaller.")
                    input_file.write(chunk)
            storage.validate_media_upload_input({"mimeType": content_type, "sizeBytes": source_size})

            source_file_name = file.filename or "video.mp4"
            file_metadata = {
                "fileName": source_file_name,
                "fileSize": source_size,
                "fileType": content_type,
                "projectId": project_id,
                "usageScope": usage_scope,
            }
            log_video_upload(request_id, "file-received", file_metadata)
            yield video_progress_event("file-received", request_id, "Video recebido. Preparando conversao...", file_metadata)

            log_video_upload(request_id, "scrub-started", {"fileName": source_file_name})
            yield video_progress_event("scrub-started", request_id, "Convertendo versao para rolagem...", {"fileName": source_file_name})
            create_scrub_video(input_path, scrub_output_path)
            scrub_size = os.path.getsize(scrub_output_path)
            log_video_upload(request_id, "scrub-finished", {"fileName": source_file_name, "scrubSize": scrub_size})
            yield video_progress_event("scrub-finished", request_id, "Versao para rolagem criada.", {"scrubSize": scrub_size})

            log_video_upload(request_id, "standard-started", {"fileName": source_file_name})
            yield video_progress_event("standard-started", request_id, "Convertendo versao normal com audio...", {"fileName": source_file_name})
            create_standard_video(input_path, standard_output_path)
            standard_size = os.path.getsize(standard_output_path)
            log_video_upload(request_id, "standard-finished", {"fileName": source_file_name, "standardSize": standard_size})
            yield video_progress_event("standard-finished", request_id, "Versao normal criada.", {"standardSize": standard_size})

            scrub_storage_key = storage.create_media_storage_key(optimized_video_file_name(source_file_name))
            standard_storage_key = storage.create_media_storage_key(standard_video_file_name(source_file_name))

            log_video_upload(request_id, "storage-upload-started", {"scrubSize": scrub_size, "standardSize": standard_size})
            yield video_progress_event("storage-upload-started", request_id, "Enviando videos otimizados para o storage...")
            with open(scrub_output_path, "rb") as scrub_file:
                storage.put_media_object(
                    {
                        "body": scrub_file,
                        "contentType": OUTPUT_MIME_TYPE,
                        "contentLength": scrub_size,
                        "storageKey": scrub_storage_key,
                    }
                )
            uploaded_storage_keys.append(scrub_storage_key)
            with open(standard_output_path, "rb") as standard_file:
                storage.put_media_object(
                    {
                        "body": standard_file,
                        "contentType": OUTPUT_MIME_TYPE,
                        "contentLength": standard_size,
                        "storageKey": standard_storage_key,
                    }
                )
            uploaded_storage_keys.append(standard_storage_key)
            storage_metadata = {"standardStorageKey": standard_storage_key, "scrubStorageKey": scrub_storage_key}
            log_video_upload(request_id, "storage-upload-finished", storage_metadata)
            yield video_progress_event("storage-upload-finished", request_id, "Videos enviados para o storage.", storage_metadata)

            log_video_upload(request_id, "database-write-started")
            yield video_progress_event("database-write-started", request_id, "Salvando videos na biblioteca...")
            repository.create_media_assets(
                [
                    {
                        "storageKey": scrub_storage_key,
                        "mimeType": OUTPUT_MIME_TYPE,
                        "sizeBytes": scrub_size,
                        "altText": f"{alt_text} - rolagem otimizado",
                        "usageScope": usage_scope,
                        "projectId": project_id,
                        "videoVariant": "scrub",
                    },
                    {
                        "storageKey": standard_storage_key,
                        "mimeType": OUTPUT_MIME_TYPE,
                        "sizeBytes": standard_size,
                        "altText": f"{alt_text} - normal com áudio",
                        "usageScope": usage_scope,
                        "projectId": project_id,
                        "videoVariant": "standard",
                    },
                ]
            )
            log_video_upload(request_id, "database-write-finished")
            yield video_progress_event("database-write-finished", request_id, "Biblioteca atualizada.")

            log_video_upload(request_id, "request-finished", {"fileName": source_file_name})
            yield video_progress_event("completed", request_id, "Video processado com sucesso.", {"ok": True})
        except Exception as error:
            log_video_upload_error(request_id, "request-failed", error)
            if uploaded_storage_keys:
                try:
                    storage.delete_media_objects(uploaded_storage_keys)
                    log_video_upload(request_id, "storage-cleanup-finished", {"uploadedStorageKeys": uploaded_storage_keys})
                except Exception as cleanup_error:
                    log_video_upload_error(
                        request_id,
                        "storage-cleanup-failed",
                        cleanup_error,
                        {"uploadedStorageKeys": uploaded_storage_keys},
                    )
            yield video_progress_event("failed", request_id, str(error), {"ok": False, "error": str(error)})
        finally:
            if temporary_directory:
                shutil.rmtree(temporary_directory, ignore_errors=True)

    return StreamingResponse(stream_video_upload(), media_type="application/x-ndjson")
```

- [ ] **Step 5: Run the backend success test and verify it passes**

Run: `npm run backend:test -- apps/backend/tests/test_upload_routes.py::test_video_upload_processes_two_variants_and_creates_media_rows`

Expected: PASS.

- [ ] **Step 6: Commit backend streamed success path**

Run:

```bash
git add apps/backend/app/upload_routes.py apps/backend/tests/test_upload_routes.py
git commit -m "feat: stream video upload progress"
```

## Task 2: Backend Failure Events

**Files:**
- Modify: `apps/backend/tests/test_upload_routes.py`
- Modify: `apps/backend/app/upload_routes.py` only if the tests reveal a missing behavior from Task 1.

- [ ] **Step 1: Update metadata failure test for streamed failure**

In `test_video_upload_deletes_uploaded_objects_when_metadata_fails`, replace the response assertions with:

```python
    assert response.status_code == 200
    events = parse_progress_events(response)
    assert events[-1]["event"] == "failed"
    assert events[-1]["ok"] is False
    assert events[-1]["error"] == "metadata failed"
    assert events[-1]["requestId"]
```

Keep the existing `deleted_keys` and `route_repository.created_assets` assertions unchanged.

- [ ] **Step 2: Update second storage upload failure test for streamed failure**

In `test_video_upload_deletes_first_uploaded_object_when_second_upload_fails`, replace the response assertions with:

```python
    assert response.status_code == 200
    events = parse_progress_events(response)
    assert events[-1]["event"] == "failed"
    assert events[-1]["ok"] is False
    assert events[-1]["error"] == "storage failed"
```

Keep the existing `deleted_keys` assertion unchanged.

- [ ] **Step 3: Update missing multipart fields test for streamed failure**

In `test_video_upload_missing_multipart_fields_returns_request_id`, replace the response assertions with:

```python
    assert response.status_code == 200
    events = parse_progress_events(response)
    assert events[-1]["event"] == "failed"
    assert events[-1]["error"] == "Adicione um nome para identificar o arquivo."
    assert events[-1]["requestId"]
```

- [ ] **Step 4: Run updated backend failure tests**

Run: `npm run backend:test -- apps/backend/tests/test_upload_routes.py::test_video_upload_deletes_uploaded_objects_when_metadata_fails apps/backend/tests/test_upload_routes.py::test_video_upload_deletes_first_uploaded_object_when_second_upload_fails apps/backend/tests/test_upload_routes.py::test_video_upload_missing_multipart_fields_returns_request_id`

Expected: PASS. If a test fails because a `failed` event is missing fields, update `video_progress_event` call in the exception path so it includes `ok: False` and `error`.

- [ ] **Step 5: Run full upload route tests**

Run: `npm run backend:test -- apps/backend/tests/test_upload_routes.py`

Expected: PASS.

- [ ] **Step 6: Commit backend failure behavior**

Run:

```bash
git add apps/backend/app/upload_routes.py apps/backend/tests/test_upload_routes.py
git commit -m "test: cover streamed video upload failures"
```

## Task 3: Frontend Streaming Upload

**Files:**
- Modify: `apps/web/src/app/admin/upload-actions.ts`
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
- Test: `apps/web/src/app/admin/upload-actions.test.ts`

- [ ] **Step 1: Read current Next.js docs before editing frontend code**

Read the relevant local docs because this project requires current Next.js guidance before code changes:

Run: `ls node_modules/next/dist/docs`

Expected: directory listing exists. Then read docs relevant to Server Actions/App Router in that directory before editing.

- [ ] **Step 2: Write the failing frontend guard test**

In `apps/web/src/app/admin/upload-actions.test.ts`, add this assertion after the existing assertions:

```ts
assert.equal(
  uploadActionsSource.includes("export type VideoUploadProgressEvent"),
  true,
  "video upload progress events must be typed for client-side stream consumption",
);

assert.equal(
  mediaUploadFieldSource.includes("response.body.getReader()"),
  true,
  "video uploads must consume the backend progress stream in the client component",
);
```

- [ ] **Step 3: Run the frontend guard test and verify it fails**

Run: `npm --workspace apps/web run test -- src/app/admin/upload-actions.test.ts`

Expected: FAIL because the type and stream reader do not exist yet.

- [ ] **Step 4: Replace video server action with a scoped token helper and event type**

In `apps/web/src/app/admin/upload-actions.ts`, replace `VideoAdminUploadResponse` and `uploadAdminVideoAction` with:

```ts
export type VideoUploadProgressEvent = {
  error?: string;
  event: string;
  message: string;
  ok?: boolean;
  requestId: string;
};

export type VideoUploadConnection = {
  backendUrl?: string;
  error?: string;
  token?: string;
};

export async function getVideoUploadConnectionAction(): Promise<VideoUploadConnection> {
  const token = await getAdminBearerToken();

  if (!token) {
    return { error: "Missing admin access token." };
  }

  return {
    backendUrl: buildBackendUrl("/admin/uploads/video").toString(),
    token,
  };
}
```

Keep `createSignedAdminUploadAction` unchanged.

- [ ] **Step 5: Update imports in MediaUploadField**

In `apps/web/src/app/admin/components/MediaUploadField.tsx`, replace the upload action import with:

```ts
import {
  createSignedAdminUploadAction,
  getVideoUploadConnectionAction,
  type VideoUploadProgressEvent,
} from "../upload-actions";
```

- [ ] **Step 6: Add a stream reader helper in MediaUploadField**

Add this function above `export function MediaUploadField`:

```tsx
async function readVideoProgressStream(
  response: Response,
  onProgress: (event: VideoUploadProgressEvent) => void,
) {
  if (!response.body) {
    throw new Error("Não foi possível acompanhar o processamento do vídeo.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastEvent: VideoUploadProgressEvent | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = JSON.parse(line) as VideoUploadProgressEvent;
      lastEvent = event;
      onProgress(event);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const event = JSON.parse(buffer) as VideoUploadProgressEvent;
    lastEvent = event;
    onProgress(event);
  }

  if (!lastEvent) {
    throw new Error("O backend não retornou progresso do processamento.");
  }

  if (lastEvent.event === "failed" || lastEvent.ok === false) {
    const requestHint = lastEvent.requestId ? ` Código: ${lastEvent.requestId}.` : "";
    throw new Error(`${lastEvent.error || lastEvent.message || "Não foi possível otimizar o vídeo."}${requestHint}`);
  }

  if (lastEvent.event !== "completed") {
    throw new Error("O processamento do vídeo terminou sem confirmação de sucesso.");
  }
}
```

- [ ] **Step 7: Replace video upload branch**

In `uploadFile`, replace the current `if (file.type.startsWith("video/")) { ... }` block with:

```tsx
    if (file.type.startsWith("video/")) {
      setStatus("uploading");
      setMessage(`Enviando ${file.name} para processamento...`);

      const connection = await getVideoUploadConnectionAction();
      if (!connection.backendUrl || !connection.token) {
        throw new Error(connection.error || `Não foi possível preparar o envio de ${file.name}.`);
      }

      const videoFormData = new FormData();
      videoFormData.append("file", file);
      videoFormData.append("altText", displayName);
      videoFormData.append("usageScope", usageScope);
      if (projectId) {
        videoFormData.append("projectId", projectId);
      }

      const response = await fetch(connection.backendUrl, {
        body: videoFormData,
        cache: "no-store",
        headers: { authorization: `Bearer ${connection.token}` },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Não foi possível enviar ${file.name} para processamento.`);
      }

      await readVideoProgressStream(response, (event) => {
        setMessage(event.message);
      });

      return;
    }
```

- [ ] **Step 8: Run the frontend guard test**

Run: `npm --workspace apps/web run test -- src/app/admin/upload-actions.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit frontend stream consumption**

Run:

```bash
git add apps/web/src/app/admin/upload-actions.ts apps/web/src/app/admin/components/MediaUploadField.tsx apps/web/src/app/admin/upload-actions.test.ts
git commit -m "feat: show video upload progress in admin"
```

## Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README video preparation section**

In `README.md`, replace line 164 text with:

```md
FastAPI signs direct image uploads to S3/MinIO, verifies stored objects, proxies media when needed, and processes admin video uploads with FFmpeg before saving scrub and standard MP4 variants. Video uploads stream newline-delimited progress events back to the admin UI while the request is still running. The backend server must have `ffmpeg` available in `PATH`.
```

Replace line 202 text with:

```md
Future improvement: add a background worker if request-time conversion becomes too fragile for large uploads or concurrent editors. The current implementation keeps conversion synchronous, but streams progress updates so the admin can see each processing stage.
```

- [ ] **Step 2: Run backend tests**

Run: `npm run backend:test`

Expected: PASS.

- [ ] **Step 3: Run frontend tests/lint**

Run: `npm --workspace apps/web run test -- src/app/admin/upload-actions.test.ts`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit docs and any verification fixes**

Run:

```bash
git add README.md
git commit -m "docs: document streamed video progress"
```

If verification required code fixes, include only the touched relevant files in this commit and use: `git commit -m "fix: stabilize streamed video progress"`.

## Self-Review

- Spec coverage: The plan keeps conversion request-time, adds backend streamed events, updates the admin UI as events arrive, refreshes the library after completion, keeps cleanup behavior, and excludes worker/Redis/FFmpeg percentage progress.
- Placeholder scan: No placeholders or deferred implementation steps remain.
- Type consistency: Frontend event type uses `event`, `message`, `requestId`, optional `ok`, and optional `error`, matching backend event payloads.
