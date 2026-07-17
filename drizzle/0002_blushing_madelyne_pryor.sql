CREATE TABLE "project_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"type" varchar(40) NOT NULL,
	"title" text,
	"body" text,
	"primary_media_asset_id" uuid,
	"poster_media_asset_id" uuid,
	"caption" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "client_architect_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "client_architect_email" varchar(320);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "client_architect_phone" varchar(80);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "client_architect_website" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "client_architect_instagram" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "client_architect_image_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "project_sections" ADD CONSTRAINT "project_sections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_sections" ADD CONSTRAINT "project_sections_primary_media_asset_id_media_assets_id_fk" FOREIGN KEY ("primary_media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_sections" ADD CONSTRAINT "project_sections_poster_media_asset_id_media_assets_id_fk" FOREIGN KEY ("poster_media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_architect_image_asset_id_media_assets_id_fk" FOREIGN KEY ("client_architect_image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;