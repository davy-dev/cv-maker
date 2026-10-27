import { clampPhotoRadius } from "@/lib/cv/reducer";
import type { CvData, CvLayout, CvSection } from "@/types/cv";

export function emptyCvData(): CvData {
  return {
    header: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      website: null,
      linkedin: null,
      github: null,
      image: null,
    },
    summary: "",
    yearsExperience: "",
    showPhoto: false,
    showProjects: true,
    headerBgColor: null,
    headerTextColor: null,
    headerBgImage: null,
    headerBgImagePosition: null,
    experience: [],
    education: [],
    skills: {},
    projects: [],
    interests: [],
  };
}

/**
 * Reads a stored CV, filling in every field missing from older CVs
 * (cvData is "{}" before generation). Invalid JSON gives an empty CV.
 */
export function normalizeCvData(json: string): CvData {
  const empty = emptyCvData();
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return empty;
  }
  if (!parsed || typeof parsed !== "object") return empty;

  return {
    header: { ...empty.header, ...parsed.header },
    summary: parsed.summary ?? "",
    yearsExperience: parsed.yearsExperience ?? "",
    showPhoto: parsed.showPhoto ?? false,
    ...(typeof parsed.photoRadius === "number" ? { photoRadius: clampPhotoRadius(parsed.photoRadius) } : {}),
    showProjects: parsed.showProjects ?? true,
    headerBgColor: parsed.headerBgColor ?? null,
    headerTextColor: parsed.headerTextColor ?? null,
    headerBgImage: parsed.headerBgImage ?? null,
    headerBgImagePosition: parsed.headerBgImagePosition ?? null,
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    skills: parsed.skills && typeof parsed.skills === "object" ? parsed.skills : {},
    projects: Array.isArray(parsed.projects)
      ? parsed.projects.map((p: Record<string, unknown>) => ({
          id: p.id ?? crypto.randomUUID(),
          name: p.name ?? "",
          description: p.description ?? "",
          technologies: Array.isArray(p.technologies) ? p.technologies : [],
          url: p.url ?? null,
          type: p.type ?? "personal",
          role: p.role ?? "",
          impact: p.impact ?? "",
          highlights: Array.isArray(p.highlights) ? p.highlights : [],
          motivation: p.motivation ?? "",
          links: Array.isArray(p.links) ? p.links : [],
          linkedExperienceId: p.linkedExperienceId ?? null,
          displayMode: p.displayMode ?? "projects-section",
          ...(p.hidden ? { hidden: true } : {}),
        }))
      : [],
    interests: Array.isArray(parsed.interests) ? parsed.interests : [],
    ...(Array.isArray(parsed.hiddenSections)
      ? { hiddenSections: parsed.hiddenSections as CvSection[] }
      : {}),
    ...(Array.isArray(parsed.customSections)
      ? {
          customSections: parsed.customSections.map((s: Record<string, unknown>) => ({
            id: typeof s.id === "string" ? s.id : crypto.randomUUID(),
            title: typeof s.title === "string" ? s.title : "",
            content: typeof s.content === "string" ? s.content : "",
            ...(s.hidden ? { hidden: true } : {}),
          })),
        }
      : {}),
    // Kept as stored: resolveLayout() drops what no longer exists
    ...(parsed.layout && typeof parsed.layout === "object"
      ? { layout: parsed.layout as CvLayout }
      : {}),
    ...(Array.isArray(parsed.hiddenSkillCategories)
      ? { hiddenSkillCategories: parsed.hiddenSkillCategories as string[] }
      : {}),
  };
}

/** Whether the CV was generated yet: before, it is stored as "{}". */
export function isGeneratedCv(json: string): boolean {
  try {
    return Boolean(JSON.parse(json)?.header);
  } catch {
    return false;
  }
}
