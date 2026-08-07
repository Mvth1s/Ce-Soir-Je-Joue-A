import { test, expect, type Page } from "@playwright/test";
import { loginAsSteamUser } from "./support/loginAs";
import { defaultSteamId } from "./fixtures/library";

// Matrice de viewports demandee : mobile, tablette, desktop, grand ecran.
// Un seul moteur de rendu (chromium, voir playwright.config.ts) pour que les
// baselines de screenshot restent stables d'un run a l'autre.
const VIEWPORTS = [
  { name: "mobile-375x667", width: 375, height: 667 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "tablet-1024x1366", width: 1024, height: 1366 },
  { name: "desktop-1280x800", width: 1280, height: 800 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "wide-1920x1080", width: 1920, height: 1080 },
];

// Les 3 cartes ont la meme largeur CSS (min(300px, 88vw)) : le nombre qui
// tient par ligne depend d'une combinaison de gap/padding non triviale a
// deriver depuis la largeur du viewport seule (constate empiriquement :
// ni 768px ni 1024px ne suffisent pour les 3, meme si 1024 > 2*480).
// On detecte donc le regroupement par ligne a partir des positions reelles
// plutot que d'un seuil de largeur devine.
function sameRow(a: { y: number; height: number }, b: { y: number; height: number }): boolean {
  // `align-items: flex-end` aligne les bas de cartes d'une meme ligne : leurs
  // bords bas coincident, pas forcement leurs bords hauts (cartes de tailles
  // differentes).
  return Math.abs(a.y + a.height - (b.y + b.height)) < 4;
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    overflow.scrollWidth,
    `scrollWidth (${overflow.scrollWidth}) depasse clientWidth (${overflow.clientWidth})`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

async function expectReadableText(page: Page, selector: string, minPx = 11) {
  const size = await page.locator(selector).first().evaluate((el) =>
    parseFloat(getComputedStyle(el).fontSize),
  );
  expect(size).toBeGreaterThanOrEqual(minPx);
}

for (const viewport of VIEWPORTS) {
  test.describe(`viewport ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`accueil : pas de scroll horizontal, texte lisible [${viewport.name}]`, async ({ page }) => {
      await page.goto("/");
      await expectNoHorizontalScroll(page);
      await expectReadableText(page, "h1");
      await expect(page).toHaveScreenshot(`landing-${viewport.name}.png`, { fullPage: true });
    });

    test(`criteres : pas de scroll horizontal [${viewport.name}]`, async ({ page }) => {
      await loginAsSteamUser(page, defaultSteamId());
      await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
      await expectNoHorizontalScroll(page);
      await expect(page).toHaveScreenshot(`criteria-${viewport.name}.png`, { fullPage: true });
    });

    test(`podium : disposition et absence de scroll horizontal [${viewport.name}]`, async ({ page }) => {
      // Le critere "moment" par defaut sur /criteres est auto-detecte depuis
      // l'heure reelle (matin/aprem/soiree/nuit, voir useCriteria.ts). Sans
      // figer l'horloge, ce test devient flaky pile pendant la tranche
      // 23h-0h UTC ("nuit") : la reponse Mistral mockee differe selon le
      // moment, ce qui change le contenu des cartes et donc la hauteur de
      // page capturee, faisant echouer la comparaison de screenshot.
      await page.clock.install({ time: new Date("2026-01-15T20:00:00Z") });
      await loginAsSteamUser(page, defaultSteamId());
      await page.getByRole("button", { name: "Trouver mes 3 jeux" }).click();
      await page.waitForURL("**/resultats");
      await expect(page.getByText("Votre podium du soir")).toBeVisible({ timeout: 10_000 });
      // Le clic sur "Trouver mes 3 jeux" laisse le curseur a l'endroit du
      // bouton sur /criteres ; la navigation vers /resultats est une
      // navigation SPA (pas de rechargement complet), donc le survol reel du
      // navigateur persiste a cette position et peut tomber par coincidence
      // sur une carte du podium a son nouvel emplacement, la faisant
      // apparaitre retournee sur la capture. On neutralise ca explicitement.
      await page.mouse.move(0, 0);
      // Chaque carte a sa propre animation d'entree (riseIn, jusqu'a 0.24s de
      // delai + 0.55s de duree pour la carte bronze, voir PodiumCard.vue) :
      // attendre qu'elle soit terminee avant de mesurer les positions, sinon
      // les cartes pas encore stabilisees faussent la detection de ligne.
      await page.waitForTimeout(900);
      await expectNoHorizontalScroll(page);

      const silverBox = await page.locator('[data-size="silver"]').boundingBox();
      const goldBox = await page.locator('[data-size="gold"]').boundingBox();
      const bronzeBox = await page.locator('[data-size="bronze"]').boundingBox();
      expect(silverBox && goldBox && bronzeBox).toBeTruthy();
      if (!silverBox || !goldBox || !bronzeBox) return;

      const silverGoldSameRow = sameRow(silverBox, goldBox);
      const goldBronzeSameRow = sameRow(goldBox, bronzeBox);

      if (silverGoldSameRow && goldBronzeSameRow) {
        // Les 3 cartes tiennent sur une seule ligne : argent a gauche, or au
        // centre (et plus grande), bronze a droite.
        expect(silverBox.x).toBeLessThan(goldBox.x);
        expect(goldBox.x).toBeLessThan(bronzeBox.x);
        expect(goldBox.height).toBeGreaterThan(silverBox.height);
        expect(goldBox.height).toBeGreaterThan(bronzeBox.height);
      } else if (silverGoldSameRow) {
        // Seules argent et or tiennent sur la premiere ligne (largeurs
        // identiques pour les 3 cartes : si les deux premieres du DOM
        // tiennent ensemble, bronze est forcement la 3e et passe seule a la
        // ligne suivante, quel que soit le nombre de colonnes possible).
        expect(silverBox.x).toBeLessThan(goldBox.x);
        expect(bronzeBox.y).toBeGreaterThan(goldBox.y);
        expect(bronzeBox.y).toBeGreaterThan(silverBox.y);
      } else {
        // Aucune ligne partagee : empilement complet dans l'ordre du DOM
        // (argent, or, bronze).
        expect(silverBox.y).toBeLessThan(goldBox.y);
        expect(goldBox.y).toBeLessThan(bronzeBox.y);
      }

      await expect(page).toHaveScreenshot(`podium-${viewport.name}.png`, { fullPage: true });
    });
  });
}

test("le header et le footer restent fonctionnels sur toutes les tailles d'ecran", async ({ page }) => {
  await page.goto("/");

  const themeToggle = page.getByRole("button", { name: /sombre|clair/ });
  const before = await themeToggle.textContent();
  await themeToggle.click();
  await expect(themeToggle).not.toHaveText(before ?? "");

  // Scope au pied de page : le bandeau de consentement cookies contient lui
  // aussi un lien "mentions légales" (dans son texte), ce qui rend
  // `getByRole` ambigu sur la page entiere tant que l'utilisateur n'a pas
  // repondu au bandeau.
  const footer = page.getByRole("contentinfo");
  await footer.getByRole("link", { name: "FAQ" }).click();
  await page.waitForURL("**/faq");

  await footer.getByRole("link", { name: "Mentions légales" }).click();
  await page.waitForURL("**/mentions-legales");
});
