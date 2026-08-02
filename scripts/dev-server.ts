// Serveur de developpement local pour les fonctions api/*.ts, sans passer par
// `vercel dev`. Chaque fichier sous api/ est deja un handler Node standard
// `(req, res) => ...` (voir CLAUDE.md : pas de dependance a @vercel/node), ce
// qui permet de les executer directement sous un serveur http natif. Les
// routes sont decouvertes automatiquement depuis l'arborescence de api/
// (api/auth/steam.ts -> /api/auth/steam), pas de table a tenir a jour a la main.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;

// __dirname (pas import.meta.url) : ce fichier est execute en CommonJS
// (voir "type": "commonjs" dans le package.json racine).
const API_DIR = join(__dirname, "..", "api");
const PORT = Number(process.env.PORT ?? 3000);

function collectRoutes(dir: string, urlBase = ""): Map<string, string> {
  const routes = new Map<string, string>();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const [route, file] of collectRoutes(fullPath, `${urlBase}/${entry.name}`)) {
        routes.set(route, file);
      }
    } else if (entry.name.endsWith(".ts")) {
      const routeName = entry.name.slice(0, -".ts".length);
      routes.set(`/api${urlBase}/${routeName}`, fullPath);
    }
  }
  return routes;
}

const routes = collectRoutes(API_DIR);

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const pathname = new URL(req.url ?? "/", `http://${req.headers.host}`).pathname;
  const modulePath = routes.get(pathname);

  if (!modulePath) {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "not_found" }));
    return;
  }

  try {
    // Import dynamique : relance la lecture du fichier a chaque requete, donc
    // `tsx watch` (qui redemarre le process sur changement) suffit pour le
    // rechargement en dev, pas besoin d'invalider un cache de module ici.
    const mod = (await import(pathToFileURL(modulePath).href)) as { default: Handler };
    await mod.default(req, res);
  } catch (error) {
    console.error(`dev_server_error ${pathname}`, error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "internal_error" }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`API locale prete sur http://localhost:${PORT}`);
  console.log([...routes.keys()].sort().map((route) => `  ${route}`).join("\n"));
});
