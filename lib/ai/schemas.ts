import { z } from "zod";

/**
 * Output schemas sent to Claude as structured outputs: the API only lets the model
 * produce JSON matching them. Descriptions are part of the schema the model reads.
 *
 * API constraints: every object has fixed keys (no free-form records),
 * and numeric / length constraints are not enforced by the API.
 */

// --- Job analysis ---

export const matchedSkillSchema = z.object({
  skill: z.string(),
  relevance: z.enum(["high", "medium", "low"]),
  context: z.string().describe("Pourquoi cette compétence compte pour ce poste"),
});

export const missingSkillSchema = z.object({
  skill: z.string(),
  importance: z.enum(["required", "nice-to-have"]),
  suggestion: z
    .string()
    .describe("Comment compenser, ex: mettre en avant une compétence proche"),
});

export const jobAnalysisSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  jobSummary: z.string().describe("Résumé du rôle en 2-3 phrases"),
  requiredSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  matchedSkills: z.array(matchedSkillSchema),
  missingSkills: z.array(missingSkillSchema),
  matchScore: z.number().describe("Score de correspondance, entier de 0 à 100"),
  tailoringAdvice: z.string().describe("Conseil pour adapter le CV à cette offre"),
  keywordsToInclude: z.array(z.string()),
});

// --- CV generation ---
// Built per request from the candidate's fact catalog (lib/ai/facts.ts): ids and
// skill names are closed lists, so the model cannot cite a source that does not
// exist or list a skill the candidate does not have. Everything that must not be
// rewritten (companies, dates, degrees, project names and links) is copied from
// the database by lib/ai/cv.ts, not generated.

type NonEmpty = [string, ...string[]];

export interface SourcedText {
  text: string;
  sourceIds: string[];
}

export interface SkillToAcquire {
  skill: string;
  reason: string;
  howToAcquire: string;
}

/** What Claude writes for a CV; sections are absent when the profile has nothing for them. */
export interface CvDraft {
  title: SourcedText;
  summary: SourcedText[];
  experiences?: { experienceId: string; bullets: SourcedText[] }[];
  projects?: { projectId: string; description: SourcedText; highlights: SourcedText[] }[];
  skills?: { category: string; items: string[] }[];
  skillsToAcquire: SkillToAcquire[];
}

export function buildCvDraftSchema(ids: {
  factIds: string[];
  experienceIds: string[];
  projectIds: string[];
  skillNames: string[];
}): z.ZodType<CvDraft> {
  const sourceIds = z
    .array(z.enum(ids.factIds as NonEmpty))
    .describe("Identifiants [F…] des faits qui justifient ce texte (au moins un)");
  const sourced = (description: string) =>
    z.object({ text: z.string().describe(description), sourceIds });

  return z.object({
    title: sourced("Titre professionnel adapté au poste, fidèle au parcours réel"),
    summary: z
      .array(sourced("Une phrase du résumé"))
      .describe("Résumé en 2 à 4 phrases, une phrase par élément"),
    ...(ids.experienceIds.length && {
      experiences: z
        .array(
          z.object({
            experienceId: z.enum(ids.experienceIds as NonEmpty),
            bullets: z.array(sourced("Réalisation reformulée, sans rien ajouter aux faits cités")),
          })
        )
        .describe("Expériences à mettre en avant, dans l'ordre d'affichage"),
    }),
    ...(ids.projectIds.length && {
      projects: z
        .array(
          z.object({
            projectId: z.enum(ids.projectIds as NonEmpty),
            description: sourced("Description reformulée pour ce poste"),
            highlights: z.array(sourced("Point clé reformulé")),
          })
        )
        .describe("Projets les plus pertinents pour ce poste"),
    }),
    ...(ids.skillNames.length && {
      skills: z
        .array(
          z.object({
            category: z.string().describe('ex: "Langages", "Frameworks", "Outils"'),
            items: z.array(z.enum(ids.skillNames as NonEmpty)),
          })
        )
        .describe("Compétences du candidat regroupées, les plus pertinentes en premier"),
    }),
    skillsToAcquire: z
      .array(
        z.object({
          skill: z.string(),
          reason: z.string().describe("Pourquoi elle compte pour ce poste"),
          howToAcquire: z.string().describe("Piste concrète pour l'acquérir"),
        })
      )
      .describe("Compétences demandées par le poste que le candidat n'a PAS : conseils, jamais sur le CV"),
  }) as unknown as z.ZodType<CvDraft>;
}

export function buildVerificationSchema(claimIds: string[]) {
  return z.object({
    verdicts: z.array(
      z.object({
        claimId: z.enum(claimIds as NonEmpty),
        supported: z.boolean(),
        reason: z.string().describe("Si non justifiée : ce qui n'apparaît pas dans les faits cités"),
      })
    ),
  });
}

// --- Cover letter ---

export const coverLetterSchema = z.object({
  recipient: z.object({
    companyName: z.string(),
    contactName: z.string().nullable(),
    contactTitle: z.string().nullable(),
    address: z.string().nullable(),
    city: z.string().nullable(),
  }),
  senderCity: z.string(),
  date: z.string().describe("Remplacée par la date du jour par l'application"),
  subject: z.string().describe('ex: "Objet : Candidature au poste de …"'),
  opening: z.string().describe('ex: "Madame, Monsieur,"'),
  introduction: z.string().describe("Pourquoi j'écris, le poste visé, avec enthousiasme"),
  motivation: z.string().describe("Pourquoi cette entreprise spécifiquement : valeurs, mission"),
  skillsMatch: z.string().describe("Compétences et expériences les plus pertinentes, avec des exemples concrets"),
  conclusion: z.string().describe("Appel à l'action : disponibilité pour un entretien"),
  closing: z.string().describe("Formule de politesse"),
  senderName: z.string(),
});
