import { test as base, expect, type Page } from "@playwright/test";

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

export function newUser(): TestUser {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { name: "Camille Test", email: `e2e-${id}@exemple.com`, password: "motdepasse" };
}

export async function register(page: Page, user: TestUser) {
  await page.goto("/register");
  await page.getByLabel("Nom complet").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByRole("button", { name: "S'inscrire" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function login(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

/** Every test starts logged in as a freshly registered user. */
export const test = base.extend<{ user: TestUser }>({
  user: [
    async ({ page }, use) => {
      const user = newUser();
      await register(page, user);
      await use(user);
    },
    { auto: true },
  ],
});

export { expect };
