import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  verifyAdminAccessToken,
} from "@/lib/api/admin-auth";

import { AdminThemeToggle } from "../components/AdminThemeToggle";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  let admin: Awaited<ReturnType<typeof verifyAdminAccessToken>> = null;

  try {
    admin = await verifyAdminAccessToken(
      cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value,
    );
  } catch {
    admin = null;
  }

  if (admin) {
    redirect("/admin");
  }

  const params = await searchParams;
  const errorMessage =
    params.error === "invalid"
      ? "E-mail ou senha incorretos."
      : params.error === "unavailable"
        ? "Não foi possível conectar ao serviço de autenticação. Tente novamente."
        : null;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground md:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl flex-col justify-center">
        <div className="mb-10 self-start">
          <AdminThemeToggle />
        </div>
        <p className="mb-6 text-admin-help uppercase tracking-[0.32em] text-muted-foreground">
          Acesso admin
        </p>
        <h1 className="max-w-md text-admin-title font-normal tracking-[-0.04em]">
          Edição privada de projetos.
        </h1>
        <form action={loginAction} className="mt-12 flex flex-col gap-7" noValidate>
          {errorMessage ? (
            <p
              className="border border-destructive px-4 py-3 text-admin-body text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <label
              className="block text-admin-label uppercase tracking-[0.18em]"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              autoComplete="email"
              className="min-h-12 w-full border border-input bg-background px-3 text-admin-control text-foreground outline-none transition-colors focus:border-ring focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="block text-admin-label uppercase tracking-[0.18em]"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              autoComplete="current-password"
              className="min-h-12 w-full border border-input bg-background px-3 text-admin-control text-foreground outline-none transition-colors focus:border-ring focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          <button
            className="min-h-11 border border-primary px-5 text-admin-label uppercase tracking-[0.18em] transition-colors hover:bg-primary hover:text-primary-foreground focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
            type="submit"
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
