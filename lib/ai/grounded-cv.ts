import "server-only";
import { generateStructured } from "./generate";
import { buildFactCatalog, type FactCatalog, type ProfileSource } from "./facts";
import { buildCvDraftSchema, buildVerificationSchema } from "./schemas";
import { buildCvGenerationPrompt, buildVerificationPrompt } from "./prompts";
import { collectClaims, verifyClaims, type ModelVerifier } from "./verify";
import { assembleCv } from "./cv";
import type { JobAnalysis } from "@/types/job";
import type { CvData, GenerationReport } from "@/types/cv";

export type GroundedCvResult =
  | { ok: true; cvData: CvData; report: GenerationReport }
  | { ok: false; reason: "empty-profile" | "generation-failed" };

/**
 * Writes a CV from the candidate's facts only:
 * generation with cited sources → rule checks → second model pass → assembly.
 */
export async function generateGroundedCv(
  analysis: JobAnalysis,
  source: ProfileSource
): Promise<GroundedCvResult> {
  const catalog = buildFactCatalog(source);
  if (catalog.facts.length === 0) return { ok: false, reason: "empty-profile" };

  const schema = buildCvDraftSchema({
    factIds: catalog.facts.map((f) => f.id),
    experienceIds: source.experiences.map((e) => e.id),
    projectIds: source.projects.map((p) => p.id),
    skillNames: [...new Set(source.skills.map((s) => s.name))],
  });
  const draft = await generateStructured(buildCvGenerationPrompt(analysis, catalog), schema);
  if (!draft) return { ok: false, reason: "generation-failed" };

  const claims = collectClaims(draft);
  const verification = await verifyClaims(claims, catalog, verifyWithModel);

  return {
    ok: true,
    cvData: assembleCv(draft, catalog, claims, verification.acceptedIds),
    report: {
      method: verification.method,
      checkedCount: verification.checkedCount,
      rejected: verification.rejected,
      skillsToAcquire: draft.skillsToAcquire,
    },
  };
}

/** Second pass: Claude compares each claim with the facts it cites. */
const verifyWithModel: ModelVerifier = async (claims, catalog: FactCatalog) => {
  try {
    const result = await generateStructured(
      buildVerificationPrompt(claims, catalog),
      buildVerificationSchema(claims.map((c) => c.id))
    );
    if (!result) return null;
    return new Map(result.verdicts.map((v) => [v.claimId, { supported: v.supported, reason: v.reason }]));
  } catch (error) {
    // The CV is still usable with the rule checks; the report says verification was partial
    console.error("CV verification failed:", error);
    return null;
  }
};
