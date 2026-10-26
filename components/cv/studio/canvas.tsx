"use client";

import { useEffect, useRef, useState } from "react";
import { parseFieldKey, type CvField } from "@/lib/cv/fields";
import { parseSelectionKey, type Selection } from "@/lib/cv/selection";
import { zoomAround, type Size, type View } from "@/lib/studio/view";

export type Tool = "select" | "hand";

/** A4 at 96 dpi, and the print margins of later pages (12mm, see the print page). */
export const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PRINT_MARGIN = 45;

const SELECTION_COLOR = "#0d99ff";

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

interface CanvasProps {
  view: View;
  /** False until the window size is known: the page is not drawn at a wrong place meanwhile */
  ready: boolean;
  onViewChange: (view: View) => void;
  onViewportResize: (size: Size) => void;
  onPageResize: (size: Size) => void;
  tool: Tool;
  /** Space held: drag pans whatever the tool */
  spacePanning: boolean;
  selectedKey: string | null;
  onSelect: (selection: Selection) => void;
  /** Double-click on a piece of text: edit it in place, caret where clicked */
  onStartEditing: (field: CvField, point: { x: number; y: number }) => void;
  title: string;
  children: React.ReactNode;
}

/** The workspace: one artboard holding the CV page, panned and zoomed freely. */
export function Canvas({
  view,
  ready,
  onViewChange,
  onViewportResize,
  onPageResize,
  tool,
  spacePanning,
  selectedKey,
  onSelect,
  onStartEditing,
  title,
  children,
}: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Height of the CV itself: the artboard below is at least one A4 page
  const [contentHeight, setContentHeight] = useState(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pan, setPan] = useState<{ pointerX: number; pointerY: number; view: View } | null>(null);

  // The wheel listener is attached once: it reads the latest props from here
  const latest = useRef({ view, onViewChange });
  useEffect(() => {
    latest.current = { view, onViewChange };
  });

  useEffect(() => {
    const viewport = viewportRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // no browser zoom or page scroll
      const { view, onViewChange } = latest.current;
      if (e.ctrlKey || e.metaKey) {
        // Pinch on a trackpad arrives as ctrl + wheel
        const rect = viewport.getBoundingClientRect();
        onViewChange(zoomAround(view, view.zoom * Math.exp(-e.deltaY * 0.01), e.clientX - rect.left, e.clientY - rect.top));
      } else {
        const [dx, dy] = e.shiftKey ? [e.deltaY, e.deltaX] : [e.deltaX, e.deltaY];
        onViewChange({ ...view, x: view.x - dx, y: view.y - dy });
      }
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });

    const resize = new ResizeObserver(([entry]) =>
      onViewportResize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    resize.observe(viewport);
    return () => {
      viewport.removeEventListener("wheel", onWheel);
      resize.disconnect();
    };
  }, [onViewportResize]);

  useEffect(() => {
    const resize = new ResizeObserver(([entry]) => {
      setContentHeight(entry.contentRect.height);
      onPageResize({ width: PAGE_WIDTH, height: Math.max(PAGE_HEIGHT, entry.contentRect.height) });
    });
    resize.observe(contentRef.current!);
    return () => resize.disconnect();
  }, [onPageResize]);

  const panMode = tool === "hand" || spacePanning;

  function selectableAt(target: EventTarget | null): string | null {
    const element = (target as HTMLElement | null)?.closest?.("[data-select]");
    return element && pageRef.current?.contains(element) ? element.getAttribute("data-select") : null;
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (panMode || e.button === 1) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setPan({ pointerX: e.clientX, pointerY: e.clientY, view });
      return;
    }
    if (e.button !== 0) return;
    // Clicks in the text being typed move the caret
    if ((e.target as HTMLElement).closest("[data-editing]")) return;
    const key = selectableAt(e.target);
    onSelect((key && parseSelectionKey(key)) || { kind: "document" });
  }

  function handleDoubleClick(e: React.MouseEvent) {
    if (panMode) return;
    const element = (e.target as HTMLElement).closest("[data-field]");
    if (!element || !pageRef.current?.contains(element) || element.hasAttribute("data-editing")) return;
    const field = parseFieldKey(element.getAttribute("data-field")!);
    if (field) onStartEditing(field, { x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (pan) {
      onViewChange({
        ...pan.view,
        x: pan.view.x + e.clientX - pan.pointerX,
        y: pan.view.y + e.clientY - pan.pointerY,
      });
      return;
    }
    setHoveredKey(panMode ? null : selectableAt(e.target));
  }

  const breaks = pageBreaks(contentHeight);
  const cursor = pan ? "grabbing" : panMode ? "grab" : "default";

  return (
    <div
      ref={viewportRef}
      className="relative flex-1 overflow-hidden bg-[#1e1e1e] select-none"
      style={{ cursor, touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onDoubleClick={handleDoubleClick}
      onPointerUp={() => setPan(null)}
      onPointerCancel={() => setPan(null)}
      onPointerLeave={() => setHoveredKey(null)}
      // Links on the CV (email, LinkedIn…) must not navigate while editing
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("a")) e.preventDefault();
      }}
      data-testid="studio-canvas"
    >
      <style>{outlineCss(selectedKey, hoveredKey)}</style>
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          transformOrigin: "0 0",
          visibility: ready ? "visible" : "hidden",
          ["--zoom" as string]: view.zoom,
        }}
      >
        {/* Artboard name, kept at the same size on screen whatever the zoom */}
        <div
          className="absolute bottom-full left-0 flex items-center gap-2 whitespace-nowrap pb-2 text-[13px] text-gray-400"
          style={{ transform: `scale(${1 / view.zoom})`, transformOrigin: "0 100%" }}
        >
          <span>{title}</span>
          {breaks.length > 0 && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px] text-amber-300">
              {breaks.length + 1} pages
            </span>
          )}
        </div>

        <div
          ref={pageRef}
          className="relative bg-white shadow-[0_2px_24px_rgba(0,0,0,0.5)]"
          style={{ width: PAGE_WIDTH, minHeight: PAGE_HEIGHT }}
        >
          <div ref={contentRef}>{children}</div>
          {breaks.map((top, i) => (
            <div
              key={top}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-red-400"
              style={{ top, borderTopWidth: `calc(1px / var(--zoom))` }}
            >
              <span
                className="absolute right-full mr-2 -translate-y-1/2 whitespace-nowrap text-red-300"
                style={{ fontSize: `calc(11px / var(--zoom))` }}
              >
                ≈ page {i + 2}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Outlines are drawn by CSS on the CV's own elements: nothing to measure or keep in sync. */
function outlineCss(selectedKey: string | null, hoveredKey: string | null): string {
  const rules: string[] = [
    // Empty slots of the studio: visible, but plainly not part of the CV
    "[data-placeholder] { opacity: 0.45; font-style: italic; }",
    `[data-editing] { outline: calc(1px / var(--zoom)) solid ${SELECTION_COLOR}; outline-offset: calc(1px / var(--zoom)); }`,
  ];
  if (hoveredKey && hoveredKey !== selectedKey) {
    rules.push(
      `[data-select="${escapeAttribute(hoveredKey)}"] { outline: calc(1px / var(--zoom)) solid ${SELECTION_COLOR}; outline-offset: calc(2px / var(--zoom)); }`
    );
  }
  if (selectedKey) {
    rules.push(
      `[data-select="${escapeAttribute(selectedKey)}"] { outline: calc(2px / var(--zoom)) solid ${SELECTION_COLOR}; outline-offset: calc(2px / var(--zoom)); }`
    );
  }
  return rules.join("\n");
}

function escapeAttribute(value: string): string {
  return value.replace(/["\\]/g, "\\$&").replace(/[\n<]/g, " ");
}
