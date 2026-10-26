import { describe, it, expect } from "vitest";
import { DEFAULT_LAYOUT, moveSection, parseCustomSectionId, resolveLayout } from "@/lib/cv/layout";
import { buildCvData } from "../helpers/fixtures";
import type { CvLayout } from "@/types/cv";

const langues = { id: "l1", title: "Langues", content: "Anglais" };

describe("resolveLayout", () => {
  it("prend l'ordre par défaut d'un CV sans mise en page", () => {
    expect(resolveLayout(buildCvData())).toEqual(DEFAULT_LAYOUT);
  });

  it("place une nouvelle section libre en bas de la colonne latérale", () => {
    const layout = resolveLayout(buildCvData({ customSections: [langues] }));
    expect(layout.aside.at(-1)).toBe("custom:l1");
  });

  it("garde l'ordre enregistré et complète ce qui manque", () => {
    const layout = resolveLayout(
      buildCvData({
        customSections: [langues],
        layout: { main: ["experience", "custom:l1"], aside: ["interests", "summary"] },
      })
    );

    expect(layout).toEqual({
      main: ["experience", "custom:l1", "projects"],
      aside: ["interests", "summary", "skills", "education"],
    });
  });

  it("retire les sections supprimées, inconnues ou en double", () => {
    const layout = resolveLayout(
      buildCvData({
        layout: {
          main: ["summary", "custom:supprimee", "summary", "inconnue"],
          aside: ["summary", "skills"],
        } as unknown as CvLayout,
      })
    );

    expect(layout.main).toEqual(["summary", "experience", "projects"]);
    expect(layout.aside).toEqual(["skills", "education", "interests"]);
  });

  it("supporte une mise en page enregistrée invalide", () => {
    const layout = resolveLayout(buildCvData({ layout: { main: null } as unknown as CvLayout }));
    expect(layout).toEqual(DEFAULT_LAYOUT);
  });
});

describe("moveSection", () => {
  it("déplace une section vers l'autre colonne", () => {
    expect(moveSection(DEFAULT_LAYOUT, "skills", "main", 1)).toEqual({
      main: ["summary", "skills", "experience", "projects"],
      aside: ["education", "interests"],
    });
  });

  it("réordonne dans la même colonne et borne la position", () => {
    expect(moveSection(DEFAULT_LAYOUT, "summary", "main", 99).main).toEqual(["experience", "projects", "summary"]);
    expect(moveSection(DEFAULT_LAYOUT, "projects", "main", -3).main).toEqual(["projects", "summary", "experience"]);
  });
});

describe("parseCustomSectionId", () => {
  it("distingue les sections libres des sections du CV", () => {
    expect(parseCustomSectionId("custom:l1")).toBe("l1");
    expect(parseCustomSectionId("skills")).toBeNull();
  });
});
