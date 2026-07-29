"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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

  const value: AdminThemeContextValue = { theme, setTheme };

  return (
    <AdminThemeContext.Provider value={value}>
      <div className={`admin-theme ${theme}`} data-theme={theme}>
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
