import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

import { ADMIN_ACCESS_TOKEN_COOKIE } from "./admin-auth";
import type { MediaUsageScope, VideoVariant } from "./project-types";

const DEFAULT_BACKEND_PUBLIC_URL = "http://localhost:8000";

export type AdminMediaAsset = {
  id: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  usageScope: MediaUsageScope;
  projectId: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  videoVariant: VideoVariant | null;
  createdAt: string;
};

export type MediaAssetCreateInput = {
  storageKey: string;
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

function getBackendPublicUrl(): string {
  return env.BACKEND_PUBLIC_URL ?? DEFAULT_BACKEND_PUBLIC_URL;
}

function buildAdminMediaUrl(path: string): URL {
  return new URL(path.replace(/^\/+/, ""), `${getBackendPublicUrl().replace(/\/+$/, "")}/`);
}

async function getAdminAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    throw new Error("Missing admin access token.");
  }

  return token;
}

function formatErrorDetail(detail: unknown): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (detail !== undefined) {
    return JSON.stringify(detail);
  }

  return "";
}

async function getResponseErrorMessage(response: Response, context: string): Promise<string> {
  let detail = "";

  try {
    const data = (await response.json()) as { detail?: unknown };
    const errorDetail = formatErrorDetail(data.detail);
    if (errorDetail) {
      detail = `: ${errorDetail}`;
    }
  } catch {
    // Ignore invalid or empty error bodies; status text is still useful context.
  }

  return `${context}: ${response.status} ${response.statusText}${detail}`;
}

async function fetchAdminMediaApi(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAdminAccessToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);

  return fetch(buildAdminMediaUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}

async function readAdminMediaResponse<T>(response: Response, context: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, context));
  }

  return (await response.json()) as T;
}

export async function getAdminSiteMediaAssets(): Promise<AdminMediaAsset[]> {
  const response = await fetchAdminMediaApi("/admin/media?scope=site");
  return readAdminMediaResponse<AdminMediaAsset[]>(response, "Failed to fetch admin site media assets");
}

export async function getAdminProjectMediaAssets(projectId: string): Promise<AdminMediaAsset[]> {
  const response = await fetchAdminMediaApi(
    `/admin/projects/${encodeURIComponent(projectId)}/media`,
  );

  return readAdminMediaResponse<AdminMediaAsset[]>(
    response,
    `Failed to fetch admin project media assets for "${projectId}"`,
  );
}

export async function createAdminMediaAsset(
  input: MediaAssetCreateInput,
): Promise<AdminMediaAsset> {
  const response = await fetchAdminMediaApi("/admin/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  return readAdminMediaResponse<AdminMediaAsset>(response, "Failed to create admin media asset");
}

export async function deleteAdminMediaAsset(assetId: string): Promise<AdminMediaAsset> {
  const response = await fetchAdminMediaApi(`/admin/media/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });

  return readAdminMediaResponse<AdminMediaAsset>(response, "Failed to delete admin media asset");
}
