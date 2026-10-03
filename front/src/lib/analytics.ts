const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let loaded = false;
let scriptInjected = false;

// Drapeau d'opt-out officiel de gtag.js : une fois le script charge, il reste
// dans la page meme si l'utilisateur retire son consentement ; ce drapeau
// garantit qu'il n'envoie alors plus aucun hit (mesure automatique comprise)
// jusqu'au prochain chargement de page.
function setGoogleAnalyticsDisabled(disabled: boolean): void {
  if (MEASUREMENT_ID) (window as unknown as Record<string, unknown>)[`ga-disable-${MEASUREMENT_ID}`] = disabled;
}

// Doit pousser l'objet `arguments` lui-meme, comme le snippet officiel de
// Google, et non un tableau : gtag.js ignore silencieusement les tableaux
// pousses dans dataLayer. Avec `(...args) => push(args)`, la balise se
// chargeait bien mais n'envoyait jamais aucun hit (constate le 2026-10-03,
// GA4 "collecte de donnees non active").
function gtag(..._args: unknown[]): void {
  window.dataLayer!.push(arguments);
}

// N'appeler qu'apres consentement explicite de l'utilisateur (voir
// useCookieConsent) : Google Analytics n'est pas exempte de consentement
// CNIL, contrairement a un outil d'audience "privacy-friendly".
export function loadGoogleAnalytics(): void {
  if (loaded || !MEASUREMENT_ID) return;
  loaded = true;
  setGoogleAnalyticsDisabled(false);

  window.dataLayer = window.dataLayer ?? [];
  gtag("js", new Date());
  // send_page_view desactive : on envoie nous-memes un page_view a chaque
  // changement de route (voir trackPageview), car c'est une SPA sans
  // rechargement complet entre les pages.
  gtag("config", MEASUREMENT_ID, { send_page_view: false, anonymize_ip: true });

  // Apres un retrait puis un nouveau consentement, gtag.js est deja charge et
  // ecoute toujours le meme dataLayer : inutile (et source de doublons) de
  // l'injecter une seconde fois.
  if (scriptInjected) return;
  scriptInjected = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function unloadGoogleAnalytics(): void {
  setGoogleAnalyticsDisabled(true);
  loaded = false;
  // Ne pas remplacer window.dataLayer : gtag.js garde une reference vers le
  // tableau d'origine et n'ecouterait plus un nouveau tableau, ce qui
  // casserait la mesure apres un nouveau consentement sans rechargement.
}

export function isGoogleAnalyticsLoaded(): boolean {
  return loaded;
}

export function trackPageview(path: string, title?: string): void {
  if (!loaded || !MEASUREMENT_ID) return;
  gtag("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}
