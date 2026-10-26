import Database from "better-sqlite3";
import { test, expect } from "./fixtures";

// The CV is written straight into the E2E database: the app never calls Claude here.
function insertCv(email: string, experienceCount: number): string {
  const db = new Database("data/e2e.db");
  try {
    const { id: userId } = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string };
    const cvId = `e2e${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const cvData = {
      header: { name: "Camille Test", title: "Développeuse fullstack", email, phone: "0600000000", location: "Lyon", website: null, linkedin: "linkedin.com/in/camille", github: null, image: null },
      summary: "Développeuse **full-stack** depuis 5 ans.",
      yearsExperience: "5 ans d'expérience",
      showPhoto: true,
      showProjects: true,
      headerBgColor: null,
      headerTextColor: null,
      headerBgImage: null,
      headerBgImagePosition: null,
      experience: Array.from({ length: experienceCount }, (_, i) => ({
        id: `exp${i}`, company: `Entreprise ${i}`, position: "Développeuse", location: "Lyon", startDate: "2020-01", endDate: "Présent",
        bullets: Array.from({ length: 4 }, (_, j) => `**Réalisation ${j}** décrite assez longuement pour occuper une ligne entière du CV.`),
      })),
      education: [],
      skills: { Langages: ["TypeScript", "SQL"] },
      projects: [],
      interests: ["Piano"],
    };
    db.prepare(
      "INSERT INTO generated_cvs (id, user_id, title, job_offer_text, cv_data, template_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'modern', 'draft', ?, ?)"
    ).run(cvId, userId, "Test", "Offre", JSON.stringify(cvData), Date.now() / 1000, Date.now() / 1000);
    return cvId;
  } finally {
    db.close();
  }
}

async function downloadPdf(page: import("@playwright/test").Page, cvId: string) {
  const res = await page.request.get(`/api/cv/${cvId}/pdf`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/pdf");
  const pdf = (await res.body()).toString("latin1");
  expect(pdf.startsWith("%PDF-")).toBe(true);
  return { pageCount: Number(pdf.match(/\/Count (\d+)/)![1]) };
}

test("la page d'impression affiche le CV en HTML", async ({ page, user }) => {
  const cvId = insertCv(user.email, 1);
  await page.goto(`/cv/${cvId}/print`);

  await expect(page.getByRole("heading", { level: 1, name: "Camille Test" })).toBeVisible();
  await expect(page.getByText("full-stack", { exact: true })).toHaveJSProperty("tagName", "B");
  await expect(page.getByRole("link", { name: "linkedin.com/in/camille" })).toHaveAttribute("href", "https://linkedin.com/in/camille");
});

test("le PDF est imprimé par Chrome depuis la page HTML", async ({ page, user }) => {
  expect((await downloadPdf(page, insertCv(user.email, 1))).pageCount).toBe(1);
  expect((await downloadPdf(page, insertCv(user.email, 12))).pageCount).toBeGreaterThan(1);
});

test("le PDF d'un autre compte est refusé", async ({ page }) => {
  const res = await page.request.get("/api/cv/inexistant/pdf");
  expect(res.status()).toBe(404);
});
