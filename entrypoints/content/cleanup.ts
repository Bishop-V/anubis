import { CLEANUP_SELECTORS, cleanupKindFor, cleanupMarkerFor, type Cleanup, type CleanupKind } from '@/utils/cleanup';
import type { EngineDef } from '@/utils/engines';
import type { FoundResult } from './results';

export interface Clutter {
  block: HTMLElement;
  kind: CleanupKind;
  /** Left out of the summary's count: a tab or link rather than a block of content. */
  uncounted?: boolean;
}

const HEADINGS = 'h1, h2, h3, h4, h5, [role="heading"]';
/** Where a label or marker text can't belong to a block that clean-up removes. */
const NOT_A_BLOCK = '[data-anubis-result], anubis-summary, header, nav, [role="navigation"], form[role="search"], a, button, script, style, noscript, template, textarea, select, option';

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
  const lists = new Set<Element>();
  for (const r of results) if (r.container.parentElement) lists.add(r.container.parentElement);
  // The page's own search box: the first one in the page. A follow-up box inside an
  // AI answer comes later and doesn't protect the answer.
  const searchBox = document.querySelector('form[role="search"], textarea[name="q"], input[name="q"], input[type="search"]');

  const found: Clutter[] = [];
  const seen = new Set<HTMLElement>();
  const add = (block: HTMLElement | undefined, kind: CleanupKind, uncounted = false) => {
    if (!block || seen.has(block) || !safeToRemove(block, searchBox)) return;
    seen.add(block);
    found.push({ block, kind, uncounted });
  };

  for (const heading of document.querySelectorAll<HTMLElement>(HEADINGS)) {
    if (heading.closest('[data-anubis-result], anubis-summary, header, nav, [role="navigation"], form')) continue;
    const kind = cleanupKindFor(heading.textContent ?? '');
    if (kind && wanted[kind]) add(blockAround(heading, engine, lists, levelOf(heading)), kind);
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? '';
    if (text.length > 240 || !text.trim()) continue;
    const label = cleanupKindFor(text);
    const kind = label ?? cleanupMarkerFor(text);
    if (!kind || !wanted[kind]) continue;
    const el = node.parentElement;
    if (!el || el.closest(NOT_A_BLOCK)) continue;
    // A label is the block's title: judge its level like a heading's. A marker sits
    // anywhere in the block, so only the column decides how far it reaches.
    add(blockAround(el, engine, lists, label ? levelOf(el.closest<HTMLElement>(HEADINGS) ?? el) : undefined), kind);
  }

  for (const [kind, selector] of Object.entries(CLEANUP_SELECTORS[engine.id] ?? {}) as [CleanupKind, string][]) {
    if (!wanted[kind]) continue;
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (!el.closest('[data-anubis-result]')) add(blockAround(el, engine, lists) ?? el, kind);
    }
  }

  // Google's "AI Mode" tab, next to All, Images and News.
  if (wanted.ai && engine.id === 'google') {
    for (const link of document.querySelectorAll<HTMLElement>('a, [role="link"], [role="tab"]')) {
      if (link.closest('[data-anubis-result]') || !/^AI Mode$/i.test((link.textContent ?? '').trim())) continue;
      add(link.closest<HTMLElement>('[role="listitem"]') ?? link, 'ai', true);
    }
  }

  // One block can be found several ways; keep the outermost.
  return found.filter((c) => !found.some((other) => other !== c && other.block.contains(c.block)));
}

/**
 * The block in the results column holding `start`: climb until the parent is the
 * results list, the engine's results boundary, or an element inside that boundary
 * that also holds results. A heading that never reaches the column (a side panel)
 * isn't touched. Starting from a heading, the climb also stops below a parent with
 * another heading of the same or higher level: the block is one section of a
 * bigger panel ("Images" inside a knowledge panel), not the whole panel.
 */
function blockAround(start: HTMLElement, engine: EngineDef, lists: Set<Element>, level?: number): HTMLElement | undefined {
  let block = start;
  // The section, once found; the climb goes on to check it's in the column.
  let section: HTMLElement | undefined;
  for (let depth = 0; depth < 30; depth++) {
    const parent = block.parentElement;
    if (!parent || parent === document.body || parent === document.documentElement) return undefined;
    if (lists.has(parent)) return section ?? block;
    if (engine.boundary) {
      if (parent.matches(engine.boundary)) return section ?? block;
      if (parent.closest(engine.boundary) && parent.querySelector('[data-anubis-result]')) return section ?? block;
    }
    if (!section && level !== undefined && hasSiblingSection(parent, block, level)) section = block;
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
    if (block.contains(other) || other.closest('[data-anubis-result]')) continue;
    if (getComputedStyle(other).display === 'none') continue;
    if (levelOf(other) <= level && (other.textContent ?? '').trim()) return true;
  }
  return false;
}

/** Never remove results, the page's search box, or Anubis's own summary. */
function safeToRemove(block: HTMLElement, searchBox: Element | null): boolean {
  return (
    block !== document.body &&
    !block.closest('[data-anubis-result]') &&
    !block.querySelector('[data-anubis-result], anubis-summary') &&
    !(searchBox && block.contains(searchBox))
  );
}

const WEB_TAB_KEY = 'anubis:all-tab';

/**
 * Where to send this page instead, or undefined. "AI answers" opens DuckDuckGo's
 * no-AI version; "Always open the Web tab" adds Google's `udm=14`, unless you
 * chose the All tab for this search.
 */
export function redirectFor(engine: EngineDef, url: URL, cleanup: Cleanup, googleWebTab: boolean): string | undefined {
  if (engine.id === 'duckduckgo' && cleanup.ai && url.hostname === 'duckduckgo.com' && engine.isResultsPage(url)) {
    return `https://noai.duckduckgo.com${url.pathname}${url.search}${url.hash}`;
  }
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
