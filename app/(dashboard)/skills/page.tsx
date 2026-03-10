import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SkillsManager } from "@/components/skills/skills-manager";

export default async function SkillsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.userId, session.user.id));

  return <SkillsManager initialData={userSkills} />;
}
