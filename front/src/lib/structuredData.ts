// Donnees structurees schema.org (JSON-LD) du site : aident les moteurs de
// recherche classiques et les IA generatives (GEO) a decrire le site. Fonctions
// pures sans acces au DOM : reutilisees par vite.config.ts (graphe global
// injecte dans index.html au build) et par front/src/lib/seo.ts (donnees
// propres a une route).
// Import relatif (pas l'alias "@") : ce module est aussi charge par
// vite.config.ts, ou l'alias n'est pas resolu.
import { FAQ_ITEMS } from "../content/faq";

export const SITE_URL = "https://cesoirjejouea.vercel.app";
export const SITE_NAME = "Ce soir je joue à…";

const SITE_DESCRIPTION =
  "Suggère 3 jeux à jouer maintenant, choisis dans la bibliothèque Steam de l'utilisateur selon son humeur, sa fatigue et le temps disponible.";

const AUTHOR_ID = "https://mathisaguado.vercel.app/#person";

export type JsonLd = Record<string, unknown>;

// Graphe commun a toutes les pages : le site, l'application qu'il heberge et
// son auteur.
export function siteGraph(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
        inLanguage: "fr",
        isAccessibleForFree: true,
        author: { "@id": AUTHOR_ID },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapp`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        inLanguage: "fr",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        author: { "@id": AUTHOR_ID },
      },
      {
        "@type": "Person",
        "@id": AUTHOR_ID,
        name: "Mathis Aguado",
        url: "https://mathisaguado.vercel.app",
        sameAs: ["https://github.com/Mvth1s", "https://www.linkedin.com/in/mathis-aguado"],
      },
    ],
  };
}

function faqPage(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "fr",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function breadcrumbList(path: string, label: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: label, item: `${SITE_URL}${path}` },
    ],
  };
}

// Donnees propres a une route : fil d'Ariane pour les pages publiques hors
// accueil (celles qui declarent `breadcrumb` dans leur meta de route), et
// FAQPage uniquement sur /faq.
export function routeStructuredData(path: string, breadcrumb: string | undefined): JsonLd[] {
  const data: JsonLd[] = [];
  if (breadcrumb) data.push(breadcrumbList(path, breadcrumb));
  if (path === "/faq") data.push(faqPage());
  return data;
}

// Serialisation sure a l'interieur d'une balise <script> : echappe "<" pour
// qu'un texte contenant "</script>" ne puisse jamais fermer la balise.
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
