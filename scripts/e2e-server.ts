// Variante de scripts/dev-server.ts utilisee uniquement par Playwright (voir
// playwright.config.ts), qui installe les mocks reseau (Steam OpenID, Steam
// Web API, Mistral, SteamGridDB) avant de servir les routes api/ reelles,
// pour que les tests E2E n'aient jamais besoin d'un vrai compte Steam ni de
// vraies cles d'API. Ce fichier n'est jamais utilise en dev ni en prod, et
// ne modifie aucun code de back/src ou api/.
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { installSteamAuthMock } from "../tests/e2e/support/steamAuthMock";
import { installExternalApiMocks } from "../tests/e2e/support/externalApiMocks";
import { startApiServer } from "./lib/apiServer";

installSteamAuthMock();
installExternalApiMocks();

// Image de test statique (1x1 px) servie pour les affiches SteamGridDB
// mockees : les cartes du podium chargent une vraie image depuis cette URL,
// ce qui garde le rendu visuel stable pour les tests de regression (voir
// tests/e2e/support/externalApiMocks.ts).
const TEST_POSTER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function serveTestAssets(req: IncomingMessage, res: ServerResponse): boolean {
  const pathname = new URL(req.url ?? "/", `http://${req.headers.host}`).pathname;
  if (pathname === "/e2e-assets/poster.png") {
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(TEST_POSTER_PNG);
    return true;
  }
  return false;
}

startApiServer({
  apiDir: join(__dirname, "..", "api"),
  port: Number(process.env.PORT ?? 3000),
  onRequest: serveTestAssets,
});
