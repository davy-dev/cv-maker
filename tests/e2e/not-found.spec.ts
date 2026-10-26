import { test, expect } from "@playwright/test";
import { test as authedTest } from "./fixtures";

test("une URL inconnue affiche la page 404", async ({ page }) => {
  const response = await page.goto("/cette-page-n-existe-pas");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.getByRole("link", { name: "Retour à l'accueil" }).click();
  await expect(page).toHaveURL(/\/$/);
});

authedTest("un CV inexistant affiche « CV introuvable » dans l'espace", async ({ page }) => {
  await page.goto("/cv/inexistant");

  await expect(page.getByRole("heading", { name: "CV introuvable" })).toBeVisible();
  // The dashboard navigation stays available
  await expect(page.getByRole("link", { name: "Tableau de bord" })).toBeVisible();
  await page.getByRole("link", { name: "Mes CVs" }).first().click();
  await expect(page).toHaveURL(/\/cv$/);
});
