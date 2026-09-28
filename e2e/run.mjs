// End-to-end check against mock search pages. Loads the built Chrome extension
// into Chromium, serves the pages in fixtures.mjs at the real engines' URLs,
// prints what Anubis decided for each result and saves screenshots to e2e/shots/.
//
//   npm run e2e                 build, then run everything
//   node e2e/run.mjs pages      one part: pages, hostile, grouped, popover, ddg-hide,
//                               filter, deeper, import, subscribe, options
//
// Needs a Chromium build (branded Chrome no longer loads unpacked extensions from
// the command line). Point CHROMIUM_PATH at it, e.g. CHROMIUM_PATH=$(which chromium).
// The mock pages are modelled on each engine's markup; they are not the real thing.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANUBIS_PAGE2, ANUBIS_RESULTS, JS_MORE, JS_RESULTS, bing, brave, duckduckgo, google } from './fixtures.mjs';

const EXT = fileURLToPath(new URL('../.output/chrome-mv3', import.meta.url));
const SHOTS = fileURLToPath(new URL('./shots/', import.meta.url));
const only = process.argv[2];
const executablePath = process.env.CHROMIUM_PATH;

if (!existsSync(join(EXT, 'manifest.json'))) {
  console.error('No Chrome build found. Run `npm run build:chrome` first (or `npm run e2e`).');
  process.exit(1);
}
if (!executablePath) {
  console.error('Set CHROMIUM_PATH to a Chromium binary, e.g. CHROMIUM_PATH=$(which chromium) npm run e2e');
  process.exit(1);
}
mkdirSync(SHOTS, { recursive: true });

const PERSONAL = `! name: My list
! description: Sites I've weighed myself.
! author: me
! tag: ai-slop | AI slop | #e0664f | Machine-written filler.
! tag: tutorial | Great tutorial | #3fa37a | Explains things properly.

$site=fandom.com,discard
$site=w3schools.com,downrank=5
$site=developer.mozilla.org,pin
$site=javascript.info,boost=5,tag=tutorial
$site=ai-answers-example.net,tag=ai-slop
$site=codefarm-example.com,discard
$site=mythgenerator-example.com,tag=ai-slop
$site=worldhistory.org,boost=5
$site=metmuseum.org,pin
`;

// Behind a TLS-intercepting proxy, point PROXY_CA_CERT at its CA certificate so
// Chromium trusts that one CA (by public key), like adding it to the trust store.
function proxyTrustArgs() {
  const ca = process.env.PROXY_CA_CERT;
  if (!ca) return [];
  const pub = execFileSync('openssl', ['x509', '-in', ca, '-pubkey', '-noout']);
  const der = execFileSync('openssl', ['pkey', '-pubin', '-outform', 'der'], { input: pub });
  const spki = execFileSync('openssl', ['dgst', '-sha256', '-binary'], { input: der }).toString('base64');
  return [`--ignore-certificate-errors-spki-list=${spki}`];
}

async function launch(settings = {}) {
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'anubis-')), {
    executablePath,
    headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, ...proxyTrustArgs()],
    viewport: { width: 1180, height: 1000 },
    // Behind a proxy (as in CI sandboxes), real list downloads need it too.
    ...(process.env.HTTPS_PROXY && { proxy: { server: process.env.HTTPS_PROXY } }),
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const extId = new URL(sw.url()).host;
  await sw.evaluate(
    async ({ personal, settings }) => {
      await chrome.storage.sync.set({
        'personal.0': personal,
        personal: { chunks: 1, updatedAt: Date.now() },
        tagPrefs: { 'ai-slop': { action: 'hide' } },
        settings: { enabled: true, theme: 'auto', hideStyle: 'collapse', rerank: true, showChips: true, showSummary: true, engines: {}, updateHours: 24, ...settings },
      });
    },
    { personal: PERSONAL, settings },
  );
  const pages = {
    'https://duckduckgo.com/?q=javascript+promises': duckduckgo('javascript promises', JS_RESULTS),
    'https://duckduckgo.com/?q=javascript+promises&dark=1': duckduckgo('javascript promises', JS_RESULTS, true),
    'https://www.google.com/search?q=anubis': google('anubis', ANUBIS_RESULTS),
    'https://www.google.com/search?q=anubis&dark=1': google('anubis', ANUBIS_RESULTS, true),
    'https://www.bing.com/search?q=javascript+promises': bing('javascript promises', JS_RESULTS),
    'https://search.brave.com/search?q=anubis': brave('anubis', ANUBIS_RESULTS),
    'https://www.google.com/search?q=anubis&deep=1': google('anubis', ANUBIS_RESULTS, false, '/search?q=anubis&start=10'),
    'https://www.google.com/search?q=anubis&start=10': google('anubis', ANUBIS_PAGE2),
    'https://www.google.com/search?q=anubis&hostile=1': google('anubis', ANUBIS_RESULTS, false, '', true),
    'https://www.google.com/search?q=anubis&grouped=1': google('anubis', ANUBIS_RESULTS, false, '', false, true),
    'https://duckduckgo.com/?q=javascript+promises&more=1': duckduckgo('javascript promises', JS_RESULTS, false, JS_MORE),
  };
  await ctx.route(/^https:\/\/(duckduckgo\.com|www\.google\.com|www\.bing\.com|search\.brave\.com)\//, (route) => {
    const body = pages[route.request().url()];
    return body ? route.fulfill({ contentType: 'text/html; charset=utf-8', body }) : route.fulfill({ status: 204, body: '' });
  });
  return { ctx, extId };
}

async function report(page, label) {
  const info = await page.evaluate(() =>
    [...document.querySelectorAll('[data-anubis-result]')].map((el) => ({
      state: el.getAttribute('data-anubis-state'),
      order: el.style.order || el.parentElement?.style.order || '',
      text: (el.querySelector('h2, h3, .title')?.textContent ?? '').trim().slice(0, 48),
    })),
  );
  console.log(`\n== ${label}`);
  for (const r of info) console.log(`  [${(r.order || '-').padStart(2)}] ${String(r.state).padEnd(14)} ${r.text}`);
  return info;
}

const { ctx, extId } = await launch();
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('  console error:', m.text()));
page.on('pageerror', (e) => console.log('  page error:', e.message));

async function shoot(url, name, opts = {}) {
  await page.goto(url);
  await page.waitForTimeout(700);
  await report(page, name);
  await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: opts.full ?? true });
}

if (!only || only === 'pages') {
  await shoot('https://duckduckgo.com/?q=javascript+promises', 'ddg-light');
  await shoot('https://duckduckgo.com/?q=javascript+promises&dark=1', 'ddg-dark');
  await shoot('https://www.google.com/search?q=anubis', 'google-light');
  await shoot('https://www.google.com/search?q=anubis&dark=1', 'google-dark');
  await shoot('https://www.bing.com/search?q=javascript+promises', 'bing');
  await shoot('https://search.brave.com/search?q=anubis', 'brave');
}

if (!only || only === 'hostile') {
  await page.goto('https://www.google.com/search?q=anubis&hostile=1');
  await page.waitForTimeout(700);
  const check = await page.evaluate(() => {
    const upright = (el) => {
      let m = new DOMMatrix();
      for (let a = el; a; a = a.parentElement) {
        const t = getComputedStyle(a).transform;
        if (t && t !== 'none') m = new DOMMatrix(t).multiply(m);
      }
      return m.a > 0 && m.d > 0 && Math.abs(m.b) < 0.01;
    };
    const results = [...document.querySelectorAll('[data-anubis-result]')];
    const summary = document.querySelector('anubis-summary');
    const firstInList = document.querySelector('#rso .MjjYud');
    return {
      results: results.length,
      containersAreResults: results.every((r) => r.classList.contains('MjjYud')),
      weighVisible: results.filter((r) => {
        const w = r.querySelector(':scope > anubis-weigh');
        return w && getComputedStyle(w).display !== 'none' && w.getBoundingClientRect().width > 0;
      }).length,
      chipsUpright: [...document.querySelectorAll('anubis-chips')].map(upright),
      summaryBeforeFirstResult: !!summary && summary.nextElementSibling === firstInList,
    };
  });
  console.log('\n== hostile google:', JSON.stringify(check));
  await page.screenshot({ path: `${SHOTS}google-hostile.png`, fullPage: true });
}

if (!only || only === 'grouped') {
  await page.goto('https://www.google.com/search?q=anubis&grouped=1');
  await page.waitForTimeout(700);
  const check = await page.evaluate(() => {
    const summary = document.querySelector('anubis-summary');
    const top = (el) => el.getBoundingClientRect().top;
    const firstTitle = document.querySelector('#rso h3');
    const results = [...document.querySelectorAll('[data-anubis-result]')];
    return {
      results: results.length,
      sitelinksInFirstResult: !!document.querySelector('.MjjYud[data-anubis-result] .sitelinks'),
      containersAreResults: results.every((r) => r.classList.contains('MjjYud')),
      summaryInList: summary?.parentElement?.id === 'rso',
      summaryBeforeFirstResult: !!summary && summary.nextElementSibling === document.querySelector('#rso > .MjjYud'),
      summaryAboveFirstTitle: !!summary && !!firstTitle && top(summary) < top(firstTitle),
    };
  });
  console.log('\n== grouped google:', JSON.stringify(check));
  await page.screenshot({ path: `${SHOTS}google-grouped.png`, fullPage: true });
}

if (!only || only === 'popover') {
  for (const [url, name] of [
    ['https://duckduckgo.com/?q=javascript+promises', 'popover-light'],
    ['https://duckduckgo.com/?q=javascript+promises&dark=1', 'popover-dark'],
  ]) {
    await page.goto(url);
    await page.waitForTimeout(600);
    const target = page.locator('[data-anubis-result]', { hasText: 'The Modern JavaScript Tutorial' });
    await target.hover();
    await target.locator('anubis-weigh').click({ position: { x: 13, y: 13 } });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: false });
    console.log(`\n== ${name}: popover open =`, await page.locator('anubis-popover').count());
    if (name === 'popover-light') {
      // Focus starts on the chosen weight (Raise); Tab to Pin and press it.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${SHOTS}popover-after-pin.png`, fullPage: false });
      await report(page, 'after pinning javascript.info from the menu');
      // Put it back.
      await page.keyboard.press('Enter');
      await page.waitForTimeout(600);
    }
    await page.keyboard.press('Escape');
  }
}

if (!only || only === 'ddg-hide') {
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(600);
  const target = page.locator('li', { hasText: 'W3Schools' });
  await target.hover();
  await target.locator('button.menu').click();
  await page.waitForTimeout(500);
  const state = await target.evaluate((li) => ({
    result: li.hasAttribute('data-anubis-result'),
    anubisEls: li.querySelectorAll('anubis-chips, anubis-weigh, anubis-bar').length,
    order: li.style.order,
    text: li.textContent.trim().slice(0, 60),
  }));
  console.log('\n== ddg-hide (DuckDuckGo hid W3Schools itself):', JSON.stringify(state));
  await report(page, 'ddg-after-own-hide');
}

if (!only || only === 'filter') {
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}ddg-tags-legend.png`, fullPage: false });
  const sw = ctx.serviceWorkers()[0];
  const message = (m) =>
    sw.evaluate(async (m) => {
      for (const tab of await chrome.tabs.query({})) await chrome.tabs.sendMessage(tab.id, m).catch(() => {});
    }, m);
  await message({ type: 'set-filter', tag: 'forum' });
  await page.waitForTimeout(400);
  const visible = await page.evaluate(() =>
    [...document.querySelectorAll('[data-anubis-result]')]
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => (el.querySelector('h2')?.textContent ?? '').trim().slice(0, 40)),
  );
  console.log('\n== filter (Discussion only):', JSON.stringify(visible));
  await page.screenshot({ path: `${SHOTS}ddg-filtered.png`, fullPage: false });
  await message({ type: 'set-filter' });
}

if (!only || only === 'deeper') {
  // Google: "Weigh deeper" by message (the path the popup uses).
  await page.goto('https://www.google.com/search?q=anubis&deep=1');
  await page.waitForTimeout(600);
  const sw = ctx.serviceWorkers()[0];
  await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) {
      await chrome.tabs.sendMessage(tab.id, { type: 'go-deeper' }).catch(() => {});
    }
  });
  await page.waitForTimeout(1500);
  await report(page, 'google-deeper');
  await page.screenshot({ path: `${SHOTS}google-deeper.png`, fullPage: true });

  // DuckDuckGo: automatic, by pressing the page's own "More results" button.
  await sw.evaluate(async () => {
    const { settings } = await chrome.storage.sync.get('settings');
    await chrome.storage.sync.set({ settings: { ...settings, deeper: 1 } });
  });
  await page.goto('https://duckduckgo.com/?q=javascript+promises&more=1');
  await page.waitForTimeout(2500);
  await report(page, 'ddg-deeper-auto');
  await page.screenshot({ path: `${SHOTS}ddg-deeper.png`, fullPage: true });
  await sw.evaluate(async () => {
    const { settings } = await chrome.storage.sync.get('settings');
    await chrome.storage.sync.set({ settings: { ...settings, deeper: 0 } });
  });
}

if (!only || only === 'import') {
  const opt = await ctx.newPage();
  opt.on('console', (m) => m.type() === 'error' && console.log('  options console error:', m.text()));
  opt.on('pageerror', (e) => console.log('  options page error:', e.message));
  await opt.goto(`chrome-extension://${extId}/options.html#share`);
  await opt.waitForTimeout(300);
  await opt.getByLabel('Sites to import').fill(
    JSON.stringify([
      { domainName: 'www.quora.com', display: 'PARTIAL_HIDE' },
      { domainName: 'news.ycombinator.com', display: 'HIGHLIGHT', color: 'COLOR_3' },
    ]),
  );
  await opt.getByRole('button', { name: 'Import', exact: true }).click();
  await opt.waitForTimeout(500);
  await opt.screenshot({ path: `${SHOTS}options-import.png`, fullPage: true });
  console.log('\n== import:', await opt.locator('.notice').first().textContent({ timeout: 3000 }).catch(() => 'no notice'));
  await opt.screenshot({ path: `${SHOTS}options-import.png`, fullPage: true });
  await opt.close();
}

if (only === 'subscribe') {
  // Downloads a real list from GitHub, so it needs network access; not part of the default run.
  const opt = await ctx.newPage();
  opt.on('pageerror', (e) => console.log('  options page error:', e.message));
  await opt.goto(`chrome-extension://${extId}/options.html#lists`);
  await opt.waitForTimeout(500);
  await opt.locator('.discover-row', { hasText: 'Stack Overflow copies' }).getByRole('button', { name: 'Subscribe' }).click();
  await opt.waitForTimeout(6000);
  console.log('\n== subscribe:', await opt.locator('.notice').first().textContent({ timeout: 3000 }).catch(() => 'no notice'));
  await opt.screenshot({ path: `${SHOTS}options-subscribed.png`, fullPage: true });
  await opt.close();
}

if (!only || only === 'options') {
  for (const theme of ['dark', 'light']) {
    const opt = await ctx.newPage();
    await opt.setViewportSize({ width: 1180, height: 900 });
    await opt.goto(`chrome-extension://${extId}/options.html#appearance`);
    await opt.waitForTimeout(300);
    await opt.getByRole('button', { name: theme === 'dark' ? 'Dark theme' : 'Light theme' }).first().click();
    for (const section of ['sites', 'tags', 'lists', 'appearance', 'share']) {
      await opt.goto(`chrome-extension://${extId}/options.html#${section}`);
      await opt.waitForTimeout(500);
      await opt.screenshot({ path: `${SHOTS}options-${section}-${theme}.png`, fullPage: true });
    }
    const pop = await ctx.newPage();
    await pop.setViewportSize({ width: 364, height: 620 });
    await pop.goto(`chrome-extension://${extId}/popup.html`);
    await pop.waitForTimeout(400);
    await pop.screenshot({ path: `${SHOTS}popup-${theme}.png`, fullPage: true });
    await pop.close();
    await opt.close();
  }
  console.log('\n== options + popup screenshots done');
}

await ctx.close();
