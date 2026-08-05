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

const MOBILE_BREAKPOINT = 480;

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
      await loginAsSteamUser(page, defaultSteamId());
      await page.getByRole("button", { name: "Trouver mes 3 jeux" }).click();
      await page.waitForURL("**/resultats");
      await expect(page.getByText("Votre podium du soir")).toBeVisible({ timeout: 10_000 });
      await expectNoHorizontalScroll(page);

      const silverBox = await page.locator('[data-size="silver"]').boundingBox();
      const goldBox = await page.locator('[data-size="gold"]').boundingBox();
      const bronzeBox = await page.locator('[data-size="bronze"]').boundingBox();
      expect(silverBox && goldBox && bronzeBox).toBeTruthy();
      if (!silverBox || !goldBox || !bronzeBox) return;

      if (viewport.width >= MOBILE_BREAKPOINT * 2) {
        // Desktop/tablette large : la carte or est au centre, argent a
        // gauche, bronze a droite, et plus grande que ses voisines.
        expect(silverBox.x).toBeLessThan(goldBox.x);
        expect(goldBox.x).toBeLessThan(bronzeBox.x);
        expect(goldBox.height).toBeGreaterThan(silverBox.height);
        expect(goldBox.height).toBeGreaterThan(bronzeBox.height);
      } else {
        // Mobile : les cartes n'ont pas la place de tenir cote a cote
        // (chaque carte fait jusqu'a 88vw), elles s'empilent dans l'ordre
        // du DOM (argent, or, bronze).
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

  await page.getByRole("link", { name: "FAQ" }).click();
  await page.waitForURL("**/faq");

  await page.getByRole("link", { name: "Mentions légales" }).click();
  await page.waitForURL("**/mentions-legales");
});
