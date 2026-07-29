"use client";

import { FolderKanbanIcon, ImagesIcon, PlusIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const adminNavItems = [
  { href: "/admin", icon: FolderKanbanIcon, label: "Projetos" },
  { href: "/admin#midias", icon: ImagesIcon, label: "Mídias globais" },
  { href: "/admin/projetos/novo", icon: PlusIcon, label: "Novo projeto" },
] satisfies Array<{ href: string; icon: LucideIcon; label: string }>;

export function AdminNavigation() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [hash, setHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarGroupContent>
        <nav aria-label="Navegação do admin">
          <SidebarMenu className="gap-2">
            {adminNavItems.map((item) => {
              const itemHash = item.href.includes("#") ? `#${item.href.split("#")[1]}` : "";
              const isActive = isAdminNavActive(item.href, pathname, hash);

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    aria-current={isActive ? (itemHash ? "location" : "page") : undefined}
                    isActive={isActive}
                    render={(
                      <Link
                        href={item.href}
                        onClick={(event) => {
                          const isNormalPrimaryClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

                          if (!isNormalPrimaryClick) {
                            return;
                          }

                          setHash(itemHash);
                          setOpenMobile(false);
                        }}
                      />
                    )}
                    tooltip={item.label}
                  >
                    <item.icon aria-hidden="true" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function isAdminNavActive(href: string, pathname: string, hash: string) {
  const [path, targetHash] = href.split("#");

  if (targetHash) {
    return pathname === path && hash === `#${targetHash}`;
  }

  if (href === "/admin") {
    return (pathname === "/admin" && hash === "") || (
      pathname.startsWith("/admin/projetos/") && pathname !== "/admin/projetos/novo"
    );
  }

  if (href === "/admin/projetos/novo") {
    return pathname === href;
  }

  return pathname === href;
}
