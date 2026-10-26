import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Playwright no longer ships Chromium for macOS 13: fall back to the installed Google Chrome locally.
        channel: isCI ? undefined : "chrome",
      },
    },
  ],
  webServer: {
    // Production build on a dedicated port and database, so the dev server and its data are left untouched.
    command: `rm -rf data/e2e.db* data/e2e-uploads && mkdir -p data && npx drizzle-kit migrate && npm run build && npx next start -p ${PORT}`,
    url: `${baseURL}/login`,
    timeout: 300_000,
    reuseExistingServer: !isCI,
    env: {
      DATABASE_PATH: "data/e2e.db",
      UPLOAD_DIR: "data/e2e-uploads",
      AUTH_URL: baseURL,
      // The PDF route prints with the same browser as the tests
      PDF_BROWSER_CHANNEL: isCI ? "" : "chrome",
    },
  },
});
