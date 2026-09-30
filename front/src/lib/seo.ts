import { routeStructuredData, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/structuredData";

const BASE_URL = SITE_URL;
const DEFAULT_TITLE = SITE_NAME;
// Marque les balises JSON-LD propres a une route (fil d'Ariane, FAQPage), a
// remplacer a chaque navigation ; le graphe commun du site n'en fait pas partie.
const ROUTE_JSONLD_ATTR = "data-route-jsonld";

// Image de partage par defaut (generee par scripts/generate-brand-assets.ts),
// identique a celle declaree en dur dans index.html.
export const DEFAULT_OG_IMAGE = {
  path: "/og/cover-1200x630.png",
  alt: "Logo de Ce soir je joue à… et slogan : votre bibliothèque Steam, triée par votre état du soir, trois jeux proposés, pas trente.",
};

export interface RouteSeo {
  title?: string;
  description?: string;
  // Surcharge optionnelle de l'image de partage d'une route publique (chemin
  // absolu servi depuis front/public/, image 1200x630).
  ogImage?: string;
  ogImageAlt?: string;
  breadcrumb?: string;
}

function applyRouteStructuredData(path: string, breadcrumb: string | undefined): void {
  for (const script of document.head.querySelectorAll(`script[${ROUTE_JSONLD_ATTR}]`)) script.remove();
  for (const data of routeStructuredData(path, breadcrumb)) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(ROUTE_JSONLD_ATTR, "");
    script.textContent = serializeJsonLd(data);
    document.head.appendChild(script);
  }
}

function setMeta(selector: string, content: string): void {
  document.querySelector(selector)?.setAttribute("content", content);
}

// Met a jour title/description/canonical/OG a chaque changement de route
// (voir front/src/router/index.ts, hook afterEach). Necessaire car c'est une
// SPA sans SSR : sans ca, toutes les pages garderaient les balises de /
// definies dans index.html.
export function applyRouteSeo(path: string, seo: RouteSeo): void {
  const resolvedTitle = seo.title ?? DEFAULT_TITLE;
  const canonicalUrl = `${BASE_URL}${path}`;
  const ogImageUrl = `${BASE_URL}${seo.ogImage ?? DEFAULT_OG_IMAGE.path}`;
  const ogImageAlt = seo.ogImage ? (seo.ogImageAlt ?? resolvedTitle) : DEFAULT_OG_IMAGE.alt;

  document.title = resolvedTitle;

  if (seo.description) {
    setMeta('meta[name="description"]', seo.description);
    setMeta('meta[property="og:description"]', seo.description);
    setMeta('meta[name="twitter:description"]', seo.description);
  }

  document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
  setMeta('meta[property="og:url"]', canonicalUrl);
  setMeta('meta[property="og:title"]', resolvedTitle);
  setMeta('meta[name="twitter:title"]', resolvedTitle);
  setMeta('meta[property="og:image"]', ogImageUrl);
  setMeta('meta[property="og:image:alt"]', ogImageAlt);
  setMeta('meta[name="twitter:image"]', ogImageUrl);
  setMeta('meta[name="twitter:image:alt"]', ogImageAlt);
  applyRouteStructuredData(path, seo.breadcrumb);
}
