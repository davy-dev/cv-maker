import type { CompanyInfo, JobAnalysis } from "@/types/job";
import type { CvData } from "@/types/cv";
import { formatFactsForPrompt, type FactCatalog } from "./facts";
import type { Claim } from "./verify";
import { MAX_SECTION_PROJECTS } from "@/lib/cv/visibility";

interface SkillForPrompt {
  name: string;
  category: string;
  level: number;
  yearsOfExperience: number | null;
}

interface ExperienceForPrompt {
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  achievements: string | null;
  technologies: string | null;
}

interface EducationForPrompt {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

interface ProfileForPrompt {
  name: string | null;
  title: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  summary: string | null;
  image: string | null;
}

export function buildAnalysisPrompt(
  jobOfferText: string,
  companyInfo: CompanyInfo | null,
  userSkills: SkillForPrompt[]
): string {
  return `Tu es un conseiller carrière IA spécialisé dans le développement logiciel. Analyse l'offre d'emploi suivante et compare-la avec les compétences du candidat.

## Offre d'emploi
${jobOfferText}

${
  companyInfo
    ? `## Informations sur l'entreprise (extraites du site web)
- Nom: ${companyInfo.name}
- Description: ${companyInfo.description}
- Valeurs/Culture: ${companyInfo.values}
- Stack technique (si trouvé): ${companyInfo.techStack}
`
    : ""
}

## Compétences actuelles du candidat
${userSkills.map((s) => `- ${s.name} (${s.category}, niveau ${s.level}/5, ${s.yearsOfExperience ?? "N/A"} ans)`).join("\n")}

## Tâche
Analyse l'offre d'emploi : identifie les compétences du candidat qui correspondent, celles qui manquent (avec une piste pour compenser), un score de correspondance et les mots-clés à reprendre dans le CV.

Rédige en français.`;
}

export function buildCvGenerationPrompt(analysis: JobAnalysis, catalog: FactCatalog): string {
  return `Tu es un rédacteur de CV. Adapte le CV de ce candidat à l'offre ci-dessous en reformulant UNIQUEMENT les faits de son profil.

## Poste ciblé
- Titre: ${analysis.jobTitle}
- Entreprise: ${analysis.company}
- Résumé: ${analysis.jobSummary}
- Compétences requises: ${analysis.requiredSkills.join(", ")}
- Mots-clés: ${analysis.keywordsToInclude.join(", ")}
- Conseil de personnalisation: ${analysis.tailoringAdvice}

## Faits du profil (seule source autorisée)
${formatFactsForPrompt(catalog)}

## Règles
- Chaque phrase que tu écris cite dans sourceIds les faits [F…] qui la justifient.
- Reformule, réorganise et mets en avant ; n'ajoute RIEN qui ne figure pas dans les faits cités : aucune technologie, aucun outil, aucun chiffre, aucune responsabilité, aucun résultat, aucune taille d'équipe.
- Un fait vague reste vague : ne le précise pas et ne le quantifie pas.
- Une réalisation d'une expérience ne cite que les faits de cette expérience (ou d'un projet qui lui est rattaché). Idem pour un projet.
- Les mots-clés de l'offre ne s'utilisent que s'ils correspondent à un fait réel.
- Choisis les expériences et projets les plus pertinents ; ceux que tu omets restent disponibles pour le candidat.
- Le CV tient sur une page : choisis au plus ${MAX_SECTION_PROJECTS} projets, du plus pertinent au moins pertinent.
- Regroupe les compétences du candidat (et uniquement les siennes) par catégorie.
- skillsToAcquire : compétences demandées par le poste que le candidat n'a PAS d'après les faits. C'est un conseil séparé du CV : ne les mentionne nulle part ailleurs.
- Rédige en français.`;
}

export function buildVerificationPrompt(claims: Claim[], catalog: FactCatalog): string {
  return `Tu vérifies un CV généré. Pour chaque affirmation, indique si elle est entièrement justifiée par les faits qu'elle cite.

## Faits du profil
${catalog.facts.map((f) => `[${f.id}] ${f.text}`).join("\n")}

## Affirmations à vérifier
${claims.map((c) => `[${c.id}] « ${c.text} » — sources citées : ${c.sourceIds.join(", ")}`).join("\n")}

## Critères
- Justifiée : reformulation, synthèse ou généralisation de ce que disent les faits cités.
- Non justifiée : ajoute une technologie, un outil, un chiffre, une responsabilité, un résultat, un contexte ou une précision absents des faits cités, ou exagère leur portée.
- En cas de doute, considère l'affirmation comme non justifiée.
- Donne un verdict pour chaque affirmation, avec une raison courte en français quand elle n'est pas justifiée.`;
}

export function buildCoverLetterGenerationPrompt(
  analysis: JobAnalysis,
  profile: ProfileForPrompt,
  experiences: ExperienceForPrompt[],
  educations: EducationForPrompt[],
  userSkills: SkillForPrompt[],
  companyInfo: CompanyInfo | null,
  cvData: CvData
): string {
  return `Tu es un rédacteur professionnel spécialisé dans les lettres de motivation en français.
Génère une lettre de motivation personnalisée pour ce candidat ciblant l'offre d'emploi analysée ci-dessous.

## Poste ciblé
- Titre: ${analysis.jobTitle}
- Entreprise: ${analysis.company}
- Résumé: ${analysis.jobSummary}
- Compétences requises: ${analysis.requiredSkills.join(", ")}
- Mots-clés à inclure: ${analysis.keywordsToInclude.join(", ")}
- Conseil de personnalisation: ${analysis.tailoringAdvice}

${
  companyInfo
    ? `## Informations sur l'entreprise
- Nom: ${companyInfo.name}
- Description: ${companyInfo.description}
- Valeurs/Culture: ${companyInfo.values}
- Stack technique: ${companyInfo.techStack}
`
    : ""
}

## Profil du candidat
- Nom: ${profile.name}
- Titre actuel: ${profile.title ?? "Non renseigné"}
- Localisation: ${profile.location ?? "Non renseigné"}
- Email: ${profile.email}
- Téléphone: ${profile.phone ?? "Non renseigné"}

## Résumé professionnel (du CV généré)
${cvData.summary}

## Compétences correspondantes
${analysis.matchedSkills.map((s) => `- ${s.skill} (${s.relevance}): ${s.context}`).join("\n")}

## Expériences pertinentes (du CV généré)
${cvData.experience
  .map(
    (e) => `### ${e.position} chez ${e.company} (${e.startDate} - ${e.endDate})
${e.bullets.join("\n")}`
  )
  .join("\n\n")}

## Formations
${educations
  .map(
    (e) => `- ${e.degree} en ${e.field} - ${e.institution} (${e.startDate} - ${e.endDate ?? "En cours"})`
  )
  .join("\n")}

## Instructions
Génère une lettre de motivation personnalisée.

Règles:
- Ton formel et professionnel
- Tutoiement interdit, utiliser "vous"
- L'introduction doit mentionner le poste et montrer de l'enthousiasme
- La motivation doit montrer pourquoi cette entreprise spécifiquement (utilise les infos entreprise si disponibles)
- Le skillsMatch doit mettre en avant les compétences les plus pertinentes avec des exemples concrets tirés de l'expérience
- La conclusion doit inclure un appel à l'action (entretien) et exprimer la disponibilité
- Maximum ~350 mots pour l'ensemble des 4 paragraphes (introduction + motivation + skillsMatch + conclusion)
- La lettre doit compléter le CV, pas le répéter
- senderCity doit être la localisation du candidat: "${profile.location ?? ""}"
- senderName doit être le nom complet du candidat: "${profile.name ?? ""}"
- Rédige en français`;
}
