import { parseFieldKey } from "@/lib/cv/fields";
import type { CvAction } from "@/lib/cv/reducer";
import { parseSelectionKey, type ItemSection } from "@/lib/cv/selection";
import type { CvColumn, SectionId } from "@/types/cv";

/**
 * Dragging on the page relies on what the template already marks:
 * data-select on sections and entries, data-field on the text of each point.
 */
export type DragSource =
  | { kind: "section"; section: SectionId; element: HTMLElement }
  | { kind: "item"; section: ItemSection; id: string; element: HTMLElement }
  | { kind: "bullet"; list: "experience" | "project"; id: string; index: number; element: HTMLElement };

export interface DropTarget {
  action: CvAction;
  /** Where to draw the insertion line, in page coordinates (unzoomed) */
  line: { top: number; left: number; width: number };
}

/** The most precise thing under the pointer that can be moved: a point, an entry, then a section. */
export function findDragSource(target: Element, page: HTMLElement): DragSource | null {
  const li = target.closest("li");
  const pointField = li && page.contains(li) ? li.querySelector("[data-field]")?.getAttribute("data-field") : null;
  const field = pointField ? parseFieldKey(pointField) : null;
  if (li && field && (field.kind === "experienceBullet" || field.kind === "projectHighlight")) {
    return {
      kind: "bullet",
      list: field.kind === "experienceBullet" ? "experience" : "project",
      id: field.id,
      index: field.index,
      element: li,
    };
  }

  for (const prefix of ["item:", "section:"]) {
    const element = target.closest<HTMLElement>(`[data-select^="${prefix}"]`);
    const selection = element && page.contains(element) ? parseSelectionKey(element.dataset.select!) : null;
    if (selection?.kind === "item") return { kind: "item", section: selection.section, id: selection.id, element: element! };
    if (selection?.kind === "section") return { kind: "section", section: selection.section, element: element! };
  }
  return null;
}

/** Where the dragged thing would land if dropped at this point, and the move it means. */
export function findDropTarget(source: DragSource, page: HTMLElement, x: number, y: number, zoom: number): DropTarget | null {
  const pageRect = page.getBoundingClientRect();
  const toPage = (container: Element, top: number) => {
    const rect = container.getBoundingClientRect();
    return { top: (top - pageRect.top) / zoom, left: (rect.left - pageRect.left) / zoom, width: rect.width / zoom };
  };

  if (source.kind === "bullet") {
    // Points move within their own list
    const list = source.element.parentElement!;
    const slot = slotAt([...list.children] as HTMLElement[], y);
    const indexOf = (li: HTMLElement) => parseFieldKey(li.querySelector("[data-field]")?.getAttribute("data-field") ?? "");
    const beforeField = slot.before ? indexOf(slot.before) : null;
    const lastField = indexOf(list.lastElementChild as HTMLElement);
    const before =
      beforeField && "index" in beforeField ? beforeField.index : lastField && "index" in lastField ? lastField.index + 1 : 0;
    return {
      action: { type: "MOVE_BULLET", list: source.list, id: source.id, from: source.index, before },
      line: toPage(list, slot.y),
    };
  }

  if (source.kind === "item") {
    // Entries move within their section
    const container = source.element.parentElement!;
    const siblings = [...container.querySelectorAll<HTMLElement>(`:scope > [data-select^="item:${source.section}:"]`)];
    const slot = slotAt(siblings, y);
    const before = slot.before ? (parseSelectionKey(slot.before.dataset.select!) as { id: string }).id : null;
    return {
      action: { type: "MOVE_ITEM", section: source.section, id: source.id, before },
      line: toPage(container, slot.y),
    };
  }

  // Sections move within or across the two columns: the one nearest the pointer
  const columns = [...page.querySelectorAll<HTMLElement>("main, aside")];
  if (columns.length === 0) return null;
  const column = columns.reduce((nearest, candidate) =>
    distanceX(candidate, x) < distanceX(nearest, x) ? candidate : nearest
  );
  const sections = [...column.querySelectorAll<HTMLElement>(":scope > section[data-select]")];
  const slot = slotAt(sections, y, column);
  const before = slot.before ? (parseSelectionKey(slot.before.dataset.select!) as { section: SectionId }).section : null;
  return {
    action: {
      type: "MOVE_SECTION",
      section: source.section,
      column: (column.tagName === "MAIN" ? "main" : "aside") as CvColumn,
      before,
    },
    line: toPage(column, slot.y),
  };
}

/**
 * The element to land in front of (null: after the last one) for a pointer at
 * height y, and the height of the gap between them, in viewport pixels.
 */
function slotAt(elements: HTMLElement[], y: number, emptyContainer?: HTMLElement): { before: HTMLElement | null; y: number } {
  if (elements.length === 0) {
    return { before: null, y: emptyContainer?.getBoundingClientRect().top ?? y };
  }
  const rects = elements.map((element) => element.getBoundingClientRect());
  const index = rects.findIndex((rect) => y < rect.top + rect.height / 2);
  if (index === -1) return { before: null, y: rects[rects.length - 1].bottom + 2 };
  const gapTop = index > 0 ? rects[index - 1].bottom : rects[index].top - 4;
  return { before: elements[index], y: (gapTop + rects[index].top) / 2 };
}

function distanceX(element: HTMLElement, x: number): number {
  const rect = element.getBoundingClientRect();
  return x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
}
