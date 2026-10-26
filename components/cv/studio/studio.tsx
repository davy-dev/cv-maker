"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { EditingContext, type EditingApi } from "@/components/cv/templates-html/editable";
import { ExecutiveLetter } from "@/components/cv/templates-html/executive-letter";
import { ExecutiveTemplate } from "@/components/cv/templates-html/executive-template";
import { useAutosave, useCvAutosave, type AutosaveStatus } from "@/hooks/use-cv-autosave";
import { saveCoverLetterData } from "@/lib/actions/cover-letter";
import {
  fieldKey,
  insertAfter,
  isLiveField,
  readField,
  removeEntry,
  writeField,
  type EditableField,
} from "@/lib/cv/fields";
import { isLetterField, readLetterField, writeLetterField, type LetterAction } from "@/lib/cv/letter";
import { nudgeAction, type Direction } from "@/lib/cv/move";
import { deleteAction, duplicateAction } from "@/lib/cv/commands";
import { initialHistory } from "@/lib/cv/history";
import type { CvAction } from "@/lib/cv/reducer";
import { resolveSelection, selectionKey, type Selection } from "@/lib/cv/selection";
import { applyVisibility } from "@/lib/cv/visibility";
import { studioHistoryReducer } from "@/lib/studio/document";
import { fitView, stepZoom, viewAtZoom, zoomAround, type Size, type View } from "@/lib/studio/view";
import type { CoverLetterData, CvData, GenerationReport } from "@/types/cv";
import { Canvas, PAGE_WIDTH, type Tool } from "./canvas";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { Toolbar } from "./toolbar";

interface StudioProps {
  cvId: string;
  title: string;
  initialData: CvData;
  initialLetter: CoverLetterData | null;
  generationReport: GenerationReport | null;
}

type DocumentKind = "cv" | "letter";

/** The status shown for both documents: the most pressing of the two. */
function combinedStatus(a: AutosaveStatus, b: AutosaveStatus): AutosaveStatus {
  const order: AutosaveStatus[] = ["error", "saving", "pending", "saved"];
  return order.find((status) => status === a || status === b)!;
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

/** The Figma-like CV editor: layers, the CV and its letter on a canvas, and an inspector. */
export function Studio({ cvId, title, initialData, initialLetter, generationReport }: StudioProps) {
  const [history, dispatchHistory] = useReducer(
    studioHistoryReducer,
    { cv: initialData, letter: initialLetter },
    initialHistory
  );
  const data = history.present.cv;
  const letter = history.present.letter;
  const dispatch = useCallback(
    (action: CvAction) => dispatchHistory({ type: "DO", action: { target: "cv", action }, at: Date.now() }),
    []
  );
  const dispatchLetter = useCallback(
    (action: LetterAction) => dispatchHistory({ type: "DO", action: { target: "letter", action }, at: Date.now() }),
    []
  );
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
  const cvSave = useCvAutosave(cvId, data);
  const letterSave = useAutosave(letter, (snapshot) => saveCoverLetterData(cvId, snapshot));
  const saveStatus = combinedStatus(cvSave.status, letterSave.status);

  const [rawSelection, setSelection] = useState<Selection>({ kind: "document" });
  // A deleted entry falls back to its section; the letter, to the document until generated
  const selection: Selection =
    rawSelection.kind === "letter" && !letter ? { kind: "document" } : resolveSelection(data, rawSelection);

  const [tool, setTool] = useState<Tool>("select");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [viewport, setViewport] = useState<Size | null>(null);
  // Both artboards side by side; at least one A4 page high
  const [content, setContent] = useState<Size>({ width: PAGE_WIDTH, height: 1123 });
  // null: fit the pages in the window, following their size, until the user zooms or pans
  const [customView, setCustomView] = useState<View | null>(null);
  const view = customView ?? (viewport ? fitView(viewport, content) : { x: 0, y: 0, zoom: 1 });

  const [downloading, setDownloading] = useState<DocumentKind | null>(null);
  const [generatingLetter, setGeneratingLetter] = useState(false);

  // The text being typed on the page, and its value before, for Escape
  const [editing, setEditing] = useState<{
    field: EditableField;
    original: string;
    caretPoint: { x: number; y: number } | null;
  } | null>(null);
  const read = (field: EditableField) =>
    isLetterField(field) ? (letter ? readLetterField(letter, field) : "") : readField(data, field);
  const startEditing = (field: EditableField, caretPoint: { x: number; y: number } | null) =>
    setEditing({ field, original: read(field), caretPoint });

  const center = viewport ? { x: viewport.width / 2, y: viewport.height / 2 } : { x: 0, y: 0 };
  const zoomBy = (direction: 1 | -1) =>
    setCustomView(zoomAround(view, stepZoom(view.zoom, direction), center.x, center.y));
  // 100 %, on the CV
  const zoomReset = () => viewport && setCustomView(viewAtZoom(viewport, { width: PAGE_WIDTH, height: content.height }, 1));
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

  // The PDF route prints what is saved: save pending edits first
  const download = async (doc: DocumentKind) => {
    setDownloading(doc);
    try {
      await (doc === "cv" ? cvSave.flush() : letterSave.flush());
      const response = await fetch(`/api/cv/${cvId}/pdf${doc === "letter" ? "?doc=letter" : ""}`);
      if (!response.ok) throw new Error(`PDF: ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      const prefix = doc === "letter" ? "Lettre" : "CV";
      link.download = `${prefix}_${data.header.name || "sans_nom"}`.replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("La génération du PDF a échoué");
    } finally {
      setDownloading(null);
    }
  };

  // Written by Claude from the CV and the job offer; saved by the route as well
  const generateLetter = async () => {
    setGeneratingLetter(true);
    try {
      await cvSave.flush();
      const response = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        body: JSON.stringify({ cvId }),
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error ?? `Lettre : ${response.status}`);
      dispatchLetter({ type: "REPLACE_ALL", data: result.coverLetterData });
      setSelection({ kind: "letter" });
    } catch (error) {
      console.error("Cover letter generation failed:", error);
      alert(error instanceof Error ? error.message : "La génération de la lettre a échoué");
    } finally {
      setGeneratingLetter(false);
    }
  };

  // Not re-rendered while panning and zooming
  const pages = useMemo(() => {
    const write = (field: EditableField, value: string) => {
      if (isLetterField(field)) {
        dispatchLetter(writeLetterField(field, value));
        return;
      }
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
          const removed = isLetterField(field) ? null : removeEntry(data, field);
          if (!removed) return; // not an entry of a list: keep typing
          dispatch(removed.action);
          setEditing(
            removed.previous ? { field: removed.previous, original: readField(data, removed.previous), caretPoint: null } : null
          );
          return;
        }
        if (!isLiveField(field)) write(field, value);
        const inserted = reason === "enter" && !isLetterField(field) ? insertAfter(data, field) : null;
        if (inserted) {
          dispatch(inserted.action);
          setEditing({ field: inserted.next, original: "", caretPoint: null });
        } else {
          setEditing(null);
        }
      },
    };
    return {
      cv: (
        <EditingContext value={api}>
          <ExecutiveTemplate data={applyVisibility(data)} editable />
        </EditingContext>
      ),
      letter: letter ? (
        <EditingContext value={api}>
          <ExecutiveLetter cv={data} letter={letter} editable />
        </EditingContext>
      ) : (
        <LetterPlaceholder generating={generatingLetter} onGenerate={generateLetter} />
      ),
    };
    // generateLetter only changes with the CV id and the dispatchers, already covered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, letter, editing, dispatch, dispatchLetter, generatingLetter]);

  return (
    <>
      {/* A canvas with two panels needs room: phones get a pointer to the classic editor */}
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#1e1e1e] p-6 text-center text-gray-200 md:hidden">
        <p className="max-w-xs text-sm">Le studio est conçu pour un écran d&apos;ordinateur ou de tablette en paysage.</p>
        <a href={`/cv/${cvId}`} className="rounded bg-[#0d99ff] px-4 py-2 text-sm font-medium text-white">
          Ouvrir l&apos;éditeur classique
        </a>
      </div>
    <div className="hidden h-full flex-col bg-[#1e1e1e] md:flex">
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
        hasLetter={letter !== null}
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
          hasLetter={letter !== null}
        />
        <Canvas
          view={view}
          ready={viewport !== null}
          onViewChange={setCustomView}
          onViewportResize={setViewport}
          onContentResize={setContent}
          tool={tool}
          spacePanning={spaceHeld}
          selectedKey={selection.kind === "document" ? null : selectionKey(selection)}
          onSelect={setSelection}
          onStartEditing={startEditing}
          onMove={dispatch}
          artboards={[
            { id: "cv", title, content: pages.cv },
            { id: "letter", title: "Lettre de motivation", content: pages.letter },
          ]}
        />
        <div aria-live="polite" className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
          {toast && <p className="rounded-md bg-black/80 px-3 py-2 text-sm text-white shadow-lg">{toast}</p>}
        </div>
        <Inspector
          data={data}
          letter={letter}
          dispatchLetter={dispatchLetter}
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
    </>
  );
}

/** Stands in for the letter until it is written. */
function LetterPlaceholder({ generating, onGenerate }: { generating: boolean; onGenerate: () => void }) {
  return (
    <div className="flex min-h-[1123px] flex-col items-center justify-center gap-4 p-16 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">Lettre de motivation</h2>
      <p className="max-w-sm text-gray-500">
        Générez une lettre adaptée à l&apos;offre à partir de votre CV, puis modifiez-la ici comme le CV.
      </p>
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="rounded-md bg-[#0d99ff] px-5 py-2.5 font-medium text-white hover:bg-[#0b85de] disabled:opacity-60"
      >
        {generating ? "Génération en cours…" : "Générer la lettre de motivation"}
      </button>
    </div>
  );
}
