import { describe, it, expect } from "vitest";
import { applyVisibility } from "@/lib/cv/visibility";
import { buildCvData } from "../helpers/fixtures";
import type { CvData, CvProject } from "@/types/cv";

function project(overrides: Partial<CvProject> = {}): CvProject {
  return {
    id: "p1",
    name: "CV Maker",
    description: "",
    technologies: [],
    url: null,
    type: "personal",
    role: "",
    impact: "",
    highlights: [],
    motivation: "",
    links: [],
    linkedExperienceId: null,
    displayMode: "projects-section",
    ...overrides,
  };
}

function cv(overrides: Partial<CvData> = {}) {
  return buildCvData({
    skills: { Langages: ["TypeScript"], Outils: ["Docker"] },
    projects: [project(), project({ id: "p2", name: "Autre" })],
    interests: ["Escalade"],
    education: [
      { id: "e1", institution: "INSA", degree: "Ingénieur", field: "Info", startDate: "2012", endDate: "2017", description: "" },
    ],
    ...overrides,
  });
}

describe("applyVisibility", () => {
  it("ne change rien quand rien n'est masqué", () => {
    const data = cv();
    expect(applyVisibility(data)).toEqual(data);
  });

  it("vide les sections masquées", () => {
    const result = applyVisibility(
      cv({ hiddenSections: ["summary", "experience", "education", "skills", "interests"] })
    );
    expect(result).toMatchObject({ summary: "", experience: [], education: [], skills: {}, interests: [] });
    expect(result.projects).toHaveLength(2);
  });

  it("retire les éléments masqués individuellement", () => {
    const data = cv();
    data.experience = [...data.experience, { ...data.experience[0], id: "exp2", hidden: true }];
    data.projects[1] = { ...data.projects[1], hidden: true };
    data.education[0] = { ...data.education[0], hidden: true };

    const result = applyVisibility(data);

    expect(result.experience.map((e) => e.id)).toEqual(["exp1"]);
    expect(result.projects.map((p) => p.id)).toEqual(["p1"]);
    expect(result.education).toEqual([]);
  });

  it("retire les catégories de compétences masquées", () => {
    expect(applyVisibility(cv({ hiddenSkillCategories: ["Outils"] })).skills).toEqual({
      Langages: ["TypeScript"],
    });
  });

  it("retire tous les projets quand la section projets est désactivée", () => {
    expect(applyVisibility(cv({ showProjects: false })).projects).toEqual([]);
  });

  it("replace dans la section projets un projet rattaché à une expérience masquée", () => {
    const data = cv({
      projects: [project({ displayMode: "under-experience", linkedExperienceId: "exp1" })],
    });
    data.experience[0] = { ...data.experience[0], hidden: true };

    expect(applyVisibility(data).projects[0].displayMode).toBe("projects-section");
  });

  it("garde au plus 2 projets dans la section projets, sans compter ceux sous une expérience", () => {
    const data = cv({
      projects: [
        project({ id: "p1" }),
        project({ id: "p2", displayMode: "under-experience", linkedExperienceId: "exp1" }),
        project({ id: "p3" }),
        project({ id: "p4" }),
        project({ id: "p5", hidden: true }),
      ],
    });

    expect(applyVisibility(data).projects.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("ne modifie pas les données de l'éditeur", () => {
    const data = cv({ hiddenSections: ["summary"] });
    applyVisibility(data);
    expect(data.summary).not.toBe("");
  });
});

describe("applyVisibility — sections libres", () => {
  it("retire les sections libres masquées", () => {
    const result = applyVisibility(
      buildCvData({
        customSections: [
          { id: "a", title: "Langues", content: "Anglais" },
          { id: "b", title: "Veille", content: "DDD", hidden: true },
        ],
      })
    );
    expect(result.customSections?.map((s) => s.id)).toEqual(["a"]);
  });
});
