import { beforeAll, beforeEach } from "vitest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  skills,
  workExperiences,
  education,
  projects,
  generatedCvs,
} from "@/lib/db/schema";
import { buildJobAnalysis } from "./fixtures";

/**
 * Applies the real migrations to the in-memory database once per file,
 * then empties every table before each test.
 */
export function setupTestDb() {
  beforeAll(() => {
    migrate(db, { migrationsFolder: "lib/db/migrations" });
  });

  beforeEach(() => {
    // Children first to respect foreign keys
    for (const table of [
      generatedCvs,
      projects,
      skills,
      workExperiences,
      education,
      accounts,
      sessions,
      verificationTokens,
      users,
    ]) {
      db.delete(table).run();
    }
  });

  return db;
}

export async function createUser(
  overrides: Partial<typeof users.$inferInsert> = {}
) {
  const values = {
    id: createId(),
    name: "Jean Dupont",
    email: `${createId()}@exemple.com`,
    ...overrides,
  };
  await db.insert(users).values(values);
  return values;
}

export async function createSkill(
  userId: string,
  overrides: Partial<typeof skills.$inferInsert> = {}
) {
  const values = {
    id: createId(),
    userId,
    name: "TypeScript",
    category: "language",
    level: 4,
    yearsOfExperience: 3,
    ...overrides,
  };
  await db.insert(skills).values(values);
  return values;
}

export async function createExperience(
  userId: string,
  overrides: Partial<typeof workExperiences.$inferInsert> = {}
) {
  const values = {
    id: createId(),
    userId,
    company: "Acme",
    position: "Développeur",
    startDate: "2020-01",
    ...overrides,
  };
  await db.insert(workExperiences).values(values);
  return values;
}

export async function createEducation(
  userId: string,
  overrides: Partial<typeof education.$inferInsert> = {}
) {
  const values = {
    id: createId(),
    userId,
    institution: "Université de Lyon",
    degree: "Master",
    field: "Informatique",
    startDate: "2015",
    ...overrides,
  };
  await db.insert(education).values(values);
  return values;
}

export async function createProject(
  userId: string,
  overrides: Partial<typeof projects.$inferInsert> = {}
) {
  const values = {
    id: createId(),
    userId,
    name: "CV Maker",
    description: "Générateur de CV",
    ...overrides,
  };
  await db.insert(projects).values(values);
  return values;
}

export async function createCv(
  userId: string,
  overrides: Partial<typeof generatedCvs.$inferInsert> = {}
) {
  const values = {
    id: createId(),
    userId,
    title: "Développeur - Acme",
    jobOfferText: "Nous recherchons un développeur TypeScript",
    analysisResult: JSON.stringify(buildJobAnalysis()),
    cvData: "{}",
    ...overrides,
  };
  await db.insert(generatedCvs).values(values);
  return values;
}
