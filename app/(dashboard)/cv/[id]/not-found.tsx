import Link from "next/link";
import { Button } from "@/components/ui/button";

// Shown by notFound() when the CV was deleted or belongs to another account.
export default function CvNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold text-gray-900">CV introuvable</h1>
      <p className="mt-2 text-sm text-gray-500">
        Ce CV a peut-être été supprimé, ou le lien est incorrect.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/cv">
          <Button>Mes CVs</Button>
        </Link>
        <Link href="/cv/new">
          <Button variant="outline">Nouveau CV</Button>
        </Link>
      </div>
    </div>
  );
}
