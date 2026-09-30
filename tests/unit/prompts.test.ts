import { describe, it, expect } from "vitest";
import {
  buildAnalysisPrompt,
  buildCvGenerationPrompt,
  buildVerificationPrompt,
  buildCoverLetterGenerationPrompt,
} from "@/lib/ai/prompts";
import { buildFactCatalog } from "@/lib/ai/facts";
import { profileSource } from "../helpers/profile";
import type { CompanyInfo } from "@/types/job";
import { buildCvData, buildJobAnalysis } from "../helpers/fixtures";

const skill = { name: "React", category: "framework", level: 4, yearsOfExperience: 3 };

const company: CompanyInfo = {
  name: "Acme",
  description: "On construit des fusées",
  url: "https://acme.io",
  values: "Transparence",
  techStack: "TypeScript",
  rawExcerpt: "",
};

const profile = {
  name: "Jean Dupont",
  title: null,
  email: "jean@exemple.com",
  phone: null,
  location: "Lyon",
  website: null,
  linkedin: "https://linkedin.com/in/jean",
  github: null,
  summary: null,
  image: null,
};

const experience = {
  company: "Acme",
  position: "Développeur",
  startDate: "2020-01",
  endDate: null,
  description: "Équipe produit",
  achievements: JSON.stringify(["Migration vers Next.js", "Tests E2E"]),
  technologies: JSON.stringify(["TypeScript", "React"]),
};

const educationEntry = {
  institution: "Lyon 1",
  degree: "Master",
  field: "Informatique",
  startDate: "2015",
  endDate: null,
  description: null,
};

describe("buildAnalysisPrompt", () => {
  it("contient l'offre, les compétences et la consigne de sortie JSON", () => {
    const prompt = buildAnalysisPrompt("Offre React senior", null, [skill]);

    expect(prompt).toContain("Offre React senior");
    expect(prompt).toContain("- React (framework, niveau 4/5, 3 ans)");
    // The output format is enforced by the schema, not described in the prompt
    expect(prompt).not.toContain("JSON");
    expect(prompt).not.toContain("Informations sur l'entreprise");
  });

  it("ajoute la section entreprise quand le scraping a réussi", () => {
    const prompt = buildAnalysisPrompt("Offre", company, [skill]);
    expect(prompt).toContain("Informations sur l'entreprise");
    expect(prompt).toContain("On construit des fusées");
  });

  it("affiche N/A quand les années d'expérience sont inconnues", () => {
    const prompt = buildAnalysisPrompt("Offre", null, [{ ...skill, yearsOfExperience: null }]);
    expect(prompt).toContain("N/A ans");
  });
});

describe("buildCvGenerationPrompt", () => {
  const catalog = buildFactCatalog(profileSource());
  const prompt = buildCvGenerationPrompt(buildJobAnalysis({ jobTitle: "Dev React" }), catalog);

  it("ne donne au modèle que les faits numérotés du profil", () => {
    expect(prompt).toContain("Dev React");
    expect(prompt).toMatch(/^\[F\d+\] Réalisation : Migration du front vers Next\.js$/m);
    expect(prompt).toContain("seule source autorisée");
  });

  it("interdit d'ajouter ce qui n'est pas dans les faits", () => {
    expect(prompt).toContain("n'ajoute RIEN qui ne figure pas dans les faits cités");
    expect(prompt).toContain("Un fait vague reste vague");
    // The old instructions that encouraged inventing are gone
    expect(prompt).not.toMatch(/quantifie les résultats|impact mesurable|centres d'intérêt/i);
  });

  it("sépare les compétences à acquérir du CV", () => {
    expect(prompt).toContain("skillsToAcquire");
    expect(prompt).toContain("ne les mentionne nulle part ailleurs");
  });
});

describe("buildVerificationPrompt", () => {
  it("liste les faits et chaque affirmation avec ses sources", () => {
    const catalog = buildFactCatalog(profileSource());
    const prompt = buildVerificationPrompt(
      [{ id: "C1", section: "summary", text: "Experte React", sourceIds: ["F1", "F2"] }],
      catalog
    );

    expect(prompt).toContain("[C1] « Experte React » — sources citées : F1, F2");
    expect(prompt).toContain(`[F1] ${catalog.facts[0].text}`);
    expect(prompt).toContain("En cas de doute, considère l'affirmation comme non justifiée");
  });
});

describe("buildCoverLetterGenerationPrompt", () => {
  it("s'appuie sur le CV généré et impose l'expéditeur", () => {
    const prompt = buildCoverLetterGenerationPrompt(
      buildJobAnalysis(),
      profile,
      [experience],
      [educationEntry],
      [skill],
      company,
      buildCvData({ summary: "Résumé du CV généré" })
    );

    expect(prompt).toContain("Résumé du CV généré");
    expect(prompt).toContain("A livré une API");
    expect(prompt).toContain('senderName doit être le nom complet du candidat: "Jean Dupont"');
    expect(prompt).toContain('senderCity doit être la localisation du candidat: "Lyon"');
    expect(prompt).toContain("Valeurs/Culture: Transparence");
  });
});
