import type { CvData, CvProject } from "@/types/cv";

export function isInProjectsSection(project: CvProject): boolean {
  return !project.displayMode || project.displayMode === "projects-section";
}

/**
 * The CV as it is printed: hidden sections and items are removed.
 * Used for both the preview and the download, so they always match.
 */
export function applyVisibility(data: CvData): CvData {
  const hidden = new Set(data.hiddenSections ?? []);
  const hiddenCategories = new Set(data.hiddenSkillCategories ?? []);

  const projects = data.showProjects ? data.projects.filter((p) => !p.hidden) : [];
  const experience = hidden.has("experience") ? [] : data.experience.filter((e) => !e.hidden);
  const experienceIds = new Set(experience.map((e) => e.id));

  return {
    ...data,
    summary: hidden.has("summary") ? "" : data.summary,
    experience,
    education: hidden.has("education") ? [] : data.education.filter((e) => !e.hidden),
    skills: hidden.has("skills")
      ? {}
      : Object.fromEntries(
          Object.entries(data.skills).filter(([category]) => !hiddenCategories.has(category))
        ),
    // A project shown under an experience that is hidden goes back to the projects section
    projects: projects.map((p) =>
      p.displayMode === "under-experience" && (!p.linkedExperienceId || !experienceIds.has(p.linkedExperienceId))
        ? { ...p, displayMode: "projects-section" }
        : p
    ),
    interests: hidden.has("interests") ? [] : data.interests,
    customSections: data.customSections?.filter((s) => !s.hidden),
  };
}
