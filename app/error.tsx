"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <ErrorFallback error={error} retry={retry} homeHref="/" homeLabel="Retour à l'accueil" />
    </main>
  );
}
