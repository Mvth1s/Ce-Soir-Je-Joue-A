// Genere les images de marque statiques servies depuis front/public/ (image
// Open Graph) a partir du logo SVG existant (front/src/assets/) et de la
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

function readSvg(name: string): string {
  return readFileSync(join(ASSETS_DIR, name), "utf8");
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
  await page.screenshot({ path: outPath, type: "png", clip: { x: 0, y: 0, width, height } });
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
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
