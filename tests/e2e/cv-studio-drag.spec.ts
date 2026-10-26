import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { insertCv } from "./db";

/** Presses on `from`, travels in steps and releases just inside the top (or bottom) edge of `to`. */
async function drag(page: Page, from: Locator, to: Locator, edge: "top" | "bottom" = "top") {
  const start = (await from.boundingBox())!;
  const end = (await to.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  const y = edge === "top" ? end.y + 2 : end.y + end.height - 2;
  await page.mouse.move(end.x + end.width / 2, y, { steps: 8 });
  await expect(page.getByTestId("drop-line")).toBeVisible();
  await page.mouse.up();
}

test.beforeEach(async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email, 2)}/studio`);
  await expect(page.getByTestId("studio-canvas").getByRole("heading", { level: 1 })).toBeVisible();
});

test("glisser une puce sur la page la déplace", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  const firstExperience = canvas.locator("ul").first().locator("li");

  await drag(page, firstExperience.nth(3), firstExperience.nth(0));
  await expect(firstExperience).toHaveText([/^Réalisation 3/, /^Réalisation 0/, /^Réalisation 1/, /^Réalisation 2/]);
});

test("glisser une expérience sur la page la fait passer devant l'autre", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  await drag(page, canvas.getByText("Développeuse — Entreprise 1"), canvas.getByText("Développeuse — Entreprise 0"));

  await expect(canvas.locator('[data-select^="item:experience:"]').first()).toContainText("Entreprise 1");
  await expect(page.getByRole("status").filter({ hasText: /Enregistr/ })).toHaveText("Enregistré");
  await page.reload();
  await expect(canvas.locator('[data-select^="item:experience:"]').first()).toContainText("Entreprise 1");
});

test("glisser une section de la colonne latérale vers la colonne principale", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  await drag(page, canvas.getByRole("heading", { name: "Centres d'intérêt" }), canvas.getByRole("heading", { name: "Profil" }));

  await expect(canvas.locator("main h2")).toHaveText(["Centres d'intérêt", "Profil", "Expérience professionnelle"]);
  await expect(canvas.locator("aside h2")).toHaveText(["Compétences techniques"]);
});

test("les calques se réordonnent par glisser-déposer", async ({ page }) => {
  const layers = page.getByRole("navigation", { name: "Calques" });
  await layers.getByRole("button", { name: "Centres d'intérêt", exact: true }).dragTo(
    layers.getByRole("button", { name: "Compétences techniques", exact: true }),
    { targetPosition: { x: 10, y: 2 } }
  );

  await expect(page.getByTestId("studio-canvas").locator("aside h2")).toHaveText(["Centres d'intérêt", "Compétences techniques"]);
});

test("Alt + flèches déplacent la sélection au clavier", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  await page.getByRole("navigation", { name: "Calques" }).getByRole("button", { name: "Profil", exact: true }).click();

  await page.keyboard.press("Alt+ArrowDown");
  await expect(canvas.locator("main h2")).toHaveText(["Expérience professionnelle", "Profil"]);
  await page.keyboard.press("Alt+ArrowRight");
  await expect(canvas.locator("aside h2")).toHaveText(["Compétences techniques", "Profil", "Centres d'intérêt"]);
});
