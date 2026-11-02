// Renders store/banner.gif, the animated 1400×560 banner: an example search page where
// Anubis hides a content farm, pins the documentation, and lowers a copied-answers site,
// then starts again. Graphite throughout (assets/theme.css); the hidden result stays
// grey, never red. Needs Chromium (Playwright) and ffmpeg:
//
//   node store/banner.mjs

import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

const FPS = 20;
const SECONDS = 8;
const W = 1400;
const H = 560;

const logo = readFileSync(here('../public/anubis.svg'), 'utf8');
const jackal = logo.replace(/<rect[^>]*\/>/, '').replace('<svg ', '<svg width="210" height="210" ');
const serif = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', 'Bitstream Charter', Charter, Georgia, serif`;

const html = `<!doctype html><meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #1c1c1f;
    color: #e8e8ea; font-family: Inter, system-ui, sans-serif; position: relative; }
  .brand { position: absolute; left: 84px; top: 0; bottom: 0; width: 470px;
    display: flex; flex-direction: column; justify-content: center; }
  .brand svg { display: block; margin-left: -18px; margin-bottom: 6px; }
  .name { font-family: ${serif}; font-size: 104px; line-height: 1; letter-spacing: 0.01em; }
  .rule { margin: 26px 0 22px; height: 2px; width: 300px; background: #9d9da3; opacity: 0.45; }
  .tag { font-family: ${serif}; font-size: 33px; line-height: 1.3; }
  .engines { margin-top: 14px; font-family: ${serif}; font-size: 20px; color: #9d9da3; }

  .page { position: absolute; left: 640px; top: 56px; width: 680px; height: 448px;
    background: #232326; border: 1px solid #37373b; border-radius: 12px; overflow: hidden; }
  .query { position: absolute; left: 28px; right: 28px; top: 24px; height: 44px;
    border: 1px solid #4a4a50; border-radius: 6px; display: flex; align-items: center;
    padding: 0 16px; font-size: 18px; color: #e8e8ea; }
  .query::before { content: ''; width: 13px; height: 13px; border: 2px solid #9d9da3;
    border-radius: 50%; margin-right: 12px; }
  .row { position: absolute; left: 16px; right: 16px; height: 76px; padding: 12px 16px;
    border: 1px solid transparent; border-radius: 10px; }
  .row .site { font-size: 14px; color: #9d9da3; display: flex; align-items: center; gap: 10px; }
  .row .dot { width: 18px; height: 18px; border-radius: 50%; background: #37373b; }
  .row .title { margin-top: 6px; font-size: 20px; line-height: 1.3; white-space: nowrap; }
  .chip { position: absolute; right: 16px; top: 22px; padding: 4px 12px; font-size: 15px;
    border: 1px solid #4a4a50; border-radius: 8px; color: #e8e8ea; background: #1c1c1f; }
  .summary { position: absolute; left: 32px; right: 32px; bottom: 22px; font-size: 15px;
    color: #9d9da3; display: flex; gap: 14px; }
  .summary u { color: #e8e8ea; text-underline-offset: 3px; }
</style>
<div class="brand">
  ${jackal}
  <div class="name">Anubis</div>
  <div class="rule"></div>
  <div class="tag">Hide, rank, and tag search results</div>
  <div class="engines">On Google, DuckDuckGo, Bing, Brave Search, and more</div>
</div>
<div class="page">
  <div class="query">sort a list in python</div>
  <div class="row" id="farm"><div class="site"><span class="dot"></span>seo-farm.example</div>
    <div class="title">Top 10 ways to sort a list (updated for 2026)</div><div class="chip">Hide</div></div>
  <div class="row" id="copy"><div class="site"><span class="dot"></span>copied-answers.example</div>
    <div class="title">Python sort list: answers from around the web</div><div class="chip">Lower</div></div>
  <div class="row" id="forum"><div class="site"><span class="dot"></span>forum.example</div>
    <div class="title">Sorting a list of dictionaries by a key</div></div>
  <div class="row" id="docs"><div class="site"><span class="dot"></span>docs.example</div>
    <div class="title">Sorting techniques: the official guide</div><div class="chip">Pin</div></div>
  <div class="summary" id="summary"><span>Anubis hid 1 result.</span><u>Show hidden</u></div>
</div>
<script>
  const TOP = 92, STEP = 86;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const span = (t, a, b) => ease((t - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const el = (id) => document.getElementById(id);
  const chip = (id) => el(id).querySelector('.chip');

  window.frame = (t) => {
    // 0.6–1.2 Hide is chosen; 1.4–2.1 the content farm folds away and the summary appears.
    const hideTag = span(t, 0.6, 1.0), fold = span(t, 1.4, 2.1);
    // 2.6–3.0 Pin is chosen; 3.2–4.0 the documentation rises to the top, framed.
    const pinTag = span(t, 2.6, 3.0), rise = span(t, 3.2, 4.0);
    // 4.5–4.9 Lower is chosen; 5.1–5.8 the copied answers sink and dim.
    const lowTag = span(t, 4.5, 4.9), sink = span(t, 5.1, 5.8);
    // 7.3–8.0 everything returns to the start, so the loop is seamless.
    const back = span(t, 7.3, 8.0);

    // Slot positions, as fractions of a slot: farm, copy, forum, docs.
    let farm = 0, copy = mix(1, 0, fold), forum = mix(2, 1, fold), docs = mix(3, 2, fold);
    docs = mix(docs, 0, rise); copy = mix(copy, 1, rise); forum = mix(forum, 2, rise);
    copy = mix(copy, 2, sink); forum = mix(forum, 1, sink);
    const at = (id, slot) => { el(id).style.top = (TOP + mix(slot, [0, 1, 2, 3][['farm','copy','forum','docs'].indexOf(id)], back) * STEP) + 'px'; };
    at('farm', farm); at('copy', copy); at('forum', forum); at('docs', docs);

    const farmOut = fold * (1 - back);
    el('farm').style.opacity = 1 - farmOut;
    el('farm').style.transform = 'scaleY(' + (1 - 0.4 * farmOut) + ')';
    chip('farm').style.opacity = hideTag * (1 - back);

    el('summary').style.opacity = farmOut;

    const framed = rise * (1 - back);
    el('docs').style.borderColor = 'rgba(157,157,163,' + (0.55 * framed) + ')';
    el('docs').style.background = 'rgba(255,255,255,' + (0.04 * framed) + ')';
    chip('docs').style.opacity = pinTag * (1 - back);

    const dim = sink * (1 - back);
    el('copy').style.opacity = 1 - 0.5 * dim;
    chip('copy').style.opacity = lowTag * (1 - back);
  };
</script>`;

const dir = mkdtempSync(join(tmpdir(), 'anubis-banner-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html);
const frames = FPS * SECONDS;
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.frame(t), i / FPS);
  await page.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.png`) });
}
await browser.close();

const out = here('banner.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'),
  '-vf', 'split[a][b];[a]palettegen=max_colors=64:stats_mode=full[p];[b][p]paletteuse=dither=none',
  '-loop', '0', out]);
rmSync(dir, { recursive: true, force: true });
console.log('store/banner.gif');
