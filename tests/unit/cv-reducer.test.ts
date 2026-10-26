import { describe, it, expect, vi } from "vitest";
import { cvReducer } from "@/lib/cv/reducer";
import { buildCvData } from "../helpers/fixtures";

vi.mock("@/lib/actions/cv", () => ({ saveCvData: vi.fn(), updateCvTemplate: vi.fn() }));
vi.mock("@/components/pdf/render-cv", () => ({ renderCvPdf: vi.fn() }));

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
