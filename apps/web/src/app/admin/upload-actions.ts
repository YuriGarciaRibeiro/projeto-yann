"use server";

import { cookies } from "next/headers";

import { ADMIN_ACCESS_TOKEN_COOKIE, verifyAdminAccessToken } from "@/lib/api/admin-auth";
import { env } from "@/lib/env";

const DEFAULT_BACKEND_PUBLIC_URL = "http://localhost:8000";

export type SignedAdminUploadInput = {
  fileName: string;
  mimeType: string;
  size: number;
};

export type SignedAdminUploadResponse = {
  error?: string;
  storageKey?: string;
  uploadUrl?: string;
  url?: string;
};

export type VideoUploadProgressEvent = {
  error?: string;
  event: string;
  message: string;
  ok?: boolean;
  requestId: string;
};

function buildBackendUrl(path: string): URL {
  return new URL(
    path.replace(/^\/+/, ""),
    `${(env.BACKEND_PUBLIC_URL ?? DEFAULT_BACKEND_PUBLIC_URL).replace(/\/+$/, "")}/`,
  );
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

async function readEndpointError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown; error?: unknown };
    return formatErrorDetail(data.error) || formatErrorDetail(data.detail) || fallback;
  } catch {
    return fallback;
  }
}

async function getAdminBearerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;

  try {
    if (!(await verifyAdminAccessToken(token))) {
      return null;
    }
  } catch {
    return null;
  }

  return token ?? null;
}

export async function createSignedAdminUploadAction(
  input: SignedAdminUploadInput,
): Promise<SignedAdminUploadResponse> {
  const token = await getAdminBearerToken();

  if (!token) {
    return { error: "Missing admin access token." };
  }

  let response: Response;

  try {
    response = await fetch(buildBackendUrl("/admin/uploads/sign"), {
      body: JSON.stringify(input),
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return { error: "Não foi possível preparar o envio." };
  }

  if (!response.ok) {
    return {
      error: await readEndpointError(response, "Não foi possível preparar o envio."),
    };
  }

  return (await response.json()) as SignedAdminUploadResponse;
}
