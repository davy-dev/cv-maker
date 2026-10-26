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

/** Moves a section to `index` in `column` (clamped), wherever it was before. */
export function moveSection(layout: CvLayout, section: SectionId, column: CvColumn, index: number): CvLayout {
  const without: CvLayout = {
    main: layout.main.filter((id) => id !== section),
    aside: layout.aside.filter((id) => id !== section),
  };
  const target = [...without[column]];
  target.splice(Math.max(0, Math.min(index, target.length)), 0, section);
  return { ...without, [column]: target };
}
