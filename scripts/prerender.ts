// Pre-rendu des pages publiques, derniere etape de `pnpm --filter front build`
// (voir front/package.json), apres le build client (avec ssr-manifest) et le
// build serveur de front/src/entry-server.ts. Pour chaque route marquee
// `indexable` dans front/src/router/routes.ts, ecrit dans front/dist un HTML
// contenant en dur :
// - ses balises head (title, description, canonical absolu, robots, OG,
//   Twitter) et ses donnees structurees propres (fil d'Ariane, FAQPage) ;
// - le rendu de la page dans #app, et le prechargement du JS/CSS de sa route.
// Ecrit aussi front/dist/spa.html, le shell SPA sans contenu (noindex, sans
// canonical) vers lequel vercel.json reecrit toutes les autres URL : sans lui,
// les routes privees et les 404 recevraient le HTML pre-rendu de l'accueil.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(__dirname, "..");
const DIST_DIR = join(ROOT, "front/dist");
const SSR_ENTRY = join(ROOT, "front/dist-ssr/entry-server.js");
const SSR_MANIFEST = join(DIST_DIR, ".vite/ssr-manifest.json");
const VERCEL_CONFIG = join(ROOT, "vercel.json");
const SPA_SHELL = "spa.html";

// Miroir de RouteHead / RenderResult (front/src/lib/seo.ts,
// front/src/entry-server.ts), charges dynamiquement depuis le build serveur.
interface RouteHead {
  title: string;
  description?: string;
  canonical: string;
  robots: string;
  ogImage: string;
  ogImageAlt: string;
  jsonLd: Record<string, unknown>[];
}

interface ServerEntry {
  PRERENDERED_PATHS: string[];
  render(path: string): Promise<{ appHtml: string; head: RouteHead; modules: string[] }>;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fail(message: string): never {
  throw new Error(`[prerender] ${message}`);
}

// Remplace (ou retire si value === null) la valeur de `attr` sur l'unique
// balise <meta>/<link> portant `key="keyValue"`. Echoue si la balise est
// absente ou en double : index.html et ce script doivent rester alignes.
function setTagAttr(html: string, key: string, keyValue: string, attr: string, value: string | null): string {
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)].filter((match) =>
    match[0].includes(`${key}="${keyValue}"`),
  );
  if (tags.length !== 1) fail(`balise ${key}="${keyValue}" trouvee ${tags.length} fois dans index.html`);
  const [tag] = tags[0] ?? fail("inaccessible");
  const replacement =
    value === null ? "" : tag.replace(new RegExp(`${attr}="[^"]*"`), `${attr}="${escapeHtml(value)}"`);
  return html.replace(tag, replacement);
}

function replaceOnce(html: string, search: string, replacement: string): string {
  if (html.split(search).length !== 2) fail(`"${search}" doit apparaitre exactement une fois dans index.html`);
  return html.replace(search, () => replacement);
}

function applyHead(template: string, head: RouteHead): string {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(head.title)}</title>`);
  if (head.description) {
    html = setTagAttr(html, "name", "description", "content", head.description);
    html = setTagAttr(html, "property", "og:description", "content", head.description);
    html = setTagAttr(html, "name", "twitter:description", "content", head.description);
  }
  html = setTagAttr(html, "rel", "canonical", "href", head.canonical);
  html = setTagAttr(html, "name", "robots", "content", head.robots);
  html = setTagAttr(html, "property", "og:url", "content", head.canonical);
  html = setTagAttr(html, "property", "og:title", "content", head.title);
  html = setTagAttr(html, "name", "twitter:title", "content", head.title);
  html = setTagAttr(html, "property", "og:image", "content", head.ogImage);
  html = setTagAttr(html, "property", "og:image:alt", "content", head.ogImageAlt);
  html = setTagAttr(html, "name", "twitter:image", "content", head.ogImage);
  html = setTagAttr(html, "name", "twitter:image:alt", "content", head.ogImageAlt);
  // Meme attribut que les balises gerees par applyRouteSeo cote client, qui
  // les remplace donc au lieu de les dupliquer.
  const jsonLd = head.jsonLd
    .map((data) => {
      const json = JSON.stringify(data).replace(/</g, "\\u003c");
      return `    <script type="application/ld+json" data-route-jsonld>${json}</script>\n`;
    })
    .join("");
  return replaceOnce(html, "</head>", `${jsonLd}  </head>`);
}

function preloadLinks(template: string, modules: string[], manifest: Record<string, string[]>): string {
  const files = new Set(modules.flatMap((id) => manifest[id] ?? []));
  return [...files]
    .filter((file) => !template.includes(file))
    .map((file) => {
      if (file.endsWith(".js")) return `    <link rel="modulepreload" crossorigin href="${file}">\n`;
      if (file.endsWith(".css")) return `    <link rel="stylesheet" crossorigin href="${file}">\n`;
      return "";
    })
    .join("");
}

function checkVercelRewrites(paths: string[]): void {
  const config = JSON.parse(readFileSync(VERCEL_CONFIG, "utf8")) as {
    rewrites?: { source: string; destination: string }[];
  };
  const rewrites = config.rewrites ?? [];
  for (const path of paths.filter((p) => p !== "/")) {
    const expected = `${path}/index.html`;
    if (!rewrites.some((r) => r.source === path && r.destination === expected)) {
      fail(`vercel.json doit reecrire ${path} vers ${expected} (avant le fallback SPA)`);
    }
  }
  if (!rewrites.some((r) => r.destination === `/${SPA_SHELL}`)) fail(`vercel.json doit reecrire le reste vers /${SPA_SHELL}`);
}

async function main(): Promise<void> {
  const entry = (await import(pathToFileURL(SSR_ENTRY).href)) as ServerEntry;
  const manifest = JSON.parse(readFileSync(SSR_MANIFEST, "utf8")) as Record<string, string[]>;
  const template = readFileSync(join(DIST_DIR, "index.html"), "utf8");

  checkVercelRewrites(entry.PRERENDERED_PATHS);

  let shell = setTagAttr(template, "rel", "canonical", "href", null);
  shell = setTagAttr(shell, "property", "og:url", "content", null);
  shell = setTagAttr(shell, "name", "robots", "content", "noindex, follow");
  writeFileSync(join(DIST_DIR, SPA_SHELL), shell);
  console.log(`[prerender] ${SPA_SHELL} (shell SPA, noindex)`);

  for (const path of entry.PRERENDERED_PATHS) {
    const { appHtml, head, modules } = await entry.render(path);
    let html = applyHead(template, head);
    html = replaceOnce(html, "</head>", `${preloadLinks(template, modules, manifest)}  </head>`);
    // Theme par defaut du client (front/src/composables/useTheme.ts), pour que
    // le contenu pre-rendu ne change pas de couleurs au montage de l'app.
    html = replaceOnce(html, '<html lang="fr">', '<html lang="fr" data-theme="light">');
    html = replaceOnce(html, '<div id="app"></div>', `<div id="app">${appHtml}</div>`);

    const outFile = path === "/" ? join(DIST_DIR, "index.html") : join(DIST_DIR, path, "index.html");
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, html);
    console.log(`[prerender] ${path} -> ${outFile.replace(`${ROOT}/`, "")}`);
  }

  // Le ssr-manifest ne sert qu'a ce script : inutile (et indesirable) de le
  // deployer.
  rmSync(join(DIST_DIR, ".vite"), { recursive: true, force: true });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
