"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

// Rendered inside the dashboard layout, so the sidebar stays usable.
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      retry={retry}
      homeHref="/dashboard"
      homeLabel="Tableau de bord"
    />
  );
}
