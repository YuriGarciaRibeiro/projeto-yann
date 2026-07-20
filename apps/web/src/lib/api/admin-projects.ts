import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

import { ADMIN_ACCESS_TOKEN_COOKIE } from "./admin-auth";
import type { ProjectSectionType } from "./project-types";
import type { MediaAsset } from "./public-projects";

const DEFAULT_BACKEND_PUBLIC_URL = "http://localhost:8000";

export type AdminProject = {
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

export type AdminProjectSectionRow = {
  id: string;
  projectId: string;
  sortOrder: number;
  type: ProjectSectionType;
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

export type ProjectUpsertInput = {
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

export type ProjectSectionUpsertInput = {
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

export type AdminProjectSection = {
  section: AdminProjectSectionRow;
  primaryMediaAsset: MediaAsset | null;
  posterMediaAsset: MediaAsset | null;
};

function getBackendPublicUrl(): string {
  return env.BACKEND_PUBLIC_URL ?? DEFAULT_BACKEND_PUBLIC_URL;
}

function buildAdminProjectUrl(path: string): URL {
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

async function getResponseErrorMessage(response: Response, context: string): Promise<string> {
  let detail = "";

  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") {
      detail = `: ${data.detail}`;
    }
  } catch {
    // Ignore invalid or empty error bodies; status text is still useful context.
  }

  return `${context}: ${response.status} ${response.statusText}${detail}`;
}

async function fetchAdminProjectApi(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAdminAccessToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);

  return fetch(buildAdminProjectUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}

async function readAdminProjectResponse<T>(response: Response, context: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, context));
  }

  return (await response.json()) as T;
}

export async function getAdminProjects(): Promise<AdminProject[]> {
  const response = await fetchAdminProjectApi("/admin/projects");
  return readAdminProjectResponse<AdminProject[]>(response, "Failed to fetch admin projects");
}

export async function getAdminProjectById(projectId: string): Promise<AdminProject | null> {
  const response = await fetchAdminProjectApi(`/admin/projects/${encodeURIComponent(projectId)}`);

  if (response.status === 404) {
    return null;
  }

  return readAdminProjectResponse<AdminProject>(
    response,
    `Failed to fetch admin project "${projectId}"`,
  );
}

export async function getAdminProjectSections(projectId: string): Promise<AdminProjectSection[]> {
  const response = await fetchAdminProjectApi(
    `/admin/projects/${encodeURIComponent(projectId)}/sections`,
  );

  return readAdminProjectResponse<AdminProjectSection[]>(
    response,
    `Failed to fetch admin project sections for "${projectId}"`,
  );
}

export async function upsertAdminProject(input: ProjectUpsertInput): Promise<AdminProject> {
  const { id, ...body } = input;
  const response = await fetchAdminProjectApi(
    id ? `/admin/projects/${encodeURIComponent(id)}` : "/admin/projects",
    {
      method: id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  return readAdminProjectResponse<AdminProject>(response, "Failed to save admin project");
}

export async function deleteAdminProject(projectId: string): Promise<AdminProject> {
  const response = await fetchAdminProjectApi(`/admin/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });

  return readAdminProjectResponse<AdminProject>(
    response,
    `Failed to delete admin project "${projectId}"`,
  );
}

export async function upsertAdminProjectSection(
  input: ProjectSectionUpsertInput,
): Promise<AdminProjectSectionRow> {
  const { id, projectId, ...body } = input;
  const response = await fetchAdminProjectApi(
    id
      ? `/admin/project-sections/${encodeURIComponent(id)}`
      : `/admin/projects/${encodeURIComponent(projectId)}/sections`,
    {
      method: id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(id ? { ...body, projectId } : body),
    },
  );

  return readAdminProjectResponse<AdminProjectSectionRow>(
    response,
    "Failed to save admin project section",
  );
}

export async function deleteAdminProjectSection(
  sectionId: string,
  projectId: string,
): Promise<AdminProjectSectionRow> {
  const url = buildAdminProjectUrl(`/admin/project-sections/${encodeURIComponent(sectionId)}`);
  url.searchParams.set("projectId", projectId);

  const response = await fetchAdminProjectApi(url.toString(), { method: "DELETE" });

  return readAdminProjectResponse<AdminProjectSectionRow>(
    response,
    `Failed to delete admin project section "${sectionId}"`,
  );
}
