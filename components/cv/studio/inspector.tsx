"use client";

import { Textarea } from "@/components/ui/textarea";
import { BannerAppearanceFields } from "@/components/cv/editor/banner-appearance-fields";
import { CustomSectionFields } from "@/components/cv/editor/custom-section-fields";
import { EducationFields } from "@/components/cv/editor/education-fields";
import { ExperienceFields } from "@/components/cv/editor/experience-fields";
import { HeaderFields } from "@/components/cv/editor/header-fields";
import { InterestsFields } from "@/components/cv/editor/interests-fields";
import { LetterFields } from "@/components/cv/editor/letter-fields";
import { ItemHeader } from "@/components/cv/editor/item-header";
import { ProjectFields } from "@/components/cv/editor/project-fields";
import { ShowOnCvToggle } from "@/components/cv/editor/show-on-cv-toggle";
import { SkillCategoryFields } from "@/components/cv/editor/skill-category-fields";
import { GenerationReportPanel } from "@/components/cv/generation-report";
import { parseCustomSectionId } from "@/lib/cv/layout";
import type { CvDispatch } from "@/lib/cv/reducer";
import { sectionTitle, type ItemSection, type Selection } from "@/lib/cv/selection";
import type { LetterAction } from "@/lib/cv/letter";
import type { CoverLetterData, CvData, GenerationReport, SectionId } from "@/types/cv";
import { ArrowLeftIcon } from "./icons";
import { sectionVisibility } from "./layers-panel";

interface InspectorProps {
  data: CvData;
  letter: CoverLetterData | null;
  dispatchLetter: (action: LetterAction) => void;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  dispatch: CvDispatch;
  generationReport: GenerationReport | null;
  /** Adds an empty entry and selects it */
  onAddEntry: (section: "experience" | "education" | "projects") => void;
}

/** Edits whatever is selected; the document's settings when nothing is. */
export function Inspector(props: InspectorProps) {
  const { selection } = props;
  return (
    <aside aria-label="Inspecteur" className="flex w-80 shrink-0 flex-col border-l border-gray-200 bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {selection.kind === "document" && <DocumentInspector {...props} />}
        {selection.kind === "header" && <HeaderInspector {...props} />}
        {selection.kind === "letter" && props.letter && (
          <>
            <Title back={{ label: "Document", onClick: () => props.onSelect({ kind: "document" }) }}>
              Lettre de motivation
            </Title>
            <LetterFields letter={props.letter} dispatch={props.dispatchLetter} />
          </>
        )}
        {selection.kind === "section" && <SectionInspector {...props} section={selection.section} />}
        {selection.kind === "item" && <ItemInspector {...props} section={selection.section} id={selection.id} />}
      </div>
    </aside>
  );
}

function Title({ children, back }: { children: React.ReactNode; back?: { label: string; onClick: () => void } }) {
  return (
    <div className="space-y-1">
      {back && (
        <button
          type="button"
          onClick={back.onClick}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
        >
          <ArrowLeftIcon />
          {back.label}
        </button>
      )}
      <h2 className="text-sm font-semibold text-gray-900">{children}</h2>
    </div>
  );
}

function DocumentInspector({ data, dispatch, generationReport }: InspectorProps) {
  return (
    <>
      <Title>Document</Title>
      <p className="text-xs text-gray-500">
        Modèle Executive. Cliquez sur un élément du CV ou d&apos;un calque pour le modifier.
      </p>
      <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Bandeau</h3>
      <BannerAppearanceFields data={data} templateId="executive" dispatch={dispatch} />
      {generationReport && <GenerationReportPanel report={generationReport} />}
    </>
  );
}

function HeaderInspector({ data, dispatch, onSelect }: InspectorProps) {
  return (
    <>
      <Title back={{ label: "Document", onClick: () => onSelect({ kind: "document" }) }}>En-tête</Title>
      <HeaderFields data={data} dispatch={dispatch} />
    </>
  );
}

const ADD_LABELS: Partial<Record<SectionId, string>> = {
  experience: "+ Ajouter une expérience",
  education: "+ Ajouter une formation",
  projects: "+ Ajouter un projet",
};

function SectionInspector({ data, dispatch, onSelect, onAddEntry, section }: InspectorProps & { section: SectionId }) {
  const { hidden, toggle } = sectionVisibility(data, section);
  const customId = parseCustomSectionId(section);
  const custom = customId ? data.customSections?.find((s) => s.id === customId) : undefined;
  const addLabel = ADD_LABELS[section];

  const entries: { id: string; label: string }[] =
    section === "experience"
      ? data.experience.map((e, i) => ({ id: e.id, label: [e.position, e.company].filter(Boolean).join(" — ") || `Expérience ${i + 1}` }))
      : section === "education"
        ? data.education.map((e, i) => ({ id: e.id, label: e.degree || e.institution || `Formation ${i + 1}` }))
        : section === "projects"
          ? data.projects.map((p, i) => ({ id: p.id, label: p.name || `Projet ${i + 1}` }))
          : section === "skills"
            ? Object.keys(data.skills).map((category) => ({ id: category, label: category }))
            : [];

  return (
    <>
      <Title back={{ label: "Document", onClick: () => onSelect({ kind: "document" }) }}>
        {sectionTitle(data, section)}
      </Title>
      <ShowOnCvToggle checked={!hidden} onChange={() => dispatch(toggle)} />

      {section === "summary" && (
        <Textarea
          label="Résumé"
          value={data.summary}
          rows={8}
          onChange={(e) => dispatch({ type: "SET_SUMMARY", value: e.target.value })}
        />
      )}
      {section === "interests" && (
        <div className="space-y-2">
          <InterestsFields interests={data.interests} dispatch={dispatch} />
        </div>
      )}
      {custom && (
        <div className="space-y-3">
          <CustomSectionFields section={custom} dispatch={dispatch} />
          <button
            type="button"
            onClick={() => {
              if (confirm("Supprimer cette section ?")) {
                dispatch({ type: "REMOVE_CUSTOM_SECTION", id: custom.id });
                onSelect({ kind: "document" });
              }
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Supprimer la section
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect({ kind: "item", section: section as ItemSection, id: entry.id })}
                className="w-full truncate px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {addLabel && (
        <button
          type="button"
          onClick={() => onAddEntry(section as "experience" | "education" | "projects")}
          className="w-full rounded-md border border-dashed border-gray-300 py-1.5 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900"
        >
          {addLabel}
        </button>
      )}
    </>
  );
}

function ItemInspector({ data, dispatch, onSelect, section, id }: InspectorProps & { section: ItemSection; id: string }) {
  const back = { label: sectionTitle(data, section), onClick: () => onSelect({ kind: "section", section }) };
  const backToSection = () => onSelect({ kind: "section", section });

  if (section === "experience") {
    const index = data.experience.findIndex((e) => e.id === id);
    const exp = data.experience[index];
    return (
      <>
        <Title back={back}>{[exp.position, exp.company].filter(Boolean).join(" — ") || "Expérience"}</Title>
        <ItemHeader
          title="Expérience"
          hidden={!!exp.hidden}
          onToggleHidden={() => dispatch({ type: "TOGGLE_EXPERIENCE_HIDDEN", index })}
          onRemove={() => {
            dispatch({ type: "REMOVE_EXPERIENCE", index });
            backToSection();
          }}
          confirmRemove="Supprimer cette expérience ?"
        />
        <div className="space-y-2">
          <ExperienceFields experience={exp} index={index} dispatch={dispatch} />
        </div>
      </>
    );
  }

  if (section === "education") {
    const index = data.education.findIndex((e) => e.id === id);
    const edu = data.education[index];
    return (
      <>
        <Title back={back}>{edu.degree || edu.institution || "Formation"}</Title>
        <ItemHeader
          title="Formation"
          hidden={!!edu.hidden}
          onToggleHidden={() => dispatch({ type: "TOGGLE_EDUCATION_HIDDEN", index })}
          onRemove={() => {
            dispatch({ type: "REMOVE_EDUCATION", index });
            backToSection();
          }}
          confirmRemove="Supprimer cette formation ?"
        />
        <div className="space-y-2">
          <EducationFields education={edu} index={index} dispatch={dispatch} />
        </div>
      </>
    );
  }

  if (section === "projects") {
    const index = data.projects.findIndex((p) => p.id === id);
    const project = data.projects[index];
    return (
      <>
        <Title back={back}>{project.name || "Projet"}</Title>
        <ItemHeader
          title="Projet"
          hidden={!!project.hidden}
          onToggleHidden={() => dispatch({ type: "TOGGLE_PROJECT_HIDDEN", index })}
          onRemove={() => {
            dispatch({ type: "REMOVE_PROJECT", index });
            backToSection();
          }}
          confirmRemove="Supprimer ce projet ?"
        />
        <div className="space-y-3">
          <ProjectFields key={project.id} project={project} index={index} experiences={data.experience} dispatch={dispatch} />
        </div>
      </>
    );
  }

  const hidden = data.hiddenSkillCategories?.includes(id) ?? false;
  return (
    <>
      <Title back={back}>{id}</Title>
      <ShowOnCvToggle
        label="Afficher"
        checked={!hidden}
        onChange={() => dispatch({ type: "TOGGLE_SKILL_CATEGORY_HIDDEN", category: id })}
      />
      <SkillCategoryFields category={id} skills={data.skills[id] ?? []} dispatch={dispatch} />
    </>
  );
}
