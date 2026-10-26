import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./tests/setup/server-only.ts", import.meta.url)),
    },
  },
  test: {
    // Each test file gets its own in-memory SQLite database (see lib/db/index.ts)
    env: {
      DATABASE_PATH: ":memory:",
      ANTHROPIC_API_KEY: "test-key",
      // Any unmocked Claude call fails fast instead of reaching the real API
      ANTHROPIC_BASE_URL: "http://127.0.0.1:9",
    },
    clearMocks: true,
    restoreMocks: true,
    server: {
      deps: {
        // next-auth imports "next/server" without extension, which only Vite can resolve
        inline: ["next-auth"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      include: ["lib/**/*.ts", "hooks/**/*.ts", "components/**/*.tsx", "app/api/**/*.ts", "proxy.ts"],
      exclude: ["lib/db/migrations/**"],
      // Floors, not goals: raise them as coverage grows so it never goes back down.
      thresholds: {
        lines: 40,
        statements: 40,
        functions: 20,
        branches: 25,
        // Server-side logic (actions, auth, AI routes) must stay well covered
        "lib/{actions,auth,scraper,ai}/**": { lines: 95, statements: 90, functions: 95, branches: 75 },
        "app/api/**": { lines: 90, statements: 90, functions: 90, branches: 70 },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
          setupFiles: ["./tests/setup/node.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["tests/components/**/*.test.tsx", "tests/hooks/**/*.test.ts"],
          setupFiles: ["./tests/setup/dom.ts"],
        },
      },
    ],
  },
});
