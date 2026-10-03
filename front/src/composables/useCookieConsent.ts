import { ref, watchEffect } from "vue";
import { loadGoogleAnalytics, trackPageview, unloadGoogleAnalytics } from "@/lib/analytics";

export type ConsentChoice = "accepted" | "refused";

const STORAGE_KEY = "csjj_analytics_consent";

// Pas de localStorage ni de window lors du rendu serveur du pre-rendu
// (src/entry-server.ts) : aucun choix, donc bandeau affiche, comme pour une
// premiere visite.
const isBrowser = typeof window !== "undefined";

function readStoredChoice(): ConsentChoice | null {
  if (!isBrowser) return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "accepted" || value === "refused" ? value : null;
}

const choice = ref<ConsentChoice | null>(readStoredChoice());

watchEffect(() => {
  if (!isBrowser) return;
  if (choice.value === "accepted") {
    loadGoogleAnalytics();
  } else {
    unloadGoogleAnalytics();
  }
});

export function useCookieConsent() {
  function accept(): void {
    localStorage.setItem(STORAGE_KEY, "accepted");
    choice.value = "accepted";
    // Les page_view ne partent qu'aux changements de route (router.afterEach) :
    // sans ca, la page sur laquelle l'utilisateur accepte ne serait jamais
    // comptee. loadGoogleAnalytics est idempotent, le watchEffect ci-dessus
    // ne la rechargera pas.
    loadGoogleAnalytics();
    trackPageview(window.location.pathname, document.title);
  }

  function refuse(): void {
    localStorage.setItem(STORAGE_KEY, "refused");
    choice.value = "refused";
  }

  // Permet de revenir sur son choix depuis le pied de page ou les mentions
  // legales, comme l'exige la CNIL (retrait aussi simple que le consentement).
  function resetChoice(): void {
    localStorage.removeItem(STORAGE_KEY);
    choice.value = null;
  }

  return { choice, accept, refuse, resetChoice };
}
