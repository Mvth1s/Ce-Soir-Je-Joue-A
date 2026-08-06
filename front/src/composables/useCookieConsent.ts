import { ref, watchEffect } from "vue";
import { loadGoogleAnalytics, unloadGoogleAnalytics } from "@/lib/analytics";

export type ConsentChoice = "accepted" | "refused";

const STORAGE_KEY = "csjj_analytics_consent";

function readStoredChoice(): ConsentChoice | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "accepted" || value === "refused" ? value : null;
}

const choice = ref<ConsentChoice | null>(readStoredChoice());

watchEffect(() => {
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
