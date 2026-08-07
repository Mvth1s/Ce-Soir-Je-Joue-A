import { createRouter, createWebHistory } from "vue-router";
import { applyRouteSeo } from "@/lib/seo";
import { trackPageview } from "@/lib/analytics";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    description?: string;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/pages/LandingPage.vue"),
      meta: {
        title: "Ce soir je joue à…",
        description:
          "Ce soir je joue à… trie votre bibliothèque Steam selon votre humeur, votre fatigue et le temps disponible, et vous propose 3 jeux à jouer maintenant, pas trente.",
      },
    },
    {
      path: "/connexion",
      name: "login",
      component: () => import("@/pages/LoginPage.vue"),
      meta: {
        title: "Connexion — Ce soir je joue à…",
        description: "Connectez-vous avec votre compte Steam pour découvrir vos 3 jeux du soir.",
      },
    },
    {
      path: "/criteres",
      name: "criteria",
      component: () => import("@/pages/CriteriaPage.vue"),
      meta: {
        title: "Vos critères — Ce soir je joue à…",
        description: "Humeur, fatigue, temps disponible, moment de la journée : dites-nous comment vous allez ce soir.",
      },
    },
    {
      path: "/resultats",
      name: "results",
      component: () => import("@/pages/ResultsPage.vue"),
      meta: {
        title: "Votre podium — Ce soir je joue à…",
        description: "Vos 3 jeux du soir, choisis dans votre bibliothèque Steam.",
      },
    },
    {
      path: "/mentions-legales",
      name: "legal",
      component: () => import("@/pages/MentionsLegalesPage.vue"),
      meta: {
        title: "Mentions légales — Ce soir je joue à…",
        description: "Éditeur, hébergement, données personnelles et cookies du site Ce soir je joue à….",
      },
    },
    {
      path: "/faq",
      name: "faq",
      component: () => import("@/pages/FaqPage.vue"),
      meta: {
        title: "FAQ — Ce soir je joue à…",
        description:
          "Comment l'IA choisit vos jeux, quelles données sont conservées, et les autres questions fréquentes sur Ce soir je joue à….",
      },
    },
    {
      path: "/changelog",
      name: "changelog",
      component: () => import("@/pages/ChangelogPage.vue"),
      meta: {
        title: "Changelog — Ce soir je joue à…",
        description: "Historique des évolutions du site Ce soir je joue à….",
      },
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("@/pages/ForbiddenPage.vue"),
      meta: { title: "Accès refusé — Ce soir je joue à…" },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/NotFoundPage.vue"),
      meta: { title: "Page introuvable — Ce soir je joue à…" },
    },
  ],
});

router.afterEach((to) => {
  applyRouteSeo(to.path, to.meta.title, to.meta.description);
  trackPageview(to.path, to.meta.title);
});

export default router;
