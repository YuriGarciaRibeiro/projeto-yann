"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Projetos" },
  { href: "/admin/projetos/novo", label: "Novo projeto" },
  { href: "/admin#midias", label: "Arquivos globais" },
];

export function AdminNavigation() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <>
      <nav
        aria-label="Navegação do admin"
        className="mt-6 hidden flex-col gap-2 lg:flex"
      >
        {adminNavItems.map((item) => (
          <AdminNavLink
            href={item.href}
            isActive={isAdminNavActive(item.href, pathname, hash)}
            key={item.href}
          >
            {item.label}
          </AdminNavLink>
        ))}
      </nav>

      <div className="mt-6 lg:hidden">
        <Sheet>
          <SheetTrigger render={<Button className="w-full justify-between rounded-none" variant="outline" />}>
            Menu do admin
            <MenuIcon data-icon="inline-end" />
          </SheetTrigger>
          <SheetContent className="w-[min(22rem,calc(100vw-2rem))]" side="left">
            <SheetHeader>
              <SheetTitle>Navegação do admin</SheetTitle>
              <SheetDescription>Escolha uma seção sem depender de hover.</SheetDescription>
            </SheetHeader>
            <Separator />
            <nav aria-label="Navegação mobile do admin" className="flex flex-col gap-2 px-4">
              {adminNavItems.map((item) => (
                <SheetClose
                  key={item.href}
                  render={
                    <Link
                      className={adminNavLinkClassName(isAdminNavActive(item.href, pathname, hash))}
                      href={item.href}
                    />
                  }
                >
                  {item.label}
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function AdminNavLink({
  children,
  href,
  isActive,
}: {
  children: string;
  href: string;
  isActive: boolean;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={adminNavLinkClassName(isActive)}
      href={href}
    >
      {children}
    </Link>
  );
}

function adminNavLinkClassName(isActive: boolean) {
  return cn(
    buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
    "min-h-11 justify-start rounded-none px-4 text-admin-label uppercase tracking-[0.14em]",
  );
}

function isAdminNavActive(href: string, pathname: string, hash: string) {
  const [path, targetHash] = href.split("#");

  if (targetHash) {
    return pathname === path && hash === `#${targetHash}`;
  }

  if (href === "/admin/projetos/novo") {
    return pathname === href;
  }

  return pathname === href || (pathname.startsWith("/admin/projetos/") && href === "/admin");
}
