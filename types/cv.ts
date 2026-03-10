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
}

export interface CvEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
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
}

export interface ImagePosition {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

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
}

export type TemplateId = "modern" | "classic" | "minimalist" | "elegant";

export type CvStatus = "draft" | "final";

export interface CoverLetterRecipient {
  companyName: string;
  contactName: string | null;
  contactTitle: string | null;
  address: string | null;
  city: string | null;
}

export interface CoverLetterData {
  recipient: CoverLetterRecipient;
  senderCity: string;
  date: string;
  subject: string;
  opening: string;
  introduction: string;
  motivation: string;
  skillsMatch: string;
  conclusion: string;
  closing: string;
  senderName: string;
}
