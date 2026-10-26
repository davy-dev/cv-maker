import { describe, it, expect } from "vitest";
import {
  fieldKey,
  insertAfter,
  isLiveField,
  parseFieldKey,
  readField,
  removeEntry,
  writeField,
  type CvField,
} from "@/lib/cv/fields";
import { cvReducer, type CvAction } from "@/lib/cv/reducer";
import { buildCvData } from "../helpers/fixtures";
import type { CvData } from "@/types/cv";

const project = {
  id: "p1",
  name: "CV Maker",
  description: "",
  technologies: [],
  url: null,
  type: "personal" as const,
  role: "",
  impact: "",
  highlights: ["Premier", "Second"],
  motivation: "",
  links: [],
  linkedExperienceId: null,
  displayMode: "projects-section" as const,
};

function cv(): CvData {
  return buildCvData({
    experience: [
      { id: "e1", company: "Acme", position: "Dev", location: "Lyon", startDate: "2020", endDate: "2022", bullets: ["A", "B"] },
      { id: "e2", company: "Globex", position: "Lead", location: "", startDate: "", endDate: "", bullets: [] },
    ],
    projects: [project],
    skills: { Langages: ["TypeScript", "SQL"], Outils: ["Git"] },
    interests: ["Piano"],
    customSections: [{ id: "c1", title: "Langues", content: "Anglais\nEspagnol" }],
  });
}

/** Writes through the reducer, as the studio does. */
function write(data: CvData, field: CvField, value: string): CvData {
  const action = writeField(data, field, value);
  return action ? cvReducer(data, action) : data;
}

function apply(data: CvData, action: CvAction | undefined): CvData {
  return action ? cvReducer(data, action) : data;
}

describe("adresses des champs", () => {
  it("aller-retour entre un champ et sa clé", () => {
    const field: CvField = { kind: "experienceBullet", id: "e1", index: 2 };
    expect(parseFieldKey(fieldKey(field))).toEqual(field);
    expect(parseFieldKey("pas du json")).toBeNull();
    expect(parseFieldKey("{}")).toBeNull();
  });
});

describe("lire et écrire un champ", () => {
  it.each<[CvField, string]>([
    [{ kind: "header", field: "name" }, "Jean Dupont"],
    [{ kind: "yearsExperience" }, "5 ans d'expérience"],
    [{ kind: "experience", id: "e2", field: "position" }, "Lead"],
    [{ kind: "experienceBullet", id: "e1", index: 1 }, "B"],
    [{ kind: "projectHighlight", id: "p1", index: 0 }, "Premier"],
    [{ kind: "skillList", category: "Langages" }, "TypeScript, SQL"],
    [{ kind: "customLine", id: "c1", index: 1 }, "Espagnol"],
    [{ kind: "interest", index: 0 }, "Piano"],
  ])("lit %o", (field, expected) => {
    expect(readField(cv(), field)).toBe(expected);
  });

  it("écrit un champ d'un élément désigné par son id", () => {
    const data = write(cv(), { kind: "experience", id: "e2", field: "company" }, "Initech");
    expect(data.experience.map((e) => e.company)).toEqual(["Acme", "Initech"]);
  });

  it("écrit une puce d'expérience ou de projet, et une ligne de section libre", () => {
    let data = write(cv(), { kind: "experienceBullet", id: "e1", index: 0 }, "**A** modifié");
    data = write(data, { kind: "projectHighlight", id: "p1", index: 1 }, "Deuxième");
    data = write(data, { kind: "customLine", id: "c1", index: 0 }, "Anglais courant");

    expect(data.experience[0].bullets).toEqual(["**A** modifié", "B"]);
    expect(data.projects[0].highlights).toEqual(["Premier", "Deuxième"]);
    expect(data.customSections![0].content).toBe("Anglais courant\nEspagnol");
  });

  it("vide un lien de profil en null", () => {
    const data = write(cv(), { kind: "header", field: "linkedin" }, "");
    expect(data.header.linkedin).toBeNull();
  });

  it("découpe une liste de compétences sur les virgules", () => {
    const data = write(cv(), { kind: "skillList", category: "Langages" }, "TypeScript,  Go , ,SQL");
    expect(data.skills.Langages).toEqual(["TypeScript", "Go", "SQL"]);
  });

  it("renomme une catégorie à sa place, mais jamais vers un nom vide ou déjà pris", () => {
    const renamed = write(cv(), { kind: "skillCategory", category: "Langages" }, " Langues ");
    expect(Object.keys(renamed.skills)).toEqual(["Langues", "Outils"]);

    expect(writeField(cv(), { kind: "skillCategory", category: "Langages" }, "  ")).toBeNull();
    expect(writeField(cv(), { kind: "skillCategory", category: "Langages" }, "Outils")).toBeNull();
  });

  it("n'écrit rien dans un élément supprimé", () => {
    expect(writeField(cv(), { kind: "experience", id: "disparu", field: "company" }, "x")).toBeNull();
    expect(writeField(cv(), { kind: "customLine", id: "disparue", index: 0 }, "x")).toBeNull();
  });

  it("n'écrit les catégories et listes de compétences qu'à la fin de la saisie", () => {
    expect(isLiveField({ kind: "skillCategory", category: "Langages" })).toBe(false);
    expect(isLiveField({ kind: "skillList", category: "Langages" })).toBe(false);
    expect(isLiveField({ kind: "summary" })).toBe(true);
  });
});

describe("Entrée et Retour arrière dans une liste", () => {
  it("insère une puce vide juste après et la désigne", () => {
    const field: CvField = { kind: "experienceBullet", id: "e1", index: 0 };
    const inserted = insertAfter(cv(), field)!;
    const data = apply(cv(), inserted.action);

    expect(data.experience[0].bullets).toEqual(["A", "", "B"]);
    expect(inserted.next).toEqual({ ...field, index: 1 });
  });

  it("insère dans les points clés de projet, les intérêts et les lignes libres", () => {
    expect(apply(cv(), insertAfter(cv(), { kind: "projectHighlight", id: "p1", index: 1 })?.action).projects[0].highlights).toEqual(
      ["Premier", "Second", ""]
    );
    expect(apply(cv(), insertAfter(cv(), { kind: "interest", index: 0 })?.action).interests).toEqual(["Piano", ""]);
    expect(apply(cv(), insertAfter(cv(), { kind: "customLine", id: "c1", index: 0 })?.action).customSections![0].content).toBe(
      "Anglais\n\nEspagnol"
    );
  });

  it("n'insère rien après un champ qui n'est pas dans une liste", () => {
    expect(insertAfter(cv(), { kind: "summary" })).toBeNull();
    expect(removeEntry(cv(), { kind: "header", field: "name" })).toBeNull();
  });

  it("supprime une puce et reprend la saisie à la précédente", () => {
    const removed = removeEntry(cv(), { kind: "experienceBullet", id: "e1", index: 1 })!;
    expect(apply(cv(), removed.action).experience[0].bullets).toEqual(["A"]);
    expect(removed.previous).toEqual({ kind: "experienceBullet", id: "e1", index: 0 });

    expect(removeEntry(cv(), { kind: "experienceBullet", id: "e1", index: 0 })!.previous).toBeNull();
  });

  it("garde la dernière ligne d'une section libre", () => {
    const data = buildCvData({ customSections: [{ id: "c1", title: "Langues", content: "" }] });
    expect(removeEntry(data, { kind: "customLine", id: "c1", index: 0 })).toBeNull();

    const removed = removeEntry(cv(), { kind: "customLine", id: "c1", index: 1 })!;
    expect(apply(cv(), removed.action).customSections![0].content).toBe("Anglais");
  });
});
