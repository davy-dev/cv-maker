import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { generatedCvs, users } from "@/lib/db/schema";
import { normalizeCvData } from "@/lib/cv/normalize";
import type { CoverLetterData, CvData, GenerationReport, TemplateId } from "@/types/cv";

export interface LoadedCv {
  id: string;
  title: string;
  templateId: TemplateId;
  cvData: CvData;
  generationReport: GenerationReport | null;
  coverLetterData: CoverLetterData | null;
}

/** A CV of this user, ready to show; null when it does not exist or belongs to someone else. */
export async function loadUserCv(cvId: string, userId: string): Promise<LoadedCv | null> {
  const cv = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, cvId),
  });
  if (!cv || cv.userId !== userId) return null;

  const cvData = normalizeCvData(cv.cvData);

  // The CV always shows the current profile photo, not the one known when it was generated
  const profile = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { image: true },
  });
  cvData.header.image = profile?.image ?? null;

  return {
    id: cv.id,
    title: cv.title,
    templateId: cv.templateId as TemplateId,
    cvData,
    generationReport: parseJson<GenerationReport>(cv.generationReport),
    coverLetterData: parseJson<CoverLetterData>(cv.coverLetterData),
  };
}

function parseJson<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
