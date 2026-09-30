"use server";

import { db } from "@/lib/db";
import { generatedCvs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth/session";
import type { CoverLetterData } from "@/types/cv";

export async function saveCoverLetterData(cvId: string, data: CoverLetterData) {
  const userId = await requireUserId();

  const cv = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, cvId),
  });

  if (!cv || cv.userId !== userId) {
    return { error: "CV non trouvé" };
  }

  await db
    .update(generatedCvs)
    .set({
      coverLetterData: JSON.stringify(data),
      updatedAt: new Date(),
    })
    .where(eq(generatedCvs.id, cvId));

  return { success: true };
}
