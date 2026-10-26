import type { z } from "zod";
import type { coverLetterSchema } from "@/lib/ai/schemas";

export interface CvHeader {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  image: string | null;
}

export interface CvExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  /** Kept in the editor but left out of the PDF */
  hidden?: boolean;
}

export interface CvEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
  hidden?: boolean;
}

export type ProjectType =
  | "personal"
  | "open-source"
  | "freelance"
  | "hackathon"
  | "academic"
  | "side-project";

export type ProjectDisplayMode = "projects-section" | "under-experience";

export interface ProjectLink {
  label: string;
  url: string;
}

export interface CvProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url: string | null;
  type: ProjectType;
  role: string;
  impact: string;
  highlights: string[];
  motivation: string;
  links: ProjectLink[];
  linkedExperienceId: string | null;
  displayMode: ProjectDisplayMode;
  hidden?: boolean;
}

export interface ImagePosition {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

/** Sections that can be hidden from the PDF (projects use `showProjects`). */
export type CvSection = "summary" | "experience" | "education" | "skills" | "interests";

/** A section written freely by the user: soft skills, languages, tech watch… */
export interface CvCustomSection {
  id: string;
  title: string;
  /** One line per entry; **double asterisks** mark bold */
  content: string;
  hidden?: boolean;
}

export type BuiltInSectionId = "summary" | "experience" | "projects" | "skills" | "education" | "interests";
export type CustomSectionId = `custom:${string}`;
export type SectionId = BuiltInSectionId | CustomSectionId;

/** Order of the sections in the two columns of HTML templates. */
export interface CvLayout {
  main: SectionId[];
  aside: SectionId[];
}

export type CvColumn = keyof CvLayout;

export interface CvData {
  header: CvHeader;
  summary: string;
  yearsExperience: string;
  showPhoto: boolean;
  showProjects: boolean;
  headerBgColor: string | null;
  headerTextColor: string | null;
  headerBgImage: string | null;
  headerBgImagePosition: ImagePosition | null;
  experience: CvExperience[];
  education: CvEducation[];
  skills: Record<string, string[]>;
  projects: CvProject[];
  interests: string[];
  // Optional: CVs saved before these options existed don't have them
  hiddenSections?: CvSection[];
  hiddenSkillCategories?: string[];
  customSections?: CvCustomSection[];
  /** Missing: the template's default order (see lib/cv/layout.ts) */
  layout?: CvLayout;
}

export type TemplateId = "modern" | "classic" | "minimalist" | "elegant";

export type CvStatus = "draft" | "final";

// Defined by the structured output schema sent to Claude
export type CoverLetterData = z.infer<typeof coverLetterSchema>;
export type CoverLetterRecipient = CoverLetterData["recipient"];

/** How a generated CV was checked against the profile (stored next to the CV). */
export interface GenerationReport {
  /** "rules-only" when the second model pass could not run */
  method: "model" | "rules-only";
  checkedCount: number;
  rejected: {
    section: "title" | "summary" | "experience" | "project";
    text: string;
    reason: string;
  }[];
  /** Advice for this job, never printed on the CV */
  skillsToAcquire: { skill: string; reason: string; howToAcquire: string }[];
}
