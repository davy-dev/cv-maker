"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref: Route;
  homeLabel: string;
}

/** Shared UI for the error.tsx boundaries. */
export function ErrorFallback({ error, retry, homeHref, homeLabel }: ErrorFallbackProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-gray-500">
        Le problème vient de notre côté. Vous pouvez réessayer ; vos données déjà
        enregistrées ne sont pas perdues.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-gray-400">Référence : {error.digest}</p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => retry()}>Réessayer</Button>
        <Link href={homeHref}>
          <Button variant="outline">{homeLabel}</Button>
        </Link>
      </div>
    </div>
  );
}
