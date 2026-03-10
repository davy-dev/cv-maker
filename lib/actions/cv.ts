"use server";

import { db } from "@/lib/db";
import { generatedCvs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import type { CvData } from "@/types/cv";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export async function saveCvData(cvId: string, data: CvData) {
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
      cvData: JSON.stringify(data),
      updatedAt: new Date(),
    })
    .where(eq(generatedCvs.id, cvId));

  return { success: true };
}

export async function updateCvTemplate(cvId: string, templateId: string) {
  const userId = await getUserId();

  await db
    .update(generatedCvs)
    .set({ templateId, updatedAt: new Date() })
    .where(eq(generatedCvs.id, cvId));

  revalidatePath(`/cv/${cvId}`);
  return { success: true };
}

export async function deleteCv(cvId: string) {
  const userId = await getUserId();

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
