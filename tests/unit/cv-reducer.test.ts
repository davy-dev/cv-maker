import { describe, it, expect } from "vitest";
import { cvReducer } from "@/lib/cv/reducer";
import { buildCvData } from "../helpers/fixtures";

describe("cvReducer — visibilité", () => {
  it("masque puis réaffiche une section", () => {
    const hidden = cvReducer(buildCvData(), { type: "TOGGLE_SECTION", section: "interests" });
    expect(hidden.hiddenSections).toEqual(["interests"]);

    const shown = cvReducer(hidden, { type: "TOGGLE_SECTION", section: "interests" });
    expect(shown.hiddenSections).toEqual([]);
  });

  it("masque une expérience sans toucher aux autres", () => {
    const data = buildCvData();
    data.experience.push({ ...data.experience[0], id: "exp2" });

    const result = cvReducer(data, { type: "TOGGLE_EXPERIENCE_HIDDEN", index: 1 });

    expect(result.experience.map((e) => !!e.hidden)).toEqual([false, true]);
    expect(data.experience[1].hidden).toBeUndefined();
  });

  it("garde une catégorie masquée quand on la renomme", () => {
    let data = cvReducer(buildCvData(), { type: "TOGGLE_SKILL_CATEGORY_HIDDEN", category: "Langages" });
    data = cvReducer(data, { type: "SET_SKILL_CATEGORY", oldCategory: "Langages", newCategory: "Langues" });

    expect(data.hiddenSkillCategories).toEqual(["Langues"]);
    expect(data.skills).toHaveProperty("Langues");
  });
});

describe("cvReducer — sections libres et mise en page", () => {
  it("ajoute, modifie, masque puis supprime une section libre", () => {
    let data = cvReducer(buildCvData(), { type: "ADD_CUSTOM_SECTION", title: "Langues" });
    const id = data.customSections![0].id;
    expect(data.customSections).toEqual([{ id, title: "Langues", content: "" }]);

    data = cvReducer(data, { type: "SET_CUSTOM_SECTION_FIELD", id, field: "content", value: "Anglais" });
    data = cvReducer(data, { type: "TOGGLE_CUSTOM_SECTION_HIDDEN", id });
    expect(data.customSections![0]).toMatchObject({ content: "Anglais", hidden: true });

    data = cvReducer(data, { type: "MOVE_SECTION", section: `custom:${id}`, column: "main", index: 0 });
    expect(data.layout!.main[0]).toBe(`custom:${id}`);

    data = cvReducer(data, { type: "REMOVE_CUSTOM_SECTION", id });
    expect(data.customSections).toEqual([]);
    expect([...data.layout!.main, ...data.layout!.aside]).not.toContain(`custom:${id}`);
  });

  it("enregistre la mise en page complète au premier déplacement", () => {
    const data = cvReducer(buildCvData(), { type: "MOVE_SECTION", section: "skills", column: "main", index: 0 });
    expect(data.layout).toEqual({
      main: ["skills", "summary", "experience", "projects"],
      aside: ["education", "interests"],
    });
  });
});
