import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, workExperiences, education } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { PhotoUpload } from "@/components/profile/photo-upload";
import { ExperienceList } from "@/components/profile/experience-list";
import { EducationList } from "@/components/profile/education-list";

export default async function ProfilePage() {
  const userId = await verifySession();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return null;

  const experiences = await db
    .select()
    .from(workExperiences)
    .where(eq(workExperiences.userId, userId))
    .orderBy(asc(workExperiences.sortOrder));

  const educations = await db
    .select()
    .from(education)
    .where(eq(education.userId, userId))
    .orderBy(asc(education.sortOrder));

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUpload currentImage={user.image} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              email: user.email,
              name: user.name ?? "",
              title: user.title ?? "",
              phone: user.phone ?? "",
              location: user.location ?? "",
              website: user.website ?? "",
              linkedin: user.linkedin ?? "",
              github: user.github ?? "",
              summary: user.summary ?? "",
            }}
          />
        </CardContent>
      </Card>

      <ExperienceList initialData={experiences} />

      <EducationList initialData={educations} />
    </div>
  );
}
