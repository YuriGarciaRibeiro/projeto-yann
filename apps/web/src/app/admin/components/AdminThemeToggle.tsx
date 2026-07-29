"use client";

import { useAdminTheme } from "./AdminThemeProvider";

export function AdminThemeToggle() {
  const { theme, setTheme } = useAdminTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      aria-label={`Alternar para tema ${nextTheme === "dark" ? "escuro" : "claro"}`}
      className="min-h-11 border border-border px-4 text-admin-label uppercase tracking-[0.16em] text-foreground transition-colors hover:border-primary focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
      onClick={() => setTheme(nextTheme)}
      type="button"
    >
      Tema {theme === "dark" ? "dark" : "light"}
    </button>
  );
}
