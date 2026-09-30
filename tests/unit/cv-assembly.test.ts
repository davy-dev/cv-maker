import { describe, it, expect } from "vitest";
import { buildFactCatalog } from "@/lib/ai/facts";
import { assembleCv, yearsOfExperience } from "@/lib/ai/cv";
import { collectClaims } from "@/lib/ai/verify";
import type { CvDraft } from "@/lib/ai/schemas";
import { profileSource, experience, project } from "../helpers/profile";

const source = profileSource({
  experiences: [experience(), experience({ id: "exp2", company: "Globex", position: "Stagiaire", startDate: "2019-01", endDate: "2019-06", sortOrder: 1 })],
  projects: [project(), project({ id: "proj2", name: "Blog", sortOrder: 1 })],
});
const catalog = buildFactCatalog(source);
const id = (fragment: string) => catalog.facts.find((f) => f.text.includes(fragment))!.id;
const s = (text: string, fragment = "Migration du front") => ({ text, sourceIds: [id(fragment)] });

const draft: CvDraft = {
  title: s("Développeuse front-end", "Titre professionnel"),
  summary: [s("Spécialiste React.", "Technologies utilisées : TypeScript"), s("Phrase inventée.")],
  experiences: [{ experienceId: "exp1", bullets: [s("A migré le front vers Next.js"), s("Bullet rejetée")] }],
  projects: [{ projectId: "proj1", description: s("Outil de CV", "Générateur de CV"), highlights: [s("Point rejeté", "Rendu PDF")] }],
  skills: [{ category: "Front", items: ["React", "React"] }],
  skillsToAcquire: [{ skill: "Kubernetes", reason: "Demandé", howToAcquire: "Formation" }],
};

function assemble(rejectedTexts: string[]) {
  const claims = collectClaims(draft);
  const accepted = new Set(claims.filter((c) => !rejectedTexts.includes(c.text)).map((c) => c.id));
  return assembleCv(draft, catalog, claims, accepted);
}

describe("assembleCv", () => {
  const cv = assemble(["Phrase inventée.", "Bullet rejetée", "Point rejeté"]);

  it("recopie les faits depuis la base, jamais depuis le modèle", () => {
    expect(cv.experience[0]).toMatchObject({ company: "Acme", position: "Développeuse", startDate: "2020-01", endDate: "Présent" });
    expect(cv.education[0]).toMatchObject({ institution: "INSA", degree: "Ingénieure" });
    expect(cv.projects[0]).toMatchObject({ name: "CV Maker", url: "https://cv.example", links: [{ label: "Repo", url: "https://github.com/x" }] });
    expect(cv.header).toMatchObject({ name: "Jeanne Martin", email: "jeanne@exemple.com" });
  });

  it("ne garde que les phrases vérifiées", () => {
    expect(cv.summary).toBe("Spécialiste React.");
    expect(cv.experience[0].bullets).toEqual(["A migré le front vers Next.js"]);
    expect(cv.header.title).toBe("Développeuse front-end");
    expect(cv.projects[0].description).toBe("Outil de CV");
  });

  it("revient aux mots du candidat quand tout est rejeté", () => {
    const rejectedAll = assemble(collectClaims(draft).map((c) => c.text));
    expect(rejectedAll.header.title).toBe("Développeuse full-stack");
    expect(rejectedAll.summary).toBe("Développeuse passionnée par le web.");
    expect(rejectedAll.experience[0].bullets).toEqual(["Migration du front vers Next.js", "Réduction du temps de build de 40 %"]);
    expect(rejectedAll.projects[0].description).toBe("Générateur de CV");
    expect(rejectedAll.projects[0].highlights).toEqual(["Rendu PDF côté client"]);
  });

  it("garde, masqués, les expériences et projets que le modèle a écartés", () => {
    expect(cv.experience.map((e) => [e.id, !!e.hidden])).toEqual([["exp1", false], ["exp2", true]]);
    expect(cv.projects.map((p) => [p.id, !!p.hidden])).toEqual([["proj1", false], ["proj2", true]]);
  });

  it("masque les projets choisis au-delà de 2 dans la section projets", () => {
    const projects = ["proj1", "proj2", "proj3"].map((projectId, i) => project({ id: projectId, name: `Projet ${i}`, sortOrder: i }));
    const manyCatalog = buildFactCatalog(profileSource({ projects }));
    const manyDraft: CvDraft = {
      ...draft,
      experiences: [],
      projects: projects.map((p) => ({ projectId: p.id, description: s("Générateur de CV", "Générateur de CV"), highlights: [] })),
    };
    const claims = collectClaims(manyDraft);
    const result = assembleCv(manyDraft, manyCatalog, claims, new Set(claims.map((c) => c.id)));

    expect(result.projects.map((p) => [p.id, !!p.hidden])).toEqual([["proj1", false], ["proj2", false], ["proj3", true]]);
  });

  it("n'utilise que les compétences du candidat, les autres restent masquées", () => {
    expect(cv.skills).toEqual({ Front: ["React"], "Autres compétences": ["TypeScript"] });
    expect(cv.hiddenSkillCategories).toEqual(["Autres compétences"]);
  });

  it("n'invente pas de centres d'intérêt et calcule l'expérience depuis les dates", () => {
    expect(cv.interests).toEqual([]);
    expect(cv.yearsExperience).toMatch(/^\d+ ans? d'expérience$/);
  });
});

describe("yearsOfExperience", () => {
  const now = new Date(2026, 8, 1); // September 2026

  it("compte une seule fois les périodes qui se chevauchent", () => {
    expect(
      yearsOfExperience(
        [
          { startDate: "2020-01", endDate: "2022-12" },
          { startDate: "2022-01", endDate: "2023-12" },
        ],
        now
      )
    ).toBe("4 ans d'expérience");
  });

  it("compte jusqu'à aujourd'hui un poste en cours", () => {
    expect(yearsOfExperience([{ startDate: "2024-09", endDate: null }], now)).toBe("2 ans d'expérience");
  });

  it("gère les débuts de carrière et les dates illisibles", () => {
    expect(yearsOfExperience([{ startDate: "2026-03", endDate: null }], now)).toBe("Moins d'un an d'expérience");
    expect(yearsOfExperience([{ startDate: "bientôt", endDate: null }], now)).toBe("");
  });
});
