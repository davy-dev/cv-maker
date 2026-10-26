import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatedCvs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteCvButton } from "@/components/cv/delete-cv-button";

export default async function CvListPage() {
  const userId = await verifySession();

  const cvs = await db
    .select()
    .from(generatedCvs)
    .where(eq(generatedCvs.userId, userId))
    .orderBy(desc(generatedCvs.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes CVs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {cvs.length} CV{cvs.length > 1 ? "s" : ""} généré
            {cvs.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/cv/new">
          <Button>Nouveau CV</Button>
        </Link>
      </div>

      {cvs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Aucun CV créé pour le moment</p>
          <p className="text-sm mt-1">
            Commencez par coller une offre d&apos;emploi pour générer votre
            premier CV personnalisé.
          </p>
          <Link href="/cv/new" className="mt-4 inline-block">
            <Button>Créer mon premier CV</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <div key={cv.id} className="relative group">
              <Link href={`/cv/${cv.id}/studio`}>
                <Card className="hover:border-blue-300 transition-colors cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant={
                          cv.status === "final" ? "success" : "secondary"
                        }
                      >
                        {cv.status === "final" ? "Finalisé" : "Brouillon"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{cv.templateId}</Badge>
                        <DeleteCvButton cvId={cv.id} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {cv.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2">
                      {cv.createdAt
                        ? new Date(cv.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
