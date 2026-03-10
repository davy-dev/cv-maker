import type { CompanyInfo, JobAnalysis } from "@/types/job";
import type { CvData } from "@/types/cv";

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

interface ProjectForPrompt {
  name: string;
  description: string | null;
  url: string | null;
  technologies: string | null;
  highlights: string | null;
  type: string;
  role: string | null;
  impact: string | null;
  motivation: string | null;
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
Analyse l'offre d'emploi et retourne un objet JSON avec cette structure exacte:
{
  "jobTitle": "le titre du poste",
  "company": "nom de l'entreprise",
  "jobSummary": "résumé en 2-3 phrases du rôle",
  "requiredSkills": ["compétence1", "compétence2"],
  "niceToHaveSkills": ["compétence1", "compétence2"],
  "matchedSkills": [
    { "skill": "React", "relevance": "high", "context": "Framework principal du poste" }
  ],
  "missingSkills": [
    { "skill": "Kubernetes", "importance": "nice-to-have", "suggestion": "Mentionner l'expérience Docker comme alternative" }
  ],
  "matchScore": 85,
  "tailoringAdvice": "Concentrez votre CV sur...",
  "keywordsToInclude": ["mot-clé1", "mot-clé2"]
}

Retourne UNIQUEMENT le JSON, sans bloc de code markdown.`;
}

export function buildCvGenerationPrompt(
  analysis: JobAnalysis,
  profile: ProfileForPrompt,
  experiences: ExperienceForPrompt[],
  educations: EducationForPrompt[],
  userSkills: SkillForPrompt[],
  projects: ProjectForPrompt[]
): string {
  return `Tu es un rédacteur de CV professionnel. Génère un CV personnalisé pour ce candidat ciblant l'offre d'emploi analysée ci-dessous.

## Poste ciblé
- Titre: ${analysis.jobTitle}
- Entreprise: ${analysis.company}
- Résumé: ${analysis.jobSummary}
- Compétences requises: ${analysis.requiredSkills.join(", ")}
- Mots-clés à inclure: ${analysis.keywordsToInclude.join(", ")}
- Conseil de personnalisation: ${analysis.tailoringAdvice}

## Profil du candidat
- Nom: ${profile.name}
- Titre: ${profile.title ?? "Non renseigné"}
- Localisation: ${profile.location ?? "Non renseigné"}
- Email: ${profile.email}
- Téléphone: ${profile.phone ?? "Non renseigné"}
${profile.website ? `- Site web: ${profile.website}` : ""}
${profile.linkedin ? `- LinkedIn: ${profile.linkedin}` : ""}
${profile.github ? `- GitHub: ${profile.github}` : ""}

## Résumé professionnel actuel
${profile.summary ?? "Non renseigné"}

## Expériences professionnelles
${experiences
  .map(
    (e) => `
### ${e.position} chez ${e.company} (${e.startDate} - ${e.endDate ?? "Présent"})
${e.description ?? ""}
Réalisations: ${e.achievements ? JSON.parse(e.achievements).join("; ") : "N/A"}
Technologies: ${e.technologies ? JSON.parse(e.technologies).join(", ") : "N/A"}
`
  )
  .join("\n")}

## Formations
${educations
  .map(
    (e) => `
### ${e.degree} en ${e.field} - ${e.institution} (${e.startDate} - ${e.endDate ?? "En cours"})
${e.description ?? ""}
`
  )
  .join("\n")}

## Compétences
${userSkills.map((s) => `- ${s.name} (${s.category}, ${s.level}/5)`).join("\n")}

## Projets
${projects
  .map(
    (p) => `
### ${p.name} (${p.type ?? "personal"})
${p.role ? `Rôle: ${p.role}` : ""}
${p.motivation ? `Contexte: ${p.motivation}` : ""}
${p.description ?? ""}
${p.impact ? `Impact: ${p.impact}` : ""}
Tech: ${p.technologies ? JSON.parse(p.technologies).join(", ") : "N/A"}
Points clés: ${p.highlights ? JSON.parse(p.highlights).join("; ") : "N/A"}
`
  )
  .join("\n")}

## Instructions
Génère un CV personnalisé pour cette offre. Retourne un objet JSON avec cette structure exacte:
{
  "header": {
    "name": "Nom complet",
    "title": "Titre professionnel adapté au poste ciblé",
    "email": "email",
    "phone": "téléphone",
    "location": "localisation",
    "website": "url ou null",
    "linkedin": "url ou null",
    "github": "url ou null",
    "image": null
  },
  "summary": "Un résumé professionnel de 3-4 phrases adapté spécifiquement à cette offre...",
  "showPhoto": false,
  "showProjects": true,
  "headerBgColor": null,
  "headerTextColor": null,
  "headerBgImage": null,
  "experience": [
    {
      "id": "exp1",
      "company": "Nom Entreprise",
      "position": "Titre du poste",
      "location": "Ville",
      "startDate": "2022-01",
      "endDate": "Présent",
      "bullets": [
        "Réalisation orientée résultat adaptée au poste ciblé...",
        "Autre réalisation utilisant les mots-clés de l'offre..."
      ]
    }
  ],
  "education": [
    {
      "id": "edu1",
      "institution": "Université",
      "degree": "Diplôme",
      "field": "Domaine",
      "startDate": "2018",
      "endDate": "2022",
      "description": "note optionnelle"
    }
  ],
  "yearsExperience": "X ans d'expérience",
  "skills": {
    "Langages": ["TypeScript", "Python"],
    "Frameworks": ["React", "Next.js"],
    "Outils": ["Docker", "Git"],
    "Autres": ["Agile", "CI/CD"]
  },
  "projects": [
    {
      "id": "proj1",
      "name": "Nom du projet",
      "description": "Description mettant en valeur la pertinence pour le poste",
      "technologies": ["tech1", "tech2"],
      "url": "url optionnelle ou null",
      "type": "personal | open-source | freelance | hackathon | academic | side-project",
      "role": "Rôle dans le projet (ex: Lead technique, Initiateur)",
      "impact": "Résultats mesurables et métriques concrètes",
      "highlights": ["Défi technique résolu 1", "Défi technique résolu 2"],
      "motivation": "Contexte et motivation du projet",
      "links": [{"label": "Repo", "url": "https://..."}, {"label": "Démo", "url": "https://..."}],
      "linkedExperienceId": null,
      "displayMode": "projects-section"
    }
  ],
  "interests": ["Veille technologique", "Open source", "Musique"]
}

Règles:
- Reformule les bullet points pour mettre en avant les compétences recherchées dans l'offre
- Utilise des verbes d'action et quantifie les résultats quand possible
- Ordonne les compétences en mettant les plus pertinentes en premier
- Le titre professionnel doit être adapté au poste ciblé
- Inclus uniquement les projets les plus pertinents
- Pour chaque projet, remplis le type, le rôle, l'impact mesurable, la motivation et les highlights techniques
- Conserve les liens (links) du profil du candidat quand ils existent
- linkedExperienceId et displayMode doivent rester null et "projects-section" respectivement
- Le résumé doit se concentrer sur ce qui rend ce candidat idéal pour CE poste spécifique
- yearsExperience doit résumer le nombre total d'années d'expérience professionnelle (ex: "5 ans d'expérience")
- interests doit contenir 3 à 5 centres d'intérêts pertinents (loisirs, passions, activités)
- Rédige en français

Retourne UNIQUEMENT le JSON, sans bloc de code markdown.`;
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
Génère une lettre de motivation personnalisée. Retourne un objet JSON avec cette structure exacte:
{
  "recipient": {
    "companyName": "Nom de l'entreprise",
    "contactName": null,
    "contactTitle": null,
    "address": null,
    "city": null
  },
  "senderCity": "Ville du candidat",
  "date": "24 février 2026",
  "subject": "Objet : Candidature au poste de ...",
  "opening": "Madame, Monsieur,",
  "introduction": "Premier paragraphe: pourquoi j'écris, le poste visé, comment j'ai découvert l'offre",
  "motivation": "Deuxième paragraphe: pourquoi cette entreprise spécifiquement, ses valeurs, sa mission",
  "skillsMatch": "Troisième paragraphe: mes compétences et expériences les plus pertinentes pour ce poste",
  "conclusion": "Quatrième paragraphe: appel à l'action, disponibilité pour un entretien",
  "closing": "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
  "senderName": "Prénom Nom"
}

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
- Rédige en français

Retourne UNIQUEMENT le JSON, sans bloc de code markdown.`;
}
