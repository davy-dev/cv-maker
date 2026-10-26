"use client";

import { useReducer, useCallback, useRef, useEffect, useState } from "react";
import { saveCvData, updateCvTemplate } from "@/lib/actions/cv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CvPdfPreview } from "./cv-pdf-preview";
import { PdfDownloadButton } from "@/components/pdf/pdf-download-button";
import { GenerationReportPanel } from "./generation-report";
import { useRouter } from "next/navigation";
import type { CvData, CvExperience, CvEducation, CvProject, CvSection, GenerationReport, TemplateId, ProjectType, ProjectDisplayMode, ImagePosition } from "@/types/cv";
import Link from "next/link";
import { useDragReposition } from "@/hooks/use-drag-reposition";
import { MAX_SECTION_PROJECTS, isInProjectsSection } from "@/lib/cv/visibility";

// --- Reducer ---

type CvAction =
  | { type: "SET_HEADER_FIELD"; field: keyof CvData["header"]; value: string | null }
  | { type: "SET_SUMMARY"; value: string }
  | { type: "SET_YEARS_EXPERIENCE"; value: string }
  | { type: "ADD_EXPERIENCE" }
  | { type: "REMOVE_EXPERIENCE"; index: number }
  | { type: "SET_EXPERIENCE_FIELD"; index: number; field: keyof CvExperience; value: string }
  | { type: "SET_EXPERIENCE_BULLET"; expIndex: number; bulletIndex: number; value: string }
  | { type: "ADD_EXPERIENCE_BULLET"; expIndex: number }
  | { type: "REMOVE_EXPERIENCE_BULLET"; expIndex: number; bulletIndex: number }
  | { type: "ADD_EDUCATION" }
  | { type: "REMOVE_EDUCATION"; index: number }
  | { type: "SET_EDUCATION_FIELD"; index: number; field: keyof CvEducation; value: string }
  | { type: "SET_SKILL_CATEGORY"; oldCategory: string; newCategory: string }
  | { type: "ADD_SKILL"; category: string; skill: string }
  | { type: "REMOVE_SKILL"; category: string; skillIndex: number }
  | { type: "ADD_PROJECT" }
  | { type: "REMOVE_PROJECT"; index: number }
  | { type: "SET_PROJECT_FIELD"; index: number; field: keyof CvProject; value: string }
  | { type: "ADD_PROJECT_TECHNOLOGY"; index: number; value: string }
  | { type: "REMOVE_PROJECT_TECHNOLOGY"; projectIndex: number; techIndex: number }
  | { type: "ADD_PROJECT_HIGHLIGHT"; index: number; value: string }
  | { type: "REMOVE_PROJECT_HIGHLIGHT"; projectIndex: number; highlightIndex: number }
  | { type: "ADD_PROJECT_LINK"; index: number; label: string; url: string }
  | { type: "REMOVE_PROJECT_LINK"; projectIndex: number; linkIndex: number }
  | { type: "SET_PROJECT_LINK_FIELD"; projectIndex: number; linkIndex: number; field: "label" | "url"; value: string }
  | { type: "ADD_INTEREST"; value: string }
  | { type: "REMOVE_INTEREST"; index: number }
  | { type: "SET_INTEREST"; index: number; value: string }
  | { type: "TOGGLE_SHOW_PHOTO" }
  | { type: "TOGGLE_SHOW_PROJECTS" }
  | { type: "TOGGLE_SECTION"; section: CvSection }
  | { type: "TOGGLE_EXPERIENCE_HIDDEN"; index: number }
  | { type: "TOGGLE_EDUCATION_HIDDEN"; index: number }
  | { type: "TOGGLE_PROJECT_HIDDEN"; index: number }
  | { type: "TOGGLE_SKILL_CATEGORY_HIDDEN"; category: string }
  | { type: "SET_HEADER_BG_COLOR"; value: string | null }
  | { type: "SET_HEADER_TEXT_COLOR"; value: string | null }
  | { type: "SET_HEADER_BG_IMAGE"; value: string | null }
  | { type: "SET_HEADER_BG_IMAGE_POSITION"; value: ImagePosition | null };

const cvActionHandlers: Record<CvAction["type"], (state: CvData, action: CvAction) => CvData> = {
  SET_HEADER_FIELD: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_HEADER_FIELD" }>;
    return { ...state, header: { ...state.header, [a.field]: a.value } };
  },
  SET_SUMMARY: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_SUMMARY" }>;
    return { ...state, summary: a.value };
  },
  SET_YEARS_EXPERIENCE: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_YEARS_EXPERIENCE" }>;
    return { ...state, yearsExperience: a.value };
  },
  ADD_EXPERIENCE: (state) => ({
    ...state,
    experience: [
      ...state.experience,
      {
        id: crypto.randomUUID(),
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        bullets: [""],
      },
    ],
  }),
  REMOVE_EXPERIENCE: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_EXPERIENCE" }>;
    return { ...state, experience: state.experience.filter((_, i) => i !== a.index) };
  },
  SET_EXPERIENCE_FIELD: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_EXPERIENCE_FIELD" }>;
    const experience = [...state.experience];
    experience[a.index] = { ...experience[a.index], [a.field]: a.value };
    return { ...state, experience };
  },
  SET_EXPERIENCE_BULLET: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_EXPERIENCE_BULLET" }>;
    const experience = [...state.experience];
    const bullets = [...experience[a.expIndex].bullets];
    bullets[a.bulletIndex] = a.value;
    experience[a.expIndex] = { ...experience[a.expIndex], bullets };
    return { ...state, experience };
  },
  ADD_EXPERIENCE_BULLET: (state, action) => {
    const a = action as Extract<CvAction, { type: "ADD_EXPERIENCE_BULLET" }>;
    const experience = [...state.experience];
    experience[a.expIndex] = {
      ...experience[a.expIndex],
      bullets: [...experience[a.expIndex].bullets, ""],
    };
    return { ...state, experience };
  },
  REMOVE_EXPERIENCE_BULLET: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_EXPERIENCE_BULLET" }>;
    const experience = [...state.experience];
    const bullets = experience[a.expIndex].bullets.filter((_, i) => i !== a.bulletIndex);
    experience[a.expIndex] = { ...experience[a.expIndex], bullets };
    return { ...state, experience };
  },
  ADD_EDUCATION: (state) => ({
    ...state,
    education: [
      ...state.education,
      {
        id: crypto.randomUUID(),
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ],
  }),
  REMOVE_EDUCATION: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_EDUCATION" }>;
    return { ...state, education: state.education.filter((_, i) => i !== a.index) };
  },
  SET_EDUCATION_FIELD: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_EDUCATION_FIELD" }>;
    const educ = [...state.education];
    educ[a.index] = { ...educ[a.index], [a.field]: a.value };
    return { ...state, education: educ };
  },
  ADD_SKILL: (state, action) => {
    const a = action as Extract<CvAction, { type: "ADD_SKILL" }>;
    const skills = { ...state.skills };
    skills[a.category] = [...(skills[a.category] || []), a.skill];
    return { ...state, skills };
  },
  REMOVE_SKILL: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_SKILL" }>;
    const skills = { ...state.skills };
    skills[a.category] = skills[a.category].filter((_, i) => i !== a.skillIndex);
    if (skills[a.category].length === 0) delete skills[a.category];
    return { ...state, skills };
  },
  SET_SKILL_CATEGORY: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_SKILL_CATEGORY" }>;
    const skills = { ...state.skills };
    const existing = skills[a.oldCategory] || [];
    delete skills[a.oldCategory];
    skills[a.newCategory] = existing;
    // A hidden category stays hidden under its new name
    const hiddenSkillCategories = state.hiddenSkillCategories?.map((c) =>
      c === a.oldCategory ? a.newCategory : c
    );
    return { ...state, skills, hiddenSkillCategories };
  },
  ADD_PROJECT: (state) => ({
    ...state,
    projects: [
      ...state.projects,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        technologies: [],
        url: null,
        type: "personal" as const,
        role: "",
        impact: "",
        highlights: [],
        motivation: "",
        links: [],
        linkedExperienceId: null,
        displayMode: "projects-section" as const,
      },
    ],
  }),
  REMOVE_PROJECT: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_PROJECT" }>;
    return { ...state, projects: state.projects.filter((_, i) => i !== a.index) };
  },
  SET_PROJECT_FIELD: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_PROJECT_FIELD" }>;
    const projects = [...state.projects];
    projects[a.index] = { ...projects[a.index], [a.field]: a.value };
    return { ...state, projects };
  },
  ADD_PROJECT_TECHNOLOGY: (state, action) => {
    const a = action as Extract<CvAction, { type: "ADD_PROJECT_TECHNOLOGY" }>;
    const projects = [...state.projects];
    projects[a.index] = {
      ...projects[a.index],
      technologies: [...projects[a.index].technologies, a.value],
    };
    return { ...state, projects };
  },
  REMOVE_PROJECT_TECHNOLOGY: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_PROJECT_TECHNOLOGY" }>;
    const projects = [...state.projects];
    projects[a.projectIndex] = {
      ...projects[a.projectIndex],
      technologies: projects[a.projectIndex].technologies.filter((_, i) => i !== a.techIndex),
    };
    return { ...state, projects };
  },
  ADD_PROJECT_HIGHLIGHT: (state, action) => {
    const a = action as Extract<CvAction, { type: "ADD_PROJECT_HIGHLIGHT" }>;
    const projects = [...state.projects];
    projects[a.index] = {
      ...projects[a.index],
      highlights: [...projects[a.index].highlights, a.value],
    };
    return { ...state, projects };
  },
  REMOVE_PROJECT_HIGHLIGHT: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_PROJECT_HIGHLIGHT" }>;
    const projects = [...state.projects];
    projects[a.projectIndex] = {
      ...projects[a.projectIndex],
      highlights: projects[a.projectIndex].highlights.filter((_, i) => i !== a.highlightIndex),
    };
    return { ...state, projects };
  },
  ADD_PROJECT_LINK: (state, action) => {
    const a = action as Extract<CvAction, { type: "ADD_PROJECT_LINK" }>;
    const projects = [...state.projects];
    projects[a.index] = {
      ...projects[a.index],
      links: [...projects[a.index].links, { label: a.label, url: a.url }],
    };
    return { ...state, projects };
  },
  REMOVE_PROJECT_LINK: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_PROJECT_LINK" }>;
    const projects = [...state.projects];
    projects[a.projectIndex] = {
      ...projects[a.projectIndex],
      links: projects[a.projectIndex].links.filter((_, i) => i !== a.linkIndex),
    };
    return { ...state, projects };
  },
  SET_PROJECT_LINK_FIELD: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_PROJECT_LINK_FIELD" }>;
    const projects = [...state.projects];
    const links = [...projects[a.projectIndex].links];
    links[a.linkIndex] = { ...links[a.linkIndex], [a.field]: a.value };
    projects[a.projectIndex] = { ...projects[a.projectIndex], links };
    return { ...state, projects };
  },
  ADD_INTEREST: (state, action) => {
    const a = action as Extract<CvAction, { type: "ADD_INTEREST" }>;
    return { ...state, interests: [...state.interests, a.value] };
  },
  REMOVE_INTEREST: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_INTEREST" }>;
    return { ...state, interests: state.interests.filter((_, i) => i !== a.index) };
  },
  SET_INTEREST: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_INTEREST" }>;
    const interests = [...state.interests];
    interests[a.index] = a.value;
    return { ...state, interests };
  },
  TOGGLE_SHOW_PHOTO: (state) => ({ ...state, showPhoto: !state.showPhoto }),
  TOGGLE_SHOW_PROJECTS: (state) => ({ ...state, showProjects: !state.showProjects }),
  TOGGLE_SECTION: (state, action) => {
    const a = action as Extract<CvAction, { type: "TOGGLE_SECTION" }>;
    return { ...state, hiddenSections: toggle(state.hiddenSections, a.section) };
  },
  TOGGLE_EXPERIENCE_HIDDEN: (state, action) => {
    const a = action as Extract<CvAction, { type: "TOGGLE_EXPERIENCE_HIDDEN" }>;
    const experience = [...state.experience];
    experience[a.index] = { ...experience[a.index], hidden: !experience[a.index].hidden };
    return { ...state, experience };
  },
  TOGGLE_EDUCATION_HIDDEN: (state, action) => {
    const a = action as Extract<CvAction, { type: "TOGGLE_EDUCATION_HIDDEN" }>;
    const education = [...state.education];
    education[a.index] = { ...education[a.index], hidden: !education[a.index].hidden };
    return { ...state, education };
  },
  TOGGLE_PROJECT_HIDDEN: (state, action) => {
    const a = action as Extract<CvAction, { type: "TOGGLE_PROJECT_HIDDEN" }>;
    const projects = [...state.projects];
    projects[a.index] = { ...projects[a.index], hidden: !projects[a.index].hidden };
    return { ...state, projects };
  },
  TOGGLE_SKILL_CATEGORY_HIDDEN: (state, action) => {
    const a = action as Extract<CvAction, { type: "TOGGLE_SKILL_CATEGORY_HIDDEN" }>;
    return { ...state, hiddenSkillCategories: toggle(state.hiddenSkillCategories, a.category) };
  },
  SET_HEADER_BG_COLOR: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_HEADER_BG_COLOR" }>;
    return { ...state, headerBgColor: a.value };
  },
  SET_HEADER_TEXT_COLOR: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_HEADER_TEXT_COLOR" }>;
    return { ...state, headerTextColor: a.value };
  },
  SET_HEADER_BG_IMAGE: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_HEADER_BG_IMAGE" }>;
    return { ...state, headerBgImage: a.value, headerBgImagePosition: a.value ? state.headerBgImagePosition : null };
  },
  SET_HEADER_BG_IMAGE_POSITION: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_HEADER_BG_IMAGE_POSITION" }>;
    return { ...state, headerBgImagePosition: a.value };
  },
};

function toggle<T>(list: T[] | undefined, value: T): T[] {
  return list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value];
}

export function cvReducer(state: CvData, action: CvAction): CvData {
  const handler = cvActionHandlers[action.type];
  return handler ? handler(state, action) : state;
}

// --- Main Editor ---

interface CvEditorProps {
  cvId: string;
  initialData: CvData;
  initialTemplateId: TemplateId;
  generationReport?: GenerationReport | null;
}

// Coerce null to empty string for controlled inputs
function str(value: string | null | undefined): string {
  return value ?? "";
}

export function CvEditor({ cvId, initialData, initialTemplateId, generationReport }: CvEditorProps) {
  const [cvData, dispatch] = useReducer(cvReducer, initialData);
  const isSectionHidden = (section: CvSection) => cvData.hiddenSections?.includes(section) ?? false;
  const [templateId, setTemplateIdState] = useState(initialTemplateId);
  const setTemplateId = (v: TemplateId) => {
    setTemplateIdState(v);
    updateCvTemplate(cvId, v);
  };
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save
  const scheduleAutoSave = useCallback(
    (data: CvData) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveCvData(cvId, data);
      }, 1000);
    },
    [cvId]
  );

  // Dispatch wrapper that also triggers save
  const update = useCallback(
    (action: CvAction) => {
      dispatch(action);
    },
    []
  );

  // Auto-save whenever cvData changes
  useEffect(() => {
    scheduleAutoSave(cvData);
  }, [cvData, scheduleAutoSave]);

  // The download page reads the CV from the database: save pending edits first
  const router = useRouter();
  const openDownloadPage = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await saveCvData(cvId, cvData);
    router.push(`/cv/${cvId}/pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: "modern", label: "Moderne" },
              { value: "classic", label: "Classique" },
              { value: "minimalist", label: "Minimaliste" },
              { value: "elegant", label: "Elegant" },
            ]}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as TemplateId)}
          />
          <span className="text-xs text-gray-400">Auto-save activé</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openDownloadPage}>
            CV + lettre
          </Button>
          {/* Same renderer as the preview: downloads exactly what is shown */}
          <PdfDownloadButton
            data={cvData}
            templateId={templateId}
            fileName={`CV_${cvData.header.name || "sans_nom"}`.replace(/[^a-zA-Z0-9]/g, "_")}
            size="default"
          />
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editors */}
        <div className="w-1/2 overflow-auto p-4 space-y-4 border-r border-gray-200">
          {generationReport && <GenerationReportPanel report={generationReport} />}

          {/* Header */}
          <Card>
            <CardHeader><CardTitle>En-tête</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Nom"
                  value={str(cvData.header.name)}
                  onChange={(e) => update({ type: "SET_HEADER_FIELD", field: "name", value: e.target.value })}
                />
                <Input
                  label="Titre"
                  value={str(cvData.header.title)}
                  onChange={(e) => update({ type: "SET_HEADER_FIELD", field: "title", value: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Email"
                  value={str(cvData.header.email)}
                  onChange={(e) => update({ type: "SET_HEADER_FIELD", field: "email", value: e.target.value })}
                />
                <Input
                  label="Téléphone"
                  value={str(cvData.header.phone)}
                  onChange={(e) => update({ type: "SET_HEADER_FIELD", field: "phone", value: e.target.value })}
                />
              </div>
              <Input
                label="Localisation"
                value={str(cvData.header.location)}
                onChange={(e) => update({ type: "SET_HEADER_FIELD", field: "location", value: e.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="LinkedIn"
                  value={str(cvData.header.linkedin)}
                  onChange={(e) => update({ type: "SET_HEADER_FIELD", field: "linkedin", value: e.target.value || null })}
                />
                <Input
                  label="GitHub"
                  value={str(cvData.header.github)}
                  onChange={(e) => update({ type: "SET_HEADER_FIELD", field: "github", value: e.target.value || null })}
                />
              </div>
              <Input
                label="Années d'expérience"
                placeholder="ex: 5 ans d'expérience"
                value={cvData.yearsExperience}
                onChange={(e) => update({ type: "SET_YEARS_EXPERIENCE", value: e.target.value })}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cvData.showPhoto}
                  onChange={() => update({ type: "TOGGLE_SHOW_PHOTO" })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Afficher ma photo de profil</span>
              </label>
              {cvData.showPhoto && !cvData.header.image && (
                <p className="text-xs text-gray-500">
                  Aucune photo de profil pour l&apos;instant.{" "}
                  <Link href="/profile" className="text-blue-600 hover:underline">
                    Ajoutez-en une
                  </Link>{" "}
                  pour l&apos;afficher sur le CV.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Banner Appearance */}
          <BannerAppearanceEditor
            bgColor={cvData.headerBgColor}
            textColor={cvData.headerTextColor}
            bgImage={cvData.headerBgImage}
            bgImagePosition={cvData.headerBgImagePosition ?? null}
            onBgColorChange={(v) => update({ type: "SET_HEADER_BG_COLOR", value: v })}
            onTextColorChange={(v) => update({ type: "SET_HEADER_TEXT_COLOR", value: v })}
            onBgImageChange={(v) => update({ type: "SET_HEADER_BG_IMAGE", value: v })}
            onBgImagePositionChange={(v) => update({ type: "SET_HEADER_BG_IMAGE_POSITION", value: v })}
            templateId={templateId}
          />

          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Résumé professionnel</CardTitle>
                <ShowOnCvToggle
                  checked={!isSectionHidden("summary")}
                  onChange={() => update({ type: "TOGGLE_SECTION", section: "summary" })}
                />
              </div>
            </CardHeader>
            <CardContent className={isSectionHidden("summary") ? "opacity-50" : undefined}>
              <Textarea
                value={cvData.summary}
                rows={4}
                onChange={(e) => update({ type: "SET_SUMMARY", value: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Expériences</CardTitle>
                <ShowOnCvToggle
                  checked={!isSectionHidden("experience")}
                  onChange={() => update({ type: "TOGGLE_SECTION", section: "experience" })}
                />
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${isSectionHidden("experience") ? "opacity-50" : ""}`}>
              {cvData.experience.map((exp, expIdx) => (
                <div key={exp.id} className={`space-y-2 pb-4 border-b border-gray-100 last:border-0 ${exp.hidden ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {exp.position || exp.company ? `${exp.position}${exp.company ? ` — ${exp.company}` : ""}` : `Expérience ${expIdx + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                    <ShowOnCvToggle
                      label="Afficher"
                      checked={!exp.hidden}
                      onChange={() => update({ type: "TOGGLE_EXPERIENCE_HIDDEN", index: expIdx })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Supprimer cette expérience ?")) {
                          update({ type: "REMOVE_EXPERIENCE", index: expIdx });
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      label="Poste"
                      value={exp.position}
                      onChange={(e) => update({ type: "SET_EXPERIENCE_FIELD", index: expIdx, field: "position", value: e.target.value })}
                    />
                    <Input
                      label="Entreprise"
                      value={exp.company}
                      onChange={(e) => update({ type: "SET_EXPERIENCE_FIELD", index: expIdx, field: "company", value: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      label="Lieu"
                      value={str(exp.location)}
                      onChange={(e) => update({ type: "SET_EXPERIENCE_FIELD", index: expIdx, field: "location", value: e.target.value })}
                    />
                    <Input
                      label="Début"
                      value={str(exp.startDate)}
                      onChange={(e) => update({ type: "SET_EXPERIENCE_FIELD", index: expIdx, field: "startDate", value: e.target.value })}
                    />
                    <Input
                      label="Fin"
                      value={str(exp.endDate)}
                      onChange={(e) => update({ type: "SET_EXPERIENCE_FIELD", index: expIdx, field: "endDate", value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Réalisations</label>
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex gap-1">
                        <Input
                          value={bullet}
                          onChange={(e) => update({ type: "SET_EXPERIENCE_BULLET", expIndex: expIdx, bulletIndex: bIdx, value: e.target.value })}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => update({ type: "REMOVE_EXPERIENCE_BULLET", expIndex: expIdx, bulletIndex: bIdx })}
                          className="shrink-0 text-red-400"
                        >
                          x
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => update({ type: "ADD_EXPERIENCE_BULLET", expIndex: expIdx })}
                    >
                      + Ajouter un point
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => update({ type: "ADD_EXPERIENCE" })}
                className="w-full"
              >
                + Ajouter une expérience
              </Button>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Formation</CardTitle>
                <ShowOnCvToggle
                  checked={!isSectionHidden("education")}
                  onChange={() => update({ type: "TOGGLE_SECTION", section: "education" })}
                />
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${isSectionHidden("education") ? "opacity-50" : ""}`}>
              {cvData.education.map((edu, eduIdx) => (
                <div key={edu.id} className={`space-y-2 pb-4 border-b border-gray-100 last:border-0 ${edu.hidden ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {edu.degree || edu.institution ? `${edu.degree}${edu.institution ? ` — ${edu.institution}` : ""}` : `Formation ${eduIdx + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                    <ShowOnCvToggle
                      label="Afficher"
                      checked={!edu.hidden}
                      onChange={() => update({ type: "TOGGLE_EDUCATION_HIDDEN", index: eduIdx })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Supprimer cette formation ?")) {
                          update({ type: "REMOVE_EDUCATION", index: eduIdx });
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      label="Diplôme"
                      value={edu.degree}
                      onChange={(e) => update({ type: "SET_EDUCATION_FIELD", index: eduIdx, field: "degree", value: e.target.value })}
                    />
                    <Input
                      label="Domaine"
                      value={edu.field}
                      onChange={(e) => update({ type: "SET_EDUCATION_FIELD", index: eduIdx, field: "field", value: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Établissement"
                    value={edu.institution}
                    onChange={(e) => update({ type: "SET_EDUCATION_FIELD", index: eduIdx, field: "institution", value: e.target.value })}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      label="Début"
                      value={str(edu.startDate)}
                      onChange={(e) => update({ type: "SET_EDUCATION_FIELD", index: eduIdx, field: "startDate", value: e.target.value })}
                    />
                    <Input
                      label="Fin"
                      value={str(edu.endDate)}
                      onChange={(e) => update({ type: "SET_EDUCATION_FIELD", index: eduIdx, field: "endDate", value: e.target.value })}
                    />
                  </div>
                  <Textarea
                    label="Description"
                    value={str(edu.description)}
                    rows={2}
                    placeholder="Description optionnelle..."
                    onChange={(e) => update({ type: "SET_EDUCATION_FIELD", index: eduIdx, field: "description", value: e.target.value })}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => update({ type: "ADD_EDUCATION" })}
                className="w-full"
              >
                + Ajouter une formation
              </Button>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Projets</CardTitle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cvData.showProjects}
                    onChange={() => update({ type: "TOGGLE_SHOW_PROJECTS" })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Afficher sur le CV</span>
                </label>
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${cvData.showProjects ? "" : "opacity-50"}`}>
              <ProjectsEditorContent
                projects={cvData.projects}
                experiences={cvData.experience}
                onAdd={() => update({ type: "ADD_PROJECT" })}
                onToggleHidden={(i) => update({ type: "TOGGLE_PROJECT_HIDDEN", index: i })}
                onRemove={(i) => {
                  if (confirm("Supprimer ce projet ?")) {
                    update({ type: "REMOVE_PROJECT", index: i });
                  }
                }}
                onSetField={(i, field, value) =>
                  update({ type: "SET_PROJECT_FIELD", index: i, field, value })
                }
                onAddTech={(i, value) =>
                  update({ type: "ADD_PROJECT_TECHNOLOGY", index: i, value })
                }
                onRemoveTech={(pi, ti) =>
                  update({ type: "REMOVE_PROJECT_TECHNOLOGY", projectIndex: pi, techIndex: ti })
                }
                onAddHighlight={(i, value) =>
                  update({ type: "ADD_PROJECT_HIGHLIGHT", index: i, value })
                }
                onRemoveHighlight={(pi, hi) =>
                  update({ type: "REMOVE_PROJECT_HIGHLIGHT", projectIndex: pi, highlightIndex: hi })
                }
                onAddLink={(i, label, url) =>
                  update({ type: "ADD_PROJECT_LINK", index: i, label, url })
                }
                onRemoveLink={(pi, li) =>
                  update({ type: "REMOVE_PROJECT_LINK", projectIndex: pi, linkIndex: li })
                }
                onSetLinkField={(pi, li, field, value) =>
                  update({ type: "SET_PROJECT_LINK_FIELD", projectIndex: pi, linkIndex: li, field, value })
                }
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compétences</CardTitle>
                <ShowOnCvToggle
                  checked={!isSectionHidden("skills")}
                  onChange={() => update({ type: "TOGGLE_SECTION", section: "skills" })}
                />
              </div>
            </CardHeader>
            <CardContent className={`space-y-3 ${isSectionHidden("skills") ? "opacity-50" : ""}`}>
              {Object.entries(cvData.skills).map(([category, skillList]) => (
                <div
                  key={category}
                  className={cvData.hiddenSkillCategories?.includes(category) ? "opacity-50" : undefined}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">{category}</label>
                    <ShowOnCvToggle
                      label="Afficher"
                      checked={!cvData.hiddenSkillCategories?.includes(category)}
                      onChange={() => update({ type: "TOGGLE_SKILL_CATEGORY_HIDDEN", category })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skillList.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
                      >
                        {skill}
                        <button
                          onClick={() => update({ type: "REMOVE_SKILL", category, skillIndex: sIdx })}
                          className="hover:text-red-600"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Interests */}
          <InterestsEditor
            interests={cvData.interests}
            onAdd={(v) => update({ type: "ADD_INTEREST", value: v })}
            onRemove={(i) => update({ type: "REMOVE_INTEREST", index: i })}
            onSet={(i, v) => update({ type: "SET_INTEREST", index: i, value: v })}
            hidden={isSectionHidden("interests")}
            onToggleHidden={() => update({ type: "TOGGLE_SECTION", section: "interests" })}
          />
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 overflow-auto bg-gray-100 p-4">
          <div className="mx-auto" style={{ maxWidth: "595px" }}>
            <CvPdfPreview data={cvData} templateId={templateId} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Projects sub-editor ---

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  personal: "Personnel",
  "open-source": "Open-source",
  freelance: "Freelance",
  hackathon: "Hackathon",
  academic: "Académique",
  "side-project": "Side-project",
};

const DISPLAY_MODE_LABELS: Record<ProjectDisplayMode, string> = {
  "projects-section": "Dans le bloc Projets",
  "under-experience": "Sous l'expérience liée",
};

function ProjectsEditorContent({
  projects,
  experiences,
  onAdd,
  onRemove,
  onToggleHidden,
  onSetField,
  onAddTech,
  onRemoveTech,
  onAddHighlight,
  onRemoveHighlight,
  onAddLink,
  onRemoveLink,
  onSetLinkField,
}: {
  projects: CvProject[];
  experiences: CvExperience[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onToggleHidden: (index: number) => void;
  onSetField: (index: number, field: keyof CvProject, value: string) => void;
  onAddTech: (index: number, value: string) => void;
  onRemoveTech: (projectIndex: number, techIndex: number) => void;
  onAddHighlight: (index: number, value: string) => void;
  onRemoveHighlight: (projectIndex: number, highlightIndex: number) => void;
  onAddLink: (index: number, label: string, url: string) => void;
  onRemoveLink: (projectIndex: number, linkIndex: number) => void;
  onSetLinkField: (projectIndex: number, linkIndex: number, field: "label" | "url", value: string) => void;
}) {
  const [newTechs, setNewTechs] = useState<Record<number, string>>({});
  const [newHighlights, setNewHighlights] = useState<Record<number, string>>({});
  const [newLinks, setNewLinks] = useState<Record<number, { label: string; url: string }>>({});
  const sectionShownCount = projects.filter((p) => !p.hidden && isInProjectsSection(p)).length;
  const sectionFull = sectionShownCount >= MAX_SECTION_PROJECTS;

  return (
    <>
      <p className={`text-xs ${sectionShownCount > MAX_SECTION_PROJECTS ? "text-amber-700" : "text-gray-500"}`}>
        {sectionShownCount > MAX_SECTION_PROJECTS
          ? `Seuls les ${MAX_SECTION_PROJECTS} premiers projets du bloc Projets apparaissent sur le CV : masquez-en un ou placez-le sous une expérience.`
          : `Le bloc Projets affiche ${MAX_SECTION_PROJECTS} projets au maximum, côte à côte en bas de page.`}
      </p>
      {projects.map((project, pIdx) => (
        <div key={project.id} className={`space-y-3 pb-4 border-b border-gray-100 last:border-0 ${project.hidden ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {project.name || `Projet ${pIdx + 1}`}
            </span>
            <div className="flex items-center gap-2">
              <ShowOnCvToggle
                label="Afficher"
                checked={!project.hidden}
                onChange={() => onToggleHidden(pIdx)}
                disabled={project.hidden && sectionFull && isInProjectsSection(project)}
                disabledReason={`${MAX_SECTION_PROJECTS} projets déjà affichés dans le bloc Projets`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(pIdx)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Supprimer
              </Button>
            </div>
          </div>

          {/* Identité */}
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              label="Nom du projet"
              value={project.name}
              onChange={(e) => onSetField(pIdx, "name", e.target.value)}
            />
            <Select
              label="Type de projet"
              options={Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              value={project.type}
              onChange={(e) => onSetField(pIdx, "type", e.target.value)}
            />
          </div>

          {/* Contexte */}
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              label="Rôle"
              placeholder="ex: Lead technique, Initiateur"
              value={project.role}
              onChange={(e) => onSetField(pIdx, "role", e.target.value)}
            />
            <Input
              label="URL principale (optionnel)"
              value={str(project.url)}
              placeholder="https://..."
              onChange={(e) => onSetField(pIdx, "url", e.target.value)}
            />
          </div>

          <Textarea
            label="Motivation / Contexte"
            placeholder="Pourquoi ce projet a-t-il été initié ?"
            value={project.motivation}
            rows={2}
            onChange={(e) => onSetField(pIdx, "motivation", e.target.value)}
          />

          {/* Description */}
          <Textarea
            label="Description"
            value={project.description}
            rows={2}
            onChange={(e) => onSetField(pIdx, "description", e.target.value)}
          />

          {/* Technologies */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Technologies</label>
            <div className="flex flex-wrap gap-1">
              {project.technologies.map((tech, tIdx) => (
                <span
                  key={tIdx}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
                >
                  {tech}
                  <button
                    onClick={() => onRemoveTech(pIdx, tIdx)}
                    className="hover:text-red-600"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Nouvelle technologie"
                value={newTechs[pIdx] ?? ""}
                onChange={(e) => setNewTechs({ ...newTechs, [pIdx]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (newTechs[pIdx] ?? "").trim()) {
                    e.preventDefault();
                    onAddTech(pIdx, newTechs[pIdx].trim());
                    setNewTechs({ ...newTechs, [pIdx]: "" });
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if ((newTechs[pIdx] ?? "").trim()) {
                    onAddTech(pIdx, newTechs[pIdx].trim());
                    setNewTechs({ ...newTechs, [pIdx]: "" });
                  }
                }}
              >
                + Ajouter
              </Button>
            </div>
          </div>

          {/* Highlights techniques */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Points clés techniques</label>
            <div className="flex flex-wrap gap-1">
              {project.highlights.map((highlight, hIdx) => (
                <span
                  key={hIdx}
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700"
                >
                  {highlight}
                  <button
                    onClick={() => onRemoveHighlight(pIdx, hIdx)}
                    className="hover:text-red-600"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Défi technique résolu..."
                value={newHighlights[pIdx] ?? ""}
                onChange={(e) => setNewHighlights({ ...newHighlights, [pIdx]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (newHighlights[pIdx] ?? "").trim()) {
                    e.preventDefault();
                    onAddHighlight(pIdx, newHighlights[pIdx].trim());
                    setNewHighlights({ ...newHighlights, [pIdx]: "" });
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if ((newHighlights[pIdx] ?? "").trim()) {
                    onAddHighlight(pIdx, newHighlights[pIdx].trim());
                    setNewHighlights({ ...newHighlights, [pIdx]: "" });
                  }
                }}
              >
                + Ajouter
              </Button>
            </div>
          </div>

          {/* Impact */}
          <Textarea
            label="Impact / Résultats mesurables"
            placeholder="ex: Réduction de 40% du temps de traitement, 500+ utilisateurs"
            value={project.impact}
            rows={2}
            onChange={(e) => onSetField(pIdx, "impact", e.target.value)}
          />

          {/* Liens multiples */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Liens</label>
            {project.links.map((link, lIdx) => (
              <div key={lIdx} className="flex gap-1">
                <Input
                  placeholder="Label (ex: Repo, Démo)"
                  value={link.label}
                  onChange={(e) => onSetLinkField(pIdx, lIdx, "label", e.target.value)}
                  className="w-1/3"
                />
                <Input
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => onSetLinkField(pIdx, lIdx, "url", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveLink(pIdx, lIdx)}
                  className="shrink-0 text-red-400"
                >
                  x
                </Button>
              </div>
            ))}
            <div className="flex gap-1">
              <Input
                placeholder="Label"
                value={newLinks[pIdx]?.label ?? ""}
                onChange={(e) =>
                  setNewLinks({ ...newLinks, [pIdx]: { ...newLinks[pIdx], label: e.target.value, url: newLinks[pIdx]?.url ?? "" } })
                }
                className="w-1/3"
              />
              <Input
                placeholder="https://..."
                value={newLinks[pIdx]?.url ?? ""}
                onChange={(e) =>
                  setNewLinks({ ...newLinks, [pIdx]: { label: newLinks[pIdx]?.label ?? "", url: e.target.value } })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (newLinks[pIdx]?.label ?? "").trim() && (newLinks[pIdx]?.url ?? "").trim()) {
                    e.preventDefault();
                    onAddLink(pIdx, newLinks[pIdx].label.trim(), newLinks[pIdx].url.trim());
                    setNewLinks({ ...newLinks, [pIdx]: { label: "", url: "" } });
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if ((newLinks[pIdx]?.label ?? "").trim() && (newLinks[pIdx]?.url ?? "").trim()) {
                    onAddLink(pIdx, newLinks[pIdx].label.trim(), newLinks[pIdx].url.trim());
                    setNewLinks({ ...newLinks, [pIdx]: { label: "", url: "" } });
                  }
                }}
              >
                + Ajouter
              </Button>
            </div>
          </div>

          {/* Lien expérience */}
          <div className="space-y-2 rounded-md bg-gray-50 p-3">
            <label className="text-sm font-medium text-gray-700">Lier à une expérience (optionnel)</label>
            <Select
              options={[
                { value: "", label: "Aucune expérience liée" },
                ...experiences.map((exp) => ({
                  value: exp.id,
                  label: `${exp.position}${exp.company ? ` — ${exp.company}` : ""}`,
                })),
              ]}
              value={project.linkedExperienceId ?? ""}
              onChange={(e) => onSetField(pIdx, "linkedExperienceId", e.target.value || "")}
            />
            {project.linkedExperienceId && (
              <Select
                label="Mode d'affichage"
                options={Object.entries(DISPLAY_MODE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={project.displayMode}
                onChange={(e) => onSetField(pIdx, "displayMode", e.target.value)}
              />
            )}
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="w-full"
      >
        + Ajouter un projet
      </Button>
    </>
  );
}

// --- Banner appearance sub-editor ---

const TEMPLATE_DEFAULTS: Record<string, { bg: string; text: string }> = {
  modern: { bg: "#0f172a", text: "#ffffff" },
  classic: { bg: "#ffffff", text: "#1a1a1a" },
  minimalist: { bg: "#ffffff", text: "#222222" },
  elegant: { bg: "#0f172a", text: "#ffffff" },
};

function BannerAppearanceEditor({
  bgColor,
  textColor,
  bgImage,
  bgImagePosition,
  onBgColorChange,
  onTextColorChange,
  onBgImageChange,
  onBgImagePositionChange,
  templateId,
}: {
  bgColor: string | null;
  textColor: string | null;
  bgImage: string | null;
  bgImagePosition: ImagePosition | null;
  onBgColorChange: (v: string | null) => void;
  onTextColorChange: (v: string | null) => void;
  onBgImageChange: (v: string | null) => void;
  onBgImagePositionChange: (v: ImagePosition | null) => void;
  templateId: string;
}) {
  const defaults = TEMPLATE_DEFAULTS[templateId] || TEMPLATE_DEFAULTS.modern;
  const currentBg = bgColor || defaults.bg;
  const currentText = textColor || defaults.text;
  const fileRef = useRef<HTMLInputElement>(null);

  const effectivePosition = bgImagePosition ?? { x: 50, y: 50 };
  const { isDragging, position, handlers: dragHandlers } = useDragReposition({
    position: effectivePosition,
    onPositionChange: (pos) => onBgImagePositionChange(pos),
    enabled: !!bgImage,
  });

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert("Format non supporté. Utilisez une image JPEG ou PNG.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      alert("Image trop volumineuse (max 1 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => onBgImageChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Apparence du bandeau</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div
          className="rounded-md px-4 py-3 text-sm relative overflow-hidden select-none"
          style={{
            backgroundColor: currentBg,
            color: currentText,
            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: bgImage ? "cover" : undefined,
            backgroundPosition: bgImage ? `${position.x}% ${position.y}%` : undefined,
            backgroundRepeat: "no-repeat",
            cursor: bgImage ? (isDragging ? "grabbing" : "grab") : undefined,
            touchAction: bgImage ? "none" : undefined,
            minHeight: "80px",
          }}
          {...(bgImage ? dragHandlers : {})}
        >
          <p className="font-bold relative z-10">Aperçu du bandeau</p>
          <p className="text-xs opacity-80 relative z-10">email@exemple.com · 06 00 00 00 00 · Paris</p>
          {bgImage && !isDragging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                Glissez pour repositionner
              </span>
            </div>
          )}
        </div>

        {/* Color pickers */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Couleur de fond
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentBg}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-mono">{currentBg}</span>
              {bgColor && (
                <button
                  onClick={() => onBgColorChange(null)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Couleur du texte
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentText}
                onChange={(e) => onTextColorChange(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-mono">{currentText}</span>
              {textColor && (
                <button
                  onClick={() => onTextColorChange(null)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Background image upload */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Image de fond du bandeau
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              {bgImage ? "Changer l'image" : "Ajouter une image"}
            </Button>
            {bgImage && (
              <button
                onClick={() => onBgImageChange(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Supprimer l&apos;image
              </button>
            )}
            {bgImage && bgImagePosition && (
              <button
                onClick={() => onBgImagePositionChange(null)}
                className="text-xs text-blue-600 hover:underline"
              >
                Recentrer l&apos;image
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 1 Mo.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Interests sub-editor ---

function InterestsEditor({
  interests,
  onAdd,
  onRemove,
  onSet,
  hidden,
  onToggleHidden,
}: {
  interests: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  onSet: (index: number, value: string) => void;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  const [newInterest, setNewInterest] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Centres d&apos;intérêts</CardTitle>
          <ShowOnCvToggle checked={!hidden} onChange={onToggleHidden} />
        </div>
      </CardHeader>
      <CardContent className={`space-y-2 ${hidden ? "opacity-50" : ""}`}>
        {interests.map((interest, i) => (
          <div key={i} className="flex gap-1">
            <Input
              value={interest}
              onChange={(e) => onSet(i, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(i)}
              className="shrink-0 text-red-400"
            >
              x
            </Button>
          </div>
        ))}
        <div className="flex gap-1">
          <Input
            placeholder="Nouvel intérêt"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newInterest.trim()) {
                onAdd(newInterest.trim());
                setNewInterest("");
              }
            }}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (newInterest.trim()) {
                onAdd(newInterest.trim());
                setNewInterest("");
              }
            }}
          >
            + Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Visibility toggle ---

/** Checkbox deciding whether a section or an item appears in the PDF. */
function ShowOnCvToggle({
  checked,
  onChange,
  label = "Afficher sur le CV",
  disabled = false,
  disabledReason,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <label
      className={`flex items-center gap-2 text-sm text-gray-700 shrink-0 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      title={disabled ? disabledReason : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}
