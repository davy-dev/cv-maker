import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { test, expect } from "./fixtures";

// The app never calls Claude here: the CV is written straight into the E2E database.
function insertCv(email: string, projectCount: number, generationReport: object | null = null, experienceCount = 1): string {
  const db = new Database("data/e2e.db");
  try {
    const { id: userId } = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string };
    const cvId = `e2e${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const cvData = {
      header: { name: "Camille Test", title: "Développeuse", email, phone: "0600000000", location: "Lyon", website: null, linkedin: null, github: null, image: null },
      summary: "Développeuse full-stack.",
      yearsExperience: "5 ans d'expérience",
      showPhoto: false,
      showProjects: true,
      headerBgColor: null,
      headerTextColor: null,
      headerBgImage: null,
      headerBgImagePosition: null,
      experience: Array.from({ length: experienceCount }, (_, i) => ({
        id: `exp${i}`, company: `Entreprise ${i}`, position: "Développeuse", location: "Lyon", startDate: "2020-01", endDate: "Présent",
        bullets: experienceCount === 1 ? ["A livré une API"] : Array.from({ length: 4 }, (_, j) => `Réalisation ${j} décrite assez longuement pour occuper une ligne entière du CV.`),
      })),
      education: [],
      skills: { Langages: ["TypeScript"] },
      projects: Array.from({ length: projectCount }, (_, i) => ({
        id: `p${i}`, name: `Projet ${i}`,
        description: "Une description de projet assez longue pour occuper de la place. ".repeat(3),
        technologies: ["TypeScript"], url: null, type: "side-project", role: "Autrice", impact: "Mesurable",
        highlights: ["Premier défi", "Second défi"], motivation: "", links: [], linkedExperienceId: null, displayMode: "projects-section",
      })),
      interests: [],
    };
    db.prepare(
      "INSERT INTO generated_cvs (id, user_id, title, job_offer_text, cv_data, generation_report, template_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'modern', 'draft', ?, ?)"
    ).run(cvId, userId, "Test", "Offre", JSON.stringify(cvData), generationReport && JSON.stringify(generationReport), Date.now() / 1000, Date.now() / 1000);
    return cvId;
  } finally {
    db.close();
  }
}

async function downloadedPageCount(page: import("@playwright/test").Page) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Télécharger en PDF" }).click(),
  ]);
  const pdf = readFileSync((await download.path())!).toString("latin1");
  return Number(pdf.match(/\/Count (\d+)/)![1]);
}

test("l'aperçu HTML annonce les pages, comme le PDF téléchargé", async ({ page, user }) => {
  // A long CV, from its experiences
  const cvId = insertCv(user.email, 1, null, 12);
  await page.goto(`/cv/${cvId}`);

  // The preview is the template itself, in HTML
  await expect(page.getByRole("heading", { level: 1, name: "Camille Test" })).toBeVisible();

  // Long CV: the preview warns about it, and the file has several pages too
  await expect(page.getByText(/^≈ \d+ pages — masquez des éléments/)).toBeVisible();
  expect(await downloadedPageCount(page)).toBeGreaterThan(1);

  // Hiding the experiences brings it back to one page, in the preview and in the file
  const experienceCard = page.locator("div").filter({ has: page.getByText("Expériences", { exact: true }) }).last();
  await experienceCard.getByLabel("Afficher sur le CV").first().uncheck();
  await expect(page.getByText("1 page", { exact: true })).toBeVisible();
  expect(await downloadedPageCount(page)).toBe(1);
});

test("l'éditeur montre la vérification des faits et les compétences à acquérir", async ({ page, user }) => {
  const cvId = insertCv(user.email, 1, {
    method: "model",
    checkedCount: 6,
    rejected: [{ section: "experience", text: "A encadré 5 développeurs", reason: "Chiffre absent de vos données : 5" }],
    skillsToAcquire: [{ skill: "Kubernetes", reason: "Demandé par l'offre", howToAcquire: "Certification CKA" }],
  });
  await page.goto(`/cv/${cvId}`);

  const main = page.getByRole("main");
  await expect(main.getByText(/5 phrases rédigées par l'IA ont été vérifiées/)).toBeVisible();
  await main.getByText("1 élément retiré car absent de votre profil").click();
  await expect(main.getByText("A encadré 5 développeurs")).toBeVisible();
  await expect(main.getByText("Compétences à acquérir pour ce poste")).toBeVisible();
  await expect(main.getByText("Certification CKA")).toBeVisible();
});
