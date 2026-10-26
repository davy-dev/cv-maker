import { describe, it, expect } from "vitest";
import { emptyCvData, isGeneratedCv, normalizeCvData } from "@/lib/cv/normalize";
import { buildCvData } from "../helpers/fixtures";

describe("normalizeCvData", () => {
  it("donne un CV vide pour un CV pas encore généré ou illisible", () => {
    expect(normalizeCvData("{}")).toEqual(emptyCvData());
    expect(normalizeCvData("pas du json")).toEqual(emptyCvData());
    expect(normalizeCvData("null")).toEqual(emptyCvData());
  });

  it("garde un CV complet tel quel", () => {
    const cv = buildCvData();
    expect(normalizeCvData(JSON.stringify(cv))).toEqual(cv);
  });

  it("conserve les sections libres et la mise en page", () => {
    const layout = { main: ["summary"], aside: ["custom:l1"] };
    const cv = normalizeCvData(
      JSON.stringify({ customSections: [{ id: "l1", title: "Langues", content: "Anglais", hidden: true }, {}], layout })
    );

    expect(cv.customSections).toEqual([
      { id: "l1", title: "Langues", content: "Anglais", hidden: true },
      { id: expect.any(String), title: "", content: "" },
    ]);
    expect(cv.layout).toEqual(layout);
  });

  it("garde l'arrondi de la photo, borné, et rien pour les anciens CV", () => {
    expect(normalizeCvData(JSON.stringify({ photoRadius: 20 })).photoRadius).toBe(20);
    expect(normalizeCvData(JSON.stringify({ photoRadius: 300 })).photoRadius).toBe(50);
    expect(normalizeCvData("{}")).not.toHaveProperty("photoRadius");
  });

  it("conserve les sections, catégories et projets masqués", () => {
    const cv = normalizeCvData(
      JSON.stringify({
        hiddenSections: ["summary"],
        hiddenSkillCategories: ["Outils"],
        projects: [{ id: "p1", name: "CV Maker", hidden: true }],
      })
    );

    expect(cv.hiddenSections).toEqual(["summary"]);
    expect(cv.hiddenSkillCategories).toEqual(["Outils"]);
    expect(cv.projects[0]).toMatchObject({ id: "p1", name: "CV Maker", hidden: true, highlights: [] });
  });
});

describe("isGeneratedCv", () => {
  it("distingue un brouillon pas encore généré d'un CV généré", () => {
    expect(isGeneratedCv("{}")).toBe(false);
    expect(isGeneratedCv("pas du json")).toBe(false);
    expect(isGeneratedCv(JSON.stringify(buildCvData()))).toBe(true);
  });
});
