import { cookies } from "next/headers";

import { ADMIN_ACCESS_TOKEN_COOKIE, verifyAdminAccessToken } from "@/lib/api/admin-auth";
import { env } from "@/lib/env";

const DEFAULT_BACKEND_PUBLIC_URL = "http://localhost:8000";

function buildBackendUrl(path: string): URL {
  return new URL(
    path.replace(/^\/+/, ""),
    `${(env.BACKEND_PUBLIC_URL ?? DEFAULT_BACKEND_PUBLIC_URL).replace(/\/+$/, "")}/`,
  );
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

export async function POST(request: Request) {
  const token = await getAdminBearerToken();

  if (!token) {
    return Response.json({ error: "Missing admin access token." }, { status: 401 });
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(buildBackendUrl("/admin/uploads/video"), {
      body: await request.formData(),
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
    });
  } catch {
    return Response.json({ error: "Não foi possível otimizar o vídeo." }, { status: 502 });
  }

  const headers = new Headers();
  const contentType = backendResponse.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return new Response(backendResponse.body, {
    headers,
    status: backendResponse.status,
    statusText: backendResponse.statusText,
  });
}
