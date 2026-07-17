# Admin Studio Console Design

## Goal

Improve the private admin so Yann can manage project pages without technical vocabulary or a long dashboard-style page. The admin should feel like a simple editorial workspace for architecture projects.

## Language

The admin interface should be Portuguese-only for now. Future Portuguese/English project content is out of scope. Technical terms should be replaced with human labels:

- `Projects` -> `Projetos`
- `Media uploads` -> `Fotos e videos`
- `Sections` -> `Blocos da pagina`
- `Slug` -> `Endereco da pagina`
- `Published` -> `Publicado`
- `Featured` -> `Projeto principal`
- `Hero video asset` -> `Video de abertura`
- `Fallback image asset` -> `Imagem alternativa`
- `Client architect` -> `Arquiteto responsavel`
- `Metadata JSON` -> hidden under `Configuracoes avancadas`

## Layout Direction

Use the approved Studio Console direction. On desktop, the admin should have a quiet left navigation and a focused main editing area. On smaller screens, the navigation can become a compact top/stacked menu.

Navigation labels:

- `Inicio`
- `Projetos`
- `Fotos e videos`
- `Perfil / contato`
- `Ver site`
- `Sair`

Avoid colorful cards, badges, SaaS dashboard styling, heavy shadows, and decorative UI. Use spacing, typography, borders, and clear labels.

## Projects Area

The projects area remains the primary workflow. It should show project editing in a clearer structure without changing the database.

Requirements:

- Show project forms with Portuguese labels.
- Add a clear `Ver pagina do projeto` link when a project has a slug.
- Keep `Salvar projeto` as the main action.
- Use `Projeto principal` wording for the featured picker.
- Use `Arquiteto responsavel` for contact/client fields.

## Page Blocks

Rename `Sections` to `Blocos da pagina`.

Section type labels:

- `parallax_video` -> `Video com rolagem`
- `video_block` -> `Video simples`
- `image_block` -> `Imagem`
- `text_block` -> `Texto`
- `technical_info` -> `Ficha tecnica`
- `contact_credit` -> `Contato / creditos`

Each block should have a readable summary with order, translated type, title, current media, and `Visivel` / `Oculto` state. Editing fields should use Portuguese labels.

`Metadata JSON` should move into a closed `Configuracoes avancadas` details area because it is not normal editorial input.

## Media Area

Rename the media manager to `Fotos e videos`.

Labels:

- `Arquivo`
- `Nome para identificar`
- `Enviar`
- `Biblioteca`
- `Tipo`
- `Abrir arquivo`

Keep the current signed upload flow and media validation.

## Profile Area

Rename profile and homepage copy areas into understandable Portuguese. Since the public root redirects to a project, homepage copy should be secondary and can be called `Textos gerais`.

## Out Of Scope

- Full i18n implementation.
- New database fields.
- Drag and drop reordering.
- Real-time preview.
- Video transcoding.
- Multi-user permissions.
- Splitting every admin area into a separate route.

## Success Criteria

- Admin is easier to understand for a non-technical user.
- The long page becomes more navigable through a Studio Console structure.
- Existing create/edit/upload/publish flows keep working.
- Public project pages are not changed by this admin UX pass.
