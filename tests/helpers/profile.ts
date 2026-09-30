import type { ProfileSource } from "@/lib/ai/facts";

type Rows = ProfileSource;

export function user(overrides: Partial<Rows["user"]> = {}): Rows["user"] {
  return {
    id: "u1",
    name: "Jeanne Martin",
    email: "jeanne@exemple.com",
    emailVerified: null,
    image: null,
    hashedPassword: null,
    title: "Développeuse full-stack",
    phone: "0600000000",
    location: "Nantes",
    website: null,
    linkedin: null,
    github: null,
    summary: "Développeuse passionnée par le web.",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

export function experience(overrides: Partial<Rows["experiences"][number]> = {}): Rows["experiences"][number] {
  return {
    id: "exp1",
    userId: "u1",
    company: "Acme",
    position: "Développeuse",
    location: "Nantes",
    startDate: "2020-01",
    endDate: null,
    description: "Équipe produit",
    achievements: JSON.stringify(["Migration du front vers Next.js", "Réduction du temps de build de 40 %"]),
    technologies: JSON.stringify(["TypeScript", "React"]),
    sortOrder: 0,
    ...overrides,
  };
}

export function project(overrides: Partial<Rows["projects"][number]> = {}): Rows["projects"][number] {
  return {
    id: "proj1",
    userId: "u1",
    name: "CV Maker",
    description: "Générateur de CV",
    url: "https://cv.example",
    technologies: JSON.stringify(["Next.js"]),
    highlights: JSON.stringify(["Rendu PDF côté client"]),
    type: "side-project",
    role: "Autrice",
    impact: null,
    motivation: null,
    links: JSON.stringify([{ label: "Repo", url: "https://github.com/x" }]),
    linkedExperienceId: null,
    displayMode: "projects-section",
    sortOrder: 0,
    ...overrides,
  };
}

export function educationRow(overrides: Partial<Rows["educations"][number]> = {}): Rows["educations"][number] {
  return {
    id: "edu1",
    userId: "u1",
    institution: "INSA",
    degree: "Ingénieure",
    field: "Informatique",
    startDate: "2014",
    endDate: "2019",
    description: null,
    sortOrder: 0,
    ...overrides,
  };
}

export function skill(overrides: Partial<Rows["skills"][number]> = {}): Rows["skills"][number] {
  return {
    id: "s1",
    userId: "u1",
    name: "TypeScript",
    category: "language",
    level: 4,
    yearsOfExperience: 5,
    createdAt: new Date(0),
    ...overrides,
  };
}

export function profileSource(overrides: Partial<Rows> = {}): Rows {
  return {
    user: user(),
    experiences: [experience()],
    projects: [project()],
    educations: [educationRow()],
    skills: [skill(), skill({ id: "s2", name: "React", category: "framework" })],
    ...overrides,
  };
}
