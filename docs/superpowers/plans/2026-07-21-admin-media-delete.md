# Admin Media Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe `Apagar` action to the admin media library that blocks in-use files and deletes unused files from both Postgres and S3/MinIO.

**Architecture:** FastAPI owns media deletion through `DELETE /admin/media/{asset_id}`. The backend checks references before deleting the database row, then removes the storage object with the existing storage helper. The Next admin UI calls the backend through the existing server-only API client and a server action, then refreshes the current admin page.

**Tech Stack:** FastAPI, psycopg, pytest, Next.js App Router, React client components, server actions, Node `assert` tests.

---

## File Structure

- Modify: `apps/backend/app/admin_media.py`
  Add repository delete support, small domain exceptions, reference checks, and the `DELETE /admin/media/{asset_id}` route.
- Modify: `apps/backend/tests/test_admin_media.py`
  Add fake repository methods and route/repository tests for delete success, missing asset, in-use blocking, storage invocation, auth, and error mapping.
- Modify: `apps/web/src/lib/api/admin-media.ts`
  Add `deleteAdminMediaAsset(assetId)` using the existing authenticated backend fetch helper.
- Modify: `apps/web/src/app/admin/actions.ts`
  Add `deleteMediaAssetAction(assetId)` that requires an admin session, calls the API client, revalidates admin pages, and returns `{ ok, error }`.
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
  Add a per-row delete button with confirmation, pending state, inline messages, and `router.refresh()` on success.
- Modify: `apps/web/src/app/admin/components/media-library-items.test.ts`
  Keep the existing library mapping test passing and add a small assertion that row ids remain available for delete controls.

## Task 1: Backend Delete Endpoint

**Files:**
- Modify: `apps/backend/tests/test_admin_media.py`
- Modify: `apps/backend/app/admin_media.py`

- [ ] **Step 1: Write failing repository tests**

Add these tests after `test_create_media_asset_reraises_other_database_errors` in `apps/backend/tests/test_admin_media.py`:

```python
def test_delete_media_asset_removes_unused_row_and_storage_object(monkeypatch: pytest.MonkeyPatch) -> None:
    deleted_storage_keys: List[List[str]] = []
    connection = FakeConnection(one_rows=[media_row(), None, media_row()])
    monkeypatch.setattr(admin_media.storage, "delete_media_objects", lambda keys: deleted_storage_keys.append(list(keys)))

    asset = PostgresAdminMediaRepository(connection).delete_media_asset("asset-id")

    assert asset["id"] == "asset-id"
    assert "from media_assets" in connection.cursor_instance.queries[0]
    assert "from projects" in connection.cursor_instance.queries[1]
    assert "from project_sections" in connection.cursor_instance.queries[1]
    assert "delete from media_assets" in connection.cursor_instance.queries[2]
    assert connection.cursor_instance.params[0] == ("asset-id",)
    assert connection.cursor_instance.params[1] == ("asset-id",) * 6
    assert connection.cursor_instance.params[2] == ("asset-id",)
    assert deleted_storage_keys == [[DEFAULT_STORAGE_KEY]]


def test_delete_media_asset_raises_not_found_when_asset_is_missing() -> None:
    connection = FakeConnection(one_rows=[None])

    with pytest.raises(admin_media.MediaAssetNotFound, match="Media asset not found"):
        PostgresAdminMediaRepository(connection).delete_media_asset("missing-id")

    assert len(connection.cursor_instance.queries) == 1
    assert "delete from media_assets" not in " ".join(connection.cursor_instance.queries)


def test_delete_media_asset_blocks_when_asset_is_referenced() -> None:
    connection = FakeConnection(one_rows=[media_row(), {"source": "projects"}])

    with pytest.raises(admin_media.MediaAssetInUse, match="Arquivo em uso"):
        PostgresAdminMediaRepository(connection).delete_media_asset("asset-id")

    assert len(connection.cursor_instance.queries) == 2
    assert "delete from media_assets" not in " ".join(connection.cursor_instance.queries)


def test_delete_media_asset_commits_and_closes_owned_connection(monkeypatch: pytest.MonkeyPatch) -> None:
    connection = FakeConnection(one_rows=[media_row(), None, media_row()])
    monkeypatch.setattr(admin_media.psycopg, "connect", lambda *args, **kwargs: connection)
    monkeypatch.setattr(admin_media.storage, "delete_media_objects", lambda keys: None)

    PostgresAdminMediaRepository().delete_media_asset("asset-id")

    assert connection.commits == 1
    assert connection.rollbacks == 0
    assert connection.closes == 1
```

- [ ] **Step 2: Run repository tests to verify failure**

Run:

```bash
npm run backend:test -- apps/backend/tests/test_admin_media.py -k "delete_media_asset"
```

Expected: FAIL because `MediaAssetNotFound`, `MediaAssetInUse`, and `delete_media_asset` do not exist yet.

- [ ] **Step 3: Implement repository delete support**

In `apps/backend/app/admin_media.py`, update imports and add exceptions near the constants:

```python
from typing import Annotated, Iterator, List, Mapping, Optional, Protocol, Tuple


class MediaAssetNotFound(ValueError):
    pass


class MediaAssetInUse(ValueError):
    pass
```

Add this method to the `AdminMediaRepository` protocol after `create_media_assets`:

```python
    def delete_media_asset(self, asset_id: str) -> dict[str, object]:
        ...
```

Add these methods to `PostgresAdminMediaRepository` after `create_media_assets`:

```python
    def _get_media_asset(self, asset_id: str, connection: psycopg.Connection) -> Optional[dict[str, object]]:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                select {MEDIA_COLUMNS}
                from media_assets
                where id = %s
                limit 1
                """,
                (asset_id,),
            )
            return map_media_asset_row(cursor.fetchone())

    def _get_media_asset_reference(self, asset_id: str, connection: psycopg.Connection) -> Optional[Mapping[str, object]]:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select source
                from (
                    select 'projects' as source from projects where hero_video_asset_id = %s
                    union all
                    select 'projects' as source from projects where fallback_image_asset_id = %s
                    union all
                    select 'projects' as source from projects where client_architect_image_asset_id = %s
                    union all
                    select 'site_profile' as source from site_profile where portrait_image_asset_id = %s
                    union all
                    select 'project_sections' as source from project_sections where primary_media_asset_id = %s
                    union all
                    select 'project_sections' as source from project_sections where poster_media_asset_id = %s
                ) references
                limit 1
                """,
                (asset_id, asset_id, asset_id, asset_id, asset_id, asset_id),
            )
            return cursor.fetchone()

    def delete_media_asset(self, asset_id: str) -> dict[str, object]:
        with self._connection(write=True) as connection:
            asset = self._get_media_asset(asset_id, connection)
            if asset is None:
                raise MediaAssetNotFound("Media asset not found")

            if self._get_media_asset_reference(asset_id, connection) is not None:
                raise MediaAssetInUse("Arquivo em uso. Remova-o do projeto antes de apagar.")

            with connection.cursor() as cursor:
                cursor.execute(
                    f"""
                    delete from media_assets
                    where id = %s
                    returning {MEDIA_COLUMNS}
                    """,
                    (asset_id,),
                )
                deleted_asset = map_media_asset_row(cursor.fetchone())

        if deleted_asset is None:
            raise MediaAssetNotFound("Media asset not found")

        storage.delete_media_objects([str(deleted_asset["storageKey"])])
        return deleted_asset
```

- [ ] **Step 4: Run repository tests to verify pass**

Run:

```bash
npm run backend:test -- apps/backend/tests/test_admin_media.py -k "delete_media_asset"
```

Expected: PASS for the repository delete tests.

- [ ] **Step 5: Write failing route tests**

Update `FakeAdminMediaRepository` in `apps/backend/tests/test_admin_media.py` with:

```python
    def delete_media_asset(self, asset_id: str) -> dict[str, object]:
        self.calls.append(("delete_media_asset", (asset_id,)))
        return map_media_asset_row(media_row(id=asset_id))
```

Add these tests after `test_admin_create_media_route_returns_400_for_repository_error`:

```python
def test_admin_delete_media_route_requires_auth(route_repository: FakeAdminMediaRepository) -> None:
    app = create_app()
    app.dependency_overrides[admin_media.get_admin_media_repository] = lambda: route_repository
    test_client = TestClient(app)

    response = test_client.delete("/admin/media/asset-id")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}
    assert route_repository.calls == []


def test_admin_delete_media_route(client: TestClient, route_repository: FakeAdminMediaRepository) -> None:
    response = client.delete("/admin/media/asset-id")

    assert response.status_code == 200
    assert response.json()["id"] == "asset-id"
    assert route_repository.calls == [("delete_media_asset", ("asset-id",))]


def test_admin_delete_media_route_returns_404_for_missing_asset(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(asset_id: str) -> dict[str, object]:
        raise admin_media.MediaAssetNotFound("Media asset not found")

    monkeypatch.setattr(route_repository, "delete_media_asset", raise_error)

    response = client.delete("/admin/media/missing-id")

    assert response.status_code == 404
    assert response.json() == {"detail": "Media asset not found"}


def test_admin_delete_media_route_returns_409_for_referenced_asset(
    client: TestClient,
    route_repository: FakeAdminMediaRepository,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(asset_id: str) -> dict[str, object]:
        raise admin_media.MediaAssetInUse("Arquivo em uso. Remova-o do projeto antes de apagar.")

    monkeypatch.setattr(route_repository, "delete_media_asset", raise_error)

    response = client.delete("/admin/media/asset-id")

    assert response.status_code == 409
    assert response.json() == {"detail": "Arquivo em uso. Remova-o do projeto antes de apagar."}
```

- [ ] **Step 6: Run route tests to verify failure**

Run:

```bash
npm run backend:test -- apps/backend/tests/test_admin_media.py -k "admin_delete_media_route"
```

Expected: FAIL with `404 Not Found` for the new route.

- [ ] **Step 7: Implement the route**

Add this route to the end of `apps/backend/app/admin_media.py`:

```python
@admin_media_router.delete("/media/{asset_id}")
def delete_admin_media(
    asset_id: str,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    repository: Annotated[AdminMediaRepository, Depends(get_admin_media_repository)],
) -> dict[str, object]:
    try:
        return repository.delete_media_asset(asset_id)
    except MediaAssetNotFound as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except MediaAssetInUse as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except ValueError as error:
        raise _bad_request(error) from error
```

- [ ] **Step 8: Run backend tests**

Run:

```bash
npm run backend:test -- apps/backend/tests/test_admin_media.py
```

Expected: PASS.

- [ ] **Step 9: Commit backend work**

Run:

```bash
git add apps/backend/app/admin_media.py apps/backend/tests/test_admin_media.py
git commit -m "feat: add admin media delete endpoint"
```

## Task 2: Frontend API Client And Server Action

**Files:**
- Modify: `apps/web/src/lib/api/admin-media.ts`
- Modify: `apps/web/src/app/admin/actions.ts`

- [ ] **Step 1: Add API client function**

In `apps/web/src/lib/api/admin-media.ts`, add after `createAdminMediaAsset`:

```ts
export async function deleteAdminMediaAsset(assetId: string): Promise<AdminMediaAsset> {
  const response = await fetchAdminMediaApi(`/admin/media/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });

  return readAdminMediaResponse<AdminMediaAsset>(response, "Failed to delete admin media asset");
}
```

- [ ] **Step 2: Add server action**

In `apps/web/src/app/admin/actions.ts`, change the media import to:

```ts
import { createAdminMediaAsset, deleteAdminMediaAsset } from "@/lib/api/admin-media";
```

Add this exported action after `saveMediaAssetAction`:

```ts
export async function deleteMediaAssetAction(assetId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminSession();

  try {
    await deleteAdminMediaAsset(assetId);
    revalidatePath("/admin");
    revalidatePath("/admin/projetos/[id]", "page");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível apagar o arquivo.",
    };
  }
}
```

- [ ] **Step 3: Run TypeScript-focused checks**

Run:

```bash
npm run lint:web
```

Expected: PASS or existing lint output unrelated to these two files. Fix any errors in the edited files before continuing.

- [ ] **Step 4: Commit frontend API/action work**

Run:

```bash
git add apps/web/src/lib/api/admin-media.ts apps/web/src/app/admin/actions.ts
git commit -m "feat: add admin media delete action"
```

## Task 3: Admin Library Delete UI

**Files:**
- Modify: `apps/web/src/app/admin/components/media-library-items.test.ts`
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`

- [ ] **Step 1: Add a small library item id assertion**

Append to `apps/web/src/app/admin/components/media-library-items.test.ts`:

```ts
assert.deepEqual(
  items.map((item) => item.id),
  ["scrub-1", "standard-1", "scrub-2", "standard-2"],
  "library rows should expose stable asset ids for row actions",
);
```

- [ ] **Step 2: Run the library item test**

Run:

```bash
node --import tsx apps/web/src/app/admin/components/media-library-items.test.ts
```

Expected: PASS. This confirms the data shape already supports per-row delete controls.

- [ ] **Step 3: Import the delete action**

In `apps/web/src/app/admin/components/MediaUploadField.tsx`, change the action import to:

```ts
import { deleteMediaAssetAction, saveMediaAssetAction } from "../actions";
```

- [ ] **Step 4: Add delete state and handler**

Inside `MediaUploadField`, after the existing `status` state, add:

```ts
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
```

After `handleSubmit`, add:

```ts
  async function handleDeleteAsset(assetId: string, displayName: string) {
    if (isBusy || deletingAssetId) {
      return;
    }

    const confirmed = window.confirm(`Apagar "${displayName}"? Esta ação remove o arquivo da biblioteca e do storage.`);
    if (!confirmed) {
      return;
    }

    setDeletingAssetId(assetId);
    setStatus("idle");
    setMessage(`Apagando ${displayName}...`);

    try {
      const result = await deleteMediaAssetAction(assetId);
      if (!result.ok) {
        throw new Error(result.error ?? "Não foi possível apagar o arquivo.");
      }

      setMessage(`${displayName} apagado.`);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível apagar o arquivo.");
    } finally {
      setDeletingAssetId(null);
    }
  }
```

- [ ] **Step 5: Add the `Apagar` button to each row**

Replace the `<li>` body in the `libraryItems.map` block with:

```tsx
                  <div className="grid gap-1">
                    <span className="font-medium">{item.displayName}</span>
                    <span className="text-neutral-600">
                      {item.mimeType} / Usado em: {item.usageScope === "site" ? "Site" : "Projeto"}
                    </span>
                  </div>
                  <button
                    className="justify-self-start border border-neutral-300 px-3 py-2 text-admin-label uppercase tracking-[0.14em] text-neutral-700 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 disabled:hover:bg-white disabled:hover:text-neutral-400 md:justify-self-end"
                    disabled={isBusy || deletingAssetId !== null}
                    onClick={() => void handleDeleteAsset(item.id, item.displayName)}
                    type="button"
                  >
                    {deletingAssetId === item.id ? "Apagando" : "Apagar"}
                  </button>
                  <a
                    className="break-all text-neutral-600 underline underline-offset-4 md:col-span-2"
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir arquivo: {item.url}
                  </a>
```

- [ ] **Step 6: Run component-adjacent tests and lint**

Run:

```bash
node --import tsx apps/web/src/app/admin/components/media-library-items.test.ts
npm run lint:web
```

Expected: PASS. If lint flags line length for the confirmation string, split the template string into a constant before calling `window.confirm`.

- [ ] **Step 7: Commit UI work**

Run:

```bash
git add apps/web/src/app/admin/components/MediaUploadField.tsx apps/web/src/app/admin/components/media-library-items.test.ts
git commit -m "feat: add media library delete control"
```

## Task 4: Full Verification

**Files:**
- No code changes expected unless verification finds a bug.

- [ ] **Step 1: Run backend test suite**

Run:

```bash
npm run backend:test
```

Expected: PASS.

- [ ] **Step 2: Run targeted web tests**

Run:

```bash
node --import tsx apps/web/src/app/admin/components/media-library-items.test.ts
node --import tsx apps/web/src/app/admin/upload-actions.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint:web
```

Expected: PASS.

- [ ] **Step 4: Review git diff**

Run:

```bash
git status --short
git diff --stat HEAD~3..HEAD
```

Expected: only intended backend, frontend, test, and plan/spec files are changed across the feature commits.

## Self-Review

- Spec coverage: the backend endpoint, reference blocking, DB plus storage deletion, frontend `Apagar` action, and tests are all covered by tasks.
- Placeholder scan: no `TBD`, `TODO`, or undefined implementation steps remain.
- Type consistency: `delete_media_asset`, `deleteAdminMediaAsset`, and `deleteMediaAssetAction` signatures are consistent across tasks.
