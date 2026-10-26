import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures";
import { insertCv } from "./db";

test("le studio sélectionne au clic sur le CV et modifie la page en direct", async ({ page, user }) => {
  const cvId = insertCv(user.email, 2);
  await page.goto(`/cv/${cvId}/studio`);
  const canvas = page.getByTestId("studio-canvas");
  const inspector = page.getByRole("complementary", { name: "Inspecteur" });

  // Click on an experience on the page: its fields open in the inspector
  await canvas.getByText("Développeuse — Entreprise 1").click();
  await expect(inspector.getByRole("heading", { name: "Développeuse — Entreprise 1" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Calques" }).locator('[aria-current="true"]')).toHaveText(
    "Développeuse — Entreprise 1"
  );

  await inspector.getByLabel("Poste").fill("Lead dev");
  await expect(canvas.getByText("Lead dev — Entreprise 1")).toBeVisible();

  // A click outside the page goes back to the document's settings
  await canvas.click({ position: { x: 5, y: 5 } });
  await expect(inspector.getByRole("heading", { name: "Document" })).toBeVisible();

  await expect(page.getByRole("status").filter({ hasText: /Enregistr/ })).toHaveText("Enregistré");
  await page.reload();
  await expect(canvas.getByText("Lead dev — Entreprise 1")).toBeVisible();
});

test("l'œil d'un calque retire la section du CV", async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email)}/studio`);
  const canvas = page.getByTestId("studio-canvas");
  await expect(canvas.getByRole("heading", { name: "Centres d'intérêt" })).toBeVisible();

  await page.getByRole("button", { name: "Masquer Centres d'intérêt sur le CV" }).click();
  await expect(canvas.getByRole("heading", { name: "Centres d'intérêt" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Afficher Centres d'intérêt sur le CV" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("une section libre ajoutée depuis les calques s'édite dans l'inspecteur", async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email)}/studio`);
  await page.getByRole("button", { name: "+ Section libre" }).click();

  const inspector = page.getByRole("complementary", { name: "Inspecteur" });
  await inspector.getByLabel("Titre").fill("Langues");
  await inspector.getByLabel("Contenu").fill("Anglais : professionnel");
  await expect(page.getByTestId("studio-canvas").getByRole("heading", { name: "Langues" })).toBeVisible();
});

test("zoom au clavier et téléchargement du PDF", async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email)}/studio`);
  const zoomButton = page.getByRole("button", { name: /^Zoom \d+ %/ });
  // The page is only drawn once the studio runs: shortcuts are listened to from then on
  await expect(page.getByTestId("studio-canvas").getByRole("heading", { level: 1 })).toBeVisible();
  // On a loaded machine the first key can come before the studio listens: press until it answers
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+0");
    await expect(zoomButton).toHaveText("100 %", { timeout: 1000 });
  }).toPass();
  await page.keyboard.press("ControlOrMeta+=");
  await expect(zoomButton).toHaveText("125 %");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "PDF du CV" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("CV_Camille_Test.pdf");
  expect(readFileSync((await download.path())!).subarray(0, 5).toString()).toBe("%PDF-");
});

test("l'arrondi de la photo se règle depuis l'en-tête", async ({ page, user }) => {
  await page.goto(`/cv/${insertCv(user.email)}/studio`);
  const canvas = page.getByTestId("studio-canvas");
  // Without an uploaded photo, the CV shows the initial in the same frame
  const photo = canvas.locator("[data-artboard=cv] header [aria-hidden=true]").first();
  await expect(photo).toHaveCSS("border-radius", "50%");

  await page.getByRole("navigation", { name: "Calques" }).getByRole("button", { name: "En-tête", exact: true }).click();
  await page.getByRole("complementary", { name: "Inspecteur" }).getByLabel("Arrondi de la photo").fill("0");
  await expect(photo).toHaveCSS("border-radius", "0%");

  await expect(page.getByRole("status").filter({ hasText: /Enregistr/ })).toHaveText("Enregistré");
  await page.reload();
  await expect(photo).toHaveCSS("border-radius", "0%");
});
