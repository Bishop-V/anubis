import { withMotion } from '@inglorious/motion';
import { html } from '@inglorious/web';
import { repeat } from '@inglorious/web/directives/repeat';
import { unsafeHTML } from '@inglorious/web/directives/unsafe-html';
import { ICON, LEVELS, rankIcon, SPARKLE, TAG_MARKS, WEIGH } from '../../docs/.vitepress/theme/demo-icons.ts';
import {
  HIDE_RESULTS, PAYWALL, RANK_RESULTS, RANK_STEPS, REFERENCE,
  SCROLL_ITEMS, SCROLL_RANKED, SCROLL_SHORT, SCROLL_STEPS, SCROLL_SUMMARY,
} from '../../docs/.vitepress/theme/demo-data.ts';
import { balancePosition, placeMenu } from '../../docs/.vitepress/theme/demo-geometry.ts';
import { href, pageLink } from './navigation.js';

const stores = {
  firefox: 'https://addons.mozilla.org/addon/anubis-search/',
  chrome: 'https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi',
};
const hidingSteps = [{ id: 'fandom', level: 'hide', said: 'Hid fandom.com.' }];

const fold = (open, className, content) => html`<div class=${'fold ' + className + (open ? ' open' : '')}>
  <div class="fold-inner">${content}</div>
</div>`;

const tag = ({ name, color }, count, effect) => html`
  <span class="demo-tag" style=${'--c:' + color}>
    ${effect ? html`<span class="mark">${unsafeHTML(TAG_MARKS[effect])}</span>` : html`<span class="diamond"></span>`}${name}${count ? ' ' + count : ''}
  </span>
`;

function resultRow(result, { level = 'normal', hidden = false, active = false, badge, rank = false, guide = false, showBadge = false } = {}) {
  const [background, color, letter] = result.icon;
  const badgeMark = badge ? tag(badge, undefined, ['raise', 'lower'].includes(level) ? level : undefined) : '';
  const content = html`
    <div class="site">
      <span data-weigh=${result.id} class=${'demo-col ' + level + (active ? ' active' : '')}>${unsafeHTML(WEIGH[level])}</span>
      <span class="favicon" style=${'background:' + background + ';color:' + color}>${letter}</span>
      <span class="site-name">${result.site}</span><span class="url">${result.url}</span>
    </div>
    <div class="title">${result.title}</div>
    ${guide ? badge && html`<div class="hd-chips">${badgeMark}</div>` : fold(showBadge, 'chips', badgeMark)}
    <div class="snippet">${result.snippet}</div>
  `;
  return html`<div data-demo-row=${result.id} class=${'demo-result' + (rank ? ' rd-result' : '') + (level === 'pin' ? ' pinned' : '')}>
    ${rank ? content : fold(!hidden, 'full', content)}
  </div>`;
}

const cursorClick = withMotion({
  animateOnMount: false,
  classPrefix: 'hd-ripple',
  variants: {
    click: { frames: [{ opacity: 0.9, transform: 'scale(0.3)' }, { opacity: 0, transform: 'scale(1.6)' }], options: { duration: 500, easing: 'ease-out' } },
  },
})({ render: () => '' });

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rowAnimations = new WeakMap();

// Measure the current screen position, then let the same DOM row glide into its new
// position. Cancel an interrupted glide after measuring it so reversing scroll is smooth.
function moveRows(group, selector, update) {
  if (reducedMotion()) return update();
  const rows = [...group.querySelectorAll(selector)];
  const origin = group.getBoundingClientRect().top;
  const before = rows.map((row) => row.getBoundingClientRect().top - origin);
  update();
  const destination = group.getBoundingClientRect().top;
  for (const [index, row] of rows.entries()) {
    rowAnimations.get(row)?.cancel();
    const shift = before[index] - (row.getBoundingClientRect().top - destination);
    if (Math.abs(shift) < 1) continue;
    rowAnimations.set(row, row.animate(
      [{ translate: `0 ${shift}px` }, { translate: '0 0' }],
      { duration: 700, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' },
    ));
  }
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
    <div class="block-heading">${block.kind === 'ai' ? html`<span class="sparkle">${unsafeHTML(SPARKLE)}</span>` : ''}${block.heading}</div>
    ${block.kind === 'ai' ? html`<p class="snippet">${block.lines[0]}</p>` : ''}
    <div class=${group}>${(block.kind === 'ai' ? block.meta : block.lines).map((line, i) => html`
      <div class=${item}>
        ${block.kind === 'news' ? html`<span class="card-image"></span>` : ''}
        ${block.kind === 'videos' ? html`<span class="thumb"><span class="length">${block.meta?.[i]}</span></span>` : ''}
        ${block.kind === 'news' ? html`<span class="card-source">${block.meta?.[i]}</span>` : ''}
        ${block.kind === 'discussions' ? html`<span class="forum">${block.meta?.[i]}</span><span class="thread-title">${line}</span>`
          : block.kind === 'images' ? '' : html`<span class=${block.kind === 'news' ? 'card-title' : ''}>${line}</span>`}
      </div>
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
      ${repeat(SCROLL_ITEMS, (item) => item.id, (item, index) => html`<div
        class=${'demo-item' + (item.raised ? ' lifted' : '')} style=${'order:' + (step < 4 ? index : SCROLL_RANKED.indexOf(item.id))}>
        ${'heading' in item ? cleanupPanel(item, step) : resultRow(item, {
          level: step >= 4 ? item.pinned ? 'pin' : item.raised ? 'raise' : item.lowered ? 'lower' : 'normal' : 'normal',
          hidden: item.hidden && step >= 3,
          badge: item.tag,
          showBadge: step >= 5 && !!item.tag,
        })}
      </div>`)}
    </div>
  </div>`;
}

export function homeView({ intro, highlights, closing, demo, highlightsLabel }, step) {
  return html`<main id="content" class="home">
    <div class="scroll-demo">
      <section class=${'demo-intro' + (step === 1 ? ' active' : '')}>
        <h1 class="home-title">${intro.title}</h1><p class="home-lead">${intro.lead}</p>
        <div class="home-actions">
          ${Object.entries(stores).map(([store, address]) => html`<a class=${'home-button brand install install-' + store} href=${address}>${intro.install[store]}</a>`)}
          ${intro.actions.map(({ text, link, brand }) => html`<a data-external class=${'home-button' + (brand ? ' brand' : '')} href=${href(link)}>${text}</a>`)}
        </div>
        <p class="demo-cue"><span class="arrow" aria-hidden="true">↓</span> ${demo?.cue ?? 'Scroll, and watch Anubis tidy up this search'}</p>
      </section>
      <div class="demo-stage">${scrollStage(step)}</div>
      <div class="demo-track">
        <div class="demo-rail" aria-hidden="true"><span class="demo-rail-fill"></span></div>
        <ol class="demo-steps" aria-label=${demo?.label ?? 'What Anubis does to a search'}>
          ${(demo?.steps ?? SCROLL_STEPS).map(({ title, text }, i) => html`<li
            class=${'demo-step' + (step >= i + 2 ? ' reached' : '') + (step === i + 2 ? ' active' : '')}
            aria-current=${step === i + 2 ? 'step' : 'false'}>
            <h2><span class="demo-marker" aria-hidden="true"></span><span class="demo-step-title">${title}</span></h2><p>${text}</p>
          </li>`)}
        </ol>
      </div>
    </div>
    <section class="home-highlights" aria-label=${highlightsLabel ?? 'What else Anubis does'}>
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
    const crossedRanking = (lastStep >= 4) !== (step >= 4);
    if (step === lastStep) return;
    lastStep = step;
    const render = () => emit('scrollChanged', step);
    if (crossedRanking) moveRows(document.querySelector('.demo-stage .demo-results'), '.demo-item', render);
    else render();
  };
  const scroll = () => { frame ||= requestAnimationFrame(update); };
  addEventListener('scroll', scroll, { passive: true });
  addEventListener('resize', scroll, { passive: true });
  void document.fonts.ready.then(scroll);
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
  const motion = !reducedMotion();
  emit('demoStarted');
  let position = { x: stage.clientWidth - 40, y: stage.clientHeight - 20 };
  const pointer = (shown, pressing = false) => emit('pointerMoved', { ...position, shown, pressing });
  const moveTo = async (target) => {
    position = pointAt(target, stage) ?? position;
    pointer(true);
    await delay(880);
  };
  const click = async () => {
    pointer(true, true);
    await delay(160);
    pointer(true);
  };
  if (motion) pointer(false);
  await delay(motion ? 900 : 400);
  const rows = stage.querySelector('.demo-results');
  for (const step of kind === 'ranking' ? RANK_STEPS : hidingSteps) {
    const anchor = stage.querySelector('[data-weigh=' + step.id + ']');
    if (motion) {
      await moveTo(anchor);
      await click();
    }
    emit('demoOpened', { id: step.id, ...placeMenu(stage, anchor) });
    await delay(motion ? 550 : 700);
    if (motion) {
      await moveTo(stage.querySelector('[data-rank=' + step.level + ']'));
      await click();
    }
    emit('rankSelected', step.level);
    await delay(motion ? 700 : 550);
    const apply = () => emit('demoRanked', step);
    if (kind === 'ranking') moveRows(rows, '.rd-result', apply);
    else apply();
    if (motion) {
      position = { x: position.x + 40, y: position.y + 28 };
      pointer(true);
    }
    await delay(motion ? 950 : 350);
  }
  if (motion) pointer(false);
  emit('demoFinished');
}

function balance(level) {
  const { tilt, dx, dy } = balancePosition(level);
  return html`<svg class="hd-balance" viewBox="0 0 132 40" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M66 7v28M56 37h20"/>
    <circle cx="66" cy="5" r="1.6" fill="currentColor" stroke="none"/>
    <g class="hd-tilt" style=${`transform:rotate(${tilt}deg);transform-origin:66px 9px;transform-box:view-box`}><path d="M14 9h104"/></g>
    <g class="hd-tilt" style=${`transform:translate(${dx}px,${-dy}px)`}>
      <path d="M14 9 7 24M14 9l7 15"/>
      <path d="M4 24h20a10 5 0 0 1-20 0z" fill="currentColor" fill-opacity="0.14"/>
      <path d="M14 21.5c-1.8-1.6-3.2-2.6-3.2-4a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 1.4-1.4 2.4-3.2 4z" fill="currentColor" stroke="none"/>
    </g>
    <g class="hd-tilt" style=${`transform:translate(${-dx}px,${dy}px)`}>
      <path d="M118 9l-7 15M118 9l7 15"/>
      <path d="M108 24h20a10 5 0 0 1-20 0z" fill="currentColor" fill-opacity="0.14"/>
      <path d="M115 22.5c1.5-3.5 3.5-5.8 6-7-.3 3.2-2.4 5.6-6 7zM116.4 20.6l2.4-.4"/>
    </g>
  </svg>`;
}

function rankMenu({ menu, selected }, results) {
  if (!menu) return '';
  const result = results.find(({ id }) => id === menu.id);
  const site = result.host ?? result.url.split(' › ')[0];
  const edge = menu.below ? 'top' : 'bottom';
  return html`<div class=${menu.below ? 'hd-menu below' : 'hd-menu'}
    style=${`left:${menu.left}px;width:${menu.width}px;${edge}:${menu.edge}px;--arrow-x:${menu.arrow}px`} aria-hidden="true">
    <div class="hd-head"><span class="hd-name">${site}</span><span class="hd-close">${unsafeHTML(ICON.close)}</span></div>
    ${balance(selected ?? 'normal')}
    <div class="hd-levels">${LEVELS.map(([level, label]) => html`
      ${level === 'lower' || level === 'pin' ? html`<span class="hd-sep"></span>` : ''}
      <span data-rank=${level} class=${'hd-level ' + level + (selected === level ? ' pressed' : '')}>
        <span class="hd-level-icon">${unsafeHTML(rankIcon(level, selected === level ? 1 : 0))}</span>${label}
      </span>`)}</div>
    <p class="hd-hint">Your choice for ${site}, on every search.</p>
    <div class="hd-menu-tags">${result.tag ? tag({ name: result.tag[0], color: result.tag[1] }) : ''}<span class="hd-add">+ Tag</span></div>
  </div>`;
}

export function guideDemo(kind, demo, replay, t) {
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
    <div class="hd-stage" aria-hidden="true" lang="en">
      <div class="demo-page hd-page">
        <div class="demo-summary hd-summary"><p><span class=${rank ? '' : 'long'}>${sentence}
          ${rank ? '' : html`<span class="demo-link">Show hidden</span> <span class="demo-link">Load more results</span>`}
          <span class="hd-gear">${unsafeHTML(ICON.gear)}</span>
        </span>${rank ? '' : html`<span class="short">Anubis changed ${demo.levels.fandom ? 4 : 3} of 7 results.
          <span class="demo-link">Show hidden</span> <span class="demo-link">Details</span></span>`}</p>
          ${fold(!!demo.said, 'hd-change', html`${demo.said} <span class="demo-link">Undo</span>`)}
          <div class="summary-tags hd-tags">${tag(REFERENCE, 2)}</div>
        </div>
        <div class="demo-results">${repeat(ordered, (result) => result.id, (result) => resultRow(result, {
          guide: true,
          rank,
          level: demo.levels[result.id] ?? (result.chip === 'raised' ? 'raise' : 'normal'),
          hidden: demo.levels[result.id] === 'hide',
          active: demo.menu?.id === result.id,
          badge: result.tag ? { name: result.tag[0], color: result.tag[1] } : result.chip ? REFERENCE : undefined,
        }))}</div>
      </div>
      ${rankMenu(demo, results)}
      <span class=${'hd-pointer' + (demo.pointer?.shown ? ' shown' : '') + (demo.pointer?.pressing ? ' pressing' : '')}
        style=${demo.pointer ? `transform:translate(${demo.pointer.x}px,${demo.pointer.y}px)` : ''}>
        ${cursorClick.render({ id: kind + '-cursor', motionVariant: demo.pointer?.pressing ? 'click' : 'idle' })}
        <svg viewBox="0 0 16 22" width="16" height="22" aria-hidden="true"><path d="M1 1v17l4.4-4.2 3 6.6 2.8-1.3-3-6.4H14z" fill="#fff" stroke="#1c1c1f" stroke-width="1.4"></path></svg>
      </span>
    </div>
    <figcaption class="caption hd-caption">
      ${t(rank ? 'rankCaption' : 'hideCaption')}
      <button type="button" class="hd-replay" ?disabled=${!demo.done} @click=${replay}>${t('replay')}</button>
    </figcaption>
  </figure>`;
}
