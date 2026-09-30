"use client";

import "./globals.css";

// Replaces the root layout when it fails, so it renders its own document.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans antialiased">
        <title>Erreur - CV Maker</title>
        <div role="alert" className="max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900">
            CV Maker est momentanément indisponible
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Réessayez dans quelques instants.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-gray-400">Référence : {error.digest}</p>
          )}
          <button
            onClick={() => retry()}
            className="mt-6 h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
