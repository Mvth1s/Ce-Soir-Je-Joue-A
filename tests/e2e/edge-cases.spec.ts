import { test, expect } from "@playwright/test";
import { loginAsSteamUser } from "./support/loginAs";
import { emptyLibrarySteamId } from "./fixtures/library";

// Cas limite "bibliotheque vide" (docs/01-cahier-des-charges.md) : la Steam
// Web API mockee renvoie une reponse sans jeux pour ce SteamID64 reserve
// (voir tests/e2e/support/externalApiMocks.ts), ce qui declenche le repli
// sur les jeux gratuits Steam (back/src/freeGames.ts), sans appel a Mistral.
test("une bibliotheque Steam vide bascule sur des jeux gratuits", async ({ page }) => {
  await loginAsSteamUser(page, emptyLibrarySteamId());

  await expect(page.getByText(/bibliothèque Steam est vide/)).toBeVisible();

  await page.getByRole("button", { name: "Trouver mes 3 jeux" }).click();
  await page.waitForURL("**/resultats");

  await expect(page.getByText("Votre podium du soir")).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText("Votre bibliothèque Steam est vide : voici une sélection de jeux gratuits"),
  ).toBeVisible();

  const goldCard = page.locator('[data-size="gold"]');
  await goldCard.hover();
  await expect(goldCard.getByText("Jeu gratuit suggéré")).toBeVisible();
});

// Cas limite "aucune suggestion possible" : on force /api/suggest a echouer
// cote navigateur (Playwright route), sans toucher au backend, pour verifier
// l'ecran d'erreur et le bouton "Reessayer".
test("un echec du calcul de suggestions affiche un message et permet de reessayer", async ({ page }) => {
  await loginAsSteamUser(page, emptyLibrarySteamId());

  let shouldFail = true;
  await page.route("**/api/suggest", async (route) => {
    if (shouldFail) {
      await route.fulfill({ status: 500, body: JSON.stringify({ error: "suggestion_failed" }) });
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "Trouver mes 3 jeux" }).click();
  await page.waitForURL("**/resultats");

  await expect(page.getByText("Impossible de calculer vos suggestions pour le moment.")).toBeVisible();

  shouldFail = false;
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.getByText("Votre podium du soir")).toBeVisible({ timeout: 10_000 });
});

test("depuis l'ecran d'erreur, modifier les criteres revient au formulaire", async ({ page }) => {
  await loginAsSteamUser(page, emptyLibrarySteamId());

  await page.route("**/api/suggest", async (route) => {
    await route.fulfill({ status: 500, body: JSON.stringify({ error: "suggestion_failed" }) });
  });

  await page.getByRole("button", { name: "Trouver mes 3 jeux" }).click();
  await page.waitForURL("**/resultats");
  await expect(page.getByText("Impossible de calculer vos suggestions pour le moment.")).toBeVisible();

  await page.getByRole("button", { name: "Modifier mes critères" }).click();
  await page.waitForURL("**/criteres");
});
