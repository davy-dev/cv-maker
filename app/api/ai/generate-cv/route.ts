import { auth } from "@/lib/auth/auth";
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
import { anthropic } from "@/lib/ai/client";
import { buildCvGenerationPrompt } from "@/lib/ai/prompts";
import { generateCvSchema } from "@/lib/validators";
import { NextResponse } from "next/server";
import type { JobAnalysis } from "@/types/job";
import type { CvData } from "@/types/cv";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
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

  if (!cvRecord || cvRecord.userId !== session.user.id) {
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
        where: eq(users.id, session.user.id),
      }),
      db
        .select()
        .from(skills)
        .where(eq(skills.userId, session.user.id)),
      db
        .select()
        .from(workExperiences)
        .where(eq(workExperiences.userId, session.user.id)),
      db
        .select()
        .from(education)
        .where(eq(education.userId, session.user.id)),
      db
        .select()
        .from(projects)
        .where(eq(projects.userId, session.user.id)),
    ]);

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Call Claude to generate CV
  const prompt = buildCvGenerationPrompt(
    analysis,
    user,
    experiences,
    educations,
    userSkills,
    userProjects
  );

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const cvText =
    response.content[0].type === "text" ? response.content[0].text : "";

  let cvData: CvData;
  try {
    cvData = JSON.parse(cvText);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la génération du CV" },
      { status: 500 }
    );
  }

  // Inject user's profile photo into CV data
  cvData.header.image = user.image ?? null;
  // Enable photo display if user has a profile photo
  cvData.showPhoto = !!user.image;

  // Save to database
  await db
    .update(generatedCvs)
    .set({
      cvData: JSON.stringify(cvData),
      templateId,
      updatedAt: new Date(),
    })
    .where(eq(generatedCvs.id, cvId));

  return NextResponse.json({ cvData });
}
