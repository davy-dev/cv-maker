import { getCurrentUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { skills, generatedCvs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateStructured } from "@/lib/ai/generate";
import { jobAnalysisSchema } from "@/lib/ai/schemas";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { scrapeCompany } from "@/lib/scraper";
import { analyzeJobSchema } from "@/lib/validators";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import { DEFAULT_VARIANT } from "@/lib/cv/variants";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = analyzeJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { jobOfferText, companyUrl } = parsed.data;

  // Run scraping and DB query in parallel
  const [companyInfo, userSkills] = await Promise.all([
    companyUrl ? scrapeCompany(companyUrl) : Promise.resolve(null),
    db
      .select()
      .from(skills)
      .where(eq(skills.userId, userId)),
  ]);

  if (userSkills.length === 0) {
    return NextResponse.json(
      {
        error:
          "Aucune compétence trouvée. Ajoutez vos compétences dans la section Compétences avant de générer un CV.",
      },
      { status: 400 }
    );
  }

  // Call Claude to analyze
  const prompt = buildAnalysisPrompt(jobOfferText, companyInfo, userSkills);
  const analysis = await generateStructured(prompt, jobAnalysisSchema);
  if (!analysis) {
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de la réponse IA" },
      { status: 500 }
    );
  }

  // Save draft to database
  const cvId = createId();
  await db.insert(generatedCvs).values({
    id: cvId,
    userId: userId,
    title: `${analysis.jobTitle} - ${analysis.company}`,
    jobOfferText,
    companyUrl: companyUrl || null,
    companyInfo: companyInfo ? JSON.stringify(companyInfo) : null,
    analysisResult: JSON.stringify(analysis),
    matchedSkills: JSON.stringify(analysis.matchedSkills),
    missingSkills: JSON.stringify(analysis.missingSkills),
    cvData: "{}",
    templateId: DEFAULT_VARIANT,
    status: "draft",
  });

  return NextResponse.json({ cvId, analysis, companyInfo });
}
