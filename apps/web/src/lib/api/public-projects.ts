import "server-only";

import { env } from "@/lib/env";

const DEFAULT_BACKEND_PUBLIC_URL = "http://localhost:8000";

export type MediaAsset = {
  id: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  usageScope: string;
  projectId: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  videoVariant: string | null;
  createdAt: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  location: string | null;
  year: number | null;
  shortDescription: string | null;
  clientArchitectName: string | null;
  clientArchitectEmail: string | null;
  clientArchitectPhone: string | null;
  clientArchitectWebsite: string | null;
  clientArchitectInstagram: string | null;
  clientArchitectImageAssetId: string | null;
  isPublished: boolean;
  heroVideoAssetId: string | null;
  fallbackImageAssetId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSection = {
  id: string;
  projectId: string;
  sortOrder: number;
  type: string;
  title: string | null;
  body: string | null;
  primaryMediaAssetId: string | null;
  posterMediaAssetId: string | null;
  caption: string | null;
  metadata: Record<string, unknown> | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublishedProjectPageData = {
  project: Project;
  heroVideoAsset: MediaAsset | null;
  fallbackImageAsset: MediaAsset | null;
  clientArchitectImageAsset: MediaAsset | null;
  sections: Array<{
    section: ProjectSection;
    primaryMediaAsset: MediaAsset | null;
    posterMediaAsset: MediaAsset | null;
  }>;
};

type FeaturedProject = {
  id: string;
  slug: string;
};

function getBackendPublicUrl(): string {
  return env.BACKEND_PUBLIC_URL ?? DEFAULT_BACKEND_PUBLIC_URL;
}

async function fetchPublicProjectApi(path: string): Promise<Response> {
  const url = new URL(path.replace(/^\/+/, ""), `${getBackendPublicUrl().replace(/\/+$/, "")}/`);

  return fetch(url, { cache: "no-store" });
}

export async function getFeaturedProject(): Promise<FeaturedProject | null> {
  const response = await fetchPublicProjectApi("/projects/featured");

  if (!response.ok) {
    throw new Error(`Failed to fetch featured project: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as FeaturedProject | null;
}

export async function getPublishedProjectBySlug(slug: string): Promise<PublishedProjectPageData | null> {
  const encodedSlug = encodeURIComponent(slug);
  const response = await fetchPublicProjectApi(`/projects/${encodedSlug}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch published project "${slug}": ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as PublishedProjectPageData;
}
