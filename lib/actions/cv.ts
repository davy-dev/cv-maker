"use server";

import { db } from "@/lib/db";
import { generatedCvs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { templateIdSchema } from "@/lib/validators";
import type { CvData } from "@/types/cv";

export async function saveCvData(cvId: string, data: CvData) {
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
      cvData: JSON.stringify(data),
      updatedAt: new Date(),
    })
    .where(eq(generatedCvs.id, cvId));

  return { success: true };
}

export async function updateCvTemplate(cvId: string, templateId: string) {
  const userId = await requireUserId();
  if (!templateIdSchema.safeParse(templateId).success) {
    return { error: "Template inconnu" };
  }

  const result = await db
    .update(generatedCvs)
    .set({ templateId, updatedAt: new Date() })
    .where(and(eq(generatedCvs.id, cvId), eq(generatedCvs.userId, userId)));
  if (result.changes === 0) return { error: "CV non trouvé" };

  revalidatePath(`/cv/${cvId}`);
  return { success: true };
}

export async function deleteCv(cvId: string) {
  const userId = await requireUserId();

  const cv = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, cvId),
  });

  if (!cv || cv.userId !== userId) {
    return { error: "CV non trouvé" };
  }

  await db.delete(generatedCvs).where(eq(generatedCvs.id, cvId));
  revalidatePath("/cv");
  return { success: true };
}
