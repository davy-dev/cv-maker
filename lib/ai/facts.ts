import type {
  users,
  workExperiences,
  education,
  skills,
  projects,
} from "@/lib/db/schema";

/**
 * The candidate's profile as a catalog of numbered facts: the only material
 * Claude may use to write a CV. Every generated sentence cites fact ids,
 * which lets the app check each claim against its sources.
 */

export type FactOwner =
  | { kind: "profile" }
  | { kind: "experience"; id: string }
  | { kind: "project"; id: string }
  | { kind: "education"; id: string }
  | { kind: "skill"; id: string };

export interface Fact {
  id: string;
  text: string;
  owner: FactOwner;
}

export interface ProfileSource {
  user: typeof users.$inferSelect;
  experiences: (typeof workExperiences.$inferSelect)[];
  educations: (typeof education.$inferSelect)[];
  skills: (typeof skills.$inferSelect)[];
  projects: (typeof projects.$inferSelect)[];
}

export interface FactCatalog {
  facts: Fact[];
  byId: Map<string, Fact>;
  source: ProfileSource;
}

export function parseList(json: string | null): string[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.trim()) : [];
  } catch {
    return [];
  }
}

export function buildFactCatalog(source: ProfileSource): FactCatalog {
  const facts: Fact[] = [];
  const add = (text: string | null | undefined, owner: FactOwner) => {
    if (text?.trim()) facts.push({ id: `F${facts.length + 1}`, text: text.trim(), owner });
  };
  // "Label : value", or nothing when the value is blank
  const labeled = (label: string, value: string | null | undefined) =>
    value?.trim() ? `${label} : ${value.trim()}` : null;

  const { user } = source;
  add(labeled("Titre professionnel", user.title), { kind: "profile" });
  add(labeled("Résumé du profil", user.summary), { kind: "profile" });

  const bySortOrder = <T extends { sortOrder: number }>(rows: T[]) =>
    [...rows].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const exp of bySortOrder(source.experiences)) {
    const owner = { kind: "experience", id: exp.id } as const;
    add(
      `Poste : ${exp.position} chez ${exp.company} (${exp.startDate} – ${exp.endDate ?? "aujourd'hui"})`,
      owner
    );
    add(exp.description, owner);
    for (const achievement of parseList(exp.achievements)) add(`Réalisation : ${achievement}`, owner);
    const technologies = parseList(exp.technologies);
    if (technologies.length) add(`Technologies utilisées : ${technologies.join(", ")}`, owner);
  }

  for (const project of bySortOrder(source.projects)) {
    const owner = { kind: "project", id: project.id } as const;
    add(`Projet : ${project.name}`, owner);
    add(project.description, owner);
    add(labeled("Rôle", project.role), owner);
    add(labeled("Contexte", project.motivation), owner);
    add(labeled("Impact", project.impact), owner);
    for (const highlight of parseList(project.highlights)) add(`Point clé : ${highlight}`, owner);
    const technologies = parseList(project.technologies);
    if (technologies.length) add(`Technologies utilisées : ${technologies.join(", ")}`, owner);
  }

  for (const edu of bySortOrder(source.educations)) {
    const owner = { kind: "education", id: edu.id } as const;
    add(`Formation : ${edu.degree} en ${edu.field}, ${edu.institution} (${edu.startDate} – ${edu.endDate ?? "en cours"})`, owner);
    add(edu.description, owner);
  }

  for (const skill of source.skills) {
    const years = skill.yearsOfExperience != null ? `, ${skill.yearsOfExperience} an(s)` : "";
    add(`Compétence : ${skill.name} (niveau ${skill.level}/5${years})`, { kind: "skill", id: skill.id });
  }

  return { facts, byId: new Map(facts.map((f) => [f.id, f])), source };
}

/** Facts grouped by what they describe, as shown to the model. */
export function formatFactsForPrompt(catalog: FactCatalog): string {
  const label = (owner: FactOwner) => {
    const { source } = catalog;
    switch (owner.kind) {
      case "profile":
        return "Profil";
      case "experience": {
        const e = source.experiences.find((x) => x.id === owner.id)!;
        return `Expérience ${owner.id} — ${e.position} chez ${e.company}`;
      }
      case "project": {
        const p = source.projects.find((x) => x.id === owner.id)!;
        return `Projet ${owner.id} — ${p.name}`;
      }
      case "education":
        return "Formation";
      case "skill":
        return "Compétences";
    }
  };

  const groups = new Map<string, Fact[]>();
  for (const fact of catalog.facts) {
    const key = label(fact.owner);
    groups.set(key, [...(groups.get(key) ?? []), fact]);
  }
  return [...groups]
    .map(([title, facts]) => `### ${title}\n${facts.map((f) => `[${f.id}] ${f.text}`).join("\n")}`)
    .join("\n\n");
}
