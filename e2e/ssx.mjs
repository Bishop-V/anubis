// Build with npm --prefix site run build before running this check.
import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { chromium } from 'playwright-core';
import { builtResource, builtSite } from './ssx-site.mjs';
import { TRANSLATED_PAGES, WIKI_FOLDERS } from '../utils/links.ts';

const output = join(builtSite, 'anubis');
const screenshots = process.argv.includes('--screenshots');
const shotDir = join(output, 'screenshots');
if (screenshots) mkdirSync(shotDir, { recursive: true });
const folders = Object.values(WIKI_FOLDERS);
const pages = readdirSync(output, { recursive: true }).filter((path) => path.endsWith('index.html'));
assert.ok(pages.length > 20, 'the preview includes all English wiki pages');

const documents = new Map(pages.map((file) => {
  const path = '/anubis/' + file.replace(/\/?index\.html$/, '');
  const document = parseHTML(readFileSync(join(output, file), 'utf8')).document;
  const folder = path.split('/')[2];
  const [lang] = Intl.getCanonicalLocales(folders.includes(folder) ? folder : 'en');
  assert.equal(document.documentElement.lang, lang, path);
  assert.ok(document.querySelector('main h1')?.textContent, path + ' must contain readable HTML');
  return [path, document];
}));
for (const folder of folders) {
  for (const route of TRANSLATED_PAGES) assert.ok(documents.has('/anubis/' + folder + (route ? '/' + route : '')), folder + '/' + route);
}
for (const [path, document] of documents) {
  for (const node of document.querySelectorAll('a[href], main img[src]')) {
    const address = new URL(node.getAttribute('href') ?? node.getAttribute('src'), 'https://example.test' + path);
    if (address.origin !== 'https://example.test') continue;
    assert.ok(builtResource(address.pathname), path + ' links to ' + address.pathname);
    if (!address.hash) continue;
    const target = documents.get(address.pathname.replace(/(.+)\/$/, '$1')) ?? document;
    assert.ok(target.getElementById(decodeURIComponent(address.hash.slice(1))), path + ' links to ' + address.pathname + address.hash);
  }
}

const server = createServer((request, response) => {
  const resource = builtResource(new URL(request.url, 'http://localhost').pathname);
  if (!resource) return response.writeHead(404).end();
  response.writeHead(200, { 'content-type': resource.contentType }).end(readFileSync(resource.path));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = 'http://127.0.0.1:' + server.address().port + '/anubis/';
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? chromium.executablePath() });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15_000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.rankAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (this.matches('.rank-motion')) window.rankAnimations.push(this.dataset.motionId);
      return animate.call(this, keyframes, options);
    };
  });
  await page.goto(url);
  await page.getByRole('heading', { level: 1, name: 'Hide, rank, and tag search results' }).waitFor();
  await page.locator('.demo-step').last().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.demo-step[aria-current="step"]')?.textContent.includes('Know before you click'));
  await page.evaluate(() => scrollTo(0, 0));
  if (screenshots) await page.screenshot({ path: join(shotDir, 'home.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search guides' }).fill('hidden results');
  await page.locator('.search-results a[href$="#hidden-results"]').first().waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#site-search').waitFor({ state: 'hidden' });
  await page.goto(url + 'guide/ranking#hidden-results');
  assert.equal(await page.locator('h2#hidden-results').count(), 1);
  const demo = page.locator('.rank-demo');
  await demo.scrollIntoViewIfNeeded();
  const ready = demo.locator('button:enabled');
  await ready.waitFor();
  assert.equal(await demo.locator('.demo-results > :first-child .pinned').count(), 1);
  assert.equal(await demo.locator('.demo-results > :last-child .demo-col.lower').count(), 1);
  await ready.click();
  await demo.locator('button:disabled').waitFor();
  await ready.waitFor();
  assert.deepEqual(await page.evaluate(() => window.rankAnimations), []);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(url + 'guide/ranking');
  await demo.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.rankAnimations.some((id) => id.startsWith('ranking-')));
  await ready.waitFor();
  assert.equal(await demo.locator('.demo-results > :first-child .pinned').count(), 1);
  for (const mode of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' });
    await page.goto(url + 'guide/ranking');
    await demo.scrollIntoViewIfNeeded();
    await ready.waitFor();
    const [pin, ...scales] = await demo.locator('.demo-col svg').evaluateAll((icons) => icons.map((icon) => getComputedStyle(icon).color));
    const [text, muted] = mode === 'light' ? ['rgb(31, 31, 34)', 'rgb(95, 95, 102)'] : ['rgb(232, 232, 234)', 'rgb(157, 157, 163)'];
    assert.equal(pin, text);
    assert.deepEqual(scales, [muted, muted, muted]);
    assert.equal(await demo.locator('.site-name').first().evaluate((el) => getComputedStyle(el).color), text);
    assert.equal(await demo.locator('.snippet').first().evaluate((el) => getComputedStyle(el).color), muted);
    if (screenshots) await demo.screenshot({ path: join(shotDir, 'ranking-' + mode + '.png'), animations: 'disabled' });
  }
  await page.goto(url + 'guide/introduction');
  const hiding = page.locator('.hide-demo');
  await hiding.scrollIntoViewIfNeeded();
  await hiding.locator('button:enabled').waitFor();
  assert.match(await hiding.locator('.hd-change').innerText(), /Hid fandom\.com/);

  await page.goto(url + 'lists');
  const rows = page.locator('.list-directory tbody tr');
  const count = await rows.count();
  assert.ok(count > 5);
  await page.getByRole('searchbox', { name: 'Filter lists' }).fill('paywall');
  await page.waitForFunction((total) => {
    const found = document.querySelectorAll('.list-directory tbody tr').length;
    return found > 0 && found < total;
  }, count);
  const subscribe = rows.first().getByRole('link', { name: /^Subscribe to/ });
  const address = await subscribe.getAttribute('href');
  const sameOrigin = new URL(address, url);
  assert.equal(sameOrigin.pathname, '/anubis/subscribe');
  await subscribe.click();
  await page.waitForURL('**/subscribe?**');
  await page.locator('.list-address a').waitFor();
  assert.equal(await page.locator('.list-address a').getAttribute('href'), sameOrigin.searchParams.get('url'));
  await page.goto(url + 'subscribe?url=javascript%3Aalert(1)');
  await page.getByText('This link doesn’t name a list Anubis can subscribe to.', { exact: false }).waitFor();
  await page.goto(url + 'subscribe?url=https%3A%2F%2Fexample.org%2Flist&name=%3Cb%3Eexample%3C%2Fb%3E');
  await page.getByText('<b>example</b>', { exact: true }).waitFor();
  assert.equal(await page.locator('main b').count(), 0);

  await page.goto(url + 'guide/ranking');
  await page.locator('.language-menu summary').click();
  await page.getByRole('link', { name: 'Deutsch', exact: true }).click();
  await page.waitForURL('**/de/guide/ranking');
  await page.getByRole('button', { name: 'Suchen', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Anleitungen durchsuchen' }).fill('einstufen');
  const germanResult = page.locator('.search-results a').first();
  await germanResult.waitFor();
  assert.match(await germanResult.getAttribute('href'), /^\/anubis\/de\//);
  if (screenshots) await page.locator('#site-search').screenshot({ path: join(shotDir, 'search-de.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await page.locator('#site-search').waitFor({ state: 'hidden' });
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Listen (auf Englisch)', exact: true }).click();
  await page.waitForURL('**/lists');

  for (const mode of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: mode });
    for (const width of [320, 360, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['', 'guide/ranking', 'de/guide/ranking', 'vi/', 'zh-cn/', 'zh-tw/', 'lists']) {
        await page.goto(url + route);
        await page.locator('main h1').waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route + ' at ' + width + ' in ' + mode);
      }
    }
  }
  if (screenshots) await page.screenshot({ path: join(shotDir, 'lists-mobile.png'), fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, []);
  console.log('All ' + pages.length + ' pages in five languages passed, including local links, search, motion, Subscribe, and responsive layout.');
} finally {
  await browser?.close();
  server.close();
}
