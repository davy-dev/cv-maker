import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import {
  updateProfile,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
} from "@/lib/actions/profile";
import { users, workExperiences, education } from "@/lib/db/schema";
import {
  setupTestDb,
  createUser,
  createExperience,
  createEducation,
} from "../../helpers/db";
import { loginAs, logout } from "../../helpers/session";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));

const db = setupTestDb();
let userId: string;

beforeEach(async () => {
  userId = (await createUser()).id;
  loginAs(userId);
});

const experienceInput = {
  company: "Acme",
  position: "Lead dev",
  startDate: "2021-03",
  achievements: ["Réduit le temps de build de 40 %"],
  technologies: ["TypeScript"],
};

const educationInput = {
  institution: "INSA",
  degree: "Ingénieur",
  field: "Informatique",
  startDate: "2012",
};

describe("updateProfile", () => {
  it("enregistre le profil et convertit les champs vides en null", async () => {
    const result = await updateProfile({
      name: "Jeanne Martin",
      title: "Développeuse",
      website: "",
      linkedin: "https://linkedin.com/in/jeanne",
    });

    expect(result).toEqual({ success: true });
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    expect(user).toMatchObject({
      name: "Jeanne Martin",
      title: "Développeuse",
      website: null,
      linkedin: "https://linkedin.com/in/jeanne",
      phone: null,
    });
  });

  it("refuse une URL invalide", async () => {
    expect(await updateProfile({ name: "Jeanne", github: "github" })).toEqual({
      error: "URL invalide",
    });
  });

  it("exige d'être connecté", async () => {
    logout();
    await expect(updateProfile({ name: "Jeanne" })).rejects.toThrow("Non authentifié");
  });
});

describe("expériences", () => {
  it("sérialise les listes en JSON et incrémente l'ordre d'affichage", async () => {
    await addExperience(experienceInput);
    await addExperience({ ...experienceInput, company: "Globex" });

    const rows = await db
      .select()
      .from(workExperiences)
      .where(eq(workExperiences.userId, userId))
      .orderBy(workExperiences.sortOrder);

    expect(rows.map((r) => [r.company, r.sortOrder])).toEqual([
      ["Acme", 0],
      ["Globex", 1],
    ]);
    expect(JSON.parse(rows[0].achievements!)).toEqual(["Réduit le temps de build de 40 %"]);
    expect(rows[0].endDate).toBeNull();
  });

  it("modifie puis supprime sa propre expérience", async () => {
    const exp = await createExperience(userId);

    await updateExperience(exp.id, { ...experienceInput, position: "CTO" });
    const updated = await db.query.workExperiences.findFirst({
      where: eq(workExperiences.id, exp.id),
    });
    expect(updated?.position).toBe("CTO");

    await deleteExperience(exp.id);
    expect(
      await db.query.workExperiences.findFirst({ where: eq(workExperiences.id, exp.id) })
    ).toBeUndefined();
  });

  describe("sécurité : expériences d'un autre utilisateur", () => {
    it("ne peut pas modifier l'expérience d'un autre", async () => {
      const other = await createUser();
      const exp = await createExperience(other.id, { position: "Original" });

      expect(await updateExperience(exp.id, { ...experienceInput, position: "Piraté" })).toEqual({
        error: "Expérience non trouvée",
      });

      const row = await db.query.workExperiences.findFirst({
        where: eq(workExperiences.id, exp.id),
      });
      expect(row?.position).toBe("Original");
    });

    it("ne peut pas supprimer l'expérience d'un autre", async () => {
      const other = await createUser();
      const exp = await createExperience(other.id);

      expect(await deleteExperience(exp.id)).toEqual({ error: "Expérience non trouvée" });

      expect(
        await db.query.workExperiences.findFirst({ where: eq(workExperiences.id, exp.id) })
      ).toBeDefined();
    });
  });
});

describe("formations", () => {
  it("ajoute une formation avec l'ordre d'affichage suivant", async () => {
    await createEducation(userId);
    await addEducation(educationInput);

    const rows = await db.select().from(education).where(eq(education.userId, userId));
    expect(rows.find((r) => r.institution === "INSA")?.sortOrder).toBe(1);
  });

  it("refuse une formation incomplète", async () => {
    expect(await addEducation({ ...educationInput, degree: "" })).toEqual({
      error: "Le diplôme est requis",
    });
  });

  it("modifie puis supprime sa propre formation", async () => {
    const edu = await createEducation(userId);

    await updateEducation(edu.id, { ...educationInput, degree: "Doctorat" });
    expect(
      (await db.query.education.findFirst({ where: eq(education.id, edu.id) }))?.degree
    ).toBe("Doctorat");

    await deleteEducation(edu.id);
    expect(await db.query.education.findFirst({ where: eq(education.id, edu.id) })).toBeUndefined();
  });

  describe("sécurité : formations d'un autre utilisateur", () => {
    it("ne peut pas modifier la formation d'un autre", async () => {
      const other = await createUser();
      const edu = await createEducation(other.id, { degree: "Original" });

      expect(await updateEducation(edu.id, { ...educationInput, degree: "Piraté" })).toEqual({
        error: "Formation non trouvée",
      });

      const row = await db.query.education.findFirst({ where: eq(education.id, edu.id) });
      expect(row?.degree).toBe("Original");
    });

    it("ne peut pas supprimer la formation d'un autre", async () => {
      const other = await createUser();
      const edu = await createEducation(other.id);

      expect(await deleteEducation(edu.id)).toEqual({ error: "Formation non trouvée" });

      expect(await db.query.education.findFirst({ where: eq(education.id, edu.id) })).toBeDefined();
    });
  });
});
