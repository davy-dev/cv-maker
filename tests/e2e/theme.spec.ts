import { test as publicTest, expect } from "@playwright/test";
import { test } from "./fixtures";

// Regression: with the OS in dark mode, the page turned black and card titles light gray.
publicTest.use({ colorScheme: "dark" });
test.use({ colorScheme: "dark" });

publicTest("la page d'accueil reste sur fond blanc en mode sombre", async ({ page }) => {
  await page.goto("/");
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe("rgb(255, 255, 255)");
});

test("les titres de section du profil restent foncés en mode sombre", async ({ page }) => {
  await page.goto("/profile");
  const title = page.getByRole("heading", { name: "Informations personnelles" });
  await expect(title).toBeVisible();
  // Relative luminance of the rendered color (0 = black, 1 = white), whatever the CSS color format
  const luminance = await title.evaluate((el) => {
    const canvas = document.createElement("canvas").getContext("2d")!;
    canvas.fillStyle = getComputedStyle(el).color;
    canvas.fillRect(0, 0, 1, 1);
    const [r, g, b] = canvas.getImageData(0, 0, 1, 1).data;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  });
  expect(luminance).toBeLessThan(0.2);
});
