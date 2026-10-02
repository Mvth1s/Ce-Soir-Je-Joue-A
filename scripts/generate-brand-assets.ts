// Genere les images de marque statiques servies depuis front/public/ (image
// Open Graph, favicons PNG et icones du manifest) a partir du logo SVG existant (front/src/assets/) et de la
// palette reelle du site (front/src/styles/tokens.css). Rejouable a volonte :
// `pnpm brand-assets`, puis commit des PNG produits (ils ne sont pas regeneres
// au build, pour ne pas dependre d'un navigateur sur Vercel).
//
// Rendu via Playwright/Chromium (deja present pour les tests e2e) plutot que
// resvg ou sharp : l'image OG contient du texte, et seul un vrai navigateur
// sait utiliser directement les polices woff2 auto-hebergees (@fontsource),
// sans conversion TTF ni dependance aux polices installees sur la machine.
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium, type Page } from "@playwright/test";

const ROOT = join(__dirname, "..");
const ASSETS_DIR = join(ROOT, "front/src/assets");
const PUBLIC_DIR = join(ROOT, "front/public");
const FONTSOURCE_DIR = join(ROOT, "front/node_modules/@fontsource");

// Valeurs du theme sombre de front/src/styles/tokens.css (celui de
// <meta name="theme-color"> et du fond html).
const PALETTE = {
  bg: "#26211f",
  bg2: "#2e2825",
  surf: "#332c29",
  bord: "#4b413c",
  tx: "#f6ebe1",
  tx2: "#c6b5a8",
  acc: "#6fb3e0",
  gold: "#ebc684",
};

function fontFace(family: string, file: string, weight: number): string {
  const data = readFileSync(join(FONTSOURCE_DIR, file)).toString("base64");
  return `@font-face { font-family: "${family}"; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format("woff2"); }`;
}

const FONT_FACES = [
  fontFace("Space Grotesk", "space-grotesk/files/space-grotesk-latin-400-normal.woff2", 400),
  fontFace("Pixelify Sans", "pixelify-sans/files/pixelify-sans-latin-600-normal.woff2", 600),
  fontFace("Silkscreen", "silkscreen/files/silkscreen-latin-400-normal.woff2", 400),
].join("\n");

// Fond des icones : celui de front/src/assets/app-icon.svg (palette propre
// au logo, distincte de celle du site).
const ICON_BG = "#1A1A24";

function readSvg(name: string): string {
  return readFileSync(join(ASSETS_DIR, name), "utf8");
}

// icon-square.svg recadre sur son contenu reel (x ~9-97, y ~25-95 dans un
// viewBox 100x100), pour pouvoir le centrer et le dimensionner librement.
function centeredSymbol(size: number): string {
  return readSvg("icon-square.svg").replace(
    '<svg viewBox="0 0 100 100" ',
    `<svg viewBox="9 15.7 88 88" width="${size}" height="${size}" style="display: block" `,
  );
}

function sizedSvg(name: string, size: number): string {
  return readSvg(name).replace("<svg ", `<svg width="${size}" height="${size}" style="display: block" `);
}

// Icone pleine (fond opaque jusqu'aux bords, sans coins transparents) : pour
// apple-touch-icon (iOS applique son propre masque, des coins transparents y
// deviendraient noirs) et pour la variante "maskable" du manifest, dont le
// contenu doit tenir dans la zone de securite centrale (cercle de 80 %).
function fullBleedIcon(size: number, symbolRatio: number): string {
  return `<div style="width: ${size}px; height: ${size}px; background: ${ICON_BG}; display: flex; align-items: center; justify-content: center;">${centeredSymbol(Math.round(size * symbolRatio))}</div>`;
}

async function renderPng(page: Page, html: string, width: number, height: number, outPath: string): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>
      ${FONT_FACES}
      html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
    </style></head><body>${html}</body></html>`,
  );
  await page.waitForFunction("document.fonts.status === 'loaded'");
  mkdirSync(dirname(outPath), { recursive: true });
  // omitBackground : garde la transparence des icones sans fond (favicon,
  // coins arrondis d'app-icon.svg).
  await page.screenshot({ path: outPath, type: "png", omitBackground: true, clip: { x: 0, y: 0, width, height } });
  console.log(`[brand-assets] ${outPath.replace(`${ROOT}/`, "")} (${width}x${height})`);
}

// Textes repris tels quels de front/index.html (title, og:description).
function openGraphCover(): string {
  const symbol = readSvg("icon-square.svg").replace("<svg ", '<svg width="330" height="330" ');
  return `
    <div style="
      width: 100%; height: 100%; box-sizing: border-box;
      display: flex; align-items: center; gap: 64px; padding: 0 90px 0 70px;
      background: radial-gradient(circle at 22% 45%, ${PALETTE.surf} 0%, ${PALETTE.bg} 62%);
      border-bottom: 10px solid ${PALETTE.gold};
    ">
      <div style="
        flex: none; display: flex; align-items: center; justify-content: center;
        width: 380px; height: 380px; border-radius: 48px;
        background: ${PALETTE.bg2}; border: 2px solid ${PALETTE.bord};
      ">${symbol}</div>
      <div style="display: flex; flex-direction: column; gap: 26px;">
        <span style="font: 400 26px Silkscreen; color: ${PALETTE.acc}; letter-spacing: 1px;">bibliothèque steam</span>
        <span style="font: 600 86px/1.02 'Pixelify Sans'; color: ${PALETTE.tx};">Ce soir je joue à…</span>
        <span style="font: 400 34px/1.35 'Space Grotesk'; color: ${PALETTE.tx2};">
          Votre bibliothèque Steam, triée par votre état du soir.
          <span style="color: ${PALETTE.gold};">Trois jeux proposés, pas trente.</span>
        </span>
      </div>
    </div>`;
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    await renderPng(page, openGraphCover(), 1200, 630, join(PUBLIC_DIR, "og/cover-1200x630.png"));

    const iconsDir = join(PUBLIC_DIR, "icons");
    await renderPng(page, sizedSvg("favicon.svg", 32), 32, 32, join(iconsDir, "favicon-32.png"));
    await renderPng(page, fullBleedIcon(180, 0.74), 180, 180, join(iconsDir, "apple-touch-icon.png"));
    await renderPng(page, sizedSvg("app-icon.svg", 192), 192, 192, join(iconsDir, "icon-192.png"));
    await renderPng(page, sizedSvg("app-icon.svg", 512), 512, 512, join(iconsDir, "icon-512.png"));
    await renderPng(page, fullBleedIcon(512, 0.56), 512, 512, join(iconsDir, "icon-512-maskable.png"));
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
