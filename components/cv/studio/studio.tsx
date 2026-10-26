"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { ExecutiveTemplate } from "@/components/cv/templates-html/executive-template";
import { useCvAutosave } from "@/hooks/use-cv-autosave";
import { cvReducer } from "@/lib/cv/reducer";
import { resolveSelection, selectionKey, type Selection } from "@/lib/cv/selection";
import { applyVisibility } from "@/lib/cv/visibility";
import { fitView, stepZoom, viewAtZoom, zoomAround, type Size, type View } from "@/lib/studio/view";
import type { CvData, GenerationReport } from "@/types/cv";
import { Canvas, PAGE_WIDTH, type Tool } from "./canvas";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { Toolbar } from "./toolbar";

interface StudioProps {
  cvId: string;
  title: string;
  initialData: CvData;
  generationReport: GenerationReport | null;
}

/** Keys typed into a field, or activating a focused control, are not shortcuts. */
function isTypingOrControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName))
  );
}

/** The Figma-like CV editor: layers, the CV on a canvas, and an inspector. */
export function Studio({ cvId, title, initialData, generationReport }: StudioProps) {
  const [data, dispatch] = useReducer(cvReducer, initialData);
  const { status: saveStatus, flush } = useCvAutosave(cvId, data);

  const [rawSelection, setSelection] = useState<Selection>({ kind: "document" });
  // A deleted entry falls back to its section
  const selection = resolveSelection(data, rawSelection);

  const [tool, setTool] = useState<Tool>("select");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [viewport, setViewport] = useState<Size | null>(null);
  const [page, setPage] = useState<Size>({ width: PAGE_WIDTH, height: 1123 });
  // null: fit the page in the window, following its size, until the user zooms or pans
  const [customView, setCustomView] = useState<View | null>(null);
  const view = customView ?? (viewport ? fitView(viewport, page) : { x: 0, y: 0, zoom: 1 });

  const [downloading, setDownloading] = useState(false);

  const center = viewport ? { x: viewport.width / 2, y: viewport.height / 2 } : { x: 0, y: 0 };
  const zoomBy = (direction: 1 | -1) =>
    setCustomView(zoomAround(view, stepZoom(view.zoom, direction), center.x, center.y));
  const zoomReset = () => viewport && setCustomView(viewAtZoom(viewport, page, 1));
  const zoomFit = () => setCustomView(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingOrControl(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(true);
      } else if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomBy(1);
      } else if (mod && e.key === "-") {
        e.preventDefault();
        zoomBy(-1);
      } else if (mod && e.key === "0") {
        e.preventDefault();
        zoomReset();
      } else if (e.shiftKey && e.code === "Digit1") {
        zoomFit();
      } else if (!mod && e.key.toLowerCase() === "v") {
        setTool("select");
      } else if (!mod && e.key.toLowerCase() === "h") {
        setTool("hand");
      } else if (e.key === "Escape") {
        setSelection({ kind: "document" });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    const release = () => setSpaceHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", release);
    };
  });

  const addCustomSection = () => {
    const id = crypto.randomUUID();
    dispatch({ type: "ADD_CUSTOM_SECTION", title: "Nouvelle section", id });
    setSelection({ kind: "section", section: `custom:${id}` });
  };

  // The PDF route prints the saved CV: save pending edits first
  const download = async () => {
    setDownloading(true);
    try {
      await flush();
      const response = await fetch(`/api/cv/${cvId}/pdf`);
      if (!response.ok) throw new Error(`PDF: ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `CV_${data.header.name || "sans_nom"}`.replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("La génération du PDF a échoué");
    } finally {
      setDownloading(false);
    }
  };

  // Not re-rendered while panning and zooming
  const cvPage = useMemo(() => <ExecutiveTemplate data={applyVisibility(data)} />, [data]);

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <Toolbar
        cvId={cvId}
        title={title}
        tool={tool}
        onToolChange={setTool}
        zoom={view.zoom}
        onZoomIn={() => zoomBy(1)}
        onZoomOut={() => zoomBy(-1)}
        onZoomFit={zoomFit}
        onZoomReset={zoomReset}
        saveStatus={saveStatus}
        downloading={downloading}
        onDownload={download}
      />
      <div className="flex min-h-0 flex-1">
        <LayersPanel
          data={data}
          selection={selection}
          onSelect={setSelection}
          dispatch={dispatch}
          onAddCustomSection={addCustomSection}
        />
        <Canvas
          view={view}
          ready={viewport !== null}
          onViewChange={setCustomView}
          onViewportResize={setViewport}
          onPageResize={setPage}
          tool={tool}
          spacePanning={spaceHeld}
          selectedKey={selection.kind === "document" ? null : selectionKey(selection)}
          onSelect={setSelection}
          title={title}
        >
          {cvPage}
        </Canvas>
        <Inspector
          data={data}
          selection={selection}
          onSelect={setSelection}
          dispatch={dispatch}
          generationReport={generationReport}
        />
      </div>
    </div>
  );
}
