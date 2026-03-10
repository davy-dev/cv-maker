export interface CompanyInfo {
  name: string;
  description: string;
  url: string;
  values: string;
  techStack: string;
  rawExcerpt: string;
}

export interface MatchedSkill {
  skill: string;
  relevance: "high" | "medium" | "low";
  context: string;
}

export interface MissingSkill {
  skill: string;
  importance: "required" | "nice-to-have";
  suggestion: string;
}

export interface JobAnalysis {
  jobTitle: string;
  company: string;
  jobSummary: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  matchScore: number;
  tailoringAdvice: string;
  keywordsToInclude: string[];
}
