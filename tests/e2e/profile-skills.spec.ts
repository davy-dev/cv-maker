import zlib from "node:zlib";
import { test, expect } from "./fixtures";

// These flows never call the Claude API, so they are free to run on every push.
// Queries are scoped to <main>: with loading.tsx, React streams the page into a hidden
// container before swapping it in, so text briefly exists twice in the document.

test("ajouter puis supprimer une compétence", async ({ page }) => {
  await page.goto("/skills");
  await expect(page.getByRole("main").getByText("Aucune compétence ajoutée.")).toBeVisible();

  await page.getByRole("button", { name: "Ajouter une compétence" }).click();
  await page.getByRole("main").getByPlaceholder("ex: React").fill("Playwright");
  const [category, level] = await page.getByRole("main").getByRole("combobox").all();
  await category.selectOption("tool");
  await level.selectOption("4");
  await page.getByRole("main").getByPlaceholder("3.5").fill("2");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Outils" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Playwright")).toBeVisible();
  await expect(page.getByRole("main").getByText("1 compétence")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("main").getByText("Playwright").hover();
  await page.getByRole("main").getByTitle("Supprimer").click();
  await expect(page.getByRole("main").getByText("Aucune compétence ajoutée.")).toBeVisible();
});

test("mettre à jour le profil", async ({ page }) => {
  await page.goto("/profile");

  await page.getByRole("main").getByPlaceholder("ex: Développeur Full-Stack Senior").fill("Ingénieure QA");
  await page.getByRole("main").getByPlaceholder("Paris, France").fill("Lyon, France");
  await page.getByRole("button", { name: "Enregistrer le profil" }).click();
  await expect(page.getByRole("main").getByText("Profil mis à jour")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("main").getByPlaceholder("ex: Développeur Full-Stack Senior")).toHaveValue("Ingénieure QA");
  await expect(page.getByRole("main").getByPlaceholder("Paris, France")).toHaveValue("Lyon, France");
});

/** A real 8×8 red PNG, so the server's format check sees genuine image bytes. */
function redPng(): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(8, 0);
  header.writeUInt32BE(8, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const rows = Buffer.concat(Array.from({ length: 8 }, () => Buffer.from([0, ...Array(8).fill([255, 0, 0]).flat()])));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

test("la photo de profil est enregistrée et reste affichée après rechargement", async ({ page, user }) => {
  await page.goto("/profile");

  await page
    .getByRole("main")
    .locator('input[type="file"]')
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: redPng() });

  const photo = page.getByRole("main").getByAltText("Photo de profil");
  await expect(photo).toHaveAttribute("src", /^\/uploads\/.+\.png$/);
  const savedSrc = await photo.getAttribute("src");

  // The header avatar picks the new photo up without logging out
  await expect(page.getByRole("button", { name: user.name }).locator("img")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("main").getByAltText("Photo de profil")).toHaveAttribute("src", savedSrc!);
  // The file is actually served
  expect((await page.request.get(savedSrc!)).status()).toBe(200);
});

test("explique pourquoi une photo trop lourde est refusée", async ({ page }) => {
  await page.goto("/profile");

  await page
    .getByRole("main")
    .locator('input[type="file"]')
    .setInputFiles({ name: "grosse.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(3 * 1024 * 1024) });

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(/Fichier trop volumineux/);
});

test("refuse un lien de profil invalide", async ({ page }) => {
  await page.goto("/profile");

  await page.getByRole("main").getByPlaceholder("https://linkedin.com/in/...").fill("linkedin");
  await page.getByRole("button", { name: "Enregistrer le profil" }).click();

  await expect(page.getByRole("main").getByText("URL invalide")).toBeVisible();
});

test("l'analyse d'offre demande d'abord des compétences (sans appeler l'IA)", async ({ page }) => {
  await page.goto("/cv/new");

  await page
    .getByPlaceholder("Collez ici le texte complet de l'offre d'emploi...")
    .fill("Nous recherchons un développeur React confirmé pour rejoindre notre équipe.");
  await page.getByRole("button", { name: "Analyser l'offre" }).click();

  await expect(page.getByRole("main").getByText(/Aucune compétence trouvée/)).toBeVisible();
});
