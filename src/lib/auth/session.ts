import { env } from "@/lib/env";

export const ADMIN_SESSION_COOKIE = "admin_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

export type AdminSession = {
  adminUserId: string;
  expiresAt: number;
};

type SignedPayload = {
  sub: string;
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(env.AUTH_SECRET),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return base64UrlEncode(new Uint8Array(signature));
}

export function getSessionCookieOptions(expiresAt: number) {
  return {
    expires: new Date(expiresAt),
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function createSessionCookieValue(adminUserId: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload: SignedPayload = { exp: expiresAt, sub: adminUserId };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await signPayload(encodedPayload);

  return {
    expiresAt,
    value: `${encodedPayload}.${signature}`,
  };
}

export async function verifySessionCookieValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  let isValid = false;

  try {
    const key = await getSigningKey();
    isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signature),
      encoder.encode(encodedPayload),
    );
  } catch {
    return null;
  }

  if (!isValid) {
    return null;
  }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(encodedPayload)),
    ) as SignedPayload;

    if (!payload.sub || !payload.exp || payload.exp <= Date.now()) {
      return null;
    }

    return {
      adminUserId: payload.sub,
      expiresAt: payload.exp,
    } satisfies AdminSession;
  } catch {
    return null;
  }
}
