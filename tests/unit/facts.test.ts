import { describe, it, expect } from "vitest";
import { buildFactCatalog, formatFactsForPrompt, parseList } from "@/lib/ai/facts";
import { profileSource, experience, project, user } from "../helpers/profile";

describe("parseList", () => {
  it.each([
    [null, []],
    ["pas du json", []],
    ['{"a":1}', []],
    ['["TypeScript", "", 3, "React"]', ["TypeScript", "React"]],
  ])("lit %s sans planter", (input, expected) => {
    expect(parseList(input)).toEqual(expected);
  });
});

describe("buildFactCatalog", () => {
  it("numérote chaque fait du profil avec ce qu'il décrit", () => {
    const { facts } = buildFactCatalog(profileSource());
    const texts = facts.map((f) => f.text);

    expect(facts.map((f) => f.id)).toEqual(facts.map((_, i) => `F${i + 1}`));
    expect(texts).toContain("Réalisation : Migration du front vers Next.js");
    expect(texts).toContain("Technologies utilisées : TypeScript, React");
    expect(texts).toContain("Poste : Développeuse chez Acme (2020-01 – aujourd'hui)");
    expect(texts).toContain("Compétence : TypeScript (niveau 4/5, 5 an(s))");
    expect(facts.find((f) => f.text === "Point clé : Rendu PDF côté client")?.owner).toEqual({
      kind: "project",
      id: "proj1",
    });
  });

  it("ignore les champs vides", () => {
    const { facts } = buildFactCatalog(
      profileSource({
        user: user({ title: null, summary: "  " }),
        experiences: [experience({ description: null, achievements: null, technologies: "[]" })],
        projects: [project({ description: "", highlights: null, technologies: null })],
      })
    );
    expect(facts.every((f) => f.text.trim())).toBe(true);
    expect(facts.some((f) => f.owner.kind === "profile")).toBe(false);
  });
});

describe("formatFactsForPrompt", () => {
  it("regroupe les faits par expérience et par projet avec leurs identifiants", () => {
    const text = formatFactsForPrompt(buildFactCatalog(profileSource()));

    expect(text).toContain("### Expérience exp1 — Développeuse chez Acme");
    expect(text).toContain("### Projet proj1 — CV Maker");
    expect(text).toMatch(/^\[F\d+\] Réalisation : Migration du front vers Next\.js$/m);
  });
});
