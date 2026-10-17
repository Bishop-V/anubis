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
 * Put the button in the column left of the result, at its left edge's height for now:
 * ui.ts then lines it up with the result's first row. False when the window has no room.
 */
export function toColumn({ host }: Weigh, result: FoundResult): boolean {
  const { container } = result;
  const box = container.getBoundingClientRect();
  if (!box.width || box.left - BUTTON - GAP < EDGE) return false;
  if (host.parentElement !== container) container.append(host);
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  const border = parseFloat(getComputedStyle(container).borderLeftWidth) || 0;
  host.style.setProperty('position', 'absolute', 'important');
  host.style.setProperty('left', `${-BUTTON - GAP - border}px`, 'important');
  host.style.setProperty('right', 'auto', 'important');
  host.style.setProperty('bottom', 'auto', 'important');
  host.style.setProperty('z-index', '5', 'important');
  return true;
}

type Row = { top: number; bottom: number };

/**
 * Centre the button on the result's first row, or on a hidden result's one line (`bar`).
 * False when the result shows no row to go by.
 */
export function lineUpInColumn(host: HTMLElement, container: HTMLElement, bar: DOMRect | undefined): boolean {
  const row = bar?.height ? bar : firstRowOf(container);
  if (!row) return false;
  const box = container.getBoundingClientRect();
  const border = parseFloat(getComputedStyle(container).borderTopWidth) || 0;
  const y = (row.top + row.bottom) / 2 - BUTTON / 2 - box.top - border;
  host.style.setProperty('top', `${Math.round(y)}px`, 'important');
  return true;
}

/** Small and square, like a site's icon. */
const iconSized = (r: DOMRect): boolean => Math.min(r.width, r.height) >= 10 && Math.max(r.width, r.height) <= 40 && Math.abs(r.width - r.height) <= 6;

/** A site's icon of the result's own, shown. */
const isIcon = (el: Element): boolean =>
  !el.closest('anubis-weigh, anubis-chips, anubis-bar') && el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) !== false;

/**
 * The result's first row: its first words, or a site's icon above or beside them,
 * whichever is higher. On most engines, the site's icon and name.
 */
function firstRowOf(container: HTMLElement): Row | undefined {
  let row: Row | undefined = firstLineOf(container);
  for (const el of container.querySelectorAll('img, svg')) {
    const r = el.getBoundingClientRect();
    const higher = !row || r.top < row.top - 1;
    if (higher && iconSized(r) && isIcon(el)) row = r;
  }
  return row && { top: row.top, bottom: row.bottom };
}

/**
 * A pinned result's frame, drawn with the button so it takes it in rather than leaving it
 * outside. page.css leaves its own frame off results marked `data-anubis-column-frame`.
 */
function frameColumn({ host, root }: Weigh, container: HTMLElement): void {
  container.setAttribute('data-anubis-column-frame', '');
  let frame = root.querySelector<HTMLElement>('.pin-frame');
  if (!frame) {
    frame = h('div', { class: 'pin-frame' });
    root.prepend(frame);
  }
  const box = container.getBoundingClientRect();
  const hostLeft = parseFloat(host.style.left) || 0;
  const hostTop = parseFloat(host.style.top) || 0;
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
