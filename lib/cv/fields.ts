import type { LetterField } from "@/lib/cv/letter";
import type { CvAction } from "@/lib/cv/reducer";
import type { CvData } from "@/types/cv";

type HeaderTextField = "name" | "title" | "email" | "phone" | "location" | "linkedin" | "github" | "website";

/**
 * One piece of text on the CV, editable on the page. Entries are addressed by
 * id, so an address stays valid while other entries are added or removed.
 */
export type CvField =
  | { kind: "header"; field: HeaderTextField }
  | { kind: "yearsExperience" }
  | { kind: "summary" }
  | { kind: "experience"; id: string; field: "position" | "company" | "location" | "startDate" | "endDate" }
  | { kind: "experienceBullet"; id: string; index: number }
  | { kind: "education"; id: string; field: "degree" | "field" | "institution" | "startDate" | "endDate" | "description" }
  | { kind: "project"; id: string; field: "name" | "role" | "description" | "impact" }
  | { kind: "projectHighlight"; id: string; index: number }
  | { kind: "skillCategory"; category: string }
  | { kind: "skillList"; category: string }
  | { kind: "interest"; index: number }
  | { kind: "customTitle"; id: string }
  | { kind: "customLine"; id: string; index: number };

/** Any text editable on the studio's pages: the CV's, or the cover letter's. */
export type EditableField = CvField | LetterField;

/** Written on the page as data-field, so a double-click finds what to edit. */
export function fieldKey(field: EditableField): string {
  return JSON.stringify(field);
}

export function parseFieldKey(key: string): EditableField | null {
  try {
    const field = JSON.parse(key);
    return field && typeof field.kind === "string" ? field : null;
  } catch {
    return null;
  }
}

/**
 * Whether each keystroke goes to the CV. Renaming a skill category changes its
 * address, and a skill list is split on commas: both are written once, when done.
 */
export function isLiveField(field: EditableField): boolean {
  return field.kind !== "skillCategory" && field.kind !== "skillList";
}

const experienceIndex = (data: CvData, id: string) => data.experience.findIndex((e) => e.id === id);
const educationIndex = (data: CvData, id: string) => data.education.findIndex((e) => e.id === id);
const projectIndex = (data: CvData, id: string) => data.projects.findIndex((p) => p.id === id);
const customSection = (data: CvData, id: string) => data.customSections?.find((s) => s.id === id);
const customLines = (data: CvData, id: string) => (customSection(data, id)?.content ?? "").split("\n");

/** The text as stored, **bold** markers included; "" when the entry no longer exists. */
export function readField(data: CvData, field: CvField): string {
  switch (field.kind) {
    case "header":
      return data.header[field.field] ?? "";
    case "yearsExperience":
      return data.yearsExperience;
    case "summary":
      return data.summary;
    case "experience":
      return data.experience.find((e) => e.id === field.id)?.[field.field] ?? "";
    case "experienceBullet":
      return data.experience.find((e) => e.id === field.id)?.bullets[field.index] ?? "";
    case "education":
      return data.education.find((e) => e.id === field.id)?.[field.field] ?? "";
    case "project":
      return data.projects.find((p) => p.id === field.id)?.[field.field] ?? "";
    case "projectHighlight":
      return data.projects.find((p) => p.id === field.id)?.highlights[field.index] ?? "";
    case "skillCategory":
      return field.category;
    case "skillList":
      return (data.skills[field.category] ?? []).join(", ");
    case "interest":
      return data.interests[field.index] ?? "";
    case "customTitle":
      return customSection(data, field.id)?.title ?? "";
    case "customLine":
      return customLines(data, field.id)[field.index] ?? "";
  }
}

/** The action writing `value` into the field, or null when there is nothing valid to write. */
export function writeField(data: CvData, field: CvField, value: string): CvAction | null {
  switch (field.kind) {
    case "header": {
      const optional = field.field === "linkedin" || field.field === "github" || field.field === "website";
      return { type: "SET_HEADER_FIELD", field: field.field, value: optional && !value ? null : value };
    }
    case "yearsExperience":
      return { type: "SET_YEARS_EXPERIENCE", value };
    case "summary":
      return { type: "SET_SUMMARY", value };
    case "experience": {
      const index = experienceIndex(data, field.id);
      return index < 0 ? null : { type: "SET_EXPERIENCE_FIELD", index, field: field.field, value };
    }
    case "experienceBullet": {
      const expIndex = experienceIndex(data, field.id);
      return expIndex < 0 ? null : { type: "SET_EXPERIENCE_BULLET", expIndex, bulletIndex: field.index, value };
    }
    case "education": {
      const index = educationIndex(data, field.id);
      return index < 0 ? null : { type: "SET_EDUCATION_FIELD", index, field: field.field, value };
    }
    case "project": {
      const index = projectIndex(data, field.id);
      return index < 0 ? null : { type: "SET_PROJECT_FIELD", index, field: field.field, value };
    }
    case "projectHighlight": {
      const index = projectIndex(data, field.id);
      return index < 0
        ? null
        : { type: "SET_PROJECT_HIGHLIGHT", projectIndex: index, highlightIndex: field.index, value };
    }
    case "skillCategory": {
      const name = value.trim();
      // An empty name or one already used would merge or lose a category
      if (!name || name === field.category || name in data.skills) return null;
      return { type: "SET_SKILL_CATEGORY", oldCategory: field.category, newCategory: name };
    }
    case "skillList":
      return {
        type: "SET_SKILLS",
        category: field.category,
        skills: value.split(",").map((s) => s.trim()).filter(Boolean),
      };
    case "interest":
      return { type: "SET_INTEREST", index: field.index, value };
    case "customTitle":
      return customSection(data, field.id)
        ? { type: "SET_CUSTOM_SECTION_FIELD", id: field.id, field: "title", value }
        : null;
    case "customLine": {
      if (!customSection(data, field.id)) return null;
      const lines = customLines(data, field.id);
      lines[field.index] = value;
      return { type: "SET_CUSTOM_SECTION_FIELD", id: field.id, field: "content", value: lines.join("\n") };
    }
  }
}

/** For entries of a list (bullets, lines…): adds an empty one after, to type into next. */
export function insertAfter(data: CvData, field: CvField): { action: CvAction; next: CvField } | null {
  switch (field.kind) {
    case "experienceBullet": {
      const expIndex = experienceIndex(data, field.id);
      if (expIndex < 0) return null;
      return {
        action: { type: "INSERT_EXPERIENCE_BULLET", expIndex, bulletIndex: field.index + 1 },
        next: { ...field, index: field.index + 1 },
      };
    }
    case "projectHighlight": {
      const index = projectIndex(data, field.id);
      if (index < 0) return null;
      return {
        action: { type: "INSERT_PROJECT_HIGHLIGHT", projectIndex: index, highlightIndex: field.index + 1 },
        next: { ...field, index: field.index + 1 },
      };
    }
    case "interest":
      return { action: { type: "INSERT_INTEREST", index: field.index + 1 }, next: { ...field, index: field.index + 1 } };
    case "customLine": {
      if (!customSection(data, field.id)) return null;
      const lines = customLines(data, field.id);
      lines.splice(field.index + 1, 0, "");
      return {
        action: { type: "SET_CUSTOM_SECTION_FIELD", id: field.id, field: "content", value: lines.join("\n") },
        next: { ...field, index: field.index + 1 },
      };
    }
    default:
      return null;
  }
}

/** For entries of a list: removes this one; `previous` is where to keep typing, if any. */
export function removeEntry(data: CvData, field: CvField): { action: CvAction; previous: CvField | null } | null {
  const previous = (f: CvField & { index: number }) => (f.index > 0 ? { ...f, index: f.index - 1 } : null);
  switch (field.kind) {
    case "experienceBullet": {
      const expIndex = experienceIndex(data, field.id);
      if (expIndex < 0) return null;
      return {
        action: { type: "REMOVE_EXPERIENCE_BULLET", expIndex, bulletIndex: field.index },
        previous: previous(field),
      };
    }
    case "projectHighlight": {
      const index = projectIndex(data, field.id);
      if (index < 0) return null;
      return {
        action: { type: "REMOVE_PROJECT_HIGHLIGHT", projectIndex: index, highlightIndex: field.index },
        previous: previous(field),
      };
    }
    case "interest":
      return { action: { type: "REMOVE_INTEREST", index: field.index }, previous: previous(field) };
    case "customLine": {
      const lines = customLines(data, field.id);
      // The last line of a section stays, empty: removing it is removing the section
      if (!customSection(data, field.id) || lines.length <= 1) return null;
      lines.splice(field.index, 1);
      return {
        action: { type: "SET_CUSTOM_SECTION_FIELD", id: field.id, field: "content", value: lines.join("\n") },
        previous: previous(field),
      };
    }
    default:
      return null;
  }
}
