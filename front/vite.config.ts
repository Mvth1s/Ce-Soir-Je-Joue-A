import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { visualizer } from "rollup-plugin-visualizer";
import { serializeJsonLd, siteGraph } from "./src/lib/structuredData.ts";

// Polices critiques (sous-ensemble latin, suffisant pour le francais) a
// precharger : Space Grotesk 400 pour le texte courant, Pixelify Sans 600 pour
// les titres h1 (element LCP de la page d'accueil). Les noms de fichiers
// emis par Vite sont hashes, d'ou la resolution a partir du bundle plutot
// qu'une balise ecrite en dur dans index.html.
const PRELOADED_FONTS = ["space-grotesk-latin-400-normal", "pixelify-sans-latin-600-normal"];

function preloadCriticalFonts(): Plugin {
  return {
    name: "csjj:preload-critical-fonts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const fileNames = Object.keys(ctx.bundle ?? {});
        return PRELOADED_FONTS.map((font) => {
          const fileName = fileNames.find((name) => name.includes(font) && name.endsWith(".woff2"));
          if (!fileName) throw new Error(`Police a precharger introuvable dans le bundle : ${font}`);
          return {
            tag: "link",
            attrs: { rel: "preload", href: `/${fileName}`, as: "font", type: "font/woff2", crossorigin: "" },
            injectTo: "head-prepend" as const,
          };
        });
      },
    },
  };
}

// Injecte dans index.html le graphe JSON-LD commun a toutes les pages
// (WebSite, WebApplication, auteur), genere depuis src/lib/structuredData.ts
// plutot qu'ecrit a la main dans le HTML (source unique).
function injectSiteStructuredData(): Plugin {
  return {
    name: "csjj:site-structured-data",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: serializeJsonLd(siteGraph()),
          injectTo: "head",
        },
      ];
    },
  };
}

// En dev, `vercel dev` sert les fonctions api/ sur le port 3000 ;
// ce proxy évite les soucis de cookies/CORS entre les deux serveurs.
//
// `pnpm analyze` (mode "analyze") : build client seul dans dist-analyze/, avec
// une carte des chunks (taille brute et gzip) dans dist-analyze/stats.html.
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    preloadCriticalFonts(),
    injectSiteStructuredData(),
    mode === "analyze" &&
      visualizer({ filename: "dist-analyze/stats.html", template: "treemap", gzipSize: true }),
  ],
  // Le repo centralise toutes les variables d'env dans le .env a la racine
  // du monorepo (voir .env.example) ; sans ca, Vite ne chargerait que
  // front/.env, qui n'existe pas.
  envDir: "..",
  build: {
    outDir: mode === "analyze" ? "dist-analyze" : "dist",
    // Vite inline par defaut en data: URI les fichiers < 4 Ko, dont plusieurs
    // sous-ensembles de polices : ils gonfleraient alors la feuille de style
    // critique alors que le navigateur ne les telechargerait peut-etre jamais
    // (decoupage par unicode-range). Les polices restent donc des fichiers.
    assetsInlineLimit: (filePath) => (/\.woff2?$/.test(filePath) ? false : undefined),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
}));
