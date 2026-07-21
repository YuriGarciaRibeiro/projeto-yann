# Admin Media Delete Design

## Goal

Add a safe delete option to the admin media library so an admin can remove unused project or site files from both the database and S3-compatible storage.

## Approved Behavior

- Each media library item shows an `Apagar` action.
- Deletion is blocked when the media asset is referenced anywhere in project or site content.
- If blocked, nothing is removed and the admin sees a clear message explaining that the file is in use.
- If the asset is unused, deletion removes the `media_assets` row and deletes the storage object from S3/MinIO.
- Missing assets return a not-found response rather than a successful delete.

## API Design

FastAPI adds a JWT-protected endpoint:

- `DELETE /admin/media/{asset_id}`

The endpoint delegates to `AdminMediaRepository.delete_media_asset(asset_id)` and maps repository errors to HTTP responses:

- `404` when the asset does not exist.
- `409` when the asset is referenced by content.
- `400` for other predictable validation/storage errors.

The delete operation should run in a transaction for database checks and row removal. The repository fetches the asset first, verifies references, deletes the row, commits the database change, then deletes the storage object using the existing `storage.delete_media_objects()` helper. If storage deletion fails after the row is committed, the API returns an error so the admin knows cleanup needs attention.

## Reference Blocking

Deletion is blocked if the media asset id appears in any of these columns:

- `projects.hero_video_asset_id`
- `projects.fallback_image_asset_id`
- `projects.client_architect_image_asset_id`
- `site_profile.portrait_image_asset_id`
- `project_sections.primary_media_asset_id`
- `project_sections.poster_media_asset_id`

The initial response only needs a human-readable message such as `Arquivo em uso. Remova-o do projeto antes de apagar.` Detailed per-field usage reporting is out of scope.

## Frontend Design

`apps/web/src/lib/api/admin-media.ts` gets `deleteAdminMediaAsset(assetId)` using the existing authenticated FastAPI fetch helper.

The admin UI adds a small `Apagar` control per library row in `MediaUploadField`. The control confirms before deleting, calls a server action or route-safe wrapper, refreshes the page on success, and displays backend errors inline. The existing monochrome admin style is preserved.

## Testing

- Backend repository tests cover unused asset deletion, missing asset, referenced asset blocking, transaction behavior, and storage helper invocation.
- Backend route tests cover authentication, success, `404`, and `409` mapping.
- Web tests cover the API client/server action error handling and keep existing media library item tests passing.

## Out of Scope

- Soft delete or trash recovery.
- Force delete that clears project references.
- Showing a full list of every reference in the UI.
- Bulk deletion.
- Deleting media variants as a group beyond the selected row.

## Self-Review

- The design matches the approved behavior: block in-use files and remove both database and storage for unused files.
- The API remains backend-owned, consistent with the existing FastAPI media migration.
- The scope stays focused on a single-file delete action and avoids schema changes.
