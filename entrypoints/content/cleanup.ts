import { CLEANUP_SELECTORS, cleanupKindFor, type Cleanup, type CleanupKind } from '@/utils/cleanup';
import type { EngineDef } from '@/utils/engines';
import type { FoundResult } from './results';

export interface Clutter {
  block: HTMLElement;
  kind: CleanupKind;
  /** Left out of the summary's count: a tab or link rather than a block of content. */
  uncounted?: boolean;
}

const HEADINGS = 'h1, h2, h3, h4, h5, [role="heading"]';

/**
 * Blocks in the results column to remove: found from their heading, or from an
 * engine-specific selector, then widened to the whole block in the column. Only
 * runs once results are on the page, since the column is found from them.
 */
export function findClutter(engine: EngineDef, results: FoundResult[], wanted: Cleanup): Clutter[] {
  if (!results.length || !Object.values(wanted).some(Boolean)) return [];
  const lists = new Set<Element>();
  for (const r of results) if (r.container.parentElement) lists.add(r.container.parentElement);

  const out: Clutter[] = [];
  const seen = new Set<HTMLElement>();
  const add = (block: HTMLElement | undefined, kind: CleanupKind, uncounted = false) => {
    if (!block || seen.has(block) || !safeToRemove(block)) return;
    seen.add(block);
    out.push({ block, kind, uncounted });
  };

  for (const heading of document.querySelectorAll<HTMLElement>(HEADINGS)) {
    if (heading.closest('[data-anubis-result], anubis-summary, header, nav, [role="navigation"], form')) continue;
    const kind = cleanupKindFor(heading.textContent ?? '');
    if (kind && wanted[kind]) add(blockAround(heading, engine, lists, levelOf(heading)), kind);
  }
  for (const [kind, selector] of Object.entries(CLEANUP_SELECTORS[engine.id] ?? {}) as [CleanupKind, string][]) {
    if (!wanted[kind]) continue;
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (!el.closest('[data-anubis-result]')) add(blockAround(el, engine, lists) ?? el, kind);
    }
  }
  // Google's "AI Mode" tab, next to All, Images and News.
  if (wanted.ai && engine.id === 'google') {
    for (const link of document.querySelectorAll<HTMLElement>('[role="navigation"] a, [role="list"] a, [role="tablist"] a')) {
      if (/^AI Mode$/i.test((link.textContent ?? '').trim())) add(link.closest<HTMLElement>('[role="listitem"]') ?? link, 'ai', true);
    }
  }
  return out;
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

/** Never remove results, the search box, or Anubis's own summary. */
function safeToRemove(block: HTMLElement): boolean {
  return (
    !block.closest('[data-anubis-result]') &&
    !block.querySelector('[data-anubis-result], anubis-summary, form[role="search"], input[name="q"], textarea[name="q"], input[type="search"]') &&
    block !== document.body
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
