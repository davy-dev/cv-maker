import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatedCvs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const userId = await verifySession();

  // Read the name from the database: the session token keeps the name from sign-in time
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true },
  });

  const recentCvs = await db
    .select()
    .from(generatedCvs)
    .where(eq(generatedCvs.userId, userId))
    .orderBy(desc(generatedCvs.createdAt))
    .limit(5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.name ?? "Utilisateur"} !
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenue sur votre espace CV Maker
          </p>
        </div>
        <Link href="/cv/new">
          <Button>Nouveau CV</Button>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/cv/new">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Nouveau CV</p>
                <p className="text-sm text-gray-500">Coller une offre d&apos;emploi</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/skills">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Compétences</p>
                <p className="text-sm text-gray-500">Gérer mes compétences</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/profile">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Profil</p>
                <p className="text-sm text-gray-500">Modifier mon profil</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent CVs */}
      <Card>
        <CardHeader>
          <CardTitle>CVs récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCvs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun CV créé pour le moment.</p>
              <Link href="/cv/new" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
                Créer votre premier CV
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCvs.map((cv) => (
                <Link
                  key={cv.id}
                  href={`/cv/${cv.id}/studio`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{cv.title}</p>
                    <p className="text-sm text-gray-500">
                      {cv.createdAt
                        ? new Date(cv.createdAt).toLocaleDateString("fr-FR")
                        : ""}
                    </p>
                  </div>
                  <Badge variant={cv.status === "final" ? "success" : "secondary"}>
                    {cv.status === "final" ? "Finalisé" : "Brouillon"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
