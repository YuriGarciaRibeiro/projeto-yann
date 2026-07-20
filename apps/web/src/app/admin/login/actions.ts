"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  getAdminAccessTokenCookieOptions,
  getExpiredAdminAccessTokenCookieOptions,
  loginAdminWithPassword,
} from "@/lib/api/admin-auth";

const INVALID_LOGIN_ERROR_URL = "/admin/login?error=invalid";
const UNAVAILABLE_LOGIN_ERROR_URL = "/admin/login?error=unavailable";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(INVALID_LOGIN_ERROR_URL);
  }

  let login: Awaited<ReturnType<typeof loginAdminWithPassword>>;

  try {
    login = await loginAdminWithPassword(email, password);
  } catch {
    redirect(UNAVAILABLE_LOGIN_ERROR_URL);
  }

  if (!login) {
    redirect(INVALID_LOGIN_ERROR_URL);
  }

  const cookieStore = await cookies();

  cookieStore.set(
    ADMIN_ACCESS_TOKEN_COOKIE,
    login.accessToken,
    getAdminAccessTokenCookieOptions(login.expiresIn),
  );

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.set(
    ADMIN_ACCESS_TOKEN_COOKIE,
    "",
    getExpiredAdminAccessTokenCookieOptions(),
  );
  redirect("/admin/login");
}
