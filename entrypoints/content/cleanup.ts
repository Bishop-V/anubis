import { AI_ENTRY_POINTS, CLEANUP_SELECTORS, cleanupKindFor, cleanupMarkerFor, type Cleanup, type CleanupKind } from '@/utils/cleanup';
import type { EngineDef } from '@/utils/engines';
import type { FoundResult } from './results';

export interface Clutter {
  block: HTMLElement;
  kind: CleanupKind;
  /** Left out of the summary's count: a tab or link rather than a block of content. */
  uncounted?: boolean;
}

const HEADINGS = 'h1, h2, h3, h4, h5, [role="heading"]';
/** Where a label or marker text can't belong to a block that clean-up removes. The page's header is checked separately. */
const NOT_A_BLOCK = '[data-anubis-result], anubis-summary, nav, [role="navigation"], form[role="search"], a, button, script, style, noscript, template, textarea, select, option';
/** What a tab or button to an AI chat can be, and the item in a row of them that holds one. */
const CONTROL = 'a, button, [role="link"], [role="button"], [role="tab"], [role="option"], [role="menuitem"]';
const ROW_ITEM = '[role="listitem"], [role="tab"], [role="option"], [role="menuitem"], li';
/**
 * Panels an engine puts inside a result: Bing and Google add "People also search
 * for" under a result you went to and came back from.
 */
const INSIDE_RESULTS = new Set<CleanupKind>(['related', 'questions']);

/**
 * Blocks in the results column to remove, found three ways and then widened to the
 * whole block in the column:
 *
 * - a heading element whose text is a known label ("AI Overview", "Videos");
 * - any short text that is a known label, since the label isn't always a heading
 *   (Google's "AI Overview" may be a plain div beside an icon), or that starts
 *   with a known marker ("AI responses may include mistakes");
 * - an engine-specific selector.
 *
 * Only runs once results are on the page, since the column is found from them.
 */
export function findClutter(engine: EngineDef, results: FoundResult[], wanted: Cleanup): Clutter[] {
  if (!results.length || !Object.values(wanted).some(Boolean)) return [];
  const column: Column = { ...mainColumn(results, engine), keep: pagers(engine) };
  // The page's own search box: the first one in the page. A follow-up box inside an
  // AI answer comes later and doesn't protect the answer.
  const searchBox = document.querySelector('form[role="search"], textarea[name="q"], input[name="q"], input[type="search"]');

  const found: Clutter[] = [];
  const seen = new Set<HTMLElement>();
  const add = (block: HTMLElement | undefined, kind: CleanupKind, uncounted = false) => {
    if (!block || seen.has(block) || !safeToRemove(block, column, searchBox)) return;
    seen.add(block);
    found.push({ block, kind, uncounted });
  };
  // A panel's header row can be a block of its own, with the videos and "View all"
  // as the next blocks. When the block is little more than its label, take the
  // blocks after it too, up to a result, the search box or another section.
  const addLabelled = (block: HTMLElement | undefined, kind: CleanupKind) => {
    add(block, kind);
    if (!block || !seen.has(block) || (block.textContent ?? '').trim().length > 40) return;
    let next = block.nextElementSibling;
    for (let i = 0; i < 4 && next instanceof HTMLElement; i++, next = next.nextElementSibling) {
      if (!safeToRemove(next, column, searchBox) || hasSection(next)) break;
      add(next, kind, true);
    }
  };

  const resultAround = (el: Element) => results.find((r) => r.container.contains(el));
  const addInResult = (label: HTMLElement, result: FoundResult, kind: CleanupKind) => {
    // The result's own title and its sitelinks are links.
    if (!INSIDE_RESULTS.has(kind) || label.closest('a, [role="link"]') || label.querySelector('a[href]')) return;
    const block = panelInResult(label, result);
    if (!block || seen.has(block) || (searchBox && block.contains(searchBox))) return;
    seen.add(block);
    found.push({ block, kind });
  };

  for (const heading of document.querySelectorAll<HTMLElement>(HEADINGS)) {
    if (heading.closest('anubis-summary, nav, [role="navigation"], form') || inPageHeader(heading)) continue;
    const kind = cleanupKindFor(heading.textContent ?? '');
    if (!kind || !wanted[kind]) continue;
    const result = resultAround(heading);
    if (result) addInResult(heading, result, kind);
    else addLabelled(labelledBlock(heading, engine, column, levelOf(heading)), kind);
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? '';
    if (text.length > 240 || !text.trim()) continue;
    const label = cleanupKindFor(text);
    const kind = label ?? cleanupMarkerFor(text);
    if (!kind || !wanted[kind]) continue;
    const el = node.parentElement;
    if (!el || inPageHeader(el)) continue;
    const result = resultAround(el);
    if (result) {
      if (label) addInResult(el, result, kind);
      continue;
    }
    if (el.closest(NOT_A_BLOCK)) continue;
    // A label is the block's title: judge its level like a heading's. A marker sits
    // anywhere in the block, so only the column decides how far it reaches.
    if (label) addLabelled(labelledBlock(el, engine, column, levelOf(el.closest<HTMLElement>(HEADINGS) ?? el)), kind);
    else add(blockAround(el, engine, column), kind);
  }

  for (const [kind, selector] of Object.entries(CLEANUP_SELECTORS[engine.id] ?? {}) as [CleanupKind, string][]) {
    if (!wanted[kind]) continue;
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (!el.closest('[data-anubis-result]')) add(blockAround(el, engine, column) ?? el, kind);
    }
  }

  // Tabs and buttons that open an AI chat: Google's "AI Mode" beside All and
  // Images, DuckDuckGo's Duck.ai. The tab's item in its row goes too, when it
  // holds little more than the tab.
  const entry = AI_ENTRY_POINTS[engine.id];
  if (wanted.ai && entry) {
    // Attributes, not properties: SVG icons carry titles too, and have no `title` property.
    const named = (el: Element) =>
      entry.labels.test(el.getAttribute('title')?.trim() ?? '') ||
      entry.labels.test(el.getAttribute('aria-label')?.trim() ?? '') ||
      (el.matches(CONTROL) && entry.labels.test((el.textContent ?? '').trim()));
    for (const el of document.querySelectorAll(`${CONTROL}, [title], [aria-label]`)) {
      if (!(entry.selector && el.matches(entry.selector)) && !named(el)) continue;
      const control = el.closest<HTMLElement>(CONTROL) ?? (el instanceof HTMLElement ? el : undefined);
      if (!control || control.closest('[data-anubis-result], anubis-summary')) continue;
      const item = control.parentElement?.closest<HTMLElement>(ROW_ITEM);
      add(item && textLength(item) <= textLength(control) + 12 ? item : control, 'ai', true);
    }
  }

  // One block can be found several ways; keep the outermost.
  return found.filter((c) => !found.some((other) => other !== c && other.block.contains(c.block)));
}

/**
 * The main list of results and the results in it. Other results (the videos in a
 * video panel, which have titles like results) don't protect a block from removal.
 */
interface Column {
  list: HTMLElement | undefined;
  results: HTMLElement[];
  /** What a block may never take with it: the links to later pages. */
  keep?: Element[];
}

/** The element holding most web results, and those results. Also where the summary goes. */
export function mainColumn(results: FoundResult[], engine: Pick<EngineDef, 'displayed'>): Column {
  // Web results show their address; videos in a panel don't, and a panel of them
  // can outnumber the results in any one wrapper (Google groups some results).
  const withAddress = results.filter((r) => r.container.querySelector(engine.displayed ?? 'cite'));
  const main = withAddress.length ? withAddress : results;
  const counts = new Map<HTMLElement, number>();
  for (const r of main) {
    const parent = r.container.parentElement;
    if (parent) counts.set(parent, (counts.get(parent) ?? 0) + 1);
  }
  let list: HTMLElement | undefined;
  for (const [parent, n] of counts) if (!list || n > counts.get(list)!) list = parent;
  return { list, results: main.map((r) => r.container) };
}

/**
 * The block a recognised heading belongs to. Where the engine marks its blocks
 * (Google's data-rpos), the marked block around the heading, widened to the column;
 * otherwise worked out from the page's structure.
 */
function labelledBlock(label: HTMLElement, engine: EngineDef, column: Column, level: number): HTMLElement | undefined {
  const marked = engine.blocks ? label.closest<HTMLElement>(engine.blocks) : null;
  if (!marked || column.results.some((r) => r.contains(marked) || marked.contains(r)) || column.keep?.some((k) => marked.contains(k))) {
    return blockAround(label, engine, column, level);
  }
  // Only if the marked block is in the results column (not a side panel).
  const whole = blockAround(marked, engine, column);
  if (!whole) return undefined;
  // One section of a bigger block ("Images" in a panel) is just that section.
  const labelLength = textLength(label);
  for (let block = label; block !== marked && block.parentElement; block = block.parentElement) {
    if (!headerOnly(block, labelLength) && hasSiblingSection(block.parentElement, block, level)) return block;
  }
  return whole;
}

/**
 * The block in the results column holding `start`: climb until the parent is the
 * main results list, the engine's results boundary, or an element inside that
 * boundary that also holds main results. A heading that never reaches the column
 * (a side panel) isn't touched. Starting from a heading, the climb also stops below
 * a parent with another heading of the same or higher level: the block is one
 * section of a bigger panel ("Images" inside a knowledge panel), not the whole panel.
 * It also stops below a parent holding the links to later pages, which can share a
 * block with related searches at the bottom of the page.
 */
function blockAround(start: HTMLElement, engine: EngineDef, column: Column, level?: number): HTMLElement | undefined {
  let block = start;
  const labelLength = (start.textContent ?? '').trim().length;
  // The section, once found; the climb goes on to check it's in the column.
  let section: HTMLElement | undefined;
  for (let depth = 0; depth < 30; depth++) {
    const parent = block.parentElement;
    if (!parent || parent === document.body || parent === document.documentElement) return undefined;
    if (!section && column.keep?.some((k) => parent.contains(k) && !block.contains(k))) section = block;
    if (parent === column.list) return section ?? block;
    if (engine.boundary && parent.matches(engine.boundary)) return section ?? block;
    if ((!engine.boundary || parent.closest(engine.boundary)) && column.results.some((r) => parent.contains(r))) return section ?? block;
    // A section holds more than its heading: a header row on its own isn't one.
    if (!section && level !== undefined && !headerOnly(block, labelLength) && hasSiblingSection(parent, block, level)) section = block;
    block = parent;
  }
  return undefined;
}

/** h1–h6 by tag; `role="heading"` by `aria-level`, which defaults to 2. */
function levelOf(heading: HTMLElement): number {
  const tag = /^H([1-6])$/.exec(heading.tagName);
  if (tag) return Number(tag[1]);
  return Number(heading.getAttribute('aria-level')) || 2;
}

function hasSiblingSection(parent: HTMLElement, block: HTMLElement, level: number): boolean {
  for (const other of parent.querySelectorAll<HTMLElement>(HEADINGS)) {
    if (block.contains(other) || other.closest('[data-anubis-result]') || isItemTitle(other, parent)) continue;
    if (getComputedStyle(other).display === 'none') continue;
    if (levelOf(other) <= level && (other.textContent ?? '').trim()) return true;
  }
  return false;
}

function textLength(el: HTMLElement): number {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim().length;
}

/** Little more than the label (a header row with a menu button), and no pictures. */
function headerOnly(block: HTMLElement, labelLength: number): boolean {
  return textLength(block) <= labelLength + 12 && !block.querySelector('img, picture, video, canvas, iframe');
}

/** Holds a heading that starts a section of its own, not just items' titles. */
function hasSection(el: HTMLElement): boolean {
  const headings = el.matches(HEADINGS) ? [el] : [...el.querySelectorAll<HTMLElement>(HEADINGS)];
  return headings.some((h) => !isItemTitle(h, el) && (h.textContent ?? '').trim());
}

/**
 * The title of one item in a panel (a video in a row of videos), not a section of
 * it: it's a link or holds one, or it sits in one of several look-alike cards.
 */
function isItemTitle(heading: HTMLElement, within: HTMLElement): boolean {
  if (heading.closest('a, [role="link"], [jsaction]') || heading.querySelector('a[href], [role="link"]')) return true;
  for (let el: HTMLElement | null = heading; el && el !== within; el = el.parentElement) {
    const siblings = el.parentElement ? [...el.parentElement.children] : [];
    const alike = siblings.filter((s) => s.tagName === el!.tagName && s.className === el!.className && (s.matches(HEADINGS) || s.querySelector(HEADINGS)));
    if (alike.length >= 2 && el.className) return true;
  }
  return false;
}

/**
 * Never remove the main results, the page's search box, the links to later pages,
 * or Anubis's own summary. Results inside a panel (its videos) go with the panel.
 */
function safeToRemove(block: HTMLElement, column: Column, searchBox: Element | null): boolean {
  return (
    block !== document.body &&
    !column.results.some((r) => r.contains(block) || block.contains(r)) &&
    !(column.list && block.contains(column.list)) &&
    !block.querySelector('anubis-summary') &&
    !(searchBox && block.contains(searchBox)) &&
    !column.keep?.some((k) => block.contains(k))
  );
}

/**
 * The links to later pages ("Gooooogle 1 2 3 Next"): the engine's own Next link or
 * More button with the row around it, and any navigation of page numbers.
 */
function pagers(engine: EngineDef): Element[] {
  const out = new Set<Element>();
  const more = engine.more;
  const own = more?.kind === 'link' ? document.querySelector(more.next) : more?.kind === 'click' ? document.querySelector(more.button) : null;
  if (own) out.add(own.closest('[role="navigation"], nav, table') ?? own);
  for (const nav of document.querySelectorAll('[role="navigation"], nav')) {
    const numbers = [...nav.querySelectorAll('a, [role="link"]')].filter((a) => /^\s*\d+\s*$/.test(a.textContent ?? ''));
    if (numbers.length >= 2) out.add(nav);
  }
  return [...out];
}

/**
 * The page's own header, where tabs named like panels ("Videos", "News") live. A
 * panel's own header (Brave puts each panel's title in one) doesn't count.
 */
function inPageHeader(el: Element): boolean {
  const header = el.closest('header');
  if (!header) return false;
  return !header.parentElement?.closest('main, [role="main"], article, section, aside, li') || !!header.querySelector('form, input, textarea, [role="search"]');
}

/**
 * The panel around a label inside a result: climb from the label while the parent
 * holds neither the result's title nor text of its own (the result's snippet).
 * The panel's own text is mostly links or buttons (other searches, questions).
 */
function panelInResult(label: HTMLElement, result: FoundResult): HTMLElement | undefined {
  let block = label;
  for (let parent = block.parentElement; parent && parent !== result.container; parent = parent.parentElement) {
    if (parent.contains(result.link) || parent.contains(result.titleBlock)) break;
    if (plainTextLength(parent) - plainTextLength(block) > 40) break;
    block = parent;
  }
  return block.contains(result.link) ? undefined : block;
}

/** Text outside links and buttons. */
function plainTextLength(el: HTMLElement): number {
  let n = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('a, button, [role="button"], [role="link"]')) continue;
    n += (node.nodeValue ?? '').replace(/\s+/g, ' ').trim().length;
  }
  return n;
}

const WEB_TAB_KEY = 'anubis:all-tab';

/**
 * Where to send this page instead, or undefined: "Always open the Web tab" adds
 * Google's `udm=14`, unless you chose the All tab for this search.
 */
export function redirectFor(engine: EngineDef, url: URL, googleWebTab: boolean): string | undefined {
  if (engine.id === 'google' && googleWebTab && url.pathname === '/search' && !url.searchParams.has('udm') && !url.searchParams.has('tbm')) {
    let chosen: string | null = null;
    try {
      chosen = sessionStorage.getItem(WEB_TAB_KEY);
    } catch {
      // storage blocked: always redirect
    }
    if (chosen !== null && chosen === url.searchParams.get('q')) return undefined;
    const next = new URL(url);
    next.searchParams.set('udm', '14');
    return next.href;
  }
  return undefined;
}

/** Remember a click on Google's All tab from the Web tab, so it isn't sent straight back. */
export function watchAllTab(): void {
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
      if (!link || new URL(location.href).searchParams.get('udm') !== '14') return;
      const to = new URL(link.href, location.href);
      if (to.origin !== location.origin || to.pathname !== '/search' || to.searchParams.has('udm') || to.searchParams.has('tbm')) return;
      try {
        sessionStorage.setItem(WEB_TAB_KEY, to.searchParams.get('q') ?? '');
      } catch {
        // nothing to remember with
      }
    },
    true,
  );
}
