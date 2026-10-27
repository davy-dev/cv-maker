import { customSectionId, insertBefore, moveSection, resolveLayout } from "@/lib/cv/layout";
import type { CvColumn, CvCustomSection, CvData, CvExperience, CvEducation, CvProject, CvSection, ImagePosition, SectionId } from "@/types/cv";

export type CvAction =
  | { type: "SET_HEADER_FIELD"; field: keyof CvData["header"]; value: string | null }
  | { type: "SET_SUMMARY"; value: string }
  | { type: "SET_YEARS_EXPERIENCE"; value: string }
  | { type: "ADD_EXPERIENCE"; id?: string }
  | { type: "REMOVE_EXPERIENCE"; index: number }
  | { type: "SET_EXPERIENCE_FIELD"; index: number; field: keyof CvExperience; value: string }
  | { type: "SET_EXPERIENCE_BULLET"; expIndex: number; bulletIndex: number; value: string }
  | { type: "ADD_EXPERIENCE_BULLET"; expIndex: number }
  | { type: "REMOVE_EXPERIENCE_BULLET"; expIndex: number; bulletIndex: number }
  | { type: "INSERT_EXPERIENCE_BULLET"; expIndex: number; bulletIndex: number }
  | { type: "ADD_EDUCATION"; id?: string }
  | { type: "REMOVE_EDUCATION"; index: number }
  | { type: "SET_EDUCATION_FIELD"; index: number; field: keyof CvEducation; value: string }
  | { type: "SET_SKILL_CATEGORY"; oldCategory: string; newCategory: string }
  | { type: "ADD_SKILL"; category: string; skill: string }
  | { type: "REMOVE_SKILL"; category: string; skillIndex: number }
  | { type: "SET_SKILLS"; category: string; skills: string[] }
  | { type: "ADD_PROJECT"; id?: string }
  | { type: "REMOVE_PROJECT"; index: number }
  | { type: "SET_PROJECT_FIELD"; index: number; field: keyof CvProject; value: string }
  | { type: "ADD_PROJECT_TECHNOLOGY"; index: number; value: string }
  | { type: "REMOVE_PROJECT_TECHNOLOGY"; projectIndex: number; techIndex: number }
  | { type: "ADD_PROJECT_HIGHLIGHT"; index: number; value: string }
  | { type: "REMOVE_PROJECT_HIGHLIGHT"; projectIndex: number; highlightIndex: number }
  | { type: "SET_PROJECT_HIGHLIGHT"; projectIndex: number; highlightIndex: number; value: string }
  | { type: "INSERT_PROJECT_HIGHLIGHT"; projectIndex: number; highlightIndex: number }
  | { type: "ADD_PROJECT_LINK"; index: number; label: string; url: string }
  | { type: "REMOVE_PROJECT_LINK"; projectIndex: number; linkIndex: number }
  | { type: "SET_PROJECT_LINK_FIELD"; projectIndex: number; linkIndex: number; field: "label" | "url"; value: string }
  | { type: "ADD_INTEREST"; value: string }
  | { type: "REMOVE_INTEREST"; index: number }
  | { type: "SET_INTEREST"; index: number; value: string }
  | { type: "INSERT_INTEREST"; index: number }
  | { type: "TOGGLE_SHOW_PHOTO" }
  | { type: "SET_PHOTO_RADIUS"; value: number }
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
  /** `before`: the section to land in front of; null for the end of the column */
  | { type: "MOVE_SECTION"; section: SectionId; column: CvColumn; before: SectionId | null }
  /** Reorders an entry within its section; `id` is the category name for skills */
  | { type: "MOVE_ITEM"; section: "experience" | "education" | "projects" | "skills"; id: string; before: string | null }
  /** Reorders the points of an experience or a project; `before` is an index, the list's length for the end */
  | { type: "REMOVE_SKILL_CATEGORY"; category: string }
  /** Copies an entry right after itself; `newId` is the copy's id (its name, for a skill category) */
  | { type: "DUPLICATE_ITEM"; section: "experience" | "education" | "projects" | "skills"; id: string; newId: string }
  | { type: "DUPLICATE_CUSTOM_SECTION"; id: string; newId: string }
  | { type: "MOVE_BULLET"; list: "experience" | "project"; id: string; from: number; before: number };

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
  ADD_EXPERIENCE: (state, action) => ({
    ...state,
    experience: [
      ...state.experience,
      {
        id: (action as Extract<CvAction, { type: "ADD_EXPERIENCE" }>).id ?? crypto.randomUUID(),
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
  INSERT_EXPERIENCE_BULLET: (state, action) => {
    const a = action as Extract<CvAction, { type: "INSERT_EXPERIENCE_BULLET" }>;
    const experience = [...state.experience];
    const bullets = [...experience[a.expIndex].bullets];
    bullets.splice(a.bulletIndex, 0, "");
    experience[a.expIndex] = { ...experience[a.expIndex], bullets };
    return { ...state, experience };
  },
  ADD_EDUCATION: (state, action) => ({
    ...state,
    education: [
      ...state.education,
      {
        id: (action as Extract<CvAction, { type: "ADD_EDUCATION" }>).id ?? crypto.randomUUID(),
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
  SET_SKILLS: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_SKILLS" }>;
    return { ...state, skills: { ...state.skills, [a.category]: a.skills } };
  },
  SET_SKILL_CATEGORY: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_SKILL_CATEGORY" }>;
    // Renamed in place: the category keeps its position on the CV
    const skills = Object.fromEntries(
      Object.entries(state.skills).map(([category, list]) => [category === a.oldCategory ? a.newCategory : category, list])
    );
    // A hidden category stays hidden under its new name
    const hiddenSkillCategories = state.hiddenSkillCategories?.map((c) =>
      c === a.oldCategory ? a.newCategory : c
    );
    return { ...state, skills, hiddenSkillCategories };
  },
  ADD_PROJECT: (state, action) => ({
    ...state,
    projects: [
      ...state.projects,
      {
        id: (action as Extract<CvAction, { type: "ADD_PROJECT" }>).id ?? crypto.randomUUID(),
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
  SET_PROJECT_HIGHLIGHT: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_PROJECT_HIGHLIGHT" }>;
    const projects = [...state.projects];
    const highlights = [...projects[a.projectIndex].highlights];
    highlights[a.highlightIndex] = a.value;
    projects[a.projectIndex] = { ...projects[a.projectIndex], highlights };
    return { ...state, projects };
  },
  INSERT_PROJECT_HIGHLIGHT: (state, action) => {
    const a = action as Extract<CvAction, { type: "INSERT_PROJECT_HIGHLIGHT" }>;
    const projects = [...state.projects];
    const highlights = [...projects[a.projectIndex].highlights];
    highlights.splice(a.highlightIndex, 0, "");
    projects[a.projectIndex] = { ...projects[a.projectIndex], highlights };
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
  INSERT_INTEREST: (state, action) => {
    const a = action as Extract<CvAction, { type: "INSERT_INTEREST" }>;
    const interests = [...state.interests];
    interests.splice(a.index, 0, "");
    return { ...state, interests };
  },
  TOGGLE_SHOW_PHOTO: (state) => ({ ...state, showPhoto: !state.showPhoto }),
  SET_PHOTO_RADIUS: (state, action) => {
    const a = action as Extract<CvAction, { type: "SET_PHOTO_RADIUS" }>;
    return { ...state, photoRadius: clampPhotoRadius(a.value) };
  },
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
    const layout = resolveLayout(state);
    const moved = moveSection(layout, a.section, a.column, a.before);
    // Dropped where it already was: no new state, so no undo step and no save
    const same = (["main", "aside"] as const).every((c) => moved[c].join() === layout[c].join());
    return same ? state : { ...state, layout: moved };
  },
  MOVE_ITEM: (state, action) => {
    const a = action as Extract<CvAction, { type: "MOVE_ITEM" }>;
    if (a.id === a.before) return state;
    if (a.section === "skills") {
      if (!(a.id in state.skills)) return state;
      const order = insertBefore(Object.keys(state.skills).filter((c) => c !== a.id), a.id, a.before);
      if (order.join("\n") === Object.keys(state.skills).join("\n")) return state;
      return { ...state, skills: Object.fromEntries(order.map((c) => [c, state.skills[c]])) };
    }
    const reorder = <T extends { id: string }>(list: T[]): T[] => {
      const item = list.find((e) => e.id === a.id);
      if (!item) return list;
      const rest = list.filter((e) => e.id !== a.id);
      const before = rest.find((e) => e.id === a.before) ?? null;
      const result = insertBefore(rest, item, before);
      return result.every((e, i) => e === list[i]) ? list : result;
    };
    const key = a.section === "projects" ? "projects" : a.section;
    const list = state[key];
    const reordered = reorder<(typeof list)[number]>(list);
    return reordered === list ? state : { ...state, [key]: reordered };
  },
  REMOVE_SKILL_CATEGORY: (state, action) => {
    const a = action as Extract<CvAction, { type: "REMOVE_SKILL_CATEGORY" }>;
    const skills = { ...state.skills };
    delete skills[a.category];
    return {
      ...state,
      skills,
      hiddenSkillCategories: state.hiddenSkillCategories?.filter((c) => c !== a.category),
    };
  },
  DUPLICATE_ITEM: (state, action) => {
    const a = action as Extract<CvAction, { type: "DUPLICATE_ITEM" }>;
    if (a.section === "skills") {
      if (!(a.id in state.skills) || a.newId in state.skills) return state;
      const entries = Object.entries(state.skills);
      const index = entries.findIndex(([category]) => category === a.id);
      entries.splice(index + 1, 0, [a.newId, [...state.skills[a.id]]]);
      return { ...state, skills: Object.fromEntries(entries) };
    }
    const copyAfter = <T extends { id: string }>(list: T[]): T[] => {
      const index = list.findIndex((e) => e.id === a.id);
      if (index < 0) return list;
      const copy = structuredClone(list[index]);
      copy.id = a.newId;
      return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
    };
    if (a.section === "experience") return { ...state, experience: copyAfter(state.experience) };
    if (a.section === "education") return { ...state, education: copyAfter(state.education) };
    return { ...state, projects: copyAfter(state.projects) };
  },
  DUPLICATE_CUSTOM_SECTION: (state, action) => {
    const a = action as Extract<CvAction, { type: "DUPLICATE_CUSTOM_SECTION" }>;
    const sections = state.customSections ?? [];
    const index = sections.findIndex((s) => s.id === a.id);
    if (index < 0) return state;
    const copy = { ...sections[index], id: a.newId };
    // The copy sits right under the original, in the same column
    const layout = resolveLayout(state);
    const original = customSectionId(a.id);
    const column = layout.main.includes(original) ? "main" : "aside";
    const after = layout[column][layout[column].indexOf(original) + 1] ?? null;
    return {
      ...state,
      customSections: [...sections.slice(0, index + 1), copy, ...sections.slice(index + 1)],
      layout: moveSection(layout, customSectionId(a.newId), column, after),
    };
  },
  MOVE_BULLET: (state, action) => {
    const a = action as Extract<CvAction, { type: "MOVE_BULLET" }>;
    // Index once the moved point is taken out of the list
    const to = a.before > a.from ? a.before - 1 : a.before;
    if (to === a.from) return state;
    const move = (list: string[]) => {
      const result = [...list];
      const [item] = result.splice(a.from, 1);
      result.splice(to, 0, item);
      return result;
    };
    if (a.list === "experience") {
      return {
        ...state,
        experience: state.experience.map((e) => (e.id === a.id ? { ...e, bullets: move(e.bullets) } : e)),
      };
    }
    return {
      ...state,
      projects: state.projects.map((p) => (p.id === a.id ? { ...p, highlights: move(p.highlights) } : p)),
    };
  },
};

/** A radius from 0 (square) to 50 % (round); anything else falls back to round. */
export function clampPhotoRadius(value: number): number {
  return Number.isFinite(value) ? Math.min(50, Math.max(0, Math.round(value))) : 50;
}

function toggle<T>(list: T[] | undefined, value: T): T[] {
  return list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value];
}

/** Every edit to a CV goes through this reducer. */
export function cvReducer(state: CvData, action: CvAction): CvData {
  const handler = cvActionHandlers[action.type];
  return handler ? handler(state, action) : state;
}

export type CvDispatch = (action: CvAction) => void;
