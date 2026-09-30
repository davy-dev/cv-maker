import { test, expect } from "@playwright/test";
import { newUser, register, login } from "./fixtures";

test.describe("Accès public", () => {
  test("la page d'accueil mène à l'inscription et à la connexion", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Connexion" }).click();
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

    await page.getByRole("link", { name: "S'inscrire" }).click();
    await expect(page.getByRole("heading", { name: "Créer un compte" })).toBeVisible();
  });

  for (const path of ["/dashboard", "/profile", "/skills", "/cv", "/cv/new"]) {
    test(`${path} redirige un visiteur vers /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Authentification", () => {
  test("inscription → tableau de bord → déconnexion → reconnexion", async ({ page }) => {
    const user = newUser();

    await register(page, user);
    await expect(page.getByRole("heading", { name: `Bonjour, ${user.name} !` })).toBeVisible();

    await page.getByRole("button", { name: user.name }).click();
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/$/);

    await login(page, user);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("un utilisateur connecté est renvoyé de /login vers /dashboard", async ({ page }) => {
    await register(page, newUser());
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  // The second half of these tests runs in a fresh context: clearing cookies races
  // with in-flight /api/auth/session requests that set the session cookie again.
  test("refuse un mauvais mot de passe", async ({ page: registerPage, browser }) => {
    const user = newUser();
    await register(registerPage, user);
    const page = await (await browser.newContext()).newPage();

    await login(page, { ...user, password: "mauvais-mdp" });

    await expect(page.getByText("Email ou mot de passe incorrect")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("refuse une seconde inscription avec le même email", async ({ page: registerPage, browser }) => {
    const user = newUser();
    await register(registerPage, user);
    const page = await (await browser.newContext()).newPage();

    await page.goto("/register");
    await page.getByLabel("Nom complet").fill("Autre");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mot de passe").fill("autremdp");
    await page.getByRole("button", { name: "S'inscrire" }).click();

    await expect(page.getByText("Un compte existe déjà avec cet email")).toBeVisible();
  });
});
