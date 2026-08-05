// Serveur de developpement local pour les fonctions api/*.ts. Voir
// scripts/lib/apiServer.ts pour la logique de decouverte des routes,
// partagee avec scripts/e2e-server.ts.
import { join } from "node:path";
import { startApiServer } from "./lib/apiServer";

// __dirname (pas import.meta.url) : ce fichier est execute en CommonJS
// (voir "type": "commonjs" dans le package.json racine).
startApiServer({
  apiDir: join(__dirname, "..", "api"),
  port: Number(process.env.PORT ?? 3000),
});
