"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { EditingContext, type EditingApi } from "@/components/cv/templates-html/editable";
import { ExecutiveTemplate } from "@/components/cv/templates-html/executive-template";
import { useCvAutosave } from "@/hooks/use-cv-autosave";
import { fieldKey, insertAfter, isLiveField, readField, removeEntry, writeField, type CvField } from "@/lib/cv/fields";
import { nudgeAction, type Direction } from "@/lib/cv/move";
import { deleteAction, duplicateAction } from "@/lib/cv/commands";
import { historyReducer, initialHistory } from "@/lib/cv/history";
import type { CvAction } from "@/lib/cv/reducer";
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

/** Keys typed into a field are never shortcuts. */
function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** Space activates a focused button or link: it does not pan then. */
function isControl(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ["BUTTON", "A"].includes(target.tagName);
}

const ARROW_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** The Figma-like CV editor: layers, the CV on a canvas, and an inspector. */
export function Studio({ cvId, title, initialData, generationReport }: StudioProps) {
  const [history, dispatchHistory] = useReducer(historyReducer, initialData, initialHistory);
  const data = history.present;
  const dispatch = useCallback((action: CvAction) => dispatchHistory({ type: "DO", action, at: Date.now() }), []);
  const undo = () => dispatchHistory({ type: "UNDO" });
  const redo = () => dispatchHistory({ type: "REDO" });

  // A short message at the bottom of the canvas, e.g. how to undo a deletion
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };
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

  // The text being typed on the page, and its value before, for Escape
  const [editing, setEditing] = useState<{
    field: CvField;
    original: string;
    caretPoint: { x: number; y: number } | null;
  } | null>(null);
  const startEditing = (field: CvField, caretPoint: { x: number; y: number } | null) =>
    setEditing({ field, original: readField(data, field), caretPoint });

  const center = viewport ? { x: viewport.width / 2, y: viewport.height / 2 } : { x: 0, y: 0 };
  const zoomBy = (direction: 1 | -1) =>
    setCustomView(zoomAround(view, stepZoom(view.zoom, direction), center.x, center.y));
  const zoomReset = () => viewport && setCustomView(viewAtZoom(viewport, page, 1));
  const zoomFit = () => setCustomView(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault(); // not the browser's bookmark
        const duplicate = duplicateAction(data, selection, crypto.randomUUID());
        if (duplicate) {
          dispatch(duplicate.action);
          setSelection(duplicate.select);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const action = deleteAction(data, selection);
        if (action) {
          e.preventDefault();
          dispatch(action);
          notify("Supprimé. ⌘Z pour annuler.");
        }
      } else if (e.altKey && ARROW_DIRECTIONS[e.key]) {
        // Alt + arrows move the selection: the keyboard way to drag
        e.preventDefault();
        const action = nudgeAction(data, selection, ARROW_DIRECTIONS[e.key]);
        if (action) dispatch(action);
      } else if (e.code === "Space") {
        if (isControl(e.target)) return;
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
  const cvPage = useMemo(() => {
    const write = (field: CvField, value: string) => {
      const action = writeField(data, field, value);
      if (action) dispatch(action);
    };
    const api: EditingApi = {
      editing: editing?.field ?? null,
      caretPoint: editing?.caretPoint ?? null,
      onInput: (field, value) => {
        if (isLiveField(field)) write(field, value);
      },
      onFinish: (field, reason, value) => {
        // A blur arriving after Enter or Escape already moved on
        if (!editing || fieldKey(editing.field) !== fieldKey(field)) return;
        if (reason === "cancel") {
          if (isLiveField(field)) write(field, editing.original);
          setEditing(null);
          return;
        }
        if (reason === "delete-empty") {
          const removed = removeEntry(data, field);
          if (!removed) return; // not an entry of a list: keep typing
          dispatch(removed.action);
          setEditing(
            removed.previous
              ? { field: removed.previous, original: readField(data, removed.previous), caretPoint: null }
              : null
          );
          return;
        }
        if (!isLiveField(field)) write(field, value);
        const inserted = reason === "enter" ? insertAfter(data, field) : null;
        if (inserted) {
          dispatch(inserted.action);
          setEditing({ field: inserted.next, original: "", caretPoint: null });
        } else {
          setEditing(null);
        }
      },
    };
    return (
      <EditingContext value={api}>
        <ExecutiveTemplate data={applyVisibility(data)} editable />
      </EditingContext>
    );
  }, [data, editing, dispatch]);

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
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={undo}
        onRedo={redo}
      />
      <div className="relative flex min-h-0 flex-1">
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
          onStartEditing={startEditing}
          onMove={dispatch}
          title={title}
        >
          {cvPage}
        </Canvas>
        <div aria-live="polite" className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
          {toast && <p className="rounded-md bg-black/80 px-3 py-2 text-sm text-white shadow-lg">{toast}</p>}
        </div>
        <Inspector
          data={data}
          selection={selection}
          onSelect={setSelection}
          dispatch={dispatch}
          generationReport={generationReport}
          onAddEntry={(section) => {
            const id = crypto.randomUUID();
            const type = { experience: "ADD_EXPERIENCE", education: "ADD_EDUCATION", projects: "ADD_PROJECT" } as const;
            dispatch({ type: type[section], id });
            setSelection({ kind: "item", section, id });
          }}
        />
      </div>
    </div>
  );
}
