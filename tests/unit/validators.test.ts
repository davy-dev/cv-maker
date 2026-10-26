import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  profileSchema,
  skillSchema,
  workExperienceSchema,
  educationSchema,
  projectSchema,
  analyzeJobSchema,
  generateCvSchema,
  generateCoverLetterSchema,
} from "@/lib/validators";

function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0].message;
}

describe("loginSchema", () => {
  it("accepte un email et un mot de passe valides", () => {
    expect(loginSchema.safeParse({ email: "a@b.fr", password: "secret1" }).success).toBe(true);
  });

  it("rejette un email invalide avec un message en français", () => {
    const result = loginSchema.safeParse({ email: "pas-un-email", password: "secret1" });
    expect(firstError(result)).toBe("Email invalide");
  });

  it("exige au moins 6 caractères pour le mot de passe", () => {
    const result = loginSchema.safeParse({ email: "a@b.fr", password: "12345" });
    expect(firstError(result)).toBe("Le mot de passe doit contenir au moins 6 caractères");
  });
});

describe("registerSchema", () => {
  it("exige un nom d'au moins 2 caractères", () => {
    const result = registerSchema.safeParse({ name: "J", email: "a@b.fr", password: "secret1" });
    expect(firstError(result)).toBe("Le nom doit contenir au moins 2 caractères");
  });

  it("accepte une inscription complète", () => {
    const result = registerSchema.safeParse({ name: "Jean", email: "a@b.fr", password: "secret1" });
    expect(result.success).toBe(true);
  });
});

describe("profileSchema", () => {
  it("accepte des liens vides (champs facultatifs du formulaire)", () => {
    const result = profileSchema.safeParse({ name: "Jean", website: "", linkedin: "", github: "" });
    expect(result.success).toBe(true);
  });

  it("rejette une URL mal formée", () => {
    const result = profileSchema.safeParse({ name: "Jean", linkedin: "linkedin.com/in/jean" });
    expect(firstError(result)).toBe("URL invalide");
  });

  it("exige un nom", () => {
    expect(firstError(profileSchema.safeParse({ name: "" }))).toBe("Le nom est requis");
  });
});

describe("skillSchema", () => {
  const valid = { name: "React", category: "framework", level: 3 } as const;

  it("accepte une compétence valide", () => {
    expect(skillSchema.safeParse(valid).success).toBe(true);
  });

  it.each([0, 6, 2.5])("rejette le niveau %s (entier de 1 à 5 attendu)", (level) => {
    expect(skillSchema.safeParse({ ...valid, level }).success).toBe(false);
  });

  it.each(["library", "runtime"])("accepte la catégorie %s", (category) => {
    expect(skillSchema.safeParse({ ...valid, category }).success).toBe(true);
  });

  it("rejette une catégorie inconnue", () => {
    expect(skillSchema.safeParse({ ...valid, category: "cuisine" }).success).toBe(false);
  });

  it("rejette des années d'expérience négatives", () => {
    expect(skillSchema.safeParse({ ...valid, yearsOfExperience: -1 }).success).toBe(false);
  });
});

describe("workExperienceSchema", () => {
  it("exige entreprise, poste et date de début", () => {
    const result = workExperienceSchema.safeParse({ company: "", position: "", startDate: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      "L'entreprise est requise",
      "Le poste est requis",
      "La date de début est requise",
    ]);
  });

  it("accepte des réalisations et technologies sous forme de listes", () => {
    const result = workExperienceSchema.safeParse({
      company: "Acme",
      position: "Dev",
      startDate: "2020-01",
      achievements: ["A"],
      technologies: ["TS"],
    });
    expect(result.success).toBe(true);
  });
});

describe("educationSchema", () => {
  it("exige le domaine d'études", () => {
    const result = educationSchema.safeParse({
      institution: "Lyon 1",
      degree: "Master",
      field: "",
      startDate: "2015",
    });
    expect(firstError(result)).toBe("Le domaine est requis");
  });
});

describe("projectSchema", () => {
  it("applique les valeurs par défaut de type et de mode d'affichage", () => {
    const result = projectSchema.parse({ name: "Mon projet" });
    expect(result.type).toBe("personal");
    expect(result.displayMode).toBe("projects-section");
  });

  it("valide les URLs des liens", () => {
    const result = projectSchema.safeParse({
      name: "Projet",
      links: [{ label: "Repo", url: "pas-une-url" }],
    });
    expect(firstError(result)).toBe("URL invalide");
  });
});

describe("analyzeJobSchema", () => {
  it("rejette une offre trop courte", () => {
    expect(firstError(analyzeJobSchema.safeParse({ jobOfferText: "court" }))).toBe(
      "L'offre d'emploi est trop courte"
    );
  });

  it("accepte une URL d'entreprise vide", () => {
    const result = analyzeJobSchema.safeParse({
      jobOfferText: "Développeur React recherché",
      companyUrl: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("generateCvSchema", () => {
  // Must stay in sync with the templates offered in components/cv/job-offer-form.tsx
  it.each(["modern", "classic", "minimalist", "elegant"])("accepte le template %s", (templateId) => {
    expect(generateCvSchema.safeParse({ cvId: "abc", templateId }).success).toBe(true);
  });

  it("rejette un template inconnu", () => {
    expect(generateCvSchema.safeParse({ cvId: "abc", templateId: "comic" }).success).toBe(false);
  });

  it("rejette un cvId vide", () => {
    expect(generateCvSchema.safeParse({ cvId: "", templateId: "modern" }).success).toBe(false);
  });
});

describe("generateCoverLetterSchema", () => {
  it("exige un cvId", () => {
    expect(generateCoverLetterSchema.safeParse({}).success).toBe(false);
  });
});
