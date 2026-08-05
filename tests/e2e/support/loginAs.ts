import type { Page } from "@playwright/test";

// Simule un aller-retour Steam OpenID reussi en navigant directement vers
// notre propre /api/auth/callback avec des parametres openid.* fabriques,
// plutot qu'en interceptant la navigation du navigateur vers
// steamcommunity.com : Playwright n'intercepte pas de facon fiable les
// navigations principales inter-domaines dans cet environnement (verifie
// empiriquement : `page.route()`/`context.route()` ne se declenchent jamais
// sur la redirection reelle vers steamcommunity.com, meme avec un pattern
// tres permissif). Comme /api/auth/steam est deja teste separement (voir
// "le bouton de connexion redirige bien vers /api/auth/steam" dans
// login.spec.ts, et le mock de decouverte dans steamAuthMock.ts), ce qui
// reste interessant a verifier ici est le comportement reel de
// /api/auth/callback (back/src/steamAuth.ts + nock, non modifies) face a une
// assertion OpenID valide ou invalide. Ce module ne modifie aucun fichier de
// back/src ou api/.
const CLAIMED_ID_PREFIX = "https://steamcommunity.com/openid/id/";
const LOGIN_ENDPOINT = "https://steamcommunity.com/openid/login";
// Doit correspondre a PUBLIC_BASE_URL dans playwright.config.ts (webServer de
// l'API de test).
const E2E_ORIGIN = "http://localhost:5173";

function buildFakeCallbackUrl(steamId64: string): string {
  const claimedId = `${CLAIMED_ID_PREFIX}${steamId64}`;
  const nonce = `${new Date().toISOString()}-${Math.random().toString(36).slice(2)}`;

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "id_res",
    "openid.op_endpoint": LOGIN_ENDPOINT,
    "openid.claimed_id": claimedId,
    "openid.identity": claimedId,
    "openid.return_to": `${E2E_ORIGIN}/api/auth/callback`,
    "openid.response_nonce": nonce,
    "openid.assoc_handle": "e2e-fake-handle",
    "openid.signed": "op_endpoint,claimed_id,identity,return_to,response_nonce",
    "openid.sig": "ZTJlLWZha2Utc2ln",
  });

  return `/api/auth/callback?${params.toString()}`;
}

// Callback OpenID2 "sans identite affirmee" : ns present, mode=id_res, mais
// pas de claimed_id. C'est le cas ou verifySteamAssertion (back/src/steamAuth.ts)
// resout `null` sans lever d'erreur (voir _verifyDiscoveredInformation dans
// node_modules/openid/openid.js), ce qui correspond au comportement reel
// d'un utilisateur qui refuse ou annule la connexion sur la page Steam :
// api/auth/callback.ts redirige alors vers /?auth_error=1.
export function buildDeclinedCallbackUrl(): string {
  const nonce = `${new Date().toISOString()}-${Math.random().toString(36).slice(2)}`;
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "id_res",
    "openid.return_to": `${E2E_ORIGIN}/api/auth/callback`,
    "openid.response_nonce": nonce,
  });
  return `/api/auth/callback?${params.toString()}`;
}

// Complete un login Steam simule de bout en bout : arrive authentifie sur
// /criteres (comportement reel du callback, voir api/auth/callback.ts).
export async function loginAsSteamUser(page: Page, steamId64: string): Promise<void> {
  await page.goto(buildFakeCallbackUrl(steamId64));
  await page.waitForURL("**/criteres");
}
