import type { BuiltInSectionId, CustomSectionId, CvColumn, CvData, CvLayout, SectionId } from "@/types/cv";

export const DEFAULT_LAYOUT: CvLayout = {
  main: ["summary", "experience", "projects"],
  aside: ["skills", "education", "interests"],
};

const BUILT_IN_SECTIONS: BuiltInSectionId[] = [...DEFAULT_LAYOUT.main, ...DEFAULT_LAYOUT.aside] as BuiltInSectionId[];

export function customSectionId(id: string): CustomSectionId {
  return `custom:${id}`;
}

/** The custom section's own id, or null for a built-in section. */
export function parseCustomSectionId(section: SectionId): string | null {
  return section.startsWith("custom:") ? section.slice("custom:".length) : null;
}

/**
 * The layout to draw: the stored one (or the default) with deleted custom
 * sections dropped, duplicates removed, and every section placed exactly once.
 * A section missing from it goes to its default column; custom ones to the side.
 */
export function resolveLayout(data: CvData): CvLayout {
  const known = new Set<SectionId>([
    ...BUILT_IN_SECTIONS,
    ...(data.customSections ?? []).map((s) => customSectionId(s.id)),
  ]);
  const placed = new Set<SectionId>();
  const keep = (sections: unknown): SectionId[] =>
    (Array.isArray(sections) ? sections : []).filter((id: SectionId) => {
      if (!known.has(id) || placed.has(id)) return false;
      placed.add(id);
      return true;
    });

  const stored = data.layout ?? DEFAULT_LAYOUT;
  const layout: CvLayout = { main: keep(stored.main), aside: keep(stored.aside) };
  for (const id of known) {
    if (!placed.has(id)) layout[DEFAULT_LAYOUT.main.includes(id) ? "main" : "aside"].push(id);
  }
  return layout;
}

/**
 * Moves a section into `column`, just before `before` (at the end when null),
 * wherever it was. Expressed relative to a neighbour rather than as an index,
 * so sections absent from the page (empty, hidden) do not shift the target.
 */
export function moveSection(layout: CvLayout, section: SectionId, column: CvColumn, before: SectionId | null): CvLayout {
  if (section === before) return layout;
  const without: CvLayout = {
    main: layout.main.filter((id) => id !== section),
    aside: layout.aside.filter((id) => id !== section),
  };
  return { ...without, [column]: insertBefore(without[column], section, before) };
}

/** Inserts `item` before `before` in a list that does not hold it; at the end when `before` is null or absent. */
export function insertBefore<T>(list: T[], item: T, before: T | null): T[] {
  const index = before === null ? -1 : list.indexOf(before);
  const result = [...list];
  result.splice(index < 0 ? result.length : index, 0, item);
  return result;
}
