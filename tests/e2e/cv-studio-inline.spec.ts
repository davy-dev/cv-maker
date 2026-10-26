import { test, expect } from "./fixtures";
import { insertCv } from "./db";

test.beforeEach(async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email)}/studio`);
  // The page is drawn once the studio runs
  await expect(page.getByTestId("studio-canvas").getByRole("heading", { level: 1 })).toBeVisible();
});

test("double-clic sur le nom : modifié en direct sur la page et enregistré", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  await canvas.getByText("Camille Test", { exact: true }).dblclick();
  const textbox = page.getByRole("textbox", { name: "Texte du CV" });
  await expect(textbox).toBeFocused();

  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Camille Martin");
  // The page changes as it is typed into
  await canvas.getByText("Camille Martin").waitFor();
  await page.keyboard.press("Enter");
  await expect(textbox).toHaveCount(0);

  await expect(page.getByRole("status").filter({ hasText: /Enregistr/ })).toHaveText("Enregistré");
  await page.reload();
  await expect(canvas.getByRole("heading", { level: 1 })).toHaveText("Camille Martin");
});

test("Échap annule la saisie", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  await canvas.getByText("Entreprise 0", { exact: true }).dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Autre");
  await expect(canvas.getByText("Développeuse — Autre")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(canvas.getByText("Développeuse — Entreprise 0")).toBeVisible();
});

test("Entrée dans une puce en crée une nouvelle, Retour arrière la retire si elle est vide", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  const bullets = canvas.locator("li");
  await expect(bullets).toHaveCount(4);

  await canvas.getByText("Réalisation 0", { exact: true }).dblclick();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(bullets).toHaveCount(5);
  await expect(page.getByRole("textbox", { name: "Texte du CV" })).toBeFocused();
  await page.keyboard.type("Nouvelle **réussite**");
  await page.keyboard.press("Enter");
  await expect(bullets).toHaveCount(6);

  // The empty point just created goes away, typing resumes on the one before
  await page.keyboard.press("Backspace");
  await expect(bullets).toHaveCount(5);
  await page.keyboard.press("Escape");
  await expect(bullets.nth(1)).toHaveText("Nouvelle réussite");
  await expect(bullets.nth(1).getByText("réussite")).toHaveJSProperty("tagName", "B");
});
