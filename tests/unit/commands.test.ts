import { describe, it, expect } from "vitest";
import { deleteAction, duplicateAction } from "@/lib/cv/commands";
import { resolveLayout } from "@/lib/cv/layout";
import { cvReducer } from "@/lib/cv/reducer";
import { buildCvData } from "../helpers/fixtures";
import type { CvData } from "@/types/cv";

function cv(): CvData {
  return buildCvData({
    skills: { Langages: ["TS"], "Langages (copie)": ["Go"], Outils: ["Git"] },
    hiddenSkillCategories: ["Outils"],
    customSections: [{ id: "c1", title: "Langues", content: "Anglais" }],
    layout: { main: ["summary", "custom:c1", "experience"], aside: [] },
  });
}

describe("Suppr sur la sélection", () => {
  it("supprime une expérience ou une catégorie de compétences", () => {
    const withoutExperience = cvReducer(cv(), deleteAction(cv(), { kind: "item", section: "experience", id: "exp1" })!);
    expect(withoutExperience.experience).toEqual([]);

    const withoutCategory = cvReducer(cv(), deleteAction(cv(), { kind: "item", section: "skills", id: "Outils" })!);
    expect(Object.keys(withoutCategory.skills)).toEqual(["Langages", "Langages (copie)"]);
    expect(withoutCategory.hiddenSkillCategories).toEqual([]);
  });

  it("supprime une section libre, jamais une section du CV, l'en-tête ou le document", () => {
    expect(deleteAction(cv(), { kind: "section", section: "custom:c1" })).toEqual({ type: "REMOVE_CUSTOM_SECTION", id: "c1" });
    expect(deleteAction(cv(), { kind: "section", section: "experience" })).toBeNull();
    expect(deleteAction(cv(), { kind: "header" })).toBeNull();
    expect(deleteAction(cv(), { kind: "document" })).toBeNull();
    expect(deleteAction(cv(), { kind: "item", section: "projects", id: "absent" })).toBeNull();
  });
});

describe("⌘D sur la sélection", () => {
  it("duplique une expérience juste après elle et sélectionne la copie", () => {
    const duplicate = duplicateAction(cv(), { kind: "item", section: "experience", id: "exp1" }, "copie")!;
    const data = cvReducer(cv(), duplicate.action);

    expect(data.experience.map((e) => e.id)).toEqual(["exp1", "copie"]);
    expect({ ...data.experience[1], id: "exp1" }).toEqual(data.experience[0]);
    expect(data.experience[1].bullets).not.toBe(data.experience[0].bullets);
    expect(duplicate.select).toEqual({ kind: "item", section: "experience", id: "copie" });
  });

  it("nomme la copie d'une catégorie sans écraser une catégorie existante", () => {
    const duplicate = duplicateAction(cv(), { kind: "item", section: "skills", id: "Langages" }, "ignoré")!;
    const data = cvReducer(cv(), duplicate.action);

    expect(Object.keys(data.skills)).toEqual(["Langages", "Langages (copie 2)", "Langages (copie)", "Outils"]);
    expect(duplicate.select).toEqual({ kind: "item", section: "skills", id: "Langages (copie 2)" });
  });

  it("duplique une section libre juste sous elle, dans la même colonne", () => {
    const duplicate = duplicateAction(cv(), { kind: "section", section: "custom:c1" }, "c2")!;
    const data = cvReducer(cv(), duplicate.action);

    expect(data.customSections!.map((s) => s.title)).toEqual(["Langues", "Langues"]);
    expect(resolveLayout(data).main).toEqual(["summary", "custom:c1", "custom:c2", "experience", "projects"]);
  });

  it("ne duplique ni les sections du CV ni l'en-tête", () => {
    expect(duplicateAction(cv(), { kind: "section", section: "summary" }, "x")).toBeNull();
    expect(duplicateAction(cv(), { kind: "header" }, "x")).toBeNull();
  });
});
