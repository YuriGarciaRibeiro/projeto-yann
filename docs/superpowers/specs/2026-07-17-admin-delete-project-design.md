# Admin Delete Project Design

## Goal

Add a safe admin option to permanently delete a project from its edit page.

## Approved Behavior

- The delete control appears on `/admin/projetos/[id]` in a separate danger area.
- The button label is `Apagar projeto`.
- The browser asks for confirmation before submitting the delete form.
- The server action requires an authenticated admin session.
- The server deletes the project by id.
- Project sections are removed by the existing database cascade.
- Project media files are not deleted from MinIO/S3 in this version.
- After success, the admin is redirected to `/admin?status=Projeto apagado.`.
- If deletion fails, the admin is redirected with an error message.

## Non-Goals

- No archive/restore flow.
- No deletion of physical media files from storage.
- No bulk project deletion.
- No public UI changes.

## Verification

- Lint passes.
- Production build passes.
- Admin routes still redirect unauthenticated users to login.
