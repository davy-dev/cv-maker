import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { skills, generatedCvs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { anthropic } from "@/lib/ai/client";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { scrapeCompany } from "@/lib/scraper";
import { analyzeJobSchema } from "@/lib/validators";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import type { JobAnalysis } from "@/types/job";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
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
      .where(eq(skills.userId, session.user.id)),
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
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const analysisText =
    response.content[0].type === "text" ? response.content[0].text : "";

  let analysis: JobAnalysis;
  try {
    analysis = JSON.parse(analysisText);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de la réponse IA" },
      { status: 500 }
    );
  }

  // Save draft to database
  const cvId = createId();
  await db.insert(generatedCvs).values({
    id: cvId,
    userId: session.user.id,
    title: `${analysis.jobTitle} - ${analysis.company}`,
    jobOfferText,
    companyUrl: companyUrl || null,
    companyInfo: companyInfo ? JSON.stringify(companyInfo) : null,
    analysisResult: JSON.stringify(analysis),
    matchedSkills: JSON.stringify(analysis.matchedSkills),
    missingSkills: JSON.stringify(analysis.missingSkills),
    cvData: "{}",
    templateId: "modern",
    status: "draft",
  });

  return NextResponse.json({ cvId, analysis, companyInfo });
}
