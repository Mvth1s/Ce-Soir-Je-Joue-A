import { test, expect, type Page } from "@playwright/test";

// Mesure d'audience Google Analytics 4 conditionnee au consentement (voir
// front/src/lib/analytics.ts et front/src/composables/useCookieConsent.ts).
// Le vrai gtag.js n'est jamais charge ici (requete interceptee) : on verifie
// ce que l'application pousse dans window.dataLayer, qui est exactement ce
// que gtag.js lirait.
//
// Regressions couvertes (constatees en production le 2026-10-03, GA4 "collecte
// de donnees non active") : les entrees de dataLayer doivent etre de vrais
// objets `arguments` (gtag.js ignore silencieusement les tableaux), un
// page_view doit partir pour la page sur laquelle l'utilisateur accepte, et
// un nouveau consentement apres un retrait doit reutiliser le meme dataLayer.

interface DataLayerEntry {
  isArguments: boolean;
  command: unknown;
  target: unknown;
  params: unknown;
}

async function readDataLayer(page: Page): Promise<DataLayerEntry[] | null> {
  return page.evaluate(() => {
    const dataLayer = (window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer;
    if (!dataLayer) return null;
    return Array.from(dataLayer, (entry) => ({
      isArguments: Object.prototype.toString.call(entry) === "[object Arguments]",
      command: entry[0],
      target: entry[1],
      params: entry[2],
    }));
  });
}

async function isOptedOut(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    Object.entries(window as unknown as Record<string, unknown>).some(([key, value]) => key.startsWith("ga-disable-") && value === true),
  );
}

// Comparaison sur le nom d'hote analyse, pas sur une sous-chaine de l'URL
// (regle CodeQL js/incomplete-url-substring-sanitization).
function isGtagScriptRequest(url: string): boolean {
  const { hostname, pathname } = new URL(url);
  return hostname === "www.googletagmanager.com" && pathname === "/gtag/js";
}

function pageViews(entries: DataLayerEntry[] | null): unknown[] {
  return (entries ?? [])
    .filter((entry) => entry.command === "event" && entry.target === "page_view")
    .map((entry) => (entry.params as { page_path?: string }).page_path);
}

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
});

test("aucune mesure d'audience n'est chargee avant le consentement", async ({ page }) => {
  const gtagRequests: string[] = [];
  page.on("request", (request) => {
    if (isGtagScriptRequest(request.url())) gtagRequests.push(request.url());
  });

  await page.goto("/faq");
  await expect(page.getByRole("button", { name: "Accepter" })).toBeVisible();

  expect(await readDataLayer(page)).toBeNull();
  expect(gtagRequests).toEqual([]);
});

test("accepter les cookies mesure la page courante puis chaque navigation", async ({ page }) => {
  const gtagRequests: string[] = [];
  page.on("request", (request) => {
    if (isGtagScriptRequest(request.url())) gtagRequests.push(request.url());
  });

  await page.goto("/faq");
  await page.getByRole("button", { name: "Accepter" }).click();

  await expect.poll(async () => pageViews(await readDataLayer(page))).toEqual(["/faq"]);
  const entries = await readDataLayer(page);
  expect(entries?.every((entry) => entry.isArguments), "entree de dataLayer qui n'est pas un `arguments`").toBe(true);
  expect(gtagRequests).toHaveLength(1);

  await page.locator("footer").getByRole("link", { name: "Mentions légales" }).click();
  await expect.poll(async () => pageViews(await readDataLayer(page))).toEqual(["/faq", "/mentions-legales"]);
});

test("retirer puis redonner son consentement coupe puis retablit la mesure", async ({ page }) => {
  await page.goto("/faq");
  await page.getByRole("button", { name: "Accepter" }).click();
  await expect.poll(async () => pageViews(await readDataLayer(page))).toEqual(["/faq"]);

  await page.locator("footer").getByRole("button", { name: "Gérer les cookies" }).click();
  await page.getByRole("button", { name: "Refuser" }).click();
  expect(await isOptedOut(page)).toBe(true);

  await page.locator("footer").getByRole("link", { name: "Mentions légales" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mentions légales");
  expect(pageViews(await readDataLayer(page))).toEqual(["/faq"]);

  await page.locator("footer").getByRole("button", { name: "Gérer les cookies" }).click();
  await page.getByRole("button", { name: "Accepter" }).click();
  await expect.poll(async () => pageViews(await readDataLayer(page))).toEqual(["/faq", "/mentions-legales"]);
  expect(await isOptedOut(page)).toBe(false);
});
