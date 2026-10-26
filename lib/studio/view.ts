/** Where the canvas is looking: content point p is drawn at (x + p.x * zoom, y + p.y * zoom). */
export interface View {
  x: number;
  y: number;
  zoom: number;
}

export interface Size {
  width: number;
  height: number;
}

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Zooms keeping the content point under (px, py), in viewport pixels, in place. */
export function zoomAround(view: View, zoom: number, px: number, py: number): View {
  const next = clampZoom(zoom);
  const ratio = next / view.zoom;
  return { zoom: next, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio };
}

/** The next preset zoom level up (direction 1) or down (-1). */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  const steps = direction === 1 ? ZOOM_STEPS : [...ZOOM_STEPS].reverse();
  return steps.find((step) => (direction === 1 ? step > zoom + 1e-6 : step < zoom - 1e-6)) ?? clampZoom(zoom);
}

/** Shows the whole content, centered, with room above it for the artboard's name. */
export function fitView(viewport: Size, content: Size, padding = 48, labelSpace = 32): View {
  const zoom = clampZoom(
    Math.min(
      (viewport.width - 2 * padding) / content.width,
      (viewport.height - 2 * padding - labelSpace) / content.height,
      1
    )
  );
  return {
    zoom,
    x: (viewport.width - content.width * zoom) / 2,
    y: padding + labelSpace,
  };
}

/** The view centered horizontally at a given zoom, top of the content in sight. */
export function viewAtZoom(viewport: Size, content: Size, zoom: number, padding = 48, labelSpace = 32): View {
  return { zoom, x: (viewport.width - content.width * zoom) / 2, y: padding + labelSpace };
}
