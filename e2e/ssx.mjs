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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
  page.setDefaultTimeout(15_000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.demoAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (this.matches('.demo-item, .rd-result, .hd-ripple')) {
        window.demoAnimations.push({
          kind: this.matches('.demo-item') ? 'home' : this.matches('.rd-result') ? 'rank' : 'click',
          row: this.dataset.demoRow, translation: keyframes[0].translate,
        });
      }
      return animate.call(this, keyframes, options);
    };
  });
  await page.goto(url);
  await page.getByRole('heading', { level: 1, name: 'Hide, rank, and tag search results' }).waitFor();
  await page.locator('.demo-step').last().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.demo-step[aria-current="step"]')?.textContent.includes('Know before you click'));
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  const wordmark = await page.locator('.site-brand').evaluate((el) => getComputedStyle(el).fontFamily);
  assert.match(wordmark, /Iowan Old Style/, 'the site wordmark uses the Anubis display family');
  const alignment = await page.evaluate(() => {
    const box = (selector) => document.querySelector(selector).getBoundingClientRect();
    const middle = (rect) => (rect.top + rect.bottom) / 2;
    return {
      stage: middle(box('.demo-stage')),
      intro: (box('.home-title').top + box('.demo-cue').bottom) / 2,
      window: (box('.site-header').bottom + innerHeight) / 2,
    };
  });
  assert.ok(Math.abs(alignment.stage - alignment.intro) <= 1, 'intro is centered beside the demo');
  assert.ok(Math.abs(alignment.stage - alignment.window) <= 1, 'demo is centered below the header');
  if (screenshots) await page.screenshot({ path: join(shotDir, 'home.png'), animations: 'disabled' });
  const menuToggle = page.locator('.site-menu-toggle');
  const menu = page.locator('#site-menu');
  const openMenu = () => menuToggle.click();
  const palette = () => page.evaluate(() => {
    const color = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
    return {
      page: color('body', 'backgroundColor'), text: color('body', 'color'), line: color('.demo-rail', 'backgroundColor'),
      marker: color('.demo-marker', 'backgroundColor'), nav: color('.site-header', 'backgroundColor'),
      font: [...document.fonts].some((face) => face.family.includes('Inter Variable') && face.status === 'loaded')
        && color('body', 'fontFamily').includes('Inter Variable'),
    };
  });
  assert.deepEqual(await palette(), {
    page: 'rgb(252, 252, 253)', text: 'rgb(31, 31, 34)', line: 'rgb(220, 220, 224)',
    marker: 'rgb(252, 252, 253)', nav: 'rgb(252, 252, 253)', font: true,
  });
  assert.equal(await page.getByRole('button', { name: 'Search', exact: true }).count(), 0, 'utility actions belong inside the menu');
  await openMenu();
  const theme = menu.getByRole('switch', { name: 'Appearance' });
  await theme.click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  assert.equal(await theme.getAttribute('aria-checked'), 'true');
  assert.deepEqual(await palette(), {
    page: 'rgb(28, 28, 31)', text: 'rgb(232, 232, 234)', line: 'rgb(55, 55, 59)',
    marker: 'rgb(28, 28, 31)', nav: 'rgb(28, 28, 31)', font: true,
  });
  if (screenshots) await page.screenshot({ path: join(shotDir, 'home-menu-dark.png'), animations: 'disabled' });
  await page.reload();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  await openMenu();
  assert.equal(await theme.getAttribute('aria-checked'), 'true');
  await theme.click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.evaluate(() => localStorage.removeItem('anubis-docs-theme'));
  await page.keyboard.press('Escape');
  await menu.waitFor({ state: 'hidden' });
  await openMenu();
  await menu.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search guides' }).fill('hidden results');
  await page.locator('.search-results a[href$="#hidden-results"]').first().waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#site-search').waitFor({ state: 'hidden' });
  assert.ok(await menuToggle.evaluate((el) => el === document.activeElement), 'closing search restores menu focus');
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox', { name: 'Search guides' }).waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#site-search').waitFor({ state: 'hidden' });
  await page.goto(url + 'guide/ranking#hidden-results');
  assert.equal(await page.locator('h2#hidden-results').count(), 1);
  const demo = page.locator('.rank-demo');
  await demo.scrollIntoViewIfNeeded();
  const ready = demo.locator('button:enabled');
  await ready.waitFor();
  assert.equal(await demo.locator('.demo-results > :first-child.pinned').count(), 1);
  assert.equal(await demo.locator('.demo-results > :last-child .demo-col.lower').count(), 1);
  await ready.click();
  await demo.locator('button:disabled').waitFor();
  await ready.waitFor();
  assert.deepEqual(await page.evaluate(() => window.demoAnimations), []);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(url);
  await page.locator('.demo-step h2').nth(2).evaluate((heading) => {
    scrollTo(0, scrollY + heading.getBoundingClientRect().top - innerHeight * 0.45);
  });
  await page.waitForFunction(() => window.demoAnimations.some((motion) => motion.kind === 'home'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  assert.equal(await page.locator('.demo-step.active .demo-marker').evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(157, 157, 163)');
  if (screenshots) await page.screenshot({ path: join(shotDir, 'home-steps-dark.png'), animations: 'disabled' });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(url + 'guide/ranking');
  await demo.scrollIntoViewIfNeeded();
  await demo.locator('.hd-menu .hd-balance').waitFor({ state: 'attached' });
  assert.equal(await demo.locator('.hd-menu .hd-tilt').count(), 3);
  if (screenshots) await demo.screenshot({ path: join(shotDir, 'ranking-menu.png') });
  await page.waitForFunction(() => {
    const beam = document.querySelector('.hd-menu .hd-tilt');
    return beam?.style.transform === 'rotate(13deg)';
  });
  await ready.waitFor();
  const rankingMotion = await page.evaluate(() => window.demoAnimations);
  assert.ok(rankingMotion.some(({ kind }) => kind === 'click'), 'pointer clicks use Inglorious Motion');
  assert.ok(rankingMotion.some(({ row, translation }) => row === 'met' && parseFloat(translation.split(' ')[1]) > 100), 'the pinned row slides from its old position');
  assert.ok(rankingMotion.some(({ row, translation }) => row === 'pinterest' && parseFloat(translation.split(' ')[1]) < -20), 'the lowered row slides down');
  assert.ok(rankingMotion.some(({ row }) => row === 'brit'), 'neighboring rows move out of the way');
  assert.equal(await demo.locator('.demo-results > :first-child.pinned').count(), 1);
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
  await openMenu();
  await page.locator('.language-menu summary').click();
  await page.getByRole('link', { name: 'Deutsch', exact: true }).click();
  await page.waitForURL('**/de/guide/ranking');
  await openMenu();
  await menu.getByRole('button', { name: 'Suchen', exact: true }).click();
  const searchInput = page.getByRole('searchbox', { name: 'Anleitungen durchsuchen' });
  assert.match(await searchInput.evaluate((el) => getComputedStyle(el).fontFamily), /Inter Variable/);
  await searchInput.fill('einstufen');
  const germanResult = page.locator('.search-results a').first();
  await germanResult.waitFor();
  assert.match(await germanResult.getAttribute('href'), /^\/anubis\/de\//);
  if (screenshots) await page.locator('#site-search').screenshot({ path: join(shotDir, 'search-de.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await page.locator('#site-search').waitFor({ state: 'hidden' });
  await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Listen (auf Englisch)', exact: true }).click();
  await page.waitForURL('**/lists');
  for (const [folder, family] of [['zh-cn', 'PingFang SC'], ['zh-tw', 'PingFang TC']]) {
    await page.goto(url + folder + '/');
    const bodyFont = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily);
    assert.ok(bodyFont.includes(family), folder + ' has its own fallback for Chinese glyphs');
  }

  for (const mode of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: mode });
    for (const width of [320, 360, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['', 'guide/ranking', 'de/guide/ranking', 'vi/', 'zh-cn/', 'zh-tw/', 'lists']) {
        await page.goto(url + route);
        await page.locator('main h1').waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route + ' at ' + width + ' in ' + mode);
      }
      await openMenu();
      const box = await menu.boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= width, 'open menu fits at ' + width);
      await menu.getByRole('link', { name: 'Wiki', exact: true }).waitFor();
      if (mode === 'dark' && width === 320 && screenshots) await page.screenshot({ path: join(shotDir, 'menu-mobile-dark.png'), animations: 'disabled' });
      await page.keyboard.press('Escape');
      await menu.waitFor({ state: 'hidden' });
    }
  }
  if (screenshots) await page.screenshot({ path: join(shotDir, 'lists-mobile.png'), fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, []);
  console.log('All ' + pages.length + ' pages in five languages passed, including the utility menu, Graphite palette, search, motion, Subscribe, and responsive layout.');
} finally {
  await browser?.close();
  server.close();
}
