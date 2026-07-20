ALTER TABLE "media_assets" ADD COLUMN "usage_scope" varchar(20) DEFAULT 'site' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "project_id" uuid;--> statement-breakpoint
UPDATE "media_assets" AS media
SET "usage_scope" = 'project', "project_id" = project_media."project_id"
FROM (
  SELECT "id" AS "project_id", "hero_video_asset_id" AS "media_id" FROM "projects" WHERE "hero_video_asset_id" IS NOT NULL
  UNION
  SELECT "id" AS "project_id", "fallback_image_asset_id" AS "media_id" FROM "projects" WHERE "fallback_image_asset_id" IS NOT NULL
  UNION
  SELECT "id" AS "project_id", "client_architect_image_asset_id" AS "media_id" FROM "projects" WHERE "client_architect_image_asset_id" IS NOT NULL
  UNION
  SELECT "project_id", "primary_media_asset_id" AS "media_id" FROM "project_sections" WHERE "primary_media_asset_id" IS NOT NULL
  UNION
  SELECT "project_id", "poster_media_asset_id" AS "media_id" FROM "project_sections" WHERE "poster_media_asset_id" IS NOT NULL
) AS project_media
WHERE media."id" = project_media."media_id";--> statement-breakpoint
UPDATE "media_assets" AS media
SET "usage_scope" = 'site', "project_id" = NULL
FROM "site_profile" AS profile
WHERE media."id" = profile."portrait_image_asset_id";--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
