import { parseCustomSectionId } from "@/lib/cv/layout";
import type { CvData, SectionId } from "@/types/cv";

/** Sections whose entries can be selected one by one. */
export type ItemSection = "experience" | "education" | "projects" | "skills";

/** What the studio's inspector edits. */
export type Selection =
  | { kind: "document" }
  | { kind: "header" }
  /** The cover letter, as a whole */
  | { kind: "letter" }
  | { kind: "section"; section: SectionId }
  /** `id` is the entry's id; for skills, the category name */
  | { kind: "item"; section: ItemSection; id: string };

const ITEM_SECTIONS: ItemSection[] = ["experience", "education", "projects", "skills"];

/** Written on the template's elements as data-select, so a click finds what it hit. */
export function selectionKey(selection: Selection): string {
  switch (selection.kind) {
    case "document":
    case "header":
    case "letter":
      return selection.kind;
    case "section":
      return `section:${selection.section}`;
    case "item":
      return `item:${selection.section}:${selection.id}`;
  }
}

export function parseSelectionKey(key: string): Selection | null {
  if (key === "document" || key === "header" || key === "letter") return { kind: key };
  if (key.startsWith("section:")) return { kind: "section", section: key.slice("section:".length) as SectionId };
  if (key.startsWith("item:")) {
    const rest = key.slice("item:".length);
    const separator = rest.indexOf(":");
    const section = rest.slice(0, separator) as ItemSection;
    if (separator > 0 && ITEM_SECTIONS.includes(section)) {
      return { kind: "item", section, id: rest.slice(separator + 1) };
    }
  }
  return null;
}

/** The selection, or what contains it when it was deleted (an entry falls back to its section). */
export function resolveSelection(data: CvData, selection: Selection): Selection {
  if (selection.kind === "item") {
    const exists = {
      experience: () => data.experience.some((e) => e.id === selection.id),
      education: () => data.education.some((e) => e.id === selection.id),
      projects: () => data.projects.some((p) => p.id === selection.id),
      skills: () => selection.id in data.skills,
    }[selection.section]();
    return exists ? selection : { kind: "section", section: selection.section };
  }
  if (selection.kind === "section") {
    const customId = parseCustomSectionId(selection.section);
    if (customId && !data.customSections?.some((s) => s.id === customId)) return { kind: "document" };
  }
  return selection;
}

export const SECTION_TITLES: Record<Exclude<SectionId, `custom:${string}`>, string> = {
  summary: "Profil",
  experience: "Expérience professionnelle",
  projects: "Projets",
  skills: "Compétences techniques",
  education: "Formation",
  interests: "Centres d'intérêt",
};

export function sectionTitle(data: CvData, section: SectionId): string {
  const customId = parseCustomSectionId(section);
  if (!customId) return SECTION_TITLES[section as keyof typeof SECTION_TITLES];
  return data.customSections?.find((s) => s.id === customId)?.title || "Section sans titre";
}
