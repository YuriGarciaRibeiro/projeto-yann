# Architecture Portfolio MVP

Next.js architecture portfolio with modular public project pages, single-admin content editing, Postgres persistence, FastAPI upload signing/video processing/media proxying, and direct browser uploads to S3-compatible storage.

Public projects are served at `/projetos/[slug]`, for example `/projetos/sala-02`. The root route `/` redirects to the primary published project when one exists. If no published project is available, `/` shows a minimal Yann-branded empty state instead of a project catalog.

## Local Setup

### With Docker Compose

The repository includes a local Compose stack with Postgres and MinIO, an S3-compatible storage service.

```bash
docker compose up -d postgres minio minio-init
npm install
npm run backend:install
cp apps/backend/.env.example apps/backend/.env
npm run seed
```

Backend-owned database, JWT, admin seed, and storage variables are defined in `apps/backend/.env.example`; copy that file to `apps/backend/.env` and replace secrets before production. `npm run seed` reads admin seed variables from `apps/backend/.env` first, then root `.env`; web env files remain supported only for transitional compatibility.

Start the web app and FastAPI backend concurrently in separate terminals:

```bash
npm run dev:web
```

```bash
npm run dev:backend
```

The local services are already configured with these defaults:

- Postgres: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`
- MinIO credentials: `minioadmin` / `minioadmin123`
- Admin login: `admin@example.com` / `admin123456`

When running the `web` service inside Compose, `BACKEND_PUBLIC_URL` is set to the container-internal FastAPI URL `http://backend:8000`.

The `minio-init` service creates the `architecture-portfolio` bucket, enables public reads for uploaded media, and applies CORS for local browser uploads.

### Manual Environment

1. Install dependencies:

```bash
npm install
npm run backend:install
```

2. Create local environment variables:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/backend/.env.example apps/backend/.env
```

3. Fill `apps/backend/.env` using `apps/backend/.env.example` as the source of truth for database, JWT, admin seed, and storage settings. Fill `apps/web/.env.local` only when the backend is not running at the default local URL:

```bash
BACKEND_PUBLIC_URL="http://localhost:8000"
```

Set admin seed credentials in `apps/backend/.env` before running `npm run seed`. A root `.env` using the backend-owned variable names from `.env.example` is also supported as a fallback; web env files remain transitional compatibility only.

Existing SQL migrations are legacy history pending backend migration ownership; this branch does not expose a root migration script.

4. Seed the first admin user:

```bash
npm run seed
```

5. Start the web app:

```bash
npm run dev:web
```

6. To run FastAPI at `http://localhost:8000`, start the backend in a separate terminal:

```bash
npm run dev:backend
```

The public site remains at `http://localhost:3000`. The admin editor remains at `http://localhost:3000/admin` and uses the seeded admin credentials through FastAPI JWT login. The FastAPI backend runs at `http://localhost:8000`, with health checks available at `http://localhost:8000/health`.

## Monorepo Layout

- `apps/web`: Next.js frontend, public project pages, and admin UI. It no longer owns DB, storage, or auth backend logic; admin flows use FastAPI clients and server actions only for safe HTTP-only cookie transport, redirects, and revalidation.
- `apps/backend`: FastAPI backend. It owns auth, public and admin project/section data, admin media listing and metadata creation, upload signing, video processing, storage verification, and media proxying.

The public project pages now read project data from FastAPI:

- `GET /projects/featured`
- `GET /projects/published`
- `GET /projects/{slug}`

Set `BACKEND_PUBLIC_URL` in `apps/web/.env.local` when the backend is not running at `http://localhost:8000`.

## FastAPI Auth

Admin login now uses the FastAPI JWT auth endpoints:

- `POST http://localhost:8000/auth/login` accepts `{ "email": "admin@example.com", "password": "admin123456" }` and returns a bearer token.
- `GET http://localhost:8000/auth/me` requires `Authorization: Bearer <token>` and returns the current admin id/email.

The frontend stores the bearer token in the `admin_access_token` HTTP-only cookie. Admin project and section CRUD, admin media listing, image metadata creation, upload signing, and video uploads use JWT-backed FastAPI endpoints.

## Content Workflow

Use the admin editor at `/admin` to publish a project page:

1. Upload image or video media in the media manager.
2. Create or edit a project with its slug, title, client architect details, hero media, and fallback image.
3. Add ordered project sections, choosing the section type, copy, media, poster, captions, metadata, and enabled state.
4. Publish the project and mark it as featured when it should be the primary project for `/`.
5. Open the public URL at `/projetos/[slug]`.

Only published projects are available on public project URLs. Enabled sections render in their numeric order.

## Railway Deployment

1. Create a Railway service from this repository.
2. Attach a Railway Postgres database.
3. Set backend-owned variables from `apps/backend/.env.example` in the FastAPI service environment, using the Railway-provided Postgres connection string for the backend database variable.
4. Set the backend JWT secret to a long random production-only value.
5. Configure backend admin seed credentials before running the seed command.
6. Configure backend storage variables for the production bucket or S3-compatible provider.
7. Set only `BACKEND_PUBLIC_URL` for the web service when its FastAPI URL differs from `http://localhost:8000`.
8. Seed on Railway after deploy:

```bash
npm run seed
```

For production media delivery, set the backend public storage base URL to the public bucket URL or CDN origin that serves uploaded objects.

## S3 CORS

Browser uploads use signed `PUT` requests directly to storage. The bucket must allow CORS from the deployed app origin and local development origin when testing uploads.

Minimum CORS requirements:

```json
[
  {
    "AllowedOrigins": ["https://your-production-domain.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

The upload request sends `Content-Type`, so that header must be allowed by CORS and must match the MIME type used when the signed URL is generated.

## Video Preparation

FastAPI signs direct image uploads to S3/MinIO, verifies stored objects, proxies media when needed, and processes admin video uploads with FFmpeg before saving scrub and standard MP4 variants. Video uploads stream newline-delimited progress events back to the admin UI while the request is still running. The backend server must have `ffmpeg` available in `PATH`.

Recommended export for scroll-scrub videos:

```bash
ffmpeg -i input.mp4 \
  -an \
  -c:v libx264 \
  -preset slow \
  -crf 20 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -g 12 \
  -keyint_min 12 \
  -sc_threshold 0 \
  output-scroll.mp4
```

Why these settings matter:

- `-an` removes audio tracks that are not used in silent architectural scrub videos.
- `-movflags +faststart` lets the browser start playback sooner.
- `-g 12`, `-keyint_min 12`, and `-sc_threshold 0` create predictable frequent keyframes, which makes scroll seeking more responsive.
- `-crf 20` is a good starting point for quality/size. Use `19` for higher quality or `22` for smaller files.
- `-pix_fmt yuv420p` keeps compatibility broad, especially for Safari and iOS.

Also create a lightweight poster image for every video:

```bash
ffmpeg -ss 00:00:01 -i input.mp4 -frames:v 1 -q:v 3 poster.jpg
```

Target budgets to start:

- First desktop scrub sequence: 6–12 MB.
- Mobile scrub sequence: 3–6 MB.
- Poster image: 100–300 KB.

Future improvement: add a background worker if request-time conversion becomes too fragile for large uploads or concurrent editors. The current implementation keeps conversion synchronous, but streams progress updates so the admin can see each processing stage.

## Verification

Run the production gates before release:

```bash
npm run seed
npm run lint
npm run build
```

Manual checks:

1. Visit `/` and confirm it redirects to the primary published project, or shows the empty state when no published project exists.
2. Visit a seeded project URL such as `/projetos/sala-02` and confirm the hero and ordered sections render.
3. Enable reduced motion and confirm the project page still shows the featured content without requiring long video scrubbing.
4. Check a narrow/mobile viewport and confirm the project page and admin do not overflow horizontally or depend on hover.
5. Tab through the public project links, login page, and admin forms; focus should remain visible.
6. Log in to `/admin`, upload image or video media, create or edit a project, add sections, publish it, and open its `/projetos/[slug]` URL.
