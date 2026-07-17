# Project Scoped Media Design

## Goal

Separate project media from site/admin media. Photos and videos used in project pages must belong to a specific project. Media used for the site identity, profile, logo, and general admin content remains separate from projects.

## Approved Model

Each media asset has a usage context:

- `project`: media belongs to one project and can only be selected inside that project.
- `site`: media belongs to the site/admin context and can be used for profile, logo, and general content.

Project media requires a `projectId`. Site media does not use a `projectId`.

## Admin Experience

The global media library should no longer be the main workflow for project content.

Inside each project editor, show `Fotos e videos deste projeto`. Uploads from this area are saved with `usageScope = project` and that project's id. Project-level selectors and block selectors only show files from that same project.

In `Perfil / contato`, keep a separate area for `Arquivos do site`. Uploads from this area are saved with `usageScope = site`. Site/profile selectors only show site files.

Use simple Portuguese labels:

- `Arquivos deste projeto`
- `Enviar foto ou video`
- `Arquivos do site`
- `Usado em: Projeto`
- `Usado em: Site`

## Data Migration

Existing media should be assigned safely:

- Media already referenced by a project's hero video, fallback image, client architect image, or page blocks should become `project` media for that project.
- Media referenced by the site profile should become `site` media.
- Media with unclear usage should become `site` media so it remains accessible.

If one media asset is referenced by both a project and the site, prefer `site` only if it is used by the site profile; otherwise prefer the project reference. The current seed data can be updated to create the correct scoped records directly.

## Public Rendering

Public project pages should not change visually. The same hero, blocks, and contact footer render from the selected media records. The change is about ownership and admin selection safety.

## Out Of Scope

- Multi-project shared media.
- Automatic duplication when moving media between projects.
- Deleting files from storage.
- Video transcoding.
- Full i18n.

## Success Criteria

- Project uploads are tied to the project where they were uploaded.
- Project selectors cannot accidentally choose another project's media.
- Site/profile media remains available outside project scope.
- Existing seeded project still renders at `/projetos/sala-02`.
