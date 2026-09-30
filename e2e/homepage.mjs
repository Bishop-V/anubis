// Checks the built documentation site's homepage layout: the heading and its
// buttons sit centred beside the drawn results page, at any window height, and
// phones don't scroll sideways. It also plays the Introduction's demo through.
// Run it after `npm run docs:build`:
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

// Wide windows, short and tall alike: the heading's block (title to the scroll
// hint) is centred on the drawn page and stays within its height; the two sit in
// the middle of the window below the top bar, not high with a gap under them; and
// as scrolling starts the page rises until it's 24px under the top bar, then stops.
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
    // The top bar's height, resolved to pixels whatever unit the theme gives it in.
    const probe = document.body.appendChild(document.createElement('div'));
    probe.style.height = 'var(--vp-nav-height)';
    const nav = probe.getBoundingClientRect().height;
    probe.remove();
    return { top: title.top, bottom: cue.bottom, stageTop: stage.top, stageBottom: stage.bottom, nav };
  });
  const offCentre = Math.round((box.top + box.bottom) / 2 - (box.stageTop + box.stageBottom) / 2);
  const inside = box.top >= box.stageTop - 1 && box.bottom <= box.stageBottom + 1;
  const offWindow = Math.round((box.stageTop + box.stageBottom) / 2 - (box.nav + height) / 2);
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(150);
  const moved = Math.round((await page.evaluate(() => document.querySelector('.demo-page').getBoundingClientRect().top)) - box.stageTop);
  const rise = -Math.min(400, Math.max(0, box.stageTop - box.nav - 24));
  console.log(
    `${width}×${height}: heading ${offCentre}px from the page's centre${inside ? '' : ', and runs past it'}; ` +
      `page ${offWindow}px from the window's middle; moves ${moved}px when scrolling starts (expected ${Math.round(rise)}px)`,
  );
  if (Math.abs(offCentre) > 8 || !inside) failures.push(`${width}×${height}: the heading isn't centred beside the page`);
  if (Math.abs(offWindow) > 8) failures.push(`${width}×${height}: the page and heading aren't in the middle of the window`);
  if (Math.abs(moved - rise) > 1) failures.push(`${width}×${height}: the page doesn't rise to the top bar as scrolling starts`);
  await page.close();
}

// The line beside the steps runs behind their diamonds, so each diamond has to be
// solid, dimmed step or not: at any opacity the line shows through it.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const seeThrough = await page.evaluate(() =>
    [...document.querySelectorAll('.demo-marker')].filter((marker) => {
      let opacity = 1;
      for (let el = marker; el; el = el.parentElement) opacity *= Number(getComputedStyle(el).opacity);
      return opacity < 1;
    }).length,
  );
  console.log(`Step diamonds you can see the line through: ${seeThrough}`);
  if (seeThrough) failures.push(`${seeThrough} of the steps' diamonds let the line show through`);
  await page.close();
}

// The Introduction's demo (hide-demo.ts) plays when it scrolls into view: the menu
// opens, and it ends with the site gone, the summary saying so, and the menu closed.
// With reduced motion it gets there too, without the pointer. The picture kept for
// GitHub isn't shown on the site.
for (const reducedMotion of ['no-preference', 'reduce']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion });
  await page.goto(`${url}guide/introduction`, { waitUntil: 'networkidle' });
  const staticShown = await page.evaluate(() => getComputedStyle(document.querySelector('.github-only')).display !== 'none');
  await page.evaluate(() => document.querySelector('.hide-demo').scrollIntoView({ block: 'center' }));
  let seen = { pointer: false, menu: false };
  let state;
  for (const end = Date.now() + 10000; Date.now() < end; ) {
    state = await page.evaluate(() => ({
      pointer: !!document.querySelector('.hd-pointer.shown'),
      menu: !!document.querySelector('.hd-menu'),
      told: !!document.querySelector('.hd-change.open'),
      gone: document.querySelectorAll('.hide-demo .demo-result > .fold.full:not(.open)').length === 1,
      done: !document.querySelector('.hd-replay').disabled,
    }));
    seen = { pointer: seen.pointer || state.pointer, menu: seen.menu || state.menu };
    if (state.done) break;
    await page.waitForTimeout(100);
  }
  const label = `Introduction's demo (${reducedMotion} motion)`;
  console.log(`${label}: ${JSON.stringify({ ...state, pointerSeen: seen.pointer, menuSeen: seen.menu, staticShown })}`);
  if (!state.done || !state.told || !state.gone || state.menu || !seen.menu) failures.push(`${label}: doesn't end with the site hidden and the summary saying so`);
  if (seen.pointer !== (reducedMotion === 'no-preference')) failures.push(`${label}: the pointer ${seen.pointer ? 'shows' : "doesn't show"}`);
  if (staticShown) failures.push(`${label}: the picture for GitHub shows on the site too`);
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
