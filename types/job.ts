import type { z } from "zod";
import type {
  jobAnalysisSchema,
  matchedSkillSchema,
  missingSkillSchema,
} from "@/lib/ai/schemas";

export interface CompanyInfo {
  name: string;
  description: string;
  url: string;
  values: string;
  techStack: string;
  rawExcerpt: string;
}

// Defined by the structured output schemas sent to Claude
export type MatchedSkill = z.infer<typeof matchedSkillSchema>;
export type MissingSkill = z.infer<typeof missingSkillSchema>;
export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;
