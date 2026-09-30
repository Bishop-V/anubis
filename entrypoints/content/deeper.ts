import type { EngineDef } from '@/utils/engines';
import { findResults } from './results';

// "Load more results": bring the next pages of results onto this one, so reranking
// works across 20–30 results instead of 10. A site pinned or boosted on page 3
// can then surface at the top, which is what Kagi and Brave Goggles do server-side.
//
// Nothing new leaves the browser: the requests go to the same engine, for the same
// query, exactly as if you had clicked "Next".

export interface DeeperState {
  /** The results URL this state belongs to; reset when the search changes. */
  url: string;
  pages: number;
  busy: boolean;
  /** No further pages (no next link, no button, or an empty page). */
  done: boolean;
  next?: string;
  error?: string;
  /** "Load more results automatically" already ran for this search. */
  auto?: boolean;
  /** How many results there were when you pressed the engine's own "More results" button yourself. */
  manualFrom?: number;
}

export function freshState(engine: EngineDef): DeeperState {
  return { url: location.href, pages: 1, busy: false, done: !engine.more };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Whether there's a next page to load yet. The content script starts while the page is
 * still arriving, and an engine's own button or Next link comes last, below the
 * results: until it's there, loading would find nothing and give up for this search.
 */
export function nextPageReady(engine: EngineDef, state: DeeperState): boolean {
  const more = engine.more;
  if (!more || state.done || state.busy) return false;
  if (more.kind === 'click') return !!document.querySelector(more.button);
  if (more.kind === 'link') return !!state.next || !!document.querySelector(more.next);
  return true;
}

/** Load `count` more pages. Calls `changed` as progress is made so the page can re-weigh. */
export async function weighDeeper(engine: EngineDef, state: DeeperState, count: number, changed: () => void): Promise<void> {
  const more = engine.more;
  if (!more || state.busy || state.done) return;
  state.busy = true;
  state.error = undefined;
  changed();
  try {
    for (let i = 0; i < count && !state.done; i++) {
      const added = more.kind === 'click' ? await clickMore(engine, more.button) : await fetchNext(engine, state);
      if (added === 0) state.done = true;
      else state.pages++;
      changed();
      // Be gentle with the engine: never fire page requests back to back.
      if (i < count - 1) await wait(700);
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
    state.done = true;
  } finally {
    state.busy = false;
    changed();
  }
}

/** Press the engine's own "More results" button and wait for results to arrive. */
async function clickMore(engine: EngineDef, selector: string): Promise<number> {
  const button = document.querySelector<HTMLElement>(selector);
  if (!button) return 0;
  const before = findResults(engine).length;
  button.click();
  for (let t = 0; t < 40; t++) {
    await wait(150);
    const now = findResults(engine).length;
    if (now > before) {
      // Give the rest of the batch a moment to render.
      await wait(250);
      return findResults(engine).length - before;
    }
  }
  return 0;
}

function nextUrl(engine: EngineDef, state: DeeperState, doc: Document): string | undefined {
  const more = engine.more!;
  if (more.kind === 'link') {
    const a = doc.querySelector<HTMLAnchorElement>(more.next);
    return a?.href || undefined;
  }
  if (more.kind === 'param') {
    // Count from the page the user is on, which isn't always the first.
    const url = new URL(location.href);
    const raw = Number(url.searchParams.get(more.name) ?? more.first);
    const index = Number.isFinite(raw) ? Math.round((raw - more.first) / more.step) : 0;
    url.searchParams.set(more.name, String(more.first + more.step * (index + state.pages)));
    return url.toString();
  }
  return undefined;
}

/** Fetch the next results page, parse it, and append its results after the last one here. */
async function fetchNext(engine: EngineDef, state: DeeperState): Promise<number> {
  const url = state.next ?? nextUrl(engine, state, document);
  if (!url) return 0;
  const target = new URL(url, location.href);
  // Only ever the same engine, same site.
  if (target.origin !== location.origin) return 0;

  const res = await fetch(target, { credentials: 'include' });
  if (!res.ok) throw new Error(`The engine answered ${res.status}`);
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

  const here = findResults(engine);
  const last = here[here.length - 1]?.container;
  if (!last?.parentElement) return 0;
  const seen = new Set(here.map((r) => r.url));

  let added = 0;
  for (const result of findResults(engine, doc)) {
    if (seen.has(result.url)) continue;
    seen.add(result.url);
    const node = document.importNode(result.container, true);
    sanitize(node);
    node.setAttribute('data-anubis-page', String(state.pages + 1));
    last.parentElement.append(node);
    added++;
  }
  // For link-based paging, the fetched page tells us where page N+1 is.
  if (engine.more?.kind === 'link') {
    state.next = nextUrl(engine, state, doc);
    if (!state.next) state.done = true;
  }
  return added;
}

/** Imported markup is the engine's own, but it arrives without its scripts; drop anything that would expect them. */
function sanitize(root: HTMLElement): void {
  root.querySelectorAll('script, noscript, iframe, link[rel="preload"]').forEach((el) => el.remove());
  for (const el of [root, ...root.querySelectorAll<HTMLElement>('*')]) {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    }
    // Lazy images keep their real source in data-src; show it now.
    if (el instanceof HTMLImageElement && !el.getAttribute('src') && el.dataset.src) el.src = el.dataset.src;
  }
}
