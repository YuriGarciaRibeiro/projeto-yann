import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  verifyAdminAccessToken,
} from "@/lib/api/admin-auth";

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
    <main className="min-h-screen bg-white px-6 py-10 text-neutral-950 md:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl flex-col justify-center">
        <p className="mb-6 text-admin-help uppercase tracking-[0.32em] text-neutral-500">
          Acesso admin
        </p>
        <h1 className="max-w-md text-admin-title font-normal tracking-[-0.04em]">
          Edição privada de projetos.
        </h1>
        <form action={loginAction} className="mt-12 space-y-7" noValidate>
          {errorMessage ? (
            <p
              className="border border-neutral-950 px-4 py-3 text-admin-body text-neutral-950"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="space-y-2">
            <label
              className="block text-admin-label uppercase tracking-[0.18em]"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              autoComplete="email"
              className="min-h-12 w-full border border-neutral-300 bg-white px-3 text-admin-control outline-none transition-colors focus:border-neutral-950"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div className="space-y-2">
            <label
              className="block text-admin-label uppercase tracking-[0.18em]"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              autoComplete="current-password"
              className="min-h-12 w-full border border-neutral-300 bg-white px-3 text-admin-control outline-none transition-colors focus:border-neutral-950"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          <button
            className="min-h-11 border border-neutral-950 px-5 text-admin-label uppercase tracking-[0.18em] transition-colors hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
            type="submit"
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
