import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addSkill, updateSkill, deleteSkill } from "@/lib/actions/skills";
import { skills } from "@/lib/db/schema";
import { setupTestDb, createUser, createSkill } from "../../helpers/db";
import { loginAs, logout } from "../../helpers/session";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));

const db = setupTestDb();
let userId: string;

beforeEach(async () => {
  userId = (await createUser()).id;
  loginAs(userId);
});

const react = { name: "React", category: "framework", level: 4, yearsOfExperience: 2 } as const;

describe("addSkill", () => {
  it("ajoute la compétence à l'utilisateur connecté", async () => {
    expect(await addSkill(react)).toEqual({ success: true });

    const rows = await db.select().from(skills).where(eq(skills.userId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "React", category: "framework", level: 4 });
    expect(revalidatePath).toHaveBeenCalledWith("/skills");
  });

  it("stocke null quand les années d'expérience ne sont pas renseignées", async () => {
    await addSkill({ name: "Git", category: "tool", level: 3 });
    const [row] = await db.select().from(skills);
    expect(row.yearsOfExperience).toBeNull();
  });

  it("refuse une compétence invalide", async () => {
    expect(await addSkill({ ...react, level: 9 })).toHaveProperty("error");
    expect(await db.select().from(skills)).toHaveLength(0);
  });

  it("exige d'être connecté", async () => {
    logout();
    await expect(addSkill(react)).rejects.toThrow("Non authentifié");
  });
});

describe("updateSkill / deleteSkill", () => {
  it("modifie puis supprime sa propre compétence", async () => {
    const skill = await createSkill(userId);

    await updateSkill(skill.id, { ...react, level: 5 });
    expect((await db.query.skills.findFirst({ where: eq(skills.id, skill.id) }))?.level).toBe(5);

    await deleteSkill(skill.id);
    expect(await db.query.skills.findFirst({ where: eq(skills.id, skill.id) })).toBeUndefined();
  });

  describe("sécurité : compétences d'un autre utilisateur", () => {
    it("ne peut pas modifier la compétence d'un autre", async () => {
      const other = await createUser();
      const skill = await createSkill(other.id, { level: 1 });

      expect(await updateSkill(skill.id, { ...react, level: 5 })).toEqual({
        error: "Compétence non trouvée",
      });

      const row = await db.query.skills.findFirst({ where: eq(skills.id, skill.id) });
      expect(row?.level).toBe(1);
    });

    it("ne peut pas supprimer la compétence d'un autre", async () => {
      const other = await createUser();
      const skill = await createSkill(other.id);

      expect(await deleteSkill(skill.id)).toEqual({ error: "Compétence non trouvée" });

      expect(await db.query.skills.findFirst({ where: eq(skills.id, skill.id) })).toBeDefined();
    });
  });
});
