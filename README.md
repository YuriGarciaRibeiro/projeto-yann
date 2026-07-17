# Architecture Portfolio MVP

Next.js architecture portfolio with modular public project pages, single-admin content editing, Postgres persistence, and direct browser uploads to S3-compatible storage.

Public projects are served at `/projetos/[slug]`, for example `/projetos/sala-02`. The root route `/` redirects to the primary published project when one exists. If no published project is available, `/` shows a minimal Yann-branded empty state instead of a project catalog.

## Local Setup

### With Docker Compose

The repository includes a local Compose stack with Postgres and MinIO, an S3-compatible storage service.

```bash
docker compose up -d
npm install
npm run db:migrate
npm run seed
npm run dev
```

The local `.env` is already configured for this stack:

- Postgres: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`
- MinIO credentials: `minioadmin` / `minioadmin123`
- Admin login: `admin@example.com` / `admin123456`

The `minio-init` service creates the `architecture-portfolio` bucket, enables public reads for uploaded media, and applies CORS for local browser uploads.

### Manual Environment

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
AUTH_SECRET="replace-with-at-least-32-random-characters"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-before-production"
S3_ENDPOINT="https://s3.amazonaws.com"
S3_REGION="us-east-1"
S3_BUCKET="architecture-portfolio"
S3_ACCESS_KEY_ID="replace-me"
S3_SECRET_ACCESS_KEY="replace-me"
S3_PUBLIC_BASE_URL="https://cdn.example.com"
```

4. Run database migrations and seed the first admin/default content:

```bash
npm run db:migrate
npm run seed
```

5. Start the app:

```bash
npm run dev
```

The public site runs at `http://localhost:3000`. The admin editor runs at `http://localhost:3000/admin` and uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

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
3. Set all variables from `.env.example` in the Railway service environment.
4. Use the Railway-provided Postgres connection string for `DATABASE_URL`.
5. Set `AUTH_SECRET` to a long random production-only value.
6. Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running the seed command.
7. Configure the S3 variables for the production bucket or S3-compatible provider.
8. Run migrations and seed on Railway after deploy:

```bash
npm run db:migrate
npm run seed
```

For production media delivery, set `S3_PUBLIC_BASE_URL` to the public bucket URL or CDN origin that serves uploaded objects.

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

The admin uploads images directly to S3/MinIO. Videos are sent to the Next.js server first, optimized with FFmpeg, then saved to S3/MinIO as scrub-ready MP4 files. The server running the app must have `ffmpeg` available in `PATH`.

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

Future improvement: add a background worker if uploads become too slow for request-time conversion. The current implementation converts synchronously during the admin upload request.

## Verification

Run the production gates before release:

```bash
npm run db:generate
npm run db:migrate
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
