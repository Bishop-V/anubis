import { balanceSvg, setBalance } from '@/utils/balance';
import { domainChoices, normalizeHostname, siteOf } from '@/utils/domain';
import { h, icon } from '@/utils/dom';
import type { EngineDef } from '@/utils/engines';
import { ICON_CLOSE, ICON_GEAR, ICON_HIDE, LEVEL_CHIPS, LEVEL_LABELS, levelIcon, TAG_EFFECTS, tagEffectText, tagMark, WEIGH_ICONS } from '@/utils/icons';
import type { TagDef } from '@/utils/listformat';
import { LEVELS, type Level, type TagPref, type Verdict } from '@/utils/matcher';
import { dir, gap, lang, t, tJoin, tList, tn, tParts } from '@/utils/i18n';
import { hiddenCount, type PageStats } from '@/utils/messages';
import { getSite, type PersonalLevel } from '@/utils/personal';
import { ruleParts } from '@/utils/ruletext';
import type { Palette } from '@/utils/storage';
import { fromListsClass, nextLevel, rankingHint, rankingOf, siteCartouche, tagOrder, yourListTag, tagPicker, tagSource } from '@/utils/siteranking';
import { shortSummary, stoppedSentence, summarySentence } from '@/utils/summary';
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
// win over any page rule, so a host can't be hidden, faded, moved, or flipped.
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

/** The palette every host is drawn in; `applyPalette` changes it. */
let palette: Palette = 'gold';

function makeHost(tag: string, theme: PageTheme, display = 'block'): { host: HTMLElement; root: ShadowRoot } {
  const host = document.createElement(tag);
  const root = host.attachShadow({ mode: 'closed' });
  root.append(h('style', null, shadowCss));
  host.dataset.theme = theme;
  host.dataset.palette = palette;
  // Anubis's own language and direction, not the page's: screen readers pronounce it
  // right, long words hyphenate in it, and Arabic reads right to left on an English page.
  host.lang = lang();
  host.dir = dir();
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

/**
 * The block to put tags after so they aren't a flex or grid item beside the title:
 * the outermost row (or column) holding it, below the result's own box. A flex row
 * shrinks the title to make room for them, cutting it off with an ellipsis.
 */
function outsideRow(block: HTMLElement, container: HTMLElement): HTMLElement {
  let anchor = block;
  for (let el = block; el !== container; ) {
    const parent = el.parentElement;
    if (!parent) break;
    if (/flex|grid/.test(getComputedStyle(parent).display)) anchor = parent === container ? el : parent;
    el = parent;
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

/** Gold or plain, for everything Anubis adds to the page, the result menu included. */
export function applyPalette(next: Palette): void {
  if (next === palette && document.documentElement.dataset.anubisPalette === next) return;
  palette = next;
  document.documentElement.dataset.anubisPalette = next;
  for (const el of document.querySelectorAll<HTMLElement>(HOST_TAGS)) el.dataset.palette = next;
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
/** Weigh buttons at their result's right edge (not on a card or by the engine's menu): they follow each other into the gutter. */
const atEdge = new WeakSet<HTMLElement>();

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
  /** Tags go under the title's row, not in it (`chipsBelowRow`). */
  belowRow?: boolean;
}

export function renderChips(result: FoundResult, verdict: Verdict, ctx: ChipContext, revealed: boolean): void {
  const { container, titleBlock } = result;
  // A hidden result's tags show only once it's revealed; a tag that hides it then shows so.
  const effect = (id: string) => (verdict.hidden && !revealed ? undefined : verdict.tagEffects[id]);
  const tags = verdict.tags.filter((id) => !ctx.prefs[id]?.muted && ctx.tags.has(id));
  const page = result.page;

  let host = chipsHosts.get(container);
  if (!tags.length && !page) {
    host?.remove();
    return;
  }
  if (!host) {
    host = makeHost('anubis-chips', ctx.theme).host;
    chipsHosts.set(container, host);
  }
  // Keep it right after the title, even if the page re-rendered around it.
  const anchor = ctx.belowRow ? outsideRow(outsideTransforms(titleBlock, container), container) : outsideTransforms(titleBlock, container);
  if (host.previousElementSibling !== anchor) anchor.after(host);
  keepUpright(host);
  host.dataset.theme = ctx.theme;

  const key = JSON.stringify([tags.map((id) => [ctx.tags.get(id), effect(id)]), page]);
  render(host, key, () =>
    h(
      'div',
      { class: 'chips' },
      tags.map((id) => {
        const tag = ctx.tags.get(id)!;
        const sources = verdict.tagSources[id] ?? [];
        return h(
          'span',
          {
            class: 'tag',
            style: `--c: ${tag.color}`,
            title: [tag.description, t('popupTagFrom', tJoin(sources)), TAG_EFFECTS[effect(id) ?? 'normal']].filter(Boolean).join('\n'),
          },
          tagMark(effect(id)),
          tag.label,
          tagEffectText(effect(id)),
        );
      }),
      page
        ? h('span', { class: 'page-note', title: t('chipFromPageTitle') }, h('i', { class: 'gem hollow', style: '--c: currentColor' }), t('chipFromPage', page))
        : null,
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
      // A second press closes the menu it opened.
      if (popover?.anchor === button) closePopover();
      else onOpen(button, weighResult.get(owner)!);
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
  const site = normalizeHostname(result.host);
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
  const { top, right, underMenu, besideMenu, popOut } = engine.button ?? { top: '2px', right: '2px' };
  // The menu opens beside the result unless the engine names a narrower card.
  popOuts.set(host, popOut ?? ':scope');
  host.style.setProperty('position', 'absolute', 'important');
  const menu = (underMenu || besideMenu) && !result.card ? resultMenuOf(container) : undefined;
  // Not hidden while the engine's menu is open: a menu closes without adding or
  // removing nodes, so no pass would show the button again. It sits under the menu instead.
  if (menu || result.card) atEdge.delete(host);
  else atEdge.add(host);
  if (menu) placeNextToMenu(host, container, menu, besideMenu ? 'beside' : 'under');
  else {
    for (const prop of MENU_LOOK) host.style.removeProperty(prop);
    host.style.removeProperty('--anubis-weigh-color');
    host.style.setProperty('top', top, 'important');
    host.style.setProperty('right', right, 'important');
  }
  host.style.setProperty('left', 'auto', 'important');
  host.style.setProperty('bottom', 'auto', 'important');
  // DuckDuckGo draws its open menu inside the result at z-index 1: stay under it.
  host.style.setProperty('z-index', menu ? '0' : '5', 'important');
  if (host.parentElement !== container) container.append(host);
  keepUpright(host);
  // The button is absolutely positioned, so the result must be a positioning context.
  // Checked once per result: reading computed style every pass forces a style recalc.
  if (!positioned.has(container)) {
    positioned.add(container);
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  }
  // A card (an image, a video) is mostly picture: the button sits on its corner,
  // on a background of its own so it shows over the picture.
  host.style.setProperty('--anubis-weigh-bg', result.card ? 'var(--raised)' : 'transparent');
  if (result.card) {
    host.style.setProperty('--anubis-weigh-opacity', '0.9');
    host.style.setProperty('top', '6px', 'important');
    host.style.setProperty('right', '6px', 'important');
    return;
  }
  if (!menu) {
    lineUpWithHeader(host, container, result.titleBlock);
    clearOfPictures(host, container);
  }
  // Under an engine's menu it stays put: the engine cuts its address off before the menu.
  if (!menu && coversText(host, container)) moveOffText(host, container);
}

/**
 * Centred on the result's first row: the lines above its title (the site's name
 * and address, on most engines), or else the title's first line. A result often
 * starts with some space, and the engine's `top` alone leaves the button in it.
 */
function lineUpWithHeader(host: HTMLElement, container: HTMLElement, titleBlock: HTMLElement): void {
  // Google's title link also holds the site's name and address, above its heading.
  const title = titleBlock.querySelector<HTMLElement>('h1, h2, h3, h4, [role="heading"]') ?? titleBlock;
  const b = host.getBoundingClientRect();
  const t = title.getBoundingClientRect();
  if (!b.height || !t.height) return;
  let top = Infinity;
  let bottom = -Infinity;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim() || title.contains(node)) continue;
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (!r.width || r.bottom > t.top + 1 || r.top < t.top - 60) continue;
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    }
  }
  if (top === Infinity) {
    range.selectNodeContents(title);
    const first = range.getClientRects()[0];
    if (!first) return;
    ({ top, bottom } = first);
  }
  const box = container.getBoundingClientRect();
  const y = (top + bottom) / 2 - b.height / 2 - box.top - parseFloat(getComputedStyle(container).borderTopWidth);
  host.style.setProperty('top', `${Math.round(y)}px`, 'important');
}

/** Whether the button sits over any of the result's text (a long address, a title). */
function coversText(host: HTMLElement, container: HTMLElement): boolean {
  const b = host.getBoundingClientRect();
  if (!b.width) return false;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || !node.textContent?.trim()) continue;
    const p = parent.getBoundingClientRect();
    if (p.bottom <= b.top || p.top >= b.bottom || p.right <= b.left || p.left >= b.right) continue;
    // Text you can't see doesn't count: DuckDuckGo keeps its result menu's items
    // in the result, invisible until the menu opens.
    if (parent.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) === false) continue;
    // Text cut off with an ellipsis (DuckDuckGo's long addresses) still reports the
    // hidden part: only what's inside its clipping boxes counts.
    const clip = clipOf(parent, container);
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      const left = Math.max(r.left, clip.left);
      const right = Math.min(r.right, clip.right);
      const top = Math.max(r.top, clip.top);
      const bottom = Math.min(r.bottom, clip.bottom);
      if (bottom > b.top + 1 && top < b.bottom - 1 && right > b.left + 1 && left < b.right - 1) return true;
    }
  }
  return false;
}

/** The part of the page `el` can show: its ancestors up to `container` that clip their overflow, intersected. */
function clipOf(el: HTMLElement, container: HTMLElement): { left: number; right: number; top: number; bottom: number } {
  const clip = { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
  for (let a: HTMLElement | null = el; a; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const r = a.getBoundingClientRect();
      if (cs.overflowX !== 'visible') {
        clip.left = Math.max(clip.left, r.left);
        clip.right = Math.min(clip.right, r.right);
      }
      if (cs.overflowY !== 'visible') {
        clip.top = Math.max(clip.top, r.top);
        clip.bottom = Math.min(clip.bottom, r.bottom);
      }
    }
    if (a === container) break;
  }
  return clip;
}

/**
 * Off the text it covers: out past the result's right edge if the window has
 * room, otherwise down the result's right edge until it's clear.
 */
function moveOffText(host: HTMLElement, container: HTMLElement): void {
  const b = host.getBoundingClientRect();
  const top = parseFloat(host.style.top) || 0;
  if (intoGutter(host, container)) return;
  for (let step = 1; step <= 4 && coversText(host, container); step++) {
    host.style.setProperty('top', `${Math.round(top + step * (b.height + 2))}px`, 'important');
  }
}

/** Once a result's picture or long address pushes a button out past the results, they all go there, in one column. */
let buttonsInGutter = false;

/**
 * Just past the result's right edge, if nothing else is there. The first button
 * to go takes the ones already placed at their results' edges with it.
 */
function intoGutter(host: HTMLElement, container: HTMLElement): boolean {
  const box = container.getBoundingClientRect();
  const b = host.getBoundingClientRect();
  if (!gutterIsFree(container, { left: box.right + 4, right: box.right + 4 + b.width, top: b.top, bottom: b.bottom })) return false;
  host.style.setProperty('right', `${-Math.round(b.width + 4)}px`, 'important');
  if (!buttonsInGutter) {
    buttonsInGutter = true;
    for (const other of document.querySelectorAll<HTMLElement>('anubis-weigh')) {
      if (other !== host && atEdge.has(other) && other.parentElement) intoGutter(other, other.parentElement);
    }
  }
  return true;
}

/**
 * Clear of a thumbnail beside the result's first row (Google and Brave show them
 * in the top-right corner). The button goes just past the result's right edge,
 * where the other results' buttons follow it so they stay in one column, or,
 * where something else is there, to the thumbnail's left. Favicons are too small
 * to count.
 */
function clearOfPictures(host: HTMLElement, container: HTMLElement): void {
  const box = container.getBoundingClientRect();
  const b = host.getBoundingClientRect();
  if (!box.width || !b.width) return;
  let edge = box.right;
  for (const pic of container.querySelectorAll<HTMLElement>('img, video, canvas, [role="img"]')) {
    const r = pic.getBoundingClientRect();
    if (r.width < 40 || r.height < 40 || r.right < box.right - 80 || r.bottom <= b.top || r.top >= b.bottom) continue;
    edge = Math.min(edge, r.left);
  }
  const blocked = edge < b.right;
  if (!blocked && !buttonsInGutter) return;
  if (intoGutter(host, container)) return;
  if (blocked) {
    host.style.setProperty('right', `${Math.round(box.right - edge + 6)}px`, 'important');
  }
}

/** Whether nothing but the result's own ancestors is in this spot beside it, and it's in the window. */
function gutterIsFree(container: HTMLElement, spot: { left: number; right: number; top: number; bottom: number }): boolean {
  if (spot.right + 4 > document.documentElement.clientWidth) return false;
  for (let el: HTMLElement | null = container; el && el !== document.body; el = el.parentElement) {
    for (const sibling of el.parentElement?.children ?? []) {
      if (sibling === el || OWN_TAGS.has(sibling.tagName)) continue;
      const r = sibling.getBoundingClientRect();
      if (r.width && r.height && r.left < spot.right && r.right > spot.left && r.top < spot.bottom && r.bottom > spot.top) return false;
    }
  }
  return true;
}

/**
 * The engine's own menu button on a result: the right-most small button near its
 * top, in its right half (a result's box can be wider than the card it shows).
 */
function resultMenuOf(container: HTMLElement): HTMLElement | undefined {
  const box = container.getBoundingClientRect();
  if (!box.width) return undefined;
  let menu: HTMLElement | undefined;
  let menuRight = -Infinity;
  for (const el of container.querySelectorAll<HTMLElement>('button, [role="button"]')) {
    const r = el.getBoundingClientRect();
    if (!r.width || r.width > 48 || r.height > 48 || r.top > box.top + 64 || r.left < box.left + box.width / 2) continue;
    if (r.right > menuRight) {
      menu = el;
      menuRight = r.right;
    }
  }
  return menu;
}

/** What the weigh button takes from the engine's menu button to look like its neighbour. */
const MENU_LOOK = ['--anubis-weigh-size', '--anubis-weigh-radius', '--anubis-weigh-color', '--anubis-weigh-opacity'];

/**
 * Just under the engine's menu button and centred on it, at its size, shape, and
 * colour, so the two read as a pair of options. The engine cuts a long address off
 * before the menu, so the spot under it is free on every result. As bright as the
 * menu button, so a faint menu makes a faint button.
 */
function placeNextToMenu(host: HTMLElement, container: HTMLElement, menu: HTMLElement, where: 'under' | 'beside'): void {
  const box = container.getBoundingClientRect();
  const m = menu.getBoundingClientRect();
  const cs = getComputedStyle(container);
  const ms = getComputedStyle(menu);
  const size = Math.round(Math.min(44, Math.max(20, m.width, m.height)));
  const top =
    (where === 'under' ? m.bottom + 2 : m.top + (m.height - size) / 2) - box.top - parseFloat(cs.borderTopWidth);
  const right =
    box.right - parseFloat(cs.borderRightWidth) - m.right + (where === 'under' ? (m.width - size) / 2 : -size - 4);
  host.style.setProperty('top', `${Math.round(top)}px`, 'important');
  host.style.setProperty('right', `${Math.round(right)}px`, 'important');
  host.style.setProperty('--anubis-weigh-size', `${size}px`);
  host.style.setProperty('--anubis-weigh-radius', parseFloat(ms.borderTopLeftRadius) ? ms.borderTopLeftRadius : '50%');
  // In the menu button's own colour (its icon's fill, or its text colour), so the
  // pair match in light and dark; hovering still turns it gold.
  // The drawn shape first (Yandex's dots are circles); the svg's own fill is the page default.
  const icon = menu.querySelector('path, circle, rect, polygon, ellipse') ?? menu.querySelector('svg');
  const fill = icon ? getComputedStyle(icon).fill : '';
  const color = /^rgba?\(/.test(fill) && !/,\s*0\)$/.test(fill) ? fill : ms.color;
  host.style.setProperty('--anubis-weigh-color', color);
  // As bright as the menu button is, not the faint default: the pair should look alike.
  const shown = (parseFloat(ms.opacity) || 1) * (icon ? parseFloat(getComputedStyle(icon).opacity) || 1 : 1);
  if (shown > 0.35) host.style.setProperty('--anubis-weigh-opacity', String(Math.round(shown * 100) / 100));
  else host.style.removeProperty('--anubis-weigh-opacity');
}

export function weighButtonOf(container: HTMLElement): HTMLButtonElement | undefined {
  const host = weighHosts.get(container);
  return host ? (roots.get(host)?.querySelector('button') ?? undefined) : undefined;
}

// ---------------------------------------------------------------------------
// One quiet line in place of a hidden result

/**
 * "hidden by your list", "hidden because it’s tagged “AI slop”", "hidden by Copycats removal"…
 * `count` is how many results the line stands for, so the words agree with them.
 */
export function hiddenReason(verdict: Verdict, tags: Map<string, TagDef>, count = 1): string {
  const by = verdict.hiddenBy;
  if (!by) return tn('barHidden', count);
  if (by.kind === 'personal') return tn('barHiddenByYou', count);
  if (by.kind === 'tag') return tn('barHiddenByTag', count, tags.get(by.name)?.label ?? by.name);
  if (by.kind === 'lens') return tn('barHiddenByLens', count, by.name);
  return tn('barHiddenByList', count, by.name);
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

  const count = 1 + more.length;
  const sameWhy = more.every((v) => hiddenReason(v, tags) === hiddenReason(verdict, tags));
  const why = sameWhy ? hiddenReason(verdict, tags, count) : tn('barHidden', count);
  const site = normalizeHostname(result.host);
  render(host, JSON.stringify([site, why, more.length, sameWhy]), () =>
    h(
      'div',
      { class: 'gone' },
      icon(ICON_HIDE),
      h(
        'span',
        { class: 'why' },
        h('b', null, site),
        more.length ? ` ${tn('hiddenMore', more.length)}${gap()}` : ' ',
        why,
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
/** The list of results, which the summary also lines up with where the area is wider (DuckDuckGo's spans the side panel). */
let summaryColumn: HTMLElement | undefined;
/** The first few results' titles, for how far in from the results' edges their text starts. */
let summaryTitles: HTMLElement[] = [];
/** Places that didn't put the summary above the results once the page had loaded, so aren't tried again. */
const misplaced = new WeakSet<HTMLElement>();
const misplacedInside = new WeakSet<HTMLElement>();
let realignOnResize = false;
/** Details is open in the summary on phones. Kept here, so the next pass keeps it open. */
let summaryDetails = false;

/**
 * Where the summary goes: just before `before`. When that's outside the results
 * `area` (above an AI answer), the summary lines up with the area. If the page's
 * layout puts it anywhere but above the results (the AI answer is one cell of a
 * grid, and the summary would get a cell of its own), it goes at the top of the AI
 * answer instead, and failing that before `fallback`.
 */
export interface SummaryPlace {
  before: HTMLElement;
  area?: HTMLElement;
  column?: HTMLElement;
  titles?: HTMLElement[];
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
    stats.total > 0 || hiddenCount(stats) || stats.pinned || stats.raised || stats.lowered || stats.tagged || stats.canGoDeeper || stats.pages > 1 || stats.stopped || change;
  if (!place?.before.parentElement || !worthShowing) {
    summaryHost?.remove();
    summaryArea = undefined;
    summaryColumn = undefined;
    return;
  }
  summaryHost ??= makeHost('anubis-summary', theme).host;
  // One summary: another is left over from an earlier copy of the extension.
  for (const other of document.querySelectorAll('anubis-summary')) if (other !== summaryHost) other.remove();
  const tryFirst = !!place.fallback && !misplaced.has(place.before);
  // Never inside an answer clean-up has removed: the summary would go with it.
  const removed = place.before.hasAttribute('data-anubis-removed') && !place.before.hasAttribute('data-anubis-reveal');
  const inside = place.fallback && !removed && !misplacedInside.has(place.before) ? topOf(place.before) : undefined;
  if (tryFirst) {
    if (summaryHost.nextElementSibling !== place.before) place.before.before(summaryHost);
  } else if (inside) {
    if (summaryHost.parentElement !== inside || summaryHost.previousElementSibling) inside.prepend(summaryHost);
  } else {
    const before = place.fallback ?? place.before;
    if (summaryHost.nextElementSibling !== before) before.before(summaryHost);
  }
  keepUpright(summaryHost);
  summaryHost.dataset.theme = theme;

  // On phones the full sentence runs to several lines, so the summary says it in a
  // few words and keeps the rest (the sentence, Load more results, settings, and the
  // tags) behind Details. shadow.css shows the short form only on narrow screens.
  const short = shortSummary(stats);
  const compact = !!short || stats.tags.length > 0 || stats.canGoDeeper || stats.loading;
  const host = summaryHost;
  const build = () =>
    h(
      'div',
      { class: `summary${compact ? ' compact' : ''}${summaryDetails ? ' open' : ''}` },
      // The sentence and its buttons: on phones they run on as one paragraph, so the
      // buttons follow the words and wrap with them; wider, the line steps aside
      // (display: contents) and each is laid out on its own.
      h(
        'span',
        { class: 'line' },
        short ? h('span', { class: 'sentence short' }, short) : null,
        h('span', { class: short ? 'sentence long' : 'sentence' }, summarySentence(stats)),
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
                class: 'text-btn deeper',
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
        compact
          ? h(
              'button',
              {
                class: 'text-btn details',
                type: 'button',
                attrs: { 'aria-expanded': String(summaryDetails), 'data-focus-key': 'details' },
                on: {
                  click: () => {
                    summaryDetails = !summaryDetails;
                    render(host, JSON.stringify([stats, change, summaryDetails]), build);
                  },
                },
              },
              summaryDetails ? t('summaryFewerDetails') : t('summaryDetails'),
            )
          : null,
      ),
      // Why Load more results stopped, with the page it tried, to see for yourself.
      stats.stopped
        ? h(
            'div',
            { class: 'change stopped', attrs: { role: 'status' } },
            h('span', null, stoppedSentence(stats.stopped, stats.engine)),
            stats.stopped.url
              ? h(
                  'a',
                  {
                    class: 'text-btn',
                    href: stats.stopped.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    title: t('loadMoreOpenTitle', stats.engine),
                    attrs: { 'data-focus-key': 'open-page' },
                  },
                  t('loadMoreOpen', stats.stopped.page),
                )
              : null,
          )
        : null,
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
    );
  render(summaryHost, JSON.stringify([stats, change, summaryDetails]), build);

  announce(summaryHost, change ?? '');

  summaryColumn = place.column;
  summaryTitles = place.titles ?? [];
  summaryArea = place.area && !place.area.contains(summaryHost) ? place.area : undefined;
  alignSummary();
  // While the page is still loading, its layout may not be final: a place that
  // fails is only given up once it has loaded, and tried again next pass until then.
  const loaded = document.readyState === 'complete';
  let tryInside = !tryFirst && !!inside;
  if (tryFirst && summaryArea && !aboveResults(summaryHost, place.before, summaryArea)) {
    if (loaded) misplaced.add(place.before);
    if (inside) {
      inside.prepend(summaryHost);
      tryInside = true;
    } else place.fallback!.before(summaryHost);
    keepUpright(summaryHost);
    summaryArea = place.area && !place.area.contains(summaryHost) ? place.area : undefined;
    alignSummary();
  }
  if (tryInside && summaryArea && !aboveResults(summaryHost, summaryHost.nextElementSibling ?? place.before, summaryArea)) {
    // A removed AI answer hides the summary with it; it's tried again once it's shown.
    if (loaded && summaryHost.getBoundingClientRect().width) misplacedInside.add(place.before);
    place.fallback!.before(summaryHost);
    keepUpright(summaryHost);
    summaryArea = place.area && !place.area.contains(summaryHost) ? place.area : undefined;
    alignSummary();
  }
  if ((summaryArea || summaryColumn) && !realignOnResize) {
    realignOnResize = true;
    let queued = false;
    addEventListener('resize', () => {
      if (queued || !(summaryArea || summaryColumn)) return;
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
 * Inset the summary so it lines up with the results: with the results area when
 * it sits outside it, with the list of results when that's narrower, and with the
 * results' text where they're cards. Only the
 * host's padding changes, so its own box stays where the page lays it out.
 */
function alignSummary(): void {
  const host = summaryHost;
  if (!host) return;
  for (const prop of ['padding-left', 'padding-right', 'box-sizing', 'margin-top']) host.style.removeProperty(prop);
  if (!host.isConnected) return;
  // Above an AI answer, nothing on the page spaces the summary from the tabs above it.
  if (summaryArea && !summaryArea.contains(host)) host.style.setProperty('margin-top', '16px', 'important');
  let box = host.getBoundingClientRect();
  if (!box.width) return;
  // First in a block that starts right where it does (Google's results sit flush
  // under the tabs): keep it off the line above.
  const parent = host.parentElement;
  if (parent && !host.style.getPropertyValue('margin-top')) {
    let before = host.previousElementSibling;
    while (before && (OWN_TAGS.has(before.tagName) || !before.getBoundingClientRect().height)) before = before.previousElementSibling;
    const top = parent.getBoundingClientRect().top + (parseFloat(getComputedStyle(parent).paddingTop) || 0);
    if (!before && Math.abs(box.top - top) < 2 && parseFloat(getComputedStyle(host).marginTop) < 8) {
      host.style.setProperty('margin-top', '4px', 'important');
      box = host.getBoundingClientRect();
    }
  }
  let left = box.left;
  let right = box.right;
  for (const el of [summaryArea, summaryColumn]) {
    if (!el?.isConnected || el.contains(host)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    left = Math.max(left, r.left);
    right = Math.min(right, r.right);
  }
  // Where results are cards (Brave's), in from their edges as far as their text is.
  const title = summaryTitles.map((el) => el.getBoundingClientRect()).find((r) => r.width);
  const inset = title ? title.left - left : 0;
  if (inset > 0 && inset <= 48) {
    left += inset;
    right -= inset;
  }
  const padLeft = Math.max(0, Math.round(left - box.left));
  const padRight = Math.max(0, Math.round(box.right - right));
  if (!padLeft && !padRight) return;
  host.style.setProperty('box-sizing', 'border-box', 'important');
  if (padLeft) host.style.setProperty('padding-left', `${padLeft}px`, 'important');
  if (padRight) host.style.setProperty('padding-right', `${padRight}px`, 'important');
}

/**
 * Where the summary goes at the top of a block: the block itself, or, where the
 * block lays out its children in a row or grid, its first child that doesn't.
 */
function topOf(block: HTMLElement): HTMLElement | undefined {
  let el: Element | null = block;
  for (let depth = 0; el instanceof HTMLElement && depth < 6; depth++) {
    if (!/(^|-)(flex|grid)$/.test(getComputedStyle(el).display)) return el;
    // The summary itself may already be the first child.
    el = el.firstElementChild;
    while (el && OWN_TAGS.has(el.tagName)) el = el.nextElementSibling;
  }
  return undefined;
}

/** Above the results area and across it, and above `next` when that's showing. */
function aboveResults(host: HTMLElement, next: Element, area: HTMLElement): boolean {
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
  buttonsInGutter = false;
  summaryColumn = undefined;
  summaryTitles = [];
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
  /** The tags subscribed lists give sites, which the menu shows apart from yours. */
  listTags: Set<string>;
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
    // The button is inside a closed shadow root, so a press on it reaches the page
    // as a press on its host. That press is the button's to handle: it closes the menu.
    const root = anchor.getRootNode();
    const anchorHost = root instanceof ShadowRoot ? root.host : anchor;
    const onDown = (e: Event) => {
      const path = e.composedPath();
      if (!path.includes(host) && !path.includes(anchorHost)) closePopover();
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

  const choices = domainChoices(data.result.host, (d) => !!getSite(data.personalText, d));
  const existing = choices.find((d) => getSite(data.personalText, d));
  const domain = keepDomain && choices.includes(keepDomain) ? keepDomain : (existing ?? siteOf(data.result.host));
  popover.domain = domain;
  popover.host.dataset.theme = data.theme;

  const root = roots.get(popover.host)!;
  const focusKey = root.activeElement?.getAttribute('data-focus-key');
  const oldPop = rendered.get(popover.host) as HTMLElement | undefined;
  const oldBalance = oldPop?.querySelector('svg.balance');
  const pop = buildPopover(data, actions, domain, (d) => {
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
  // The result's whole weight: your ranking, its tags, and its lists.
  requestAnimationFrame(() => requestAnimationFrame(() => setBalance(balance, data.verdict.level, data.verdict.score)));

  const focusTarget =
    (focusKey && root.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)) ||
    root.querySelector<HTMLElement>('.level[aria-pressed="true"]') ||
    root.querySelector<HTMLElement>('.level');
  focusTarget?.focus({ preventScroll: true });
}

/** The weigh buttons whose menu opens beside the result's card, and the selector of that card (`:scope` is the result). */
const popOuts = new WeakMap<HTMLElement, string>();

function position(host: HTMLElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(312, window.innerWidth - 16);
  // Beside the card, level with its top, when there's room: like the engine's own menu.
  const weigh = anchor.getRootNode() instanceof ShadowRoot ? (anchor.getRootNode() as ShadowRoot).host : undefined;
  const selector = weigh && popOuts.get(weigh as HTMLElement);
  const parent = selector ? weigh!.parentElement : undefined;
  const card = parent && selector ? (parent.matches(selector) ? parent : parent.querySelector<HTMLElement>(selector)) ?? undefined : undefined;
  if (card) {
    const c = card.getBoundingClientRect();
    // Not over the button itself, when it sits out past the card's edge.
    const left = Math.max(c.right + 12, rect.right + 8);
    if (left + width <= window.innerWidth - 8) {
      host.style.left = `${left + window.scrollX}px`;
      host.style.top = `${Math.max(window.scrollY + 8, c.top + window.scrollY)}px`;
      return;
    }
  }
  let left = rect.right - width + window.scrollX;
  left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + window.innerWidth - width - 8));
  host.style.left = `${left}px`;
  host.style.top = `${rect.bottom + window.scrollY + 6}px`;
}

/** A list's rule, breaking only after a comma, with each option's name muted and its effect in its ranking's colour. */
function ruleCode(raw: string): HTMLElement {
  return h(
    'code',
    { class: 'rule' },
    ruleParts(raw).map((part, i) => [
      i ? ',' : null,
      i ? h('wbr') : null,
      part.key ? h('span', { class: 'key' }, part.key) : null,
      h('span', { class: part.effect ? `value ${part.effect}` : 'value' }, part.value),
    ]).flat(),
  );
}

function buildPopover(
  data: PopoverData,
  actions: PopoverActions,
  domain: string,
  switchDomain: (d: string) => void,
): HTMLElement {
  const entry = getSite(data.personalText, domain);
  const r = rankingOf(entry, data.baseline);
  const choices = domainChoices(data.result.host, (d) => !!getSite(data.personalText, d));

  const cartouche = siteCartouche(domain, choices, switchDomain, 'site');

  const levels = h(
    'div',
    { class: 'levels', attrs: { role: 'group', 'aria-label': t('popupRankingFor', domain) } },
    LEVELS.map((level) =>
      h(
        'button',
        {
          class: `level ${level}${fromListsClass(level, r)}`,
          type: 'button',
          attrs: { 'aria-pressed': String(r.pressed === level), 'data-focus-key': `level-${level}` },
          on: { click: () => actions.setLevel(domain, nextLevel(level, r)) },
        },
        h('span', { class: 'level-icon' }, icon(levelIcon(level, r.pressed === level ? r.steps : 1))),
        LEVEL_LABELS[level],
      ),
    ),
  );

  // The same words as the popup's This site.
  const hint = rankingHint(domain, data.baseline, r, data.verdict);

  const { mine, fromList, ids: tagIds } = tagOrder(data.tags, entry, data.verdict);
  // Tags you set toggle; tags from lists are shown but fixed.
  const tagItem = (id: string) => {
    const tag = data.tags.get(id)!;
    const on = mine.has(id);
    if (!on && fromList.has(id)) {
      return h(
        'span',
        { class: 'fixed', style: `--c: ${tag.color}` },
        tagMark(data.verdict.tagEffects[id]),
        tag.label,
        tagEffectText(data.verdict.tagEffects[id]),
        tagSource(data.verdict, id),
      );
    }
    return h(
      'button',
      {
        type: 'button',
        style: `--c: ${tag.color}`,
        title: tag.description ?? (on ? t('popupUntag', domain) : t('popupTagSite', domain, tag.label)),
        attrs: { 'aria-pressed': String(on), 'data-focus-key': `tag-${id}` },
        on: { click: () => actions.toggleTag(domain, id) },
      },
      tagMark(on ? data.verdict.tagEffects[id] : undefined, !on),
      tag.label,
      on ? tagEffectText(data.verdict.tagEffects[id]) : null,
    );
  };
  const tagItems = tagPicker(tagIds, data.listTags, tagItem);

  const input = h('input', {
    type: 'text',
    placeholder: t('menuNewTagPlaceholder'),
    maxLength: 32,
    attrs: { 'aria-label': t('menuNewTagLabel'), 'data-focus-key': 'new-tag' },
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
        { class: 'icon-btn close', type: 'button', title: t('menuCloseLabel'), attrs: { 'aria-label': t('menuCloseLabel') }, on: { click: closeAndReturn } },
        icon(ICON_CLOSE),
      ),
    ),
    balanceSvg(),
    levels,
    h('p', { class: 'hint' }, hint),
    h(
      'div',
      { class: 'section' },
      h('h3', null, t('popupTags')),
      yourListTag(entry, ['fixed']),
      tagItems,
      h(
        'div',
        { class: 'new-tag' },
        input,
        h('button', { class: 'text-btn', type: 'button', on: { click: create } }, t('menuAddTagButton')),
      ),
    ),
    reasons.length || suggestLinks.length
      ? h(
          'div',
          { class: 'section' },
          h('h3', null, t('menuWhyHeading')),
          reasons.length
            ? h(
                'ul',
                { class: 'reasons' },
                reasons.map((r) =>
                  h(
                    'li',
                    null,
                    tParts('menuReason', h('b', null, r.list), r.text),
                    r.rule ? h('small', null, t('menuMatchedRule', r.rule.line)) : null,
                    r.rule ? ruleCode(r.rule.raw) : null,
                  ),
                ),
              )
            : null,
          reportLinks.length ? h('p', { class: 'forge' }, tList('menuReport', reportLinks, 'disjunction')) : null,
          suggestLinks.length ? h('p', { class: 'forge' }, tList('menuSuggest', suggestLinks, 'disjunction')) : null,
        )
      : null,
    h(
      'div',
      { class: 'foot' },
      h('span', null, entry ? t('menuSavedNote') : ''),
      settingsButton(actions.settings),
    ),
  );
  return pop;
}
