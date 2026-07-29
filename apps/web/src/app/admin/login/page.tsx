import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  verifyAdminAccessToken,
} from "@/lib/api/admin-auth";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
    <main className="min-h-screen overflow-x-hidden bg-background px-6 py-10 text-foreground md:px-10">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
        href="#admin-login"
      >
        Pular para o formulário
      </a>
      <section className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-xl flex-col justify-center" id="admin-login">
        <div className="mb-10 self-start">
          <AdminThemeToggle variant="button" />
        </div>
        <p className="mb-6 text-admin-help uppercase tracking-[0.32em] text-muted-foreground">
          Acesso admin
        </p>
        <h1 className="max-w-md text-admin-title font-normal tracking-[-0.04em]">
          Edição privada de projetos.
        </h1>
        <form action={loginAction} className="mt-12" noValidate>
          {errorMessage ? (
            <p
              className="mb-7 border border-destructive px-4 py-3 text-admin-body text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <FieldGroup className="gap-7">
            <Field data-invalid={Boolean(errorMessage)}>
              <FieldLabel className="text-admin-label uppercase tracking-[0.18em]" htmlFor="email">
                E-mail
              </FieldLabel>
              <Input
                aria-invalid={Boolean(errorMessage) || undefined}
                autoComplete="email"
                id="email"
                name="email"
                required
                spellCheck={false}
                type="email"
              />
            </Field>

            <Field data-invalid={Boolean(errorMessage)}>
              <FieldLabel className="text-admin-label uppercase tracking-[0.18em]" htmlFor="password">
                Senha
              </FieldLabel>
              <Input
                aria-invalid={Boolean(errorMessage) || undefined}
                autoComplete="current-password"
                id="password"
                name="password"
                required
                type="password"
              />
            </Field>

            <Button type="submit">
              Entrar
            </Button>
          </FieldGroup>
        </form>
      </section>
    </main>
  );
}
