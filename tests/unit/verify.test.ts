import { describe, it, expect, vi } from "vitest";
import { buildFactCatalog } from "@/lib/ai/facts";
import { checkRules, collectClaims, verifyClaims, type Claim, type ModelVerifier } from "@/lib/ai/verify";
import { profileSource, project } from "../helpers/profile";

const catalog = buildFactCatalog(
  profileSource({
    projects: [project(), project({ id: "proj2", name: "Blog", description: "Blog perso", linkedExperienceId: "exp1" })],
  })
);
const id = (fragment: string) => catalog.facts.find((f) => f.text.includes(fragment))!.id;

const claim = (overrides: Partial<Claim>): Claim => ({
  id: "C1",
  section: "experience",
  ownerId: "exp1",
  text: "A migré le front vers Next.js",
  sourceIds: [id("Migration du front")],
  ...overrides,
});

describe("checkRules", () => {
  it("accepte une reformulation qui cite les faits de son expérience", () => {
    expect(checkRules(claim({}), catalog)).toBeNull();
  });

  it("rejette une phrase sans source", () => {
    expect(checkRules(claim({ sourceIds: [] }), catalog)).toBe("Aucune source dans votre profil");
  });

  it("rejette un chiffre absent des sources", () => {
    expect(
      checkRules(claim({ text: "A migré le front vers Next.js pour 12 équipes" }), catalog)
    ).toBe("Chiffre absent de vos données : 12");
  });

  it("accepte un chiffre présent dans la source, quelle que soit sa forme", () => {
    const text = "A réduit le temps de build de 40%";
    expect(checkRules(claim({ text, sourceIds: [id("40 %")] }), catalog)).toBeNull();
  });

  it("rejette une réalisation attribuée à une expérience sans ses faits", () => {
    expect(
      checkRules(claim({ sourceIds: [id("Générateur de CV")] }), catalog)
    ).toBe("Attribué à cette expérience sans s'appuyer sur ses faits");
  });

  it("accepte les faits d'un projet rattaché à l'expérience", () => {
    expect(checkRules(claim({ text: "A créé un blog", sourceIds: [id("Blog perso")] }), catalog)).toBeNull();
  });

  it("rejette un projet décrit avec les faits d'un autre projet", () => {
    expect(
      checkRules(
        claim({ section: "project", ownerId: "proj1", sourceIds: [id("Générateur de CV"), id("Blog perso")] }),
        catalog
      )
    ).toBe("Mélange des faits d'une autre expérience ou d'un autre projet");
  });

  it("laisse le résumé citer n'importe quel fait", () => {
    expect(
      checkRules(claim({ section: "summary", ownerId: undefined, sourceIds: [id("Générateur de CV")] }), catalog)
    ).toBeNull();
  });
});

describe("verifyClaims", () => {
  const claims = [
    claim({ id: "C1" }),
    claim({ id: "C2", text: "A dirigé 12 personnes" }),
    claim({ id: "C3", text: "A migré vers Next.js et Kubernetes" }),
  ];

  it("applique les règles puis la vérification du modèle", async () => {
    const verifier = vi.fn<ModelVerifier>(async () =>
      new Map([
        ["C1", { supported: true, reason: "" }],
        ["C3", { supported: false, reason: "Kubernetes n'apparaît pas" }],
      ])
    );

    const result = await verifyClaims(claims, catalog, verifier);

    // The rule-rejected claim is never sent to the model
    expect(verifier.mock.calls[0][0].map((c) => c.id)).toEqual(["C1", "C3"]);
    expect([...result.acceptedIds]).toEqual(["C1"]);
    expect(result.rejected).toEqual([
      { section: "experience", text: "A dirigé 12 personnes", reason: "Chiffre absent de vos données : 12" },
      { section: "experience", text: "A migré vers Next.js et Kubernetes", reason: "Kubernetes n'apparaît pas" },
    ]);
    expect(result).toMatchObject({ method: "model", checkedCount: 3 });
  });

  it("rejette une phrase pour laquelle le modèle n'a rendu aucun verdict", async () => {
    const result = await verifyClaims([claim({ id: "C1" })], catalog, async () => new Map());
    expect(result.acceptedIds.size).toBe(0);
    expect(result.rejected[0].reason).toBe("Non confirmé par la vérification");
  });

  it("garde les phrases conformes aux règles si la vérification échoue", async () => {
    const result = await verifyClaims(claims, catalog, async () => null);
    expect([...result.acceptedIds]).toEqual(["C1", "C3"]);
    expect(result.method).toBe("rules-only");
  });
});

describe("collectClaims", () => {
  it("transforme chaque phrase rédigée en affirmation à vérifier", () => {
    const src = { text: "x", sourceIds: ["F1"] };
    const claims = collectClaims({
      title: src,
      summary: [src, { text: "", sourceIds: [] }],
      experiences: [{ experienceId: "exp1", bullets: [src] }],
      projects: [{ projectId: "proj1", description: src, highlights: [src] }],
      skillsToAcquire: [],
    });
    expect(claims.map((c) => [c.section, c.ownerId])).toEqual([
      ["title", undefined],
      ["summary", undefined],
      ["experience", "exp1"],
      ["project", "proj1"],
      ["project", "proj1"],
    ]);
  });
});
