import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================
// AUTH TABLES (NextAuth.js required tables)
// ============================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  hashedPassword: text("hashed_password"),
  title: text("title"),
  phone: text("phone"),
  location: text("location"),
  website: text("website"),
  linkedin: text("linkedin"),
  github: text("github"),
  summary: text("summary"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// ============================================
// APPLICATION TABLES
// ============================================

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  level: integer("level").notNull(),
  yearsOfExperience: real("years_of_experience"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workExperiences = sqliteTable("work_experiences", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  position: text("position").notNull(),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description"),
  achievements: text("achievements"),
  technologies: text("technologies"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const education = sqliteTable("education", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  field: text("field").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url"),
  technologies: text("technologies"),
  highlights: text("highlights"),
  type: text("type").notNull().default("personal"),
  role: text("role"),
  impact: text("impact"),
  motivation: text("motivation"),
  links: text("links"),
  linkedExperienceId: text("linked_experience_id").references(
    () => workExperiences.id,
    { onDelete: "set null" }
  ),
  displayMode: text("display_mode").notNull().default("projects-section"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const generatedCvs = sqliteTable("generated_cvs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  jobOfferText: text("job_offer_text").notNull(),
  companyUrl: text("company_url"),
  companyInfo: text("company_info"),
  analysisResult: text("analysis_result"),
  matchedSkills: text("matched_skills"),
  missingSkills: text("missing_skills"),
  cvData: text("cv_data").notNull(),
  coverLetterData: text("cover_letter_data"),
  templateId: text("template_id").notNull().default("modern"),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  skills: many(skills),
  workExperiences: many(workExperiences),
  education: many(education),
  projects: many(projects),
  generatedCvs: many(generatedCvs),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  user: one(users, { fields: [skills.userId], references: [users.id] }),
}));

export const workExperiencesRelations = relations(workExperiences, ({ one }) => ({
  user: one(users, {
    fields: [workExperiences.userId],
    references: [users.id],
  }),
}));

export const educationRelations = relations(education, ({ one }) => ({
  user: one(users, { fields: [education.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  linkedExperience: one(workExperiences, {
    fields: [projects.linkedExperienceId],
    references: [workExperiences.id],
  }),
}));

export const generatedCvsRelations = relations(generatedCvs, ({ one }) => ({
  user: one(users, {
    fields: [generatedCvs.userId],
    references: [users.id],
  }),
}));
