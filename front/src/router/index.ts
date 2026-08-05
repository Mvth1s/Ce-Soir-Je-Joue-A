import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/pages/LandingPage.vue"),
    },
    {
      path: "/connexion",
      name: "login",
      component: () => import("@/pages/LoginPage.vue"),
    },
    {
      path: "/criteres",
      name: "criteria",
      component: () => import("@/pages/CriteriaPage.vue"),
    },
    {
      path: "/resultats",
      name: "results",
      component: () => import("@/pages/ResultsPage.vue"),
    },
    {
      path: "/mentions-legales",
      name: "legal",
      component: () => import("@/pages/MentionsLegalesPage.vue"),
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("@/pages/ForbiddenPage.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/NotFoundPage.vue"),
    },
  ],
});

export default router;
