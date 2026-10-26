import type { JobAnalysis } from "@/types/job";
import type { CvData } from "@/types/cv";

export function buildJobAnalysis(
  overrides: Partial<JobAnalysis> = {}
): JobAnalysis {
  return {
    jobTitle: "Développeur Full-Stack",
    company: "Acme",
    jobSummary: "Construire des applications web.",
    requiredSkills: ["TypeScript", "React"],
    niceToHaveSkills: ["Docker"],
    matchedSkills: [
      { skill: "TypeScript", relevance: "high", context: "Langage principal" },
    ],
    missingSkills: [
      { skill: "Kubernetes", importance: "nice-to-have", suggestion: "Docker" },
    ],
    matchScore: 80,
    tailoringAdvice: "Mettre en avant React.",
    keywordsToInclude: ["TypeScript", "API"],
    ...overrides,
  };
}

export function buildCvData(overrides: Partial<CvData> = {}): CvData {
  return {
    header: {
      name: "Jean Dupont",
      title: "Développeur",
      email: "jean@exemple.com",
      phone: "0600000000",
      location: "Lyon",
      website: null,
      linkedin: null,
      github: null,
      image: null,
    },
    summary: "Développeur passionné.",
    yearsExperience: "5 ans d'expérience",
    showPhoto: false,
    showProjects: true,
    headerBgColor: null,
    headerTextColor: null,
    headerBgImage: null,
    headerBgImagePosition: null,
    experience: [
      {
        id: "exp1",
        company: "Acme",
        position: "Développeur",
        location: "Lyon",
        startDate: "2020-01",
        endDate: "Présent",
        bullets: ["A livré une API"],
      },
    ],
    education: [],
    skills: { Langages: ["TypeScript"] },
    projects: [],
    interests: [],
    ...overrides,
  };
}
