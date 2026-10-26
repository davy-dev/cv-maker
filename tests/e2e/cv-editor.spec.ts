import { test, expect } from "./fixtures";
import { insertCv } from "./db";

test("une section masquée est enregistrée et le reste après rechargement", async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email)}`);
  const status = page.getByRole("status").filter({ hasText: /Enregistr|Échec/ });
  await expect(status).toHaveText("Enregistré");

  const summaryCard = page.locator("div").filter({ has: page.getByText("Résumé professionnel", { exact: true }) }).last();
  await summaryCard.getByLabel("Afficher sur le CV").uncheck();
  await expect(status).toHaveText("Enregistrement…");
  await expect(status).toHaveText("Enregistré");

  await page.reload();
  await expect(summaryCard.getByLabel("Afficher sur le CV")).not.toBeChecked();
});

test("une section libre ajoutée dans l'éditeur apparaît sur le CV imprimé", async ({ page, user }) => {
  const cvId = insertCv(user.email);
  await page.goto(`/cv/${cvId}`);

  await page.getByRole("button", { name: "+ Ajouter une section" }).click();
  await page.getByLabel("Titre", { exact: true }).last().fill("Langues");
  await page.getByLabel("Contenu").fill("**Anglais** : professionnel");
  await expect(page.getByRole("status").filter({ hasText: /Enregistr/ })).toHaveText("Enregistré");

  await page.goto(`/cv/${cvId}/print`);
  await expect(page.getByRole("heading", { name: "Langues" })).toBeVisible();
  await expect(page.getByText("Anglais", { exact: true })).toHaveJSProperty("tagName", "B");
});
