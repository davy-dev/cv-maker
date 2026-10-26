import { z } from "zod";
import { VARIANT_IDS } from "@/lib/cv/variants";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

// Profile
export const profileSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  title: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  linkedin: z.string().url("URL invalide").optional().or(z.literal("")),
  github: z.string().url("URL invalide").optional().or(z.literal("")),
  summary: z.string().optional(),
});

// Skills
export const skillSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  category: z.enum([
    "language",
    "framework",
    "library",
    "runtime",
    "tool",
    "soft_skill",
    "database",
    "devops",
    "other",
  ]),
  level: z.number().int().min(1).max(5),
  yearsOfExperience: z.number().min(0).optional(),
});

// Work Experience
export const workExperienceSchema = z.object({
  company: z.string().min(1, "L'entreprise est requise"),
  position: z.string().min(1, "Le poste est requis"),
  location: z.string().optional(),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
});

// Education
export const educationSchema = z.object({
  institution: z.string().min(1, "L'établissement est requis"),
  degree: z.string().min(1, "Le diplôme est requis"),
  field: z.string().min(1, "Le domaine est requis"),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

// Project
export const projectLinkSchema = z.object({
  label: z.string().min(1, "Le label est requis"),
  url: z.string().url("URL invalide"),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  url: z.string().url("URL invalide").optional().or(z.literal("")),
  technologies: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  type: z
    .enum([
      "personal",
      "open-source",
      "freelance",
      "hackathon",
      "academic",
      "side-project",
    ])
    .optional()
    .default("personal"),
  role: z.string().optional(),
  impact: z.string().optional(),
  motivation: z.string().optional(),
  links: z.array(projectLinkSchema).optional(),
  linkedExperienceId: z.string().optional().nullable(),
  displayMode: z
    .enum(["projects-section", "under-experience"])
    .optional()
    .default("projects-section"),
});

// Job Analysis
export const analyzeJobSchema = z.object({
  jobOfferText: z.string().min(10, "L'offre d'emploi est trop courte"),
  companyUrl: z.string().url("URL invalide").optional().or(z.literal("")),
});

// CV Generation
export const templateIdSchema = z.enum(VARIANT_IDS);

export const generateCvSchema = z.object({
  cvId: z.string().min(1),
  templateId: templateIdSchema,
});

// Cover Letter Generation
export const generateCoverLetterSchema = z.object({
  cvId: z.string().min(1),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type AnalyzeJobInput = z.infer<typeof analyzeJobSchema>;
export type GenerateCvInput = z.infer<typeof generateCvSchema>;
export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;
