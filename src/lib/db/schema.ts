import {
  type AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mediaUsageScopes = ["site", "project"] as const;
export const videoVariants = ["standard", "scrub"] as const;

export type MediaUsageScope = (typeof mediaUsageScopes)[number];
export type VideoVariant = (typeof videoVariants)[number];

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  storageKey: text("storage_key").notNull().unique(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  altText: text("alt_text").notNull(),
  usageScope: varchar("usage_scope", { length: 20 })
    .$type<MediaUsageScope>()
    .default("site")
    .notNull(),
  projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
    onDelete: "set null",
  }),
  width: integer("width"),
  height: integer("height"),
  durationSeconds: integer("duration_seconds"),
  videoVariant: varchar("video_variant", { length: 20 }).$type<VideoVariant>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  year: integer("year").notNull(),
  shortDescription: text("short_description").notNull(),
  clientArchitectName: text("client_architect_name"),
  clientArchitectEmail: varchar("client_architect_email", { length: 320 }),
  clientArchitectPhone: varchar("client_architect_phone", { length: 80 }),
  clientArchitectWebsite: text("client_architect_website"),
  clientArchitectInstagram: text("client_architect_instagram"),
  clientArchitectImageAssetId: uuid("client_architect_image_asset_id").references(
    () => mediaAssets.id,
    { onDelete: "set null" },
  ),
  isPublished: boolean("is_published").default(false).notNull(),
  heroVideoAssetId: uuid("hero_video_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  fallbackImageAssetId: uuid("fallback_image_asset_id").references(
    () => mediaAssets.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectSectionTypes = [
  "parallax_video",
  "video_block",
  "image_block",
  "text_block",
  "technical_info",
  "contact_credit",
] as const;

export type ProjectSectionType = (typeof projectSectionTypes)[number];

export const projectSections = pgTable("project_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  type: varchar("type", { length: 40 }).$type<ProjectSectionType>().notNull(),
  title: text("title"),
  body: text("body"),
  primaryMediaAssetId: uuid("primary_media_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  posterMediaAssetId: uuid("poster_media_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  caption: text("caption"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectSection = typeof projectSections.$inferSelect;
export type NewProjectSection = typeof projectSections.$inferInsert;
