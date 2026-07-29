import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { AdminThemeProvider } from "./components/AdminThemeProvider";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("admin-theme")?.value;
  const initialTheme = savedTheme === "light" ? "light" : "dark";

  return <AdminThemeProvider initialTheme={initialTheme}>{children}</AdminThemeProvider>;
}
