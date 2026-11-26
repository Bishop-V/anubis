import { html } from '@inglorious/web';
import { unsafeHTML } from '@inglorious/web/directives/unsafe-html';
import { ICON, LEVELS, rankIcon, WEIGH } from '../../docs/.vitepress/theme/demo-icons.ts';
import {
  HIDE_RESULTS, PAYWALL, RANK_RESULTS, RANK_STEPS, REFERENCE,
  SCROLL_ITEMS, SCROLL_RANKED, SCROLL_SHORT, SCROLL_STEPS, SCROLL_SUMMARY,
} from '../../docs/.vitepress/theme/demo-data.ts';
import { href, pageLink } from './navigation.js';

const stores = {
  firefox: 'https://addons.mozilla.org/addon/anubis-search/',
  chrome: 'https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi',
};
const hidingSteps = [{ id: 'fandom', level: 'hide', said: 'Hid fandom.com.' }];

const fold = (open, className, content) => html`<div class=${'fold ' + className + (open ? ' open' : '')}>
  <div class="fold-inner">${content}</div>
</div>`;

const tag = ({ name, color }, count) => html`
  <span class="demo-tag" style=${'--c:' + color}><span class="diamond"></span>${name}${count ? ' ' + count : ''}</span>
`;

function resultRow(result, { level = 'normal', hidden = false, active = false, badge, demo = false } = {}) {
  const [background, color, letter] = result.icon;
  return html`<div class=${'demo-result' + (demo ? ' rd-result' : '') + (level === 'pin' ? ' pinned' : '')}>
    ${fold(!hidden, 'full', html`
      <div class="site">
        <span data-weigh=${result.id} class=${'demo-col ' + level + (active ? ' active' : '')}>${unsafeHTML(WEIGH[level])}</span>
        <span class="favicon" style=${'background:' + background + ';color:' + color}>${letter}</span>
        <span class="site-name">${result.site}</span><span class="url">${result.url}</span>
      </div>
      <div class="title">${result.title}</div>
      ${badge ? fold(true, 'chips', tag(badge)) : ''}
      <div class="snippet">${result.snippet}</div>
    `)}
  </div>`;
}

const panels = {
  news: ['cards', 'card'],
  questions: ['', 'question'],
  videos: ['videos', 'video'],
  discussions: ['', 'thread'],
  images: ['tiles', 'tile'],
};

function cleanupPanel(block, step) {
  const [group, item] = panels[block.kind] ?? ['sources', 'source'];
  return fold(step < 2, 'demo-block', html`
    <div class="block-heading">${block.heading}</div>
    ${block.kind === 'ai' ? html`<p class="snippet">${block.lines[0]}</p>` : ''}
    <div class=${group}>${(block.kind === 'ai' ? block.meta : block.lines).map((line, i) => html`
      <span class=${item}>
        ${block.kind === 'news' ? html`<span class="card-image"></span>` : ''}
        ${block.kind === 'videos' ? html`<span class="thumb"><span class="length">${block.meta?.[i]}</span></span>` : ''}
        ${block.kind === 'news' ? html`<span class="card-source">${block.meta?.[i]}</span>` : ''}
        <span class=${block.kind === 'news' ? 'card-title' : ''}>${line}</span>
      </span>
    `)}</div>
  `);
}

function scrollStage(step) {
  return html`<div class="demo-page" aria-hidden="true">
    <div class="searchbar"><span>anubis</span><span class="lens"></span></div>
    <div class="tabs">${['All', 'Images', 'Videos', 'News', 'Maps', 'More'].map((name, i) => html`<span class=${i === 0 ? 'current' : ''}>${name}</span>`)}</div>
    ${fold(step >= 2, 'demo-summary', html`
      <p><span class="long">${SCROLL_SUMMARY[step]} <span class="demo-link">Show hidden</span></span>
        <span class="short">${SCROLL_SHORT[step]} <span class="demo-link">Show hidden</span> <span class="demo-link">Details</span></span></p>
      ${fold(step >= 5, 'summary-tags', [tag(REFERENCE, 3), tag(PAYWALL, 1)])}
    `)}
    <div class="demo-results">
      ${SCROLL_ITEMS.map((item, index) => html`<div class="demo-item" style=${'order:' + (step < 4 ? index : SCROLL_RANKED.indexOf(item.id))}>
        ${'heading' in item ? cleanupPanel(item, step) : resultRow(item, {
          level: step >= 4 ? item.pinned ? 'pin' : item.raised ? 'raise' : item.lowered ? 'lower' : 'normal' : 'normal',
          hidden: item.hidden && step >= 3,
          badge: step >= 5 ? item.tag : undefined,
        })}
      </div>`)}
    </div>
  </div>`;
}

export function homeView({ intro, highlights, closing }, step) {
  return html`<main id="content" class="home">
    <div class="scroll-demo">
      <section class=${'demo-intro' + (step === 1 ? ' active' : '')}>
        <h1 class="home-title">${intro.title}</h1><p class="home-lead">${intro.lead}</p>
        <div class="home-actions">
          ${Object.entries(stores).map(([store, address]) => html`<a class=${'home-button brand install install-' + store} href=${address}>${intro.install[store]}</a>`)}
          ${intro.actions.map(({ text, link, brand }) => html`<a data-external class=${'home-button' + (brand ? ' brand' : '')} href=${href(link)}>${text}</a>`)}
        </div>
        <p class="demo-cue"><span class="arrow" aria-hidden="true">↓</span> Scroll, and watch Anubis tidy up this search</p>
      </section>
      <div class="demo-stage">${scrollStage(step)}</div>
      <div class="demo-track">
        <div class="demo-rail" aria-hidden="true"><span class="demo-rail-fill"></span></div>
        <ol class="demo-steps" aria-label="What Anubis does to a search">
          ${SCROLL_STEPS.map(({ title, text }, i) => html`<li
            class=${'demo-step' + (step >= i + 2 ? ' reached' : '') + (step === i + 2 ? ' active' : '')}
            aria-current=${step === i + 2 ? 'step' : 'false'}>
            <h2><span class="demo-marker" aria-hidden="true"></span><span class="demo-step-title">${title}</span></h2><p>${text}</p>
          </li>`)}
        </ol>
      </div>
    </div>
    <section class="home-highlights" aria-label="What else Anubis does">
      ${highlights.map(({ title, details, link, linkText }) => html`<div class="home-highlight">
        <h2>${title}</h2><p>${details}</p>${pageLink(linkText, link)}
      </div>`)}
    </section>
    <section class="home-closing"><div class="home-closing-inner">
      <h2>${closing.title}</h2><div>${closing.details.map((text) => html`<p>${text}</p>`)}${pageLink(closing.linkText, closing.link)}</div>
    </div></section>
  </main>`;
}

export function startScrollDemo(emit) {
  const track = document.querySelector('.demo-track');
  const headings = [...track.querySelectorAll('h2')];
  const rail = track.querySelector('.demo-rail');
  const fill = track.querySelector('.demo-rail-fill');
  let frame = 0;
  let lastStep = 1;
  const update = () => {
    frame = 0;
    const line = innerHeight * (innerWidth >= 960 ? 0.55 : 0.8);
    const top = track.getBoundingClientRect().top;
    const first = headings[0].getBoundingClientRect().top + 14;
    const last = headings.at(-1).getBoundingClientRect().top + 14;
    rail.style.top = first - top + 'px';
    rail.style.height = last - first + 'px';
    fill.style.height = Math.min(Math.max(line - first, 0), last - first) + 'px';
    const step = 1 + headings.filter((el) => el.getBoundingClientRect().top < line).length;
    if (step !== lastStep) emit('scrollChanged', lastStep = step);
  };
  const scroll = () => { frame ||= requestAnimationFrame(update); };
  addEventListener('scroll', scroll, { passive: true });
  addEventListener('resize', scroll, { passive: true });
  update();
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const blankDemo = () => ({ levels: {}, menu: null, selected: null, said: '', done: false, pointer: null });

function pointAt(target, stage) {
  const rect = target?.getBoundingClientRect();
  const origin = stage.getBoundingClientRect();
  return rect ? { x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top } : null;
}

export async function playDemo(kind, emit) {
  const stage = document.querySelector('.hd-stage');
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  emit('demoStarted');
  await delay(400);
  for (const step of kind === 'ranking' ? RANK_STEPS : hidingSteps) {
    const anchor = stage.querySelector('[data-weigh=' + step.id + ']');
    const point = pointAt(anchor, stage);
    if (motion) emit('pointerMoved', point);
    await delay(motion ? 800 : 400);
    emit('demoOpened', { id: step.id, top: point ? point.y + 20 : 32 });
    await delay(motion ? 650 : 350);
    if (motion) emit('pointerMoved', pointAt(stage.querySelector('[data-rank=' + step.level + ']'), stage));
    emit('rankSelected', step.level);
    await delay(motion ? 700 : 450);
    emit('demoRanked', step);
    await delay(motion ? 800 : 350);
  }
  emit('demoFinished');
}

function rankMenu({ menu, selected }, results) {
  if (!menu) return '';
  const site = results.find(({ id }) => id === menu.id)?.site;
  return html`<div class="hd-menu below" style=${'left:8px;top:' + menu.top + 'px;width:min(340px, calc(100% - 16px));--arrow-x:22px'} aria-hidden="true">
    <div class="hd-head"><span class="hd-name">${site}</span><span class="hd-close">${unsafeHTML(ICON.close)}</span></div>
    <div class="ssx-demo-balance">${unsafeHTML(WEIGH[selected ?? 'normal'])}</div>
    <div class="hd-levels">${LEVELS.map(([level, label]) => html`<span data-rank=${level} class=${'hd-level ' + level + (selected === level ? ' pressed' : '')}>
      <span class="hd-level-icon">${unsafeHTML(rankIcon(level, selected === level ? 1 : 0))}</span>${label}
    </span>`)}</div>
    <p class="hd-hint">Your choice for this site, on every search.</p>
  </div>`;
}

export function guideDemo(kind, demo, replay) {
  const rank = kind === 'ranking';
  const results = rank ? RANK_RESULTS : HIDE_RESULTS;
  const order = { pin: -1, lower: 1 };
  const ordered = [...results].sort((a, b) => (order[demo.levels[a.id]] ?? 0) - (order[demo.levels[b.id]] ?? 0));
  const pinned = Object.values(demo.levels).includes('pin');
  const lowered = Object.values(demo.levels).includes('lower');
  const sentence = rank
    ? pinned ? 'Anubis pinned 1' + (lowered ? ' and lowered 1' : '') + ' of 4 results.' : 'Anubis left all 4 results as they were.'
    : 'Anubis raised 1 and hid ' + (demo.levels.fandom ? 3 : 2) + ' of 7 results.';
  return html`<figure class=${'hide-demo' + (rank ? ' rank-demo' : '')} data-guide-demo>
    <div class="hd-stage" aria-hidden="true">
      <div class="demo-page hd-page">
        <div class="demo-summary hd-summary"><p>${sentence} ${unsafeHTML(ICON.gear)}</p>
          ${fold(!!demo.said, 'hd-change', html`${demo.said} <span class="demo-link">Undo</span>`)}
          <div class="summary-tags hd-tags">${tag(REFERENCE, 2)}</div>
        </div>
        <div class="demo-results">${ordered.map((result) => resultRow(result, {
          demo: true,
          level: demo.levels[result.id] ?? (result.chip === 'raised' ? 'raise' : 'normal'),
          hidden: demo.levels[result.id] === 'hide',
          active: demo.menu?.id === result.id,
          badge: result.tag ? { name: result.tag[0], color: result.tag[1] } : result.chip ? REFERENCE : undefined,
        }))}</div>
      </div>
      ${rankMenu(demo, results)}
      <span class=${'hd-pointer' + (demo.pointer ? ' shown' : '')} style=${demo.pointer ? 'transform:translate(' + demo.pointer.x + 'px,' + demo.pointer.y + 'px)' : ''}>
        <svg viewBox="0 0 16 22" width="16" height="22" aria-hidden="true"><path d="M1 1v17l4.4-4.2 3 6.6 2.8-1.3-3-6.4H14z" fill="#fff" stroke="#1c1c1f" stroke-width="1.4"></path></svg>
      </span>
    </div>
    <figcaption class="caption hd-caption">
      ${rank ? 'Pinning one site and lowering another from the button beside each result.' : 'Hiding a site from the button beside its result.'}
      <button type="button" class="hd-replay" ?disabled=${!demo.done} @click=${replay}>Play again</button>
    </figcaption>
  </figure>`;
}
