import { getCurrentUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  generatedCvs,
  users,
  skills,
  workExperiences,
  education,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateStructured } from "@/lib/ai/generate";
import { coverLetterSchema } from "@/lib/ai/schemas";
import { buildCoverLetterGenerationPrompt } from "@/lib/ai/prompts";
import { generateCoverLetterSchema } from "@/lib/validators";
import { NextResponse } from "next/server";
import type { JobAnalysis } from "@/types/job";
import type { CompanyInfo } from "@/types/job";
import type { CvData } from "@/types/cv";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = generateCoverLetterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { cvId } = parsed.data;

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

  if (!cvRecord.cvData || cvRecord.cvData === "{}") {
    return NextResponse.json(
      { error: "Le CV n'a pas encore été généré" },
      { status: 400 }
    );
  }

  const analysis: JobAnalysis = JSON.parse(cvRecord.analysisResult);
  const cvData: CvData = JSON.parse(cvRecord.cvData);
  const companyInfo: CompanyInfo | null = cvRecord.companyInfo
    ? JSON.parse(cvRecord.companyInfo)
    : null;

  const [user, userSkills, experiences, educations] = await Promise.all([
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
  ]);

  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur non trouvé" },
      { status: 404 }
    );
  }

  const prompt = buildCoverLetterGenerationPrompt(
    analysis,
    user,
    experiences,
    educations,
    userSkills,
    companyInfo,
    cvData
  );

  const coverLetterData = await generateStructured(prompt, coverLetterSchema);
  if (!coverLetterData) {
    return NextResponse.json(
      { error: "Erreur lors de la génération de la lettre de motivation" },
      { status: 500 }
    );
  }

  // Ensure sender info from profile
  coverLetterData.senderName = user.name ?? coverLetterData.senderName;
  coverLetterData.senderCity = user.location ?? coverLetterData.senderCity;
  // The model does not know today's date
  coverLetterData.date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await db
    .update(generatedCvs)
    .set({
      coverLetterData: JSON.stringify(coverLetterData),
      updatedAt: new Date(),
    })
    .where(eq(generatedCvs.id, cvId));

  return NextResponse.json({ coverLetterData });
}
