// End-to-end check against mock search pages. Loads the built Chrome extension
// into Chromium, serves the pages in fixtures.mjs at the real engines' URLs,
// prints what Anubis decided for each result and saves screenshots to e2e/shots/.
//
//   npm run e2e                 build, then run everything
//   node e2e/run.mjs pages      one part: pages, hostile, grouped, reveal, runs, off, cleanup, popover, ddg-hide,
//                               filter, deeper, import, subscribe, options
//   node e2e/run.mjs docs       only: regenerate the screenshots in docs/img/
//
// Needs a Chromium build (branded Chrome no longer loads unpacked extensions from
// the command line). Point CHROMIUM_PATH at it, e.g. CHROMIUM_PATH=$(which chromium).
// The mock pages are modelled on each engine's markup; they are not the real thing.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
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

async function launch(settings = {}) {
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'anubis-')), {
    executablePath,
    headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, ...proxyTrustArgs()],
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
    'https://www.google.com/search?q=anubis&mobile=1': googleMobile('anubis', ANUBIS_RESULTS),
    'https://noai.duckduckgo.com/?q=javascript+promises': duckduckgo('javascript promises', JS_RESULTS),
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

  // Forcing it: DuckDuckGo opens its no-AI version, Google its Web tab.
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForURL(/noai\.duckduckgo\.com/, { timeout: 3000 }).catch(() => {});
  console.log('== DuckDuckGo with AI answers off:', page.url());
  await setSettings({ cleanup: { ...all, ai: false } , googleWebTab: true });
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForURL(/udm=14/, { timeout: 3000 }).catch(() => {});
  console.log('== Google with the Web tab on:', page.url());
  await setSettings({ cleanup: { ai: false, videos: false, questions: false, news: false, images: false, related: false }, googleWebTab: false });
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
    for (const section of ['sites', 'tags', 'lists', 'cleanup', 'appearance', 'share']) {
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

// Not part of a normal run: regenerates the screenshots in docs/img/ from
// the mock pages, so the documentation shows the current interface.
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

  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForTimeout(700);
  await clip('summary', ['anubis-summary', '#rso > .MjjYud:nth-of-type(2)']);
  const wiki = page.locator('[data-anubis-result]', { hasText: 'Anubis - Wikipedia' });
  await wiki.hover();
  await page.waitForTimeout(200);
  await clip('result', ['[data-anubis-result]:has(a[href*="wikipedia"])']);
  await clip('hidden', ['[data-anubis-result]:has(anubis-bar)'], 10);

  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(700);
  const target = page.locator('[data-anubis-result]', { hasText: 'The Modern JavaScript Tutorial' });
  await target.hover();
  await target.locator('anubis-weigh').click({ position: { x: 13, y: 13 } });
  await page.waitForTimeout(300);
  await clip('menu', ['anubis-popover', '[data-anubis-result]:has(a[href*="javascript.info"])'], 12);
  await page.keyboard.press('Escape');

  await setSettings({ cleanup: { ai: true, videos: true, questions: true, news: true, images: true, related: true } });
  await page.goto('https://www.google.com/search?q=anubis&modules=1');
  await page.waitForTimeout(800);
  await clip('cleanup-summary', ['anubis-summary']);
  await setSettings({ cleanup: { ai: false, videos: false, questions: false, news: false, images: false, related: false } });

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
  await opt.setViewportSize({ width: 1100, height: 760 });
  for (const section of ['sites', 'tags', 'lists', 'cleanup']) {
    await opt.goto(`chrome-extension://${extId}/options.html#${section}`);
    await opt.waitForTimeout(500);
    await opt.screenshot({ path: `${DOCS_IMG}options-${section}.png` });
  }
  await opt.close();
  const pop = await ctx.newPage();
  await pop.setViewportSize({ width: 364, height: 600 });
  await pop.goto(`chrome-extension://${extId}/popup.html`);
  await pop.waitForTimeout(400);
  await pop.screenshot({ path: `${DOCS_IMG}popup.png` });
  await pop.close();
  console.log('\n== documentation screenshots saved to docs/img/');
}

await ctx.close();
