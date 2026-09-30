"use server";

import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth/session";
import { createId } from "@paralleldrive/cuid2";
import { skillSchema, type SkillInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function addSkill(data: SkillInput) {
  const userId = await requireUserId();
  const parsed = skillSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.insert(skills).values({
    id: createId(),
    userId,
    name: parsed.data.name,
    category: parsed.data.category,
    level: parsed.data.level,
    yearsOfExperience: parsed.data.yearsOfExperience ?? null,
  });

  revalidatePath("/skills");
  return { success: true };
}

export async function updateSkill(id: string, data: SkillInput) {
  const userId = await requireUserId();
  const parsed = skillSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await db
    .update(skills)
    .set({
      name: parsed.data.name,
      category: parsed.data.category,
      level: parsed.data.level,
      yearsOfExperience: parsed.data.yearsOfExperience ?? null,
    })
    .where(and(eq(skills.id, id), eq(skills.userId, userId)));
  if (result.changes === 0) return { error: "Compétence non trouvée" };

  revalidatePath("/skills");
  return { success: true };
}

export async function deleteSkill(id: string) {
  const userId = await requireUserId();
  const result = await db
    .delete(skills)
    .where(and(eq(skills.id, id), eq(skills.userId, userId)));
  if (result.changes === 0) return { error: "Compétence non trouvée" };
  revalidatePath("/skills");
  return { success: true };
}
