import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAdminAction } from "../actions";
import { AdminThemeToggle } from "./AdminThemeToggle";

type AdminShellProps = {
  children: ReactNode;
  error?: string;
  status?: string;
};

export function AdminShell({ children, error, status }: AdminShellProps) {
  const navItems = [
    { href: "/admin", label: "Projetos" },
    { href: "/admin/projetos/novo", label: "Novo projeto" },
    { href: "/admin#midias", label: "Arquivos globais" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-border bg-card px-5 py-5 text-card-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
        <div>
          <div id="inicio">
            <p className="text-admin-help uppercase tracking-[0.28em] text-muted-foreground">
              Área privada
            </p>
            <h1 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
              Conteúdo
            </h1>
            <p className="mt-3 max-w-sm text-admin-body leading-6 text-muted-foreground">
              Organize páginas de projeto, fotos e vídeos.
            </p>
          </div>

          <nav
            aria-label="Navegação do admin"
            className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-2 lg:overflow-visible lg:pb-0"
          >
            {navItems.map((item) => (
              <Link
                className="inline-flex min-h-11 shrink-0 items-center border border-border px-4 text-admin-label uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring lg:border-transparent lg:px-0"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 lg:grid">
          <AdminThemeToggle />
          <Link
            className="inline-flex min-h-11 items-center justify-center border border-border px-4 text-admin-label uppercase tracking-[0.16em] transition-colors hover:border-primary focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
            href="/"
          >
            Ver site
          </Link>
          <form action={logoutAdminAction}>
            <button
              className="min-h-11 w-full border border-primary px-4 text-admin-label uppercase tracking-[0.16em] transition-colors hover:bg-primary hover:text-primary-foreground focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
              type="submit"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="px-5 py-6 md:px-8 md:py-10 xl:px-12">
        {status ? (
          <p
            className="mb-6 border border-border bg-card px-4 py-3 text-admin-body text-card-foreground"
            role="status"
          >
            {status}
          </p>
        ) : null}
        {error ? (
          <p
            className="mb-6 border border-destructive bg-destructive px-4 py-3 text-admin-body text-primary-foreground"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
      </div>
    </main>
  );
}
