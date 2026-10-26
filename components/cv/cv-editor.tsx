"use client";

import { useReducer, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateCvTemplate } from "@/lib/actions/cv";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExecutiveTemplate } from "@/components/cv/templates-html/executive-template";
import { ScaledPage } from "@/components/cv/templates-html/scaled-page";
import { useCvAutosave, type AutosaveStatus } from "@/hooks/use-cv-autosave";
import { cvReducer } from "@/lib/cv/reducer";
import { VARIANTS } from "@/lib/cv/variants";
import { cn } from "@/lib/utils";
import { applyVisibility } from "@/lib/cv/visibility";
import type { CvData, CvSection, GenerationReport, TemplateId } from "@/types/cv";
import { PdfDownloadButton } from "./pdf-download-button";
import { GenerationReportPanel } from "./generation-report";
import { BannerAppearanceFields } from "./editor/banner-appearance-fields";
import { CustomSectionFields } from "./editor/custom-section-fields";
import { EducationFields } from "./editor/education-fields";
import { ExperienceFields } from "./editor/experience-fields";
import { HeaderFields } from "./editor/header-fields";
import { InterestsFields } from "./editor/interests-fields";
import { ItemHeader } from "./editor/item-header";
import { ProjectFields } from "./editor/project-fields";
import { ShowOnCvToggle } from "./editor/show-on-cv-toggle";
import { SkillCategoryFields } from "./editor/skill-category-fields";

interface CvEditorProps {
  cvId: string;
  initialData: CvData;
  initialTemplateId: TemplateId;
  generationReport?: GenerationReport | null;
}

const AUTOSAVE_LABELS: Record<AutosaveStatus, string> = {
  saved: "Enregistré",
  pending: "Enregistrement…",
  saving: "Enregistrement…",
  error: "Échec de l'enregistrement",
};

export function CvEditor({ cvId, initialData, initialTemplateId, generationReport }: CvEditorProps) {
  const [cvData, dispatch] = useReducer(cvReducer, initialData);
  const isSectionHidden = (section: CvSection) => cvData.hiddenSections?.includes(section) ?? false;
  const toggleSection = (section: CvSection) => dispatch({ type: "TOGGLE_SECTION", section });
  const [templateId, setTemplateIdState] = useState(initialTemplateId);
  const setTemplateId = (v: TemplateId) => {
    setTemplateIdState(v);
    updateCvTemplate(cvId, v);
  };
  const { status: saveStatus, flush } = useCvAutosave(cvId, cvData);

  // The download page reads the CV from the database: save pending edits first
  const router = useRouter();
  const openDownloadPage = async () => {
    await flush();
    router.push(`/cv/${cvId}/pdf`);
  };


  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Select
            options={VARIANTS.map((v) => ({ value: v.id, label: v.label }))}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as TemplateId)}
          />
          <span
            role="status"
            className={`text-xs ${saveStatus === "error" ? "text-red-600" : "text-gray-400"}`}
          >
            {AUTOSAVE_LABELS[saveStatus]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/cv/${cvId}/studio`} className="text-sm font-medium text-blue-600 hover:underline">
            Ouvrir le studio
          </Link>
          <Button variant="outline" onClick={openDownloadPage}>
            CV + lettre
          </Button>
          {/* Printed from the same HTML as the preview: downloads exactly what is shown */}
          <PdfDownloadButton cvId={cvId} name={cvData.header.name} beforeDownload={flush} size="default" />
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editors */}
        <div className="w-1/2 overflow-auto p-4 space-y-4 border-r border-gray-200">
          {generationReport && <GenerationReportPanel report={generationReport} />}

          <Card>
            <CardHeader><CardTitle>En-tête</CardTitle></CardHeader>
            <CardContent>
              <HeaderFields data={cvData} dispatch={dispatch} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Apparence du bandeau</CardTitle></CardHeader>
            <CardContent>
              <BannerAppearanceFields data={cvData} templateId={templateId} dispatch={dispatch} />
            </CardContent>
          </Card>

          <SectionCard
            title="Résumé professionnel"
            shown={!isSectionHidden("summary")}
            onToggleShown={() => toggleSection("summary")}
          >
            <Textarea
              value={cvData.summary}
              rows={4}
              onChange={(e) => dispatch({ type: "SET_SUMMARY", value: e.target.value })}
            />
          </SectionCard>

          <SectionCard
            title="Expériences"
            shown={!isSectionHidden("experience")}
            onToggleShown={() => toggleSection("experience")}
            className="space-y-6"
          >
            {cvData.experience.map((exp, index) => (
              <ItemBlock key={exp.id} hidden={exp.hidden}>
                <ItemHeader
                  title={
                    exp.position || exp.company
                      ? `${exp.position}${exp.company ? ` — ${exp.company}` : ""}`
                      : `Expérience ${index + 1}`
                  }
                  hidden={!!exp.hidden}
                  onToggleHidden={() => dispatch({ type: "TOGGLE_EXPERIENCE_HIDDEN", index })}
                  onRemove={() => dispatch({ type: "REMOVE_EXPERIENCE", index })}
                  confirmRemove="Supprimer cette expérience ?"
                />
                <ExperienceFields experience={exp} index={index} dispatch={dispatch} />
              </ItemBlock>
            ))}
            <AddButton onClick={() => dispatch({ type: "ADD_EXPERIENCE" })}>+ Ajouter une expérience</AddButton>
          </SectionCard>

          <SectionCard
            title="Formation"
            shown={!isSectionHidden("education")}
            onToggleShown={() => toggleSection("education")}
            className="space-y-6"
          >
            {cvData.education.map((edu, index) => (
              <ItemBlock key={edu.id} hidden={edu.hidden}>
                <ItemHeader
                  title={
                    edu.degree || edu.institution
                      ? `${edu.degree}${edu.institution ? ` — ${edu.institution}` : ""}`
                      : `Formation ${index + 1}`
                  }
                  hidden={!!edu.hidden}
                  onToggleHidden={() => dispatch({ type: "TOGGLE_EDUCATION_HIDDEN", index })}
                  onRemove={() => dispatch({ type: "REMOVE_EDUCATION", index })}
                  confirmRemove="Supprimer cette formation ?"
                />
                <EducationFields education={edu} index={index} dispatch={dispatch} />
              </ItemBlock>
            ))}
            <AddButton onClick={() => dispatch({ type: "ADD_EDUCATION" })}>+ Ajouter une formation</AddButton>
          </SectionCard>

          <SectionCard
            title="Projets"
            shown={cvData.showProjects}
            onToggleShown={() => dispatch({ type: "TOGGLE_SHOW_PROJECTS" })}
            className="space-y-6"
          >
            {cvData.projects.map((project, index) => (
              <ItemBlock key={project.id} hidden={project.hidden} className="space-y-3">
                <ItemHeader
                  title={project.name || `Projet ${index + 1}`}
                  hidden={!!project.hidden}
                  onToggleHidden={() => dispatch({ type: "TOGGLE_PROJECT_HIDDEN", index })}
                  onRemove={() => dispatch({ type: "REMOVE_PROJECT", index })}
                  confirmRemove="Supprimer ce projet ?"
                />
                <ProjectFields
                  project={project}
                  index={index}
                  experiences={cvData.experience}
                  dispatch={dispatch}
                />
              </ItemBlock>
            ))}
            <AddButton onClick={() => dispatch({ type: "ADD_PROJECT" })}>+ Ajouter un projet</AddButton>
          </SectionCard>

          <SectionCard
            title="Compétences"
            shown={!isSectionHidden("skills")}
            onToggleShown={() => toggleSection("skills")}
            className="space-y-3"
          >
            {Object.entries(cvData.skills).map(([category, skills]) => {
              const categoryHidden = cvData.hiddenSkillCategories?.includes(category) ?? false;
              return (
                <div key={category} className={categoryHidden ? "opacity-50" : undefined}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">{category}</label>
                    <ShowOnCvToggle
                      label="Afficher"
                      checked={!categoryHidden}
                      onChange={() => dispatch({ type: "TOGGLE_SKILL_CATEGORY_HIDDEN", category })}
                    />
                  </div>
                  <SkillCategoryFields category={category} skills={skills} dispatch={dispatch} />
                </div>
              );
            })}
          </SectionCard>

          <SectionCard
            title="Centres d'intérêts"
            shown={!isSectionHidden("interests")}
            onToggleShown={() => toggleSection("interests")}
            className="space-y-2"
          >
            <InterestsFields interests={cvData.interests} dispatch={dispatch} />
          </SectionCard>

          <Card>
            <CardHeader>
              <CardTitle>Sections libres</CardTitle>
              <p className="text-xs text-gray-500">
                Savoir-être, langues, veille… Affichées pour l&apos;instant par le seul modèle Executive.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {cvData.customSections?.map((section, index) => (
                <ItemBlock key={section.id} hidden={section.hidden}>
                  <ItemHeader
                    title={section.title || `Section ${index + 1}`}
                    hidden={!!section.hidden}
                    onToggleHidden={() => dispatch({ type: "TOGGLE_CUSTOM_SECTION_HIDDEN", id: section.id })}
                    onRemove={() => dispatch({ type: "REMOVE_CUSTOM_SECTION", id: section.id })}
                    confirmRemove="Supprimer cette section ?"
                  />
                  <CustomSectionFields section={section} dispatch={dispatch} />
                </ItemBlock>
              ))}
              <AddButton onClick={() => dispatch({ type: "ADD_CUSTOM_SECTION", title: "Nouvelle section" })}>
                + Ajouter une section
              </AddButton>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 overflow-auto bg-gray-100 p-4">
          <div className="mx-auto" style={{ maxWidth: "595px" }}>
            <ScaledPage>
              <ExecutiveTemplate data={applyVisibility(cvData)} variant={templateId} />
            </ScaledPage>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A section of the CV that can be left out of the PDF; dimmed while hidden. */
function SectionCard({
  title,
  shown,
  onToggleShown,
  className,
  children,
}: {
  title: string;
  shown: boolean;
  onToggleShown: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <ShowOnCvToggle checked={shown} onChange={onToggleShown} />
        </div>
      </CardHeader>
      <CardContent className={cn(className, !shown && "opacity-50")}>
        {children}
      </CardContent>
    </Card>
  );
}

function ItemBlock({
  hidden,
  className = "space-y-2",
  children,
}: {
  hidden?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(className, "pb-4 border-b border-gray-100 last:border-0", hidden && "opacity-50")}>
      {children}
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="w-full">
      {children}
    </Button>
  );
}
