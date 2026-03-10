"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hash } from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import { registerSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (existing) {
    return { error: "Un compte existe déjà avec cet email" };
  }

  const hashedPassword = await hash(parsed.data.password, 12);

  await db.insert(users).values({
    id: createId(),
    name: parsed.data.name,
    email: parsed.data.email,
    hashedPassword,
  });

  return { success: true };
}
