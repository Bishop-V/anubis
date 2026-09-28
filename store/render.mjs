// Renders the store images that aren't screenshots: the Chrome Web Store icon
// (the logo at 96×96 inside 128×128 of transparent padding, as the store asks)
// and the 440×280 small promo tile. Run it after changing the logo:
//
//   CHROMIUM_PATH=$(which chromium) node store/render.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const executablePath = process.env.CHROMIUM_PATH;
if (!executablePath) {
  console.error('Set CHROMIUM_PATH to a Chromium binary, e.g. CHROMIUM_PATH=$(which chromium) node store/render.mjs');
  process.exit(1);
}

const logo = readFileSync(here('../public/anubis.svg'), 'utf8');
// The options page's type: an old-style serif, falling back to what the system has.
const serif = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', 'Bitstream Charter', Charter, Georgia, serif`;

const icon = `<body style="margin:0;width:128px;height:128px;display:grid;place-items:center;background:transparent">
  <div style="width:96px;height:96px">${logo.replace('<svg ', '<svg width="96" height="96" ')}</div>
</body>`;

// The jackal alone (the logo without its tile), so it sits on the tile's own ground.
const jackal = logo.replace(/<rect[^>]*\/>/, '').replace('<svg ', '<svg width="150" height="150" ');
const tile = `<body style="margin:0;width:440px;height:280px;background:#1b1a16;font-family:${serif};overflow:hidden">
  <div style="position:absolute;left:34px;top:60px">${jackal}</div>
  <div style="position:absolute;left:200px;top:86px;right:28px">
    <div style="color:#d4a637;font-size:54px;line-height:1;letter-spacing:0.01em">Anubis</div>
    <div style="margin-top:16px;height:1px;background:#d4a637;opacity:0.45;width:172px"></div>
    <div style="margin-top:14px;color:#e8e2d2;font-size:19px;line-height:1.35">Hide, rank and tag<br>search results</div>
  </div>
</body>`;

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [html, size, out] of [
  [icon, { width: 128, height: 128 }, 'icon-128.png'],
  [tile, { width: 440, height: 280 }, 'promo-440x280.png'],
]) {
  await page.setViewportSize(size);
  await page.setContent(`<!doctype html><meta charset="utf-8">${html}`);
  await page.screenshot({ path: here(out), omitBackground: true });
  console.log(`store/${out}`);
}
await browser.close();
