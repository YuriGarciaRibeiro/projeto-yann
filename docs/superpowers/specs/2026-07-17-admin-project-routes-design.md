# Admin Project Routes Design

## Goal

Make the admin easier to understand by separating the project list from individual project editing. The admin should no longer show every project form, upload area, and block editor on one page.

## Approved Flow

- `/admin`: project list and admin overview.
- `/admin/projetos/novo`: create a new project.
- `/admin/projetos/[id]`: edit one project.

After creating a project, the admin should redirect directly to `/admin/projetos/[id]` for that new project.

## `/admin` Project List

The list page should show projects with simple Portuguese labels:

- `Projeto`
- `Ano`
- `Status`
- `Principal`
- `Editar`
- `Ver página`

It should include a clear `Criar novo projeto` action. It can keep secondary areas for `Arquivos do site`, `Perfil / contato`, and `Textos gerais`, but it should not render every project's full editor.

## New Project Page

`/admin/projetos/novo` shows only the project form. Because project media belongs to a project, uploads and block editing appear only after the project exists. After save, redirect to the edit page for the created project.

## Edit Project Page

`/admin/projetos/[id]` shows one project's complete workspace:

- Project details form.
- `Arquivos deste projeto` upload/library.
- `Blocos da página` editor.
- `Ver página do projeto` link.
- Link back to `Projetos`.

No other projects should render on this page.

## Existing Behavior To Preserve

- Admin auth protection.
- Existing server actions and validation.
- Project-scoped media filtering.
- Public project pages.
- Site media/profile editing.

## Out Of Scope

- Drag and drop block ordering.
- Multi-step wizard.
- Full i18n.
- New permission system.
- Public layout changes.
