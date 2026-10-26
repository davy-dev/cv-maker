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
