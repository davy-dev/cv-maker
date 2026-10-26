"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Route } from "next";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/profile", label: "Profil" },
  { href: "/skills", label: "Compétences" },
  { href: "/cv", label: "Mes CVs" },
  { href: "/cv/new", label: "Nouveau CV" },
] satisfies { href: Route; label: string }[];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setOpen((prev) => !prev);
    window.addEventListener("toggle-mobile-nav", handler);
    return () => window.removeEventListener("toggle-mobile-nav", handler);
  }, []);

  // Close on navigation
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl md:hidden">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="text-lg font-bold text-gray-900">CV Maker</span>
          </div>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/cv/new");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
