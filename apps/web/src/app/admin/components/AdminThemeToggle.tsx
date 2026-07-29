"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";

import { useAdminTheme } from "./AdminThemeProvider";

export function AdminThemeToggle({ variant = "sidebar" }: { variant?: "button" | "sidebar" }) {
  const { theme, setTheme } = useAdminTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const icon = theme === "dark" ? <MoonIcon aria-hidden="true" /> : <SunIcon aria-hidden="true" />;
  const label = `Tema ${theme === "dark" ? "dark" : "light"}`;

  if (variant === "button") {
    return (
      <Button onClick={() => setTheme(nextTheme)} type="button" variant="outline">
        {icon}
        {label}
      </Button>
    );
  }

  return (
    <SidebarMenuButton
      onClick={() => setTheme(nextTheme)}
      tooltip={`Tema ${nextTheme}`}
      type="button"
    >
      {icon}
      <span className="group-data-[collapsible=icon]:hidden">{label}</span>
    </SidebarMenuButton>
  );
}
