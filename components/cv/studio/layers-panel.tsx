"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { parseCustomSectionId, resolveLayout } from "@/lib/cv/layout";
import type { CvAction, CvDispatch } from "@/lib/cv/reducer";
import { sectionTitle, selectionKey, type ItemSection, type Selection } from "@/lib/cv/selection";
import type { CvData, SectionId } from "@/types/cv";
import { ChevronIcon, EyeIcon, EyeOffIcon } from "./icons";

interface LayerItem {
  id: string;
  label: string;
  hidden: boolean;
  toggle: CvAction;
}

/** The entries of a section listed under it, each with its own visibility. */
function sectionItems(data: CvData, section: SectionId): { section: ItemSection; items: LayerItem[] } | null {
  switch (section) {
    case "experience":
      return {
        section,
        items: data.experience.map((e, index) => ({
          id: e.id,
          label: [e.position, e.company].filter(Boolean).join(" — ") || `Expérience ${index + 1}`,
          hidden: !!e.hidden,
          toggle: { type: "TOGGLE_EXPERIENCE_HIDDEN", index },
        })),
      };
    case "education":
      return {
        section,
        items: data.education.map((e, index) => ({
          id: e.id,
          label: e.degree || e.institution || `Formation ${index + 1}`,
          hidden: !!e.hidden,
          toggle: { type: "TOGGLE_EDUCATION_HIDDEN", index },
        })),
      };
    case "projects":
      return {
        section,
        items: data.projects.map((p, index) => ({
          id: p.id,
          label: p.name || `Projet ${index + 1}`,
          hidden: !!p.hidden,
          toggle: { type: "TOGGLE_PROJECT_HIDDEN", index },
        })),
      };
    case "skills":
      return {
        section,
        items: Object.keys(data.skills).map((category) => ({
          id: category,
          label: category,
          hidden: data.hiddenSkillCategories?.includes(category) ?? false,
          toggle: { type: "TOGGLE_SKILL_CATEGORY_HIDDEN", category },
        })),
      };
    default:
      return null;
  }
}

/** Whether a whole section is left out of the PDF, and the action switching it. */
export function sectionVisibility(data: CvData, section: SectionId): { hidden: boolean; toggle: CvAction } {
  const customId = parseCustomSectionId(section);
  if (customId) {
    const custom = data.customSections?.find((s) => s.id === customId);
    return { hidden: !!custom?.hidden, toggle: { type: "TOGGLE_CUSTOM_SECTION_HIDDEN", id: customId } };
  }
  if (section === "projects") return { hidden: !data.showProjects, toggle: { type: "TOGGLE_SHOW_PROJECTS" } };
  const builtIn = section as Exclude<SectionId, "projects" | `custom:${string}`>;
  return {
    hidden: data.hiddenSections?.includes(builtIn) ?? false,
    toggle: { type: "TOGGLE_SECTION", section: builtIn },
  };
}

export function LayersPanel({
  data,
  selection,
  onSelect,
  dispatch,
  onAddCustomSection,
}: {
  data: CvData;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  dispatch: CvDispatch;
  onAddCustomSection: () => void;
}) {
  const layout = resolveLayout(data);
  const [collapsed, setCollapsed] = useState<Set<SectionId>>(new Set());
  const selectedKey = selectionKey(selection);

  const toggleCollapsed = (section: SectionId) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });

  const renderSection = (section: SectionId) => {
    const { hidden, toggle } = sectionVisibility(data, section);
    const children = sectionItems(data, section);
    const open = !collapsed.has(section);
    const title = sectionTitle(data, section);
    return (
      <li key={section}>
        <LayerRow
          label={title}
          selected={selectedKey === selectionKey({ kind: "section", section })}
          hidden={hidden}
          onSelect={() => onSelect({ kind: "section", section })}
          onToggleHidden={() => dispatch(toggle)}
          expander={
            children && children.items.length > 0 ? (
              <button
                type="button"
                aria-label={open ? `Replier ${title}` : `Déplier ${title}`}
                aria-expanded={open}
                onClick={() => toggleCollapsed(section)}
                className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-700"
              >
                <ChevronIcon open={open} />
              </button>
            ) : undefined
          }
        />
        {children && open && (
          <ul>
            {children.items.map((item) => (
              <li key={item.id}>
                <LayerRow
                  label={item.label}
                  indent
                  selected={selectedKey === selectionKey({ kind: "item", section: children.section, id: item.id })}
                  hidden={item.hidden || hidden}
                  onSelect={() => onSelect({ kind: "item", section: children.section, id: item.id })}
                  onToggleHidden={() => dispatch(item.toggle)}
                />
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Calques" className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <h2 className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Calques</h2>
      <div className="flex-1 overflow-y-auto pb-3">
        <ul>
          <li>
            <LayerRow
              label="En-tête"
              selected={selectedKey === "header"}
              onSelect={() => onSelect({ kind: "header" })}
            />
          </li>
        </ul>
        <ColumnGroup title="Colonne principale">{layout.main.map(renderSection)}</ColumnGroup>
        <ColumnGroup title="Colonne latérale">{layout.aside.map(renderSection)}</ColumnGroup>
      </div>
      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={onAddCustomSection}
          className="w-full rounded-md border border-dashed border-gray-300 py-1.5 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900"
        >
          + Section libre
        </button>
      </div>
    </nav>
  );
}

function ColumnGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-3">
      <h3 className="px-4 pb-1 text-[11px] font-medium text-gray-400">{title}</h3>
      <ul>{children}</ul>
    </section>
  );
}

function LayerRow({
  label,
  selected,
  hidden = false,
  indent = false,
  onSelect,
  onToggleHidden,
  expander,
}: {
  label: string;
  selected: boolean;
  hidden?: boolean;
  indent?: boolean;
  onSelect: () => void;
  onToggleHidden?: () => void;
  expander?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group flex h-8 items-center gap-1 pr-2 text-sm",
        indent ? "pl-9" : "pl-3",
        selected ? "bg-blue-50 text-blue-900" : "text-gray-700 hover:bg-gray-50"
      )}
    >
      {!indent && <span className="flex w-5 justify-center">{expander}</span>}
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn("min-w-0 flex-1 truncate text-left", hidden && "text-gray-400 line-through decoration-gray-300")}
      >
        {label}
      </button>
      {onToggleHidden && (
        <button
          type="button"
          onClick={onToggleHidden}
          aria-label={hidden ? `Afficher ${label} sur le CV` : `Masquer ${label} sur le CV`}
          aria-pressed={hidden}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700",
            !hidden && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          )}
        >
          {hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
  );
}
