// End-to-end check against mock search pages. Loads the built Chrome extension
// into Chromium, serves the pages in fixtures.mjs at the real engines' URLs,
// prints what Anubis decided for each result and saves screenshots to e2e/shots/.
//
//   npm run e2e                 build, then run everything
//   node e2e/run.mjs pages      one part: pages, hostile, grouped, reveal, runs, shortcuts, mobile, off, cleanup,
//                               pins, popover, ddg-hide, filter, deeper, import, subscribe, subscribe-link, options, welcome,
//                               sync, webdav
//   node e2e/run.mjs docs       only: regenerate the screenshots in docs/img/ and the slides
//                               in docs/public/
//
// Needs a Chromium build (branded Chrome no longer loads unpacked extensions from
// the command line). Point CHROMIUM_PATH at it, e.g. CHROMIUM_PATH=$(which chromium).
// The mock pages are modelled on each engine's markup; they are not the real thing.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANUBIS_PAGE2, ANUBIS_RESULTS, JS_MORE, JS_RESULTS, bing, brave, duckduckgo, google, googleMobile } from './fixtures.mjs';

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

async function launch(settings = {}, ext = EXT) {
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'anubis-')), {
    executablePath,
    headless: true,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, ...proxyTrustArgs()],
    viewport: { width: 1180, height: 1000 },
    // Sharper screenshots for the documentation site.
    deviceScaleFactor: only === 'docs' ? 2 : 1,
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
        // The tests use the "Collapse" style; keep the one-time move to "Remove" away.
        hideStyleMoved: true,
        settings: { enabled: true, theme: 'auto', hideStyle: 'collapse', rerank: true, showChips: true, showSummary: true, engines: {}, updateHours: 24, ...settings },
      });
    },
    { personal: PERSONAL, settings },
  );
  const pages = {
    'https://duckduckgo.com/?q=javascript+promises': duckduckgo('javascript promises', JS_RESULTS),
    'https://duckduckgo.com/?q=javascript+promises&dark=1': duckduckgo('javascript promises', JS_RESULTS, true),
    'https://www.google.com/search?q=anubis': google('anubis', ANUBIS_RESULTS),
    'https://www.google.com/search?q=anubis&dark=1': google('anubis', ANUBIS_RESULTS, { dark: true }),
    'https://www.bing.com/search?q=javascript+promises': bing('javascript promises', JS_RESULTS),
    'https://search.brave.com/search?q=anubis': brave('anubis', ANUBIS_RESULTS),
    'https://www.google.com/search?q=anubis&deep=1': google('anubis', ANUBIS_RESULTS, { next: '/search?q=anubis&start=10' }),
    'https://www.google.com/search?q=anubis&start=10': google('anubis', ANUBIS_PAGE2),
    'https://www.google.com/search?q=anubis&hostile=1': google('anubis', ANUBIS_RESULTS, { hostile: true }),
    'https://www.google.com/search?q=anubis&grouped=1': google('anubis', ANUBIS_RESULTS, { grouped: true }),
    'https://www.google.com/search?q=anubis&modules=1': google('anubis', ANUBIS_RESULTS, { modules: true }),
    'https://www.google.com/search?q=anubis&modules=1&dark=1': google('anubis', ANUBIS_RESULTS, { modules: true, dark: true }),
    'https://www.google.com/search?q=anubis&ailabel=1': google('anubis', ANUBIS_RESULTS, { aiLabel: true }),
    'https://www.google.com/search?q=anubis&videos=titles': google('anubis', ANUBIS_RESULTS, { videos: 'titles' }),
    'https://www.google.com/search?q=anubis&videos=groups': google('anubis', ANUBIS_RESULTS, { videos: 'groups' }),
    'https://www.google.com/search?q=anubis&videos=split': google('anubis', ANUBIS_RESULTS, { videos: 'split' }),
    'https://www.google.com/search?q=anubis&videos=google': google('anubis', ANUBIS_RESULTS, { videos: 'google' }),
    // A search where one hidden site is everywhere: three fandom.com results in a
    // row, one other result, then two more.
    'https://www.google.com/search?q=fandom': google('fandom', [
      ['https://www.fandom.com/', 'Fandom', 'The fan platform.'],
      ['https://about.fandom.com/', 'About Fandom', 'About the company.'],
      ['https://community.fandom.com/wiki/Help', 'Community Central', 'Help for wikis.'],
      ['https://en.wikipedia.org/wiki/Fandom', 'Fandom - Wikipedia', 'A fandom is a subculture of fans.'],
      ['https://starwars.fandom.com/', 'Wookieepedia', 'The Star Wars wiki.'],
      ['https://roblox.fandom.com/', 'Roblox Wiki', 'The Roblox wiki.'],
    ]),
    'https://www.google.com/search?q=anubis&udm=14': google('anubis', ANUBIS_RESULTS),
    // Several results from a pinned site, which reranking brings together at the top.
    'https://www.google.com/search?q=promise+mdn&inner=1': google('promise mdn', [
      JS_RESULTS[0],
      JS_RESULTS[1],
      ['https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises', 'How to use promises - MDN', 'Promises are the foundation of asynchronous programming in modern JavaScript.'],
      JS_RESULTS[4],
      ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises', 'Using promises - JavaScript | MDN', 'A Promise is an object representing the eventual completion or failure of an asynchronous operation.'],
      ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then', 'Promise.prototype.then() - MDN', 'The then() method of Promise instances takes up to two arguments.'],
    ], { inner: true }),
    'https://www.google.com/search?q=anubis&mobile=1': googleMobile('anubis', ANUBIS_RESULTS),
    'https://www.google.com/search?q=anubis&forum=1': google('anubis', ANUBIS_RESULTS, { forum: true, grouped: true, aiAbove: true, related: true, next: '/search?q=anubis&start=10' }),
    'https://www.bing.com/search?q=javascript+promises&inline=1': bing('javascript promises', JS_RESULTS, { inline: true }),
    'https://search.brave.com/search?q=anubis&panels=1': brave('anubis', ANUBIS_RESULTS, { panels: true }),
    'https://duckduckgo.com/?q=javascript+promises&ai=1': duckduckgo('javascript promises', JS_RESULTS, false, [], { ai: true }),
    'https://duckduckgo.com/?q=javascript+promises&more=1': duckduckgo('javascript promises', JS_RESULTS, false, JS_MORE),
  };
  await ctx.route(/^https:\/\/((noai\.)?duckduckgo\.com|www\.google\.com|www\.bing\.com|search\.brave\.com)\//, (route) => {
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
      text: (el.querySelector('h2, h3, .title, [role="heading"]')?.textContent ?? '').trim().slice(0, 48),
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

// Anubis's UI is in closed shadow roots, which page scripts and locators can't
// enter. The DevTools protocol can: find the button by its text and click it.
async function clickShadowButton(hostSelector, text, index = 0) {
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: hostSelector });
  const find = (node, id) => {
    if (node.nodeId === id) return node;
    for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) {
      const hit = find(child, id);
      if (hit) return hit;
    }
  };
  const textOf = (node) => (node.nodeType === 3 ? node.nodeValue : (node.children ?? []).map(textOf).join(''));
  const buttons = (node) => [
    ...(node.nodeName === 'BUTTON' && textOf(node).trim() === text ? [node] : []),
    ...[...(node.children ?? []), ...(node.shadowRoots ?? [])].flatMap(buttons),
  ];
  const host = nodeIds[index] && find(root, nodeIds[index]);
  const button = host && buttons(host)[0];
  if (!button) throw new Error(`No "${text}" button in ${hostSelector}`);
  const { model } = await cdp.send('DOM.getBoxModel', { nodeId: button.nodeId });
  const [x1, y1, , , x3, y3] = model.content;
  await page.mouse.click((x1 + x3) / 2, (y1 + y3) / 2);
  await cdp.detach();
}

// The links inside the closed shadow roots of hosts with this tag, read the same way.
async function shadowLinks(hostTag) {
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const textOf = (node) => (node.nodeType === 3 ? node.nodeValue : (node.children ?? []).map(textOf).join(''));
  const within = (node, inside) => [
    ...(inside && node.nodeName === 'A' ? [node] : []),
    ...[...(node.children ?? []), ...(node.shadowRoots ?? [])].flatMap((c) => within(c, inside || node.localName === hostTag)),
  ];
  await cdp.detach();
  return within(root, false).map((a) => {
    const attrs = Object.fromEntries((a.attributes ?? []).flatMap((v, i, all) => (i % 2 ? [] : [[v, all[i + 1]]])));
    return { text: textOf(a).trim(), href: attrs.href ?? '', title: attrs.title ?? '' };
  });
}

// The text inside the closed shadow root of the first host with this tag.
async function shadowText(hostTag) {
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  await cdp.detach();
  const textOf = (node) =>
    node.nodeType === 3 ? node.nodeValue : node.nodeName === 'STYLE' ? '' : [...(node.children ?? []), ...(node.shadowRoots ?? [])].map(textOf).join(' ');
  const find = (node) => (node.localName === hostTag ? node : [...(node.children ?? []), ...(node.shadowRoots ?? [])].map(find).find(Boolean));
  const host = find(root);
  return host ? textOf(host).replace(/\s+/g, ' ').trim() : '';
}

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

  // DuckDuckGo: the ⇅ button sits beside each result's own ⋯ menu, centred on it,
  // at its size and shape, in Anubis's colours.
  await page.goto('https://duckduckgo.com/?q=javascript+promises&dark=1');
  await page.waitForTimeout(600);
  const pair = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('li[data-anubis-result]:not([data-anubis-state~="hide"])')].map((li) => {
        const host = li.querySelector(':scope > anubis-weigh');
        const menu = li.querySelector('button.menu');
        const a = host.getBoundingClientRect();
        const b = menu.getBoundingClientRect();
        return {
          centred: Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)) < 1,
          gap: Math.round(b.left - a.right),
          sameSize: Math.round(a.width) === Math.round(b.width) && Math.round(a.height) === Math.round(b.height),
        };
      }),
    );
  const pairs = await pair();
  console.log('\n== ddg button beside its menu:', JSON.stringify({ results: pairs.length, all: pairs.every((p) => p.centred && p.sameSize && p.gap >= 0 && p.gap <= 6), failing: pairs.filter((p) => !(p.centred && p.sameSize && p.gap >= 0 && p.gap <= 6)) }));
  const first = page.locator('li[data-anubis-result]').first();
  await first.locator('anubis-weigh').hover();
  await page.waitForTimeout(250);
  const box = await first.locator('button.menu').boundingBox();
  await page.screenshot({ path: `${SHOTS}ddg-menu-pair.png`, clip: { x: box.x - 60, y: box.y - 14, width: 110, height: 56 } });
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

  // Opaque /goto links everywhere, and a Reddit thread and a LinkedIn page with no
  // address shown: the site's name stands in for it. The first result's sitelinks,
  // also /goto with no address, stay part of it.
  await page.goto('https://www.google.com/search?q=anubis&forum=1');
  await page.waitForTimeout(700);
  console.log(
    '== google forum result:',
    JSON.stringify(
      await page.evaluate(() => {
        const reddit = document.querySelector('.forum-meta:not(.social)')?.closest('.MjjYud');
        const linkedin = document.querySelector('.forum-meta.social')?.closest('.MjjYud');
        return {
          results: document.querySelectorAll('[data-anubis-result]').length,
          sitelinksInFirstResult: !!document.querySelector('.MjjYud[data-anubis-result] .sitelinks'),
          linkedinFound: !!linkedin?.hasAttribute('data-anubis-result'),
          redditFound: !!reddit?.hasAttribute('data-anubis-result'),
          redditButton: !!reddit?.querySelector(':scope > anubis-weigh'),
          redditTagged: !!reddit?.querySelector('anubis-chips'),
        };
      }),
    ),
  );
}

if (!only || only === 'reveal') {
  // Showing one hidden result has to survive the page changing afterwards: engines
  // rewrite parts of the page on hover, which runs another pass.
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForSelector('anubis-bar');
  await page.waitForTimeout(300);
  const hidden = page.locator('[data-anubis-result]', { hasText: 'Mythology Wiki' });
  await clickShadowButton('anubis-bar', 'Show');
  await page.waitForTimeout(200);
  const afterClick = await hidden.evaluate((el) => el.hasAttribute('data-anubis-reveal'));
  await page.evaluate(() => document.body.append(document.createElement('div')));
  await page.mouse.move(300, 300);
  await page.mouse.move(320, 340);
  await page.waitForTimeout(300);
  const afterChange = await hidden.evaluate((el) => el.hasAttribute('data-anubis-reveal'));
  console.log('\n== reveal one result:', JSON.stringify({ afterClick, afterChange }));
}

if (!only || only === 'shortcuts') {
  // Keyboard shortcuts: both come with a key, and Show hidden toggles by message,
  // the path the background script takes (a test can't press a browser shortcut).
  const sw = ctx.serviceWorkers()[0];
  const commands = await sw.evaluate(() => chrome.commands.getAll());
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForSelector('anubis-bar');
  const revealed = () => page.evaluate(() => document.querySelectorAll('[data-anubis-result][data-anubis-reveal]').length);
  const toggle = async () => {
    await sw.evaluate(async () => {
      for (const tab of await chrome.tabs.query({})) await chrome.tabs.sendMessage(tab.id, { type: 'toggle-reveal' }).catch(() => {});
    });
    await page.waitForTimeout(300);
    return revealed();
  };
  const before = await revealed();
  const shown = await toggle();
  const again = await toggle();
  console.log('\n== shortcuts:', JSON.stringify({ keys: commands.map((c) => `${c.name} ${c.shortcut}`), before, shown, again }));
}

if (!only || only === 'mobile') {
  // Google's phone layout, as Firefox for Android gets it: the browser has to say
  // it's a phone before the page loads, since Anubis picks the layout at start.
  const phone = await ctx.newPage();
  const cdp = await ctx.newCDPSession(phone);
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0' });
  await phone.setViewportSize({ width: 412, height: 915 });
  await phone.goto('https://www.google.com/search?q=anubis&mobile=1');
  await phone.waitForTimeout(700);
  const check = await phone.evaluate(() => {
    const results = [...document.querySelectorAll('[data-anubis-result]')];
    const nyt = results.find((r) => r.textContent.includes('New York Times'));
    return {
      results: results.length,
      newsCardsAsResults: results.filter((r) => r.closest('[data-news-cluster-id]')).length,
      weighButtons: results.filter((r) => r.querySelector(':scope > anubis-weigh')).length,
      gotoLinkTagged: nyt?.getAttribute('data-anubis-state') ?? null,
      summary: !!document.querySelector('anubis-summary'),
      scrollsSideways: document.documentElement.scrollWidth > innerWidth,
    };
  });
  await report(phone, 'google-mobile');
  console.log('\n== google mobile:', JSON.stringify(check));
  await phone.screenshot({ path: `${SHOTS}google-mobile.png`, fullPage: true });
  await phone.close();
}

if (!only || only === 'off') {
  // Turning Anubis off greys out the toolbar icon and says so in its tooltip.
  const [sw] = ctx.serviceWorkers();
  const title = (on) =>
    sw.evaluate(async (on) => {
      const { settings } = await chrome.storage.sync.get('settings');
      await chrome.storage.sync.set({ settings: { ...settings, enabled: on } });
      await new Promise((r) => setTimeout(r, 200));
      return chrome.action.getTitle({});
    }, on);
  console.log('\n== toolbar title:', JSON.stringify({ off: await title(false), on: await title(true) }));
}

if (!only || only === 'cleanup') {
  // Clean-up: AI Overview, videos and "People also ask" go; the side panel stays.
  const sw = ctx.serviceWorkers()[0];
  const setSettings = (patch) =>
    sw.evaluate(async (patch) => {
      const { settings } = await chrome.storage.sync.get('settings');
      await chrome.storage.sync.set({ settings: { ...settings, ...patch } });
    }, patch);
  const statsNow = () =>
    sw.evaluate(async () => {
      for (const tab of await chrome.tabs.query({})) {
        const stats = await chrome.tabs.sendMessage(tab.id, { type: 'get-page-stats' }).catch(() => undefined);
        if (stats) return stats;
      }
    });
  const all = { ai: true, videos: true, questions: true, news: true, images: true, related: true };
  await setSettings({ cleanup: all });
  await page.goto('https://www.google.com/search?q=anubis&modules=1');
  await page.waitForTimeout(800);
  const shown = () =>
    page.evaluate(() => {
      const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      return {
        aiOverview: visible(document.querySelector('.module.ai')),
        videos: visible(document.querySelector('.module.videos')?.closest('.MjjYud')),
        peopleAlsoAsk: visible(document.querySelector('.module.paa')?.closest('.MjjYud')),
        aiModeTab: visible([...document.querySelectorAll('.tabs a')].find((a) => a.textContent === 'AI Mode')),
        sidePanel: visible(document.querySelector('#rhs')),
        sidePanelImages: visible(document.querySelector('#rhs .thumbs')),
        panelInColumn: visible(document.querySelector('.module.kp')),
        panelInColumnImages: visible(document.querySelector('.module.kp .kp-images')),
        results: document.querySelectorAll('[data-anubis-result]').length,
      };
    });
  console.log('\n== clean-up on:', JSON.stringify(await shown()));
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));
  await page.screenshot({ path: `${SHOTS}google-cleanup.png`, fullPage: true });
  await clickShadowButton('anubis-summary', 'Show hidden');
  await page.waitForTimeout(300);
  console.log('== after Show hidden:', JSON.stringify(await shown()));

  // The AI Overview when its label isn't a heading, and the block holds a follow-up box.
  await page.goto('https://www.google.com/search?q=anubis&ailabel=1');
  await page.waitForTimeout(800);
  console.log(
    '== harder cases (plain AI label, videos that look like results):',
    JSON.stringify(
      await page.evaluate(() => {
        const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
        return {
          aiOverview: visible(document.querySelector('.module.ai')),
          aiModeTab: visible([...document.querySelectorAll('.tabs a')].find((a) => a.textContent === 'AI Mode')),
          videoPanel: visible(document.querySelector('.module.videos')?.closest('.MjjYud')),
          videoLabel: visible([...document.querySelectorAll('.module.videos span')].find((s) => s.textContent === 'Videos')),
          searchBox: visible(document.querySelector('.q')),
          results: document.querySelectorAll('[data-anubis-result]').length,
        };
      }),
    ),
  );
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));

  // Video panels laid out like Google's: the whole panel goes, not just its header.
  for (const layout of ['titles', 'groups', 'split', 'google']) {
    await page.goto(`https://www.google.com/search?q=anubis&videos=${layout}`);
    await page.waitForTimeout(800);
    const check = await page.evaluate(() => {
      const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      return {
        header: visible(document.querySelector('.vpanel .vhead')),
        videos: visible(document.querySelector('.vpanel .vlist')),
        viewAll: visible(document.querySelector('.vpanel .vall')),
        imagesPanel: document.querySelector('.ipanel') ? visible(document.querySelector('.ipanel')) : undefined,
        summaryOnTop: document.querySelector('#rso')?.firstElementChild?.tagName === 'ANUBIS-SUMMARY',
        buttonClearOfThumbnail: (() => {
          const img = document.querySelector('.rthumb');
          const host = img?.closest('[data-anubis-result]')?.querySelector(':scope > anubis-weigh');
          if (!img || !host) return undefined;
          const a = img.getBoundingClientRect();
          const b = host.getBoundingClientRect();
          return b.width > 0 && (b.right <= a.left || b.left >= a.right || b.bottom <= a.top || b.top >= a.bottom);
        })(),
        results: [...document.querySelectorAll('[data-anubis-result]')].filter(visible).length,
      };
    });
    console.log(`== video panel (${layout}):`, JSON.stringify(check));
  }

  // DuckDuckGo stays where it is, with your settings: the AI answer goes, and so do
  // the Duck.ai tab and button, which aren't counted.
  await page.goto('https://duckduckgo.com/?q=javascript+promises&ai=1');
  await page.waitForTimeout(800);
  console.log(
    '== DuckDuckGo with AI answers removed:',
    JSON.stringify(
      await page.evaluate(() => {
        const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
        return {
          host: location.hostname,
          answer: visible(document.querySelector('[data-testid="duckassist-answer-content"]')),
          duckAiTab: visible(document.querySelector('.tabs .chat')),
          duckAiButton: visible(document.querySelector('.ask')),
          otherTabs: [...document.querySelectorAll('.tabs span')].filter(visible).length,
          results: [...document.querySelectorAll('[data-anubis-result]')].filter(visible).length,
        };
      }),
    ),
  );
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));
  await page.screenshot({ path: `${SHOTS}ddg-cleanup.png`, fullPage: true });

  // Panels found other ways. Brave's: a title that links to its Videos tab (the
  // tab of that name stays), and plain titles beside an icon. The box Bing puts
  // inside a result you came back to. Google's related searches sharing a block
  // with the page navigation, which stays.
  await setSettings({ cleanup: { ...all, discussions: true } });
  await page.goto('https://search.brave.com/search?q=anubis&panels=1');
  await page.waitForTimeout(800);
  const visibleIn = (selectors) =>
    page.evaluate((selectors) => {
      const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      return Object.fromEntries(Object.entries(selectors).map(([k, sel]) => [k, visible(document.querySelector(sel))]).concat([['results', [...document.querySelectorAll('[data-anubis-result]')].filter(visible).length]]));
    }, selectors);
  console.log('== Brave panels:', JSON.stringify(await visibleIn({ videos: '.cluster-videos', discussions: '.cluster-discussions', relatedQueries: '.related-queries', videosTab: '.tabs a[href^="/videos"]' })));
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));
  await page.goto('https://www.bing.com/search?q=javascript+promises&inline=1');
  await page.waitForTimeout(1200);
  console.log('== Bing box inside a result:', JSON.stringify(await visibleIn({ box: '#inline_rs', title: 'li.b_algo:nth-child(2) h2', snippet: 'li.b_algo:nth-child(2) .b_caption' })));
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));
  await page.goto('https://www.google.com/search?q=anubis&forum=1');
  await page.waitForTimeout(800);
  console.log('== Google related searches and pages:', JSON.stringify(await visibleIn({ related: '#bres', pager: '.AaVjTc', next: '#pnnext', aiOverview: '.aiabove' })));
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));

  // The summary goes above an AI answer that sits above the results column, lined
  // up with the results, and stays put when Show hidden brings the answer back.
  const summaryPlace = () =>
    page.evaluate(() => {
      const summary = document.querySelector('anubis-summary');
      const ai = document.querySelector('.aiabove');
      const rso = document.querySelector('#rso');
      if (!summary || !ai || !rso) return { summary: !!summary };
      const s = summary.getBoundingClientRect();
      const inset = parseFloat(getComputedStyle(summary).paddingLeft);
      return {
        aboveAi: summary.nextElementSibling === ai,
        aboveResults: s.bottom <= rso.getBoundingClientRect().top + 1,
        linedUp: Math.abs(s.left + inset - rso.getBoundingClientRect().left) < 2,
        top: Math.round(s.top),
      };
    });
  console.log('== summary with the AI answer removed:', JSON.stringify(await summaryPlace()));
  await clickShadowButton('anubis-summary', 'Show hidden');
  await page.waitForTimeout(300);
  console.log('   after Show hidden:', JSON.stringify(await summaryPlace()));
  await page.screenshot({ path: `${SHOTS}google-ai-above.png`, fullPage: true });
  await setSettings({ cleanup: { ...all, ai: false } });
  await page.goto('https://www.google.com/search?q=anubis&forum=1');
  await page.waitForTimeout(800);
  console.log('   with clean-up of AI answers off:', JSON.stringify(await summaryPlace()));

  // Forcing it on Google: the Web tab.
  await setSettings({ cleanup: { ...all, ai: false } , googleWebTab: true });
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForURL(/udm=14/, { timeout: 3000 }).catch(() => {});
  console.log('== Google with the Web tab on:', page.url());
  await setSettings({ cleanup: { ai: false, videos: false, questions: false, discussions: false, news: false, images: false, related: false }, googleWebTab: false });
}

if (!only || only === 'runs') {
  // "Collapse" style: hidden results in a row share one line, and its Show brings
  // back the whole run.
  await page.goto('https://www.google.com/search?q=fandom');
  await page.waitForSelector('anubis-bar');
  await page.waitForTimeout(300);
  const count = () =>
    page.evaluate(() => {
      const visible = (el) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      return {
        lines: [...document.querySelectorAll('anubis-bar')].filter(visible).length,
        shown: [...document.querySelectorAll('[data-anubis-result]')].filter((el) => visible(el) && !el.querySelector(':scope > anubis-bar')).length,
      };
    });
  const before = await count();
  await clickShadowButton('anubis-bar', 'Show');
  await page.waitForTimeout(300);
  console.log('\n== hidden runs:', JSON.stringify({ before, afterShow: await count() }));
  await page.screenshot({ path: `${SHOTS}google-runs.png`, fullPage: true });
}

/** Light or dark for the browser, as search pages and the extension's own pages see it. */
async function browserScheme(colorScheme) {
  await page.emulateMedia({ colorScheme });
  await ctx.serviceWorkers()[0].evaluate((s) => (s ? chrome.storage.local.set({ colorScheme: s }) : chrome.storage.local.remove('colorScheme')), colorScheme);
}

if (!only || only === 'pins') {
  // Each pinned result has a frame drawn 8px outside it, so two pinned results in a
  // row need 16px between them, or their frames cross.
  const measure = () =>
    page.evaluate(() => {
      const pinned = [...document.querySelectorAll('[data-anubis-state~="pin"]')].map((el) => el.getBoundingClientRect()).sort((a, b) => a.top - b.top);
      const gaps = pinned.slice(1).map((r, i) => Math.round(r.top - pinned[i].bottom));
      return { pinned: pinned.length, gaps, framesApart: gaps.every((g) => g >= 16), pushed: document.querySelectorAll('[data-anubis-pin-room]').length };
    });
  await page.goto('https://www.google.com/search?q=promise+mdn&inner=1');
  await page.waitForTimeout(700);
  console.log('\n== pinned results in a row:', JSON.stringify(await measure()));
  await page.screenshot({ path: `${SHOTS}google-pins.png`, fullPage: true });
  // The same after passes that change which results are shown: no creeping or leftovers.
  await clickShadowButton('anubis-summary', 'Official docs4');
  await page.waitForTimeout(300);
  console.log('   only Official docs:', JSON.stringify(await measure()));
  await clickShadowButton('anubis-summary', 'Show all');
  await page.waitForTimeout(300);
  console.log('   all again:', JSON.stringify(await measure()));
  // Where results already have room (the usual mock, spaced by margins outside them), nothing moves.
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(700);
  console.log('   DuckDuckGo:', JSON.stringify(await measure()));
}

if (!only || only === 'popover') {
  for (const [url, name] of [
    ['https://duckduckgo.com/?q=javascript+promises', 'popover-light'],
    ['https://duckduckgo.com/?q=javascript+promises&dark=1', 'popover-dark'],
  ]) {
    await browserScheme(name === 'popover-dark' ? 'dark' : 'light');
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
      // The summary says what changed and offers to undo it.
      console.log('\n== summary after pinning:', JSON.stringify(await shadowText('anubis-summary')));
      await page.keyboard.press('Escape');
      await page.screenshot({ path: `${SHOTS}summary-undo.png`, fullPage: false });
      await clickShadowButton('anubis-summary', 'Undo');
      await page.waitForTimeout(600);
      const after = await report(page, 'after Undo: javascript.info raised again');
      console.log('== undo:', JSON.stringify({
        raised: after.find((r) => r.text.includes('Modern JavaScript'))?.state,
        summary: await shadowText('anubis-summary'),
      }));
    }
    await page.keyboard.press('Escape');
  }

  // On "auto", the menu matches the popup (the browser's light or dark), while what
  // sits on the page follows the page, to stay readable on it.
  await browserScheme('dark');
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(600);
  const tutorial = page.locator('[data-anubis-result]', { hasText: 'The Modern JavaScript Tutorial' });
  await tutorial.hover();
  await tutorial.locator('anubis-weigh').click({ position: { x: 13, y: 13 } });
  await page.waitForTimeout(300);
  console.log('\n== auto theme, dark browser, light page:', JSON.stringify(await page.evaluate(() => ({
    menu: document.querySelector('anubis-popover')?.dataset.theme,
    summary: document.querySelector('anubis-summary')?.dataset.theme,
    tags: document.querySelector('anubis-chips')?.dataset.theme,
  }))));
  await page.screenshot({ path: `${SHOTS}popover-auto-dark-browser.png`, fullPage: false });
  await page.keyboard.press('Escape');
  await browserScheme(null);

  // A result a subscribed list weighs (Official docs tags MDN) offers to report it
  // to that list, as a pre-filled issue with the rule that matched.
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(600);
  const mdn = page.locator('[data-anubis-result]', { hasText: 'Promise - JavaScript | MDN' });
  await mdn.hover();
  await mdn.locator('anubis-weigh').click({ position: { x: 13, y: 13 } });
  await page.waitForTimeout(300);
  const reportLink = (await shadowLinks('anubis-popover')).find((a) => a.href.includes('/issues/new'));
  const issue = reportLink && new URL(reportLink.href);
  console.log('\n== report a wrong result:', JSON.stringify({
    link: reportLink?.text,
    tracker: issue && issue.origin + issue.pathname,
    title: issue?.searchParams.get('title'),
    rule: /```\n(.*)\n```/.exec(issue?.searchParams.get('body') ?? '')?.[1],
  }));
  await page.screenshot({ path: `${SHOTS}popover-report.png`, fullPage: false });
  await page.keyboard.press('Escape');
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
  // Google: "Load more results" by message (the path the popup uses).
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

if (!only || only === 'subscribe-link') {
  // Subscribe on the lists directory: the subscribe page it leads to opens settings
  // with the list filled in, the directory's tab goes back, and nothing is added
  // until Subscribe. The directory, the subscribe page and the list are mocks.
  const LIST = 'https://raw.githubusercontent.com/example/lists/main/e2e.anubis';
  const link = `https://bishop-v.github.io/anubis/subscribe?url=${encodeURIComponent(LIST)}&name=E2E+list`;
  await ctx.route(/^https:\/\/bishop-v\.github\.io\//, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: route.request().url().endsWith('/lists')
        ? `<!doctype html><title>Lists directory</title><a id="subscribe" href="${link}">Subscribe</a> <a id="new-tab" href="${link}" target="_blank">In a new tab</a>`
        : '<!doctype html><title>Subscribe to a list</title><h1>Subscribe to a list</h1>',
    }),
  );
  await ctx.route(LIST, (route) =>
    route.fulfill({ contentType: 'text/plain', body: '! name: E2E list\n! tag: e2e | E2E | #3fa37a\n\n$site=example.org,tag=e2e\n' }),
  );
  const sw = ctx.serviceWorkers()[0];
  const subscribed = () => sw.evaluate(async (url) => !!(await chrome.storage.sync.get('subscriptions')).subscriptions?.some((s) => s.url === url), LIST);
  const nextPage = () => ctx.waitForEvent('page', { timeout: 4000 }).catch(() => undefined);

  const dir = await ctx.newPage();
  await dir.goto('https://bishop-v.github.io/anubis/lists');
  let opened = nextPage();
  await dir.click('#subscribe');
  const opt = await opened;
  await opt?.waitForSelector('.panel.offer', { timeout: 4000 }).catch(() => {});
  await dir.waitForTimeout(300);
  console.log('\n== subscribe-link');
  console.log('  settings opened:', opt?.url().replace(/^chrome-extension:\/\/[^/]+/, ''));
  console.log('  offer:', await opt?.locator('.panel.offer h3').textContent().catch(() => 'none'));
  console.log('  directory tab back on:', dir.url());
  console.log('  subscribed before Subscribe:', await subscribed());
  await opt?.screenshot({ path: `${SHOTS}subscribe-link.png`, fullPage: true });
  await opt?.locator('.panel.offer .btn.primary').click();
  await opt?.waitForTimeout(800);
  console.log('  after Subscribe:', await opt?.locator('.notice').first().textContent().catch(() => 'no notice'));
  console.log('  subscribed:', await subscribed(), '| offer left:', await opt?.locator('.panel.offer').count(), '| address:', opt?.url().replace(/^chrome-extension:\/\/[^/]+/, ''));

  // Forward onto the subscribe page again: no second settings tab.
  opened = nextPage();
  await dir.goForward();
  console.log('  Forward onto the subscribe page opened settings:', !!(await opened));

  // Opened in a new tab: that tab gives way to settings, which says it's already there.
  await dir.goto('https://bishop-v.github.io/anubis/lists');
  const tabs = [];
  const collect = (p) => tabs.push(p);
  ctx.on('page', collect);
  await dir.click('#new-tab');
  await dir.waitForTimeout(1500);
  ctx.off('page', collect);
  const [lone, again] = tabs;
  await again?.waitForSelector('.notice', { timeout: 4000 }).catch(() => {});
  console.log('  new tab:', lone?.isClosed() ? 'closed' : lone?.url(), '| settings says:', await again?.locator('.notice').first().textContent().catch(() => 'no notice'));
  for (const p of [dir, opt, lone, again]) await p?.close().catch(() => {});
}

if (!only || only === 'options') {
  for (const theme of ['dark', 'light']) {
    const opt = await ctx.newPage();
    await opt.setViewportSize({ width: 1180, height: 900 });
    await opt.goto(`chrome-extension://${extId}/options.html#appearance`);
    await opt.waitForTimeout(300);
    await opt.getByRole('button', { name: theme === 'dark' ? 'Dark theme' : 'Light theme' }).first().click();
    for (const section of ['sites', 'tags', 'lists', 'cleanup', 'appearance', 'sync', 'share']) {
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

if (!only || only === 'welcome') {
  // Installing opens the welcome page, once. It can't be pinned from a test, so it
  // shows Chrome's steps.
  const find = () => ctx.pages().filter((p) => p.url() === `chrome-extension://${extId}/welcome.html`);
  for (let i = 0; i < 50 && !find().length; i++) await new Promise((r) => setTimeout(r, 100));
  const opened = find().length;
  const welcome = find()[0] ?? (await ctx.newPage());
  welcome.on('pageerror', (e) => console.log('  welcome page error:', e.message));
  const check = () =>
    welcome.evaluate(() => ({
      pin: document.querySelector('#pin-text')?.textContent,
      engines: [...document.querySelectorAll('#engines a')].map((a) => `${a.textContent} ${new URL(a.href).host}`),
      lists: [...document.querySelectorAll('#lists .name')].map((el) => el.textContent),
      tags: document.querySelectorAll('#lists .tag').length,
      scrollsSideways: document.documentElement.scrollWidth > innerWidth,
    }));
  for (const scheme of ['dark', 'light']) {
    await welcome.emulateMedia({ colorScheme: scheme });
    await welcome.setViewportSize({ width: 1180, height: 900 });
    await welcome.goto(`chrome-extension://${extId}/welcome.html`);
    await welcome.waitForTimeout(300);
    await welcome.screenshot({ path: `${SHOTS}welcome-${scheme}.png`, fullPage: true });
  }
  const desktop = await check();
  await welcome.setViewportSize({ width: 390, height: 844 });
  await welcome.waitForTimeout(200);
  await welcome.screenshot({ path: `${SHOTS}welcome-phone.png`, fullPage: true });
  console.log('\n== welcome:', JSON.stringify({ opened, ...desktop, phoneScrollsSideways: (await check()).scrollsSideways }));
  await welcome.close();
}

// Not part of a normal run: regenerates the screenshots in docs/img/ from
// the mock pages, so the documentation shows the current interface.
if (!only || only === 'sync') {
  // Browser sync. A change from the result menu is saved compressed, with a
  // checksum. Another computer's change that arrives in pieces (the count of
  // chunks first, the chunks later) is only used once all of it is there.
  const sw = ctx.serviceWorkers()[0];
  // Start from the test list, as saved before lists were compressed.
  const seed = () => sw.evaluate((personal) => chrome.storage.sync.set({ 'personal.0': personal, personal: { chunks: 1, updatedAt: Date.now() } }), PERSONAL);
  await seed();
  const state = () => page.locator('[data-anubis-result]', { hasText: 'The Modern JavaScript Tutorial' }).getAttribute('data-anubis-state');
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(600);
  const target = page.locator('[data-anubis-result]', { hasText: 'The Modern JavaScript Tutorial' });
  await target.hover();
  await target.locator('anubis-weigh').click({ position: { x: 13, y: 13 } });
  await page.waitForTimeout(300);
  // Focus starts on the chosen weight (Raise); Tab to Pin and press it.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  const saved = await sw.evaluate(async () => (await chrome.storage.sync.get('personal')).personal);
  const pinned = await state();
  const chunk = await sw.evaluate(async (text) => {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
    const sum = `${text.length}:${(hash >>> 0).toString(16)}`;
    await chrome.storage.sync.set({ personal: { chunks: 1, updatedAt: Date.now(), encoding: 'deflate', sum } });
    return btoa(String.fromCharCode(...bytes));
  }, '! name: My list\n$site=javascript.info,discard\n');
  await page.waitForTimeout(600);
  const countOnly = await state();
  await sw.evaluate((chunk) => chrome.storage.sync.set({ 'personal.0': chunk }), chunk);
  await page.waitForTimeout(800);
  console.log('\n== sync:', JSON.stringify({
    saved: { encoding: saved?.encoding, checksum: Boolean(saved?.sum), chunks: saved?.chunks },
    'after Pin': pinned,
    'count arrived, chunks not': countOnly,
    'chunks arrived (hidden there)': await state(),
  }));
  await seed();
}

if (!only || only === 'webdav') {
  // Syncing between browsers through a WebDAV server, against a mock one. Chrome
  // asks before allowing the server's host, which a script can't answer, so this
  // runs a copy of the build whose manifest already allows it. The mock answers
  // the background script, which Playwright only routes with this set.
  process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';
  const copy = mkdtempSync(join(tmpdir(), 'anubis-ext-'));
  cpSync(EXT, copy, { recursive: true });
  const manifest = JSON.parse(readFileSync(join(copy, 'manifest.json'), 'utf8'));
  manifest.host_permissions = [...(manifest.host_permissions ?? []), 'https://dav.example/*'];
  writeFileSync(join(copy, 'manifest.json'), JSON.stringify(manifest));
  const { ctx: dav, extId: davId } = await launch({}, copy);
  const davWorker = dav.serviceWorkers()[0];
  const FILE = 'https://dav.example/files/me/anubis-sync.json';
  const files = new Map();
  const requests = [];
  let version = 0;
  await dav.route(/^https:\/\/dav\.example\//, async (route) => {
    const req = route.request();
    const headers = await req.allHeaders();
    requests.push(req.method());
    if (headers.authorization !== `Basic ${Buffer.from('me:app-password').toString('base64')}`) return route.fulfill({ status: 401 });
    const file = files.get(req.url());
    if (req.method() === 'GET') return file ? route.fulfill({ headers: { ETag: file.etag }, body: file.body }) : route.fulfill({ status: 404 });
    if (headers['if-match'] && headers['if-match'] !== file?.etag) return route.fulfill({ status: 412 });
    files.set(req.url(), { body: req.postData(), etag: `"${++version}"` });
    return route.fulfill({ status: 201 });
  });
  const opt = await dav.newPage();
  opt.on('pageerror', (e) => console.log('  options page error:', e.message));
  await opt.goto(`chrome-extension://${davId}/options.html#sync`);
  await opt.waitForTimeout(500);
  await opt.getByLabel('Address').fill('https://dav.example/files/me');
  await opt.getByLabel('User name').fill('me');
  await opt.getByLabel('Password').fill('app-password');
  await opt.getByRole('button', { name: 'Connect' }).click();
  await opt.waitForTimeout(1500);
  await opt.screenshot({ path: `${SHOTS}options-webdav.png`, fullPage: true });
  const created = JSON.parse(files.get(FILE)?.body ?? 'null');
  const status = await opt.locator('.notice').first().textContent({ timeout: 2000 }).catch(() => 'no status');
  // Another browser adds a site; Sync now brings it here.
  files.set(FILE, { body: JSON.stringify({ ...created, personal: `${created.personal}$site=from-firefox.example,discard\n` }), etag: `"${++version}"` });
  await opt.getByRole('button', { name: 'Sync now' }).click();
  await opt.waitForTimeout(1500);
  await opt.goto(`chrome-extension://${davId}/options.html#sites`);
  await opt.waitForTimeout(500);
  const arrived = await opt.getByText('from-firefox.example').count();
  // A change here reaches the server a few seconds later.
  await davWorker.evaluate(async () => {
    const { settings } = await chrome.storage.sync.get('settings');
    await chrome.storage.sync.set({ settings: { ...settings, deeper: 2 } });
  });
  await opt.waitForTimeout(4500);
  console.log('\n== webdav:', JSON.stringify({
    requests: requests.join(' '),
    'file created': Boolean(created?.anubis),
    status,
    'site from the other browser shown': arrived > 0,
    'change here on the server': JSON.parse(files.get(FILE).body).settings.deeper === 2,
  }));
  await dav.close();
}

if (only === 'docs') {
  const DOCS_IMG = fileURLToPath(new URL('../docs/img/', import.meta.url));
  mkdirSync(DOCS_IMG, { recursive: true });
  const sw = ctx.serviceWorkers()[0];
  const setSettings = (patch) =>
    sw.evaluate(async (patch) => {
      const { settings } = await chrome.storage.sync.get('settings');
      await chrome.storage.sync.set({ settings: { ...settings, ...patch } });
    }, patch);
  // Screenshot the smallest rectangle around these elements, with some room.
  const clip = async (name, selectors, pad = 14) => {
    const box = await page.evaluate(
      ({ selectors, pad }) => {
        const rects = selectors.flatMap((s) => [...document.querySelectorAll(s)].slice(0, 1)).map((el) => el.getBoundingClientRect());
        const x = Math.min(...rects.map((r) => r.left)) - pad;
        const y = Math.min(...rects.map((r) => r.top)) - pad;
        const right = Math.max(...rects.map((r) => r.right)) + pad;
        const bottom = Math.max(...rects.map((r) => r.bottom)) + pad;
        return { x: Math.max(0, x + scrollX), y: Math.max(0, y + scrollY), width: right - x, height: bottom - y };
      },
      { selectors, pad },
    );
    await page.screenshot({ path: `${DOCS_IMG}${name}.png`, clip: box, fullPage: true });
  };

  // Every picture comes in light and dark: the mock page in its dark mode, or the
  // extension page with the OS in dark mode. The dark one's name ends in -dark, and
  // the site shows the one that matches its mode (docs/.vitepress/config.ts).
  const SCHEMES = [
    ['light', '', ''],
    ['dark', '-dark', '&dark=1'],
  ];
  for (const [scheme, suffix, query] of SCHEMES) {
    await browserScheme(scheme);
    await page.goto(`https://www.google.com/search?q=anubis${query}`);
    await page.waitForTimeout(700);
    await clip(`summary${suffix}`, ['anubis-summary', '#rso > .MjjYud:nth-of-type(2)']);
    const wiki = page.locator('[data-anubis-result]', { hasText: 'Anubis - Wikipedia' });
    await wiki.hover();
    await page.waitForTimeout(200);
    await clip(`result${suffix}`, ['[data-anubis-result]:has(a[href*="wikipedia"])']);
    await clip(`hidden${suffix}`, ['[data-anubis-result]:has(anubis-bar)'], 10);

    await page.goto(`https://duckduckgo.com/?q=javascript+promises${query}`);
    await page.waitForTimeout(700);
    const target = page.locator('[data-anubis-result]', { hasText: 'The Modern JavaScript Tutorial' });
    await target.hover();
    await target.locator('anubis-weigh').click({ position: { x: 13, y: 13 } });
    await page.waitForTimeout(300);
    await clip(`menu${suffix}`, ['anubis-popover', '[data-anubis-result]:has(a[href*="javascript.info"])'], 12);
    await page.keyboard.press('Escape');
  }
  await browserScheme(null);

  await setSettings({ cleanup: { ai: true, videos: true, questions: true, news: true, images: true, related: true } });
  for (const [, suffix, query] of SCHEMES) {
    await page.goto(`https://www.google.com/search?q=anubis&modules=1${query}`);
    await page.waitForTimeout(800);
    await clip(`cleanup-summary${suffix}`, ['anubis-summary']);
  }

  // The homepage's before and after: the same search with Anubis off, then on with
  // clean-up, cut to the same box (the logo, the search box and the results column).
  // A wider window keeps the side panel clear of the box.
  const beforeAfter = async (name) => {
    for (const [, suffix, query] of SCHEMES) {
      await page.goto(`https://www.google.com/search?q=anubis&modules=1${query}`);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${DOCS_IMG}${name}${suffix}.png`, clip: { x: 0, y: 0, width: 868, height: 920 } });
    }
  };
  await page.setViewportSize({ width: 1280, height: 1000 });
  await beforeAfter('after');
  await setSettings({ enabled: false });
  await beforeAfter('before');
  await page.setViewportSize({ width: 1180, height: 1000 });
  await setSettings({ enabled: true, cleanup: { ai: false, videos: false, questions: false, news: false, images: false, related: false } });

  // The same pairs as 1920×1080 slides, light and dark, for talks and posts. They're
  // in docs/public so the site serves them at fixed addresses.
  const png = (name) => `data:image/png;base64,${readFileSync(`${DOCS_IMG}${name}.png`).toString('base64')}`;
  const logo = readFileSync(fileURLToPath(new URL('../public/anubis.svg', import.meta.url)), 'utf8');
  // The jackal without its tile; the type is store/render.mjs's.
  const jackal = logo.replace(/<rect[^>]*\/>/, '').replace('<svg ', '<svg width="46" height="46" ');
  const serif = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', 'Bitstream Charter', Charter, Georgia, serif`;
  const themes = {
    light: { ground: '#fbfbfa', name: '#1b1a16', text: '#3a372f', label: '#6b6457', note: '#8a8272', rule: '#d4a637', edge: '#dcd8cc', suffix: '' },
    dark: { ground: '#1b1a16', name: '#d4a637', text: '#e8e2d2', label: '#a39b8c', note: '#8a8272', rule: '#d4a63773', edge: '#4a4438', suffix: '-dark' },
  };
  const slide = await ctx.newPage();
  await slide.setViewportSize({ width: 960, height: 540 });
  for (const [theme, c] of Object.entries(themes)) {
    const shot = (label, name, edge) => `<div>
        <div style="margin:0 0 10px 2px;font-size:15px;color:${c.label}">${label}</div>
        <img src="${png(name + c.suffix)}" style="display:block;width:100%;border-radius:8px 8px 0 0;box-shadow:0 0 0 1px ${edge}">
      </div>`;
    await slide.setContent(`<!doctype html><meta charset="utf-8">
      <body style="margin:0;width:960px;height:540px;background:${c.ground};color:${c.text};font-family:${serif};overflow:hidden;position:relative">
        <div style="position:absolute;left:44px;right:48px;top:30px;display:flex;align-items:center;gap:12px">
          ${jackal}
          <span style="color:${c.name};font-size:34px;line-height:1">Anubis</span>
          <span style="margin-left:14px;padding-left:18px;border-left:1px solid ${c.rule};font-size:19px;line-height:30px">Hide, rank and tag search results</span>
          <span style="margin-left:auto;font-size:12px;color:${c.note}">Shown on a test page</span>
        </div>
        <div style="position:absolute;left:48px;right:48px;top:112px;display:grid;grid-template-columns:1fr 1fr;gap:32px">
          ${shot('Without Anubis', 'before', c.edge)}${shot('With Anubis', 'after', '#d4a637')}
        </div>
      </body>`);
    await slide.screenshot({ path: fileURLToPath(new URL(`../docs/public/before-after-${theme}.png`, import.meta.url)) });
  }
  await slide.close();

  // Downloads fail inside the test browser, which would put "Failed to fetch" under
  // every list. Store the bundled lists as if just downloaded, as a user sees them.
  const bundled = Object.fromEntries(
    ['official-docs', 'discussions', 'reference', 'paywalls'].map((id) => [id, readFileSync(fileURLToPath(new URL(`../lists/${id}.anubis`, import.meta.url)), 'utf8')]),
  );
  await sw.evaluate(async (bundled) => {
    const listCache = {};
    for (const [id, text] of Object.entries(bundled)) listCache[`builtin:${id}`] = { text, fetchedAt: Date.now() };
    await chrome.storage.local.set({ listCache });
  }, bundled);
  const opt = await ctx.newPage();
  const pop = await ctx.newPage();
  await opt.setViewportSize({ width: 1100, height: 760 });
  await pop.setViewportSize({ width: 364, height: 600 });
  for (const [colorScheme, suffix] of SCHEMES) {
    await opt.emulateMedia({ colorScheme });
    for (const section of ['sites', 'tags', 'lists', 'cleanup', 'sync']) {
      await opt.goto(`chrome-extension://${extId}/options.html#${section}`);
      await opt.waitForTimeout(500);
      await opt.screenshot({ path: `${DOCS_IMG}options-${section}${suffix}.png` });
    }
    await pop.emulateMedia({ colorScheme });
    await pop.goto(`chrome-extension://${extId}/popup.html`);
    await pop.waitForTimeout(400);
    await pop.screenshot({ path: `${DOCS_IMG}popup${suffix}.png` });
  }
  await opt.close();
  await pop.close();
  console.log('\n== documentation screenshots saved to docs/img/');
}

await ctx.close();
