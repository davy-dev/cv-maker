import { test, expect } from "./fixtures";
import { insertCv } from "./db";

test.beforeEach(async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email, 2)}/studio`);
  await expect(page.getByTestId("studio-canvas").getByRole("heading", { level: 1 })).toBeVisible();
});

test("⌘Z annule une saisie d'un coup, ⇧⌘Z la rétablit", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  const name = canvas.getByRole("heading", { level: 1 });
  // Beside the name, on the title's line: still edits the name
  await name.dblclick({ position: { x: (await name.boundingBox())!.width - 5, y: 10 } });
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Camille Martin");
  await page.keyboard.press("Enter");
  await expect(name).toHaveText("Camille Martin");

  // The whole word typed is one step
  await page.keyboard.press("ControlOrMeta+z");
  await expect(name).toHaveText("Camille Test");
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(name).toHaveText("Camille Martin");

  await page.getByRole("button", { name: "Annuler (⌘Z)" }).click();
  await expect(name).toHaveText("Camille Test");
  await expect(page.getByRole("button", { name: "Annuler (⌘Z)" })).toBeDisabled();
});

test("Suppr retire l'élément sélectionné, ⌘Z le rend", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  const experiences = canvas.locator('[data-select^="item:experience:"]');
  await canvas.getByText("Développeuse — Entreprise 0").click();

  await page.keyboard.press("Delete");
  await expect(experiences).toHaveCount(1);
  await expect(page.getByText("Supprimé. ⌘Z pour annuler.")).toBeVisible();

  await page.keyboard.press("ControlOrMeta+z");
  await expect(experiences).toHaveCount(2);
  await expect(experiences.first()).toContainText("Entreprise 0");
});

test("⌘D duplique l'élément sélectionné et sélectionne la copie", async ({ page }) => {
  const canvas = page.getByTestId("studio-canvas");
  await canvas.getByText("Développeuse — Entreprise 1").click();
  await page.keyboard.press("ControlOrMeta+d");

  await expect(canvas.getByText("Développeuse — Entreprise 1")).toHaveCount(2);
  const inspector = page.getByRole("complementary", { name: "Inspecteur" });
  await inspector.getByLabel("Entreprise").fill("Copie SA");
  await expect(canvas.locator('[data-select^="item:experience:"]').nth(2)).toContainText("Copie SA");
});

test("une expérience ajoutée depuis l'inspecteur s'ouvre aussitôt", async ({ page }) => {
  await page.getByRole("navigation", { name: "Calques" }).getByRole("button", { name: "Expérience professionnelle", exact: true }).click();
  const inspector = page.getByRole("complementary", { name: "Inspecteur" });
  await inspector.getByRole("button", { name: "+ Ajouter une expérience" }).click();

  await inspector.getByLabel("Poste").fill("Architecte");
  await expect(page.getByTestId("studio-canvas").getByText("Architecte", { exact: true })).toBeVisible();
});
