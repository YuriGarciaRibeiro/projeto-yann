import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { AdminShell } from "./components/AdminShell";
import { AdminThemeProvider } from "./components/AdminThemeProvider";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("admin-theme")?.value;
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const initialTheme = savedTheme === "light" ? "light" : "dark";

  return (
    <AdminThemeProvider initialTheme={initialTheme}>
      <AdminShell defaultOpen={defaultSidebarOpen}>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
