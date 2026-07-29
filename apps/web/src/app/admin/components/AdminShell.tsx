import Link from "next/link";
import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { logoutAdminAction } from "../actions";
import { AdminNavigation } from "./AdminNavigation";
import { AdminThemeToggle } from "./AdminThemeToggle";

type AdminShellProps = {
  children: ReactNode;
  error?: string;
  status?: string;
};

export function AdminShell({ children, error, status }: AdminShellProps) {
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

          <AdminNavigation />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Separator />
          <AdminThemeToggle />
          <Link
            className={buttonVariants({
              className: "min-h-11 rounded-none text-admin-label uppercase tracking-[0.16em]",
              variant: "outline",
            })}
            href="/"
          >
            Ver site
          </Link>
          <form action={logoutAdminAction}>
            <Button
              className="min-h-11 w-full rounded-none text-admin-label uppercase tracking-[0.16em]"
              type="submit"
            >
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="px-5 py-6 md:px-8 md:py-10 xl:px-12">
        {status ? (
          <Alert className="mb-6 rounded-none" role="status">
            <AlertDescription className="text-admin-body text-card-foreground">{status}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert className="mb-6 rounded-none" variant="destructive">
            <AlertDescription className="text-admin-body">{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
      </div>
    </main>
  );
}
