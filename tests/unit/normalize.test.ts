import { describe, it, expect } from "vitest";
import { emptyCvData, normalizeCvData } from "@/lib/cv/normalize";
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
