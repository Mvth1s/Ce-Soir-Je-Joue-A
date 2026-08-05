// Simule Steam OpenID pour les tests E2E, sans toucher a back/src/steamAuth.ts
// ni a aucun code de production.
//
// back/src/steamAuth.ts appelle le paquet `openid`, qui fait lui-meme ses
// requetes HTTP via `axios` (voir node_modules/openid/http.js) : `nock`
// (qui patche le module `http`/`https` de Node, utilise par axios) peut donc
// intercepter fidelement les deux etapes reseau de la verification OpenID
// stateless, sans jamais passer par le vrai steamcommunity.com :
//
// 1. Decouverte (Yadis) : un GET sur l'identifiant, qui doit renvoyer un XRDS
//    avec `Content-Type: application/xrds+xml` pour etre accepte du premier
//    coup (sinon la lib retombe sur un parsing HTML puis un fallback
//    host-meta qui, lui, ferait un vrai appel reseau externe).
//    - GET https://steamcommunity.com/openid (sans id) -> Service de type
//      ".../server" (mode "OP-Identifier", utilise par getSteamAuthUrl).
//    - GET https://steamcommunity.com/openid/id/<steamid64> -> Service de
//      type ".../signon" avec un <LocalID> egal a l'identifiant revendique
//      (utilise par verifySteamAssertion, apres que le callback ait fourni
//      ce SteamID64 dans les query params).
// 2. Verification de signature (mode stateless) : un POST avec
//    `openid.mode=check_authentication` sur l'op_endpoint, qui doit
//    repondre au format "Key-Value" attendu par la lib (`is_valid:true`),
//    voir _checkSignatureUsingProvider dans node_modules/openid/openid.js.
//
// Reference precise verifiee dans le code source du paquet installe
// (openid@2.0.17) au moment d'ecrire ce mock ; si la version du paquet
// change, revalider ce fichier contre node_modules/openid/openid.js.
import nock from "nock";

const STEAM_HOST = "https://steamcommunity.com";
const LOGIN_ENDPOINT = `${STEAM_HOST}/openid/login`;
const CLAIMED_ID_PREFIX = `${STEAM_HOST}/openid/id/`;

function serverDiscoveryXrds(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)">
  <XRD>
    <Service priority="0">
      <Type>http://specs.openid.net/auth/2.0/server</Type>
      <URI>${LOGIN_ENDPOINT}</URI>
    </Service>
  </XRD>
</xrds:XRDS>`;
}

function signonDiscoveryXrds(claimedId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)">
  <XRD>
    <Service priority="0">
      <Type>http://specs.openid.net/auth/2.0/signon</Type>
      <URI>${LOGIN_ENDPOINT}</URI>
      <LocalID>${claimedId}</LocalID>
    </Service>
  </XRD>
</xrds:XRDS>`;
}

let installed = false;

// A appeler une seule fois, avant de servir la moindre requete (voir
// scripts/e2e-server.ts). Les interceptors sont `.persist()` : reutilisables
// pour toute la duree du process, quel que soit le nombre de tests qui se
// (re)connectent.
export function installSteamAuthMock(): void {
  if (installed) return;
  installed = true;

  // Filet de securite : bloque tout appel HTTP (core http/https, donc axios)
  // vers un hote externe non explicitement mocke, pour ne jamais retomber
  // silencieusement sur le vrai Steam pendant les tests. Le driver Postgres
  // (@neondatabase/serverless) et `fetch` (Mistral/SteamGridDB/Steam Web API,
  // mockes separement via undici MockAgent, voir externalApiMocks.ts) ne
  // passent pas par ce module et ne sont donc pas concernes.
  nock.disableNetConnect();
  nock.enableNetConnect(/^(127\.0\.0\.1|localhost)/);

  nock(STEAM_HOST)
    .persist()
    .get("/openid")
    .reply(200, serverDiscoveryXrds(), { "Content-Type": "application/xrds+xml" });

  nock(STEAM_HOST)
    .persist()
    .get(/^\/openid\/id\/(.+)$/)
    .reply((uri) => {
      const claimedId = `${STEAM_HOST}${uri}`;
      return [200, signonDiscoveryXrds(claimedId), { "Content-Type": "application/xrds+xml" }];
    });

  nock(STEAM_HOST)
    .persist()
    .post("/openid/login", () => true)
    .reply(200, "is_valid:true\n", { "Content-Type": "text/plain" });
}

export function steamClaimedId(steamId64: string): string {
  return `${CLAIMED_ID_PREFIX}${steamId64}`;
}
