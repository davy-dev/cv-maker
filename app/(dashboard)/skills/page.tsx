import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SkillsManager } from "@/components/skills/skills-manager";

export default async function SkillsPage() {
  const userId = await verifySession();

  const userSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.userId, userId));

  return <SkillsManager initialData={userSkills} />;
}
