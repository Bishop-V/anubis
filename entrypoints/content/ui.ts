import { balanceSvg, setBalance } from '@/utils/balance';
import { domainChoices, siteOf } from '@/utils/domain';
import { h, icon } from '@/utils/dom';
import type { EngineDef } from '@/utils/engines';
import { ICON_ANUBIS, ICON_CLOSE, ICON_GEAR, ICON_HIDE, LEVEL_CHIPS, LEVEL_ICONS, LEVEL_LABELS, WEIGH_ICONS } from '@/utils/icons';
import type { TagDef } from '@/utils/listformat';
import { LEVELS, TAG_CHOICES, type Level, type TagPref, type Verdict } from '@/utils/matcher';
import { t, tList, tn } from '@/utils/i18n';
import { hiddenCount, type PageStats } from '@/utils/messages';
import { getSite, PERSONAL_NAME, type PersonalLevel } from '@/utils/personal';
import { summarySentence } from '@/utils/summary';
import { OWN_TAGS, type FoundResult } from './results';
import shadowCss from './shadow.css?inline';

export type PageTheme = 'light' | 'dark';

// Every piece of Anubis UI on the page is a custom element with a closed shadow
// root: the page's CSS can't restyle it and its scripts can't read tag names out of it.
const roots = new WeakMap<HTMLElement, ShadowRoot>();
const renderKeys = new WeakMap<HTMLElement, string>();
// What each host currently shows. (`:scope` can't be used for this: inside a
// shadow root it matches nothing, so old content would pile up.)
const rendered = new WeakMap<HTMLElement, Node>();
const HOST_TAGS = [...OWN_TAGS].map((tag) => tag.toLowerCase()).join(', ');

// The shadow root protects what's inside a host, but the host element itself is
// part of the page and the page's CSS can still reach it (Google's stylesheets
// match on structure, like `… > :last-child`). These inline !important values
// win over any page rule, so a host can't be hidden, faded, moved or flipped.
const GUARDS: [string, string][] = [
  ['visibility', 'visible'],
  ['opacity', '1'],
  ['transform', 'none'],
  ['rotate', 'none'],
  ['scale', 'none'],
  ['translate', 'none'],
  ['filter', 'none'],
  ['clip-path', 'none'],
  ['mask', 'none'],
  ['writing-mode', 'horizontal-tb'],
  ['direction', 'ltr'],
  ['float', 'none'],
  ['content-visibility', 'visible'],
  ['pointer-events', 'auto'],
];

function guard(host: HTMLElement, display: string): void {
  for (const [prop, value] of GUARDS) host.style.setProperty(prop, value, 'important');
  host.style.setProperty('display', display, 'important');
}

function makeHost(tag: string, theme: PageTheme, display = 'block'): { host: HTMLElement; root: ShadowRoot } {
  const host = document.createElement(tag);
  const root = host.attachShadow({ mode: 'closed' });
  root.append(h('style', null, shadowCss));
  host.dataset.theme = theme;
  guard(host, display);
  roots.set(host, root);
  return { host, root };
}

// ---------------------------------------------------------------------------
// Keeping text upright
//
// If an ancestor is mirrored or rotated (some layouts flip a wrapper with a
// transform and flip their own children back), a host inside it would be drawn
// upside down. Add up the ancestors' transforms and, if the result isn't upright,
// give the host the inverse. Checked when a host lands somewhere new.

const uprightParent = new WeakMap<HTMLElement, Element | null>();

function linearTransform(el: Element): DOMMatrix {
  const cs = getComputedStyle(el);
  let m = new DOMMatrix();
  const rotate = /^(-?[\d.]+)deg$/.exec(cs.rotate?.trim() ?? '');
  if (rotate) m = m.rotate(Number(rotate[1]));
  if (cs.scale && cs.scale !== 'none') {
    const [sx = 1, sy = sx] = cs.scale.split(/\s+/).map(Number);
    m = m.scale(sx, sy);
  }
  if (cs.transform && cs.transform !== 'none') {
    try {
      const t = new DOMMatrix(cs.transform);
      m = m.multiply(new DOMMatrix([t.a, t.b, t.c, t.d, 0, 0]));
    } catch {
      // An unparseable 3D transform: leave it.
    }
  }
  return m;
}

const transformedCache = new WeakMap<Element, boolean>();

function isTransformed(el: Element): boolean {
  let known = transformedCache.get(el);
  if (known === undefined) {
    const cs = getComputedStyle(el);
    known = (cs.transform !== 'none' && cs.transform !== '') || (cs.rotate ?? 'none') !== 'none' || (cs.scale ?? 'none') !== 'none';
    transformedCache.set(el, known);
  }
  return known;
}

/**
 * Inside a flipped wrapper, anything added after the title is drawn above it. So
 * step out to just after the outermost transformed wrapper within the result.
 */
function outsideTransforms(block: HTMLElement, container: HTMLElement): HTMLElement {
  let anchor = block;
  for (let el = block.parentElement; el && el !== container; el = el.parentElement) {
    if (isTransformed(el)) anchor = el;
  }
  return anchor;
}

export function keepUpright(host: HTMLElement): void {
  const parent = host.parentElement;
  if (uprightParent.get(host) === parent) return;
  uprightParent.set(host, parent);
  let net = new DOMMatrix();
  for (let el: Element | null = parent; el; el = el.parentElement) net = linearTransform(el).multiply(net);
  const det = net.a * net.d - net.b * net.c;
  const tilted = det < 0 || Math.abs(Math.atan2(net.b, net.a)) > 0.02;
  if (!tilted || det === 0) {
    host.style.setProperty('transform', 'none', 'important');
    return;
  }
  // Undo only the flip or rotation, not any scaling.
  const s = Math.sqrt(Math.abs(det));
  const inv = new DOMMatrix([net.a / s, net.b / s, net.c / s, net.d / s, 0, 0]).inverse();
  host.style.setProperty('transform', `matrix(${inv.a}, ${inv.b}, ${inv.c}, ${inv.d}, 0, 0)`, 'important');
  host.style.setProperty('transform-origin', 'center', 'important');
}

/** Replace a host's content unless it's already showing the same thing. */
function render(host: HTMLElement, key: string, build: () => Node): void {
  if (renderKeys.get(host) === key) return;
  renderKeys.set(host, key);
  // Replacing the focused button would send focus to the top of the page, so it
  // goes to the button with the same data-focus-key in the new content, or, when
  // that button is gone (Undo, Show all), to the first one.
  const root = roots.get(host)!;
  const focusKey = root.activeElement?.getAttribute('data-focus-key');
  const next = build();
  const prev = rendered.get(host);
  if (prev?.parentNode) prev.parentNode.replaceChild(next, prev);
  else root.append(next);
  rendered.set(host, next);
  if (focusKey && next instanceof Element) {
    const target = [...next.querySelectorAll<HTMLElement>('[data-focus-key]')];
    (target.find((el) => el.dataset.focusKey === focusKey) ?? target[0])?.focus({ preventScroll: true });
  }
}

/** The theme of everything on the page but the result menu, which has its own (`PopoverData.theme`). */
export function applyTheme(theme: PageTheme): void {
  for (const el of document.querySelectorAll<HTMLElement>(HOST_TAGS)) if (el.tagName !== 'ANUBIS-POPOVER') el.dataset.theme = theme;
}

const chipsHosts = new WeakMap<HTMLElement, HTMLElement>();
const weighHosts = new WeakMap<HTMLElement, HTMLElement>();
const barHosts = new WeakMap<HTMLElement, HTMLElement>();
const weighResult = new WeakMap<HTMLElement, FoundResult>();
const positioned = new WeakSet<HTMLElement>();

/**
 * Take Anubis off an element that is no longer a result, for instance after the
 * engine's own "hide this site" collapsed it or its scripts re-rendered it.
 */
export function detachResult(container: HTMLElement): void {
  for (const map of [chipsHosts, weighHosts, barHosts]) {
    map.get(container)?.remove();
    map.delete(container);
  }
}

function stop(e: Event) {
  e.preventDefault();
  e.stopPropagation();
}

// ---------------------------------------------------------------------------
// Tags and verdict under the title

export interface ChipContext {
  tags: Map<string, TagDef>;
  prefs: Record<string, TagPref>;
  theme: PageTheme;
}

export function renderChips(result: FoundResult, verdict: Verdict, ctx: ChipContext, revealed: boolean): void {
  const { container, titleBlock } = result;
  const level = verdict.level !== 'normal' && (verdict.level !== 'hide' || revealed) ? verdict.level : undefined;
  const tags = verdict.tags.filter((id) => !ctx.prefs[id]?.muted && ctx.tags.has(id));
  const page = result.page;

  let host = chipsHosts.get(container);
  if (!level && !tags.length && !page) {
    host?.remove();
    return;
  }
  if (!host) {
    host = makeHost('anubis-chips', ctx.theme).host;
    chipsHosts.set(container, host);
  }
  // Keep it right after the title, even if the page re-rendered around it.
  const anchor = outsideTransforms(titleBlock, container);
  if (host.previousElementSibling !== anchor) anchor.after(host);
  keepUpright(host);
  host.dataset.theme = ctx.theme;

  const key = JSON.stringify([level, tags.map((id) => ctx.tags.get(id)), page]);
  render(host, key, () =>
    h(
      'div',
      { class: 'chips' },
      level &&
        h(
          'span',
          { class: `verdict ${level}`, title: verdict.reasons.map((r) => `${r.list}: ${r.text}`).join('\n') },
          icon(LEVEL_ICONS[level]),
          LEVEL_CHIPS[level],
        ),
      tags.map((id) => {
        const tag = ctx.tags.get(id)!;
        const sources = verdict.tagSources[id] ?? [];
        return h(
          'span',
          {
            class: 'tag',
            style: `--c: ${tag.color}`,
            title: [tag.description, `From ${sources.join(', ')}`].filter(Boolean).join('\n'),
          },
          h('i', { class: 'gem' }),
          tag.label,
        );
      }),
      page ? h('span', { class: 'page-note', title: 'Added by “Load more results”' }, `from page ${page}`) : null,
    ),
  );
}

// ---------------------------------------------------------------------------
// Weigh button

export function ensureWeighButton(
  result: FoundResult,
  level: Level,
  engine: EngineDef,
  theme: PageTheme,
  onOpen: (button: HTMLElement, result: FoundResult) => void,
): void {
  const { container } = result;
  let host = weighHosts.get(container);
  if (!host) {
    const made = makeHost('anubis-weigh', theme, engine.table ? 'inline-block' : 'block');
    const button = h('button', { class: 'weigh', type: 'button', attrs: { 'aria-haspopup': 'dialog', 'aria-expanded': 'false' } });
    const owner = made.host;
    button.addEventListener('click', (e) => {
      // Keep the click from reaching the result link underneath.
      stop(e);
      onOpen(button, weighResult.get(owner)!);
    });
    made.root.append(button);
    rendered.set(owner, button);
    host = owner;
    weighHosts.set(container, host);
  }
  weighResult.set(host, result);
  host.dataset.theme = theme;
  // Named for its site, so a list of the page's buttons tells them apart, and for its
  // ranking, which the icon shows: the balance tips with it.
  const site = result.host.replace(/^www\./, '');
  const label = level === 'normal' ? t('weighLabel', site) : t('weighLabelRanked', site, LEVEL_CHIPS[level].toLocaleLowerCase());
  const button = rendered.get(host) as HTMLElement | undefined;
  if (button && button.title !== label) {
    button.title = label;
    button.setAttribute('aria-label', label);
  }
  if (button && button.dataset.level !== level) {
    button.dataset.level = level;
    button.replaceChildren(icon(WEIGH_ICONS[level]));
  }

  if (engine.table) {
    // Table rows can't position children; sit inline after the title instead.
    host.style.setProperty('position', 'relative', 'important');
    host.style.setProperty('vertical-align', 'middle', 'important');
    host.style.setProperty('margin-left', '6px', 'important');
    host.style.setProperty('--anubis-weigh-opacity', '.8');
    if (host.previousElementSibling !== result.link) result.link.after(host);
    keepUpright(host);
    return;
  }
  const { top, right, besideMenu } = engine.button ?? { top: '2px', right: '2px' };
  host.style.setProperty('position', 'absolute', 'important');
  const menu = besideMenu ? resultMenuOf(container) : undefined;
  if (menu) placeBesideMenu(host, container, menu);
  else {
    for (const prop of MENU_LOOK) host.style.removeProperty(prop);
    host.style.setProperty('top', top, 'important');
    host.style.setProperty('right', clearOfPictures(container, right), 'important');
  }
  host.style.setProperty('left', 'auto', 'important');
  host.style.setProperty('bottom', 'auto', 'important');
  host.style.setProperty('z-index', '5', 'important');
  if (host.parentElement !== container) container.append(host);
  keepUpright(host);
  // The button is absolutely positioned, so the result must be a positioning context.
  // Checked once per result: reading computed style every pass forces a style recalc.
  if (!positioned.has(container)) {
    positioned.add(container);
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  }
}

/**
 * How far from the right edge the button sits. Some results show a thumbnail in
 * their top-right corner (Google does beside many results); the button moves to
 * its left instead of covering it. Favicons are too small to count.
 */
function clearOfPictures(container: HTMLElement, right: string): string {
  const box = container.getBoundingClientRect();
  if (!box.width) return right;
  let edge = box.right;
  for (const pic of container.querySelectorAll<HTMLElement>('img, video, canvas, [role="img"]')) {
    const r = pic.getBoundingClientRect();
    if (r.width < 40 || r.height < 40 || r.right < box.right - 80 || r.top > box.top + 60) continue;
    edge = Math.min(edge, r.left);
  }
  return edge === box.right ? right : `${Math.round(box.right - edge + 6)}px`;
}

/** The engine's own menu button on a result: the right-most small button in its top-right corner. */
function resultMenuOf(container: HTMLElement): HTMLElement | undefined {
  const box = container.getBoundingClientRect();
  if (!box.width) return undefined;
  let menu: HTMLElement | undefined;
  let menuRight = -Infinity;
  for (const el of container.querySelectorAll<HTMLElement>('button, [role="button"]')) {
    const r = el.getBoundingClientRect();
    if (!r.width || r.width > 48 || r.height > 48 || r.top > box.top + 64 || r.right < box.right - 64) continue;
    if (r.right > menuRight) {
      menu = el;
      menuRight = r.right;
    }
  }
  return menu;
}

/** What the weigh button takes from the engine's menu button to look like its neighbour. */
const MENU_LOOK = ['--anubis-weigh-size', '--anubis-weigh-radius'];

/**
 * Just left of the engine's menu button and centred on it, at its size and shape,
 * so the two read as a pair of options. The colours stay Anubis's own.
 */
function placeBesideMenu(host: HTMLElement, container: HTMLElement, menu: HTMLElement): void {
  const box = container.getBoundingClientRect();
  const m = menu.getBoundingClientRect();
  const cs = getComputedStyle(container);
  const ms = getComputedStyle(menu);
  const size = Math.round(Math.min(44, Math.max(20, m.width, m.height)));
  const top = m.top + m.height / 2 - size / 2 - box.top - parseFloat(cs.borderTopWidth);
  const right = box.right - parseFloat(cs.borderRightWidth) - m.left + 4;
  host.style.setProperty('top', `${Math.round(top)}px`, 'important');
  host.style.setProperty('right', `${Math.round(right)}px`, 'important');
  host.style.setProperty('--anubis-weigh-size', `${size}px`);
  host.style.setProperty('--anubis-weigh-radius', parseFloat(ms.borderTopLeftRadius) ? ms.borderTopLeftRadius : '50%');
}

export function weighButtonOf(container: HTMLElement): HTMLButtonElement | undefined {
  const host = weighHosts.get(container);
  return host ? (roots.get(host)?.querySelector('button') ?? undefined) : undefined;
}

// ---------------------------------------------------------------------------
// One quiet line in place of a hidden result

/** "by your list", "because it's tagged “AI slop”", "by Copycats removal"… */
export function hiddenReason(verdict: Verdict, tags: Map<string, TagDef>): string {
  const by = verdict.hiddenBy;
  if (!by) return '';
  if (by.kind === 'personal') return 'by your list';
  if (by.kind === 'tag') return `because it’s tagged “${tags.get(by.name)?.label ?? by.name}”`;
  if (by.kind === 'lens') return `because ${by.name} doesn’t include it`;
  return `by ${by.name}`;
}

/**
 * The one line standing for a hidden result, or for a run of hidden results in a
 * row: "fandom.com and 5 more hidden by your list". `more` is the rest of the run,
 * as their reasons; the line gives one reason only when they all share it.
 */
export function renderHiddenBar(
  result: FoundResult,
  verdict: Verdict,
  theme: PageTheme,
  tags: Map<string, TagDef>,
  show: boolean,
  actions: { reveal: () => void },
  more: Verdict[] = [],
): void {
  const { container } = result;
  let host = barHosts.get(container);
  if (!show) {
    host?.remove();
    return;
  }
  if (!host) {
    host = makeHost('anubis-bar', theme).host;
    barHosts.set(container, host);
  }
  if (container.firstElementChild !== host) container.prepend(host);
  keepUpright(host);
  host.dataset.theme = theme;

  const why = hiddenReason(verdict, tags);
  const sameWhy = more.every((v) => hiddenReason(v, tags) === why);
  const site = result.host.replace(/^www\./, '');
  render(host, JSON.stringify([site, why, more.length, sameWhy]), () =>
    h(
      'div',
      { class: 'gone' },
      icon(ICON_HIDE),
      h(
        'span',
        { class: 'why' },
        h('b', null, site),
        more.length ? ` ${tn('hiddenMore', more.length)}` : '',
        sameWhy && why ? ` hidden ${why}` : ' hidden',
      ),
      h(
        'button',
        {
          class: 'text-btn',
          type: 'button',
          attrs: { 'aria-label': t('hiddenShowSite', site) },
          on: {
            click: (e) => {
              stop(e);
              actions.reveal();
              // The line goes with the click; the result it stood for takes focus.
              result.link.focus({ preventScroll: true });
            },
          },
        },
        t('hiddenShow'),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// The summary line above the results

let summaryHost: HTMLElement | undefined;
/** The results area, while the summary sits outside it and lines up with it. */
let summaryArea: HTMLElement | undefined;
/** Places that didn't put the summary above the results once the page had loaded, so aren't tried again. */
const misplaced = new WeakSet<HTMLElement>();
let realignOnResize = false;

/**
 * Where the summary goes: just before `before`. When that's outside the results
 * `area` (above an AI answer), the summary lines up with the area, and goes before
 * `fallback` instead if the page's layout puts it anywhere but above the results.
 */
export interface SummaryPlace {
  before: HTMLElement;
  area?: HTMLElement;
  fallback?: HTMLElement;
}

export interface SummaryActions {
  toggleReveal: () => void;
  settings: () => void;
  deeper: () => void;
  filter: (tag?: string) => void;
  undo: () => void;
}

/** `change` says what the last change from the result menu did ("Hid fandom.com."), with Undo after it. */
export function renderSummary(
  place: SummaryPlace | undefined,
  stats: PageStats,
  theme: PageTheme,
  actions: SummaryActions,
  change?: string,
): void {
  const worthShowing =
    hiddenCount(stats) || stats.pinned || stats.raised || stats.lowered || stats.tagged || stats.canGoDeeper || stats.pages > 1 || change;
  if (!place?.before.parentElement || !worthShowing) {
    summaryHost?.remove();
    summaryArea = undefined;
    return;
  }
  summaryHost ??= makeHost('anubis-summary', theme).host;
  const tryFirst = !!place.fallback && !misplaced.has(place.before);
  const before = tryFirst || !place.fallback ? place.before : place.fallback;
  if (summaryHost.nextElementSibling !== before) before.before(summaryHost);
  keepUpright(summaryHost);
  summaryHost.dataset.theme = theme;

  render(summaryHost, JSON.stringify([stats, change]), () =>
    h(
      'div',
      { class: 'summary' },
      h('span', { class: 'mark' }, icon(ICON_ANUBIS)),
      h('span', { class: 'sentence' }, summarySentence(stats)),
      stats.filter
        ? h('button', { class: 'text-btn', type: 'button', attrs: { 'data-focus-key': 'show-all' }, on: { click: () => actions.filter(undefined) } }, t('summaryShowAll'))
        : null,
      hiddenCount(stats) && !stats.filter
        ? h(
            'button',
            { class: 'text-btn', type: 'button', attrs: { 'data-focus-key': 'reveal' }, on: { click: actions.toggleReveal } },
            stats.revealed ? t('hideAgain') : t('showHidden'),
          )
        : null,
      stats.canGoDeeper || stats.loading
        ? h(
            'button',
            {
              class: 'text-btn',
              type: 'button',
              disabled: stats.loading,
              title: t('loadMoreTitle'),
              attrs: { 'data-focus-key': 'deeper' },
              on: { click: actions.deeper },
            },
            stats.loading ? t('loading') : t('loadMore'),
          )
        : null,
      settingsButton(actions.settings, 'settings'),
      change
        ? h(
            'div',
            { class: 'change' },
            h('span', null, change),
            h('button', { class: 'text-btn', type: 'button', attrs: { 'data-focus-key': 'undo' }, on: { click: actions.undo } }, t('summaryUndo')),
          )
        : null,
      // The tags on this page, as a legend you can click to show only that tag.
      stats.tags.length
        ? h(
            'div',
            { class: 'filters', attrs: { role: 'group', 'aria-label': t('summaryFilterLabel') } },
            stats.tags.map((tag) =>
              h(
                'button',
                {
                  type: 'button',
                  style: `--c: ${tag.color}`,
                  title: stats.filter === tag.id ? t('summaryFilterOff') : t('summaryFilterOn', tag.label),
                  attrs: { 'aria-pressed': String(stats.filter === tag.id), 'data-focus-key': `tag-${tag.id}` },
                  on: { click: () => actions.filter(stats.filter === tag.id ? undefined : tag.id) },
                },
                h('i', { class: 'gem' }),
                tag.label,
                h('span', { class: 'count' }, tag.count),
              ),
            ),
          )
        : null,
    ),
  );

  announce(summaryHost, change ?? '');

  summaryArea = place.area && !place.area.contains(summaryHost) ? place.area : undefined;
  alignSummary();
  if (tryFirst && summaryArea && !aboveResults(summaryHost, place.before, summaryArea)) {
    // While the page is still loading, its layout may not be final: try again next pass.
    if (document.readyState === 'complete') misplaced.add(place.before);
    place.fallback!.before(summaryHost);
    keepUpright(summaryHost);
    summaryArea = place.area && !place.area.contains(summaryHost) ? place.area : undefined;
    alignSummary();
  }
  if (summaryArea && !realignOnResize) {
    realignOnResize = true;
    let queued = false;
    addEventListener('resize', () => {
      if (queued || !summaryArea) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        alignSummary();
      });
    });
  }
}

const statusRegions = new WeakMap<HTMLElement, HTMLElement>();

/**
 * Say `text` to screen readers without moving focus ("Hid fandom.com."). The
 * region stays in the host across renders: one added along with its text isn't
 * reliably read.
 */
function announce(host: HTMLElement, text: string): void {
  let region = statusRegions.get(host);
  if (!region) {
    region = h('div', { class: 'sr-only', attrs: { role: 'status' } });
    roots.get(host)!.append(region);
    statusRegions.set(host, region);
  }
  if (region.textContent !== text) region.textContent = text;
}

/**
 * Outside the results area, inset the summary so its text lines up with the
 * results. Only the host's padding changes, so its own box stays where the page
 * lays it out.
 */
function alignSummary(): void {
  const host = summaryHost;
  if (!host) return;
  for (const prop of ['padding-left', 'padding-right', 'box-sizing']) host.style.removeProperty(prop);
  if (!summaryArea?.isConnected || !host.isConnected) return;
  const box = host.getBoundingClientRect();
  const area = summaryArea.getBoundingClientRect();
  if (!box.width || !area.width) return;
  const left = Math.max(0, Math.round(area.left - box.left));
  const right = Math.max(0, Math.round(box.right - area.right));
  host.style.setProperty('box-sizing', 'border-box', 'important');
  if (left) host.style.setProperty('padding-left', `${left}px`, 'important');
  if (right) host.style.setProperty('padding-right', `${right}px`, 'important');
}

/** Above the results area and across it, and above `next` when that's showing. */
function aboveResults(host: HTMLElement, next: HTMLElement, area: HTMLElement): boolean {
  const box = host.getBoundingClientRect();
  const results = area.getBoundingClientRect();
  const after = next.getBoundingClientRect();
  const across = Math.min(box.right, results.right) - Math.max(box.left, results.left);
  return box.width > 0 && box.bottom <= results.top + 1 && across >= results.width / 2 && (!after.height || box.bottom <= after.top + 1);
}

/** The cog that opens settings, in the summary and the result menu. */
function settingsButton(open: () => void, focusKey?: string): HTMLButtonElement {
  const label = t('anubisSettings');
  const attrs: Record<string, string> = { 'aria-label': label };
  if (focusKey) attrs['data-focus-key'] = focusKey;
  return h('button', { class: 'icon-btn', type: 'button', title: label, attrs, on: { click: open } }, icon(ICON_GEAR));
}

export function removeAllUi(): void {
  document.querySelectorAll(HOST_TAGS).forEach((el) => el.remove());
  summaryHost = undefined;
  summaryArea = undefined;
}

// ---------------------------------------------------------------------------
// The weigh menu

export interface PopoverData {
  result: FoundResult;
  verdict: Verdict;
  /** What the subscribed lists alone say, ignoring the personal list. */
  baseline: Verdict;
  personalText: string;
  tags: Map<string, TagDef>;
  /** Subscribed lists with an issue tracker, for "suggest" links, with the tag ids each defines. */
  trackers: { id: string; name: string; issues: string; tags: string[] }[];
  /** Pre-filled issues telling each list that weighed this result it's wrong. */
  reports: { id: string; name: string; href: string }[];
  theme: PageTheme;
}

export interface PopoverActions {
  setLevel(domain: string, level: PersonalLevel): void;
  toggleTag(domain: string, tag: string): void;
  createTag(domain: string, label: string): void;
  suggest(tracker: PopoverData['trackers'][number], domain: string): string | undefined;
  settings(): void;
}

let popover: { host: HTMLElement; anchor: HTMLElement; cleanup: () => void; domain?: string } | undefined;

export function closePopover(): void {
  if (!popover) return;
  popover.cleanup();
  popover.anchor.setAttribute('aria-expanded', 'false');
  popover.host.remove();
  popover = undefined;
}

/** Close the result menu and put focus back on the button that opened it. */
function closeAndReturn(): void {
  const anchor = popover?.anchor;
  closePopover();
  anchor?.focus({ preventScroll: true });
}

export function popoverAnchor(): HTMLElement | undefined {
  return popover?.anchor;
}

export function openPopover(anchor: HTMLElement, data: PopoverData, actions: PopoverActions): void {
  const same = popover?.anchor === anchor;
  const keepDomain = same ? popover?.domain : undefined;
  if (popover && !same) closePopover();

  const opening = !popover;
  if (!popover) {
    const { host } = makeHost('anubis-popover', data.theme);
    document.documentElement.append(host);
    const onDown = (e: Event) => {
      if (!e.composedPath().includes(host) && !e.composedPath().includes(anchor)) closePopover();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAndReturn();
    };
    const onResize = () => position(host, anchor);
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    popover = {
      host,
      anchor,
      cleanup: () => {
        document.removeEventListener('pointerdown', onDown, true);
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', onResize);
      },
    };
    anchor.setAttribute('aria-expanded', 'true');
  }

  const choices = domainChoices(data.result.host);
  const existing = choices.find((d) => getSite(data.personalText, d));
  const domain = keepDomain && choices.includes(keepDomain) ? keepDomain : (existing ?? siteOf(data.result.host));
  popover.domain = domain;
  popover.host.dataset.theme = data.theme;

  const root = roots.get(popover.host)!;
  const focusKey = root.activeElement?.getAttribute('data-focus-key');
  const oldPop = rendered.get(popover.host) as HTMLElement | undefined;
  const oldBalance = oldPop?.querySelector('svg.balance');
  const { pop, level } = buildPopover(data, actions, domain, (d) => {
    if (popover) popover.domain = d;
    openPopover(anchor, data, actions);
  });
  if (opening) pop.classList.add('opening');

  // Keep the old balance so it swings to the new weight instead of jumping.
  const balance = oldBalance ?? pop.querySelector('svg.balance')!;
  if (oldBalance) pop.querySelector('svg.balance')?.replaceWith(oldBalance);
  oldPop?.remove();
  root.append(pop);
  rendered.set(popover.host, pop);
  // Position only on open: if the result moves when reranked, the menu stays put.
  if (opening) position(popover.host, anchor);
  if (opening) setBalance(balance, 'normal');
  requestAnimationFrame(() => requestAnimationFrame(() => setBalance(balance, level)));

  const focusTarget =
    (focusKey && root.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)) ||
    root.querySelector<HTMLElement>('.level[aria-pressed="true"]') ||
    root.querySelector<HTMLElement>('.level');
  focusTarget?.focus({ preventScroll: true });
}

function position(host: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(312, window.innerWidth - 16);
  let left = rect.right - width + window.scrollX;
  left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + window.innerWidth - width - 8));
  host.style.left = `${left}px`;
  host.style.top = `${rect.bottom + window.scrollY + 6}px`;
}

function buildPopover(
  data: PopoverData,
  actions: PopoverActions,
  domain: string,
  switchDomain: (d: string) => void,
): { pop: HTMLElement; level: Level } {
  const entry = getSite(data.personalText, domain);
  const personal = entry?.level;
  const pressed: Level | undefined = personal === 'allow' ? 'normal' : personal && personal !== 'normal' ? personal : undefined;
  const fromLists = data.baseline.level;
  const shown: Level = pressed ?? fromLists;
  const choices = domainChoices(data.result.host);

  // The cartouche shows the chosen site as text, with the native select laid over it
  // unseen: a select is as wide as its longest option, which put the name off centre.
  let cartouche: HTMLElement;
  if (choices.length > 1) {
    const select = h(
      'select',
      { title: 'Choose how much of the site this applies to', attrs: { 'aria-label': 'Site', 'data-focus-key': 'site' } },
      choices.map((d) => h('option', { value: d, selected: d === domain }, d)),
    );
    select.addEventListener('change', () => switchDomain(select.value));
    cartouche = h('span', { class: 'cartouche choosable' }, h('span', { class: 'name', attrs: { 'aria-hidden': 'true' } }, domain), select);
  } else {
    cartouche = h('span', { class: 'cartouche' }, h('span', { class: 'name' }, domain));
  }

  const levels = h(
    'div',
    { class: 'levels', attrs: { role: 'group', 'aria-label': 'Ranking' } },
    LEVELS.map((level) =>
      h(
        'button',
        {
          class: `level ${level}${!pressed && level === fromLists && level !== 'normal' ? ' from-list' : ''}`,
          type: 'button',
          attrs: { 'aria-pressed': String(pressed === level), 'data-focus-key': `level-${level}` },
          on: {
            click: () => {
              if (level === 'normal') {
                // "Normal" has to beat the lists when they rank this site, so it becomes an explicit allow.
                actions.setLevel(domain, fromLists === 'normal' ? 'normal' : 'allow');
              } else actions.setLevel(domain, pressed === level ? 'normal' : level);
            },
          },
        },
        LEVEL_LABELS[level],
      ),
    ),
  );

  let hint: string;
  if (personal === 'allow') hint = 'Normal, whatever your lists say.';
  else if (pressed) hint = `Your choice for ${domain}, on every search.`;
  else if (fromLists !== 'normal') {
    const names = [...new Set(data.baseline.reasons.filter((r) => r.listId !== TAG_CHOICES).map((r) => r.list))];
    if (data.baseline.reasons.some((r) => r.listId === TAG_CHOICES)) names.push('your tag settings');
    const lists = names.join(', ');
    hint = `${LEVEL_CHIPS[fromLists]} by ${lists}. Choose one to decide yourself.`;
  } else hint = 'Your choice applies on every search.';

  // Tags you set toggle; tags from lists are shown but fixed.
  const mine = new Set(entry?.tags ?? []);
  const fromList = new Set(data.verdict.tags.filter((id) => (data.verdict.tagSources[id] ?? []).some((s) => s !== PERSONAL_NAME)));
  const tagIds = [...data.tags.keys()].sort((a, b) => {
    const rank = (id: string) => (mine.has(id) ? 0 : fromList.has(id) ? 1 : 2);
    return rank(a) - rank(b) || data.tags.get(a)!.label.localeCompare(data.tags.get(b)!.label);
  });
  const tagItems = tagIds.map((id) => {
    const tag = data.tags.get(id)!;
    const on = mine.has(id);
    if (!on && fromList.has(id)) {
      return h(
        'span',
        { class: 'fixed', style: `--c: ${tag.color}`, title: `From ${(data.verdict.tagSources[id] ?? []).join(', ')}` },
        h('i', { class: 'gem' }),
        tag.label,
      );
    }
    return h(
      'button',
      {
        type: 'button',
        style: `--c: ${tag.color}`,
        title: tag.description ?? (on ? `Untag ${domain}` : `Tag ${domain} “${tag.label}”`),
        attrs: { 'aria-pressed': String(on), 'data-focus-key': `tag-${id}` },
        on: { click: () => actions.toggleTag(domain, id) },
      },
      h('i', { class: on ? 'gem' : 'gem hollow' }),
      tag.label,
    );
  });

  const input = h('input', {
    type: 'text',
    placeholder: 'New tag',
    maxLength: 32,
    attrs: { 'aria-label': 'New tag name', 'data-focus-key': 'new-tag' },
  });
  const create = () => {
    const label = input.value.trim();
    if (label) actions.createTag(domain, label);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      create();
    }
  });

  const link = (href: string, title: string, name: string) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', title }, name);

  // Every list that weighed the result can be told it's wrong about it.
  const reportLinks = data.reports.map((r) => link(r.href, t('menuReportTitle', r.name), r.name));

  // Once you've weighed a site yourself, offer to propose it to up to two of the
  // lists that don't mention it yet: those that already use one of your tags come first.
  const reported = new Set(data.reports.map((r) => r.id));
  const ranked = entry
    ? data.trackers
        .filter((tr) => !reported.has(tr.id))
        .sort((a, b) => Number(b.tags.some((id) => mine.has(id))) - Number(a.tags.some((id) => mine.has(id))))
    : [];
  const suggestLinks = ranked
    .slice(0, 2)
    .map((tr) => {
      const href = actions.suggest(tr, domain);
      return href ? link(href, t('menuSuggestTitle', domain, tr.name), tr.name) : null;
    })
    .filter((a): a is HTMLAnchorElement => a !== null);

  const reasons = data.verdict.reasons.slice(0, 6);

  const pop = h(
    'div',
    { class: 'pop', attrs: { role: 'dialog', 'aria-label': t('weighLabel', domain) } },
    h(
      'div',
      { class: 'head' },
      cartouche,
      h(
        'button',
        { class: 'icon-btn close', type: 'button', title: 'Close', attrs: { 'aria-label': 'Close' }, on: { click: closeAndReturn } },
        icon(ICON_CLOSE),
      ),
    ),
    balanceSvg(),
    levels,
    h('p', { class: 'hint' }, hint),
    h(
      'div',
      { class: 'section' },
      h('h3', null, 'Tags'),
      tagItems.length ? h('div', { class: 'tags' }, tagItems) : null,
      h(
        'div',
        { class: 'new-tag' },
        input,
        h('button', { class: 'text-btn', type: 'button', on: { click: create } }, 'Add tag'),
      ),
    ),
    reasons.length || suggestLinks.length
      ? h(
          'div',
          { class: 'section' },
          h('h3', null, 'Why'),
          reasons.length
            ? h('ul', { class: 'reasons' }, reasons.map((r) => h('li', null, h('b', null, r.list), ` ${r.text}.`)))
            : null,
          reportLinks.length ? h('p', { class: 'forge' }, tList('menuReport', reportLinks, 'disjunction')) : null,
          suggestLinks.length ? h('p', { class: 'forge' }, tList('menuSuggest', suggestLinks, 'disjunction')) : null,
        )
      : null,
    h(
      'div',
      { class: 'foot' },
      h('span', null, entry ? 'Saved in your list.' : ''),
      settingsButton(actions.settings),
    ),
  );
  return { pop, level: shown };
}

