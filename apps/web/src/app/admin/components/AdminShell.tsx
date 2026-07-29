"use client";

import { LogOutIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { logoutAdminAction } from "../actions";
import { AdminNavigation } from "./AdminNavigation";
import { AdminThemeToggle } from "./AdminThemeToggle";

type AdminShellProps = {
  children: ReactNode;
  defaultOpen: boolean;
};

export function AdminShell({ children, defaultOpen }: AdminShellProps) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return children;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
        href="#admin-content"
      >
        Pular para o conteúdo
      </a>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden size-8 md:inline-flex" />
                <div className="flex min-h-8 flex-1 items-center px-2 text-sm font-medium group-data-[collapsible=icon]:hidden">
                  Yann | Archviz
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <AdminNavigation />
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu className="gap-3">
            <SidebarMenuItem>
              <AdminThemeToggle />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <form action={logoutAdminAction}>
                <SidebarMenuButton render={<button type="submit" />} tooltip="Sair">
                  <LogOutIcon aria-hidden="true" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-screen overflow-x-hidden text-foreground">
        <div className="px-5 pt-5 md:hidden">
          <SidebarTrigger className="md:hidden" />
        </div>
        <div className="min-w-0 px-5 py-6 md:px-8 md:py-10 xl:px-12" id="admin-content">
          <AdminRouteMessages />
          <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminRouteMessages() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const error = searchParams.get("error");

  return (
    <>
      {status ? (
        <Alert className="mb-6" role="status">
          <AlertDescription className="text-admin-body text-card-foreground">{status}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription className="text-admin-body">{error}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
