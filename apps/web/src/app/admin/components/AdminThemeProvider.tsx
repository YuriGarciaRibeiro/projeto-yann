"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AdminTheme = "dark" | "light";

type AdminThemeContextValue = {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
};

const adminThemeCookieName = "admin-theme";
const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function AdminThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: AdminTheme;
}) {
  const [theme, setThemeState] = useState<AdminTheme>(initialTheme);

  function setTheme(nextTheme: AdminTheme) {
    setThemeState(nextTheme);
    document.cookie = `${adminThemeCookieName}=${nextTheme}; path=/admin; max-age=31536000; SameSite=Lax`;
  }

  useEffect(() => {
    const root = document.documentElement;
    const previousColorScheme = root.style.colorScheme;
    const hadDarkClass = root.classList.contains("dark");

    root.style.colorScheme = theme;
    root.classList.toggle("dark", theme === "dark");

    return () => {
      root.style.colorScheme = previousColorScheme;

      if (hadDarkClass) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };
  }, [theme]);

  const value: AdminThemeContextValue = { theme, setTheme };

  return (
    <AdminThemeContext.Provider value={value}>
      <div className={theme === "dark" ? "dark min-h-screen bg-background" : "min-h-screen bg-background"} data-theme={theme}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);

  if (!context) {
    throw new Error("useAdminTheme must be used inside AdminThemeProvider.");
  }

  return context;
}
