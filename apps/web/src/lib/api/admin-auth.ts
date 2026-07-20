import "server-only";

import { env } from "@/lib/env";

export const ADMIN_ACCESS_TOKEN_COOKIE = "admin_access_token";

const DEFAULT_BACKEND_PUBLIC_URL = "http://localhost:8000";

type LoginResponse = { accessToken: string; tokenType: string; expiresIn: number };

export type CurrentAdmin = { id: string; email: string };

function getBackendPublicUrl(): string {
  return env.BACKEND_PUBLIC_URL ?? DEFAULT_BACKEND_PUBLIC_URL;
}

function buildAdminAuthUrl(path: string): URL {
  return new URL(path.replace(/^\/+/, ""), `${getBackendPublicUrl().replace(/\/+$/, "")}/`);
}

export function getAdminAccessTokenCookieOptions(expiresInSeconds: number) {
  return {
    httpOnly: true,
    expires: new Date(Date.now() + expiresInSeconds * 1000),
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getExpiredAdminAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function loginAdminWithPassword(
  email: string,
  password: string,
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const response = await fetch(buildAdminAuthUrl("/auth/login"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to login admin: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Partial<LoginResponse>;

  if (
    typeof data.tokenType !== "string" ||
    data.tokenType.toLowerCase() !== "bearer" ||
    typeof data.accessToken !== "string" ||
    data.accessToken.length === 0 ||
    typeof data.expiresIn !== "number" ||
    data.expiresIn <= 0
  ) {
    throw new Error("Invalid admin login response");
  }

  return { accessToken: data.accessToken, expiresIn: data.expiresIn };
}

export async function verifyAdminAccessToken(token: string | undefined): Promise<CurrentAdmin | null> {
  if (!token) {
    return null;
  }

  const response = await fetch(buildAdminAuthUrl("/auth/me"), {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to verify admin access token: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Partial<CurrentAdmin>;

  if (typeof data.id !== "string" || typeof data.email !== "string") {
    throw new Error("Invalid admin profile response");
  }

  return { id: data.id, email: data.email };
}
