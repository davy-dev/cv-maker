import { customSectionId, moveSection, resolveLayout } from "@/lib/cv/layout";
import type { CvColumn, CvCustomSection, CvData, CvExperience, CvEducation, CvProject, CvSection, ImagePosition, SectionId } from "@/types/cv";

export type CvAction =
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
  | { type: "SET_HEADER_BG_IMAGE_POSITION"; value: ImagePosition | null }
  /** `id` lets the caller select the new section right away */
  | { type: "ADD_CUSTOM_SECTION"; title: string; id?: string }
  | { type: "REMOVE_CUSTOM_SECTION"; id: string }
  | { type: "SET_CUSTOM_SECTION_FIELD"; id: string; field: "title" | "content"; value: string }
  | { type: "TOGGLE_CUSTOM_SECTION_HIDDEN"; id: string }
  | { type: "MOVE_SECTION"; section: SectionId; column: CvColumn; index: number };

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
  ADD_CUSTOM_SECTION: (state, action) => {
    const a = action as Extract<CvAction, { type: "ADD_CUSTOM_SECTION" }>;
    const section: CvCustomSection = { id: a.id ?? crypto.randomUUID(), title: a.title, content: "" };
    return { ...state, customSections: [...(state.customSections ?? []), section] };
  },
  REMOVE_CUSTOM_SECTION: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_CUSTOM_SECTION" }>;
    const section = customSectionId(a.id);
    return {
      ...state,
      customSections: state.customSections?.filter((s) => s.id !== a.id),
      layout: state.layout && {
        main: state.layout.main.filter((id) => id !== section),
        aside: state.layout.aside.filter((id) => id !== section),
      },
    };
  },
  SET_CUSTOM_SECTION_FIELD: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_CUSTOM_SECTION_FIELD" }>;
    return {
      ...state,
      customSections: state.customSections?.map((s) => (s.id === a.id ? { ...s, [a.field]: a.value } : s)),
    };
  },
  TOGGLE_CUSTOM_SECTION_HIDDEN: (state, action) => {
    const a = action as Extract<CvAction, { type: "TOGGLE_CUSTOM_SECTION_HIDDEN" }>;
    return {
      ...state,
      customSections: state.customSections?.map((s) => (s.id === a.id ? { ...s, hidden: !s.hidden } : s)),
    };
  },
  MOVE_SECTION: (state, action) => {
    const a = action as Extract<CvAction, { type: "MOVE_SECTION" }>;
    return { ...state, layout: moveSection(resolveLayout(state), a.section, a.column, a.index) };
  },
};

function toggle<T>(list: T[] | undefined, value: T): T[] {
  return list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value];
}

/** Every edit to a CV goes through this reducer. */
export function cvReducer(state: CvData, action: CvAction): CvData {
  const handler = cvActionHandlers[action.type];
  return handler ? handler(state, action) : state;
}

export type CvDispatch = (action: CvAction) => void;
