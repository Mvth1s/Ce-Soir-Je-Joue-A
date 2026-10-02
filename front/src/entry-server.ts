// Point d'entree du rendu serveur, utilise uniquement au build par le
// pre-rendu des pages publiques (scripts/prerender.ts, apres
// `vite build --ssr src/entry-server.ts`). Jamais deploye comme fonction :
// le site reste une SPA statique, dont le HTML des pages publiques contient
// deja leur contenu et leurs balises head (titre, canonical, OG, JSON-LD).
//
// Cote client, main.ts monte l'application normalement (pas d'hydratation) :
// le contenu pre-rendu est remplace au montage, ce qui evite toute
// divergence d'hydratation (bandeau cookies, theme, ecran de demarrage
// dependent du navigateur).
import { createSSRApp } from "vue";
import { renderToString, type SSRContext } from "vue/server-renderer";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "@/App.vue";
import { type RouteHead, routeHead } from "@/lib/seo";
import { routes } from "@/router/routes";

export const PRERENDERED_PATHS: string[] = routes.filter((route) => route.meta?.indexable).map((route) => route.path);

export interface RenderResult {
  appHtml: string;
  head: RouteHead;
  // Modules source utilises par la page (composants de la route chargee a la
  // demande), a faire correspondre au ssr-manifest du build client pour
  // precharger leurs JS/CSS.
  modules: string[];
}

export async function render(path: string): Promise<RenderResult> {
  const router = createRouter({ history: createMemoryHistory(), routes });
  const app = createSSRApp(App).use(router);
  await router.push(path);
  await router.isReady();

  const route = router.currentRoute.value;
  if (route.name === "not-found") throw new Error(`Route inconnue pour le pre-rendu : ${path}`);

  const context: SSRContext = {};
  const appHtml = await renderToString(app, context);
  const modules = context.modules instanceof Set ? [...(context.modules as Set<string>)] : [];
  return { appHtml, head: routeHead(route.path, route.meta), modules };
}
