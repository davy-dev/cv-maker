"use server";

import { db } from "@/lib/db";
import { generatedCvs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import type { CoverLetterData } from "@/types/cv";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export async function saveCoverLetterData(cvId: string, data: CoverLetterData) {
  const userId = await getUserId();

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
