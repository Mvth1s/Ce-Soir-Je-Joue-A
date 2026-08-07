const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let loaded = false;

function gtag(...args: unknown[]): void {
  window.dataLayer!.push(args);
}

// N'appeler qu'apres consentement explicite de l'utilisateur (voir
// useCookieConsent) : Google Analytics n'est pas exempte de consentement
// CNIL, contrairement a un outil d'audience "privacy-friendly".
export function loadGoogleAnalytics(): void {
  if (loaded || !MEASUREMENT_ID) return;
  loaded = true;

  window.dataLayer = window.dataLayer ?? [];
  gtag("js", new Date());
  // send_page_view desactive : on envoie nous-memes un page_view a chaque
  // changement de route (voir trackPageview), car c'est une SPA sans
  // rechargement complet entre les pages.
  gtag("config", MEASUREMENT_ID, { send_page_view: false, anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function unloadGoogleAnalytics(): void {
  loaded = false;
  window.dataLayer = [];
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
