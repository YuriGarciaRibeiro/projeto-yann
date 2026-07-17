# Modular Project Pages Design

## Purpose

Pivot the product from a personal architecture portfolio homepage into a platform where Yann creates and sells individual premium project pages for different architects. The public visitor no longer enters through a homepage. They receive a direct project URL such as `/projetos/sala-02`.

## Product Model

The admin remains single-user for Yann. Yann creates project pages for himself or for client architects. Each public page belongs to one project and can show the client architect's identity while keeping Yann's brand as a discreet production/curation mark.

The public product is not a catalog. There is no public list of all projects in the MVP.

## Public Routing

Public project pages live at:

```text
/projetos/[slug]
```

The root route `/` should not be a full homepage. In the MVP it should redirect to the first published project when one exists. If no project is published, it should show a minimal Yann-branded empty state.

## Page Template

Every project uses the same base template. The template is fixed, but the number, order, and type of project sections are configurable in the admin.

The top of every project page includes:

1. Yann logo/name as a discreet editorial signature.
2. Project hero with title, subtitle, client architect name, location, year, category, and primary media.
3. A quiet navigation/scroll cue if useful.

After the hero, the page renders the project's configured sections in order.

The end of every page includes contact details for the client architect and a discreet credit such as `Produzido por Yann`.

## Project Data

Each project needs:

1. Slug.
2. Title.
3. Subtitle.
4. Category.
5. Location.
6. Year.
7. Short description.
8. Published/draft status.
9. Client architect name.
10. Optional client architect logo/photo.
11. Client architect email.
12. Optional client architect phone.
13. Optional client architect Instagram/site.
14. Hero media and poster/fallback media.

The previous `featured project` concept becomes less important. Public access is by slug. The admin may still mark a project as primary only to decide where `/` redirects.

## Modular Sections

Each project has ordered sections. The admin can create, edit, remove, and reorder sections.

Common fields on every section:

1. Project relation.
2. Sort order.
3. Section type.
4. Optional title.
5. Optional body text.
6. Optional primary media.
7. Optional poster/fallback media.
8. Optional caption or metadata.
9. Enabled/disabled state.

Initial section types:

1. `parallax_video`: video controlled by scroll, using the existing SALA 02 interaction as the visual baseline.
2. `video_block`: large normal video block, no scroll scrub, useful for final presentation videos.
3. `image_block`: image-focused editorial section.
4. `text_block`: title and editorial copy.
5. `technical_info`: structured project facts.
6. `contact_credit`: client architect contact plus discreet Yann credit.

The admin is not a freeform visual builder. Yann composes the story by choosing section types and ordering them.

## Admin Experience

The admin should prioritize clarity over visual decoration.

Admin capabilities:

1. Login as Yann.
2. Upload media through the existing S3/MinIO flow.
3. Create/edit project identity and client architect information.
4. Add/edit/delete/reorder project sections.
5. Assign uploaded media to hero and section media fields.
6. Publish or unpublish projects.
7. Copy/open the public URL for a project.

The current upload system should be reused.

## Public Experience

The public page should preserve the premium architecture direction already established:

1. Predominantly black, white, and neutral gray UI.
2. Project media as protagonist.
3. Editorial rhythm, negative space, and strong typography.
4. No generic SaaS/catalog/card visual language.
5. Motion remains progressive enhancement.
6. Reduced motion and touch devices must not depend on long pinned scrub sections.
7. Failed media must degrade to poster/image/text, never blank sections.

The current homepage structure is a strong visual starting point, but it should become the project page template rather than the public homepage.

## Out Of Scope For MVP

The MVP does not include:

1. Multiple admin/client accounts.
2. Public catalog or project listing.
3. Payments.
4. Per-client domain or subdomain routing.
5. Visual layout builder with arbitrary alignment/theme controls.
6. Analytics.
7. Password-protected project pages.

## Migration From Current Implementation

Current reusable pieces:

1. Admin login/session.
2. Media upload to S3/MinIO.
3. Project table as a starting point.
4. Existing video parallax components.
5. Monochrome/editorial public design system.
6. Docker/Postgres/MinIO local setup.

Current pieces to change:

1. `/` is no longer a full homepage.
2. Project pages must be added at `/projetos/[slug]`.
3. The data model needs client architect fields and project sections.
4. Admin project editing must support sections.
5. Homepage-only profile/manifesto/services/contact sections should not be the center of the public product.

## Verification

The MVP is ready when:

1. Yann can create a project in admin.
2. Yann can add multiple ordered sections to that project.
3. A published project renders at `/projetos/[slug]`.
4. `/` redirects to a published project or shows a minimal empty state.
5. Parallax video, normal video, image, text, technical info, and contact/credit sections render correctly.
6. Lint and production build pass.
7. The local Docker setup supports migration, seed, admin login, media upload, and public page viewing.
