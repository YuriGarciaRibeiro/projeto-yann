# Direct R2 Video Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send admin video files directly from the browser to R2, then process the uploaded raw object from the backend without routing the large file through the Next.js front service.

**Architecture:** Reuse the existing signed upload pattern for videos with a separate raw-video storage key prefix. The Next.js client asks the backend for a signed R2 URL through a server action, uploads the video with `PUT`, then calls a lightweight Next route that forwards only JSON to the backend processing endpoint and streams progress events back to the browser.

**Tech Stack:** FastAPI, boto3 S3-compatible R2 access, Next.js 16 App Router, React 19, TypeScript, pytest, Node source-level tests.

---

## File Map

- Modify `apps/backend/app/storage.py`: add raw upload key generation, raw key validation, signed raw-video upload creation, raw object read/delete helpers.
- Modify `apps/backend/app/upload_routes.py`: add video sign/process request models, add `/admin/uploads/video/sign`, add `/admin/uploads/video/process`, and refactor current processing body into reusable helpers.
- Modify `apps/backend/app/main.py`: include unauthorized logging for `/admin/uploads/video/process` if desired by existing logging behavior.
- Modify `apps/backend/tests/test_storage.py`: cover raw key validation, signed raw video upload, raw object read, and raw delete.
- Modify `apps/backend/tests/test_upload_routes.py`: cover video signing, non-video rejection, raw-key process rejection, successful process-from-R2 flow, and raw cleanup after success.
- Modify `apps/web/src/app/admin/upload-actions.ts`: add signed video upload action type and action.
- Add `apps/web/src/app/admin/uploads/video/process/route.ts`: authenticated lightweight processing proxy that sends JSON to FastAPI and streams progress.
- Modify `apps/web/src/app/admin/components/MediaUploadField.tsx`: switch video path to signed direct R2 `PUT`, then processing proxy.
- Modify `apps/web/src/app/admin/upload-actions.test.ts`: assert video path no longer posts multipart video to `/admin/uploads/video`, still streams processing progress, and does not expose backend auth.
- Modify `apps/web/src/app/admin/upload-proxy-config.test.ts`: assert the 500 MB Next proxy limit is removed.
- Modify `apps/web/next.config.ts`: remove large upload body/proxy limit once no large file crosses Next.

---

### Task 1: Add Raw Video Storage Helpers

**Files:**
- Modify: `apps/backend/app/storage.py`
- Test: `apps/backend/tests/test_storage.py`

- [ ] **Step 1: Write failing raw storage tests**

Append these tests to `apps/backend/tests/test_storage.py`:

```python
def test_create_raw_media_storage_key_uses_raw_prefix_and_sanitizes_filename(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(storage.uuid, "uuid4", lambda: "123e4567-e89b-12d3-a456-426614174000")

    key = storage.create_raw_media_storage_key("Vídeo Bruto 01.MP4", datetime(2026, 7, 21, tzinfo=timezone.utc))

    assert key == "uploads/raw/2026/07/123e4567-e89b-12d3-a456-426614174000-video-bruto-01.mp4"
    storage.validate_raw_upload_storage_key(key)


def test_validate_raw_upload_storage_key_rejects_normal_and_private_keys() -> None:
    with pytest.raises(ValueError, match="Raw upload storage key is invalid"):
        storage.validate_raw_upload_storage_key("uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-video.mp4")

    with pytest.raises(ValueError, match="Raw upload storage key is invalid"):
        storage.validate_raw_upload_storage_key("../private/video.mp4")


def test_create_signed_raw_video_upload_validates_video_and_presigns_raw_key(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_client = FakeS3Client()
    monkeypatch.setattr(storage, "get_s3_presign_client", lambda settings: fake_client)
    monkeypatch.setattr(
        storage,
        "create_raw_media_storage_key",
        lambda file_name: "uploads/raw/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4",
    )

    signed_upload = storage.create_signed_raw_video_upload(
        {"file_name": "Hero.MP4", "mime_type": "video/mp4", "size_bytes": 1024},
        settings(),
    )

    assert signed_upload == {
        "sourceStorageKey": "uploads/raw/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4",
        "uploadUrl": "https://uploads.example.com/signed-put",
    }
    assert fake_client.presigned_calls == [
        {
            "client_method": "put_object",
            "params": {
                "Bucket": "portfolio-media",
                "Key": "uploads/raw/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4",
                "ContentType": "video/mp4",
                "ContentLength": 1024,
            },
            "expires_in": 300,
            "http_method": "PUT",
        }
    ]


def test_create_signed_raw_video_upload_rejects_images() -> None:
    with pytest.raises(ValueError, match="Raw video uploads require MP4 or WebM video files"):
        storage.create_signed_raw_video_upload({"file_name": "Hero.JPG", "mime_type": "image/jpeg", "size_bytes": 1024}, settings())


def test_get_and_delete_raw_media_object_use_raw_key_validator(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_client = FakeS3Client()
    monkeypatch.setattr(storage, "get_s3_client", lambda settings: fake_client)
    key = "uploads/raw/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4"

    media_object = storage.get_raw_media_object(key, settings())
    storage.delete_raw_media_object(key, settings())

    assert media_object == fake_client.get_response
    assert fake_client.get_calls == [{"Bucket": "portfolio-media", "Key": key}]
    assert fake_client.delete_calls == [
        {
            "Bucket": "portfolio-media",
            "Delete": {"Objects": [{"Key": key}], "Quiet": True},
        }
    ]
```

- [ ] **Step 2: Run storage tests and verify they fail**

Run: `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_storage.py -v`

Expected: FAIL with missing attributes such as `create_raw_media_storage_key`, `validate_raw_upload_storage_key`, and `create_signed_raw_video_upload`.

- [ ] **Step 3: Implement raw storage helpers**

In `apps/backend/app/storage.py`, add the raw pattern near `UPLOAD_STORAGE_KEY_PATTERN`:

```python
RAW_UPLOAD_STORAGE_KEY_PATTERN = re.compile(
    r"^uploads/raw/\d{4}/\d{2}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[a-z0-9._-]{1,120}$",
    re.IGNORECASE,
)
```

Add these functions after `create_media_storage_key`:

```python
def create_raw_media_storage_key(file_name: str, now: Optional[datetime] = None) -> str:
    current_time = now if now is not None else datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    current_time = current_time.astimezone(timezone.utc)

    return "uploads/raw/{year}/{month}/{identifier}-{file_name}".format(
        year=current_time.year,
        month=str(current_time.month).zfill(2),
        identifier=uuid.uuid4(),
        file_name=_sanitize_file_name(file_name),
    )


def validate_raw_upload_storage_key(storage_key: str) -> None:
    if not isinstance(storage_key, str) or not RAW_UPLOAD_STORAGE_KEY_PATTERN.match(storage_key):
        raise ValueError("Raw upload storage key is invalid.")
```

Add this helper after `create_signed_put_upload`:

```python
def create_signed_raw_video_upload(input_data: Mapping[str, Any], settings: Optional[Settings] = None) -> Dict[str, str]:
    validate_media_upload_input(input_data)
    resolved_settings = _resolve_settings(settings)
    file_name = _input_value(input_data, "file_name", "fileName")
    mime_type = _input_value(input_data, "mime_type", "mimeType")
    size_bytes = _input_value(input_data, "size_bytes", "sizeBytes")

    if not isinstance(mime_type, str) or mime_type not in {"video/mp4", "video/webm"}:
        raise ValueError("Raw video uploads require MP4 or WebM video files.")

    storage_key = create_raw_media_storage_key(str(file_name))
    validate_raw_upload_storage_key(storage_key)
    upload_url = get_s3_presign_client(resolved_settings).generate_presigned_url(
        "put_object",
        Params={
            "Bucket": resolved_settings.s3_bucket,
            "Key": storage_key,
            "ContentType": mime_type,
            "ContentLength": size_bytes,
        },
        ExpiresIn=60 * 5,
        HttpMethod="PUT",
    )

    return {"sourceStorageKey": storage_key, "uploadUrl": upload_url}
```

Add these helpers near the existing object helpers:

```python
def get_raw_media_object(storage_key: str, settings: Optional[Settings] = None) -> Dict[str, Any]:
    resolved_settings = _resolve_settings(settings)
    validate_raw_upload_storage_key(storage_key)

    try:
        return get_s3_client(resolved_settings).get_object(
            Bucket=resolved_settings.s3_bucket,
            Key=storage_key,
        )
    except ClientError as error:
        error_code = error.response.get("Error", {}).get("Code")
        if error_code in {"NoSuchKey", "404", "NotFound"}:
            raise MediaObjectNotFound("Media object not found.") from error
        raise


def delete_raw_media_object(storage_key: str, settings: Optional[Settings] = None) -> None:
    resolved_settings = _resolve_settings(settings)
    validate_raw_upload_storage_key(storage_key)
    response = get_s3_client(resolved_settings).delete_objects(
        Bucket=resolved_settings.s3_bucket,
        Delete={"Objects": [{"Key": storage_key}], "Quiet": True},
    )
    if response.get("Errors"):
        raise ValueError("Media object could not be deleted.")
```

- [ ] **Step 4: Run storage tests and verify they pass**

Run: `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_storage.py -v`

Expected: PASS.

- [ ] **Step 5: Commit storage helpers**

```bash
git add apps/backend/app/storage.py apps/backend/tests/test_storage.py
git commit -m "feat: add raw video storage uploads"
```

---

### Task 2: Add Backend Video Sign and Process Endpoints

**Files:**
- Modify: `apps/backend/app/upload_routes.py`
- Modify: `apps/backend/app/main.py`
- Test: `apps/backend/tests/test_upload_routes.py`

- [ ] **Step 1: Write failing backend route tests**

Add these tests to `apps/backend/tests/test_upload_routes.py` after `test_sign_upload_returns_signed_put_payload`:

```python
def test_sign_video_upload_returns_signed_raw_payload(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    calls: List[Mapping[str, object]] = []

    def fake_create_signed_raw_video_upload(input_data: Mapping[str, object]) -> Dict[str, str]:
        calls.append(dict(input_data))
        return {
            "sourceStorageKey": "uploads/raw/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4",
            "uploadUrl": "https://uploads.example.com/signed-raw-put",
        }

    monkeypatch.setattr(storage, "create_signed_raw_video_upload", fake_create_signed_raw_video_upload)

    response = client.post(
        "/admin/uploads/video/sign",
        json={"fileName": "hero.mp4", "mimeType": "video/mp4", "size": 1024},
    )

    assert response.status_code == 200
    assert response.json() == {
        "sourceStorageKey": "uploads/raw/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4",
        "uploadUrl": "https://uploads.example.com/signed-raw-put",
    }
    assert calls == [{"fileName": "hero.mp4", "mimeType": "video/mp4", "sizeBytes": 1024}]


def test_sign_video_upload_rejects_image(client: TestClient) -> None:
    response = client.post(
        "/admin/uploads/video/sign",
        json={"fileName": "hero.jpg", "mimeType": "image/jpeg", "size": 1024},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Raw video uploads require MP4 or WebM video files."


def test_process_video_rejects_non_raw_source_key(client: TestClient) -> None:
    response = client.post(
        "/admin/uploads/video/process",
        json={
            "sourceStorageKey": "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4",
            "altText": "Hero video",
            "usageScope": "site",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Raw upload storage key is invalid."


def test_process_video_reads_raw_object_and_deletes_it_after_success(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.upload_routes as upload_routes

    ffmpeg_calls: List[List[str]] = []
    deleted_raw_keys: List[str] = []

    class FakeRawBody:
        def iter_chunks(self) -> List[bytes]:
            return [b"source-", b"video"]

    def fake_run_ffmpeg(args: List[str]) -> None:
        ffmpeg_calls.append(args)
        with open(args[-1], "wb") as output_file:
            output_file.write(b"scrub-bytes" if "scroll" in args[-1] else b"standard-bytes")

    monkeypatch.setattr(
        storage,
        "get_raw_media_object",
        lambda key: {"Body": FakeRawBody(), "ContentLength": 12, "ContentType": "video/mp4"},
    )
    monkeypatch.setattr(storage, "delete_raw_media_object", lambda key: deleted_raw_keys.append(key))
    monkeypatch.setattr(upload_routes, "run_ffmpeg", fake_run_ffmpeg)
    monkeypatch.setattr(
        storage,
        "create_media_storage_key",
        lambda file_name: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-" + file_name,
    )
    monkeypatch.setattr(storage, "get_media_delivery_url", lambda key: f"/media/{key}")
    monkeypatch.setattr(storage, "put_media_object", lambda input_data: None)

    source_key = "uploads/raw/2026/07/123e4567-e89b-12d3-a456-426614174000-hero.mp4"
    response = client.post(
        "/admin/uploads/video/process",
        json={"sourceStorageKey": source_key, "altText": "Hero video", "usageScope": "site"},
    )

    assert response.status_code == 200
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
    assert events[-1]["ok"] is True
    assert len(ffmpeg_calls) == 2
    assert deleted_raw_keys == [source_key]
    assert len(route_repository.created_assets) == 2
```

- [ ] **Step 2: Run route tests and verify they fail**

Run: `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_upload_routes.py -v`

Expected: FAIL because `/admin/uploads/video/sign` and `/admin/uploads/video/process` do not exist.

- [ ] **Step 3: Add request models and helper functions**

In `apps/backend/app/upload_routes.py`, replace the pydantic import and add models near `SignedUploadRequest`:

```python
from pydantic import BaseModel, Field


class SignedVideoUploadRequest(BaseModel):
    fileName: str
    mimeType: str
    size: int


class ProcessVideoUploadRequest(BaseModel):
    sourceStorageKey: str
    altText: str
    usageScope: str
    projectId: Optional[str] = None
```

Add helpers near `safe_temporary_file_name`:

```python
def source_file_name_from_storage_key(storage_key: str) -> str:
    base_name = os.path.basename(storage_key)
    return re.sub(r"^[0-9a-f-]{36}-", "", base_name) or "video.mp4"


def write_body_to_file(body: Any, output_path: str) -> int:
    source_size = 0
    with open(output_path, "wb") as input_file:
        for chunk in _body_iterator(body):
            source_size += len(chunk)
            if source_size > storage.VIDEO_MAX_SIZE_BYTES:
                raise ValueError("Videos must be 500MB or smaller.")
            input_file.write(chunk)
    return source_size
```

- [ ] **Step 4: Add sign endpoint**

In `apps/backend/app/upload_routes.py`, add after `sign_admin_upload`:

```python
@admin_uploads_router.post("/uploads/video/sign")
def sign_admin_video_upload(
    body: SignedVideoUploadRequest,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
) -> Dict[str, str]:
    try:
        return storage.create_signed_raw_video_upload(
            {"fileName": body.fileName, "mimeType": body.mimeType, "sizeBytes": body.size}
        )
    except ValueError as error:
        raise _bad_request(error) from error
```

- [ ] **Step 5: Refactor video processing into a reusable stream helper**

In `apps/backend/app/upload_routes.py`, create a new helper before the route definitions. Move the processing logic currently inside `upload_admin_video.stream_video_upload` into this helper. The helper signature should be:

```python
def stream_processed_video_upload(
    *,
    request_id: str,
    source_file_name: str,
    source_body: Any,
    source_content_type: str,
    alt_text: str,
    usage_scope: str,
    project_id: Optional[str],
    repository: admin_media.AdminMediaRepository,
    raw_source_storage_key: Optional[str] = None,
) -> Iterator[str]:
```

The helper must:

- yield the same event names currently asserted by tests;
- call `write_body_to_file(source_body, input_path)`;
- call `storage.validate_media_upload_input({"mimeType": source_content_type, "sizeBytes": source_size})`;
- upload scrub and standard variants with `storage.put_media_object`;
- create the same two media asset rows;
- clean up final uploaded objects if metadata persistence fails;
- call `storage.delete_raw_media_object(raw_source_storage_key)` after successful processing when `raw_source_storage_key` is provided;
- log raw deletion failures without changing the completed response.

Use this raw deletion block after yielding/creating `completed` data but before leaving the `try` block:

```python
if raw_source_storage_key:
    try:
        storage.delete_raw_media_object(raw_source_storage_key)
        log_video_upload(request_id, "raw-storage-cleanup-finished", {"sourceStorageKey": raw_source_storage_key})
    except Exception as cleanup_error:
        log_video_upload_error(
            request_id,
            "raw-storage-cleanup-failed",
            cleanup_error,
            {"sourceStorageKey": raw_source_storage_key},
        )
```

Then update `upload_admin_video` so its `StreamingResponse` calls the helper using the duplicated upload file descriptor:

```python
source_upload_file = os.fdopen(source_upload_fd, "rb")
return StreamingResponse(
    stream_processed_video_upload(
        request_id=request_id,
        source_file_name=file.filename or "video.mp4",
        source_body=source_upload_file,
        source_content_type=content_type,
        alt_text=alt_text,
        usage_scope=usage_scope,
        project_id=project_id,
        repository=repository,
    ),
    media_type="application/x-ndjson",
)
```

Keep the existing pre-stream validation in `upload_admin_video` so current tests still pass.

- [ ] **Step 6: Add process endpoint**

In `apps/backend/app/upload_routes.py`, add after `upload_admin_video`:

```python
@admin_uploads_router.post("/uploads/video/process")
def process_admin_video_upload(
    body: ProcessVideoUploadRequest,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[admin_media.AdminMediaRepository, Depends(admin_media.get_admin_media_repository)],
) -> StreamingResponse:
    request_id = str(uuid.uuid4())

    try:
        storage.validate_raw_upload_storage_key(body.sourceStorageKey)
        alt_text = body.altText.strip()
        if not alt_text:
            raise ValueError("Adicione um nome para identificar o arquivo.")
        usage_scope = _parse_usage_scope(body.usageScope)
        project_id = body.projectId.strip() if body.projectId else None
        if usage_scope == "project" and not project_id:
            raise ValueError("Escolha um projeto para este video.")
        raw_object = storage.get_raw_media_object(body.sourceStorageKey)
        source_content_type = str(raw_object.get("ContentType") or "video/mp4")
        if not source_content_type.startswith("video/"):
            raise ValueError("Este envio otimizado aceita apenas videos.")
    except storage.MediaObjectNotFound as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise _bad_request(error) from error

    return StreamingResponse(
        stream_processed_video_upload(
            request_id=request_id,
            source_file_name=source_file_name_from_storage_key(body.sourceStorageKey),
            source_body=raw_object["Body"],
            source_content_type=source_content_type,
            alt_text=alt_text,
            usage_scope=usage_scope,
            project_id=project_id,
            repository=repository,
            raw_source_storage_key=body.sourceStorageKey,
        ),
        media_type="application/x-ndjson",
    )
```

- [ ] **Step 7: Update unauthorized logging path**

In `apps/backend/app/main.py`, update the middleware condition:

```python
if request.url.path in {"/admin/uploads/video", "/admin/uploads/video/process"} and response.status_code == 401:
```

- [ ] **Step 8: Run backend route tests and verify they pass**

Run: `PYTHONPATH=apps/backend apps/backend/.venv/bin/pytest apps/backend/tests/test_upload_routes.py -v`

Expected: PASS.

- [ ] **Step 9: Run all backend tests**

Run: `npm run backend:test`

Expected: PASS.

- [ ] **Step 10: Commit backend endpoints**

```bash
git add apps/backend/app/upload_routes.py apps/backend/app/main.py apps/backend/tests/test_upload_routes.py
git commit -m "feat: process videos from raw storage uploads"
```

---

### Task 3: Add Lightweight Next Processing Proxy and Video Sign Action

**Files:**
- Modify: `apps/web/src/app/admin/upload-actions.ts`
- Add: `apps/web/src/app/admin/uploads/video/process/route.ts`
- Test: `apps/web/src/app/admin/upload-actions.test.ts`

- [ ] **Step 1: Update source-level tests for new front/backend boundary**

In `apps/web/src/app/admin/upload-actions.test.ts`, add a new source read near existing reads:

```ts
const videoProcessRouteSource = readFileSync(join(currentDir, "uploads", "video", "process", "route.ts"), "utf8");
```

Add these assertions after the existing video route assertions:

```ts
assert.equal(
  uploadActionsSource.includes("createSignedAdminVideoUploadAction"),
  true,
  "video uploads must request a signed raw storage URL through a server action",
);

assert.equal(
  videoProcessRouteSource.includes('buildBackendUrl("/admin/uploads/video/process")'),
  true,
  "video processing proxy must call the backend process endpoint",
);

assert.equal(
  videoProcessRouteSource.includes("request.json()"),
  true,
  "video processing proxy must forward JSON metadata instead of multipart file bodies",
);

assert.equal(
  videoProcessRouteSource.includes("request.formData()"),
  false,
  "video processing proxy must not parse large multipart uploads",
);
```

- [ ] **Step 2: Run web source test and verify it fails**

Run: `node --experimental-strip-types apps/web/src/app/admin/upload-actions.test.ts`

Expected: FAIL because `uploads/video/process/route.ts` does not exist or action name is missing.

- [ ] **Step 3: Add video sign action**

In `apps/web/src/app/admin/upload-actions.ts`, add types after `SignedAdminUploadResponse`:

```ts
export type SignedAdminVideoUploadResponse = {
  error?: string;
  sourceStorageKey?: string;
  uploadUrl?: string;
};

export type ProcessAdminVideoUploadInput = {
  altText: string;
  projectId?: string | null;
  sourceStorageKey: string;
  usageScope: string;
};
```

Add this action after `createSignedAdminUploadAction`:

```ts
export async function createSignedAdminVideoUploadAction(
  input: SignedAdminUploadInput,
): Promise<SignedAdminVideoUploadResponse> {
  const token = await getAdminBearerToken();

  if (!token) {
    return { error: "Missing admin access token." };
  }

  let response: Response;

  try {
    response = await fetch(buildBackendUrl("/admin/uploads/video/sign"), {
      body: JSON.stringify(input),
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return { error: "Não foi possível preparar o envio do vídeo." };
  }

  if (!response.ok) {
    return {
      error: await readEndpointError(response, "Não foi possível preparar o envio do vídeo."),
    };
  }

  return (await response.json()) as SignedAdminVideoUploadResponse;
}
```

- [ ] **Step 4: Add lightweight processing proxy route**

Create `apps/web/src/app/admin/uploads/video/process/route.ts` with:

```ts
import { cookies } from "next/headers";

import { ADMIN_ACCESS_TOKEN_COOKIE, verifyAdminAccessToken } from "@/lib/api/admin-auth";
import { env } from "@/lib/env";

const DEFAULT_BACKEND_PUBLIC_URL = "http://localhost:8000";

export const runtime = "nodejs";

function buildBackendUrl(path: string): URL {
  return new URL(
    path.replace(/^\/+/, ""),
    `${(env.BACKEND_PUBLIC_URL ?? DEFAULT_BACKEND_PUBLIC_URL).replace(/\/+$/, "")}/`,
  );
}

async function getAdminBearerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;

  try {
    if (!(await verifyAdminAccessToken(token))) {
      return null;
    }
  } catch {
    return null;
  }

  return token ?? null;
}

export async function POST(request: Request) {
  const token = await getAdminBearerToken();

  if (!token) {
    return Response.json({ error: "Missing admin access token." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Payload de processamento inválido." }, { status: 400 });
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(buildBackendUrl("/admin/uploads/video/process"), {
      body: JSON.stringify(payload),
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return Response.json({ error: "Não foi possível processar o vídeo." }, { status: 502 });
  }

  const headers = new Headers();
  const contentType = backendResponse.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return new Response(backendResponse.body, {
    headers,
    status: backendResponse.status,
    statusText: backendResponse.statusText,
  });
}
```

- [ ] **Step 5: Run source test and verify it passes**

Run: `node --experimental-strip-types apps/web/src/app/admin/upload-actions.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit web signing/proxy changes**

```bash
git add apps/web/src/app/admin/upload-actions.ts apps/web/src/app/admin/uploads/video/process/route.ts apps/web/src/app/admin/upload-actions.test.ts
git commit -m "feat: add direct video upload coordination"
```

---

### Task 4: Switch Client Video Upload to Direct R2 PUT

**Files:**
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
- Test: `apps/web/src/app/admin/upload-actions.test.ts`

- [ ] **Step 1: Write failing assertions for direct video PUT**

In `apps/web/src/app/admin/upload-actions.test.ts`, add these assertions near the other `mediaUploadFieldSource` upload assertions:

```ts
assert.equal(
  mediaUploadFieldSource.includes("createSignedAdminVideoUploadAction"),
  true,
  "video uploads must use signed raw upload action before processing",
);

assert.equal(
  mediaUploadFieldSource.includes("signedVideoUpload.uploadUrl"),
  true,
  "video uploads must PUT directly to the signed storage URL",
);

assert.equal(
  mediaUploadFieldSource.includes('fetch("/admin/uploads/video/process"'),
  true,
  "video uploads must start processing through the lightweight processing proxy",
);

assert.equal(
  mediaUploadFieldSource.includes('fetch("/admin/uploads/video", {'),
  false,
  "video uploads must not post the raw file to the Next video proxy",
);
```

- [ ] **Step 2: Run source test and verify it fails**

Run: `node --experimental-strip-types apps/web/src/app/admin/upload-actions.test.ts`

Expected: FAIL because `MediaUploadField.tsx` still posts video FormData to `/admin/uploads/video`.

- [ ] **Step 3: Update import**

In `apps/web/src/app/admin/components/MediaUploadField.tsx`, replace the upload action import with:

```ts
import {
  createSignedAdminUploadAction,
  createSignedAdminVideoUploadAction,
  type VideoUploadProgressEvent,
} from "../upload-actions";
```

- [ ] **Step 4: Replace video branch in `uploadFile`**

Replace the `if (file.type.startsWith("video/"))` block in `uploadFile` with:

```ts
if (file.type.startsWith("video/")) {
  setStatus("signing");
  setMessage(`Preparando envio de ${file.name}...`);

  const signedVideoUpload = await createSignedAdminVideoUploadAction({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });

  if (!signedVideoUpload.uploadUrl || !signedVideoUpload.sourceStorageKey) {
    throw new Error(signedVideoUpload.error || `Não foi possível preparar o envio de ${file.name}.`);
  }

  setStatus("uploading");
  setMessage(`Enviando ${file.name} para o storage...`);

  const uploadResponse = await fetch(signedVideoUpload.uploadUrl, {
    body: file,
    headers: { "Content-Type": file.type, "Content-Length": String(file.size) },
    method: "PUT",
  });

  if (!uploadResponse.ok) {
    throw new Error(`O envio de ${file.name} falhou. Verifique as configurações do storage.`);
  }

  setMessage(`Processando ${file.name}...`);

  const response = await fetch("/admin/uploads/video/process", {
    body: JSON.stringify({
      altText: displayName,
      projectId,
      sourceStorageKey: signedVideoUpload.sourceStorageKey,
      usageScope,
    }),
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Não foi possível otimizar ${file.name}.`);
  }

  await readVideoProgressStream(response, (event) => setMessage(event.message));

  return;
}
```

- [ ] **Step 5: Run source test and verify it passes**

Run: `node --experimental-strip-types apps/web/src/app/admin/upload-actions.test.ts`

Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint:web`

Expected: PASS.

- [ ] **Step 7: Commit client upload switch**

```bash
git add apps/web/src/app/admin/components/MediaUploadField.tsx apps/web/src/app/admin/upload-actions.test.ts
git commit -m "feat: upload admin videos directly to storage"
```

---

### Task 5: Remove Large Next Upload Limit and Obsolete Proxy Assumptions

**Files:**
- Modify: `apps/web/next.config.ts`
- Modify: `apps/web/src/app/admin/upload-proxy-config.test.ts`
- Optional delete: `apps/web/src/app/admin/uploads/video/route.ts`

- [ ] **Step 1: Update config test to expect no 500 MB proxy**

Replace `apps/web/src/app/admin/upload-proxy-config.test.ts` with:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nextConfigSource = readFileSync("apps/web/next.config.ts", "utf8");

assert.doesNotMatch(
  nextConfigSource,
  /proxyClientMaxBodySize:\s*["']501mb["']/,
  "video uploads go directly to storage, so Next must not keep a 500MB proxy body allowance",
);

assert.doesNotMatch(
  nextConfigSource,
  /bodySizeLimit:\s*["']501mb["']/,
  "video uploads go directly to storage, so Server Actions must not keep a 500MB body allowance",
);

assert.doesNotMatch(
  nextConfigSource,
  /middlewareClientMaxBodySize/,
  "Next 16 renamed middlewareClientMaxBodySize to proxyClientMaxBodySize",
);
```

- [ ] **Step 2: Run config test and verify it fails**

Run: `node --experimental-strip-types apps/web/src/app/admin/upload-proxy-config.test.ts`

Expected: FAIL because `next.config.ts` still includes `501mb` limits.

- [ ] **Step 3: Remove large Next limits**

Replace `apps/web/next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Decide whether to delete old large-file proxy route**

If no code references `/admin/uploads/video` after Task 4, delete `apps/web/src/app/admin/uploads/video/route.ts`. Before deleting, verify with:

Run: use Grep for `/admin/uploads/video"|/admin/uploads/video'|admin/uploads/video` under `apps/web/src`.

Expected: references should only point to `/admin/uploads/video/process` and source-level tests.

If the old route is deleted, remove the `videoUploadRouteSource` read and assertions about `request.formData()` from `apps/web/src/app/admin/upload-actions.test.ts`.

- [ ] **Step 5: Run web source tests**

Run:

```bash
node --experimental-strip-types apps/web/src/app/admin/upload-proxy-config.test.ts
node --experimental-strip-types apps/web/src/app/admin/upload-actions.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run build/lint**

Run: `npm run lint:web && npm run build:web`

Expected: PASS.

- [ ] **Step 7: Commit config cleanup**

```bash
git add apps/web/next.config.ts apps/web/src/app/admin/upload-proxy-config.test.ts apps/web/src/app/admin/upload-actions.test.ts apps/web/src/app/admin/uploads/video
git commit -m "chore: remove large video proxy allowance"
```

---

### Task 6: Full Verification and Integration Check

**Files:**
- No new files expected.
- Verify all files touched in Tasks 1-5.

- [ ] **Step 1: Run backend tests**

Run: `npm run backend:test`

Expected: PASS.

- [ ] **Step 2: Run web checks**

Run:

```bash
node --experimental-strip-types apps/web/src/app/admin/upload-actions.test.ts
node --experimental-strip-types apps/web/src/app/admin/upload-proxy-config.test.ts
npm run lint:web
npm run build:web
```

Expected: all commands PASS.

- [ ] **Step 3: Inspect git diff**

Run: `git diff --stat && git diff -- apps/backend/app/storage.py apps/backend/app/upload_routes.py apps/web/src/app/admin/components/MediaUploadField.tsx apps/web/next.config.ts`

Expected: diff shows raw upload helpers, backend process endpoint, direct browser `PUT`, lightweight processing proxy, and no large Next upload limit.

- [ ] **Step 4: Manual local smoke test with Docker services**

Run: `docker compose up --build`

Expected: services start successfully.

In the admin UI, upload a small MP4. Expected behavior:

- browser network panel shows a `PUT` request directly to the signed storage URL;
- browser network panel shows `/admin/uploads/video/process` with JSON request body;
- there is no multipart POST carrying the MP4 to `/admin/uploads/video`;
- progress modal reaches `Upload concluido.`;
- two media assets appear for scrub and standard variants.

- [ ] **Step 5: Commit final verification fixes if any**

If verification required small fixes, commit only those files:

```bash
git add apps/backend/app/storage.py apps/backend/app/upload_routes.py apps/backend/app/main.py apps/backend/tests/test_storage.py apps/backend/tests/test_upload_routes.py apps/web/src/app/admin/upload-actions.ts apps/web/src/app/admin/uploads/video/process/route.ts apps/web/src/app/admin/components/MediaUploadField.tsx apps/web/src/app/admin/upload-actions.test.ts apps/web/src/app/admin/upload-proxy-config.test.ts apps/web/next.config.ts
git commit -m "fix: stabilize direct video upload flow"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: direct R2 upload, backend processing from raw key, raw cleanup, frontend progress, Next limit removal, and tests are covered by Tasks 1-6.
- Scope boundary: worker/queue processing remains out of scope; this plan keeps processing in the existing FastAPI request path.
- Type consistency: backend uses `sourceStorageKey`, `uploadUrl`, `altText`, `usageScope`, and optional `projectId`; frontend uses the same property names.
- Security boundary: browser receives only signed R2 URL and raw key; backend auth token stays in server action and processing proxy.
