import { and, asc, desc, eq, ilike, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "./client";
import {
  adminUsers,
  mediaAssets,
  type MediaUsageScope,
  type VideoVariant,
  projectSections,
  projectSectionTypes,
  projects,
  type ProjectSectionType,
} from "./schema";

export type ProjectUpsert = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  location: string;
  year: number;
  shortDescription: string;
  clientArchitectName: string;
  clientArchitectEmail?: string | null;
  clientArchitectPhone?: string | null;
  clientArchitectWebsite?: string | null;
  clientArchitectInstagram?: string | null;
  clientArchitectImageAssetId?: string | null;
  isPublished: boolean;
  heroVideoAssetId: string | null;
  fallbackImageAssetId: string | null;
};

export type ProjectSectionUpsert = {
  id?: string;
  projectId: string;
  sortOrder: number;
  type: ProjectSectionType;
  title: string | null;
  body: string | null;
  primaryMediaAssetId: string | null;
  posterMediaAssetId: string | null;
  caption: string | null;
  metadata: Record<string, unknown>;
  isEnabled: boolean;
};

export type MediaAssetCreate = {
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  projectId?: string | null;
  usageScope: MediaUsageScope;
  videoVariant?: VideoVariant | null;
};

async function validateScopedAsset(input: {
  assetId: string | null;
  expectedMimePrefix: string;
  label: string;
  projectId?: string | null;
  usageScope: MediaUsageScope;
  videoVariant?: VideoVariant;
}) {
  const { assetId, expectedMimePrefix, label, projectId, usageScope, videoVariant } = input;

  if (!assetId) {
    return;
  }

  const db = getDb();
  const [asset] = await db
    .select({
      mimeType: mediaAssets.mimeType,
      projectId: mediaAssets.projectId,
      usageScope: mediaAssets.usageScope,
      videoVariant: mediaAssets.videoVariant,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, assetId))
    .limit(1);

  if (!asset || !asset.mimeType.startsWith(expectedMimePrefix)) {
    throw new Error(`${label} precisa ser um arquivo válido.`);
  }

  if (asset.usageScope !== usageScope) {
    throw new Error(`${label} não pertence ao contexto correto.`);
  }

  if (usageScope === "project" && asset.projectId !== projectId) {
    throw new Error(`${label} precisa pertencer a este projeto.`);
  }

  if (usageScope === "site" && asset.projectId) {
    throw new Error(`${label} precisa ser um arquivo do site.`);
  }

  if (videoVariant && asset.videoVariant !== videoVariant) {
    throw new Error(`${label} precisa usar a versão otimizada para rolagem.`);
  }
}

function normalizeHttpUrl(value: string | null | undefined, label: string) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(trimmedValue);
  } catch {
    throw new Error(`${label} must be a valid http or https URL.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label} must use http or https.`);
  }

  return url.toString();
}

function normalizeInstagramValue(value: string | null | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.includes("://")) {
    return normalizeHttpUrl(trimmedValue, "Client architect Instagram");
  }

  const handle = trimmedValue.replace(/^@/, "");

  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
    throw new Error(
      "Client architect Instagram must be a valid http or https URL, @handle, or handle.",
    );
  }

  return `https://instagram.com/${handle}`;
}

function assertProjectHasContactMethod(input: {
  clientArchitectEmail?: string | null;
  clientArchitectInstagram?: string | null;
  clientArchitectPhone?: string | null;
  clientArchitectWebsite?: string | null;
}) {
  const hasContactMethod = [
    input.clientArchitectEmail,
    input.clientArchitectPhone,
    input.clientArchitectWebsite,
    input.clientArchitectInstagram,
  ].some((value) => Boolean(value?.trim()));

  if (!hasContactMethod) {
    throw new Error(
      "Published projects require at least one client architect contact method.",
    );
  }
}

export async function getAdminUserByEmail(email: string) {
  const db = getDb();

  const [adminUser] = await db
    .select()
    .from(adminUsers)
    .where(ilike(adminUsers.email, email))
    .limit(1);

  return adminUser ?? null;
}

export async function getPublishedProjects() {
  const db = getDb();

  return db
    .select()
    .from(projects)
    .where(eq(projects.isPublished, true))
    .orderBy(desc(projects.year), desc(projects.createdAt));
}

export async function getAdminProjects() {
  const db = getDb();

  return db.select().from(projects).orderBy(desc(projects.updatedAt));
}

export async function getAdminProjectById(projectId: string) {
  const db = getDb();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return project ?? null;
}

export async function deleteProject(projectId: string) {
  const db = getDb();
  const [project] = await db.delete(projects).where(eq(projects.id, projectId)).returning();

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  return project;
}

export async function getAdminMediaAssets() {
  const db = getDb();

  return db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
}

export async function getAdminSiteMediaAssets() {
  const db = getDb();

  return db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.usageScope, "site"))
    .orderBy(desc(mediaAssets.createdAt));
}

export async function getAdminProjectMediaAssets(projectId: string) {
  const db = getDb();

  return db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.usageScope, "project"), eq(mediaAssets.projectId, projectId)))
    .orderBy(desc(mediaAssets.createdAt));
}

export async function createMediaAsset(input: MediaAssetCreate) {
  const db = getDb();

  const [asset] = await db.insert(mediaAssets).values(input).returning();
  return asset;
}

async function validateProjectMediaAssets(input: ProjectUpsert) {
  await validateScopedAsset({
    assetId: input.heroVideoAssetId,
    expectedMimePrefix: "video/",
    label: "Vídeo de abertura",
    projectId: input.id,
    usageScope: "project",
    videoVariant: "scrub",
  });
  await validateScopedAsset({
    assetId: input.fallbackImageAssetId,
    expectedMimePrefix: "image/",
    label: "Imagem alternativa",
    projectId: input.id,
    usageScope: "project",
  });
  await validateScopedAsset({
    assetId: input.clientArchitectImageAssetId ?? null,
    expectedMimePrefix: "image/",
    label: "Imagem do arquiteto",
    projectId: input.id,
    usageScope: "project",
  });
}

export async function upsertProject(input: ProjectUpsert) {
  const db = getDb();
  const updatedAt = new Date();
  const {
    id,
    clientArchitectInstagram,
    clientArchitectWebsite,
    ...values
  } = input;
  const projectValues = { ...values, updatedAt };

  if (!input.clientArchitectName.trim()) {
    throw new Error("Client architect name is required.");
  }

  const normalizedProjectValues = {
    ...projectValues,
    clientArchitectInstagram: normalizeInstagramValue(clientArchitectInstagram),
    clientArchitectWebsite: normalizeHttpUrl(
      clientArchitectWebsite,
      "Client architect website",
    ),
  };

  if (normalizedProjectValues.isPublished) {
    assertProjectHasContactMethod(normalizedProjectValues);
  }

  await validateProjectMediaAssets(input);

  if (id) {
    const [project] = await db
      .update(projects)
      .set(normalizedProjectValues)
      .where(eq(projects.id, id))
      .returning();

    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    return project;
  }

  const [project] = await db.insert(projects).values(normalizedProjectValues).returning();
  return project;
}

async function validateProjectSectionMedia(input: ProjectSectionUpsert) {
  if (!projectSectionTypes.includes(input.type)) {
    throw new Error(`Unsupported project section type: ${input.type}`);
  }

  if (input.type === "parallax_video" || input.type === "video_block") {
    await validateScopedAsset({
      assetId: input.primaryMediaAssetId,
      expectedMimePrefix: "video/",
      label: "Foto ou vídeo principal",
      projectId: input.projectId,
      usageScope: "project",
    });
  }

  if (input.type === "image_block" || input.type === "contact_credit") {
    await validateScopedAsset({
      assetId: input.primaryMediaAssetId,
      expectedMimePrefix: "image/",
      label: "Foto ou vídeo principal",
      projectId: input.projectId,
      usageScope: "project",
    });
  }

  await validateScopedAsset({
    assetId: input.posterMediaAssetId,
    expectedMimePrefix: "image/",
    label: "Imagem alternativa",
    projectId: input.projectId,
    usageScope: "project",
  });
}

export async function getAdminProjectSections(projectId: string) {
  const db = getDb();
  const primaryMedia = alias(mediaAssets, "section_primary_media");
  const posterMedia = alias(mediaAssets, "section_poster_media");

  return db
    .select({
      section: projectSections,
      primaryMediaAsset: primaryMedia,
      posterMediaAsset: posterMedia,
    })
    .from(projectSections)
    .leftJoin(primaryMedia, eq(projectSections.primaryMediaAssetId, primaryMedia.id))
    .leftJoin(posterMedia, eq(projectSections.posterMediaAssetId, posterMedia.id))
    .where(eq(projectSections.projectId, projectId))
    .orderBy(asc(projectSections.sortOrder), asc(projectSections.createdAt));
}

export type AdminProjectSection = Awaited<ReturnType<typeof getAdminProjectSections>>[number];

export async function upsertProjectSection(input: ProjectSectionUpsert) {
  const db = getDb();
  const updatedAt = new Date();
  const { id, ...values } = input;
  const sectionValues = { ...values, updatedAt };

  await validateProjectSectionMedia(input);

  if (id) {
    const [section] = await db
      .update(projectSections)
      .set(sectionValues)
      .where(and(eq(projectSections.id, id), eq(projectSections.projectId, input.projectId)))
      .returning();

    if (!section) {
      throw new Error(`Project section not found: ${id}`);
    }

    return section;
  }

  const [section] = await db.insert(projectSections).values(sectionValues).returning();
  return section;
}

export async function deleteProjectSection(sectionId: string, projectId: string) {
  const db = getDb();
  const [section] = await db
    .delete(projectSections)
    .where(and(eq(projectSections.id, sectionId), eq(projectSections.projectId, projectId)))
    .returning();

  if (!section) {
    throw new Error(`Project section not found: ${sectionId}`);
  }

  return section;
}

export async function moveProjectSection(sectionId: string, sortOrder: number) {
  const db = getDb();
  const [section] = await db
    .update(projectSections)
    .set({ sortOrder, updatedAt: new Date() })
    .where(eq(projectSections.id, sectionId))
    .returning();

  if (!section) {
    throw new Error(`Project section not found: ${sectionId}`);
  }

  return section;
}

export async function reorderProjectSections(projectId: string, orderedSectionIds: string[]) {
  const db = getDb();

  if (orderedSectionIds.length === 0) {
    return [];
  }

  return db.transaction(async (tx) => {
    const existingSections = await tx
      .select({ id: projectSections.id })
      .from(projectSections)
      .where(
        and(
          eq(projectSections.projectId, projectId),
          inArray(projectSections.id, orderedSectionIds),
        ),
      );

    if (existingSections.length !== orderedSectionIds.length) {
      throw new Error("One or more project sections could not be found for reordering.");
    }

    const updatedAt = new Date();

    for (const [index, sectionId] of orderedSectionIds.entries()) {
      await tx
        .update(projectSections)
        .set({ sortOrder: (index + 1) * 10, updatedAt })
        .where(eq(projectSections.id, sectionId));
    }

    return tx
      .select()
      .from(projectSections)
      .where(eq(projectSections.projectId, projectId))
      .orderBy(asc(projectSections.sortOrder), asc(projectSections.createdAt));
  });
}

export async function getPublishedProjectBySlugWithMedia(slug: string) {
  const db = getDb();
  const heroVideo = alias(mediaAssets, "project_hero_video");
  const fallbackImage = alias(mediaAssets, "project_fallback_image");
  const clientArchitectImage = alias(mediaAssets, "client_architect_image");
  const primaryMedia = alias(mediaAssets, "section_primary_media");
  const posterMedia = alias(mediaAssets, "section_poster_media");

  const [projectRow] = await db
    .select({
      project: projects,
      heroVideoAsset: heroVideo,
      fallbackImageAsset: fallbackImage,
      clientArchitectImageAsset: clientArchitectImage,
    })
    .from(projects)
    .leftJoin(
      heroVideo,
      and(eq(projects.heroVideoAssetId, heroVideo.id), eq(heroVideo.videoVariant, "scrub")),
    )
    .leftJoin(fallbackImage, eq(projects.fallbackImageAssetId, fallbackImage.id))
    .leftJoin(
      clientArchitectImage,
      eq(projects.clientArchitectImageAssetId, clientArchitectImage.id),
    )
    .where(and(eq(projects.slug, slug), eq(projects.isPublished, true)))
    .limit(1);

  if (!projectRow) {
    return null;
  }

  const sections = await db
    .select({
      section: projectSections,
      primaryMediaAsset: primaryMedia,
      posterMediaAsset: posterMedia,
    })
    .from(projectSections)
    .leftJoin(primaryMedia, eq(projectSections.primaryMediaAssetId, primaryMedia.id))
    .leftJoin(posterMedia, eq(projectSections.posterMediaAssetId, posterMedia.id))
    .where(
      and(
        eq(projectSections.projectId, projectRow.project.id),
        eq(projectSections.isEnabled, true),
      ),
    )
    .orderBy(asc(projectSections.sortOrder), asc(projectSections.createdAt));

  return {
    ...projectRow,
    sections,
  };
}

export async function getFirstPublishedProjectForRoot() {
  const db = getDb();

  const [project] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
    })
    .from(projects)
    .where(eq(projects.isPublished, true))
    .orderBy(desc(projects.updatedAt))
    .limit(1);

  return project ?? null;
}
