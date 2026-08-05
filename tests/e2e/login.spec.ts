import { test, expect } from "@playwright/test";
import { buildDeclinedCallbackUrl, loginAsSteamUser } from "./support/loginAs";
import { defaultSteamId } from "./fixtures/library";

// api/auth/callback.ts s'execute pour de vrai ici ; seule la reponse de
// steamcommunity.com est simulee (voir tests/e2e/support/steamAuthMock.ts et
// loginAs.ts). Aucun compte Steam reel n'est necessaire. Le fait que le
// clic sur le bouton mene bien a /api/auth/steam (qui construit l'URL Steam
// reelle a partir de la decouverte mockee) est verifie separement plus bas.
test("se connecter avec Steam mene aux criteres", async ({ page }) => {
  await loginAsSteamUser(page, defaultSteamId());
  await expect(page).toHaveURL(/\/criteres$/);
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Où en êtes-vous, ce soir ?");
});

test("la session ouverte par la connexion persiste sur un rechargement", async ({ page }) => {
  await loginAsSteamUser(page, defaultSteamId());
  await page.reload();
  await expect(page).toHaveURL(/\/criteres$/);
});

test("une connexion Steam refusee renvoie vers la connexion avec un message d'erreur", async ({ page }) => {
  await page.goto(buildDeclinedCallbackUrl());
  await page.waitForURL("**/connexion?auth_error=1");
  await expect(page.getByText("La connexion à Steam a échoué, réessayez.")).toBeVisible();
});

test("le bouton de connexion pointe vers /api/auth/steam", async ({ page }) => {
  // Verifie la cible du lien sans suivre la navigation jusqu'au bout : un
  // clic reel partirait ensuite vers le vrai steamcommunity.com (voir
  // support/loginAs.ts), ce que la suite E2E doit justement eviter.
  await page.goto("/connexion");
  await expect(page.getByRole("link", { name: "Se connecter avec Steam" })).toHaveAttribute(
    "href",
    "/api/auth/steam",
  );
});
