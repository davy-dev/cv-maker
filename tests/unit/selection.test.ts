import { describe, it, expect } from "vitest";
import { parseSelectionKey, resolveSelection, sectionTitle, selectionKey, type Selection } from "@/lib/cv/selection";
import { buildCvData } from "../helpers/fixtures";

describe("clés de sélection", () => {
  it.each<Selection>([
    { kind: "document" },
    { kind: "header" },
    { kind: "section", section: "experience" },
    { kind: "section", section: "custom:abc" },
    { kind: "item", section: "experience", id: "exp1" },
    { kind: "item", section: "skills", id: "Outils : CI/CD" },
  ])("aller-retour pour %o", (selection) => {
    expect(parseSelectionKey(selectionKey(selection))).toEqual(selection);
  });

  it("refuse une clé inconnue", () => {
    expect(parseSelectionKey("item:interests:0")).toBeNull();
    expect(parseSelectionKey("n'importe quoi")).toBeNull();
  });
});

describe("resolveSelection", () => {
  const data = buildCvData({ customSections: [{ id: "l1", title: "Langues", content: "" }] });

  it("garde une sélection qui existe", () => {
    const selection: Selection = { kind: "item", section: "experience", id: "exp1" };
    expect(resolveSelection(data, selection)).toBe(selection);
  });

  it("revient à la section quand l'élément a été supprimé", () => {
    expect(resolveSelection(data, { kind: "item", section: "projects", id: "disparu" })).toEqual({
      kind: "section",
      section: "projects",
    });
    expect(resolveSelection(data, { kind: "item", section: "skills", id: "Outils" })).toEqual({
      kind: "section",
      section: "skills",
    });
  });

  it("revient au document quand la section libre a été supprimée", () => {
    expect(resolveSelection(data, { kind: "section", section: "custom:l1" }).kind).toBe("section");
    expect(resolveSelection(data, { kind: "section", section: "custom:autre" })).toEqual({ kind: "document" });
  });
});

describe("sectionTitle", () => {
  it("nomme les sections du CV et les sections libres", () => {
    const data = buildCvData({ customSections: [{ id: "l1", title: "Langues", content: "" }, { id: "l2", title: "", content: "" }] });
    expect(sectionTitle(data, "experience")).toBe("Expérience professionnelle");
    expect(sectionTitle(data, "custom:l1")).toBe("Langues");
    expect(sectionTitle(data, "custom:l2")).toBe("Section sans titre");
  });
});
