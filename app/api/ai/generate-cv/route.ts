import { getCurrentUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  generatedCvs,
  users,
  skills,
  workExperiences,
  education,
  projects,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateGroundedCv } from "@/lib/ai/grounded-cv";
import { generateCvSchema } from "@/lib/validators";
import { NextResponse } from "next/server";
import type { JobAnalysis } from "@/types/job";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = generateCvSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { cvId, templateId } = parsed.data;

  // Fetch CV record
  const cvRecord = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, cvId),
  });

  if (!cvRecord || cvRecord.userId !== userId) {
    return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
  }

  if (!cvRecord.analysisResult) {
    return NextResponse.json(
      { error: "L'analyse n'a pas encore été effectuée" },
      { status: 400 }
    );
  }

  const analysis: JobAnalysis = JSON.parse(cvRecord.analysisResult);

  // Fetch all user data in parallel
  const [user, userSkills, experiences, educations, userProjects] =
    await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
      db
        .select()
        .from(skills)
        .where(eq(skills.userId, userId)),
      db
        .select()
        .from(workExperiences)
        .where(eq(workExperiences.userId, userId)),
      db
        .select()
        .from(education)
        .where(eq(education.userId, userId)),
      db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId)),
    ]);

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  const result = await generateGroundedCv(analysis, {
    user,
    skills: userSkills,
    experiences,
    educations,
    projects: userProjects,
  });
  if (!result.ok) {
    return result.reason === "empty-profile"
      ? NextResponse.json(
          { error: "Votre profil est vide : ajoutez vos expériences et compétences avant de générer un CV." },
          { status: 400 }
        )
      : NextResponse.json({ error: "Erreur lors de la génération du CV" }, { status: 500 });
  }
  const { cvData, report } = result;

  // Save to database
  await db
    .update(generatedCvs)
    .set({
      cvData: JSON.stringify(cvData),
      generationReport: JSON.stringify(report),
      templateId,
      updatedAt: new Date(),
    })
    .where(eq(generatedCvs.id, cvId));

  return NextResponse.json({ cvData, report });
}
