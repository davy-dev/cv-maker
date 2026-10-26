import { resolveLayout } from "@/lib/cv/layout";
import type { CvAction } from "@/lib/cv/reducer";
import type { Selection } from "@/lib/cv/selection";
import type { CvColumn, CvData } from "@/types/cv";

export type Direction = "up" | "down" | "left" | "right";

/**
 * Moves the selection one step with the keyboard (Alt + arrows), the
 * accessible counterpart of dragging: up and down within its list, and a
 * section left or right to the other column. Null when it cannot go further.
 */
export function nudgeAction(data: CvData, selection: Selection, direction: Direction): CvAction | null {
  if (selection.kind === "section") {
    const layout = resolveLayout(data);
    const column: CvColumn = layout.main.includes(selection.section) ? "main" : "aside";
    const list = layout[column];
    const index = list.indexOf(selection.section);
    if (direction === "left" || direction === "right") {
      const target: CvColumn = direction === "left" ? "main" : "aside";
      if (target === column) return null;
      return { type: "MOVE_SECTION", section: selection.section, column: target, before: layout[target][index] ?? null };
    }
    const before = neighbourBefore(list, index, direction);
    return before === undefined ? null : { type: "MOVE_SECTION", section: selection.section, column, before };
  }

  if (selection.kind === "item" && (direction === "up" || direction === "down")) {
    const ids =
      selection.section === "skills"
        ? Object.keys(data.skills)
        : { experience: data.experience, education: data.education, projects: data.projects }[selection.section].map(
            (e) => e.id
          );
    const before = neighbourBefore(ids, ids.indexOf(selection.id), direction);
    return before === undefined ? null : { type: "MOVE_ITEM", section: selection.section, id: selection.id, before };
  }

  return null;
}

/** What to land in front of to move one step; undefined at the edge of the list. */
function neighbourBefore<T>(list: T[], index: number, direction: "up" | "down"): T | null | undefined {
  if (index < 0) return undefined;
  if (direction === "up") return index === 0 ? undefined : list[index - 1];
  if (index === list.length - 1) return undefined;
  return list[index + 2] ?? null;
}
