import { test, expect } from "./fixtures";
import { insertCv } from "./db";

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
