const BASE_URL = "https://cesoirjejouea.vercel.app";
const DEFAULT_TITLE = "Ce soir je joue à…";

// Met a jour title/description/canonical/OG a chaque changement de route
// (voir front/src/router/index.ts, hook afterEach). Necessaire car c'est une
// SPA sans SSR : sans ca, toutes les pages garderaient les balises de /
// definies dans index.html.
export function applyRouteSeo(path: string, title?: string, description?: string): void {
  const resolvedTitle = title ?? DEFAULT_TITLE;
  const canonicalUrl = `${BASE_URL}${path}`;

  document.title = resolvedTitle;

  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
  }

  document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", resolvedTitle);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", resolvedTitle);
}
