"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  createSessionCookieValue,
  getExpiredSessionCookieOptions,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getAdminUserByEmail } from "@/lib/db/queries";

const LOGIN_ERROR_URL = "/admin/login?error=invalid";
const DUMMY_PASSWORD_HASH =
  "$2b$12$w7yuK75VOSO88Xug8WhxwOVYQBOk6RuBnkFbbviKt6ULWMKt2vlOu";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(LOGIN_ERROR_URL);
  }

  const adminUser = await getAdminUserByEmail(email);
  const isValid = await verifyPassword(
    password,
    adminUser?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!adminUser || !isValid) {
    redirect(LOGIN_ERROR_URL);
  }

  const session = await createSessionCookieValue(adminUser.id);
  const cookieStore = await cookies();

  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    session.value,
    getSessionCookieOptions(session.expiresAt),
  );

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, "", getExpiredSessionCookieOptions());
  redirect("/admin/login");
}
