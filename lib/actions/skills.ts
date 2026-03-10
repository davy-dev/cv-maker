"use server";

import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { createId } from "@paralleldrive/cuid2";
import { skillSchema, type SkillInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

export async function addSkill(data: SkillInput) {
  const userId = await getUserId();
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
  await getUserId();
  const parsed = skillSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db
    .update(skills)
    .set({
      name: parsed.data.name,
      category: parsed.data.category,
      level: parsed.data.level,
      yearsOfExperience: parsed.data.yearsOfExperience ?? null,
    })
    .where(eq(skills.id, id));

  revalidatePath("/skills");
  return { success: true };
}

export async function deleteSkill(id: string) {
  await getUserId();
  await db.delete(skills).where(eq(skills.id, id));
  revalidatePath("/skills");
  return { success: true };
}
