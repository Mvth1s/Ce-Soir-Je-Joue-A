import type { RouteMeta } from "vue-router";
import { type JsonLd, routeStructuredData, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/structuredData";

// Marque les balises JSON-LD propres a une route (fil d'Ariane, FAQPage), a
// remplacer a chaque navigation ; le graphe commun du site n'en fait pas partie.
const ROUTE_JSONLD_ATTR = "data-route-jsonld";

// Image de partage par defaut (generee par scripts/generate-brand-assets.ts),
// identique a celle declaree en dur dans index.html.
export const DEFAULT_OG_IMAGE = {
  path: "/og/cover-1200x630.png",
  alt: "Logo de Ce soir je joue à… et slogan : votre bibliothèque Steam, triée par votre état du soir, trois jeux proposés, pas trente.",
};

// Balises head propres a une route, calculees sans acces au DOM : appliquees
// dans le navigateur par applyRouteSeo, et ecrites en dur dans le HTML des
// pages publiques par le pre-rendu (src/entry-server.ts, scripts/prerender.ts).
export interface RouteHead {
  title: string;
  description?: string;
  canonical: string;
  robots: string;
  ogImage: string;
  ogImageAlt: string;
  jsonLd: JsonLd[];
}

// URL canonique absolue : sans query string ni fragment, sans slash final
// (sauf pour la racine).
export function canonicalUrl(path: string): string {
  const pathname = (path.split(/[?#]/)[0] ?? "").replace(/\/+$/, "");
  return `${SITE_URL}${pathname || "/"}`;
}

export function routeHead(path: string, meta: RouteMeta): RouteHead {
  const title = meta.title ?? SITE_NAME;
  return {
    title,
    description: meta.description,
    canonical: canonicalUrl(path),
    // Seules les pages publiques pre-rendues sont indexables : connexion,
    // parcours authentifie, 403 et 404 ne doivent jamais apparaitre dans les
    // resultats de recherche.
    robots: meta.indexable ? "index, follow" : "noindex, follow",
    ogImage: `${SITE_URL}${meta.ogImage ?? DEFAULT_OG_IMAGE.path}`,
    ogImageAlt: meta.ogImage ? (meta.ogImageAlt ?? title) : DEFAULT_OG_IMAGE.alt,
    jsonLd: meta.indexable ? routeStructuredData(canonicalUrl(path).slice(SITE_URL.length), meta.breadcrumb) : [],
  };
}

function setMeta(selector: string, content: string): void {
  document.querySelector(selector)?.setAttribute("content", content);
}

function applyRouteStructuredData(jsonLd: JsonLd[]): void {
  for (const script of document.head.querySelectorAll(`script[${ROUTE_JSONLD_ATTR}]`)) script.remove();
  for (const data of jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(ROUTE_JSONLD_ATTR, "");
    script.textContent = serializeJsonLd(data);
    document.head.appendChild(script);
  }
}

// Met a jour title/description/canonical/robots/OG/JSON-LD a chaque changement
// de route (voir front/src/router/index.ts, hook afterEach) : le pre-rendu ne
// couvre que le premier chargement d'une page publique, la navigation
// suivante reste celle d'une SPA.
export function applyRouteSeo(path: string, meta: RouteMeta): void {
  const head = routeHead(path, meta);

  document.title = head.title;

  if (head.description) {
    setMeta('meta[name="description"]', head.description);
    setMeta('meta[property="og:description"]', head.description);
    setMeta('meta[name="twitter:description"]', head.description);
  }

  // Absente du shell SPA servi pour les routes privees (voir
  // scripts/prerender.ts) : recreee au besoin en naviguant vers une page publique.
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = head.canonical;
  setMeta('meta[name="robots"]', head.robots);
  setMeta('meta[property="og:url"]', head.canonical);
  setMeta('meta[property="og:title"]', head.title);
  setMeta('meta[name="twitter:title"]', head.title);
  setMeta('meta[property="og:image"]', head.ogImage);
  setMeta('meta[property="og:image:alt"]', head.ogImageAlt);
  setMeta('meta[name="twitter:image"]', head.ogImage);
  setMeta('meta[name="twitter:image:alt"]', head.ogImageAlt);
  applyRouteStructuredData(head.jsonLd);
}
