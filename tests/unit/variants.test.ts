import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_VARIANT, VARIANTS, VARIANT_IDS } from "@/lib/cv/variants";
import { templateIdSchema } from "@/lib/validators";

describe("variantes du modèle", () => {
  it("acceptent chaque style, dont ceux des CV créés avant", () => {
    for (const id of ["executive", "modern", "classic", "minimalist", "elegant"]) {
      expect(templateIdSchema.safeParse(id).success).toBe(true);
    }
    expect(templateIdSchema.safeParse("inconnu").success).toBe(false);
    expect(VARIANT_IDS).toContain(DEFAULT_VARIANT);
  });

  it("ont chacune leurs styles dans la feuille du modèle (sauf la variante par défaut)", () => {
    const css = readFileSync("components/cv/templates-html/executive-template.module.css", "utf8");
    for (const { id } of VARIANTS) {
      if (id === DEFAULT_VARIANT) continue;
      expect(css).toContain(`.page[data-variant="${id}"]`);
    }
  });
});
