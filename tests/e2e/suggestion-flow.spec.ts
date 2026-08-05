import { test, expect } from "@playwright/test";
import { loginAsSteamUser } from "./support/loginAs";
import { defaultSteamId, EXPECTED_PODIUM } from "./fixtures/library";

async function goToResults(page: import("@playwright/test").Page) {
  await loginAsSteamUser(page, defaultSteamId());
  await page.getByRole("button", { name: "Trouver mes 3 jeux" }).click();
  await page.waitForURL("**/resultats");
  await expect(page.getByText("Votre podium du soir")).toBeVisible({ timeout: 10_000 });
}

// Les cartes du podium (attribut data-size) sont utilisees plutot que
// getByRole("link", { name }) : le nom du jeu apparait aussi dans le bouton
// "Lancer <jeu>" en bas de page, ce qui rend une recherche par nom seule
// ambigue (strict mode violation).
test("le flux complet criteres -> podium affiche les 3 jeux attendus", async ({ page }) => {
  await goToResults(page);

  await expect(page.locator('[data-size="gold"]')).toContainText(EXPECTED_PODIUM.gold);
  await expect(page.locator('[data-size="silver"]')).toContainText(EXPECTED_PODIUM.silver);
  await expect(page.locator('[data-size="bronze"]')).toContainText(EXPECTED_PODIUM.bronze);
});

test("survoler la carte or revele l'explication du choix", async ({ page }) => {
  await goToResults(page);

  const goldCard = page.locator('[data-size="gold"]');
  const inner = goldCard.locator(".podium-card__inner");

  const transformBefore = await inner.evaluate((el) => getComputedStyle(el).transform);
  await goldCard.hover();
  await expect(async () => {
    const transformAfter = await inner.evaluate((el) => getComputedStyle(el).transform);
    expect(transformAfter).not.toBe(transformBefore);
  }).toPass({ timeout: 2_000 });

  await expect(goldCard.getByText("pourquoi ce jeu")).toBeVisible();
});

test("cliquer sur une carte ouvre la fiche Steam du jeu", async ({ page, context }) => {
  await goToResults(page);

  const goldCard = page.locator('[data-size="gold"]');
  const appid = await goldCard.evaluate((el) => (el as HTMLAnchorElement).href.match(/app\/(\d+)/)?.[1]);

  const [popup] = await Promise.all([context.waitForEvent("page"), goldCard.click()]);
  await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
  // Steam redirige vers une URL canonique avec le nom du jeu en suffixe
  // (ex. /app/570/Dota_2/) : on ne verifie que le chemin qu'on maitrise.
  expect(popup.url()).toContain(`/app/${appid}/`);
});

test("les criteres choisis se retrouvent dans le recapitulatif des resultats", async ({ page }) => {
  await loginAsSteamUser(page, defaultSteamId());
  await page.getByRole("button", { name: "Défi" }).click();
  await page.getByRole("button", { name: "Cramé" }).click();
  await page.getByRole("button", { name: "Trouver mes 3 jeux" }).click();
  await page.waitForURL("**/resultats");
  await expect(page.getByText(/défi/i)).toBeVisible();
});
