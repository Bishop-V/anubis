import { dialGeometry, dialSvg, GAUGE_SVG, setDial, setGauge, type DialGeometry } from '@/utils/dial';
import { h, icon } from '@/utils/dom';
import type { Level } from '@/utils/matcher';
import type { FoundResult } from './results';

// The dial on each result (utils/dial.ts draws it): what a weigh host draws, where the dial
// goes round the result's site icon, and a pinned result's frame around it. ui.ts places it.

export type WeighShape = 'dial' | 'gauge' | 'button';
/** What each weigh host draws: its shape, and the dial's drawing and size when it has one. */
const weighParts = new WeakMap<HTMLElement, { key: string; drawing?: Element; geom?: DialGeometry }>();
/** The plain disc a dial goes round where a result shows no site icon. */
const BLANK = 18;
/** The eye that starts a hidden result's one line (.gone svg in shadow.css). */
const BAR_EYE = 14;
/** In a table's narrow number cell (DuckDuckGo Lite), smaller. */
const BLANK_TABLE = 12;
/** How far a pinned result's frame stands off it (page.css draws it there when there's no dial). */
const FRAME_OFF = 7;

/** Draw a weigh host as the dial, the gauge on a card, or the balance button. */
export function shapeWeigh(host: HTMLElement, button: HTMLElement, shape: WeighShape, geom?: DialGeometry, blank = false): void {
  const parts = weighParts.get(host) ?? { key: '' };
  weighParts.set(host, parts);
  const key = `${shape}:${geom?.r ?? ''}:${blank}`;
  if (parts.key === key) return;
  parts.key = key;
  parts.drawing?.remove();
  parts.drawing = undefined;
  parts.geom = geom;
  host.dataset.shape = shape;
  // Where the dial goes round a plain disc, no site icon was found: worth knowing when an engine changes.
  host.toggleAttribute('data-blank', blank);
  button.className = `weigh ${shape}`;
  delete button.dataset.level;
  for (const prop of ['left', 'top', 'width']) button.style.removeProperty(prop);
  // The dial's box covers the site's icon and the title's start: only its crown takes clicks.
  host.style.setProperty('pointer-events', shape === 'dial' ? 'none' : 'auto', 'important');
  host.style.removeProperty('width');
  host.style.removeProperty('height');
  if (shape === 'dial' && geom) {
    const drawing = icon(dialSvg(geom, blank));
    button.before(drawing);
    parts.drawing = drawing;
    button.replaceChildren();
    // The press area: the crown, from the drawing's left edge to just short of the icon.
    button.style.setProperty('left', '0px');
    button.style.setProperty('top', `calc(var(--dial-top, 0px) + ${Math.round(-geom.top - 14)}px)`);
    button.style.setProperty('width', `${Math.round(-geom.r + 2 - geom.left)}px`);
    host.style.setProperty('width', `${Math.ceil(geom.right - geom.left)}px`, 'important');
    host.style.setProperty('height', `${Math.ceil(geom.bottom - geom.top)}px`, 'important');
  } else if (shape === 'gauge') {
    const drawing = icon(GAUGE_SVG);
    button.replaceChildren(drawing);
    parts.drawing = drawing;
  } else button.replaceChildren();
}

/** Turn a host's dial or gauge to the ranking. */
export function showReading(host: HTMLElement, level: Level, score: number): void {
  const parts = weighParts.get(host);
  if (!parts?.drawing) return;
  if (parts.geom) setDial(parts.drawing, parts.geom, level, score);
  else setGauge(parts.drawing, level, score);
}

/**
 * Draw the dial around the result's site icon: the scale on the icon's left and the crown
 * beyond it. Where the result shows no icon, around a plain disc before the title. False
 * when there's no room for the crown, and the balance button is used instead.
 */
export function drawDial(
  host: HTMLElement,
  button: HTMLElement,
  root: ShadowRoot,
  result: FoundResult,
  where: { table: boolean; pinned: boolean; bar?: DOMRect },
): boolean {
  const { container } = result;
  if (where.table) return dialInTable(host, button, container);
  const at = dialAnchor(result, where.bar);
  if (!at) return false;
  const geom = dialGeometry(at.size);
  if (at.x + geom.left < 2) return false;
  shapeWeigh(host, button, 'dial', geom, at.blank);
  host.style.removeProperty('--dial-top');
  if (host.parentElement !== container) container.append(host);
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  const box = moveDialTo(host, container, at, geom);
  frameDial(host, root, container, where.pinned, box, at.x + geom.left - box.left);
  return true;
}

/**
 * The dial in a table row (DuckDuckGo Lite): in the cell with the result's number, whose
 * rows below are empty, so the dial overlaps nothing. False without that cell.
 */
function dialInTable(host: HTMLElement, button: HTMLElement, container: HTMLElement): boolean {
  const cell = container.querySelector<HTMLElement>(':scope > td');
  if (!cell) return false;
  const geom = dialGeometry(BLANK_TABLE);
  shapeWeigh(host, button, 'dial', geom, true);
  if (host.parentElement !== cell) cell.append(host);
  host.style.setProperty('position', 'relative', 'important');
  host.style.setProperty('vertical-align', 'middle', 'important');
  host.style.setProperty('height', '1em', 'important');
  host.style.setProperty('margin-inline-start', '6px', 'important');
  // The disc reaches past the drawing's box on the right: keep the title clear of it.
  host.style.setProperty('margin-inline-end', `${BLANK_TABLE / 2 + 6}px`, 'important');
  host.style.setProperty('--dial-top', `calc(0.5em + ${Math.round(geom.top)}px)`);
  return true;
}

/**
 * A pinned result's frame, drawn with the dial so it takes in the crown on the result's left
 * rather than cutting through it. page.css leaves its own frame off results marked
 * `data-anubis-dial-frame`.
 */
function frameDial(host: HTMLElement, root: ShadowRoot, container: HTMLElement, pinned: boolean, box: DOMRect, crownLeft: number): void {
  container.toggleAttribute('data-anubis-dial-frame', pinned);
  let frame = root.querySelector<HTMLElement>('.pin-frame');
  if (!pinned) {
    frame?.remove();
    return;
  }
  if (!frame) {
    frame = h('div', { class: 'pin-frame' });
    root.prepend(frame);
  }
  const hostLeft = parseFloat(host.style.left) || 0;
  const hostTop = parseFloat(host.style.top) || 0;
  // Clear of the crown, but inside the window.
  const left = Math.max(Math.min(-FRAME_OFF, Math.round(crownLeft) - 8), Math.round(2 - box.left));
  frame.style.setProperty('left', `${left - hostLeft}px`);
  frame.style.setProperty('top', `${-FRAME_OFF - hostTop}px`);
  frame.style.setProperty('width', `${Math.round(box.width) + FRAME_OFF - left}px`);
  frame.style.setProperty('height', `${Math.round(box.height) + 2 * FRAME_OFF}px`);
}

/** Take a pinned result's dial frame away, where the result has no dial. */
export function clearDialFrame(container: HTMLElement, root: ShadowRoot): void {
  container.removeAttribute('data-anubis-dial-frame');
  root.querySelector('.pin-frame')?.remove();
}

interface DialAnchor {
  /** The dial's centre. */
  x: number;
  y: number;
  /** How big the icon it goes round is. */
  size: number;
  /** No icon: a plain disc. */
  blank: boolean;
}

/** Where the dial's centre goes. `bar` is a hidden result's one line, when it's folded into one. */
function dialAnchor(result: FoundResult, bar: DOMRect | undefined): DialAnchor | undefined {
  // A hidden result folded into its one line: around that line's eye, which starts it.
  // Where the page's other results go round plain discs, it keeps to their column instead,
  // before the line. (Hidden lines are drawn after every dial is placed.)
  if (bar) {
    const y = bar.top + bar.height / 2;
    if (pageGoesRoundDiscs()) return { x: bar.left - BLANK / 2 - 10, y, size: BLANK, blank: true };
    return { x: bar.left + BAR_EYE / 2, y, size: BAR_EYE, blank: false };
  }
  const found = siteIconOf(result.container, result.titleBlock);
  if (found) return { x: (found.left + found.right) / 2, y: (found.top + found.bottom) / 2, size: Math.max(found.width, found.height), blank: false };
  const title = result.titleBlock.querySelector<HTMLElement>('h1, h2, h3, h4, [role="heading"]') ?? result.titleBlock;
  const line = firstLineOf(title);
  if (!line?.height) return undefined;
  return { x: line.left - BLANK / 2 - 10, y: (line.top + line.bottom) / 2, size: BLANK, blank: true };
}

/** Whether the page's shown results, not its hidden lines, all go round plain discs. */
function pageGoesRoundDiscs(): boolean {
  const folded = (host: HTMLElement) => !!host.parentElement?.querySelector(':scope > anubis-bar')?.getBoundingClientRect().height;
  const shown = [...document.querySelectorAll<HTMLElement>('anubis-weigh[data-shape="dial"]')].filter((host) => !folded(host));
  return shown.length > 0 && shown.every((host) => host.hasAttribute('data-blank'));
}

/** Put the dial's host over the result, its centre at `at`. Returns the result's box. */
function moveDialTo(host: HTMLElement, container: HTMLElement, at: DialAnchor, geom: DialGeometry): DOMRect {
  const box = container.getBoundingClientRect();
  const cs = getComputedStyle(container);
  host.style.setProperty('position', 'absolute', 'important');
  host.style.setProperty('left', `${Math.round(at.x + geom.left - box.left - parseFloat(cs.borderLeftWidth))}px`, 'important');
  host.style.setProperty('top', `${Math.round(at.y + geom.top - box.top - parseFloat(cs.borderTopWidth))}px`, 'important');
  host.style.setProperty('right', 'auto', 'important');
  host.style.setProperty('bottom', 'auto', 'important');
  host.style.setProperty('z-index', '5', 'important');
  return box;
}

/** Small and square, like a site's icon. */
const iconSized = (r: DOMRect): boolean => r.width >= 12 && r.height >= 12 && r.width <= 40 && r.height <= 40 && Math.abs(r.width - r.height) <= 6;

/** At the result's start, no lower than its title. */
const atResultStart = (r: DOMRect, box: DOMRect, title: DOMRect): boolean =>
  r.left >= box.left - 8 && r.left <= box.left + 56 && r.top <= title.bottom && r.top <= box.top + 90;

/** Of two icons, the one to go round: the higher, then the larger, or the badge around the other. */
function outranks(r: DOMRect, best: DOMRect | undefined): boolean {
  if (!best || r.top < best.top - 3) return true;
  if (Math.abs(r.top - best.top) <= 3 && r.width > best.width) return true;
  return r.left <= best.left && r.right >= best.right && r.top <= best.top && r.bottom >= best.bottom;
}

/**
 * The result's site icon: a small, square picture at the result's start, beside or above
 * its title. Where an icon sits in a larger round or square badge (Google's), the badge.
 */
function siteIconOf(container: HTMLElement, titleBlock: HTMLElement): DOMRect | undefined {
  const box = container.getBoundingClientRect();
  if (!box.width) return undefined;
  // The title's own heading; where it has none, the title block, which can hold the icon too (Brave's link).
  const heading = titleBlock.querySelector<HTMLElement>('h1, h2, h3, h4, [role="heading"]');
  const t = (heading ?? titleBlock).getBoundingClientRect();
  let best: DOMRect | undefined;
  for (const el of container.querySelectorAll<HTMLElement>('img, svg, [class*="icon" i], [class*="pic" i], [class*="logo" i]')) {
    if (el.closest('button, [role="button"]') || heading?.contains(el)) continue;
    const r = el.getBoundingClientRect();
    if (!iconSized(r) || !atResultStart(r, box, t)) continue;
    if (el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) === false) continue;
    if (outranks(r, best)) best = r;
  }
  return best;
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
