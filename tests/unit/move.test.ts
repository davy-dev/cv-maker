import { describe, it, expect } from "vitest";
import { nudgeAction } from "@/lib/cv/move";
import { cvReducer, type CvAction } from "@/lib/cv/reducer";
import { buildCvData } from "../helpers/fixtures";
import type { CvData, CvExperience } from "@/types/cv";

const experience = (id: string, bullets: string[] = []): CvExperience => ({
  id,
  company: id,
  position: "Dev",
  location: "",
  startDate: "",
  endDate: "",
  bullets,
});

function cv(): CvData {
  return buildCvData({
    experience: [experience("a", ["1", "2", "3"]), experience("b"), experience("c")],
    skills: { Langages: ["TS"], Outils: ["Git"], Méthodes: ["Agile"] },
  });
}

const apply = (data: CvData, action: CvAction | null) => (action ? cvReducer(data, action) : data);
const ids = (data: CvData) => data.experience.map((e) => e.id);

describe("MOVE_ITEM", () => {
  it("place un élément devant un autre, ou à la fin", () => {
    expect(ids(apply(cv(), { type: "MOVE_ITEM", section: "experience", id: "c", before: "a" }))).toEqual(["c", "a", "b"]);
    expect(ids(apply(cv(), { type: "MOVE_ITEM", section: "experience", id: "a", before: null }))).toEqual(["b", "c", "a"]);
    expect(ids(apply(cv(), { type: "MOVE_ITEM", section: "experience", id: "a", before: "c" }))).toEqual(["b", "a", "c"]);
  });

  it("ne change rien pour un élément déposé devant lui-même ou inconnu", () => {
    const data = cv();
    expect(apply(data, { type: "MOVE_ITEM", section: "experience", id: "a", before: "a" })).toBe(data);
    expect(ids(apply(data, { type: "MOVE_ITEM", section: "experience", id: "zz", before: "a" }))).toEqual(["a", "b", "c"]);
  });

  it("réordonne les catégories de compétences", () => {
    const data = apply(cv(), { type: "MOVE_ITEM", section: "skills", id: "Méthodes", before: "Langages" });
    expect(Object.keys(data.skills)).toEqual(["Méthodes", "Langages", "Outils"]);
    expect(data.skills.Méthodes).toEqual(["Agile"]);
  });
});

describe("MOVE_BULLET", () => {
  const move = (from: number, before: number) =>
    apply(cv(), { type: "MOVE_BULLET", list: "experience", id: "a", from, before }).experience[0].bullets;

  it("déplace une puce vers le haut ou le bas", () => {
    expect(move(2, 0)).toEqual(["3", "1", "2"]);
    expect(move(0, 3)).toEqual(["2", "3", "1"]);
    expect(move(0, 2)).toEqual(["2", "1", "3"]);
  });

  it("ne change rien quand la puce reste à sa place", () => {
    const data = cv();
    expect(apply(data, { type: "MOVE_BULLET", list: "experience", id: "a", from: 1, before: 1 })).toBe(data);
    expect(apply(data, { type: "MOVE_BULLET", list: "experience", id: "a", from: 1, before: 2 })).toBe(data);
  });
});

describe("nudgeAction (Alt + flèches)", () => {
  it("monte et descend un élément, sans dépasser les bords", () => {
    const item = (id: string) => ({ kind: "item" as const, section: "experience" as const, id });
    expect(ids(apply(cv(), nudgeAction(cv(), item("b"), "up")))).toEqual(["b", "a", "c"]);
    expect(ids(apply(cv(), nudgeAction(cv(), item("b"), "down")))).toEqual(["a", "c", "b"]);
    expect(ids(apply(cv(), nudgeAction(cv(), item("a"), "down")))).toEqual(["b", "a", "c"]);
    expect(nudgeAction(cv(), item("a"), "up")).toBeNull();
    expect(nudgeAction(cv(), item("c"), "down")).toBeNull();
    expect(nudgeAction(cv(), item("a"), "left")).toBeNull();
  });

  it("déplace une section dans sa colonne et vers l'autre colonne", () => {
    const section = (id: "summary" | "skills" | "projects") => ({ kind: "section" as const, section: id });
    expect(apply(cv(), nudgeAction(cv(), section("projects"), "up")).layout!.main).toEqual(["summary", "projects", "experience"]);
    expect(nudgeAction(cv(), section("summary"), "up")).toBeNull();

    // Same height in the other column
    const moved = apply(cv(), nudgeAction(cv(), section("summary"), "right"));
    expect(moved.layout).toEqual({ main: ["experience", "projects"], aside: ["summary", "skills", "education", "interests"] });
    expect(nudgeAction(cv(), section("skills"), "right")).toBeNull();
    expect(apply(cv(), nudgeAction(cv(), section("skills"), "left")).layout!.main).toEqual([
      "skills",
      "summary",
      "experience",
      "projects",
    ]);
  });

  it("ne déplace ni le document ni l'en-tête", () => {
    expect(nudgeAction(cv(), { kind: "document" }, "up")).toBeNull();
    expect(nudgeAction(cv(), { kind: "header" }, "down")).toBeNull();
  });
});
