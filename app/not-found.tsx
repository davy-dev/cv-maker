import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md text-center">
        <p className="text-5xl font-bold text-blue-600">404</p>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Page introuvable</h1>
        <p className="mt-2 text-sm text-gray-500">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/">
            <Button>Retour à l&apos;accueil</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Mon espace</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
