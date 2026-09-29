// Checks the built documentation site's homepage layout: the heading and its
// buttons sit centred beside the drawn results page, at any window height, and
// phones don't scroll sideways. Run it after `npm run docs:build`:
//
//   node e2e/homepage.mjs
//
// It serves docs/.vitepress/dist itself, under the site's base path (DOCS_BASE, as
// in docs/.vitepress/config.ts), and finds Chromium the way e2e/run.mjs does.

import { chromium } from 'playwright-core';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { delimiter, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../docs/.vitepress/dist', import.meta.url));
const BASE = process.env.DOCS_BASE ?? '/anubis/';

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const playwrights = chromium.executablePath();
  if (existsSync(playwrights)) return playwrights;
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    for (const name of ['chromium', 'chromium-browser']) {
      if (dir && existsSync(join(dir, name))) return join(dir, name);
    }
  }
  return playwrights;
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('No docs build found. Run `npm run docs:build` first.');
  process.exit(1);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!path.startsWith(BASE)) return res.writeHead(404).end();
  let file = normalize(join(DIST, path.slice(BASE.length)));
  if (!file.startsWith(DIST)) return res.writeHead(404).end();
  if (path.endsWith('/')) file = join(file, 'index.html');
  else if (!extname(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}${BASE}`;

const browser = await chromium.launch({ executablePath: findChromium() });
const failures = [];

// Wide windows: the heading's block (title to the scroll hint) is centred on the
// drawn page and stays within its height, short windows and tall ones alike.
for (const [width, height] of [
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1200],
  [2000, 1015],
  [2560, 1440],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const box = await page.evaluate(() => {
    const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
    const title = rect('.home-title');
    const cue = rect('.demo-cue');
    const stage = rect('.demo-page');
    return { top: title.top, bottom: cue.bottom, stageTop: stage.top, stageBottom: stage.bottom };
  });
  const offCentre = Math.round((box.top + box.bottom) / 2 - (box.stageTop + box.stageBottom) / 2);
  const inside = box.top >= box.stageTop - 1 && box.bottom <= box.stageBottom + 1;
  console.log(`${width}×${height}: heading ${offCentre}px from the page's centre${inside ? '' : ', and runs past it'}`);
  if (Math.abs(offCentre) > 8 || !inside) failures.push(`${width}×${height}: the heading isn't centred beside the page`);
  await page.close();
}

// Phones: nothing wider than the screen.
for (const width of [320, 360, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (scrollWidth > width) failures.push(`${width}px: the page scrolls sideways (${scrollWidth}px wide)`);
  await page.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\nHomepage layout: ${failures.length} failed\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nHomepage layout: all checks passed');
