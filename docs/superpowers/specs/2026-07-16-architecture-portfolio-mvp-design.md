# Architecture Portfolio MVP Design

## Purpose

Build the first real version of an architecture portfolio for a professional architect. The site must present his work as premium, visual, and commercially credible. The first launch focuses on one strong project, with an admin area that lets the architect control which project is featured on the homepage.

## Product Scope

The MVP includes two surfaces:

1. A public editorial homepage centered on one featured project.
2. A private admin area for a single administrator.

The MVP does not include public project detail pages, filtering, multiple user roles, team permissions, client portals, blog posts, or analytics dashboards.

## Public Experience

The homepage follows the "Cinematic First" direction.

The page opens with a full-screen featured project hero. The project media is the primary content: video, render, or image. Text remains minimal and quiet: project title, category, location/year, and one short positioning sentence. Navigation should be restrained, with the architect name, links to profile, services, contact, and a subtle scroll cue.

After the hero, the page transitions into restrained editorial sections:

1. Short manifesto.
2. Architect profile.
3. Services or areas of practice.
4. Contact call-to-action.
5. Institutional footer.

Because the first launch has only one strong project, the public site should not pretend to have a complete catalog. It should still be structured so additional projects and detail pages can be added later without redesigning the homepage.

## Visual Direction

The implementation must follow `CLAUDE.md` and the project skills:

1. Predominantly black, white, and neutral gray.
2. Media as the protagonist; UI as a quiet frame.
3. Alternation between full-bleed cinematic sections and restrained editorial sections.
4. Generous negative space, strong typography, square or nearly square geometry.
5. No bright accent colors, SaaS visuals, glassmorphism, neon, excessive shadows, or large rounded cards.
6. Motion must be reversible and derived from scroll or explicit interaction state.
7. Reduced-motion, touch, slow-connection, and failed-media fallbacks are required.

## Admin Experience

The admin area lives under `/admin` and is protected by login for one administrator.

The admin can edit:

1. Featured project content: title, subtitle, category, location, year, short description, video, fallback image, and featured status.
2. Professional profile: architect name, short bio, manifesto, specialties, contact details, and social links.
3. Homepage copy: hero headline if separate from the project, manifesto text, services text, and contact CTA.
4. Media assets: upload images and videos to S3-compatible storage.

The first admin should favor clarity and reliability over visual polish. It must be easy for the architect to update content without editing code.

## Backend Architecture

Use Next.js as the application and backend runtime. Use Postgres on Railway as the main database. Use S3-compatible object storage for videos and images.

Backend responsibilities:

1. Authenticate the single admin user.
2. Protect all `/admin` routes and write operations.
3. Read published content for the public homepage.
4. Save profile, homepage copy, projects, and media metadata.
5. Generate signed upload URLs so the browser uploads large media directly to S3.

The server must not proxy video uploads through the Next.js app. Large files go from the browser directly to S3 using signed URLs.

## Data Model

The MVP data model has four core entities:

1. `AdminUser`: single administrator account, with hashed password and timestamps.
2. `SiteProfile`: architect identity, biography, manifesto, services copy, contact details, and social links.
3. `Project`: project title, slug, category, location, year, short description, publication status, featured flag, and media references.
4. `MediaAsset`: uploaded file metadata, including storage key, public URL or CDN URL, MIME type, file size, alt text, width/height when available, duration when available, and ownership relation.

Only one project should be featured at a time. The backend must enforce this when the admin chooses a featured project.

## Media Behavior

The featured project media must support a premium visual presentation without making the page fragile.

Required behavior:

1. Video can be used as the featured hero media.
2. A fallback image is required for reduced motion, failed video loading, and slow or unsupported contexts.
3. Scroll-controlled video may be used when the media is encoded appropriately, but the experience must degrade to normal poster/image presentation.
4. Only one scrubbed video should be active at a time.
5. Frequent animation should use transforms and opacity.
6. Videos should be encoded/exported for web delivery before production use.

## Deployment

Deploy the Next.js app to Railway with Railway Postgres. Configure S3-compatible storage through environment variables.

Expected environment configuration:

1. Database connection string.
2. Session/auth secret.
3. Initial admin email and password or a safe first-user setup flow.
4. S3 endpoint, region, bucket, access key, and secret key.
5. Public media base URL or CDN URL if available.

The app should include an initial seed path or setup command so the first admin and default content can be created predictably.

## Component Boundaries

Public components should be small and editorial:

1. `HeroFeaturedProject`.
2. `FeaturedProjectMedia`.
3. `ManifestoSection`.
4. `ProfileSection`.
5. `ServicesSection`.
6. `ContactSection`.
7. `SiteFooter`.

Admin components should be form-focused:

1. Login form.
2. Admin shell/navigation.
3. Project editor.
4. Profile editor.
5. Homepage copy editor.
6. Media upload field/gallery.

Infrastructure should be separated from UI:

1. Database access.
2. Auth/session helpers.
3. Content queries.
4. S3 upload/signing helpers.

## Quality Gates

Before calling the MVP complete, verify:

1. Lint passes.
2. Production build passes.
3. Public homepage renders with seeded content.
4. Admin login works and rejects invalid credentials.
5. Admin can update profile/homepage copy.
6. Admin can create or edit a project and mark it as featured.
7. Only one project remains featured after updates.
8. S3 upload flow stores media metadata in Postgres.
9. Featured media has fallback behavior for reduced motion and load failure.
10. Mobile layout is usable and does not depend on hover.

## Implementation Notes

Before implementation, read the relevant Next.js 16 documentation available in the installed package, as required by `AGENTS.md`. Also use the relevant project skills before building each area: architecture portfolio design, monochrome visual system, editorial typography, minimal UI components, scroll video experience, media performance, responsive accessibility, and architecture design review.

## Technical Direction For Implementation Planning

The implementation plan should validate these default technical choices before coding:

1. Postgres schema managed with a migration tool compatible with Railway deploys.
2. A small custom auth/session layer for the single admin account, using hashed passwords and httpOnly cookies.
3. S3-compatible uploads implemented with signed URLs and metadata persistence in Postgres.
4. Public content queries optimized for the homepage first, without adding project detail routes in the MVP.

If a library choice conflicts with Next.js 16 conventions or Railway deployment constraints, the implementation plan should document the reason for choosing a different tool.
