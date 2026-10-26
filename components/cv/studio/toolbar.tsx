"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AutosaveStatus } from "@/hooks/use-cv-autosave";
import type { Tool } from "./canvas";
import { ArrowLeftIcon, DownloadIcon, HandIcon, PointerIcon } from "./icons";

const SAVE_LABELS: Record<AutosaveStatus, string> = {
  saved: "Enregistré",
  pending: "Enregistrement…",
  saving: "Enregistrement…",
  error: "Échec de l'enregistrement",
};

interface ToolbarProps {
  cvId: string;
  title: string;
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
  saveStatus: AutosaveStatus;
  downloading: boolean;
  onDownload: () => void;
}

export function Toolbar(props: ToolbarProps) {
  const { tool, onToolChange, zoom } = props;
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-black bg-[#2c2c2c] px-3 text-gray-200">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={`/cv/${props.cvId}`}
          aria-label="Retour à l'éditeur classique"
          title="Retour à l'éditeur classique"
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/10"
        >
          <ArrowLeftIcon />
        </Link>
        <div role="toolbar" aria-label="Outils" className="flex items-center gap-1">
          <ToolButton label="Sélection (V)" active={tool === "select"} onClick={() => onToolChange("select")}>
            <PointerIcon />
          </ToolButton>
          <ToolButton label="Main (H)" active={tool === "hand"} onClick={() => onToolChange("hand")}>
            <HandIcon />
          </ToolButton>
        </div>
        <h1 className="truncate text-sm text-gray-300">{props.title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span role="status" className={cn("text-xs", props.saveStatus === "error" ? "text-red-400" : "text-gray-400")}>
          {SAVE_LABELS[props.saveStatus]}
        </span>
        <div className="flex items-center rounded bg-white/5 text-xs">
          <button type="button" onClick={props.onZoomOut} aria-label="Dézoomer (⌘-)" className="h-8 w-7 rounded hover:bg-white/10">
            −
          </button>
          <button
            type="button"
            onClick={props.onZoomReset}
            title="100 % (⌘0) — ajuster : ⇧1"
            aria-label={`Zoom ${Math.round(zoom * 100)} %, revenir à 100 %`}
            className="h-8 w-12 tabular-nums hover:bg-white/10"
          >
            {Math.round(zoom * 100)} %
          </button>
          <button type="button" onClick={props.onZoomIn} aria-label="Zoomer (⌘+)" className="h-8 w-7 rounded hover:bg-white/10">
            +
          </button>
          <button type="button" onClick={props.onZoomFit} className="h-8 rounded px-2 hover:bg-white/10">
            Ajuster
          </button>
        </div>
        <button
          type="button"
          onClick={props.onDownload}
          disabled={props.downloading}
          className="flex h-8 items-center gap-2 rounded bg-[#0d99ff] px-3 text-sm font-medium text-white hover:bg-[#0b85de] disabled:opacity-60"
        >
          <DownloadIcon />
          {props.downloading ? "Génération…" : "PDF"}
        </button>
      </div>
    </header>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded",
        active ? "bg-[#0d99ff] text-white" : "text-gray-300 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}
