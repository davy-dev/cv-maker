import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { POST } from "@/app/api/ai/analyze/route";
import { generatedCvs } from "@/lib/db/schema";
import { scrapeCompany } from "@/lib/scraper";
import { setupTestDb, createUser, createSkill } from "../../helpers/db";
import { buildJobAnalysis } from "../../helpers/fixtures";
import { loginAs, logout } from "../../helpers/session";
import { parseMessage, mockClaudeReply, sentPrompt } from "../../helpers/claude";
import { jsonRequest } from "../../helpers/http";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/ai/client", () => ({ anthropic: { messages: { parse: vi.fn() } } }));
vi.mock("@/lib/scraper", () => ({ scrapeCompany: vi.fn() }));

const db = setupTestDb();
let userId: string;

beforeEach(async () => {
  userId = (await createUser()).id;
  loginAs(userId);
});

const jobOfferText = "Nous recherchons un développeur React / TypeScript confirmé.";
const analyze = (body: unknown) => POST(jsonRequest("/api/ai/analyze", body));

describe("POST /api/ai/analyze", () => {
  it("renvoie 401 sans session", async () => {
    logout();
    expect((await analyze({ jobOfferText })).status).toBe(401);
  });

  it("renvoie 400 si l'offre est trop courte", async () => {
    const res = await analyze({ jobOfferText: "court" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "L'offre d'emploi est trop courte" });
  });

  it("demande d'ajouter des compétences avant d'appeler l'IA", async () => {
    const res = await analyze({ jobOfferText });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Aucune compétence trouvée/);
    expect(parseMessage).not.toHaveBeenCalled();
  });

  it("analyse l'offre et crée un brouillon de CV", async () => {
    await createSkill(userId, { name: "React" });
    const analysis = buildJobAnalysis({ jobTitle: "Dev React", company: "Acme" });
    mockClaudeReply(analysis);

    const res = await analyze({ jobOfferText });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis).toEqual(analysis);
    expect(body.companyInfo).toBeNull();
    expect(scrapeCompany).not.toHaveBeenCalled();

    const cv = await db.query.generatedCvs.findFirst({ where: eq(generatedCvs.id, body.cvId) });
    expect(cv).toMatchObject({
      userId,
      title: "Dev React - Acme",
      jobOfferText,
      status: "draft",
      templateId: "executive",
      cvData: "{}",
    });
    expect(JSON.parse(cv!.matchedSkills!)).toEqual(analysis.matchedSkills);

    const prompt = sentPrompt();
    expect(prompt).toContain(jobOfferText);
    expect(prompt).toContain("- React (");
  });

  it("n'envoie à l'IA que les compétences de l'utilisateur connecté", async () => {
    await createSkill(userId, { name: "React" });
    const other = await createUser();
    await createSkill(other.id, { name: "COBOL" });
    mockClaudeReply(buildJobAnalysis());

    await analyze({ jobOfferText });

    const prompt = JSON.stringify(parseMessage.mock.calls[0][0]);
    expect(prompt).not.toContain("COBOL");
  });

  it("enrichit l'analyse avec le site de l'entreprise", async () => {
    await createSkill(userId);
    const companyInfo = {
      name: "Acme",
      description: "Fusées",
      url: "https://acme.io/",
      values: "",
      techStack: "",
      rawExcerpt: "",
    };
    vi.mocked(scrapeCompany).mockResolvedValue(companyInfo);
    mockClaudeReply(buildJobAnalysis());

    const res = await analyze({ jobOfferText, companyUrl: "https://acme.io" });

    expect(scrapeCompany).toHaveBeenCalledWith("https://acme.io");
    expect((await res.json()).companyInfo).toEqual(companyInfo);
  });

  it("appelle Claude Sonnet 5 avec de la marge pour la réflexion adaptative", async () => {
    await createSkill(userId);
    mockClaudeReply(buildJobAnalysis());

    await analyze({ jobOfferText });

    expect(parseMessage).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-sonnet-5", max_tokens: 16000 })
    );
  });

  it.each(["max_tokens", "refusal"] as const)(
    "renvoie 500 sans rien enregistrer si la réponse s'arrête sur %s",
    async (stopReason) => {
      await createSkill(userId);
      // Even a parseable body must be ignored when the answer was cut off or refused
      mockClaudeReply(buildJobAnalysis(), stopReason);

      const res = await analyze({ jobOfferText });

      expect(res.status).toBe(500);
      expect(await db.select().from(generatedCvs)).toHaveLength(0);
    }
  );

  it("envoie le schéma de l'analyse en structured output", async () => {
    await createSkill(userId);
    mockClaudeReply(buildJobAnalysis());

    await analyze({ jobOfferText });

    const { output_config } = parseMessage.mock.calls[0][0] as {
      output_config: { format: { type: string; schema: { required: string[] } } };
    };
    expect(output_config.format.type).toBe("json_schema");
    expect(output_config.format.schema.required).toEqual(
      expect.arrayContaining(["jobTitle", "matchedSkills", "matchScore"])
    );
  });

  it("renvoie 500 si la réponse ne respecte pas le schéma", async () => {
    await createSkill(userId);
    const incomplete: Partial<ReturnType<typeof buildJobAnalysis>> = buildJobAnalysis();
    delete incomplete.matchedSkills;
    mockClaudeReply(incomplete);

    expect((await analyze({ jobOfferText })).status).toBe(500);
    expect(await db.select().from(generatedCvs)).toHaveLength(0);
  });

  it("renvoie 500 sans rien enregistrer si l'IA ne renvoie pas du JSON", async () => {
    await createSkill(userId);
    mockClaudeReply("Désolé, je ne peux pas analyser cette offre.");

    const res = await analyze({ jobOfferText });

    expect(res.status).toBe(500);
    expect(await db.select().from(generatedCvs)).toHaveLength(0);
  });
});
