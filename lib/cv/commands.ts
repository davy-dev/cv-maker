import { customSectionId, parseCustomSectionId } from "@/lib/cv/layout";
import type { CvAction } from "@/lib/cv/reducer";
import type { Selection } from "@/lib/cv/selection";
import type { CvData } from "@/types/cv";

/**
 * Delete key on the selection: removes an entry or a custom section. The CV's
 * own sections, the header and the document are hidden or emptied, never deleted.
 */
export function deleteAction(data: CvData, selection: Selection): CvAction | null {
  if (selection.kind === "section") {
    const customId = parseCustomSectionId(selection.section);
    return customId ? { type: "REMOVE_CUSTOM_SECTION", id: customId } : null;
  }
  if (selection.kind !== "item") return null;

  switch (selection.section) {
    case "experience": {
      const index = data.experience.findIndex((e) => e.id === selection.id);
      return index < 0 ? null : { type: "REMOVE_EXPERIENCE", index };
    }
    case "education": {
      const index = data.education.findIndex((e) => e.id === selection.id);
      return index < 0 ? null : { type: "REMOVE_EDUCATION", index };
    }
    case "projects": {
      const index = data.projects.findIndex((p) => p.id === selection.id);
      return index < 0 ? null : { type: "REMOVE_PROJECT", index };
    }
    case "skills":
      return selection.id in data.skills ? { type: "REMOVE_SKILL_CATEGORY", category: selection.id } : null;
  }
}

/** ⌘D on the selection: the copy's action, and the copy to select next. */
export function duplicateAction(
  data: CvData,
  selection: Selection,
  newId: string
): { action: CvAction; select: Selection } | null {
  if (selection.kind === "section") {
    const customId = parseCustomSectionId(selection.section);
    if (!customId || !data.customSections?.some((s) => s.id === customId)) return null;
    return {
      action: { type: "DUPLICATE_CUSTOM_SECTION", id: customId, newId },
      select: { kind: "section", section: customSectionId(newId) },
    };
  }
  if (selection.kind !== "item") return null;

  if (selection.section === "skills") {
    if (!(selection.id in data.skills)) return null;
    const name = copyName(selection.id, Object.keys(data.skills));
    return {
      action: { type: "DUPLICATE_ITEM", section: "skills", id: selection.id, newId: name },
      select: { kind: "item", section: "skills", id: name },
    };
  }
  const list = { experience: data.experience, education: data.education, projects: data.projects }[selection.section];
  if (!list.some((e) => e.id === selection.id)) return null;
  return {
    action: { type: "DUPLICATE_ITEM", section: selection.section, id: selection.id, newId },
    select: { kind: "item", section: selection.section, id: newId },
  };
}

/** "Outils (copie)", then "Outils (copie 2)"… whichever is free. */
function copyName(name: string, taken: string[]): string {
  let candidate = `${name} (copie)`;
  for (let n = 2; taken.includes(candidate); n++) candidate = `${name} (copie ${n})`;
  return candidate;
}
