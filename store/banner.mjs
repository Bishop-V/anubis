// Renders store/banner.gif, the animated 1200×600 banner: the logo and tagline on the
// left, and on the right a small example search page where a pointer opens the result
// menu on a notes site and hides it, then opens it on the encyclopedia and pins it.
// The menu copies the real one (entrypoints/content/shadow.css, utils/balance.ts,
// utils/icons.ts) in Graphite's dark scheme; the hidden result stays grey, never red.
// Needs Chromium (Playwright) and ffmpeg:
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

const FPS = 25;
// The timeline below is written in story time; SLOW stretches it for viewing.
const SLOW = 1.7;
const SECONDS = 10.4 * SLOW;
const W = 1200;
const H = 600;
// The example page is drawn at the extension's own sizes, then scaled up to fill the right.
const SCALE = 1.26;

const logo = readFileSync(here('../public/anubis.svg'), 'utf8');
const jackal = logo.replace(/<rect[^>]*\/>/, '').replace('<svg ', '<svg width="150" height="150" ');
const serif = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', 'Bitstream Charter', Charter, Georgia, serif`;

// The icons from utils/icons.ts.
const svg = (body) =>
  `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const HIDE = svg('<path d="M2 8s2.2-4.5 6-4.5c1.3 0 2.4.5 3.3 1.1M14 8s-2.2 4.5-6 4.5c-1.3 0-2.4-.5-3.3-1.1"/><path d="M2.5 13.5l11-11"/>');
const LOWER = svg('<path d="M4 3.5l4 4 4-4" stroke="#76767c"/><path d="M4 8.5l4 4 4-4"/>');
const RAISE = svg('<path d="M4 7.5l4-4 4 4"/><path d="M4 12.5l4-4 4 4" stroke="#76767c"/>');
const FEATHER = svg('<path d="M13 3C7.5 3.5 4.5 7 4 13"/><path d="M13 3c.3 4.5-2.8 8-7.2 8.6M7.5 8.5l3-.5M6 11l3.5-.4"/>');
const PIN = svg('<path d="M9.8 2.2l4 4-1.6.5-2.6 2.6.3 3.1-1.2 1.2L5.4 10.3 2.2 13.8M5.4 10.3L2.3 7.2l1.2-1.2 3.1.3 2.6-2.6z"/>');
const CLOSE = svg('<path d="M4 4l8 8M12 4l-8 8"/>');
const SEARCH = svg('<circle cx="7" cy="7" r="4.5"/><path d="M10.4 10.4L14 14"/>');
const NORMAL_BTN = svg('<path d="M8 3.2v9.6M5.5 13.2h5"/><path d="M2.6 5L13.4 5"/><path d="M2.6 5L1.2 8.6M2.6 5L4 8.6M13.4 5L12 8.6M13.4 5l1.4 3.6"/><path d="M1 8.6h3.2a1.6 1.6 0 0 1-3.2 0zM11.8 8.6H15a1.6 1.6 0 0 1-3.2 0z"/>');
const BALANCE = `<svg class="balance" viewBox="0 0 132 40" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M66 7v28M56 37h20"/><circle cx="66" cy="5" r="1.6" fill="currentColor" stroke="none"/>
  <g class="beam" style="transform-origin: 66px 9px; transform-box: view-box"><path d="M14 9h104"/></g>
  <g class="pan left"><path d="M14 9 7 24M14 9l7 15"/><path d="M4 24h20a10 5 0 0 1-20 0z" fill="currentColor" fill-opacity=".14"/>
    <path d="M14 21.5c-1.8-1.6-3.2-2.6-3.2-4a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 1.4-1.4 2.4-3.2 4z" fill="currentColor" stroke="none"/></g>
  <g class="pan right"><path d="M118 9l-7 15M118 9l7 15"/><path d="M108 24h20a10 5 0 0 1-20 0z" fill="currentColor" fill-opacity=".14"/>
    <path d="M115 22.5c1.5-3.5 3.5-5.8 6-7-.3 3.2-2.4 5.6-6 7zM116.4 20.6l2.4-.4"/></g>
</svg>`;
const POINTER = `<svg width="22" height="26" viewBox="0 0 22 26"><path d="M2 2v19l5-4.6 3.4 7.4 3.4-1.6-3.4-7.2H17z" fill="#e8e8ea" stroke="#1c1c1f" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

const result = (id, site, title, snippet) => `
  <div class="result" id="${id}">
    <div class="btn">${NORMAL_BTN}</div>
    <div class="full">
      <div class="site"><span class="fav">${site[0].toUpperCase()}</span>${site}</div>
      <div class="title">${title}</div>
      <div class="snip">${snippet}</div>
    </div>
    <div class="fold">${site} hidden</div>
  </div>`;

const html = `<!doctype html><meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #1c1c1f;
    color: #e8e8ea; font-family: Inter, system-ui, sans-serif; position: relative; }
  .brand { position: absolute; left: 60px; top: 0; bottom: 0; width: 330px;
    display: flex; flex-direction: column; justify-content: center; }
  .brand svg { display: block; margin-left: -14px; margin-bottom: 8px; }
  .name { font-family: ${serif}; font-size: 82px; line-height: 1; letter-spacing: 0.01em; }
  .rule { margin: 22px 0 20px; height: 2px; width: 220px; background: #9d9da3; opacity: 0.45; }
  .tag { font-family: ${serif}; font-size: 29px; line-height: 1.28; }
  .engines { margin-top: 14px; font-family: ${serif}; font-size: 18px; line-height: 1.4; color: #9d9da3; }

  .stage { position: absolute; left: 418px; top: 26px; width: 600px; height: 436px;
    transform: scale(${SCALE}); transform-origin: 0 0; }
  .page { position: absolute; inset: 0; background: #232326; border: 1px solid #37373b;
    border-radius: 12px; overflow: hidden; }
  .query { position: absolute; left: 56px; right: 24px; top: 18px; height: 36px;
    border: 1px solid #4a4a50; border-radius: 6px; display: flex; align-items: center; gap: 10px;
    padding: 0 12px; font-size: 14px; color: #e8e8ea; }
  .query svg { color: #9d9da3; width: 14px; height: 14px; }
  .summary { position: absolute; left: 56px; right: 24px; top: 68px; height: 20px; font-size: 13px;
    color: #9d9da3; }
  .summary div { position: absolute; inset: 0; display: flex; gap: 12px; }
  .summary u { color: #e8e8ea; text-decoration-thickness: 1px; text-underline-offset: 3px; }
  .result { position: absolute; left: 0; right: 0; height: 92px; }
  .result .btn { position: absolute; left: 14px; top: 4px; width: 28px; height: 28px; border-radius: 50%;
    display: grid; place-items: center; color: #9d9da3; }
  .result .btn svg { position: absolute; }
  .full { position: absolute; left: 56px; right: 24px; top: 0; }
  .site { font-size: 12.5px; color: #9d9da3; display: flex; align-items: center; gap: 8px; height: 36px; }
  .fav { width: 16px; height: 16px; border-radius: 50%; background: #37373b; display: grid; place-items: center;
    font-size: 9.5px; font-weight: 600; color: #e8e8ea; }
  .title { margin-top: -6px; font-size: 17px; line-height: 1.3; color: #e8e8ea; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .snip { margin-top: 4px; font-size: 13px; color: #9d9da3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fold { position: absolute; left: 56px; top: 0; height: 36px; display: flex; align-items: center;
    font-size: 12.5px; color: #9d9da3; opacity: 0; }
  .frame { position: absolute; left: 49px; right: 17px; border: 1px solid rgba(232,232,234,0.4);
    border-radius: 10px; }

  .menu { position: absolute; left: 6px; width: 340px; background: #232326; border: 1px solid #37373b;
    border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4);
    font-size: 12.5px; color: #e8e8ea; }
  .menu .arrow { position: absolute; left: 16px; width: 12px; height: 12px; background: #232326;
    border: 1px solid #37373b; transform: rotate(45deg); }
  .menu.below .arrow { top: -7px; border-right: 0; border-bottom: 0; }
  .menu.above .arrow { bottom: -7px; border-left: 0; border-top: 0; }
  .cartouche { display: flex; justify-content: space-between; align-items: center; padding: 12px 12px 0 16px;
    font-size: 13px; font-weight: 600; }
  .cartouche svg { color: #9d9da3; width: 14px; height: 14px; }
  .balance { display: block; width: 112px; height: 34px; margin: 4px auto 2px; color: #9d9da3; overflow: visible; }
  .levels { display: flex; gap: 2px; margin: 4px 10px 0; }
  .levels .sep { flex: none; width: 1px; margin: 6px 4px; background: #37373b; }
  .level { flex: 1 1 0; display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 6px 0 5px; border-radius: 8px; color: #9d9da3; font-size: 11.5px; }
  .level svg { width: 15px; height: 15px; color: #76767c; }
  .level.hover { background: rgba(255,255,255,0.09); color: #e8e8ea; }
  .level.on { background: rgba(255,255,255,0.09); box-shadow: inset 0 0 0 1px #4a4a50; color: #e8e8ea; }
  .level.on svg { color: #e8e8ea; }
  .hint { position: relative; height: 16px; margin: 6px 14px 10px; font-size: 12px; color: #9d9da3; }
  .hint div { position: absolute; inset: 0; text-align: center; }
  .menu-tags { padding: 10px 14px 12px; border-top: 1px solid #37373b; font-size: 13px; font-weight: 600; }

  .pointer { position: absolute; left: 0; top: 0; transform-origin: 2px 2px; }
</style>
<div class="brand">
  ${jackal}
  <div class="name">Anubis</div>
  <div class="rule"></div>
  <div class="tag">Hide, rank, and tag<br>search results</div>
  <div class="engines">On Google, DuckDuckGo, Bing,<br>Brave Search, and more</div>
</div>
<div class="stage" id="stage">
  <div class="page">
    <div class="query">${SEARCH}trolley problem</div>
    <div class="summary">
      <div id="sum0">Anubis left all 4 results as they were.</div>
      <div id="sum1">Hid studocu.com.<u>Undo</u></div>
      <div id="sum2">Pinned plato.stanford.edu.<u>Undo</u></div>
    </div>
    <div class="frame" id="frame"></div>
    ${result('farm', 'studocu.com', 'Trolley Problem - Ethics Lecture Notes - Studocu', 'Notes from PHIL 101, week 4. Sign up or upload a document to read the full text.')}
    ${result('forum', 'youtube.com', 'Would You Pull the Lever? The Trolley Problem Explained', 'Five people, one lever, and a very hard choice. Here’s why this thought experiment won’t go away.')}
    ${result('docs', 'plato.stanford.edu', 'Doing vs. Allowing Harm (Stanford Encyclopedia of Philosophy)', 'Is it worse to kill someone than to let them die? The trolley problem is one of the cases philosophers use to ask.')}
    ${result('notes', 'en.wikipedia.org', 'Trolley problem - Wikipedia', 'The trolley problem is a series of thought experiments in ethics about whether to sacrifice one person to save a larger number.')}
  </div>
  <div class="menu" id="menu">
    <div class="arrow"></div>
    <div class="cartouche"><span id="mname">studocu.com</span>${CLOSE}</div>
    ${BALANCE}
    <div class="levels">
      <div class="level" id="l-hide">${HIDE}Hide</div><div class="sep"></div>
      <div class="level" id="l-lower">${LOWER}Lower</div>
      <div class="level" id="l-normal">${FEATHER}Normal</div>
      <div class="level" id="l-raise">${RAISE}Raise</div><div class="sep"></div>
      <div class="level" id="l-pin">${PIN}Pin</div>
    </div>
    <div class="hint"><div id="hint0">Your choice applies on every search.</div><div id="hint1"></div></div>
    <div class="menu-tags">+ Tag</div>
  </div>
  <div class="pointer" id="pointer">${POINTER}</div>
</div>
<script>
  const $ = (id) => document.getElementById(id);
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const span = (t, a, b) => ease((t - a) / (b - a));
  const lin = (t, a, b) => clamp((t - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  // A balance swinging to rest: overshoots once, like the real one's springy transition.
  const swing = (t, a) => { const x = clamp((t - a) / 0.6); return x === 0 ? 0 : 1 - Math.exp(-6 * x) * Math.cos(9 * x); };
  const ARM = 52;
  const tilt = (deg) => {
    const r = deg * Math.PI / 180, dy = ARM * Math.sin(r), dx = ARM * (1 - Math.cos(r));
    document.querySelector('.beam').style.transform = 'rotate(' + deg + 'deg)';
    document.querySelector('.pan.left').style.transform = 'translate(' + dx + 'px,' + (-dy) + 'px)';
    document.querySelector('.pan.right').style.transform = 'translate(' + (-dx) + 'px,' + dy + 'px)';
  };
  const ICONS = { hide: ${JSON.stringify(HIDE)}, pin: ${JSON.stringify(PIN)}, normal: ${JSON.stringify(NORMAL_BTN)} };
  const setBtn = (id, a, b, k) => {
    const btn = $(id).querySelector('.btn');
    const want = '<span style="opacity:' + (1 - k) + '">' + ICONS[a] + '</span><span style="opacity:' + k + '">' + ICONS[b] + '</span>';
    if (btn.innerHTML !== want) btn.innerHTML = want;
    btn.querySelectorAll('span').forEach((s) => (s.style.cssText += ';position:absolute;inset:0;display:grid;place-items:center'));
  };

  // Where things sit, in the page's own pixels.
  const TOP = 100, FULL = 92, FOLDED = 36;
  // The pointer's path: [time, x, y].
  const PATH = [
    [0, 560, 420], [0.5, 560, 420], [1.3, 30, 20 + TOP], [1.8, 30, 20 + TOP], [2.5, 46, 228], [3.2, 46, 228],
    [4.3, 30, 18 + TOP + FOLDED + FULL], [4.5, 30, 18 + TOP + FOLDED + FULL], [5.2, 300, 128], [6.6, 300, 128],
    [8.4, 560, 420], [10.4, 560, 420],
  ];
  const pointerAt = (t) => {
    for (let i = 1; i < PATH.length; i++) {
      const [t1, x1, y1] = PATH[i], [t0, x0, y0] = PATH[i - 1];
      if (t <= t1) { const k = ease((t - t0) / (t1 - t0 || 1)); return [mix(x0, x1, k), mix(y0, y1, k)]; }
    }
    return PATH[PATH.length - 1].slice(1);
  };
  const press = (t, at) => (t >= at && t < at + 0.16 ? 0.86 : 1);

  window.frame = (t) => {
    // The loop: the page fades out and back in at the start.
    const out = span(t, 9.6, 9.9), back = span(t, 9.9, 10.3);
    $('stage').style.opacity = t < 9.9 ? 1 - out : back;
    if (t >= 9.9) t = 0;

    const [px, py] = pointerAt(t);
    const clicks = [1.4, 2.6, 4.6, 6.0];
    const s = clicks.reduce((m, c) => Math.min(m, press(t, c)), 1);
    $('pointer').style.transform = 'translate(' + px + 'px,' + py + 'px) scale(' + s + ')';
    $('pointer').style.opacity = 1 - span(t, 8.0, 8.4) + span(t, 0, 0.3) * 0 ;

    // Hide on the content farm: the menu opens below it (no room above), Hide is chosen,
    // the balance sinks, the menu closes, and the result folds into one line.
    const m1 = span(t, 1.4, 1.52) * (1 - span(t, 3.3, 3.42));
    // Pin on the encyclopedia: the menu opens above it, Pin is chosen, it rises to the top.
    const m2 = span(t, 4.6, 4.72) * (1 - span(t, 6.6, 6.72));
    const fold = span(t, 3.5, 4.1), rise = span(t, 6.9, 7.7);

    const menu = $('menu');
    const first = t < 4.0;
    menu.className = 'menu ' + (first ? 'below' : 'above');
    menu.style.opacity = first ? m1 : m2;
    menu.style.transform = 'translateY(' + (first ? 4 * (1 - m1) : -4 * (1 - m2)) + 'px)';
    $('mname').textContent = first ? 'studocu.com' : 'plato.stanford.edu';
    const docsTop = TOP + mix(2 * FULL, FOLDED + FULL, fold);
    if (first) { menu.style.top = (TOP + 4 + 28 + 10) + 'px'; menu.style.bottom = ''; }
    else { menu.style.top = ''; menu.style.bottom = (436 - (docsTop + 4) + 10) + 'px'; }

    const hovering = (id, a, b) => $(id).classList.toggle('hover', t >= a && t < b);
    hovering('l-hide', 2.4, 2.6); hovering('l-pin', 5.1, 6.0);
    $('l-hide').classList.toggle('on', first && t >= 2.6);
    $('l-pin').classList.toggle('on', !first && t >= 6.0);
    const chosen = first ? t >= 2.6 : t >= 6.0;
    $('hint0').style.opacity = chosen ? 0 : 1;
    $('hint1').style.opacity = chosen ? 1 : 0;
    $('hint1').textContent = 'Your choice for ' + (first ? 'studocu.com' : 'plato.stanford.edu') + ', on every search.';
    tilt(first ? -13 * swing(t, 2.6) : 13 * swing(t, 6.0));

    // The buttons on each result: a fill while their menu is open.
    $('farm').querySelector('.btn').style.background = 'rgba(255,255,255,' + 0.09 * m1 + ')';
    $('docs').querySelector('.btn').style.background = 'rgba(255,255,255,' + 0.09 * m2 + ')';
    setBtn('farm', 'normal', 'hide', fold);
    setBtn('docs', 'normal', 'pin', rise);

    // The results' places: farm, forum, docs, then docs pinned above them.
    const farmH = mix(FULL, FOLDED, fold);
    const farmTop = TOP + rise * FULL;
    const forumTop = TOP + farmH + rise * FULL;
    const dTop = mix(TOP + farmH + FULL, TOP, rise);
    $('farm').style.top = farmTop + 'px';
    $('forum').style.top = forumTop + 'px';
    $('docs').style.top = dTop + 'px';
    $('notes').style.top = (TOP + farmH + 2 * FULL) + 'px';
    $('farm').querySelector('.full').style.opacity = 1 - fold;
    $('farm').querySelector('.fold').style.opacity = fold;
    $('frame').style.top = (dTop - 6) + 'px';
    $('frame').style.height = (FULL - 6) + 'px';
    $('frame').style.opacity = rise;

    // The summary says what changed.
    $('sum0').style.opacity = 1 - fold;
    $('sum1').style.opacity = fold * (1 - rise);
    $('sum2').style.opacity = rise;
  };
</script>`;

const dir = mkdtempSync(join(tmpdir(), 'anubis-banner-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html);
const frames = Math.round(FPS * SECONDS);
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.frame(t), i / FPS / SLOW);
  await page.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.png`) });
}
await browser.close();

const out = here('banner.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'),
  '-vf', 'split[a][b];[a]palettegen=max_colors=96:stats_mode=full[p];[b][p]paletteuse=dither=none',
  '-loop', '0', out]);
rmSync(dir, { recursive: true, force: true });
console.log('store/banner.gif');
