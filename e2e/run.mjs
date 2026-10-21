// End-to-end check against mock search pages. Loads the built Chrome extension
// into Chromium, serves the pages in fixtures.mjs at the real engines' URLs,
// prints what Anubis decided for each result and saves screenshots to e2e/shots/.
//
//   npm run e2e                 build, then run everything
//   node e2e/run.mjs pages      one part: pages, hostile, grouped, reveal, runs, shortcuts, mobile, off, cleanup,
//                               pins, popover, ddg-hide, filter, deeper, import, subscribe, subscribe-link, options,
//                               responsive, axe, welcome, sync, webdav, popup-tags, tag-notes, settings-undo, suggest-changes, checks (layout, lifecycle, pin/hidden chips, DDG icon colors, Undo in Settings, Suggest changes)
//   node e2e/run.mjs docs       only: regenerate the screenshots in docs/img/ and the slides
//                               in docs/public/
//
// Needs Chromium (branded Chrome no longer loads unpacked extensions from the
// command line). It uses CHROMIUM_PATH if set, then Playwright's installed build,
// then a chromium on PATH, and failing those, with Nix installed (NixOS, where
// Playwright's build doesn't run), fetches nixpkgs' Chromium itself.
// The mock pages are modelled on each engine's markup; they are not the real thing.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANUBIS_PAGE2, ANUBIS_PAGE3, ANUBIS_RESULTS, JS_MORE, JS_RESULTS, bing, bingChallenge, bingMobile, brave, duckduckgo, duckduckgoAd, duckduckgoHtml, duckduckgoLite, duckduckgoMobile, google, googleMobile, ecosia, startpage, yahoo } from './fixtures.mjs';
import { ENGINE_TABS, engineTab } from './tab-fixtures.mjs';

const EXT = fileURLToPath(new URL('../.output/chrome-mv3', import.meta.url));
/** A message as the build shows it, in ANUBIS_LANG's translation where it has the message. */
function builtMessage(key) {
  const read = (lang) => {
    try {
      return JSON.parse(readFileSync(join(EXT, '_locales', lang, 'messages.json'), 'utf8'))[key]?.message;
    } catch {
      return undefined;
    }
  };
  return (process.env.ANUBIS_LANG && read(process.env.ANUBIS_LANG)) ?? read('en');
}
const SHOTS = fileURLToPath(new URL('./shots/', import.meta.url));
const only = process.argv[2];
const checks = only === 'checks';

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const playwrights = chromium.executablePath();
  if (existsSync(playwrights)) return playwrights;
  const onPath = (name) => (process.env.PATH ?? '').split(delimiter).map((dir) => dir && join(dir, name)).find((p) => p && existsSync(p));
  const system = onPath('chromium') ?? onPath('chromium-browser');
  if (system) return system;
  // The same Chromium `nix shell nixpkgs#chromium` gives, from the nixpkgs flake.lock
  // pins, so it stays in the Nix store between runs and the dev shell doesn't carry it.
  if (onPath('nix')) {
    console.log('No Chromium found; getting nixpkgs#chromium with Nix (the first time takes a while)…');
    try {
      const root = fileURLToPath(new URL('..', import.meta.url));
      const out = execFileSync('nix', ['build', '--inputs-from', root, 'nixpkgs#chromium', '--no-link', '--print-out-paths'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      }).trim().split('\n')[0];
      if (out && existsSync(join(out, 'bin', 'chromium'))) return join(out, 'bin', 'chromium');
    } catch {
      // Falls through to the message below.
    }
  }
  return playwrights;
}
const executablePath = findChromium();

if (!existsSync(join(EXT, 'manifest.json'))) {
  console.error('No Chrome build found. Run `npm run build:chrome` first (or `npm run e2e`).');
  process.exit(1);
}
if (!existsSync(executablePath)) {
  console.error(
    'Chromium is missing. Install Playwright\'s (`npx playwright-core install chromium`), put a system `chromium` on PATH, install Nix (the run then fetches nixpkgs#chromium itself), or set CHROMIUM_PATH to its binary.',
  );
  process.exit(1);
}
mkdirSync(SHOTS, { recursive: true });

const PERSONAL = `! name: My list
! description: Sites I've weighed myself.
! author: me
! tag: ai-slop | AI slop | #e0664f | Low-quality AI-generated content.
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

async function waitForWorker(sw, check, error) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await sw.evaluate(check)) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(error);
}

/** The mock search pages, by the address each answers. */
function mockPages() {
  return {
    'https://duckduckgo.com/?q=javascript+promises': duckduckgo('javascript promises', JS_RESULTS),
    'https://duckduckgo.com/?q=javascript+promises&dark=1': duckduckgo('javascript promises', JS_RESULTS, true),
    'https://www.google.com/search?q=anubis': google('anubis', ANUBIS_RESULTS),
    'https://www.google.com/search?q=anubis&dark=1': google('anubis', ANUBIS_RESULTS, { dark: true }),
    'https://www.bing.com/search?q=javascript+promises': bing('javascript promises', JS_RESULTS),
    'https://search.brave.com/search?q=anubis': brave('anubis', ANUBIS_RESULTS),
    'https://www.google.com/search?q=anubis&deep=1': google('anubis', ANUBIS_RESULTS, { next: '/search?q=anubis&start=10' }),
    'https://www.google.com/search?q=anubis&start=10': google('anubis', ANUBIS_PAGE2),
    'https://www.google.com/search?q=anubis&deep=late': google('anubis', ANUBIS_RESULTS, { next: '/search?q=anubis&start=10', latePager: true }),
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
    'https://duckduckgo.com/?q=javascript+promises&mobile=1': duckduckgoMobile('javascript promises', JS_RESULTS),
    'https://www.bing.com/search?q=javascript+promises&mobile=1': bingMobile('javascript promises', JS_RESULTS),
    // What an earlier copy of the extension leaves on the page when it reloads or
    // updates while the page is open (Firefox then runs the new copy in the same page).
    'https://www.google.com/search?q=anubis&leftover=1': google('anubis', ANUBIS_RESULTS).replace('<div id="rcnt">', '<anubis-summary style="display:block">old summary</anubis-summary><div id="rcnt">'),
    'https://www.google.com/search?q=anubis&forum=1': google('anubis', ANUBIS_RESULTS, { forum: true, grouped: true, aiAbove: true, related: true, next: '/search?q=anubis&start=10' }),
    'https://www.google.com/search?q=anubis&aigrid=1': google('anubis', ANUBIS_RESULTS, { forum: true, grouped: true, aiAbove: 'grid', related: true, next: '/search?q=anubis&start=10' }),
    'https://www.bing.com/search?q=javascript+promises&inline=1': bing('javascript promises', JS_RESULTS, { inline: true }),
    'https://www.bing.com/search?q=javascript+promises&copilot=1': bing('javascript promises', JS_RESULTS, { copilot: true }),
    'https://www.bing.com/search?q=javascript+promises&copilot=1&pole=1': bing('javascript promises', JS_RESULTS, { copilot: true, pole: true }),
    'https://search.brave.com/search?q=anubis&panels=1': brave('anubis', ANUBIS_RESULTS, { panels: true }),
    // Load more results with the engine's pager inside the results list.
    'https://search.brave.com/search?q=anubis&paged=1': brave('anubis', ANUBIS_RESULTS, { pager: '/search?q=anubis&paged=1&offset=1' }),
    'https://search.brave.com/search?q=anubis&paged=1&offset=1': brave('anubis', ANUBIS_PAGE2, { pager: '/search?q=anubis&paged=1&offset=2' }),
    'https://search.brave.com/search?q=anubis&paged=1&offset=2': brave('anubis', ANUBIS_PAGE3, { pager: '/search?q=anubis&paged=1&offset=3' }),
    'https://www.bing.com/search?q=javascript+promises&paged=1': bing('javascript promises', JS_RESULTS, { next: '/search?q=javascript+promises&paged=1&first=11' }),
    // A page reached by a redirect: its Next link carries `rdr=1`, and Bing answers that with the same page again.
    'https://www.bing.com/search?q=javascript+promises&redirected=1': bing('javascript promises', JS_RESULTS, { next: '/search?q=javascript+promises&rdr=1&rdrig=ABC&first=11' }),
    'https://www.bing.com/search?q=javascript+promises&rdr=1&rdrig=ABC&first=11': bing('javascript promises', JS_RESULTS),
    'https://www.bing.com/search?q=javascript+promises&first=11': bing('javascript promises', JS_MORE),
    // Page 2 answers with Bing's robot check however it's asked for.
    'https://www.bing.com/search?q=javascript+promises&paged=2': bing('javascript promises', JS_RESULTS, { next: '/search?q=javascript+promises&paged=2&first=11' }),
    'https://www.bing.com/search?q=javascript+promises&paged=2&first=11': bingChallenge(),
    // Page 2 answers a request with Bing's robot check, and a page load with results.
    'https://www.bing.com/search?q=javascript+promises&paged=1&first=11': (request) =>
      request.resourceType() === 'document' ? bing('javascript promises', JS_MORE) : bingChallenge(),
    'https://www.bing.com/search?q=javascript+promises&thumb=1': bing('javascript promises', JS_RESULTS, { thumb: true }),
    'https://www.bing.com/search?q=javascript+promises&skipped=1': bing('javascript promises', JS_RESULTS, { skipped: true }),
    'https://www.startpage.com/do/search?q=javascript+promises': startpage('javascript promises', JS_RESULTS),
    'https://www.ecosia.org/search?q=javascript+promises': ecosia('javascript promises', JS_RESULTS),
    'https://www.ecosia.org/search?q=javascript+promises&p=1': ecosia('javascript promises', JS_MORE),
    // Page 2 answers a request with Ecosia's robot check (a 403). A page load would get results, but the live site
    // forbids frames, so Load more results mustn't count on one.
    'https://www.ecosia.org/search?q=robot+check': ecosia('robot check', JS_RESULTS),
    'https://www.ecosia.org/search?q=robot+check&p=1': (request) =>
      request.resourceType() === 'document' ? ecosia('robot check', JS_MORE) : { status: 403, body: '<title>Confirm you’re not a robot</title>' },
    'https://www.bing.com/search?q=javascript+promises&sponsored=1': bing('javascript promises', JS_RESULTS, { sponsored: true }),
    'https://search.yahoo.com/search?p=javascript+promises': yahoo('javascript promises', JS_RESULTS),
    'https://search.yahoo.com/search?p=javascript+promises&long=1': yahoo('javascript promises', JS_RESULTS, { longTitle: true, rail: true }),
    'https://duckduckgo.com/?q=javascript+promises&ai=1': duckduckgo('javascript promises', JS_RESULTS, false, [], { ai: true }),
    'https://duckduckgo.com/?q=javascript+promises&ad=1': duckduckgoAd('javascript promises', JS_RESULTS),
    'https://duckduckgo.com/?q=javascript+promises&more=1': duckduckgo('javascript promises', JS_RESULTS, false, JS_MORE),
    'https://duckduckgo.com/?q=javascript+promises&iax=videos&ia=videos': duckduckgo('javascript promises', JS_RESULTS, false, [], { tab: 'videos' }),
    'https://duckduckgo.com/?q=javascript+promises&iax=images&ia=images': duckduckgo('javascript promises', JS_RESULTS, false, [], { tab: 'images' }),
    'https://duckduckgo.com/?q=javascript+promises&iax=images&ia=images&rows=1': duckduckgo('javascript promises', JS_RESULTS, false, [], { tab: 'images', rows: true }),
    ...Object.fromEntries(ENGINE_TABS.map(([url, engine, tab]) => [url, engineTab(engine, tab, JS_RESULTS)])),
    'https://duckduckgo.com/?q=javascript+promises&wide=1': duckduckgo('javascript promises', JS_RESULTS, false, [], { wide: true }),
    // As on the live page, each result's words start inside its padded box.
    'https://duckduckgo.com/?q=javascript+promises&padded=1&dark=1': duckduckgo('javascript promises', JS_RESULTS, true, [], { padded: true }),
    'https://duckduckgo.com/?q=javascript+promises&unseen=1': duckduckgo('javascript promises', JS_RESULTS, false, [], { unseen: true }),
    'https://html.duckduckgo.com/html/?q=javascript+promises': duckduckgoHtml('javascript promises', JS_RESULTS),
    'https://lite.duckduckgo.com/lite/?q=javascript+promises': duckduckgoLite('javascript promises', JS_RESULTS),
  };
}

async function launch(settings = {}, ext = EXT) {
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'anubis-')), {
    executablePath,
    headless: true,
    // ANUBIS_LANG=de runs the browser, and so Anubis, in a translation; checks that
    // read English text then fail, but layout checks such as `responsive` still hold.
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, ...proxyTrustArgs(), ...(process.env.ANUBIS_LANG ? [`--lang=${process.env.ANUBIS_LANG}`] : [])],
    ...(process.env.ANUBIS_LANG && { locale: process.env.ANUBIS_LANG.replace('_', '-') }),
    viewport: { width: 1180, height: 1000 },
    // Sharper screenshots for the documentation site.
    deviceScaleFactor: only === 'docs' ? 2 : 1,
    // Behind a proxy (as in CI sandboxes), real list downloads need it too.
    ...(process.env.HTTPS_PROXY && { proxy: { server: process.env.HTTPS_PROXY } }),
  });
  // Lists this repository publishes (and its directory) come from the checkout, so a
  // run tests this branch's lists, not what main has, and doesn't wait on GitHub.
  await ctx.route(/^https:\/\/raw\.githubusercontent\.com\/Bishop-V\/anubis\/main\/lists\/([\w./-]+)$/, (route) => {
    const path = /\/lists\/(.+)$/.exec(route.request().url())[1];
    const file = fileURLToPath(new URL(`../lists/${path}`, import.meta.url));
    if (path.includes('..') || !existsSync(file)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ contentType: 'text/plain; charset=utf-8', body: readFileSync(file, 'utf8') });
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const extId = new URL(sw.url()).host;
  await waitForWorker(sw, () => typeof chrome !== 'undefined' && !!chrome.storage, 'Extension storage API did not become ready');
  await waitForWorker(sw, async () => !!(await chrome.storage.sync.get('personal')).personal, 'Extension personal-list migration did not finish');
  // On install the extension moves a stored "Collapse" to "Remove" once. Writing the
  // settings below while that runs can land between its reads, so the tests would
  // run with "Remove": wait until it has set its flag.
  await waitForWorker(sw, async () => (await chrome.storage.sync.get('hideStyleMoved')).hideStyleMoved === true, 'Extension settings migration did not finish');
  // Then it subscribes saved subscriptions to every default list, once: wait for that too.
  await waitForWorker(sw, async () => (await chrome.storage.sync.get('defaultListsAdded')).defaultListsAdded === true, 'Extension default-lists migration did not finish');
  await sw.evaluate(
    async ({ personal, settings }) => {
      await chrome.storage.sync.set({
        'personal.0': personal,
        personal: { chunks: 1, updatedAt: Date.now() },
        tagPrefs: { 'ai-slop': { action: 'hide' } },
        // The tests use the "Collapse" style; keep the one-time move to "Remove" away.
        hideStyleMoved: true,
        settings: { enabled: true, theme: 'auto', hideStyle: 'collapse', rerank: true, showChips: true, showSummary: true, engines: {}, updateHours: 24, deeper: 0, ...settings },
      });
    },
    { personal: PERSONAL, settings },
  );
  const pages = mockPages();
  await ctx.route(/^https:\/\/((noai\.|html\.|lite\.)?duckduckgo\.com|www\.google\.com|www\.bing\.com|search\.brave\.com|www\.ecosia\.org|search\.yahoo\.com|kagi\.com|www\.startpage\.com|yandex\.com)\//, (route) => {
    const page = pages[route.request().url()];
    return answerRoute(route, typeof page === 'function' ? page(route.request()) : page);
  });
  // Ecosia's favicon service: a one-pixel picture for any site.
  await ctx.route('https://api.ecosia.org/**', (route) =>
    route.fulfill({ contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') }),
  );
  return { ctx, extId };
}

/** Answer a mock page's route: a page's markup, `{ status, body }`, or nothing (204). */
function answerRoute(route, answer) {
  const { status = 200, body } = typeof answer === 'string' ? { body: answer } : (answer ?? {});
  return body ? route.fulfill({ status, contentType: 'text/html; charset=utf-8', body }) : route.fulfill({ status: 204, body: '' });
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

function assertChecks(label, checks) {
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length) throw new Error(`${label}: failed checks: ${failed.join(', ')}`);
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

// Presses the first tag under a result whose name starts with `label` (the button also names its effect, if any).
async function pressChip(label) {
  const name = (await axTree()).find((n) => n.role === 'button' && n.name.startsWith(label))?.name;
  const hosts = await page.locator('anubis-chips').count();
  for (let i = 0; i < hosts; i++) {
    try {
      return await clickShadowButton('anubis-chips', name, i);
    } catch {}
  }
}

async function hasInHost(cdp, hostId, selector) {
  const { node: host } = await cdp.send('DOM.describeNode', { nodeId: hostId, depth: -1, pierce: true });
  const shadow = host.shadowRoots?.[0];
  if (!shadow) return false;
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: shadow.nodeId, selector });
  return !!nodeId;
}

const hasChipInHost = (cdp, hostId, level) => hasInHost(cdp, hostId, `.verdict.${level}`);

async function hasResultChip(cdp, resultId, level) {
  const { nodeId: hostId } = await cdp.send('DOM.querySelector', { nodeId: resultId, selector: 'anubis-chips' });
  return hostId ? hasChipInHost(cdp, hostId, level) : false;
}

// The colour of a result's button, at rest and pointed at, read from inside its closed shadow
// root with the DevTools protocol.
async function weighColors(page, selector) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeId: hostId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!hostId) throw new Error(`No weigh host matches ${selector}`);
  const { node: host } = await cdp.send('DOM.describeNode', { nodeId: hostId, depth: -1, pierce: true });
  const { nodeId: buttonId } = await cdp.send('DOM.querySelector', { nodeId: host.shadowRoots[0].nodeId, selector: 'button.weigh' });
  if (!buttonId) throw new Error(`No button inside ${selector}`);
  const color = async () =>
    (await cdp.send('CSS.getComputedStyleForNode', { nodeId: buttonId })).computedStyle.find((item) => item.name === 'color')?.value;
  const rest = await color();
  const { model } = await cdp.send('DOM.getBoxModel', { nodeId: buttonId });
  const [x1, y1, , , x3, y3] = model.content;
  await page.mouse.move((x1 + x3) / 2, (y1 + y3) / 2);
  await page.waitForTimeout(250);
  const hover = await color();
  await page.mouse.move(1, 1);
  await cdp.detach();
  return { rest, hover };
}

/** Whether a computed colour is a grey: its red, green, and blue close together. */
const isGrey = (color) => {
  const [r, g, b] = (color.match(/[\d.]+/g) ?? []).map(Number);
  return Math.max(r, g, b) - Math.min(r, g, b) <= 12;
};

/** Press a result's menu button, in the column on its left or on a card. */
async function pressWeigh(host) {
  const box = await host.boundingBox();
  await host.click({ position: { x: 12, y: box.height / 2 } });
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

  await shoot('https://html.duckduckgo.com/html/?q=javascript+promises', 'ddg-html');
  await shoot('https://lite.duckduckgo.com/lite/?q=javascript+promises', 'ddg-lite');
}

// The button on each desktop result (column.ts): in a column on the result's left, inside
// the window, level with its first row, and over no text. In a table (DuckDuckGo Lite), after the title.
if (!only || only === 'pages' || only === 'column' || checks) {
  const COLUMN_PAGES = [
    'https://duckduckgo.com/?q=javascript+promises',
    'https://duckduckgo.com/?q=javascript+promises&dark=1',
    'https://duckduckgo.com/?q=javascript+promises&wide=1',
    'https://duckduckgo.com/?q=javascript+promises&padded=1&dark=1',
    'https://www.google.com/search?q=anubis',
    'https://www.bing.com/search?q=javascript+promises',
    'https://search.brave.com/search?q=anubis',
    'https://www.ecosia.org/search?q=javascript+promises',
    'https://search.yahoo.com/search?p=javascript+promises',
    'https://html.duckduckgo.com/html/?q=javascript+promises',
  ];
  for (const url of COLUMN_PAGES) {
    await page.goto(url);
    // Ecosia builds its page in the browser first.
    await page.waitForTimeout(url.includes('ecosia') ? 3500 : 700);
    const found = await page.evaluate(() => {
      // Where a result's words or site icon start.
      const startOf = (result) => {
        const lefts = [...result.querySelectorAll('img, svg, [class*="icon" i], .tpic')].map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.width <= 40).map((r) => r.left);
        const walker = document.createTreeWalker(result, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent.trim()) continue;
          range.selectNodeContents(node);
          lefts.push(...[...range.getClientRects()].filter((r) => r.width).map((r) => r.left));
        }
        return Math.min(...lefts);
      };
      const results = [...document.querySelectorAll('[data-anubis-result]')].filter((r) => r.getBoundingClientRect().height);
      const out = { results: results.length, inColumn: 0, notInColumn: [], outside: [], overText: [], notLevel: [], offGap: [], offIcon: [], lefts: [] };
      for (const result of results) {
        const host = result.querySelector(':scope > anubis-weigh');
        const site = result.querySelector('a[href]')?.href ?? '';
        if (host?.dataset.shape !== 'column') {
          out.notInColumn.push(site);
          continue;
        }
        out.inColumn++;
        const h = host.getBoundingClientRect();
        const box = result.getBoundingClientRect();
        out.lefts.push(Math.round(h.left));
        if (h.left < 0 || h.right > box.left + 12) out.outside.push(site);
        // 12px from where the result's words or icon start, its box's padding aside.
        const start = startOf(result);
        if (!result.matches('[data-anubis-state~="hide"]') && Math.abs(start - h.right - 12) > 1) out.offGap.push(`${site} ${Math.round(start - h.right)}`);
        // Only what's in view can be pointed at.
        const at = h.top >= 0 && h.bottom <= innerHeight ? document.elementFromPoint(h.left + h.width / 2, h.top + h.height / 2) : host;
        if (at !== host) out.overText.push(`${site} → ${at?.tagName}.${at?.className}`);
        // Centred on the site's icon, where it has one: its name and address can be taller or shorter than it.
        const icon = [...result.querySelectorAll('.favicon, .tpic')].map((el) => el.getBoundingClientRect()).find((r) => r.width >= 10 && r.width <= 40);
        if (icon && icon.height && !result.matches('[data-anubis-state~="hide"]') && Math.abs((icon.top + icon.bottom) / 2 - (h.top + h.bottom) / 2) > 1) out.offIcon.push(`${site} ${Math.round((h.top + h.bottom - icon.top - icon.bottom) / 2)}`);
        // Within the result's first 80 pixels: on its first row, not halfway down it.
        if (h.top < box.top - 8 || h.bottom > box.top + 80) out.notLevel.push(site);
      }
      return out;
    });
    console.log(`== column on ${url}:`, JSON.stringify(found));
    assertChecks(`the column on ${url}`, {
      everyResultInTheColumn: found.results > 0 && found.inColumn === found.results,
      insideTheWindow: found.outside.length === 0,
      overNothingElse: found.overText.length === 0,
      levelWithTheFirstRow: found.notLevel.length === 0,
      twelvePixelsFromTheResult: found.offGap.length === 0,
      levelWithTheIcon: found.offIcon.length === 0,
      // Hidden results' lines included: one straight column.
      oneColumn: Math.max(...found.lefts) - Math.min(...found.lefts) <= 1,
    });
  }
  // A window too narrow for the column: the button goes back in the result's corner.
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(700);
  const narrow = await page.evaluate(() =>
    [...document.querySelectorAll('[data-anubis-result] > anubis-weigh')].map((host) => [host.dataset.shape, host.getBoundingClientRect().left >= 0]),
  );
  await page.setViewportSize({ width: 1180, height: 1000 });
  console.log('== column in a narrow window:', JSON.stringify(narrow));
  assertChecks('the column in a narrow window', { inTheWindow: narrow.length > 0 && narrow.every(([, inside]) => inside) });
  // A menu that closes by a style change adds or removes no nodes, so no pass runs
  // after it: nothing a pass set while it was open may outlast it.
  await page.goto('https://duckduckgo.com/?q=javascript+promises&dark=1');
  await page.waitForTimeout(600);
  const afterMenu = await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));
    const li = document.querySelector('li[data-anubis-result]:not([data-anubis-state~="hide"])');
    const host = li.querySelector(':scope > anubis-weigh');
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    menu.style.cssText = 'position:absolute;top:0;right:0;width:220px;height:120px;z-index:1;background:#333';
    li.querySelector('article').append(menu);
    await frame();
    menu.style.display = 'none';
    await frame();
    const r = host.getBoundingClientRect();
    const shown = getComputedStyle(host).visibility === 'visible' && document.elementFromPoint(r.left + 12, r.top + r.height / 2) === host;
    menu.remove();
    return shown;
  });
  assertChecks('ddg closed menu', { buttonShows: afterMenu });
  const first = page.locator('li[data-anubis-result]').first();
  const buttonBox = await first.locator('anubis-weigh').boundingBox();
  await page.mouse.move(buttonBox.x + 12, buttonBox.y + buttonBox.height / 2);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}ddg-column.png`, clip: { x: buttonBox.x - 10, y: buttonBox.y - 10, width: 400, height: 80 } });
}

// The button is drawn in greys: no gold at rest or when pointed at.
if (!only || only === 'ddg-colors' || checks) {
  for (const [mode, query] of [['light', ''], ['dark', '&dark=1']]) {
    await page.goto(`https://duckduckgo.com/?q=javascript+promises${query}`);
    await page.waitForTimeout(700);
    const selector = 'li[data-anubis-result]:not([data-anubis-state~="pin"]):not([data-anubis-state~="hide"]) > anubis-weigh';
    const colors = await weighColors(page, selector);
    console.log(`\n== DuckDuckGo ${mode} button colors:`, JSON.stringify(colors));
    assertChecks(`DuckDuckGo ${mode} button`, { greyAtRest: isGrey(colors.rest), greyPointedAt: isGrey(colors.hover) });
  }
}

if (!only || only === 'hostile' || checks) {
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
      hideStyle: document.documentElement.dataset.anubisHide,
    };
  });
  console.log('\n== hostile google:', JSON.stringify(check));
  await page.screenshot({ path: `${SHOTS}google-hostile.png`, fullPage: true });
  assertChecks('hostile google', {
    // Hidden results keep their button only in "Collapse", the style the tests set.
    collapseStyleInEffect: check.hideStyle === 'collapse',
    resultsFound: check.results >= ANUBIS_RESULTS.length,
    everyResultHasVisibleWeighButton: check.weighVisible === check.results,
    chipsRemainUpright: check.chipsUpright.length > 0 && check.chipsUpright.every(Boolean),
    summaryBeforeResults: check.summaryBeforeFirstResult,
  });
}

if (!only || only === 'grouped' || checks) {
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
  assertChecks('grouped google', {
    allExpectedResultsFound: check.results === ANUBIS_RESULTS.length,
    sitelinksStayWithFirstResult: check.sitelinksInFirstResult,
    resultsUseWholeContainers: check.containersAreResults,
    summaryIsInResultsColumn: check.summaryInList,
    summaryPrecedesFirstResult: check.summaryBeforeFirstResult,
  });

  // Opaque /goto links everywhere, and a Reddit thread and a LinkedIn page with no
  // address shown: the site's name stands in for it. The first result's sitelinks,
  // also /goto with no address, stay part of it.
  await page.goto('https://www.google.com/search?q=anubis&forum=1');
  await page.waitForTimeout(700);
  const forumCheck = await page.evaluate(() => {
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
  });
  console.log('== google forum result:', JSON.stringify(forumCheck));
  if (checks) {
    assertChecks('google forum results', {
      redditRecognized: forumCheck.redditFound,
      linkedinRecognized: forumCheck.linkedinFound,
      redditHasWeighButton: forumCheck.redditButton,
      redditHasTags: forumCheck.redditTagged,
    });
  }
}

if (!only || only === 'reveal' || checks) {
  // Showing one hidden result has to survive the page changing afterwards: engines
  // rewrite parts of the page on hover, which runs another pass.
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForSelector('anubis-bar');
  await page.waitForTimeout(300);
  const hidden = page.locator('[data-anubis-result]', { hasText: 'Mythology Wiki' });
  await clickShadowButton('anubis-bar', 'Show');
  await page.waitForTimeout(200);
  const afterClick = await hidden.evaluate((el) => el.hasAttribute('data-anubis-reveal'));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-anubis-state~="hide"][data-anubis-reveal]' });
  const hiddenChip = nodeId ? await hasResultChip(cdp, nodeId, 'hide') : false;
  await cdp.detach();
  await page.evaluate(() => document.body.append(document.createElement('div')));
  await page.mouse.move(300, 300);
  await page.mouse.move(320, 340);
  await page.waitForTimeout(300);
  const afterChange = await hidden.evaluate((el) => el.hasAttribute('data-anubis-reveal'));
  console.log('\n== reveal one result:', JSON.stringify({ afterClick, afterChange, hiddenChip }));
  assertChecks('reveal hidden result', { revealsAfterClick: afterClick, staysRevealedAfterPageChange: afterChange, noRedundantHiddenChip: !hiddenChip });

  // Show hidden is for the search it was pressed on. Google and DuckDuckGo start a
  // new search without loading a page, which has to hide those results again.
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForSelector('anubis-summary');
  await page.waitForTimeout(300);
  await clickShadowButton('anubis-summary', 'Show hidden');
  await page.waitForTimeout(200);
  const revealedAll = await page.evaluate(() => document.querySelectorAll('[data-anubis-result][data-anubis-reveal]').length);
  await page.evaluate(() => {
    history.pushState(null, '', '/search?q=anubis+gods');
    document.body.append(document.createElement('div'));
  });
  await page.waitForTimeout(300);
  const revealedAfterSearch = await page.evaluate(() => document.querySelectorAll('[data-anubis-result][data-anubis-reveal]').length);
  console.log('\n== show hidden, then a new search in the page:', JSON.stringify({ revealedAll, revealedAfterSearch }));
  assertChecks('show hidden ends with the search', { revealsAll: revealedAll > 0, hidesAgainOnNewSearch: revealedAfterSearch === 0 });
}

if (!only || checks) {
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForSelector('anubis-summary');
  const lifecycleResult = 'https://lifecycle-example.test/';
  await page.evaluate((href) => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    const row = document.createElement('div');
    row.className = 'MjjYud';
    const content = document.createElement('div');
    const link = document.createElement('a');
    link.href = href;
    const title = document.createElement('h3');
    title.textContent = 'Lifecycle restoration test';
    link.append(title);
    const address = document.createElement('cite');
    address.textContent = 'lifecycle-example.test';
    content.append(link, address);
    row.append(content);
    document.querySelector('#rso').append(row);
  }, lifecycleResult);
  await page.waitForTimeout(100);
  const beforeRestore = await page.locator(`a[href="${lifecycleResult}"]`).evaluate((link) => !!link.closest('[data-anubis-result]'));
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await page.waitForFunction((href) => {
    const link = [...document.querySelectorAll('a[href]')].find((a) => a.href === href);
    return link?.closest('[data-anubis-result]');
  }, lifecycleResult);
  const restored = await page.locator(`a[href="${lifecycleResult}"]`).evaluate((link) => !!link.closest('[data-anubis-result]'));
  console.log('\n== back-forward cache resume:', JSON.stringify({ beforeRestore, restored }));
  assertChecks('resume after back-forward cache', { pausesWhileHidden: !beforeRestore, processesChangesOnRestore: restored });
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

if (!only || only === 'mobile' || checks) {
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

  // On a phone the summary says it in a few words, and Details shows the rest: the
  // full sentence and the tags. Which parts show is read from the closed shadow root
  // through the DevTools protocol: a part that isn't shown has no box.
  const summaryLook = async () => {
    const cdp = await ctx.newCDPSession(phone);
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    const all = (node) => [node, ...[...(node.children ?? []), ...(node.shadowRoots ?? [])].flatMap(all)];
    const host = all(root).find((n) => n.localName === 'anubis-summary');
    const nodes = host ? all(host) : [];
    const classes = (n) => {
      const attrs = n.attributes ?? [];
      const i = attrs.indexOf('class');
      return i >= 0 && i % 2 === 0 ? attrs[i + 1].split(' ') : [];
    };
    const textOf = (n) => (n.nodeType === 3 ? n.nodeValue : (n.children ?? []).map(textOf).join(''));
    const box = async (n) => {
      try {
        const { model } = await cdp.send('DOM.getBoxModel', { nodeId: n.nodeId });
        return model.content;
      } catch {
        return undefined;
      }
    };
    const look = {};
    for (const part of ['short', 'long', 'details']) {
      const n = nodes.find((node) => classes(node).includes(part));
      look[part] = n ? !!(await box(n)) : null;
      if (part === 'details' && n) {
        look.detailsText = textOf(n).trim();
        const content = await box(n);
        look.detailsAt = content && [(content[0] + content[4]) / 2, (content[1] + content[5]) / 2];
      }
    }
    // What shows lines up with the sentence or follows its words: nothing is left on a
    // line of its own under the mark (Fewer details once was).
    let sentenceLeft = Infinity;
    look.sentence = '';
    for (const n of nodes.filter((node) => classes(node).includes('sentence'))) {
      const content = await box(n);
      if (content) sentenceLeft = Math.min(sentenceLeft, content[0]);
      if (content) look.sentence = textOf(n).trim();
    }
    look.underMark = [];
    for (const n of nodes.filter((node) => node.nodeName === 'BUTTON' || classes(node).includes('change'))) {
      const content = await box(n);
      if (content && content[0] < sentenceLeft - 1) look.underMark.push(textOf(n).trim() || classes(n).join(' '));
    }
    await cdp.detach();
    return look;
  };
  // Changes made by earlier parts can still be reaching the page, and each one
  // rewrites the summary: read it once it has said the same thing three times running.
  let folded = await summaryLook();
  for (let same = 1, tries = 0; same < 3 && tries < 20; tries++) {
    await phone.waitForTimeout(250);
    const again = await summaryLook();
    same = again.sentence === folded.sentence ? same + 1 : 1;
    folded = again;
  }
  await phone.screenshot({ path: `${SHOTS}google-mobile-summary.png` });
  if (folded.detailsAt) await phone.mouse.click(...folded.detailsAt);
  await phone.waitForTimeout(200);
  const opened = await summaryLook();
  await phone.screenshot({ path: `${SHOTS}google-mobile-details.png` });
  await phone.setViewportSize({ width: 1280, height: 900 });
  await phone.waitForTimeout(200);
  const wide = await summaryLook();
  console.log('\n== google mobile summary:', JSON.stringify({ folded, opened, wide }));

  assertChecks('google mobile', {
    allExpectedResultsFound: check.results === ANUBIS_RESULTS.length,
    newsCardsNotTreatedAsResults: check.newsCardsAsResults === 0,
    everyResultHasWeighButton: check.weighButtons === check.results,
    namedRedirectGetsTagged: check.gotoLinkTagged === 'normal tagged',
    summaryRendered: check.summary,
    noHorizontalOverflow: !check.scrollsSideways,
    phoneSummaryIsShort: folded.short === true && folded.long === false && folded.details === true && folded.detailsText === 'Details',
    detailsShowsFullSentence: opened.short === false && opened.long === true && opened.detailsText === 'Fewer details',
    phoneNothingUnderMark: folded.underMark.length === 0 && opened.underMark.length === 0,
    wideSummaryIsFull: wide.long === true && wide.short === false && wide.details === false,
  });

  // Every engine's phone layout: each result gets a ⚖ button that sits clear of the
  // engine's own controls (Google's ⋮ once lay under it) and of the title's words, and
  // the result menu opens as a sheet along the bottom of the screen.
  await phone.setViewportSize({ width: 412, height: 915 });
  const phonePage = async (url) => {
    await phone.goto(url);
    await phone.waitForTimeout(700);
    return phone.evaluate(() => {
      const overlaps = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
      const results = [...document.querySelectorAll('[data-anubis-result]')];
      const buttons = results.map((r) => r.querySelector(':scope > anubis-weigh')).filter(Boolean);
      const clash = buttons.filter((host) => {
        const b = host.getBoundingClientRect();
        const result = host.parentElement;
        const controls = [...result.querySelectorAll('button, [role="button"], svg')].filter((el) => !el.closest('anubis-weigh, anubis-chips'));
        const range = document.createRange();
        const words = [...result.querySelectorAll('h2, h3, [role="heading"]')].flatMap((t) => {
          range.selectNodeContents(t);
          return [...range.getClientRects()];
        });
        return [...controls.map((el) => el.getBoundingClientRect()), ...words].some((r) => r.width && overlaps(b, r));
      });
      // The first line of a result's title: its first piece of text, not a box inside it.
      const firstLine = (result) => {
        const title = result.querySelector('h2, h3, [role="heading"]');
        const walker = title && document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let node = walker?.nextNode(); node; node = walker.nextNode()) {
          range.selectNodeContents(node);
          const r = [...range.getClientRects()].find((x) => x.width);
          if (r) return r;
        }
        return undefined;
      };
      // Each ⚖ is centred on its title's first line, and each row of tags starts where the title's words do.
      const offLine = buttons.filter((host) => {
        const line = firstLine(host.parentElement);
        const b = host.getBoundingClientRect();
        const centre = (b.top + b.bottom) / 2;
        return line && line.height < 60 && b.width && (centre < line.top - 1 || centre > line.bottom + 1) && b.top > line.bottom - 60;
      });
      // In a column with the engine's ⋮ (its dots, not its box), or else at the end of the title's line.
      const outOfLine = buttons.filter((host) => {
        const b = host.getBoundingClientRect();
        const result = host.parentElement;
        if (!b.width || !firstLine(result)) return false;
        const dots = result.querySelector('[role="button"] svg, button.menu');
        if (dots) {
          const d = dots.getBoundingClientRect();
          return Math.abs((b.left + b.right) / 2 - (d.left + d.right) / 2) > 1;
        }
        return Math.abs(b.right - result.querySelector('h2, h3, [role="heading"]').getBoundingClientRect().right) > 1;
      });
      const tagsOff = results.filter((r) => {
        const chips = r.querySelector('anubis-chips');
        const line = firstLine(r);
        return chips && line && Math.abs(chips.getBoundingClientRect().left - line.left) > 2;
      });
      return {
        results: results.length,
        weighButtons: buttons.length,
        clash: clash.length,
        offLine: offLine.length,
        outOfLine: outOfLine.length,
        // A pinned frame on a result's own edge keeps the result's corners (Google's phone cards
        // are square), and is a 2px border drawn over the result, not an outline its own
        // background can cover (DuckDuckGo showed only the bottom edge of one).
        insideFrame: (() => {
          const r = results.find((el) => el.hasAttribute('data-anubis-frame-inside'));
          if (!r) return null;
          const own = getComputedStyle(r).borderTopLeftRadius;
          const state = r.getAttribute('data-anubis-state');
          r.setAttribute('data-anubis-state', 'pin');
          const cs = getComputedStyle(r);
          const after = getComputedStyle(r, '::after');
          const look = { rounded: own !== cs.borderTopLeftRadius, outline: cs.outlineStyle, border: after.borderTopWidth, over: after.zIndex };
          r.setAttribute('data-anubis-state', state);
          return look;
        })(),
        tagsOff: tagsOff.length,
        tagged: results.filter((r) => r.querySelector('anubis-chips')).length,
        // Where a result reaches the window's edges, a pinned frame is drawn on its own edge, not cut off outside it.
        frameMisplaced: results.filter((r) => {
          const b = r.getBoundingClientRect();
          return b.width && r.querySelector(':scope > anubis-weigh') && (b.left < 8 || b.right > innerWidth - 8) !== r.hasAttribute('data-anubis-frame-inside');
        }).length,
        summary: !!document.querySelector('anubis-summary'),
        scrollsSideways: document.documentElement.scrollWidth > innerWidth,
        // What sticks out past the screen's edge, to say where to look when it does.
        sticksOut: [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 3)
          .map((el) => `${el.localName}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}`),
      };
    });
  };
  const sheet = async (name) => {
    await phone.locator('[data-anubis-result]:not([data-anubis-state~="hide"]) > anubis-weigh').first().click();
    await phone.waitForTimeout(250);
    const open = await phone.evaluate(() => {
      const pop = document.querySelector('anubis-popover');
      if (!pop) return null;
      const r = pop.getBoundingClientRect();
      return { fixed: getComputedStyle(pop).position === 'fixed', left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), width: innerWidth, height: innerHeight };
    });
    if (open) await phone.screenshot({ path: `${SHOTS}${name}-mobile-sheet.png` });
    // The sheet leaves most of the page in view: it's in a closed shadow root, so its height
    // is read through the DevTools protocol.
    if (open) {
      const cdp = await ctx.newCDPSession(phone);
      const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
      const all = (node) => [node, ...[...(node.children ?? []), ...(node.shadowRoots ?? [])].flatMap(all)];
      const pop = all(root).find((n) => n.localName === 'div' && (n.attributes ?? []).join(' ').includes('pop'));
      const { model } = await cdp.send('DOM.getBoxModel', { nodeId: pop.nodeId });
      open.sheetHeight = Math.round(model.border[5] - model.border[1]);
      await cdp.detach();
    }
    // A tap on the page above the sheet closes it.
    await phone.mouse.click(200, 40);
    await phone.waitForTimeout(200);
    const closed = await phone.evaluate(() => !document.querySelector('anubis-popover'));
    return { open, closed };
  };
  const along = (s) => !!s.open && s.open.fixed && s.open.left === 0 && s.open.right === s.open.width && s.open.bottom === s.open.height && s.closed && s.open.sheetHeight <= s.open.height * 0.6 + 1;
  const phoneFailures = [];
  for (const [name, url, count] of [
    ['google', 'https://www.google.com/search?q=anubis&mobile=1', ANUBIS_RESULTS.length],
    ['duckduckgo', 'https://duckduckgo.com/?q=javascript+promises&mobile=1', JS_RESULTS.length],
    ['bing', 'https://www.bing.com/search?q=javascript+promises&mobile=1', JS_RESULTS.length],
  ]) {
    const found = await phonePage(url);
    await report(phone, `${name}-mobile`);
    await phone.screenshot({ path: `${SHOTS}${name}-mobile-phone.png`, fullPage: true });
    const menu = found.weighButtons ? await sheet(name) : { open: null, closed: false };
    console.log(`\n== ${name} phone:`, JSON.stringify({ found, menu }));
    try {
      assertChecks(`${name} phone`, {
        allExpectedResultsFound: found.results === count,
        everyResultHasWeighButton: found.weighButtons === found.results,
        weighButtonsClearOfControlsAndTitles: found.clash === 0,
        weighButtonsOnTitlesFirstLine: found.offLine === 0,
        weighButtonsInLineWithMenuOrTitle: found.outOfLine === 0,
        insideFrameKeepsResultsCorners: !found.insideFrame?.rounded,
        insideFrameIsTwoPixelsOverTheResult: !found.insideFrame || (found.insideFrame.outline === 'none' && found.insideFrame.border === '2px' && Number(found.insideFrame.over) > 0),
        tagsStartWithTitles: found.tagged > 0 && found.tagsOff === 0,
        pinnedFrameFitsTheWindow: found.frameMisplaced === 0,
        summaryRendered: found.summary,
        noHorizontalOverflow: !found.scrollsSideways,
        menuIsSheetAlongTheBottom: along(menu),
      });
    } catch (e) {
      phoneFailures.push(e.message);
    }
  }
  if (phoneFailures.length) throw new Error(phoneFailures.join('; '));
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

if (!only || only === 'palette') {
  // Plain colours: every host and the page say so, and the pinned frame takes the page's text colour.
  const [sw] = ctx.serviceWorkers();
  const setPalette = (palette) =>
    sw.evaluate(async (palette) => {
      const { settings } = await chrome.storage.sync.get('settings');
      await chrome.storage.sync.set({ settings: { ...settings, palette } });
    }, palette);
  const look = () =>
    page.evaluate(() => {
      const hosts = [...document.querySelectorAll('anubis-chips, anubis-weigh, anubis-bar, anubis-summary')];
      const pinned = document.querySelector('[data-anubis-state~="pin"]');
      return {
        page: document.documentElement.dataset.anubisPalette,
        hosts: [...new Set(hosts.map((el) => el.dataset.palette))],
        pinFrame: pinned ? getComputedStyle(pinned).outlineColor : null,
      };
    });
  for (const palette of ['plain', 'gold']) {
    await setPalette(palette);
    await page.goto('https://duckduckgo.com/?q=javascript+promises');
    await page.waitForTimeout(600);
    console.log(`\n== palette ${palette}:`, JSON.stringify(await look()));
    await page.screenshot({ path: `${SHOTS}palette-${palette}.png`, fullPage: true });
  }
}

if (!only || only === 'cleanup' || checks) {
  // Clean-up: AI Overview, videos, and "People also ask" go; the side panel stays.
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
  const activeBadge = () =>
    sw.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab ? chrome.action.getBadgeText({ tabId: tab.id }) : '';
    });
  const activeStats = () =>
    sw.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab ? chrome.tabs.sendMessage(tab.id, { type: 'get-page-stats' }).catch(() => undefined) : undefined;
    });
  const all = { ai: true, videos: true, questions: true, news: true, images: true, related: true, elsewhere: true, adRequests: true };
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
  const cleanupShown = await shown();
  const cleanupRemoved = (await statsNow())?.removed ?? {};
  console.log('\n== clean-up on:', JSON.stringify(cleanupShown));
  console.log('   removed:', JSON.stringify(cleanupRemoved));
  await page.screenshot({ path: `${SHOTS}google-cleanup.png`, fullPage: true });
  if (checks) {
    assertChecks('Google cleanup selectors', {
      removesAiOverview: !cleanupShown.aiOverview && cleanupRemoved.ai === 1,
      removesVideos: !cleanupShown.videos && cleanupRemoved.videos === 1,
      removesPeopleAlsoAsk: !cleanupShown.peopleAlsoAsk && cleanupRemoved.questions === 1,
      keepsSidePanel: cleanupShown.sidePanel,
      preservesExpectedResults: cleanupShown.results === ANUBIS_RESULTS.length,
    });
  }
  await clickShadowButton('anubis-summary', 'Show hidden');
  await page.waitForTimeout(300);
  const cleanupRestored = await shown();
  console.log('== after Show hidden:', JSON.stringify(cleanupRestored));
  if (checks) assertChecks('restore cleaned-up blocks', { restoresAiOverview: cleanupRestored.aiOverview, restoresVideos: cleanupRestored.videos });

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
    if (checks) {
      assertChecks(`video panel ${layout}`, {
        removesPanelHeader: !check.header,
        removesVideoCards: !check.videos,
        removesViewAll: !check.viewAll,
        keepsSummaryAtTop: check.summaryOnTop,
      });
    }
  }

  // DuckDuckGo stays where it is, with your settings: the AI answer goes, and so do
  // the Duck.ai tab and button, which aren't counted. So does the "Videos for" panel.
  await page.goto('https://duckduckgo.com/?q=javascript+promises&ai=1');
  await page.waitForTimeout(800);
  const duckduckgoCleanup = await page.evaluate(() => {
        const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
        return {
          host: location.hostname,
          answer: visible(document.querySelector('[data-testid="duckassist-answer-content"]')),
          videos: visible(document.querySelector('.ddg-videos .vmodule')),
          duckAiTab: visible(document.querySelector('.tabs .chat')),
          duckAiButton: visible(document.querySelector('.ask')),
          otherTabs: [...document.querySelectorAll('.tabs span')].filter(visible).length,
          results: [...document.querySelectorAll('[data-anubis-result]')].filter(visible).length,
        };
      });
  console.log('== DuckDuckGo with AI answers removed:', JSON.stringify(duckduckgoCleanup));
  if (checks) {
    assertChecks('DuckDuckGo cleanup selectors', {
      removesAnswer: !duckduckgoCleanup.answer,
      removesVideosFor: !duckduckgoCleanup.videos,
      keepsResults: duckduckgoCleanup.results > 0,
      removesDuckAiTab: !duckduckgoCleanup.duckAiTab,
      removesDuckAiButton: !duckduckgoCleanup.duckAiButton,
      keepsOtherTabs: duckduckgoCleanup.otherTabs > 0,
    });
  }
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
  const braveCleanup = await visibleIn({ ai: '#llm-snippet', videos: '.cluster-videos', discussions: '.cluster-discussions', relatedQueries: '.related-queries', elsewhere: '.find-elsewhere', videosTab: '.tabs a[href^="/videos"]' });
  console.log('== Brave panels:', JSON.stringify(braveCleanup));
  // A thumbnail in a result's corner: the buttons stay in one column, clear of it.
  const braveButtons = await page.evaluate(() => {
    const thumb = document.querySelector('.thumb img')?.getBoundingClientRect();
    const boxes = [...document.querySelectorAll('anubis-weigh')].map((el) => el.getBoundingClientRect()).filter((r) => r.width);
    return {
      buttons: boxes.length,
      lefts: [...new Set(boxes.map((r) => Math.round(r.left)))],
      clearOfThumb: !!thumb && boxes.every((r) => r.right <= thumb.left || r.left >= thumb.right || r.bottom <= thumb.top || r.top >= thumb.bottom),
    };
  });
  console.log('   buttons beside a thumbnail:', JSON.stringify(braveButtons));
  await page.screenshot({ path: `${SHOTS}brave-thumbnail.png`, clip: { x: 0, y: 80, width: 1000, height: 520 } });
  if (checks) {
    assertChecks('Brave cleanup selectors', {
      removesAiAnswer: !braveCleanup.ai,
      removesVideos: !braveCleanup.videos,
      removesDiscussions: !braveCleanup.discussions,
      removesRelatedQueries: !braveCleanup.relatedQueries,
      removesFindElsewhere: !braveCleanup.elsewhere,
      buttonsInOneColumn: braveButtons.buttons > 0 && Math.max(...braveButtons.lefts) - Math.min(...braveButtons.lefts) <= 2,
      buttonsClearOfThumbnail: braveButtons.clearOfThumb,
      keepsVideosTab: braveCleanup.videosTab,
    });
  }
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));
  // Bing: a picture in a result's corner leaves the button in the column the others are in.
  await page.goto('https://www.bing.com/search?q=javascript+promises&thumb=1');
  await page.waitForTimeout(1000);
  const bingButtons = await page.evaluate(() => {
    const lefts = [...document.querySelectorAll('anubis-weigh')].map((el) => el.getBoundingClientRect()).filter((r) => r.width).map((r) => Math.round(r.left));
    return { buttons: lefts.length, lefts: [...new Set(lefts)] };
  });
  console.log('== Bing buttons beside a picture:', JSON.stringify(bingButtons));
  // The buttons sit in one column left of the results.
  if (checks) assertChecks('Bing picture', { buttonsInOneColumn: bingButtons.buttons > 0 && Math.max(...bingButtons.lefts) - Math.min(...bingButtons.lefts) <= 2 });
  // Bing: a carousel labelled "Sponsored" goes with the Ads switch, and the summary is above it either way.
  const bingSponsored = async () => {
    await page.goto('https://www.bing.com/search?q=javascript+promises&sponsored=1');
    await page.waitForTimeout(1000);
    return page.evaluate(() => {
      const shops = [...document.querySelectorAll('.shopRow')];
      const summary = document.querySelector('anubis-summary');
      return {
        shown: shops.some((el) => el.getBoundingClientRect().height > 0),
        summaryAbove: !!summary && shops.every((el) => !!(el.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_PRECEDING)),
      };
    });
  };
  await setSettings({ cleanup: { ...all, ads: false } });
  const bingSponsoredOff = await bingSponsored();
  await setSettings({ cleanup: { ...all, ads: true } });
  const bingSponsoredOn = await bingSponsored();
  console.log('== Bing sponsored:', JSON.stringify({ bingSponsoredOff, bingSponsoredOn }));
  if (checks) {
    assertChecks('Bing sponsored', {
      shownWhenOff: bingSponsoredOff.shown,
      summaryAboveWhenOff: bingSponsoredOff.summaryAbove,
      removedWhenOn: !bingSponsoredOn.shown,
      summaryAboveWhenOn: bingSponsoredOn.summaryAbove,
    });
  }
  // Startpage: the paid result goes with the Ads switch, and the results stay.
  const startpageAds = async () => {
    await page.goto('https://www.startpage.com/do/search?q=javascript+promises');
    await page.waitForTimeout(1000);
    return page.evaluate(() => ({
      adShown: (document.querySelector('#adBlock')?.getBoundingClientRect().height ?? 0) > 0,
      results: document.querySelectorAll('[data-anubis-result]').length,
      resultsShown: [...document.querySelectorAll('.w-gl .result')].every((el) => el.getBoundingClientRect().height > 0),
    }));
  };
  await setSettings({ cleanup: { ...all, ads: false } });
  const startpageAdsOff = await startpageAds();
  await setSettings({ cleanup: { ...all, ads: true } });
  const startpageAdsOn = await startpageAds();
  console.log('== Startpage ads:', JSON.stringify({ startpageAdsOff, startpageAdsOn }));
  if (checks) {
    assertChecks('Startpage ads', {
      shownWhenOff: startpageAdsOff.adShown,
      removedWhenOn: !startpageAdsOn.adShown,
      resultsKept: startpageAdsOn.results === JS_RESULTS.length && startpageAdsOn.resultsShown,
    });
  }
  // Bing skips drawing results it takes to be off-screen (content-visibility: auto, at a placeholder height). Reported
  // blank until a reload, every result 247px tall: a result Anubis weighs is always drawn.
  await page.goto('https://www.bing.com/search?q=javascript+promises&skipped=1');
  await page.waitForTimeout(1000);
  const bingDrawn = await page.evaluate(() => [...document.querySelectorAll('[data-anubis-result]')].map((el) => getComputedStyle(el).contentVisibility));
  console.log('== Bing results drawn:', JSON.stringify(bingDrawn));
  if (checks) assertChecks('Bing skipped results', { allDrawn: bingDrawn.length === JS_RESULTS.length && bingDrawn.every((v) => v === 'visible') });
  // Ecosia builds its page in the browser: nothing of Anubis's is on it until it has, then Anubis arrives.
  await page.goto('https://www.ecosia.org/search?q=javascript+promises');
  await page.waitForTimeout(3500);
  const ecosiaSettle = await page.evaluate(() => ({
    built: window.__built === true,
    beforeBuild: window.__anubisBeforeBuild,
    results: document.querySelectorAll('[data-anubis-result]').length,
  }));
  // Results from Load more results get their site's icon drawn: Ecosia's own script isn't there to do it.
  await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) await chrome.tabs.sendMessage(tab.id, { type: 'go-deeper' }).catch(() => {});
  });
  await page.waitForTimeout(3000);
  const ecosiaIcons = await page.evaluate(() => {
    const holders = [...document.querySelectorAll('[data-anubis-page] [data-test-id="web-result-favicon"]')];
    return {
      loaded: holders.length,
      withIcon: holders.filter((h) => /^https:\/\/api\.ecosia\.org\/v2\/favicons\/fetch\?domain=https%3A%2F%2F[^&]+&fz=s&theme=(dark|light)$/.test(h.querySelector('img.favicon')?.getAttribute('src') ?? '')).length,
    };
  });
  // Ecosia answers Load more results with a robot check and can't be framed: the summary says so, with no frame tried.
  const framed = [];
  const onRequest = (r) => r.url().endsWith('q=robot+check&p=1') && r.resourceType() === 'document' && framed.push(r.url());
  page.on('request', onRequest);
  await page.goto('https://www.ecosia.org/search?q=robot+check');
  await page.waitForTimeout(3000);
  await clickShadowButton('anubis-summary', 'Load more results');
  await page.waitForTimeout(2000);
  page.off('request', onRequest);
  const robotText = await shadowText('anubis-summary');
  const ecosiaRobot = {
    said: robotText.includes('Ecosia wants a robot check before page 2.'),
    linked: (await shadowLinks('anubis-summary')).some((a) => a.text === 'Open page 2'),
    noFrame: framed.length === 0,
  };
  console.log('== Ecosia settle:', JSON.stringify({ ecosiaSettle, ecosiaIcons, ecosiaRobot }));
  if (checks) {
    assertChecks('Ecosia settle', { builtUntouched: ecosiaSettle.built && ecosiaSettle.beforeBuild === false, thenWeighed: ecosiaSettle.results === JS_RESULTS.length });
    assertChecks('Ecosia icons', { drawnOnLoadedResults: ecosiaIcons.loaded > 0 && ecosiaIcons.withIcon === ecosiaIcons.loaded });
    assertChecks('Ecosia robot check', ecosiaRobot);
  }
  // DuckDuckGo: a text ad looks like a result (an h2 and a link) but isn't weighed; the Ads switch removes it.
  const ddgAds = async () => {
    await page.goto('https://duckduckgo.com/?q=javascript+promises&ad=1');
    await page.waitForTimeout(1000);
    return page.evaluate(() => {
      const ad = document.querySelector('[data-layout="ad"]');
      return {
        results: document.querySelectorAll('[data-anubis-result]').length,
        buttonsOnAd: ad?.querySelectorAll('anubis-weigh, [data-anubis-result]').length ?? 0,
        adShown: !!ad && getComputedStyle(ad).display !== 'none' && ad.getBoundingClientRect().height > 0,
      };
    });
  };
  await setSettings({ cleanup: { ...all, ads: false } });
  const ddgAdsOff = await ddgAds();
  await setSettings({ cleanup: { ...all, ads: true } });
  const ddgAdsOn = await ddgAds();
  const ddgRemoved = (await statsNow())?.removed;
  console.log('== DuckDuckGo ads:', JSON.stringify({ ddgAdsOff, ddgAdsOn, ddgRemoved }));
  if (checks) {
    assertChecks('DuckDuckGo ads', {
      adIsNotAResult: ddgAdsOff.results === JS_RESULTS.length && ddgAdsOff.buttonsOnAd === 0,
      adShownWhenOff: ddgAdsOff.adShown,
      adRemovedWhenOn: !ddgAdsOn.adShown && ddgAdsOn.results === JS_RESULTS.length,
      summaryCountsIt: ddgRemoved?.ads === 1,
    });
  }
  // Yahoo: its ads look like results but aren't weighed; the Ads switch removes them.
  const yahooAds = async () => {
    await page.goto('https://search.yahoo.com/search?p=javascript+promises');
    await page.waitForTimeout(1000);
    return page.evaluate(() => {
      const ads = document.querySelector('.searchCenterTopAds');
      return {
        results: document.querySelectorAll('[data-anubis-result]').length,
        buttonsOnAds: ads?.querySelectorAll('anubis-weigh, [data-anubis-result]').length ?? 0,
        adsShown: !!ads && getComputedStyle(ads).display !== 'none' && ads.getBoundingClientRect().height > 0,
        middleAdShown: [...document.querySelectorAll('.midAd')].some((el) => el.getBoundingClientRect().height > 0),
        // The summary is above the ads, not between them and the results.
        summaryAboveAds: !!ads && !!document.querySelector('anubis-summary') && !!(ads.compareDocumentPosition(document.querySelector('anubis-summary')) & Node.DOCUMENT_POSITION_PRECEDING),
      };
    });
  };
  await setSettings({ cleanup: { ...all, ads: false } });
  const yahooAdsOff = await yahooAds();
  await setSettings({ cleanup: { ...all, ads: true } });
  const yahooAdsOn = await yahooAds();
  const yahooRemoved = (await statsNow())?.removed;
  console.log('== Yahoo ads:', JSON.stringify({ yahooAdsOff, yahooAdsOn, yahooRemoved }));
  if (checks) {
    assertChecks('Yahoo ads', {
      adsAreNotResults: yahooAdsOff.results === JS_RESULTS.length && yahooAdsOff.buttonsOnAds === 0,
      adsShownWhenOff: yahooAdsOff.adsShown && yahooAdsOff.middleAdShown,
      summaryAboveAdsWhenShown: yahooAdsOff.summaryAboveAds,
      summaryAboveAdsWhenRemoved: yahooAdsOn.summaryAboveAds,
      adsRemovedWhenOn: !yahooAdsOn.adsShown && !yahooAdsOn.middleAdShown && yahooAdsOn.results === JS_RESULTS.length,
      summaryCountsThem: yahooRemoved?.ads === 2,
    });
  }
  // Yahoo: one title that runs under the button's place takes every button to the same column.
  await page.goto('https://search.yahoo.com/search?p=javascript+promises&long=1');
  await page.waitForTimeout(1000);
  const yahooColumn = await page.evaluate(() => {
    const lefts = [...document.querySelectorAll('anubis-weigh')].map((el) => el.getBoundingClientRect()).filter((r) => r.width).map((r) => Math.round(r.left));
    return { buttons: lefts.length, lefts: [...new Set(lefts)] };
  });
  console.log('== Yahoo buttons with a long title:', JSON.stringify(yahooColumn));
  if (checks) assertChecks('Yahoo column', { buttonsInOneColumn: yahooColumn.buttons > 0 && yahooColumn.lefts.length === 1 });
  await page.goto('https://www.bing.com/search?q=javascript+promises&inline=1');
  await page.waitForTimeout(1200);
  console.log('== Bing box inside a result:', JSON.stringify(await visibleIn({ box: '#inline_rs', title: 'li.b_algo:nth-child(2) h2', snippet: 'li.b_algo:nth-child(2) .b_caption' })));
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));
  // Bing's AI answer across the top of the page, related searches beside and under
  // the results: all go, and the summary sits above where the answer was.
  await page.goto('https://www.bing.com/search?q=javascript+promises&copilot=1');
  await page.waitForTimeout(1200);
  const bingPanels = await visibleIn({ answer: '.cht_container', video: '.tp_vid', chips: '.cht_chips', related: '#brsv3', browsing: '#b_context h2', firstResult: 'li.b_algo h2' });
  const bingSummaryAbove = await page.evaluate(() => {
    const summary = document.querySelector('anubis-summary');
    const top = document.querySelector('#b_topw');
    return !!summary && !!(summary.compareDocumentPosition(top) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  console.log('== Bing AI answer and related searches:', JSON.stringify({ ...bingPanels, summaryAbove: bingSummaryAbove }));
  console.log('   removed:', JSON.stringify((await statsNow())?.removed));
  await page.screenshot({ path: `${SHOTS}bing-copilot.png`, fullPage: false });
  // Bing's sponsored carousels go with Ads and its AI answer with AI answers, even where they share a container.
  const bingParts = async (cleanup) => {
    await setSettings({ cleanup: { ...all, ...cleanup } });
    await page.goto('https://www.bing.com/search?q=javascript+promises&copilot=1&pole=1');
    await page.waitForTimeout(1200);
    return visibleIn({ answer: '.cht_container', adsAtTop: '#b_pole .poleRow', adsBesideAnswer: '#b_topw .poleRow' });
  };
  const bingAdsOnly = await bingParts({ ai: false, ads: true });
  const bingAiOnly = await bingParts({ ai: true, ads: false });
  console.log('== Bing ads and AI answer apart:', JSON.stringify({ bingAdsOnly, bingAiOnly }));
  if (checks) {
    assertChecks('Bing ads and AI answer apart', {
      adsGoAnswerStays: bingAdsOnly.answer && !bingAdsOnly.adsAtTop && !bingAdsOnly.adsBesideAnswer,
      answerGoesAdsStay: !bingAiOnly.answer && bingAiOnly.adsAtTop && bingAiOnly.adsBesideAnswer,
    });
    assertChecks('Bing AI answer and related searches', {
      removesAnswer: !bingPanels.answer && !bingPanels.video && !bingPanels.chips,
      removesRelatedSearches: !bingPanels.related,
      removesBrowsingSearches: !bingPanels.browsing,
      keepsResults: bingPanels.firstResult && bingPanels.results > 0,
      summaryAboveAnswer: bingSummaryAbove,
    });
  }
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
        aboveAi: (summary.nextElementSibling === ai || ai.firstElementChild === summary) && (!ai.getClientRects().length || s.bottom <= ai.querySelector('.YzCcne').getBoundingClientRect().top + 1),
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
  // Where the page lays the row out as a grid, the summary can't go before the
  // Overview (it would land in a cell beside the results), so it goes at the top
  // of the Overview instead.
  await page.goto('https://www.google.com/search?q=anubis&aigrid=1');
  await page.waitForTimeout(800);
  const gridKept = await summaryPlace();
  await page.screenshot({ path: `${SHOTS}google-ai-grid.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
  console.log('   in a grid, AI answers kept:', JSON.stringify(gridKept));
  await setSettings({ cleanup: { ...all, ai: true } });
  await page.goto('https://www.google.com/search?q=anubis&aigrid=1');
  await page.waitForTimeout(800);
  console.log('   in a grid, AI answer removed:', JSON.stringify(await summaryPlace()));
  await clickShadowButton('anubis-summary', 'Show hidden');
  await page.waitForTimeout(300);
  const gridShown = await summaryPlace();
  console.log('   in a grid, after Show hidden:', JSON.stringify(gridShown));
  // Hiding them again removes the answer again, though the summary sat at its top,
  // and later passes (a site hidden from its menu) keep it removed.
  await clickShadowButton('anubis-summary', 'Hide them again');
  await page.waitForTimeout(300);
  await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) await chrome.tabs.sendMessage(tab.id, { type: 'set-filter' }).catch(() => {});
  });
  await page.waitForTimeout(300);
  const gridHiddenAgain = await page.evaluate(() => {
    const ai = document.querySelector('.aiabove');
    const summary = document.querySelector('anubis-summary');
    return { aiShown: !!ai?.getClientRects().length, summaryShown: !!summary?.getClientRects().length, summaryInAi: !!ai?.contains(summary) };
  });
  console.log('   in a grid, after Hide them again:', JSON.stringify(gridHiddenAgain));
  if (checks) {
    assertChecks('summary above an AI Overview in a grid', {
      aboveWhenKept: gridKept.aboveAi && gridKept.aboveResults && gridKept.linedUp,
      aboveAfterShowHidden: gridShown.aboveAi && gridShown.aboveResults && gridShown.linedUp,
      removedAgainAfterHideThemAgain: !gridHiddenAgain.aiShown && gridHiddenAgain.summaryShown && !gridHiddenAgain.summaryInAi,
    });
  }

  // An earlier copy's summary is cleared, so the page shows one.
  await page.goto('https://www.google.com/search?q=anubis&leftover=1');
  await page.waitForTimeout(800);
  const summaries = await page.evaluate(() => document.querySelectorAll('anubis-summary').length);
  console.log('== summaries after a reload of the extension:', summaries);
  if (checks) assertChecks('one summary after a reload of the extension', { oneSummary: summaries === 1 });

  // Where the results area also holds a side panel, the summary still spans only the results.
  await page.goto('https://duckduckgo.com/?q=javascript+promises&wide=1');
  await page.waitForTimeout(800);
  const wide = await page.evaluate(() => {
    const host = document.querySelector('anubis-summary');
    const list = document.querySelector('.react-results--main');
    if (!host || !list) return { found: false };
    const box = host.getBoundingClientRect();
    const cs = getComputedStyle(host);
    const left = box.left + parseFloat(cs.paddingLeft);
    const right = box.right - parseFloat(cs.paddingRight);
    const col = list.getBoundingClientRect();
    return { found: true, left: Math.round(left), right: Math.round(right), colLeft: Math.round(col.left), colRight: Math.round(col.right) };
  });
  console.log('== summary on a results area wider than the results:', JSON.stringify(wide));
  const sidePanel = await page.evaluate(() => {
    const side = document.querySelector('[data-area="sidebar"]');
    return { found: !!side, result: !!side?.querySelector('[data-anubis-result], anubis-weigh, anubis-chips') || !!side?.closest('[data-anubis-result]') };
  });
  if (checks) assertChecks('DuckDuckGo side panel is not a result', { found: sidePanel.found, notAResult: !sidePanel.result });

  // DuckDuckGo's Videos and Images tabs: cards in a grid, hidden and tagged, and moved only with `order`.
  // Earlier parts change the personal list and tag choices, so start from the seeded ones.
  await ctx.serviceWorkers()[0].evaluate(
    (personal) => chrome.storage.sync.set({ 'personal.0': personal, personal: { chunks: 1, updatedAt: Date.now() }, tagPrefs: { 'ai-slop': { action: 'hide' } } }),
    PERSONAL,
  );
  for (const tab of ['videos', 'images']) {
    await page.goto(`https://duckduckgo.com/?q=javascript+promises&iax=${tab}&ia=${tab}`);
    // Wait until the lists have weighed the cards (some are hidden), not a fixed time.
    await page.waitForFunction(() => !!document.querySelector('ol > li[data-anubis-state~="hide"]') && !!document.querySelector('anubis-summary'), null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(200);
    const grid = await page.evaluate(() => {
      const ol = document.querySelector('ol');
      const summary = document.querySelector('anubis-summary')?.getBoundingClientRect();
      const cards = [...ol.children].filter((el) => el.tagName === 'LI');
      const shown = cards.filter((li) => li.getBoundingClientRect().height > 0);
      const buttons = [...document.querySelectorAll('anubis-weigh')].filter((b) => b.getBoundingClientRect().width);
      const g = ol.getBoundingClientRect();
      return {
        cards: cards.length,
        found: cards.filter((li) => li.hasAttribute('data-anubis-result')).length,
        hidden: cards.length - shown.length,
        states: cards.map((li) => li.getAttribute('data-anubis-state')).join('|'),
        hideStyle: document.documentElement.getAttribute('data-anubis-hide'),
        buttonsInCards: buttons.length > 0 && buttons.every((b) => b.closest('li')?.contains(b)),
        stillGrid: getComputedStyle(ol).display === 'grid' && ['', 'order'].includes(ol.getAttribute('data-anubis-rerank') ?? ''),
        // Shown cards fill the grid's cells in order, with no gaps.
        noGaps: shown.every((li, i) => i === 0 || li.getBoundingClientRect().top >= shown[i - 1].getBoundingClientRect().top - 1) && new Set(shown.map((li) => Math.round(li.getBoundingClientRect().top))).size === Math.ceil(shown.length / 4),
        summaryAbove: !!summary && summary.bottom <= g.top + 1 && summary.width >= g.width - 1,
      };
    });
    console.log(`== DuckDuckGo ${tab} tab:`, JSON.stringify(grid));
    await page.screenshot({ path: `${SHOTS}ddg-${tab}.png` });
    if (checks) {
      assertChecks(`DuckDuckGo ${tab} tab`, {
        allFound: grid.found === grid.cards,
        hidesSome: grid.hidden > 0,
        buttonsInCards: grid.buttonsInCards,
        stillGrid: grid.stillGrid,
        noGaps: grid.noGaps,
        summaryAboveGrid: grid.summaryAbove,
      });
    }
  }

  // DuckDuckGo's Images tab as the live page lays it out: pictures in rows a script places, not a CSS grid.
  // The summary goes above the pictures, not among them, and hiding some leaves no hole in the rows.
  await page.goto('https://duckduckgo.com/?q=javascript+promises&iax=images&ia=images&rows=1');
  await page.waitForFunction(() => !!document.querySelector('ul.rows > li[data-anubis-state~="hide"]') && !!document.querySelector('anubis-summary'), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
  const rows = await page.evaluate(async () => {
    const ul = document.querySelector('ul.rows');
    const summary = document.querySelector('anubis-summary');
    const places = () => [...ul.children].filter((li) => li.getBoundingClientRect().height > 0).map((li) => { const b = li.getBoundingClientRect(); return `${Math.round(b.left)},${Math.round(b.top)}`; }).join(' ');
    const settled = places();
    window.dispatchEvent(new Event('resize'));
    return {
      hidden: [...ul.children].filter((li) => li.getBoundingClientRect().height === 0).length,
      summaryOutside: !!summary && !ul.contains(summary) && summary.getBoundingClientRect().bottom <= ul.getBoundingClientRect().top + 1,
      noHole: settled === places(),
    };
  });
  console.log('== DuckDuckGo images in rows:', JSON.stringify(rows));
  await page.screenshot({ path: `${SHOTS}ddg-images-rows.png` });
  if (checks) assertChecks('DuckDuckGo images in rows', { hidesSome: rows.hidden > 0, summaryOutside: rows.summaryOutside, noHole: rows.noHole });

  // The same tabs on Brave, Ecosia, Kagi, and Startpage: every card found, some hidden without gaps,
  // buttons on the cards, and the grid left as it was.
  for (const [url, engine, tab] of ENGINE_TABS) {
    await page.goto(url);
    await page.waitForFunction(() => !!document.querySelector('.grid > [data-anubis-state~="hide"]') && !!document.querySelector('anubis-summary'), null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(200);
    const grid = await page.evaluate(() => {
      const el = document.querySelector('.grid');
      const cards = [...el.children];
      const shown = cards.filter((c) => c.getBoundingClientRect().height > 0);
      const buttons = [...document.querySelectorAll('anubis-weigh')].filter((b) => b.getBoundingClientRect().width);
      return {
        cards: cards.length,
        found: cards.filter((c) => c.hasAttribute('data-anubis-result')).length,
        hidden: cards.length - shown.length,
        buttonsInCards: buttons.length > 0 && buttons.every((b) => cards.some((c) => c.contains(b))),
        stillGrid: getComputedStyle(el).display === 'grid' && ['', 'order'].includes(el.getAttribute('data-anubis-rerank') ?? ''),
        noGaps: new Set(shown.map((c) => Math.round(c.getBoundingClientRect().top))).size === Math.ceil(shown.length / 4),
      };
    });
    console.log(`== ${engine} ${tab} tab:`, JSON.stringify(grid));
    if (checks) {
      assertChecks(`${engine} ${tab} tab`, {
        allFound: grid.found === grid.cards,
        hidesSome: grid.hidden > 0,
        buttonsInCards: grid.buttonsInCards,
        stillGrid: grid.stillGrid,
        noGaps: grid.noGaps,
      });
    }
  }

  // Where results are cards, the summary lines up with their text.
  await page.goto('https://search.brave.com/search?q=anubis');
  await page.waitForTimeout(800);
  const cards = await page.evaluate(() => {
    const host = document.querySelector('anubis-summary');
    const title = document.querySelector('.snippet[data-type="web"] .title');
    if (!host || !title) return { found: false };
    const box = host.getBoundingClientRect();
    const cs = getComputedStyle(host);
    return { found: true, left: Math.round(box.left + parseFloat(cs.paddingLeft)), titleLeft: Math.round(title.getBoundingClientRect().left) };
  });
  console.log('== summary over result cards:', JSON.stringify(cards));
  if (checks) assertChecks('summary lined up with result cards', { found: cards.found, linedUp: cards.found && Math.abs(cards.left - cards.titleLeft) <= 1 });

  // Each button is over no text: checked with the column (the `column` part).
  if (checks) {
    assertChecks('summary as wide as the results', {
      found: wide.found,
      linedUp: wide.found && Math.abs(wide.left - wide.colLeft) <= 1 && Math.abs(wide.right - wide.colRight) <= 1,
    });
  }

  // Forcing it on Google: the Web tab.
  await setSettings({ cleanup: { ...all, ai: false } , googleWebTab: true });
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForURL(/udm=14/, { timeout: 3000 }).catch(() => {});
  console.log('== Google with the Web tab on:', page.url());
  await setSettings({ cleanup: { ai: false, videos: false, questions: false, discussions: false, news: false, images: false, related: false }, googleWebTab: false });

  // The toolbar badge counts removed panels too, then clears when this tab leaves search.
  await setSettings({ cleanup: all });
  await page.goto('https://www.google.com/search?q=anubis&modules=1');
  await page.waitForTimeout(800);
  const badgeStats = await activeStats();
  const removedCount = Object.values(badgeStats?.removed ?? {}).reduce((sum, count) => sum + (count ?? 0), 0);
  const expectedBadge = String((badgeStats?.hidden ?? 0) + removedCount);
  if (checks) {
    assertChecks('toolbar badge counts hidden and removed items', {
      includesRemovedPanels: expectedBadge !== '0' && (await activeBadge()) === expectedBadge,
    });
  }
  await page.route('https://example.org/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Outside search</title>' }));
  await page.goto('https://example.org/');
  await page.waitForTimeout(200);
  if (checks) assertChecks('toolbar badge clears away from search', { clearsOnNavigation: (await activeBadge()) === '' });
  await setSettings({ cleanup: { ai: false, videos: false, questions: false, discussions: false, news: false, images: false, related: false } });
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

if (!only || only === 'pins' || checks) {
  // Each pinned result has a frame drawn 8px outside it, so two pinned results in a
  // row need 16px between them, or their frames cross.
  const measure = () =>
    page.evaluate(() => {
      const pinned = [...document.querySelectorAll('[data-anubis-state~="pin"]')].map((el) => el.getBoundingClientRect()).sort((a, b) => a.top - b.top);
      const gaps = pinned.slice(1).map((r, i) => Math.round(r.top - pinned[i].bottom));
      return { pinned: pinned.length, gaps, framesApart: gaps.every((g) => g >= 16), pushed: document.querySelectorAll('[data-anubis-pin-room]').length };
    });
  await page.goto('https://www.google.com/search?q=promise+mdn&inner=1');
  await page.waitForFunction(() => document.querySelector('[data-anubis-state~="pin"]'));
  await page.waitForTimeout(200);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-anubis-state~="pin"]' });
  const chips = await Promise.all(nodeIds.map((id) => hasResultChip(cdp, id, 'pin')));
  const { nodeIds: chipHosts } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'anubis-chips' });
  // Raised and lowered results have no label of their own: their tags say what moved them.
  const retainedRankChips = { raised: false, lowered: false, tagMark: false };
  for (const hostId of chipHosts) {
    retainedRankChips.raised ||= await hasChipInHost(cdp, hostId, 'raise');
    retainedRankChips.lowered ||= await hasChipInHost(cdp, hostId, 'lower');
  }
  const pinPresentation = [];
  for (const [index, id] of nodeIds.entries()) {
    const { nodeId: hostId } = await cdp.send('DOM.querySelector', { nodeId: id, selector: 'anubis-weigh' });
    if (!hostId) {
      pinPresentation.push({ chip: chips[index], pinIcon: false, accessibleName: false });
      continue;
    }
    const { node: host } = await cdp.send('DOM.describeNode', { nodeId: hostId, depth: -1, pierce: true });
    const shadow = host.shadowRoots?.[0];
    const { nodeId: buttonId } = shadow ? await cdp.send('DOM.querySelector', { nodeId: shadow.nodeId, selector: 'button.weigh' }) : {};
    if (!buttonId) {
      pinPresentation.push({ chip: chips[index], pinIcon: false, accessibleName: false });
      continue;
    }
    // The button shows the pin's icon.
    const { attributes } = await cdp.send('DOM.getAttributes', { nodeId: buttonId });
    const attr = (name) => (attributes.includes(name) ? attributes[attributes.indexOf(name) + 1] : '');
    pinPresentation.push({
      chip: chips[index],
      pinIcon: attr('data-level') === 'pin',
      accessibleName: attr('aria-label').toLowerCase().includes('pinned'),
    });
  }
  // Set "Great tutorial" to Raise, then Pin: javascript.info's tag shows that sign in
  // its diamond's place, and with Pin the result is pinned.
  const sw = ctx.serviceWorkers()[0];
  const { tagPrefs: savedPrefs } = await sw.evaluate(() => chrome.storage.sync.get('tagPrefs'));
  const tagShows = async (action) => {
    await sw.evaluate(({ prefs, action }) => chrome.storage.sync.set({ tagPrefs: { ...prefs, tutorial: { action } } }), { prefs: savedPrefs, action });
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(100);
      const { root: now } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
      const { nodeIds: hosts } = await cdp.send('DOM.querySelectorAll', { nodeId: now.nodeId, selector: 'anubis-chips' });
      for (const hostId of hosts) if (await hasInHost(cdp, hostId, `.gem-mark.${action}`)) return true;
    }
    return false;
  };
  retainedRankChips.tagMark = await tagShows('raise');
  retainedRankChips.pinMark = await tagShows('pin');
  retainedRankChips.tagPins = await page.evaluate(() =>
    [...document.querySelectorAll('[data-anubis-state~="pin"]')].some((el) => el.textContent?.includes('The Modern JavaScript Tutorial')),
  );
  await sw.evaluate((prefs) => chrome.storage.sync.set({ tagPrefs: prefs }), savedPrefs);
  await cdp.detach();
  console.log('\n== pinned results in a row:', JSON.stringify({ layout: await measure(), presentation: pinPresentation, retainedRankChips }));
  if (checks) {
    assertChecks('pinned result indicator', {
      pinnedResultsFound: pinPresentation.length > 0,
      noRedundantPinnedChip: pinPresentation.every((pin) => !pin.chip),
      buttonShowsThePin: pinPresentation.every((pin) => pin.pinIcon),
      accessibleNameRetained: pinPresentation.every((pin) => pin.accessibleName),
      noRaisedOrLoweredChips: !retainedRankChips.raised && !retainedRankChips.lowered,
      tagMarkShown: retainedRankChips.tagMark,
      pinTagPinsWithItsMark: retainedRankChips.pinMark && retainedRankChips.tagPins,
    });
  }
  await page.screenshot({ path: `${SHOTS}google-pins.png`, fullPage: true });
  // The same after passes that change which results are shown: no creeping or leftovers.
  await pressChip('Official docs');
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
    await pressWeigh(target.locator('anubis-weigh'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: false });
    console.log(`\n== ${name}: popover open =`, await page.locator('anubis-popover').count());
    if (name === 'popover-dark') {
      // A second press on the button closes the menu it opened.
      await pressWeigh(target.locator('anubis-weigh'));
      await page.waitForTimeout(300);
      const closedBySecondPress = (await page.locator('anubis-popover').count()) === 0;
      console.log('== second press closes the menu:', closedBySecondPress);
      assertChecks('the ⚖ button toggles its menu', { closedBySecondPress });
    }
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
  await pressWeigh(tutorial.locator('anubis-weigh'));
  await page.waitForTimeout(300);
  console.log('\n== auto theme, dark browser, light page:', JSON.stringify(await page.evaluate(() => ({
    menu: document.querySelector('anubis-popover')?.dataset.theme,
    summary: document.querySelector('anubis-summary')?.dataset.theme,
    tags: document.querySelector('anubis-chips')?.dataset.theme,
  }))));
  await page.screenshot({ path: `${SHOTS}popover-auto-dark-browser.png`, fullPage: false });
  await page.keyboard.press('Escape');
  await browserScheme(null);

  // The menu opens over its button, its arrow pointing down at it, so the result stays in
  // view; over the first result, with no room above, it opens below. + Tag shows every tag.
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(600);
  const placement = async (text) => {
    const result = page.locator('[data-anubis-result]', { hasText: text });
    await result.hover();
    await pressWeigh(result.locator('anubis-weigh'));
    await page.waitForTimeout(300);
    const button = await result.locator('anubis-weigh').boundingBox();
    return page.evaluate((b) => {
      const host = document.querySelector('anubis-popover');
      const arrow = parseFloat(host.style.getPropertyValue('--arrow-x'));
      const left = parseFloat(host.style.left) - scrollX;
      const top = parseFloat(host.style.top) - scrollY;
      return {
        side: host.hasAttribute('data-above') ? 'above' : host.hasAttribute('data-below') ? 'below' : 'neither',
        pointsAtButton: Math.abs(left + arrow - (b.x + b.width / 2)) <= 1,
        clearOfButton: host.hasAttribute('data-above') ? top <= b.y - 8 : top >= b.y + b.height + 8,
      };
    }, button);
  };
  const overTutorial = await placement('The Modern JavaScript Tutorial');
  const tagsBefore = await shadowText('anubis-popover');
  await clickShadowButton('anubis-popover', '+ Tag');
  await page.waitForTimeout(300);
  const tagsAfter = await shadowText('anubis-popover');
  await page.keyboard.press('Escape');
  const overMdn = await placement('Promise - JavaScript | MDN');
  console.log('\n== where the menu opens:', JSON.stringify({ overTutorial, overMdn }));
  assertChecks('the menu over its button', {
    aboveTheResult: overTutorial.side === 'above' && overTutorial.pointsAtButton && overTutorial.clearOfButton,
    belowTheFirst: overMdn.side === 'below' && overMdn.pointsAtButton && overMdn.clearOfButton,
    tagShowsEveryTag: !tagsBefore.includes('New tag') && tagsAfter.length > tagsBefore.length && tagsAfter.includes('Done'),
  });
  await page.screenshot({ path: `${SHOTS}popover-below.png`, fullPage: false });
  // Lowering the first result moves it down the page: its open menu goes with it.
  {
    const result = page.locator('[data-anubis-result]', { hasText: 'Promise - JavaScript | MDN' });
    // The menu over this result is still open from the placement checks.
    const before =(await result.locator('anubis-weigh').boundingBox()).y;
    await clickShadowButton('anubis-popover', 'Lower');
    await page.waitForTimeout(900);
    const button = await result.locator('anubis-weigh').boundingBox();
    const follows = await page.evaluate((b) => {
      const host = document.querySelector('anubis-popover');
      if (!host) return { open: false };
      const left = parseFloat(host.style.left) - scrollX;
      return { open: true, pointsAtButton: Math.abs(left + parseFloat(host.style.getPropertyValue('--arrow-x')) - (b.x + b.width / 2)) <= 1 };
    }, button);
    const moved = Math.abs(button.y - before) > 1;
    const verticallyAtButton = await page.evaluate((b) => {
      const host = document.querySelector('anubis-popover');
      if (!host) return false;
      const top = parseFloat(host.style.top) - scrollY;
      return host.hasAttribute('data-above') ? top <= b.y : top >= b.y;
    }, button);
    console.log('\n== menu after Lower:', JSON.stringify({ moved, follows, verticallyAtButton }));
    assertChecks('the menu follows a reranked result', { moved, open: follows.open, pointsAtButton: follows.pointsAtButton, verticallyAtButton });
    await page.keyboard.press('Escape');
    // Undo, so the checks after this see the original order.
    await clickShadowButton('anubis-summary', 'Undo');
    await page.waitForTimeout(600);
  }
  // The site name is text with the select unseen over it. Focus the select and
  // choose the whole site with the keyboard.
  {
    const cdp = await page.context().newCDPSession(page);
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    const find = (node) => (node.nodeName === 'SELECT' ? node : [...(node.children ?? []), ...(node.shadowRoots ?? [])].map(find).find(Boolean));
    const host = (function hostOf(node) {
      return node.localName === 'anubis-popover' ? node : [...(node.children ?? []), ...(node.shadowRoots ?? [])].map(hostOf).find(Boolean);
    })(root);
    const select = host && find(host);
    if (select) await cdp.send('DOM.focus', { nodeId: select.nodeId });
    await cdp.detach();
  }
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  const menu = await shadowText('anubis-popover');
  const focused = await page.evaluate(() => document.activeElement?.localName);
  console.log('== site name after choosing the whole site:', JSON.stringify(menu.split(' ')[0]), '| focus in the menu:', focused === 'anubis-popover');
  await page.screenshot({ path: `${SHOTS}popover-site.png`, fullPage: false });
  await page.keyboard.press('Escape');
}

// What a screen reader hears, from the accessibility tree (it sees inside closed
// shadow roots): each ⚖ button names its site, focus stays put when a click
// re-renders or closes what was clicked, and a change is announced.
async function axTree() {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();
  return nodes.filter((n) => !n.ignored).map((n) => ({
    id: n.nodeId,
    parent: n.parentId,
    role: n.role?.value,
    name: n.name?.value ?? '',
    focused: !!n.properties?.find((p) => p.name === 'focused')?.value?.value,
  }));
}
const focused = async () => {
  // The page itself counts as focused too; the element is the last one.
  const hit = (await axTree()).filter((n) => n.focused && n.role !== 'RootWebArea').pop();
  return hit ? `${hit.role}: ${hit.name}` : 'nothing';
};

if (!only || only === 'a11y') {
  await page.goto('https://duckduckgo.com/?q=javascript+promises');
  await page.waitForTimeout(600);
  const buttons = (await axTree()).filter((n) => n.role === 'button' && n.name.startsWith('Hide, rank, or tag'));
  console.log('\n== ⚖ buttons:', JSON.stringify({ count: buttons.length, distinct: new Set(buttons.map((b) => b.name)).size, first: buttons[0]?.name }));

  const target = page.locator('[data-anubis-result]', { hasText: 'The Modern JavaScript Tutorial' });
  await target.hover();
  await pressWeigh(target.locator('anubis-weigh'));
  await page.waitForTimeout(300);
  // Focus starts on the chosen ranking; back up to × and press it.
  let steps = 0;
  while (!(await focused()).startsWith('button: Close') && steps++ < 4) await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  console.log('== focus after × closes the menu:', await focused());

  // Pin it from the menu: the change is announced.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  await page.keyboard.press('Escape');
  const tree = await axTree();
  const status = tree.find((n) => n.role === 'status');
  const statusText = status && tree.filter((n) => n.parent === status.id).map((n) => n.name).join(' ');
  console.log('== announced:', JSON.stringify(statusText ?? null));
  // Undo goes with the click; focus stays in the summary.
  await clickShadowButton('anubis-summary', 'Undo');
  await page.waitForTimeout(600);
  console.log('== focus after Undo:', await focused());

  // A hidden result's Show line names the site, and hands focus to the result.
  await page.goto('https://www.google.com/search?q=anubis');
  await page.waitForSelector('anubis-bar');
  await page.waitForTimeout(300);
  const show = (await axTree()).find((n) => n.role === 'button' && /^Show \S+\.\S+/.test(n.name));
  await clickShadowButton('anubis-bar', 'Show');
  await page.waitForTimeout(300);
  console.log('== hidden line:', JSON.stringify({ button: show?.name ?? null, focusAfter: await focused() }));
  // Show hidden keeps focus on its own button, now Hide them again.
  await clickShadowButton('anubis-summary', 'Show hidden');
  await page.waitForTimeout(300);
  console.log('== focus after Show hidden:', await focused());
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
  await page.waitForTimeout(400);

  // Pressing a tag under a result does the same, and pressing it again undoes it, buttons and all.
  const shown = () =>
    page.evaluate(() => [...document.querySelectorAll('[data-anubis-result]')].filter((el) => getComputedStyle(el).display !== 'none').length);
  // Each shown result's button: which shape it takes and how far from the left (its height varies with the result's icon).
  const buttons = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-anubis-result]')]
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => {
          const host = el.querySelector('anubis-weigh');
          const box = host?.getBoundingClientRect();
          return `${host?.dataset.shape}@${box ? Math.round(box.left) : '-'}`;
        }),
    );
  for (const [name, url, chip] of [
    ['DuckDuckGo', 'https://duckduckgo.com/?q=javascript+promises', 'Discussion'],
    ['Google', 'https://www.google.com/search?q=anubis', 'Reference'],
  ]) {
    await page.goto(url);
    await page.waitForTimeout(600);
    const all = await shown();
    const buttonsBefore = await buttons();
    await pressChip(chip);
    await page.waitForTimeout(400);
    const narrowed = await shown();
    console.log(`\n== chip filter (${name}):`, JSON.stringify({ all, narrowed }));
    await pressChip(chip);
    await page.waitForTimeout(400);
    const buttonsAfter = await buttons();
    console.log('== chip filter off:', await shown(), JSON.stringify({ buttonsBefore, buttonsAfter }));
    // Results that were filtered out come back with their buttons where they were.
    assertChecks(`filter off (${name})`, { narrowed: narrowed < all, sameCount: all === (await shown()), buttonsBack: JSON.stringify(buttonsBefore) === JSON.stringify(buttonsAfter) });
  }
}

if (!only || only === 'deeper' || checks) {
  const sw = ctx.serviceWorkers()[0];
  const loadedPages = () => page.evaluate(() => new Set([...document.querySelectorAll('[data-anubis-page]')].map((el) => el.dataset.anubisPage)).size);
  const setDeeper = (deeper) =>
    sw.evaluate(async (deeper) => {
      const { settings } = await chrome.storage.sync.get('settings');
      await chrome.storage.sync.set({ settings: { ...settings, deeper } });
    }, deeper);

  // Google: "Load more results" by message (the path the popup uses).
  await page.goto('https://www.google.com/search?q=anubis&deep=1');
  await page.waitForTimeout(600);
  await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) {
      await chrome.tabs.sendMessage(tab.id, { type: 'go-deeper' }).catch(() => {});
    }
  });
  await page.waitForTimeout(1500);
  await report(page, 'google-deeper');
  const googleByHand = await loadedPages();
  await page.screenshot({ path: `${SHOTS}google-deeper.png`, fullPage: true });

  // Google tidies its address after loading. That's the same search: the page loaded
  // stays counted, and nothing loads page 2 again (it would find only repeats).
  await page.evaluate(() => {
    history.replaceState(null, '', `${location.href}&sei=abc`);
    document.body.append(document.createElement('div'));
  });
  await page.waitForTimeout(1500);
  const afterRewrite = await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) {
      const stats = await chrome.tabs.sendMessage(tab.id, { type: 'get-page-stats' }).catch(() => undefined);
      if (stats?.engine === 'Google') return { pages: stats.pages, stopped: stats.stopped?.reason ?? null };
    }
    return 'no answer';
  });

  // Google, automatic: the Next link arrives after the results, as on the live page,
  // where the first pass runs while the page is still streaming in.
  await setDeeper(2);
  await page.goto('https://www.google.com/search?q=anubis&deep=late');
  await page.waitForTimeout(3000);
  await report(page, 'google-deeper-auto');
  const googleAuto = await loadedPages();

  // DuckDuckGo: automatic, by pressing the page's own "More results" button.
  await setDeeper(1);
  await page.goto('https://duckduckgo.com/?q=javascript+promises&more=1');
  await page.waitForTimeout(2500);
  await report(page, 'ddg-deeper-auto');
  const ddgAuto = await page.evaluate(() => document.querySelectorAll('[data-anubis-result]').length);
  await page.screenshot({ path: `${SHOTS}ddg-deeper.png`, fullPage: true });
  await setDeeper(0);

  // DuckDuckGo: its own "More results" pressed by hand still counts as a page, so the
  // summary and the next Load more results start from the pages that are there.
  await page.goto('https://duckduckgo.com/?q=javascript+promises&more=1');
  await page.waitForTimeout(800);
  await page.click('#more-results');
  await page.waitForTimeout(1200);
  const ddgByHandPages = await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) {
      const stats = await chrome.tabs.sendMessage(tab.id, { type: 'get-page-stats' }).catch(() => undefined);
      if (stats?.engine === 'DuckDuckGo') return stats.pages;
    }
    return 'no answer';
  });

  // Brave: two pages, automatically, with its pager at the end of the results list.
  // The pager must end up below every page, and each page must be a new one.
  await setDeeper(2);
  await page.goto('https://search.brave.com/search?q=anubis&paged=1');
  await page.waitForTimeout(4000);
  await setDeeper(0);
  await report(page, 'brave-deeper-auto');
  const pagerBelow = () =>
    page.evaluate(() => {
      const pager = document.querySelector('#pagination, li.b_pag');
      const results = [...document.querySelectorAll('[data-anubis-result]')];
      if (!pager || !results.length) return false;
      const top = pager.getBoundingClientRect().top;
      return results.every((r) => r.getBoundingClientRect().bottom <= top + 1);
    });
  const braveAuto = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-anubis-page]')].map((el) => el.dataset.anubisPage))].sort().join(','));
  const bravePagerBelow = await pagerBelow();
  await page.screenshot({ path: `${SHOTS}brave-deeper.png`, fullPage: true });

  // Bing: the request for page 2 gets a robot check, so it loads in a hidden frame instead.
  await page.goto('https://www.bing.com/search?q=javascript+promises&paged=1');
  await page.waitForTimeout(800);
  await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) await chrome.tabs.sendMessage(tab.id, { type: 'go-deeper' }).catch(() => {});
  });
  await page.waitForTimeout(3500);
  await report(page, 'bing-deeper');
  const bingPages = await loadedPages();
  const bingPagerBelow = await pagerBelow();
  const bingFrameGone = await page.evaluate(() => !document.querySelector('anubis-frame'));
  // Bing: a Next link that carries `rdr` gets page 1 again, so the address goes without it.
  await page.goto('https://www.bing.com/search?q=javascript+promises&redirected=1');
  await page.waitForTimeout(800);
  await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) await chrome.tabs.sendMessage(tab.id, { type: 'go-deeper' }).catch(() => {});
  });
  await page.waitForTimeout(3500);
  const bingRedirectedPages = await loadedPages();
  await page.goto('https://www.bing.com/search?q=javascript+promises&paged=1');
  await page.waitForTimeout(800);
  await sw.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) await chrome.tabs.sendMessage(tab.id, { type: 'go-deeper' }).catch(() => {});
  });
  await page.waitForTimeout(3500);
  // Bing's site icons are placeholders its script fills in; results brought over get the image itself.
  const bingIcons = await page.evaluate(() => {
    const loaded = [...document.querySelectorAll('[data-anubis-page] .rms_iac')];
    return loaded.length > 0 && loaded.every((el) => el.querySelector('img.rms_img')?.getAttribute('src')?.startsWith('https://www.bing.com/th?'));
  });

  // Bing: a robot check however page 2 is asked for. The summary says so, links to
  // the page, and keeps offering to load it.
  await page.goto('https://www.bing.com/search?q=javascript+promises&paged=2');
  await page.waitForTimeout(800);
  await clickShadowButton('anubis-summary', 'Load more results');
  await page.waitForTimeout(10500);
  const bingStoppedText = await shadowText('anubis-summary');
  const bingStoppedLink = (await shadowLinks('anubis-summary')).find((a) => a.text === 'Open page 2');
  const bingStopped = {
    said: bingStoppedText.includes('Bing sent no results for page 2'),
    linked: bingStoppedLink?.href === 'https://www.bing.com/search?q=javascript+promises&paged=2&first=11',
    offeredAgain: bingStoppedText.includes('Load more results'),
  };
  await page.screenshot({ path: `${SHOTS}bing-deeper-stopped.png`, fullPage: false });

  console.log('\n== load more results:', JSON.stringify({ googleByHand, afterRewrite, googleAuto, ddgAuto, ddgByHandPages, braveAuto, bravePagerBelow, bingPages, bingPagerBelow, bingFrameGone, bingRedirectedPages, bingIcons, bingStopped }));
  if (checks) {
    assertChecks('load more results', {
      googleByHand: googleByHand === 1,
      googleAddressTidiedSameSearch: afterRewrite.pages === 2 && afterRewrite.stopped === null,
      googleAutomaticWithLatePager: googleAuto === 1,
      // The mock starts with 9 results and its More results button adds 3.
      duckDuckGoAutomatic: ddgAuto > 9,
      duckDuckGoOwnButtonCounted: ddgByHandPages === 2,
      bravePagesTwoAndThree: braveAuto === '2,3',
      bravePagerBelowResults: bravePagerBelow,
      bingPageBehindRobotCheck: bingPages === 1,
      bingPagerBelowResults: bingPagerBelow,
      bingFrameRemoved: bingFrameGone,
      bingNextLinkWithoutRedirectFlag: bingRedirectedPages === 1,
      bingIconsOnLoadedResults: bingIcons,
      bingSaysWhyItStopped: bingStopped.said && bingStopped.linked && bingStopped.offeredAgain,
    });
  }
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
  // until Subscribe. The directory, the subscribe page, and the list are mocks.
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

if (!only || only === 'responsive') {
  // Tag names come from lists, and the Add tag picker on each site's row must not
  // grow with them: add a long one here instead of relying on what the lists hold.
  const [sw] = ctx.serviceWorkers();
  const personal = await sw.evaluate(async () => (await chrome.storage.sync.get('personal.0'))['personal.0']);
  await sw.evaluate(async (text) => chrome.storage.sync.set({ 'personal.0': text }), `${personal}\n! tag: long-label | A tag with a very long name from a list | #2b9aa0\n`);
  const opt = await ctx.newPage();
  for (const colorScheme of ['light', 'dark']) {
    await opt.emulateMedia({ colorScheme });
    for (const width of [320, 360, 375, 389, 390]) {
      await opt.setViewportSize({ width, height: 900 });
      for (const section of ['sites', 'tags', 'lists', 'cleanup', 'appearance', 'engines', 'sync', 'share']) {
        await opt.goto(`chrome-extension://${extId}/options.html#${section}`);
        const heading = builtMessage(
          { sites: 'sitesHeading', tags: 'tagsHeading', lists: 'listsHeading', cleanup: 'cleanupHeading', appearance: 'appearanceHeading', engines: 'enginesHeading', sync: 'syncHeading', share: 'shareHeading' }[section],
        );
        await opt.waitForFunction((text) => document.querySelector('main h2')?.textContent === text, heading);
        const layout = await opt.evaluate(() => ({
          document: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
          overflowing: [...document.querySelectorAll('body *')]
            .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
            .slice(0, 8)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).replaceAll(' ', '.')}`),
        }));
        if (layout.document > layout.viewport) {
          throw new Error(`Settings → ${section} overflows at ${width}px in ${colorScheme} mode (${layout.document}px wide): ${layout.overflowing.join(', ')}`);
        }
        if (section === 'sites' && width < 390) {
          // The table fills in after the heading shows, so wait for it to overflow.
          const scrolls = await opt
            .waitForFunction(() => {
              const el = document.querySelector('.sites-scroll');
              return !!el && el.scrollWidth > el.clientWidth;
            }, null, { timeout: 3000 })
            .then(() => true, () => false);
          if (!scrolls) throw new Error(`Your sites table should scroll inside its wrapper at ${width}px`);
          await opt.waitForFunction(() => {
            const levels = document.querySelector('main form.inline-form .levels.labelled');
            return !!levels?.isConnected && getComputedStyle(levels).display === 'grid';
          });
          const addForm = await opt.evaluate(() => {
            const levels = document.querySelector('main form.inline-form .levels.labelled');
            if (!levels?.isConnected) return { compact: false, addOnNextLine: false, missing: true };
            const add = levels.closest('form')?.querySelector('button[type="submit"]');
            if (!add) return { compact: false, addOnNextLine: false, missing: true };
            const style = getComputedStyle(levels);
            const columns = style.gridTemplateColumns.trim().split(/\s+/).length;
            const levelsBox = levels.getBoundingClientRect();
            const addBox = add.getBoundingClientRect();
            return {
              compact: style.display === 'grid' && columns === 3,
              addOnNextLine: addBox.top >= levelsBox.bottom,
              display: style.display,
              columns,
              addTop: addBox.top,
              levelsBottom: levelsBox.bottom,
            };
          });
          if (!addForm.compact || !addForm.addOnNextLine) {
            throw new Error(`Your sites ranking choices should use a compact grid with Add below at ${width}px in ${colorScheme} mode: ${JSON.stringify(addForm)}`);
          }
        }
        if (section === 'sites' && width === 390) {
          const overflows = await opt.locator('.sites-scroll').evaluate((el) => el.scrollWidth > el.clientWidth);
          if (overflows) throw new Error('Your sites table should fit at 390px');
        }
      }
      console.log(`  Settings sections fit at ${width}px in ${colorScheme} mode`);
    }
  }
  await opt.close();
  await sw.evaluate(async (text) => chrome.storage.sync.set({ 'personal.0': text }), personal);
  console.log('\n== responsive Settings checks passed');
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
      scrollsSideways: document.documentElement.scrollWidth > innerWidth,
    }));
  for (const scheme of ['dark', 'light']) {
    await welcome.emulateMedia({ colorScheme: scheme });
    await welcome.setViewportSize({ width: 1180, height: 900 });
    await welcome.goto(`chrome-extension://${extId}/welcome.html`);
    await welcome.waitForTimeout(300);
    await welcome.screenshot({ path: `${SHOTS}welcome-${scheme}.png`, fullPage: true });
  }
  // The example search page: a result's button opens the menu, Pin puts its site first,
  // Hide takes one away with Undo and Show hidden to bring it back, and Start again
  // restores the engine's order.
  const demoOrder = () => welcome.evaluate(() => [...document.querySelectorAll('#demo .results .host')].map((el) => el.textContent));
  const demoText = (sel) => welcome.evaluate((sel) => document.querySelector(sel)?.textContent ?? '', sel);
  const rank = async (site, level) => {
    await welcome.click(`#demo .results li:nth-child(${(await demoOrder()).indexOf(site) + 1}) .weigh`);
    await welcome.click(`#demo-menu button.${level}`);
    await welcome.waitForTimeout(400);
  };
  const first = await demoOrder();
  // The tour introduces the button and marks the encyclopedia's first, then Pin once its
  // menu is open, with the other choices dimmed and doing nothing; after Pin it says the
  // site is first and asks for a site to hide; after Hide, it points at Undo and says what
  // to do next.
  const ringed = () => welcome.evaluate(() => [...document.querySelectorAll('.beckon')].map((el) => el.getAttribute('aria-label') ?? el.textContent));
  const tourStart = { says: await demoText('#demo .coach .says'), ringed: await ringed() };
  await welcome.click(`#demo .results li:nth-child(3) .weigh`);
  const tourMenu = { says: await demoText('#demo .coach .says'), ringed: await ringed(), besideMenu: await welcome.evaluate(() => document.querySelector('#demo-menu + .coach') !== null) };
  // Playwright won't press a control that says it's unavailable; a person can.
  await welcome.click('#demo-menu button.raise', { force: true });
  await welcome.waitForTimeout(400);
  const lockedPress = {
    order: await demoOrder(),
    dimmed: await welcome.evaluate(() => [...document.querySelectorAll('#demo-menu [aria-disabled="true"]')].map((el) => el.className)),
    says: await demoText('#demo .coach .says'),
  };
  await welcome.keyboard.press('Escape');
  await rank('plato.stanford.edu', 'pin');
  const pinFramed = await welcome.evaluate(() => getComputedStyle(document.querySelector('#demo li[data-level="pin"]'), '::before').borderTopStyle === 'solid');
  const pinned = await demoOrder();
  const menuOpen = await welcome.evaluate(() => !!document.querySelector('#demo .results li #demo-menu'));
  await welcome.screenshot({ path: `${SHOTS}welcome-demo-menu.png`, clip: await welcome.evaluate(() => { const r = document.querySelector('#demo').getBoundingClientRect(); return { x: r.x - 8, y: r.y + scrollY - 8, width: r.width + 16, height: r.height + 16 }; }) });
  await welcome.keyboard.press('Escape');
  const tourThird = await demoText('#demo .coach .says');
  // In step 3, Hide is the one choice, but any site not yet ranked can be the one.
  await welcome.click(`#demo .results li:nth-child(${(await demoOrder()).indexOf('studocu.com') + 1}) .weigh`);
  const hideStep = await welcome.evaluate(() => ({
    choices: [...document.querySelectorAll('#demo-menu .levels button:not([aria-disabled])')].map((el) => el.className.split(' ')[0]),
    sites: [...document.querySelectorAll('#demo .weigh:not([aria-disabled])')].map((el) => el.closest('li').querySelector('.host').textContent),
  }));
  await welcome.click('#demo-menu button.hide');
  await welcome.waitForTimeout(400);
  const tourDone = await demoText('#demo .coach');
  // The checklist beside the practice search ticks off all three steps and says so.
  const checklist = await welcome.evaluate(() => ({ done: document.querySelectorAll('#steps li.done').length, allDone: !document.querySelector('#steps-done').hidden }));
  const hidden = await demoOrder();
  const summary = await demoText('#demo .summary');
  const said = await demoText('#demo .said');
  await welcome.click('#demo .summary .text-btn');
  const revealed = await demoOrder();
  await welcome.click('#demo .said .text-btn');
  const undone = await demoOrder();
  await welcome.click('#demo-reset');
  const reset = await demoOrder();
  console.log('\n== welcome demo:', JSON.stringify({ first, tourStart, tourMenu, lockedPress, pinned, pinFramed, menuOpen, tourThird, hideStep, hidden, summary, said, tourDone, checklist, revealed, undone, reset }));
  if (
    !/next to every result/.test(tourStart.says) ||
    !/plato\.stanford\.edu/.test(tourStart.ringed.join()) ||
    !tourMenu.ringed.join().includes('Pin') ||
    !tourMenu.besideMenu ||
    lockedPress.order.join() !== first.join() ||
    lockedPress.dimmed.length !== 4 ||
    lockedPress.says !== tourMenu.says ||
    !/plato\.stanford\.edu will come first/.test(tourThird) ||
    !/don't want to see/.test(tourThird) ||
    hideStep.choices.join() !== 'hide' ||
    hideStep.sites.length !== 5 ||
    hideStep.sites.includes('plato.stanford.edu') ||
    !/Undo brings it back/.test(tourDone) ||
    checklist.done !== 3 ||
    !checklist.allDone ||
    !pinFramed ||
    pinned[0] !== 'plato.stanford.edu' ||
    !menuOpen ||
    hidden.includes('studocu.com') ||
    hidden.length !== first.length - 1 ||
    !/pinned 1 and hid 1 of 6 results/.test(summary) ||
    !/Hid studocu\.com/.test(said) ||
    !revealed.includes('studocu.com') ||
    !undone.includes('studocu.com') ||
    reset.join() !== first.join()
  ) {
    throw new Error('the welcome page demo did not rank');
  }
  // More to try: turning Discussions off takes its tag away and turning Paywalls on adds
  // one; a second tag goes under the title; the AI answer goes with its switch.
  await welcome.click('#lists-demo summary');
  const listTags = () => welcome.evaluate(() => [...document.querySelectorAll('#lists-demo .results li')].map((li) => `${li.querySelector('.host').textContent}: ${li.querySelector('.chips').textContent}`));
  const listsBefore = await listTags();
  await welcome.click('#lists-demo .switches li:first-child .switch input');
  await welcome.click('#lists-demo .switches li:last-child .switch input');
  const listsAfter = await listTags();
  await welcome.click('#tags-demo summary');
  // Course notes starts on; Trusted joins it.
  await welcome.click('#tags-demo .choice:nth-child(2)');
  const tagged = await demoText('#tags-demo .chips');
  await welcome.click('#panels-demo summary');
  await welcome.click('#panels-demo .switch input');
  const panelGone = await welcome.evaluate(() => document.querySelector('#panels-demo .panel').hidden);
  const listCount = await demoText('#lists-demo .more span');
  console.log('\n== welcome extras:', JSON.stringify({ listsBefore, listsAfter, tagged, panelGone, listCount }));
  const listsChanged = listsBefore.join() === 'reddit.com: Discussion,en.wikipedia.org: Reference,nytimes.com: ' && listsAfter.join() === 'reddit.com: ,en.wikipedia.org: Reference,nytimes.com: Paywalled';
  if (!listsChanged || !/Course notes.*Trusted/.test(tagged) || !panelGone) {
    throw new Error('the welcome page extras did not respond');
  }
  await welcome.screenshot({ path: `${SHOTS}welcome-extras.png`, fullPage: true });
  const desktop = await check();
  await welcome.setViewportSize({ width: 390, height: 844 });
  await welcome.waitForTimeout(200);
  await welcome.screenshot({ path: `${SHOTS}welcome-phone.png`, fullPage: true });
  console.log('\n== welcome:', JSON.stringify({ opened, ...desktop, phoneScrollsSideways: (await check()).scrollsSideways }));
  await welcome.close();
}

if (!only || only === 'axe') {
  // axe-core over Settings (every section), the popup, and the welcome page, in light and
  // dark: missing names, roles, and contrast. It finds a share of the problems; the keyboard
  // and screen-reader checks in ACCESSIBILITY.md still apply. Fixing a finding is better
  // than excluding it; when one has to stay, name the rule and why next to AXE_ALLOWED.
  const { AxeBuilder } = await import('@axe-core/playwright');
  const AXE_ALLOWED = {};
  const sections = ['sites', 'tags', 'lists', 'cleanup', 'appearance', 'engines', 'sync', 'share'];
  const targets = [
    ...sections.map((section) => [`Settings → ${section}`, `options.html#${section}`, 1180, 900]),
    ['Popup', 'popup.html', 364, 620],
    ['Welcome', 'welcome.html', 1180, 900],
  ];
  const page = await ctx.newPage();
  const found = [];
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    for (const [name, path, width, height] of targets) {
      await page.setViewportSize({ width, height });
      await page.goto(`chrome-extension://${extId}/${path}`);
      await page.waitForTimeout(500);
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      for (const v of violations.filter((v) => !AXE_ALLOWED[v.id])) {
        found.push(`${name} (${colorScheme}): ${v.id} [${v.impact}] ${v.help}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}${v.nodes.length > 3 ? ` and ${v.nodes.length - 3} more` : ''}`);
      }
    }
  }
  await page.close();
  console.log(`\n== axe: ${found.length ? found.length + ' findings' : 'no findings'}`);
  for (const line of found) console.log('  ' + line);
  if (found.length) throw new Error(`axe found ${found.length} accessibility problems`);
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
  await pressWeigh(target.locator('anubis-weigh'));
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
  // Settings and tag choices from another computer arrive the same way, and the
  // open page follows them.
  await page.waitForTimeout(800);
  const slop = () => page.locator('[data-anubis-result]', { hasText: 'JavaScript Promises Explained' }).getAttribute('data-anubis-state');
  const marked = () => page.locator('[data-anubis-result]').count();
  const { settings, tagPrefs } = await sw.evaluate(() => chrome.storage.sync.get(['settings', 'tagPrefs']));
  const tagBefore = await slop();
  await sw.evaluate(() => chrome.storage.sync.set({ tagPrefs: { 'ai-slop': { action: 'lower' } } }));
  await page.waitForTimeout(800);
  const tagAfter = await slop();
  await sw.evaluate((s) => chrome.storage.sync.set({ settings: { ...s, enabled: false } }), settings);
  await page.waitForTimeout(800);
  const off = await marked();
  await sw.evaluate((saved) => chrome.storage.sync.set(saved), { settings, tagPrefs });
  await page.waitForTimeout(800);
  const backOn = await marked();
  console.log('== sync, settings and tag choices:', JSON.stringify({ 'tag before': tagBefore, 'tag after': tagAfter, 'results marked while off': off, 'after turning back on': backOn }));
  assertChecks('Browser sync of settings and tag choices', {
    'a tag choice from sync applies': tagBefore === 'hide tagged' && tagAfter === 'lower tagged',
    'turning off from sync leaves the page alone': off === 0,
    'turning on from sync weighs the page again': backOn > 0 && (await slop()) === 'hide tagged',
  });
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
  if (!(await opt.getByLabel('Encrypt the sync file end to end (recommended)').isChecked())) throw new Error('End-to-end encryption is not enabled by default');
  await opt.getByLabel('Encryption passphrase').fill('a long e2e sync passphrase');
  await opt.getByLabel('Confirm passphrase').fill('a long e2e sync passphrase');
  await opt.getByRole('button', { name: 'Connect' }).click();
  await opt.waitForTimeout(1500);
  await opt.screenshot({ path: `${SHOTS}options-webdav.png`, fullPage: true });
  const created = JSON.parse(files.get(FILE)?.body ?? 'null');
  const status = await opt.locator('.notice').first().textContent({ timeout: 2000 }).catch(() => 'no status');
  // A second browser changes the encrypted payload; Sync now brings it here.
  const fromFirefox = await opt.evaluate(async ({ body, passphrase }) => {
    const decode = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
    const encode = (value) => btoa(String.fromCharCode(...new Uint8Array(value)));
    const old = JSON.parse(body).encryption;
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const oldKey = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: decode(old.salt), iterations: 600000 }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const data = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(old.iv) }, oldKey, decode(old.ciphertext))));
    data.personal += '$site=from-firefox.example,discard\n';
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)));
    return JSON.stringify({ anubis: 2, encryption: { algorithm: 'AES-GCM', kdf: 'PBKDF2-SHA-256', iterations: 600000, salt: encode(salt), iv: encode(iv), ciphertext: encode(ciphertext) } });
  }, { body: files.get(FILE).body, passphrase: 'a long e2e sync passphrase' });
  files.set(FILE, { body: fromFirefox, etag: `"${++version}"` });
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
  const remoteDepth = await opt.evaluate(async (body) => {
    const decode = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
    const envelope = JSON.parse(body).encryption;
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode('a long e2e sync passphrase'), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: decode(envelope.salt), iterations: 600000 }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const data = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, key, decode(envelope.ciphertext))));
    return data.settings.deeper;
  }, files.get(FILE).body);
  await opt.goto(`chrome-extension://${davId}/options.html#sync`);
  await opt.waitForTimeout(500);
  const newPassphrase = 'a newly changed e2e passphrase';
  await opt.locator('#webdav-new-passphrase').fill(newPassphrase);
  await opt.locator('#webdav-new-passphrase-confirm').fill(newPassphrase);
  await opt.getByRole('button', { name: 'Change encryption passphrase', exact: true }).click();
  await opt.waitForTimeout(1500);
  const rotated = await opt.evaluate(async ({ body, passphrase }) => {
    const decode = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
    const envelope = JSON.parse(body).encryption;
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: decode(envelope.salt), iterations: 600000 }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, key, decode(envelope.ciphertext))));
  }, { body: files.get(FILE).body, passphrase: newPassphrase });
  const rotationStatus = await opt.locator('.notice').last().textContent().catch(() => 'no status');
  const encryptedAfterRotation = JSON.parse(files.get(FILE).body).anubis === 2;
  console.log('\n== webdav:', JSON.stringify({
    requests: requests.join(' '),
    'encrypted file created': created?.anubis === 2,
    'server cannot read synced list': !files.get(FILE).body.includes('$site='),
    status,
    'site from the other browser shown': arrived > 0,
    'change here on the server': remoteDepth === 2,
    'rotation status': rotationStatus,
    'requests after rotation': requests.length,
    'rotated data': { format: rotated?.anubis, deeper: rotated?.settings?.deeper },
    'passphrase change re-encrypted the current file': encryptedAfterRotation && rotated?.anubis === 1 && rotated?.settings?.deeper === 2,
  }));
  if (!encryptedAfterRotation || rotated?.anubis !== 1 || rotated?.settings?.deeper !== 2) throw new Error('WebDAV passphrase change did not preserve and re-encrypt the sync data');
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
        // A result's button sits in the column past its left edge: take it in.
        const rects = selectors
          .flatMap((s) => [...document.querySelectorAll(s)].slice(0, 1))
          .flatMap((el) => [el, el.querySelector(':scope > anubis-weigh')].filter(Boolean))
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.width);
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
  // The summary as most people see it: with Remove, the default, a hidden site leaves
  // the page and the summary counts it. The rest keep the test settings' Collapse,
  // which the hidden line's picture shows.
  await setSettings({ hideStyle: 'remove' });
  for (const [scheme, suffix, query] of SCHEMES) {
    await browserScheme(scheme);
    await page.goto(`https://www.google.com/search?q=anubis${query}`);
    await page.waitForTimeout(700);
    await clip(`summary${suffix}`, ['anubis-summary', '[data-anubis-result]:has(a[href*="worldhistory"])']);
  }
  await setSettings({ hideStyle: 'collapse' });
  for (const [scheme, suffix, query] of SCHEMES) {
    await browserScheme(scheme);
    await page.goto(`https://www.google.com/search?q=anubis${query}`);
    await page.waitForTimeout(700);
    const wiki = page.locator('[data-anubis-result]', { hasText: 'Anubis - Wikipedia' });
    await wiki.hover();
    await page.waitForTimeout(200);
    await clip(`result${suffix}`, ['[data-anubis-result]:has(a[href*="wikipedia"])']);
    await clip(`hidden${suffix}`, ['[data-anubis-result]:has(anubis-bar)'], 10);

    await page.goto(`https://duckduckgo.com/?q=javascript+promises${query}`);
    await page.waitForTimeout(700);
    const target = page.locator('[data-anubis-result]', { hasText: 'The Modern JavaScript Tutorial' });
    await target.hover();
    await pressWeigh(target.locator('anubis-weigh'));
    await page.waitForTimeout(300);
    // A shot taken mid-fade shows the menu see-through over the results behind it.
    await page.evaluate(async () => {
      const pop = document.querySelector('anubis-popover')?.shadowRoot;
      await Promise.all((pop?.getAnimations?.({ subtree: true }) ?? []).map((a) => a.finished.catch(() => {})));
    });
    await clip(`menu${suffix}`,['anubis-popover', '[data-anubis-result]:has(a[href*="javascript.info"])'], 12);
    await page.keyboard.press('Escape');
  }
  await browserScheme(null);

  await setSettings({ cleanup: { ai: true, videos: true, questions: true, news: true, images: true, related: true } });
  for (const [, suffix, query] of SCHEMES) {
    await page.goto(`https://www.google.com/search?q=anubis&modules=1${query}`);
    await page.waitForTimeout(800);
    await clip(`cleanup-summary${suffix}`, ['anubis-summary']);
  }

  // A before and after, for the style guide and the slides below: the same search
  // with Anubis off, then on with clean-up, cut to the same box (the logo, the
  // search box and the results column).
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
  // The jackal without its tile, in the slide's text colour on its ground; the type is store/render.mjs's.
  const jackal = (c) =>
    logo
      .replace(/<rect[^>]*\/>/, '')
      .replace('<svg ', '<svg width="46" height="46" ')
      .replaceAll('fill="#e8e8ea"', `fill="${c.name}"`)
      .replace(/(<ellipse[^>]*fill=")[^"]*"/, `$1${c.ground}"`);
  const serif = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', 'Bitstream Charter', Charter, Georgia, serif`;
  const themes = {
    // Graphite, as the extension and its logo are drawn (assets/theme.css).
    light: { ground: '#fcfcfd', name: '#1f1f22', text: '#3a3a40', label: '#5f5f66', note: '#85858c', rule: '#c4c4ca', edge: '#dcdce0', suffix: '' },
    dark: { ground: '#1c1c1f', name: '#e8e8ea', text: '#e8e8ea', label: '#9d9da3', note: '#76767c', rule: '#4a4a50', edge: '#37373b', suffix: '-dark' },
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
          ${jackal(c)}
          <span style="color:${c.name};font-size:34px;line-height:1">Anubis</span>
          <span style="margin-left:14px;padding-left:18px;border-left:1px solid ${c.rule};font-size:19px;line-height:30px">Hide, rank, and tag search results</span>
          <span style="margin-left:auto;font-size:12px;color:${c.note}">Shown on a test page</span>
        </div>
        <div style="position:absolute;left:48px;right:48px;top:112px;display:grid;grid-template-columns:1fr 1fr;gap:32px">
          ${shot('Without Anubis', 'before', c.edge)}${shot('With Anubis', 'after', c.label)}
        </div>
      </body>`);
    await slide.screenshot({ path: fileURLToPath(new URL(`../docs/public/before-after-${theme}.png`, import.meta.url)) });
  }
  await slide.close();

  // Downloads fail inside the test browser, which would put "Failed to fetch" under
  // every list. Store the bundled lists as if just downloaded, as a user sees them.
  const bundled = Object.fromEntries(
    ['official-docs', 'discussions', 'reference', 'paywalls', 'foss-tools'].map((id) => [id, readFileSync(fileURLToPath(new URL(`../lists/${id}.anubis`, import.meta.url)), 'utf8')]),
  );
  await sw.evaluate(async (bundled) => {
    const listCache = {};
    for (const [id, text] of Object.entries(bundled)) listCache[`builtin:${id}`] = { text, fetchedAt: Date.now() };
    await chrome.storage.local.set({ listCache });
  }, bundled);
  const opt = await ctx.newPage();
  await opt.setViewportSize({ width: 1100, height: 760 });
  for (const [colorScheme, suffix] of SCHEMES) {
    await opt.emulateMedia({ colorScheme });
    for (const section of ['sites', 'tags', 'lists', 'cleanup', 'sync']) {
      await opt.goto(`chrome-extension://${extId}/options.html#${section}`);
      await opt.waitForTimeout(500);
      if (section === 'tags') await opt.getByRole('button', { name: 'Edit AI slop and its sites' }).click();
      await opt.screenshot({ path: `${DOCS_IMG}options-${section}${suffix}.png` });
    }
    if (colorScheme === SCHEMES[0][0]) {
      await sw.evaluate(async () => {
        const personal = (await chrome.storage.sync.get('personal.0'))['personal.0'];
        await chrome.storage.sync.set({ 'personal.0': `${personal}\n! tag: reference | Reference | #2b9aa0\n$site=wikipedia.org,tag=reference\n` });
      });
    }
    // The popup as it opens on an ordinary site. Opened as a page, its active tab
    // would be itself, so it's told the site's tab is the active one.
    const site = await ctx.newPage();
    await site.route('https://en.wikipedia.org/**', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Anubis</title><h1>Anubis</h1>' }));
    await site.goto('https://en.wikipedia.org/wiki/Anubis');
    const tabId = await sw.evaluate(async () => Math.max(...(await chrome.tabs.query({})).map((t) => t.id)));
    const sitePop = await ctx.newPage();
    await sitePop.setViewportSize({ width: 364, height: 600 });
    await sitePop.emulateMedia({ colorScheme });
    await sitePop.addInitScript((tab) => {
      const query = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = async (q) => (q.active ? [tab] : query(q));
    }, { id: tabId, url: 'https://en.wikipedia.org/wiki/Anubis' });
    await sitePop.goto(`chrome-extension://${extId}/popup.html`);
    await sitePop.waitForTimeout(900);
    await sitePop.screenshot({ path: `${DOCS_IMG}popup${suffix}.png` });
    await sitePop.close();
    await site.close();
  }
  await opt.close();
  console.log('\n== documentation screenshots saved to docs/img/');
}

if (only === 'popup-tags' || checks) {
  const site = await ctx.newPage();
  await site.route('https://tagging.example/**', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Tagging</title>' }));
  await site.goto('https://tagging.example/page');
  const sw = ctx.serviceWorkers()[0];
  if (!sw) throw new Error('Extension service worker is missing for popup tag checks.');
  const tabId = await sw.evaluate(async () => Math.max(...(await chrome.tabs.query({})).map((t) => t.id)));
  const popup = await ctx.newPage();
  await popup.setViewportSize({ width: 364, height: 620 });
  await popup.addInitScript(
    (tab) => {
      const query = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = async (q) => (q.active ? [tab] : query(q));
    },
    { id: tabId, url: 'https://tagging.example/page' },
  );
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  const tutorial = popup.locator('#here .tags button.tag').filter({ hasText: 'Great tutorial' });
  await tutorial.waitFor();
  const initiallyOff = await tutorial.getAttribute('aria-pressed') === 'false';
  const unselectedStyle = await tutorial.evaluate((el) => getComputedStyle(el).boxShadow);
  await tutorial.click();
  await popup.waitForFunction(() => {
    const button = [...document.querySelectorAll('#here .tags button[aria-pressed="true"]')].find((el) => el.textContent?.includes('Great tutorial'));
    return button && document.activeElement === button;
  });
  const selectedStyles = {};
  for (const scheme of ['light', 'dark']) {
    await popup.emulateMedia({ colorScheme: scheme });
    await popup.waitForFunction((theme) => document.documentElement.dataset.theme === theme, scheme);
    // The button on the page now: a re-render replaces it, and a replaced one has no computed style.
    selectedStyles[scheme] = await popup.evaluate(() => {
      const el = [...document.querySelectorAll('#here .tags button.tag')].find((b) => b.textContent?.includes('Great tutorial'));
      const style = el ? getComputedStyle(el) : undefined;
      return { weight: style?.fontWeight, underline: style?.boxShadow };
    });
  }
  // Your tags and those from lists are two groups, yours first, under Settings' names; "Great tutorial" is yours.
  const groups = await popup.evaluate(() =>
    [...document.querySelectorAll('#here .tag-group')].map((g) => ({
      name: g.querySelector('.tag-group-name')?.textContent,
      tags: [...g.querySelectorAll('.tag')].map((el) => el.textContent?.trim()),
    })),
  );
  assertChecks('popup tag groups', {
    yoursThenLists: groups.map((g) => g.name).join('|') === 'Your tags|Tags from lists',
    listsSayOnlyYourListChanges: !!(await popup.locator('#here .tag-group-hint').textContent())?.includes('only your list'),
    tutorialIsYours: !!groups[0]?.tags.some((tag) => tag?.startsWith('Great tutorial')),
    listTagsApart: !!groups[1]?.tags.some((tag) => tag?.startsWith('Official docs')) && !groups[0]?.tags.some((tag) => tag?.startsWith('Official docs')),
  });
  assertChecks('popup tag selection', {
    startsUnselected: initiallyOff,
    becomesSelected: (await tutorial.getAttribute('aria-pressed')) === 'true',
    selectedHasDistinctStyleInBothThemes: ['light', 'dark'].every(
      (scheme) =>
        selectedStyles[scheme].weight === '600' &&
        selectedStyles[scheme].underline !== 'none' &&
        selectedStyles[scheme].underline !== unselectedStyle,
    ),
  });

  const newTag = popup.getByRole('textbox', { name: 'New tag name' });
  await newTag.fill('!!!');
  await newTag.press('Enter');
  assertChecks('popup invalid tag name', {
    explained: (await popup.locator('#new-tag-error').textContent()) === 'Enter a tag name with at least one letter or number.',
    markedInvalid: (await newTag.getAttribute('aria-invalid')) === 'true',
  });
  await newTag.fill('Research Notes');
  // A change from elsewhere draws the popup again; what was typed has to survive it.
  await sw.evaluate(async () => {
    const { tagPrefs } = await chrome.storage.sync.get('tagPrefs');
    await chrome.storage.sync.set({ tagPrefs: { ...tagPrefs, 'e2e-redraw': {} } });
  });
  await popup.waitForTimeout(300);
  const typedSurvivesRedraw = (await newTag.inputValue()) === 'Research Notes';
  await newTag.press('Enter');
  const created = popup.locator('#here .tags button.tag').filter({ hasText: 'Research Notes' });
  await created.waitFor();
  await popup.waitForFunction(() => {
    const button = [...document.querySelectorAll('#here .tags button[aria-pressed="true"]')].find((el) => el.textContent?.includes('Research Notes'));
    return button && document.activeElement === button;
  });
  const noOverflow = {};
  for (const width of [320, 360, 390]) {
    await popup.setViewportSize({ width, height: 620 });
    noOverflow[width] = await popup.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  }
  assertChecks('popup tag creation', {
    typedSurvivesRedraw,
    createdAndApplied: (await created.getAttribute('aria-pressed')) === 'true',
    focusMovesToCreatedTag: await popup.evaluate(() => document.activeElement?.matches('#here .tags button.tag') && document.activeElement.textContent?.includes('Research Notes')),
    noHorizontalOverflow: Object.values(noOverflow).every(Boolean),
  });
  await popup.getByRole('textbox', { name: 'New tag name' }).fill('Research Notes');
  await popup.getByRole('textbox', { name: 'New tag name' }).press('Enter');
  assertChecks('popup duplicate tag name', {
    explained: (await popup.locator('#new-tag-error').textContent()) === 'That tag is already on this site.',
    markedInvalid: (await popup.getByRole('textbox', { name: 'New tag name' }).getAttribute('aria-invalid')) === 'true',
  });

  await popup.close();
  await site.close();
  console.log('\n== popup tag selection and creation passed');
}

if (only === 'tag-notes') {
  const options = await ctx.newPage();
  await options.goto(`chrome-extension://${extId}/options.html#tags`);
  await options.getByRole('button', { name: 'Edit Great tutorial and its sites' }).click();
  const site = options.getByRole('textbox', { name: 'Sites to tag Great tutorial' });
  const reason = options.getByRole('textbox', { name: 'Why this site fits the “Great tutorial” tag (optional)' });
  // Settings redraws as the lists finish loading, which replaces the field and can
  // leave a handle measuring a detached one: measure whichever field is on the page.
  const reasonHeight = await options
    .waitForFunction(() => {
      const label = [...document.querySelectorAll('label.field')].find((l) => l.textContent?.startsWith('Why this site fits the “Great tutorial” tag'));
      return label?.querySelector('input')?.getBoundingClientRect().height || false;
    })
    .then((height) => height.jsonValue());
  const note = 'The project publishes its first-party tutorials here.';
  const worker = ctx.serviceWorkers()[0];
  if (!worker) throw new Error('Extension service worker is missing for tag-note checks.');
  await site.fill('tutorial-source.example.com');
  await reason.fill(note);
  // A change from elsewhere while typing makes Settings wait to render until the field loses
  // focus; that late render of the older list must not keep the added site from showing.
  await worker.evaluate(async () => {
    const { tagPrefs } = await chrome.storage.sync.get('tagPrefs');
    await chrome.storage.sync.set({ tagPrefs: { ...tagPrefs, 'e2e-pending': {} } });
  });
  await options.waitForTimeout(200);
  await site.press('Enter');
  await options.waitForFunction((value) => [...document.querySelectorAll('.site-note')].some((el) => el.textContent === value), `Great tutorial: ${note}`, { timeout: 5000 });
  await options.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Sites to tag Great tutorial');
  await site.fill('unannotated.example.com');
  await site.press('Enter');
  await options.waitForFunction(() => [...document.querySelectorAll('.tagged-site')].some((el) => el.textContent?.includes('unannotated.example.com')));
  const personal = await worker.evaluate(async () => (await chrome.storage.local.get('personalCopy')).personalCopy.text);
  const overflow = {};
  for (const scheme of ['light', 'dark']) {
    await options.emulateMedia({ colorScheme: scheme });
    await options.waitForFunction((theme) => document.documentElement.dataset.theme === theme, scheme);
    for (const width of [320, 360, 390]) {
      await options.setViewportSize({ width, height: 760 });
      overflow[`${scheme}-${width}`] = await options.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
    }
  }
  assertChecks('tag site explanation', {
    optionalField: await reason.isVisible(),
    reasonIsSingleLine: reasonHeight <= 40,
    commentStoredWithRule: personal.includes('$site=tutorial-source.example.com,tag=tutorial # Great tutorial: The project publishes its first-party tutorials here.'),
    descriptionIsOptional: personal.includes('$site=unannotated.example.com,tag=tutorial\n') && !personal.includes('$site=unannotated.example.com,tag=tutorial #'),
    explanationShownUnderSite: await options.locator('.site-note').textContent() === `Great tutorial: ${note}`,
    noHorizontalOverflow: Object.values(overflow).every(Boolean),
  });
  await options.close();
  console.log('\n== tag-site explanations passed');
}

if (!only || only === 'suggest-changes' || checks) {
  // Settings → Lists: Suggest changes sits beside a list that takes suggestions,
  // where its file's link used to be, and opens a short form that turns into a
  // filled-in issue. The tracker is a mock; nothing reaches GitHub.
  await ctx.route(/^https:\/\/github\.com\//, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Issue</title>' }));
  const options = await ctx.newPage();
  await options.setViewportSize({ width: 320, height: 800 });
  await options.goto(`chrome-extension://${extId}/options.html#lists`);
  const button = options.getByRole('button', { name: 'Suggest changes to Official docs', exact: true });
  await button.waitFor({ timeout: 5000 });
  const noFileLink = (await options.getByRole('link', { name: /^View / }).count()) === 0;
  await button.click();
  const form = options.locator('.suggest-form');
  await form.waitFor({ timeout: 3000 });
  const expanded = (await button.getAttribute('aria-expanded')) === 'true';
  const site = form.getByRole('textbox', { name: 'Site' });
  const focused = await site.evaluate((el) => el === document.activeElement);
  const fits = await options.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  await options.screenshot({ path: `${SHOTS}options-suggest-changes.png`, fullPage: true });
  await form.getByRole('button', { name: 'Open the issue' }).click();
  const asksForSite = ((await form.locator('.notice.error').textContent()) ?? '').includes('Type a site');
  await site.fill('https://www.go.dev/doc/');
  await form.getByRole('combobox', { name: 'What should change' }).selectOption({ label: 'Tag it “Official docs”' });
  await form.getByRole('textbox', { name: 'Why (optional)' }).fill('The Go docs.');
  const [issue] = await Promise.all([ctx.waitForEvent('page'), form.getByRole('button', { name: 'Open the issue' }).click()]);
  const url = new URL(issue.url());
  await issue.close();
  const body = url.searchParams.get('body') ?? '';
  const closed = (await options.locator('.suggest-form').count()) === 0;
  assertChecks('suggesting changes to a list', {
    noFileLink,
    opensForm: expanded,
    focusesSite: focused,
    fitsAt320: fits,
    asksForSite,
    opensTracker: url.pathname === '/Bishop-V/anubis/issues/new',
    titleNamesChange: url.searchParams.get('title') === 'Tag go.dev “Official docs”',
    bodyHasInstruction: body.includes('$site=go.dev,tag=docs') && body.includes('**Why:** The Go docs.'),
    closesAfter: closed,
  });
  await options.setViewportSize({ width: 1180, height: 900 });
  await button.click();
  await options.locator('.suggest-form').waitFor({ timeout: 3000 });
  await options.screenshot({ path: `${SHOTS}options-suggest-changes-wide.png` });
  await ctx.unroute(/^https:\/\/github\.com\//);
  await options.close();
  console.log('\n== suggesting changes to a list passed');
}

if (!only || only === 'settings-undo' || checks) {
  // Settings never asks "Are you sure?": a browser can be told to stop showing a
  // page's dialogs, and confirm() then answers "no" at once, so a delete button did
  // nothing. Deleting acts and offers Undo. Every dialog is dismissed here, as a
  // suppressed one would be.
  const options = await ctx.newPage();
  let dialogs = 0;
  options.on('dialog', (d) => {
    dialogs++;
    void d.dismiss();
  });
  const worker = ctx.serviceWorkers()[0];
  const stored = (key) => worker.evaluate(async (k) => (await chrome.storage.sync.get(k))[k], key);
  const undoFocused = () => options.waitForFunction(() => document.activeElement?.hasAttribute('data-undo'), null, { timeout: 5000 }).then(() => true, () => false);
  const undo = async () => {
    await options.locator('[data-undo]').click();
    await options.waitForTimeout(400);
  };

  await options.goto(`chrome-extension://${extId}/options.html#tags`);
  await options.getByRole('button', { name: 'Delete “Great tutorial”' }).click();
  await options.waitForTimeout(400);
  const tagGone = (await options.getByRole('button', { name: 'Edit Great tutorial and its sites' }).count()) === 0;
  const tagNotice = (await options.locator('.notice:has([data-undo])').textContent()) ?? '';
  const tagFocus = await undoFocused();
  await undo();
  const tagBack = (await options.getByRole('button', { name: 'Edit Great tutorial and its sites' }).count()) === 1;

  await options.goto(`chrome-extension://${extId}/options.html#lists`);
  const subsBefore = await worker.evaluate(async () => (await chrome.storage.sync.get('subscriptions')).subscriptions ?? null);
  const unsubscribe = options.getByRole('button', { name: /^Unsubscribe from / }).first();
  const listName = ((await unsubscribe.getAttribute('aria-label')) ?? '').replace('Unsubscribe from ', '');
  await unsubscribe.click();
  await options.waitForTimeout(400);
  const listGone = (await options.getByRole('button', { name: `Unsubscribe from ${listName}`, exact: true }).count()) === 0;
  const listFocus = await undoFocused();
  await undo();
  const listBack = (await options.getByRole('button', { name: `Unsubscribe from ${listName}`, exact: true }).count()) === 1;
  const subsAfter = await worker.evaluate(async () => (await chrome.storage.sync.get('subscriptions')).subscriptions ?? null);

  await options.goto(`chrome-extension://${extId}/options.html#share`);
  const settingsBefore = await stored('settings');
  await options.getByRole('button', { name: 'Reset settings' }).click();
  await options.waitForTimeout(400);
  const reset = (await stored('settings'))?.hideStyle !== settingsBefore.hideStyle;
  const resetFocus = await undoFocused();
  await undo();
  const settingsBack = JSON.stringify(await stored('settings')) === JSON.stringify(settingsBefore);

  assertChecks('deleting in Settings with dialogs suppressed', {
    noDialogs: dialogs === 0,
    tagDeleted: tagGone,
    tagNoticeSaysWhat: tagNotice.includes('Deleted the tag “Great tutorial”'),
    tagUndoFocused: tagFocus,
    tagUndone: tagBack,
    listUnsubscribed: listGone,
    listUndoFocused: listFocus,
    listUndone: listBack && (subsBefore === null ? subsAfter !== null : subsAfter?.length === subsBefore.length),
    settingsReset: reset,
    resetUndoFocused: resetFocus,
    resetUndone: settingsBack,
  });
  await options.close();
  console.log('\n== deleting in Settings with Undo passed');
}

await ctx.close();
