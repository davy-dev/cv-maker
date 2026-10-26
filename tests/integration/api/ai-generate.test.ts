import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { POST as generateCv } from "@/app/api/ai/generate-cv/route";
import { POST as generateCoverLetter } from "@/app/api/ai/generate-cover-letter/route";
import { generatedCvs, users } from "@/lib/db/schema";
import { setupTestDb, createUser, createCv, createExperience, createProject, createSkill } from "../../helpers/db";
import { buildCvData } from "../../helpers/fixtures";
import { loginAs, logout } from "../../helpers/session";
import { parseMessage, mockClaudeReply, mockClaudeReplies, factId, claimIds, sentPrompt } from "../../helpers/claude";
import { jsonRequest } from "../../helpers/http";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/ai/client", () => ({ anthropic: { messages: { parse: vi.fn() } } }));

const db = setupTestDb();
let userId: string;

beforeEach(async () => {
  userId = (
    await createUser({ name: "Jeanne Martin", location: "Nantes", image: "/uploads/jeanne.png" })
  ).id;
  loginAs(userId);
});

const findCv = (id: string) => db.query.generatedCvs.findFirst({ where: eq(generatedCvs.id, id) });

describe("POST /api/ai/generate-cv", () => {
  const post = (body: unknown) => generateCv(jsonRequest("/api/ai/generate-cv", body));

  it("renvoie 401 sans session", async () => {
    logout();
    expect((await post({ cvId: "x", templateId: "modern" })).status).toBe(401);
  });

  it("renvoie 400 pour un template inconnu", async () => {
    expect((await post({ cvId: "x", templateId: "comic-sans" })).status).toBe(400);
  });

  it("renvoie 404 pour le CV d'un autre utilisateur", async () => {
    const other = await createUser();
    const cv = await createCv(other.id);

    expect((await post({ cvId: cv.id, templateId: "modern" })).status).toBe(404);
    expect(parseMessage).not.toHaveBeenCalled();
  });

  it("renvoie 400 si l'offre n'a pas encore été analysée", async () => {
    const cv = await createCv(userId, { analysisResult: null });
    expect((await post({ cvId: cv.id, templateId: "modern" })).status).toBe(400);
  });

  describe("génération ancrée dans le profil", () => {
    let cvId: string;

    beforeEach(async () => {
      await db.update(users).set({ title: "Développeuse", summary: "Passionnée de web." }).where(eq(users.id, userId));
      await createExperience(userId, {
        id: "exp-acme",
        company: "Acme",
        position: "Développeuse",
        startDate: "2020-01",
        achievements: JSON.stringify(["Migration du front vers Next.js", "Réduction du temps de build de 40 %"]),
        technologies: JSON.stringify(["TypeScript"]),
      });
      await createExperience(userId, { id: "exp-old", company: "Globex", position: "Stagiaire", startDate: "2019-01", endDate: "2019-06", sortOrder: 1 });
      await createProject(userId, { id: "proj-cv", name: "CV Maker", description: "Générateur de CV" });
      await createSkill(userId, { name: "TypeScript" });
      cvId = (await createCv(userId)).id;
    });

    /** A draft citing real facts, plus invented content to be filtered out. */
    const draft = (prompt: string) => ({
      title: { text: "Développeuse front-end", sourceIds: [factId(prompt, "Titre professionnel")] },
      summary: [
        { text: "Développeuse passionnée de web.", sourceIds: [factId(prompt, "Résumé du profil")] },
        { text: "Experte Kubernetes.", sourceIds: [factId(prompt, "Résumé du profil")] },
      ],
      experiences: [
        {
          experienceId: "exp-acme",
          bullets: [
            { text: "A migré le front vers Next.js", sourceIds: [factId(prompt, "Migration du front")] },
            { text: "A réduit le build de 40 %", sourceIds: [factId(prompt, "40 %")] },
            { text: "A encadré 5 développeurs", sourceIds: [factId(prompt, "Migration du front")] },
            { text: "A écrit des tests", sourceIds: [] },
          ],
        },
      ],
      projects: [
        {
          projectId: "proj-cv",
          description: { text: "Générateur de CV sur mesure", sourceIds: [factId(prompt, "Générateur de CV")] },
          highlights: [],
        },
      ],
      skills: [{ category: "Langages", items: ["TypeScript"] }],
      skillsToAcquire: [{ skill: "Kubernetes", reason: "Demandé par l'offre", howToAcquire: "Certification CKA" }],
    });

    /** The verifier rejects the Kubernetes sentence and accepts the rest. */
    const verdicts = (prompt: string) => ({
      verdicts: claimIds(prompt).map(({ id, text }) => ({
        claimId: id,
        supported: !text.includes("Kubernetes"),
        reason: text.includes("Kubernetes") ? "Kubernetes n'apparaît pas dans le profil" : "",
      })),
    });

    it("ne garde que ce qui est vérifié et recopie les faits depuis la base", async () => {
      mockClaudeReplies(draft, verdicts);

      const res = await post({ cvId, templateId: "classic" });

      expect(res.status).toBe(200);
      const { cvData, report } = await res.json();
      expect(cvData.header).toMatchObject({ title: "Développeuse front-end", image: "/uploads/jeanne.png" });
      expect(cvData.summary).toBe("Développeuse passionnée de web.");
      expect(cvData.experience[0]).toMatchObject({
        company: "Acme",
        startDate: "2020-01",
        endDate: "Présent",
        bullets: ["A migré le front vers Next.js", "A réduit le build de 40 %"],
      });
      expect(cvData.interests).toEqual([]);
      expect(cvData.skills).toEqual({ Langages: ["TypeScript"] });

      expect(report.method).toBe("model");
      expect(report.rejected.map((r: { text: string; reason: string }) => [r.text, r.reason])).toEqual([
        ["A encadré 5 développeurs", "Chiffre absent de vos données : 5"],
        ["A écrit des tests", "Aucune source dans votre profil"],
        ["Experte Kubernetes.", "Kubernetes n'apparaît pas dans le profil"],
      ]);
      expect(report.skillsToAcquire[0].skill).toBe("Kubernetes");

      const saved = await findCv(cvId);
      expect(saved!.templateId).toBe("classic");
      expect(JSON.parse(saved!.cvData)).toEqual(cvData);
      expect(JSON.parse(saved!.generationReport!)).toEqual(report);
    });

    it("garde, masquée, l'expérience que le modèle a écartée", async () => {
      mockClaudeReplies(draft, verdicts);

      const { cvData } = await (await post({ cvId, templateId: "modern" })).json();

      expect(cvData.experience.find((e: { id: string }) => e.id === "exp-old")).toMatchObject({
        company: "Globex",
        hidden: true,
      });
    });

    it("ne vérifie que les phrases conformes aux règles", async () => {
      mockClaudeReplies(draft, verdicts);

      await post({ cvId, templateId: "modern" });

      const verificationPrompt = (parseMessage.mock.calls[1][0] as { messages: { content: string }[] }).messages[0].content;
      expect(verificationPrompt).toContain("A migré le front vers Next.js");
      expect(verificationPrompt).not.toContain("A encadré 5 développeurs");
    });

    it("garde un CV utilisable si la vérification échoue, en le signalant", async () => {
      mockClaudeReplies(draft, "pas du JSON");

      const res = await post({ cvId, templateId: "modern" });

      expect(res.status).toBe(200);
      const { cvData, report } = await res.json();
      expect(report.method).toBe("rules-only");
      expect(cvData.experience[0].bullets).toContain("A migré le front vers Next.js");
      expect(cvData.experience[0].bullets).not.toContain("A encadré 5 développeurs");
    });

    it("n'envoie au modèle que les faits de l'utilisateur connecté", async () => {
      const other = await createUser();
      await createExperience(other.id, { company: "Entreprise secrète" });
      mockClaudeReplies(draft, verdicts);

      await post({ cvId, templateId: "modern" });

      expect(sentPrompt()).toContain("Acme");
      expect(sentPrompt()).not.toContain("Entreprise secrète");
    });

    it("renvoie 500 et conserve l'ancien CV si la génération échoue", async () => {
      mockClaudeReplies("pas du JSON");

      expect((await post({ cvId, templateId: "modern" })).status).toBe(500);
      expect((await findCv(cvId))!.cvData).toBe("{}");
    });
  });

  it("demande de compléter un profil vide avant de générer", async () => {
    const empty = await createUser({ name: "Vide" });
    loginAs(empty.id);
    const cv = await createCv(empty.id);

    const res = await post({ cvId: cv.id, templateId: "modern" });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/profil est vide/);
    expect(parseMessage).not.toHaveBeenCalled();
  });
});

describe("POST /api/ai/generate-cover-letter", () => {
  const post = (body: unknown) =>
    generateCoverLetter(jsonRequest("/api/ai/generate-cover-letter", body));

  const letter = {
    recipient: { companyName: "Acme", contactName: null, contactTitle: null, address: null, city: null },
    senderCity: "Ville inventée",
    date: "25 septembre 2026",
    subject: "Objet : Candidature",
    opening: "Madame, Monsieur,",
    introduction: "…",
    motivation: "…",
    skillsMatch: "…",
    conclusion: "…",
    closing: "…",
    senderName: "Nom inventé",
  };

  it("renvoie 401 sans session", async () => {
    logout();
    expect((await post({ cvId: "x" })).status).toBe(401);
  });

  it("renvoie 404 pour le CV d'un autre utilisateur", async () => {
    const other = await createUser();
    const cv = await createCv(other.id, { cvData: JSON.stringify(buildCvData()) });
    expect((await post({ cvId: cv.id })).status).toBe(404);
  });

  it("exige que le CV ait été généré", async () => {
    const cv = await createCv(userId, { cvData: "{}" });

    const res = await post({ cvId: cv.id });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Le CV n'a pas encore été généré" });
    expect(parseMessage).not.toHaveBeenCalled();
  });

  it("génère la lettre en imposant le nom et la ville du profil", async () => {
    const cv = await createCv(userId, { cvData: JSON.stringify(buildCvData()) });
    mockClaudeReply(letter);

    const res = await post({ cvId: cv.id });

    expect(res.status).toBe(200);
    const { coverLetterData } = await res.json();
    expect(coverLetterData.senderName).toBe("Jeanne Martin");
    // Claude does not know today's date: the app sets it
    expect(coverLetterData.date).toBe(
      new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    );
    expect(coverLetterData.senderCity).toBe("Nantes");
    expect(JSON.parse((await findCv(cv.id))!.coverLetterData!)).toEqual(coverLetterData);
  });

  it("renvoie 500 si l'IA ne renvoie pas du JSON", async () => {
    const cv = await createCv(userId, { cvData: JSON.stringify(buildCvData()) });
    mockClaudeReply("```json\n{}\n```");

    expect((await post({ cvId: cv.id })).status).toBe(500);
    expect((await findCv(cv.id))!.coverLetterData).toBeNull();
  });
});
