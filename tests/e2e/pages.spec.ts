import { test, expect } from "@playwright/test";

// Verifie que chaque page publique du site (accessible sans connexion Steam)
// charge correctement : titre visible, header/footer presents, pas d'erreur
// console. Les pages qui necessitent une session (/criteres, /resultats)
// sont couvertes par suggestion-flow.spec.ts et edge-cases.spec.ts.
const PUBLIC_PAGES: Array<{ path: string; heading: string | RegExp }> = [
  { path: "/", heading: "Ce soir, je joue à" },
  { path: "/connexion", heading: "Connectez votre compte Steam" },
  { path: "/faq", heading: /faq/i },
  { path: "/mentions-legales", heading: "Mentions légales" },
  { path: "/403", heading: "Accès refusé" },
];

for (const { path, heading } of PUBLIC_PAGES) {
  test(`la page ${path} se charge correctement`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(path);

    await expect(
      page.getByRole("heading", { level: 1 }).or(page.getByRole("heading", { level: 2 })).first(),
    ).toContainText(heading);
    await expect(page.getByRole("link", { name: "ce soir je joue à…" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Code source" })).toBeVisible();
    expect(consoleErrors, `erreurs console sur ${path} : ${consoleErrors.join("; ")}`).toEqual([]);
  });
}

test("une route inconnue affiche la page 404", async ({ page }) => {
  await page.goto("/cette-page-nexiste-pas");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cette page n'existe pas");
});

test("acceder a /criteres sans etre connecte redirige vers la connexion", async ({ page }) => {
  await page.goto("/criteres");
  await page.waitForURL("**/connexion");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Connectez votre compte Steam");
});

test("acceder a /resultats sans etre connecte redirige vers la connexion", async ({ page }) => {
  await page.goto("/resultats");
  await page.waitForURL("**/connexion");
});

test("le message d'echec de connexion s'affiche quand auth_error=1", async ({ page }) => {
  await page.goto("/connexion?auth_error=1");
  await expect(page.getByText("La connexion à Steam a échoué, réessayez.")).toBeVisible();
});
