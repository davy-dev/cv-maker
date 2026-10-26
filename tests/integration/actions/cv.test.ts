import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { saveCvData, updateCvTemplate, deleteCv } from "@/lib/actions/cv";
import { saveCoverLetterData } from "@/lib/actions/cover-letter";
import { generatedCvs } from "@/lib/db/schema";
import { setupTestDb, createUser, createCv } from "../../helpers/db";
import { buildCvData } from "../../helpers/fixtures";
import { loginAs, logout } from "../../helpers/session";
import type { CoverLetterData } from "@/types/cv";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));

const db = setupTestDb();
let userId: string;

beforeEach(async () => {
  userId = (await createUser()).id;
  loginAs(userId);
});

const findCv = (id: string) => db.query.generatedCvs.findFirst({ where: eq(generatedCvs.id, id) });

const coverLetter: CoverLetterData = {
  recipient: { companyName: "Acme", contactName: null, contactTitle: null, address: null, city: null },
  senderCity: "Lyon",
  date: "25 septembre 2026",
  subject: "Candidature",
  opening: "Madame, Monsieur,",
  introduction: "Intro",
  motivation: "Motivation",
  skillsMatch: "Compétences",
  conclusion: "Conclusion",
  closing: "Salutations",
  senderName: "Jean Dupont",
};

describe("saveCvData", () => {
  it("enregistre le CV édité au format JSON", async () => {
    const cv = await createCv(userId);
    const data = buildCvData({ summary: "Nouveau résumé" });

    expect(await saveCvData(cv.id, data)).toEqual({ success: true });
    expect(JSON.parse((await findCv(cv.id))!.cvData)).toEqual(data);
  });

  it("refuse de modifier le CV d'un autre utilisateur", async () => {
    const other = await createUser();
    const cv = await createCv(other.id);

    expect(await saveCvData(cv.id, buildCvData())).toEqual({ error: "CV non trouvé" });
    expect((await findCv(cv.id))!.cvData).toBe("{}");
  });

  it("renvoie une erreur pour un CV inexistant", async () => {
    expect(await saveCvData("inconnu", buildCvData())).toEqual({ error: "CV non trouvé" });
  });

  it("exige d'être connecté", async () => {
    logout();
    await expect(saveCvData("x", buildCvData())).rejects.toThrow("Non authentifié");
  });
});

describe("updateCvTemplate", () => {
  it("change le template et revalide la page du CV", async () => {
    const cv = await createCv(userId);

    await updateCvTemplate(cv.id, "classic");

    expect((await findCv(cv.id))!.templateId).toBe("classic");
    expect(revalidatePath).toHaveBeenCalledWith(`/cv/${cv.id}`);
  });

  it("ne peut pas changer le template du CV d'un autre", async () => {
    const other = await createUser();
    const cv = await createCv(other.id, { templateId: "modern" });

    expect(await updateCvTemplate(cv.id, "classic")).toEqual({ error: "CV non trouvé" });
    expect((await findCv(cv.id))!.templateId).toBe("modern");
  });

  it("refuse un template inconnu", async () => {
    const cv = await createCv(userId);

    expect(await updateCvTemplate(cv.id, "comic-sans")).toEqual({ error: "Template inconnu" });
    expect((await findCv(cv.id))!.templateId).toBe("modern");
  });
});

describe("deleteCv", () => {
  it("supprime son propre CV", async () => {
    const cv = await createCv(userId);

    expect(await deleteCv(cv.id)).toEqual({ success: true });
    expect(await findCv(cv.id)).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/cv");
  });

  it("ne supprime pas le CV d'un autre utilisateur", async () => {
    const other = await createUser();
    const cv = await createCv(other.id);

    expect(await deleteCv(cv.id)).toEqual({ error: "CV non trouvé" });
    expect(await findCv(cv.id)).toBeDefined();
  });
});

describe("saveCoverLetterData", () => {
  it("enregistre la lettre de motivation", async () => {
    const cv = await createCv(userId);

    expect(await saveCoverLetterData(cv.id, coverLetter)).toEqual({ success: true });
    expect(JSON.parse((await findCv(cv.id))!.coverLetterData!)).toEqual(coverLetter);
  });

  it("refuse la lettre d'un autre utilisateur", async () => {
    const other = await createUser();
    const cv = await createCv(other.id);

    expect(await saveCoverLetterData(cv.id, coverLetter)).toEqual({ error: "CV non trouvé" });
    expect((await findCv(cv.id))!.coverLetterData).toBeNull();
  });
});
