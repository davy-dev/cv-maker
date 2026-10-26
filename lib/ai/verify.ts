import type { Fact, FactCatalog } from "./facts";
import type { CvDraft, SourcedText } from "./schemas";

/**
 * Checks every sentence Claude wrote against the facts it cites.
 * 1. Rules (free, deterministic): a source is required, numbers must come from
 *    the sources, and a sentence about an experience or a project must cite that
 *    experience or project — never another one.
 * 2. A second model pass compares each remaining sentence with its sources.
 * Rejected sentences are left out of the CV and reported to the user.
 */

export type ClaimSection = "title" | "summary" | "experience" | "project";

export interface Claim extends SourcedText {
  id: string;
  section: ClaimSection;
  /** Experience or project the sentence describes */
  ownerId?: string;
}

export interface RejectedClaim {
  section: ClaimSection;
  text: string;
  reason: string;
}

export interface VerificationResult {
  acceptedIds: Set<string>;
  rejected: RejectedClaim[];
  /** "model" when the second pass ran, "rules-only" when it could not */
  method: "model" | "rules-only";
  checkedCount: number;
}

export type ModelVerifier = (
  claims: Claim[],
  catalog: FactCatalog
) => Promise<Map<string, { supported: boolean; reason: string }> | null>;

export function collectClaims(draft: CvDraft): Claim[] {
  const claims: Claim[] = [];
  const add = (text: SourcedText, section: ClaimSection, ownerId?: string) =>
    claims.push({ ...text, id: `C${claims.length + 1}`, section, ownerId });

  add(draft.title, "title");
  draft.summary.forEach((sentence) => add(sentence, "summary"));
  for (const exp of draft.experiences ?? []) {
    exp.bullets.forEach((bullet) => add(bullet, "experience", exp.experienceId));
  }
  for (const project of draft.projects ?? []) {
    add(project.description, "project", project.projectId);
    project.highlights.forEach((highlight) => add(highlight, "project", project.projectId));
  }
  return claims.filter((claim) => claim.text.trim());
}

const NUMBER = /\d+(?:[.,]\d+)?/g;
const numbersIn = (text: string) => (text.match(NUMBER) ?? []).map((n) => n.replace(",", "."));

/** Returns why the claim breaks a rule, or null when it passes. */
export function checkRules(claim: Claim, catalog: FactCatalog): string | null {
  const sources = claim.sourceIds
    .map((id) => catalog.byId.get(id))
    .filter((fact): fact is Fact => !!fact);
  if (sources.length === 0) return "Aucune source dans votre profil";

  const sourceNumbers = new Set(sources.flatMap((fact) => numbersIn(fact.text)));
  const invented = numbersIn(claim.text).filter((n) => !sourceNumbers.has(n));
  if (invented.length) return `Chiffre absent de vos données : ${invented.join(", ")}`;

  if (claim.section === "experience" || claim.section === "project") {
    // Projects linked to an experience may support its bullets
    const allowedOwners = new Set([claim.ownerId]);
    if (claim.section === "experience") {
      for (const project of catalog.source.projects) {
        if (project.linkedExperienceId === claim.ownerId) allowedOwners.add(project.id);
      }
    }
    const ownSources = sources.filter(
      (fact) => fact.owner.kind !== "profile" && fact.owner.kind !== "skill"
    );
    if (!ownSources.some((fact) => "id" in fact.owner && allowedOwners.has(fact.owner.id))) {
      return claim.section === "experience"
        ? "Attribué à cette expérience sans s'appuyer sur ses faits"
        : "Attribué à ce projet sans s'appuyer sur ses faits";
    }
    const foreign = ownSources.find((fact) => "id" in fact.owner && !allowedOwners.has(fact.owner.id));
    if (foreign) return "Mélange des faits d'une autre expérience ou d'un autre projet";
  }
  return null;
}

export async function verifyClaims(
  claims: Claim[],
  catalog: FactCatalog,
  modelVerifier: ModelVerifier
): Promise<VerificationResult> {
  const rejected: RejectedClaim[] = [];
  const afterRules: Claim[] = [];
  for (const claim of claims) {
    const reason = checkRules(claim, catalog);
    if (reason) rejected.push({ section: claim.section, text: claim.text, reason });
    else afterRules.push(claim);
  }

  const verdicts = afterRules.length ? await modelVerifier(afterRules, catalog) : new Map();
  const acceptedIds = new Set<string>();
  for (const claim of afterRules) {
    const verdict = verdicts?.get(claim.id);
    // A claim the verifier did not return a verdict for is not trusted
    if (verdicts && !verdict?.supported) {
      rejected.push({
        section: claim.section,
        text: claim.text,
        reason: verdict?.reason || "Non confirmé par la vérification",
      });
    } else {
      acceptedIds.add(claim.id);
    }
  }

  return {
    acceptedIds,
    rejected,
    method: verdicts ? "model" : "rules-only",
    checkedCount: claims.length,
  };
}
