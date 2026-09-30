import { createRouter, createWebHistory } from "vue-router";
import { applyRouteSeo } from "@/lib/seo";
import { trackPageview } from "@/lib/analytics";
import { routes } from "@/router/routes";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  applyRouteSeo(to.path, to.meta);
  trackPageview(to.path, to.meta.title);
});

export default router;
