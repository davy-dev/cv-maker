"use server";

import { db } from "@/lib/db";
import { users, workExperiences, education } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth/session";
import { createId } from "@paralleldrive/cuid2";
import {
  profileSchema,
  workExperienceSchema,
  educationSchema,
  type ProfileInput,
  type WorkExperienceInput,
  type EducationInput,
} from "@/lib/validators";
import { revalidatePath } from "next/cache";

// --- Profile ---

export async function updateProfile(data: ProfileInput) {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      title: parsed.data.title || null,
      phone: parsed.data.phone || null,
      location: parsed.data.location || null,
      website: parsed.data.website || null,
      linkedin: parsed.data.linkedin || null,
      github: parsed.data.github || null,
      summary: parsed.data.summary || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/profile");
  return { success: true };
}

// --- Work Experiences ---

export async function addExperience(data: WorkExperienceInput) {
  const userId = await requireUserId();
  const parsed = workExperienceSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db
    .select()
    .from(workExperiences)
    .where(eq(workExperiences.userId, userId));

  await db.insert(workExperiences).values({
    id: createId(),
    userId,
    company: parsed.data.company,
    position: parsed.data.position,
    location: parsed.data.location || null,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate || null,
    description: parsed.data.description || null,
    achievements: parsed.data.achievements
      ? JSON.stringify(parsed.data.achievements)
      : null,
    technologies: parsed.data.technologies
      ? JSON.stringify(parsed.data.technologies)
      : null,
    sortOrder: existing.length,
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateExperience(
  id: string,
  data: WorkExperienceInput
) {
  const userId = await requireUserId();
  const parsed = workExperienceSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await db
    .update(workExperiences)
    .set({
      company: parsed.data.company,
      position: parsed.data.position,
      location: parsed.data.location || null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate || null,
      description: parsed.data.description || null,
      achievements: parsed.data.achievements
        ? JSON.stringify(parsed.data.achievements)
        : null,
      technologies: parsed.data.technologies
        ? JSON.stringify(parsed.data.technologies)
        : null,
    })
    .where(
      and(eq(workExperiences.id, id), eq(workExperiences.userId, userId))
    );
  if (result.changes === 0) return { error: "Expérience non trouvée" };

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteExperience(id: string) {
  const userId = await requireUserId();
  const result = await db
    .delete(workExperiences)
    .where(
      and(eq(workExperiences.id, id), eq(workExperiences.userId, userId))
    );
  if (result.changes === 0) return { error: "Expérience non trouvée" };
  revalidatePath("/profile");
  return { success: true };
}

// --- Education ---

export async function addEducation(data: EducationInput) {
  const userId = await requireUserId();
  const parsed = educationSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db
    .select()
    .from(education)
    .where(eq(education.userId, userId));

  await db.insert(education).values({
    id: createId(),
    userId,
    institution: parsed.data.institution,
    degree: parsed.data.degree,
    field: parsed.data.field,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate || null,
    description: parsed.data.description || null,
    sortOrder: existing.length,
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateEducation(id: string, data: EducationInput) {
  const userId = await requireUserId();
  const parsed = educationSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await db
    .update(education)
    .set({
      institution: parsed.data.institution,
      degree: parsed.data.degree,
      field: parsed.data.field,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate || null,
      description: parsed.data.description || null,
    })
    .where(and(eq(education.id, id), eq(education.userId, userId)));
  if (result.changes === 0) return { error: "Formation non trouvée" };

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteEducation(id: string) {
  const userId = await requireUserId();
  const result = await db
    .delete(education)
    .where(and(eq(education.id, id), eq(education.userId, userId)));
  if (result.changes === 0) return { error: "Formation non trouvée" };
  revalidatePath("/profile");
  return { success: true };
}
