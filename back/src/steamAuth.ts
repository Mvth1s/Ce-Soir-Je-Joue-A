import { RelyingParty } from "openid";

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid";
const CLAIMED_ID_PREFIX = "https://steamcommunity.com/openid/id/";

function createRelyingParty(returnUrl: string): RelyingParty {
  // Mode stateless : pas de session serveur pour stocker l'association/le nonce.
  // La verification (verifySteamAssertion) revalide directement aupres de Steam a chaque callback.
  return new RelyingParty(returnUrl, null, true, false, []);
}

export function getSteamAuthUrl(returnUrl: string): Promise<string> {
  const relyingParty = createRelyingParty(returnUrl);
  return new Promise((resolve, reject) => {
    relyingParty.authenticate(STEAM_OPENID_ENDPOINT, false, (err, authUrl) => {
      if (err || !authUrl) {
        reject(err ?? new Error("Steam n'a pas renvoye d'URL d'authentification."));
        return;
      }
      resolve(authUrl);
    });
  });
}

export function verifySteamAssertion(
  returnUrl: string,
  query: Record<string, unknown>,
): Promise<string | null> {
  const relyingParty = createRelyingParty(returnUrl);
  const callbackUrl = buildCallbackUrl(returnUrl, query);

  return new Promise((resolve, reject) => {
    // On passe l'URL complete du callback (forme "string") plutot qu'un objet
    // requete simule : la reponse OpenID de Steam est toujours une redirection GET
    // (reponse indirecte), et le paquet `openid` gere nativement ce cas en parsant
    // directement les query params de l'URL fournie.
    relyingParty.verifyAssertion(callbackUrl, (err, result) => {
      if (err) {
        reject(new Error(err.message));
        return;
      }
      if (!result?.authenticated || !result.claimedIdentifier) {
        resolve(null);
        return;
      }
      resolve(extractSteamId64(result.claimedIdentifier));
    });
  });
}

function buildCallbackUrl(returnUrl: string, query: Record<string, unknown>): string {
  const url = new URL(returnUrl);
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function extractSteamId64(claimedIdentifier: string): string | null {
  if (!claimedIdentifier.startsWith(CLAIMED_ID_PREFIX)) {
    return null;
  }
  const steamId64 = claimedIdentifier.slice(CLAIMED_ID_PREFIX.length);
  return /^\d+$/.test(steamId64) ? steamId64 : null;
}
