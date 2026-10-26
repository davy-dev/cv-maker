/** A4 at 96 dpi, as the HTML templates are drawn and printed. */
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;
/** Margin of later printed pages, top and bottom (12mm, see the print page) */
const PRINT_MARGIN = 45;

/**
 * Where pages roughly break when printed: the first page keeps a bottom margin,
 * later ones a margin on both sides. Approximate: blocks are never split.
 */
export function pageBreaks(contentHeight: number): number[] {
  const breaks: number[] = [];
  let next = PAGE_HEIGHT - PRINT_MARGIN;
  while (next < contentHeight) {
    breaks.push(next);
    next += PAGE_HEIGHT - 2 * PRINT_MARGIN;
  }
  return breaks;
}
