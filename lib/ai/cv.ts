import { parseList, type FactCatalog } from "./facts";
import type { CvDraft, SourcedText } from "./schemas";
import type { Claim } from "./verify";
import { MAX_SECTION_PROJECTS } from "@/lib/cv/visibility";
import type { CvData, CvExperience, CvProject, ProjectLink, ProjectType } from "@/types/cv";

/**
 * Builds the editor's CvData from the database and the verified draft.
 * Facts (companies, positions, dates, degrees, project names, links, skills)
 * always come from the database. Claude's sentences are kept only when they
 * passed verification; otherwise the candidate's own words are used.
 * Experiences and projects Claude left out are kept, hidden, so the user can
 * show them again from the editor. The projects section shows at most
 * MAX_SECTION_PROJECTS of Claude's picks; the others are hidden the same way.
 */
export function assembleCv(
  draft: CvDraft,
  catalog: FactCatalog,
  claims: Claim[],
  acceptedIds: Set<string>
): CvData {
  const { user, experiences, educations, projects, skills } = catalog.source;
  const accepted = (text: SourcedText) =>
    claims.some((c) => acceptedIds.has(c.id) && c.text === text.text && c.sourceIds === text.sourceIds);
  const keep = (texts: SourcedText[]) => texts.filter(accepted).map((t) => t.text);

  // --- Experiences: Claude's order first, then the others hidden
  const chosenExperiences = new Map((draft.experiences ?? []).map((e) => [e.experienceId, e]));
  const experienceOrder = [
    ...chosenExperiences.keys(),
    ...[...experiences].sort((a, b) => a.sortOrder - b.sortOrder).map((e) => e.id),
  ].filter((id, index, all) => all.indexOf(id) === index);

  const experience: CvExperience[] = experienceOrder.map((id) => {
    const row = experiences.find((e) => e.id === id)!;
    const chosen = chosenExperiences.get(id);
    const ownWords = parseList(row.achievements).length
      ? parseList(row.achievements)
      : row.description
        ? [row.description]
        : [];
    const bullets = chosen ? keep(chosen.bullets) : [];
    return {
      id,
      company: row.company,
      position: row.position,
      location: row.location ?? "",
      startDate: row.startDate,
      endDate: row.endDate ?? "Présent",
      // Every rewritten bullet rejected: fall back to the candidate's own achievements
      bullets: bullets.length ? bullets : ownWords,
      ...(!chosen && { hidden: true }),
    };
  });

  // --- Projects: same principle
  const chosenProjects = new Map((draft.projects ?? []).map((p) => [p.projectId, p]));
  const projectOrder = [
    ...chosenProjects.keys(),
    ...[...projects].sort((a, b) => a.sortOrder - b.sortOrder).map((p) => p.id),
  ].filter((id, index, all) => all.indexOf(id) === index);

  let sectionProjectsShown = 0;
  const cvProjects: CvProject[] = projectOrder.map((id) => {
    const row = projects.find((p) => p.id === id)!;
    const chosen = chosenProjects.get(id);
    const description = chosen && accepted(chosen.description) ? chosen.description.text : (row.description ?? "");
    const highlights = chosen ? keep(chosen.highlights) : [];
    const linkedExperienceId = experience.some((e) => e.id === row.linkedExperienceId)
      ? row.linkedExperienceId
      : null;
    const displayMode = linkedExperienceId && row.displayMode === "under-experience" ? "under-experience" : "projects-section";
    const shown =
      !!chosen && (displayMode === "under-experience" || ++sectionProjectsShown <= MAX_SECTION_PROJECTS);
    return {
      id,
      name: row.name,
      description,
      technologies: parseList(row.technologies),
      url: row.url,
      type: row.type as ProjectType,
      role: row.role ?? "",
      impact: row.impact ?? "",
      highlights: highlights.length ? highlights : parseList(row.highlights),
      motivation: row.motivation ?? "",
      links: parseLinks(row.links),
      linkedExperienceId,
      displayMode,
      ...(!shown && { hidden: true }),
    };
  });

  // --- Skills: only the candidate's, grouped by Claude; any left out stay available, hidden
  const cvSkills: Record<string, string[]> = {};
  for (const { category, items } of draft.skills ?? []) {
    const unique = [...new Set(items)].filter((item) => !Object.values(cvSkills).flat().includes(item));
    if (unique.length) cvSkills[category] = [...(cvSkills[category] ?? []), ...unique];
  }
  const placed = new Set(Object.values(cvSkills).flat());
  const leftOut = skills.map((s) => s.name).filter((name) => !placed.has(name));
  const hiddenSkillCategories: string[] = [];
  if (leftOut.length) {
    const category = "Autres compétences";
    cvSkills[category] = leftOut;
    hiddenSkillCategories.push(category);
  }

  const summary = keep(draft.summary).join(" ") || (user.summary ?? "");
  const title = accepted(draft.title) ? draft.title.text : (user.title ?? "");

  return {
    header: {
      name: user.name ?? "",
      title,
      email: user.email,
      phone: user.phone ?? "",
      location: user.location ?? "",
      website: user.website,
      linkedin: user.linkedin,
      github: user.github,
      image: user.image,
    },
    summary,
    yearsExperience: yearsOfExperience(experiences),
    showPhoto: !!user.image,
    showProjects: true,
    headerBgColor: null,
    headerTextColor: null,
    headerBgImage: null,
    headerBgImagePosition: null,
    experience,
    education: [...educations]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        id: row.id,
        institution: row.institution,
        degree: row.degree,
        field: row.field,
        startDate: row.startDate,
        endDate: row.endDate ?? "En cours",
        description: row.description ?? "",
      })),
    skills: cvSkills,
    projects: cvProjects,
    // Not in the profile: never generated, the user can add some in the editor
    interests: [],
    hiddenSkillCategories,
  };
}

function parseLinks(json: string | null): ProjectLink[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value)
      ? value.filter((l) => typeof l?.label === "string" && typeof l?.url === "string")
      : [];
  } catch {
    return [];
  }
}

/** "5 ans d'expérience", computed from the real dates (overlaps counted once). */
export function yearsOfExperience(
  rows: { startDate: string; endDate: string | null }[],
  now = new Date()
): string {
  const toMonth = (value: string | null, fallback: number | null) => {
    if (!value) return fallback;
    const match = value.match(/^(\d{4})(?:-(\d{1,2}))?/);
    return match ? Number(match[1]) * 12 + (match[2] ? Number(match[2]) - 1 : 0) : null;
  };
  const current = now.getFullYear() * 12 + now.getMonth();
  const intervals = rows
    .map((r) => [toMonth(r.startDate, null), toMonth(r.endDate, current)] as const)
    .filter((i): i is readonly [number, number] => i[0] !== null && i[1] !== null && i[1] >= i[0])
    .sort((a, b) => a[0] - b[0]);
  if (!intervals.length) return "";

  let months = 0;
  let [start, end] = intervals[0];
  for (const [s, e] of intervals.slice(1)) {
    if (s <= end) end = Math.max(end, e);
    else {
      months += end - start + 1;
      [start, end] = [s, e];
    }
  }
  months += end - start + 1;

  const years = Math.floor(months / 12);
  if (years < 1) return "Moins d'un an d'expérience";
  return `${years} an${years > 1 ? "s" : ""} d'expérience`;
}
