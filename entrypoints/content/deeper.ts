import type { EngineDef } from '@/utils/engines';
import type { DeeperStop } from '@/utils/messages';
import { nextPagerIndex } from '@/utils/pager';
import { restyle, styleBook } from '@/utils/restyle';
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
  /** No further pages (no next link, no button, or a page of results already here). */
  done: boolean;
  next?: string;
  /** The post that brings the next page, for engines whose pager is a form per page. */
  request?: PagerRequest;
  /** Why the last load stopped before bringing in a page, shown in the summary until the next load. */
  stopped?: DeeperStop;
  /** "Load more results automatically" already ran for this search. */
  auto?: boolean;
  /** How many results there were when you pressed the engine's own "More results" button yourself. */
  manualFrom?: number;
}

/** A post of a pager form: where to, what it carries, and which page it asks for. */
export interface PagerRequest {
  url: string;
  body: string;
  page: number;
}

export function freshState(engine: EngineDef): DeeperState {
  return { url: location.href, pages: 1, busy: false, done: !engine.more };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * How long a page may take to arrive, by request and then in a hidden frame, and
 * how long a frame's page may sit without results once it has loaded (a robot
 * check that passes by itself loads the results page after it).
 */
const FETCH_TIMEOUT = 15_000;
const FRAME_TIMEOUT = 15_000;
const FRAME_SETTLE = 8_000;
/** The pause between pages, and the longest wait an engine that asks to slow down gets. */
const PAUSE = 700;
const MAX_RETRY_WAIT = 10_000;

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
  if (more.kind === 'form') return !!state.request || !!pagerRequest(document, more.form, location.href);
  return true;
}

/** Why a page didn't arrive. */
class Stop extends Error {
  constructor(
    readonly reason: DeeperStop['reason'],
    readonly url?: string,
  ) {
    super(reason);
  }
}

/** Load `count` more pages. Calls `changed` as progress is made so the page can re-weigh. */
export async function weighDeeper(engine: EngineDef, state: DeeperState, count: number, changed: () => void): Promise<void> {
  const more = engine.more;
  if (!more || state.busy || state.done) return;
  state.busy = true;
  state.stopped = undefined;
  changed();
  try {
    for (let i = 0; i < count && !state.done; i++) {
      const added = more.kind === 'click' ? await clickMore(engine, more.button) : await fetchNext(engine, state);
      if (added === 0) break;
      state.pages++;
      changed();
      // Be gentle with the engine: never fire page requests back to back.
      if (i < count - 1 && !state.done) await wait(PAUSE);
    }
  } catch (error) {
    state.stopped =
      error instanceof Stop ? { reason: error.reason, page: state.pages + 1, url: error.url } : { reason: 'failed', page: state.pages + 1 };
    // The same results again means the engine has no more to give.
    if (state.stopped.reason === 'repeat') state.done = true;
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
  throw new Stop('empty');
}

function nextUrl(engine: EngineDef, state: DeeperState, doc: Document, base: string): string | undefined {
  const more = engine.more!;
  if (more.kind === 'link') {
    // The attribute, against the page it came from: a parsed page's links don't
    // always resolve against the right address (Firefox's content scripts).
    const href = doc.querySelector<HTMLAnchorElement>(more.next)?.getAttribute('href');
    if (!href) return undefined;
    try {
      return new URL(href, base).href;
    } catch {
      return undefined;
    }
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

/**
 * Fetch the next results page, parse it, and put its results after the last one
 * here. A page that comes back without results (a robot check that needs its
 * scripts, or a page the engine only finishes in a browser) is tried once more in
 * a hidden frame, where the engine's own scripts run as if you had opened it.
 */
async function fetchNext(engine: EngineDef, state: DeeperState): Promise<number> {
  const form = engine.more?.kind === 'form' ? engine.more.form : undefined;
  const request = form ? (state.request ?? pagerRequest(document, form, location.href)) : undefined;
  const url = form ? request?.url : (state.next ?? nextUrl(engine, state, document, location.href));
  if (!url) {
    state.done = true;
    return 0;
  }
  const target = new URL(url, location.href);
  // Only ever the same engine, same site.
  if (target.origin !== location.origin) {
    state.done = true;
    return 0;
  }

  let doc: Document | undefined;
  let failed: Stop | undefined;
  try {
    doc = await fetchPage(target.href, request && { method: 'POST', body: request.body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  } catch (error) {
    failed = error instanceof Stop ? error : new Stop('failed', target.href);
    // An engine that asked to slow down wouldn't answer a frame either. One that
    // refused a script's request (Ecosia's 403 robot check) may let a page load in a frame through.
    if (failed.reason === 'busy') throw failed;
  }
  if (request) {
    // A post can't be repeated in a frame, so a page that didn't arrive stops here.
    if (!doc || !findResults(engine, doc).length) throw failed ?? new Stop('empty', target.href);
    const following = form ? pagerRequest(doc, form, target.href, request.page) : undefined;
    const added = importResults(engine, state, doc, target.href);
    state.request = following;
    if (!following) state.done = true;
    return added;
  }
  if (!doc || !findResults(engine, doc).length) {
    const framed = await framePage(engine, target.href);
    // Why the request failed, when it did, says more than the frame's silence.
    if (!framed) throw failed ?? new Stop('empty', target.href);
    doc = framed.doc;
    try {
      return importResults(engine, state, doc, target.href);
    } finally {
      framed.close();
    }
  }
  return importResults(engine, state, doc, target.href);
}

/** The post for the page after `current` (the one shown, by default), from a pager made of one form per page. */
function pagerRequest(root: ParentNode, selector: string, base: string, current?: number): PagerRequest | undefined {
  const forms = [...root.querySelectorAll<HTMLFormElement>(selector)];
  const bodies = forms.map((f) => new FormData(f));
  const pages = bodies.map((data) => Number(data.get('page')));
  const index = nextPagerIndex(pages, current);
  const data = bodies[index];
  const form = forms[index];
  if (!data || !form) return undefined;
  const body = new URLSearchParams();
  data.forEach((value, key) => {
    if (typeof value === 'string') body.append(key, value);
  });
  try {
    return { url: new URL(form.getAttribute('action') ?? '', base).href, body: body.toString(), page: pages[index]! };
  } catch {
    return undefined;
  }
}

function importResults(engine: EngineDef, state: DeeperState, doc: Document, url: string): number {
  const found = findResults(engine, doc);
  if (!found.length) throw new Stop('empty', url);

  const here = findResults(engine);
  const last = here[here.length - 1]?.container;
  if (!last?.parentElement) throw new Stop('failed', url);
  const seen = new Set(here.map((r) => r.url));
  const book = engine.restyle ? styleBook(here.map((r) => r.container)) : undefined;

  // Right after the last result, not at the end of its list: the engine's own
  // pager is often the list's last item, and it belongs below every page.
  let after: Element = last;
  let added = 0;
  for (const result of found) {
    if (seen.has(result.url)) continue;
    seen.add(result.url);
    const node = document.importNode(result.container, true);
    sanitize(node);
    if (engine.restyle) restyle(node, book);
    node.setAttribute('data-anubis-page', String(state.pages + 1));
    after.after(node);
    after = node;
    added++;
  }
  // For link-based paging, the fetched page tells us where page N+1 is.
  if (engine.more?.kind === 'link') {
    state.next = nextUrl(engine, state, doc, url);
    if (!state.next) state.done = true;
  }
  if (!added) throw new Stop('repeat', url);
  return added;
}

/**
 * Firefox sends a content script's own requests as the extension, without the
 * page's address and some of its cookies; `content.fetch` sends them as the page
 * would. Other browsers already do.
 */
function pageFetch(url: string, init?: RequestInit): Promise<Response> {
  const page = (globalThis as { content?: { fetch?: typeof fetch } }).content;
  const own = () => fetch(url, { ...init, credentials: 'include' });
  if (typeof page?.fetch !== 'function') return own();
  try {
    return page.fetch(url, init).catch(own);
  } catch {
    return own();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Stop('slow')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** The page at `url`, parsed. An engine that asks to slow down gets one more try after the wait it asks for. */
async function fetchPage(url: string, init?: RequestInit): Promise<Document> {
  for (let attempt = 0; ; attempt++) {
    const res = await withTimeout(pageFetch(url, init), FETCH_TIMEOUT).catch((error: unknown) => {
      throw error instanceof Stop ? new Stop(error.reason, url) : new Stop('failed', url);
    });
    if (res.status === 429 || res.status === 503) {
      if (attempt > 0) throw new Stop('busy', url);
      const seconds = Number(res.headers.get('Retry-After'));
      await wait(Math.min(MAX_RETRY_WAIT, Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 3000));
      continue;
    }
    if (!res.ok) throw new Stop('refused', url);
    const text = await withTimeout(res.text(), FETCH_TIMEOUT).catch(() => {
      throw new Stop('slow', url);
    });
    const doc = new DOMParser().parseFromString(text, 'text/html');
    // Its links resolve against the page it came from, not wherever the parser
    // thinks it is (in Firefox's content scripts, not this page).
    const base = doc.querySelector('base[href]') ?? doc.head.appendChild(doc.createElement('base'));
    base.setAttribute('href', new URL(base.getAttribute('href') ?? '', url).href);
    return doc;
  }
}

/**
 * The page at `url` in a hidden frame, once its results are there. The frame may
 * not navigate the tab. It's wrapped in an element of Anubis's own, so adding it
 * doesn't set off a pass.
 */
async function framePage(engine: EngineDef, url: string): Promise<{ doc: Document; close: () => void } | undefined> {
  const holder = document.createElement('anubis-frame');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:fixed!important;left:-10000px!important;top:0!important;width:1024px!important;height:800px!important;visibility:hidden!important;pointer-events:none!important';
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  frame.setAttribute('tabindex', '-1');
  frame.style.cssText = 'width:100%;height:100%;border:0';
  frame.src = url;
  holder.append(frame);
  let loaded = 0;
  frame.addEventListener('load', () => (loaded = Date.now()));
  (document.body ?? document.documentElement).append(holder);
  const close = () => holder.remove();
  const deadline = Date.now() + FRAME_TIMEOUT;
  while (Date.now() < deadline && !(loaded && Date.now() - loaded > FRAME_SETTLE)) {
    await wait(300);
    let doc: Document | null = null;
    try {
      doc = frame.contentDocument;
    } catch {
      // Another origin: not the engine's own page any more.
      break;
    }
    if (doc && doc.readyState !== 'loading' && findResults(engine, doc).length) {
      // Give the rest of the page a moment to render.
      await wait(250);
      return { doc, close };
    }
  }
  close();
  return undefined;
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
