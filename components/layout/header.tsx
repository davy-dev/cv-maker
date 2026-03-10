"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        onClick={() => {
          const event = new CustomEvent("toggle-mobile-nav");
          window.dispatchEvent(event);
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1" />

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
        >
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
          )}
          <span className="hidden sm:block text-sm font-medium text-gray-700">
            {session?.user?.name ?? "Utilisateur"}
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-none px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Se déconnecter
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
