import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures";
import { insertCv } from "./db";

test("sans lettre, le canevas propose de la générer", async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email)}/studio`);
  const letterPage = page.getByLabel("Lettre de motivation", { exact: true });

  await expect(letterPage.getByRole("button", { name: "Générer la lettre de motivation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "PDF de la lettre" })).toHaveCount(0);
});

test("la lettre s'édite à côté du CV, s'annule, s'enregistre et se télécharge", async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email, 1, { withLetter: true })}/studio`);
  const letterPage = page.getByLabel("Lettre de motivation", { exact: true });
  await expect(letterPage.getByText("Votre mission me parle.")).toBeVisible();

  // Edited in place, like the CV
  await letterPage.getByText("Votre mission me parle.").dblclick();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Votre produit me parle.");
  await page.keyboard.press("Enter");
  await expect(letterPage.getByText("Votre produit me parle.")).toBeVisible();

  // One undo history for the CV and the letter
  await page.keyboard.press("ControlOrMeta+z");
  await expect(letterPage.getByText("Votre mission me parle.")).toBeVisible();
  await page.keyboard.press("ControlOrMeta+Shift+z");

  // A click on the letter opens its fields in the inspector
  await letterPage.getByText("Madame,", { exact: true }).click();
  const inspector = page.getByRole("complementary", { name: "Inspecteur" });
  await inspector.getByLabel("Nom du contact").fill("M. Martin");
  await expect(letterPage.getByText("M. Martin")).toBeVisible();

  await expect(page.getByRole("status").filter({ hasText: /Enregistr/ })).toHaveText("Enregistré");
  await page.reload();
  await expect(letterPage.getByText("Votre produit me parle.")).toBeVisible();
  await expect(letterPage.getByText("M. Martin")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "PDF de la lettre" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("Lettre_Camille_Test.pdf");
  expect(readFileSync((await download.path())!).subarray(0, 5).toString()).toBe("%PDF-");
});

test("sur un téléphone, le studio renvoie vers l'éditeur classique", async ({ page, user }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cvId = insertCv(user.email);
  await page.goto(`/cv/${cvId}/studio`);

  await expect(page.getByRole("link", { name: "Ouvrir l'éditeur classique" })).toHaveAttribute("href", `/cv/${cvId}`);
  await expect(page.getByTestId("studio-canvas")).toBeHidden();
});
