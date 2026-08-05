import { defineConfig, devices } from "@playwright/test";

// Un seul moteur de rendu (chromium) : les tests de regression visuelle
// (toHaveScreenshot) comparent des pixels, et des moteurs differents (webkit,
// firefox) produisent des baselines differentes pour la meme page. Voir
// tests/README.md pour le detail de ce choix.
const PORT_FRONT = 5173;
const PORT_API = 3000;

export default defineConfig({
  testDir: "./tests/e2e",
  snapshotDir: "./tests/e2e/__screenshots__",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: {
    // Tolerance volontairement non nulle : les polices/animations peuvent
    // decaler quelques pixels d'un run a l'autre meme en CI stable.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: `http://localhost:${PORT_FRONT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // DATABASE_URL est la seule variable qui doit deja etre presente dans
      // l'environnement appelant (voir tests/README.md) : c'est la seule
      // donnee qui ne peut pas etre une valeur bidon, puisque scripts/e2e-server.ts
      // a quand meme besoin d'une vraie base Postgres (Neon) pour stocker
      // users/platform_links/library_cache pendant les tests.
      command: "tsx scripts/e2e-server.ts",
      port: PORT_API,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        PORT: String(PORT_API),
        NODE_ENV: "test",
        PUBLIC_BASE_URL: `http://localhost:${PORT_FRONT}`,
        SESSION_SECRET: "e2e-test-session-secret-do-not-use-in-prod-32ch",
        STEAM_API_KEY: "e2e-dummy-key",
        MISTRAL_API_KEY: "e2e-dummy-key",
        STEAMGRIDDB_API_KEY: "e2e-dummy-key",
      },
    },
    {
      command: "pnpm --filter front dev",
      port: PORT_FRONT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
