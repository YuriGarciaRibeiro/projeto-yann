# Admin Complete Improvements Design

## Goal

Improve the private admin into a more complete editorial workspace while preserving the current Studio Console direction, shadcn-based components, Portuguese interface, and existing backend contracts.

The admin should become easier to navigate, safer for destructive actions, more accessible, and more usable when the project/media library grows.

## Current Context

The admin lives under `apps/web/src/app/admin` in a Next.js App Router app. It already uses shadcn UI primitives for cards, tables, fields, buttons, dialogs, sidebar navigation, badges, and empty states.

Existing admin routes:

- `/admin` lists projects and global media.
- `/admin/login` authenticates admins.
- `/admin/projetos/novo` creates a project.
- `/admin/projetos/[id]` edits project details, project media, page blocks, and deletion.

The admin has good foundations: semantic links for navigation, real buttons for actions, skip links, field labels in core forms, destructive confirmation dialogs, and live regions for many async messages.

## Scope

This work is a focused admin improvement pass, not a redesign or backend migration.

Included:

- Accessibility and semantic fixes.
- Safer external links.
- Better dark/light browser integration.
- More resilient form behavior.
- Client-side search and filtering for projects and media.
- Better media library readability with previews and metadata where available.
- Stronger destructive confirmations.
- Small navigation improvements.

Out of scope:

- New database fields.
- New backend endpoints.
- Multi-user permissions.
- Drag-and-drop reordering.
- Real-time public page preview.
- Splitting the admin into multiple new routes.
- Unit tests unless explicitly requested.

## Recommended Approach

Use an incremental in-place improvement approach.

Layer 1 fixes correctness and accessibility issues with minimal behavioral change. Layer 2 adds client-side filtering on already-loaded data. Layer 3 improves media display. Layer 4 strengthens destructive actions. Layer 5 improves admin navigation.

This approach keeps risk low because each layer uses existing data and components. It also avoids a broad route redesign while still making the admin feel significantly more complete.

## Alternatives Considered

### Technical Fixes Only

This would only address headings, links, form attributes, focus behavior, and theme integration.

It is low risk but does not deliver the requested complete admin experience.

### Full Admin Redesign

This would introduce separate routes for projects, global media, settings, previews, and possibly a dedicated media detail view.

It could produce a more ambitious product, but it would touch too much at once, conflict with the current in-progress admin worktree, and likely require backend/API changes.

## Detailed Design

### Accessibility And Semantics

Primary admin page titles should use a meaningful `h1` on each route. Secondary card titles can remain card titles or lower-level headings as appropriate.

External links opened with `target="_blank"` should include `rel="noreferrer"`.

Form errors should remain inline and should also move focus to the first invalid field or a form-level alert when server validation fails. This applies most directly to the project form because it already receives structured field errors.

Form controls should use more accurate input types and attributes:

- YouTube URL fields use `type="url"`.
- Email-like admin fields disable spellcheck.
- File upload input has a meaningful `name`.

The shared button component should avoid `transition-all` and list transition properties explicitly.

### Theme Integration

The admin theme can continue to be stored in the `admin-theme` cookie and applied through `AdminThemeProvider`.

When dark mode is active, the provider should also update document-level browser integration so native controls, scrollbars, and form surfaces match the active theme. The implementation should avoid changing the public portfolio theme outside the admin route.

### Project List Search And Filtering

`ProjectList` should become an interactive client component or contain a small client child for controls and filtering.

Controls:

- Search by project title, slug, location, category, or year.
- Filter by status: all, published, draft.

Behavior:

- Filtering is client-side because projects are already loaded for the page.
- Empty filtered state explains that no project matches the current filters.
- The original empty state remains for zero projects.
- State can be local for this pass. URL sync is useful later but not required for the first implementation.

### Media Library Search, Filtering, And Preview

`MediaUploadField` should keep its upload and delete responsibilities, but the library display should become easier to scan.

Controls:

- Search by display name, MIME type, usage scope, or URL/storage-derived visible text if available.
- Filter by type: all, images, videos.

Display:

- Images show a small thumbnail preview using the existing asset URL.
- Videos show a compact video/file placeholder instead of loading full video previews by default.
- Rows show MIME type, usage scope, size when `sizeBytes` is available, and date when the API type already exposes one.
- Long names should truncate or wrap safely without breaking table layout.

Behavior:

- Empty filtered state is separate from empty library state.
- Existing upload progress modal and delete confirmation remain.
- The library remains table-based for now, using the existing table overflow wrapper.

### Media Select Scalability

Project and section media selects currently map all matching assets into select items. For this pass, avoid full virtualization and instead reduce practical friction through better labels and filtering in the media library.

If select item counts become a concrete problem, a later pass can replace selects with a searchable combobox or picker dialog. That is intentionally out of scope here to keep the implementation focused.

### Destructive Actions

Project deletion should require a stronger confirmation than a single click in a dialog.

Behavior:

- The delete project dialog asks the admin to type the exact project title.
- The destructive submit stays disabled until the typed title matches.
- The dialog copy remains Portuguese and explicit about what is removed.

Media and block delete can keep confirmation dialogs because they already have narrower scope and existing backend protection. Their messages should remain clear and use live regions for async results.

### Navigation

The sidebar should include a direct link to global media on the admin landing page, pointing to the existing `#midias` section.

The hash-based active state already exists in `AdminNavigation`, so adding this item fits the current structure without route changes.

### Error Handling

Existing server actions and upload flow remain the source of truth.

User-facing errors should:

- Stay in Portuguese.
- Explain the next step where practical.
- Use `role="alert"` for errors and `role="status"`/`aria-live="polite"` for progress and success.

Filtering controls should never hide upload or destructive operation errors.

## Data Flow

Project and media data continue to load on the server through existing API helpers.

Client components receive loaded arrays as props and derive filtered arrays in render from local search/filter state. No new network requests are needed for filtering.

Project form save, project section save/delete, media upload/delete, login, and logout continue to use existing server actions.

## Verification

Run non-unit verification only:

- `npm run lint:web`
- `npm run build:web` if lint passes and the environment supports a Next production build

Manual checks:

- Admin login page still renders.
- `/admin` shows projects and global media.
- Project search and status filter work.
- Media search and type filter work.
- Upload control remains usable.
- Delete project submit is disabled until the title is typed correctly.
- Keyboard navigation reaches sidebar, filters, tables, dialogs, and forms.
- Dark/light toggle updates visible theme and native browser surfaces in the admin.

## Self-Review

- No backend or database changes are required.
- The scope is focused on the current admin UI and does not redesign public portfolio pages.
- The design avoids test creation because the user preference says not to create, modify, or run unit tests unless explicitly requested.
- The largest risk is `MediaUploadField` growing more complex; implementation should prefer small local helpers and avoid extracting abstractions unless needed.
