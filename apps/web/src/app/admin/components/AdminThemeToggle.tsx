"use client";

import { CheckIcon, MoonIcon, SunIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAdminTheme } from "./AdminThemeProvider";

export function AdminThemeToggle() {
  const { theme, setTheme } = useAdminTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="min-h-11 rounded-none text-admin-label uppercase tracking-[0.16em]" variant="outline" />}>
        {theme === "dark" ? <MoonIcon data-icon="inline-start" /> : <SunIcon data-icon="inline-start" />}
        Tema {theme === "dark" ? "dark" : "light"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tema do admin</DropdownMenuLabel>
          <ThemeMenuItem
            icon={<MoonIcon data-icon="inline-start" />}
            isActive={theme === "dark"}
            label="Dark"
            onSelect={() => setTheme("dark")}
          />
          <ThemeMenuItem
            icon={<SunIcon data-icon="inline-start" />}
            isActive={theme === "light"}
            label="Light"
            onSelect={() => setTheme("light")}
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>Preferência salva neste admin</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeMenuItem({
  icon,
  isActive,
  label,
  onSelect,
}: {
  icon: ReactNode;
  isActive: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onClick={onSelect}>
      {icon}
      {label}
      {isActive ? <CheckIcon className="ml-auto" /> : null}
    </DropdownMenuItem>
  );
}
