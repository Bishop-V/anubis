import { h } from '@/utils/dom';
import type { FoundResult } from './results';

// The button in a column left of each result (desktop): it shows the result's ranking and
// opens the result menu. Where a result has no room on its left, ui.ts places the button
// in its corner instead.

/** A weigh host, the button inside it, and its shadow root. */
export interface Weigh {
  host: HTMLElement;
  button: HTMLElement;
  root: ShadowRoot;
}

/** The button's size, and the gap between it and the result. */
const BUTTON = 28;
const GAP = 12;
/** The least room the column needs between the button and the window's edge. */
const EDGE = 4;
/** How far a pinned result's frame stands off it (page.css draws it there without the column). */
const FRAME_OFF = 7;
/** The room between the frame and the button inside it. */
const FRAME_PAD = 10;

/**
 * Put the button in the column left of the result, `GAP` from where its words or icon start,
 * at its top for now: lineUpInColumn then lines it up with the result's first row. `bar` is a
 * hidden result's one line, when it's folded into one. False when the window has no room.
 */
export function toColumn({ host }: Weigh, result: FoundResult, bar: DOMRect | undefined): boolean {
  const { container } = result;
  const box = container.getBoundingClientRect();
  // Engines pad a result inside its box (DuckDuckGo): the gap is kept from what it shows.
  // A hidden result's one line keeps to the column of the results shown.
  const start = bar?.height ? box.left + indent : (contentStart(result) ?? box.left);
  if (!box.width || start - BUTTON - GAP < EDGE) return false;
  if (!bar?.height) indent = Math.max(0, Math.round(start - box.left));
  holdIn(host, container);
  const border = px(getComputedStyle(container).borderLeftWidth);
  host.style.setProperty('position', 'absolute', 'important');
  host.style.setProperty('left', `${Math.round(start - box.left - border) - BUTTON - GAP}px`, 'important');
  host.style.setProperty('right', 'auto', 'important');
  host.style.setProperty('bottom', 'auto', 'important');
  host.style.setProperty('z-index', '5', 'important');
  return true;
}

/** How far in from its box a shown result's words start, for hidden results' lines to match. */
let indent = 0;

/** How far in from its own edge a hidden result's one line starts its words, to line up with the titles of the results shown. */
export function lineIndent(line: HTMLElement, container: HTMLElement): number {
  const offset = line.getBoundingClientRect().left - container.getBoundingClientRect().left;
  return Math.max(0, indent - Math.round(offset));
}

/** Where the result's first row or its title starts, whichever is further left. */
function contentStart({ container, titleBlock }: FoundResult): number | undefined {
  const lefts = [firstRowOf(container), firstLineOf(titleBlock)].flatMap((r) => (r ? [r.left] : []));
  return lefts.length ? Math.min(...lefts) : undefined;
}

/** The host inside the result, which it's placed from. */
function holdIn(host: HTMLElement, container: HTMLElement): void {
  if (host.parentElement !== container) container.append(host);
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
}

/** A length in pixels, or none. */
const px = (value: string): number => parseFloat(value) || 0;

type Row = { top: number; bottom: number; left: number };

/**
 * Centre the button on the result's first row, or on a hidden result's one line (`bar`).
 * False when the result shows no row to go by.
 */
export function lineUpInColumn(host: HTMLElement, container: HTMLElement, bar: DOMRect | undefined): boolean {
  const row = bar?.height ? bar : firstRowOf(container);
  if (!row) return false;
  const box = container.getBoundingClientRect();
  const border = px(getComputedStyle(container).borderTopWidth);
  const y = (row.top + row.bottom) / 2 - BUTTON / 2 - box.top - border;
  host.style.setProperty('top', `${Math.round(y)}px`, 'important');
  return true;
}

/** What can be a site's icon: a picture, or a box named for one (DuckDuckGo's favicon). */
const ICONS = 'img, svg, [class*="icon" i]';

/** Small and square, like a site's icon. */
const iconSized = (r: DOMRect): boolean => Math.min(r.width, r.height) >= 10 && Math.max(r.width, r.height) <= 40 && Math.abs(r.width - r.height) <= 6;

/** A site's icon of the result's own, shown. */
const isIcon = (el: Element): boolean =>
  !el.closest('anubis-weigh, anubis-chips, anubis-bar') && el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) !== false;

/**
 * The result's first row: its first words, or a site's icon above or beside them,
 * whichever is higher. On most engines, the site's icon and name, where the result starts.
 */
function firstRowOf(container: HTMLElement): Row | undefined {
  let row: Row | undefined = firstLineOf(container);
  for (const el of container.querySelectorAll(ICONS)) row = iconAbove(el, row) ?? row;
  return row && { top: row.top, bottom: row.bottom, left: rowStart(container, row) };
}

/** Where the row starts: at an icon that leads it, or at its words. */
function rowStart(container: HTMLElement, row: Row): number {
  let left = row.left;
  for (const el of container.querySelectorAll(ICONS)) left = Math.min(left, iconInRow(el, row) ?? left);
  return left;
}

/** The left edge of the element, where it's a site's icon in the row. */
function iconInRow(el: Element, row: Row): number | undefined {
  const r = el.getBoundingClientRect();
  if (r.top >= row.bottom || r.bottom <= row.top) return undefined;
  if (!iconSized(r)) return undefined;
  return isIcon(el) ? r.left : undefined;
}

/** The element's box, where it's a site's icon higher than `row`. */
function iconAbove(el: Element, row: Row | undefined): DOMRect | undefined {
  const r = el.getBoundingClientRect();
  if (row && r.top >= row.top - 1) return undefined;
  if (!iconSized(r)) return undefined;
  return isIcon(el) ? r : undefined;
}

/**
 * A pinned result's frame, drawn with the button so it takes it in rather than leaving it
 * outside. page.css leaves its own frame off results marked `data-anubis-column-frame`.
 */
function frameColumn({ host, root }: Weigh, container: HTMLElement): void {
  container.setAttribute('data-anubis-column-frame', '');
  const frame = root.querySelector<HTMLElement>('.pin-frame') ?? root.insertBefore(h('div', { class: 'pin-frame' }), root.firstChild);
  const box = container.getBoundingClientRect();
  const hostLeft = px(host.style.left);
  const hostTop = px(host.style.top);
  // Round the button with room to spare, but inside the window.
  const left = Math.max(hostLeft - FRAME_PAD, Math.round(2 - box.left));
  const top = Math.min(-FRAME_OFF, hostTop - FRAME_PAD);
  frame.style.setProperty('left', `${left - hostLeft}px`);
  frame.style.setProperty('top', `${top - hostTop}px`);
  frame.style.setProperty('width', `${Math.round(box.width) + FRAME_OFF - left}px`);
  frame.style.setProperty('height', `${Math.round(box.height) + FRAME_OFF - top}px`);
}

/** Frame the result where it's pinned, or take its frame away. */
export function setColumnFrame(weigh: Weigh, container: HTMLElement, pinned: boolean): void {
  if (pinned) frameColumn(weigh, container);
  else clearColumnFrame(weigh, container);
}

/** Take a pinned result's frame away, where it isn't pinned or its button isn't in the column. */
export function clearColumnFrame({ root }: Weigh, container: HTMLElement): void {
  container.removeAttribute('data-anubis-column-frame');
  root.querySelector('.pin-frame')?.remove();
}

/**
 * The first line of an element's words. A range over the whole element also reports
 * the boxes of the elements inside it, which can span every line (Google's phone
 * titles), so only text counts.
 */
export function firstLineOf(el: HTMLElement): DOMRect | undefined {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    const rect = [...range.getClientRects()].find((r) => r.width && r.height);
    if (rect) return rect;
  }
  return undefined;
}
