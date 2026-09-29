import { decodeBingRedirect, displayedDomainToUrl, siteNameToUrl, siteOf } from '@/utils/domain';
import type { EngineDef } from '@/utils/engines';

export interface FoundResult {
  /** The element representing the whole result. Reranking moves it; hiding hides it. */
  container: HTMLElement;
  link: HTMLAnchorElement;
  /** Where tag chips go: right after this element. */
  titleBlock: HTMLElement;
  /** The real destination, or `https://<displayed domain>/` when only that is known. */
  url: string;
  host: string;
  title: string;
  description: string;
  /** Other elements belonging to this result (DuckDuckGo Lite rows). */
  extras: HTMLElement[];
  /** Results page this came from, when Anubis fetched more pages ("Load more results"). */
  page?: number;
  /** A card in a grid on another tab (images, videos, news): hidden and tagged, not reranked or collapsed. */
  card?: boolean;
}

/** Our own elements, which must never be mistaken for page content. */
export const OWN_TAGS = new Set(['ANUBIS-CHIPS', 'ANUBIS-WEIGH', 'ANUBIS-BAR', 'ANUBIS-SUMMARY', 'ANUBIS-POPOVER']);

/** Results in the live page, or in a fetched results page parsed with DOMParser. */
export function findResults(engine: EngineDef, root: Document = document): FoundResult[] {
  const out = engine.heading ? findStructural(engine, root) : findBySelector(engine, root);
  if (!engine.cards) return out;
  const seen = new Set(out.map((r) => r.container));
  for (const def of engine.cards) {
    for (const r of findBySelector({ ...engine, ...def, extraRows: 0 }, root)) {
      if (seen.has(r.container) || [...seen].some((c) => c.contains(r.container))) continue;
      seen.add(r.container);
      out.push({ ...r, card: true });
    }
  }
  return out;
}

function findBySelector(engine: EngineDef, root: Document): FoundResult[] {
  const out: FoundResult[] = [];
  for (const container of root.querySelectorAll<HTMLElement>(engine.item!)) {
    const link = container.querySelector<HTMLAnchorElement>(engine.link ?? 'a[href]');
    if (!link || !/^https?:$/.test(link.protocol)) continue;
    const url = resolveUrl(link, container, engine);
    if (!url) continue;
    const titleEl = (engine.title && container.querySelector<HTMLElement>(engine.title)) || link;
    const extras: HTMLElement[] = [];
    let row = container.nextElementSibling;
    for (let i = 0; i < (engine.extraRows ?? 0) && row instanceof HTMLElement; i++) {
      // Stop at the next result's first row.
      if (row.matches(engine.item!)) break;
      extras.push(row);
      row = row.nextElementSibling;
    }
    out.push(build(container, link, titleBlockFor(titleEl, link, container), url, titleEl, extras));
  }
  return out;
}

// Structural detection, from the approach in the original content script: find
// the title heading, take its link, then walk up to the smallest ancestor that
// still holds only this one result.
function findStructural(engine: EngineDef, root: Document): FoundResult[] {
  const heading = engine.heading!;
  const out: FoundResult[] = [];
  const seen = new Set<HTMLElement>();
  let previous: HTMLElement | undefined;
  for (const title of root.querySelectorAll<HTMLElement>(heading)) {
    if (title.closest('anubis-chips, anubis-bar, anubis-summary')) continue;
    // A sitelink, already part of the result before it.
    if (previous?.contains(title)) continue;
    const link = title.closest<HTMLAnchorElement>('a[href]') ?? title.querySelector<HTMLAnchorElement>('a[href]');
    if (!link || !/^https?:$/.test(link.protocol)) continue;
    let container = resultContainer(link, heading, engine.boundary, root);
    if (seen.has(container)) continue;
    const url = resolveUrl(link, container, engine);
    if (!url) continue;
    // Only a result that shows its address has sitelinks. Without that check, the
    // first video in a video panel took in the others and the panel's heading.
    if (container.querySelector(engine.displayed ?? 'cite')) container = widenPastSitelinks(container, siteOfUrl(url), engine, root);
    seen.add(container);
    previous = container;
    out.push(build(container, link, titleBlockFor(title, link, container), url, title, []));
  }
  return out;
}

/**
 * Sitelinks are links under a result with headings of their own but no address
 * shown (Google's big sitelinks). They stop resultContainer's climb, which leaves
 * the result as an inner block and makes each sitelink a result of its own. Climb
 * on past them, so the result is the whole block and its sitelinks go with it.
 */
function widenPastSitelinks(container: HTMLElement, site: string, engine: EngineDef, root: Document): HTMLElement {
  let el = container;
  for (let depth = 0; depth < 30; depth++) {
    const parent = el.parentElement;
    if (!parent || parent === root.body || parent === root.documentElement) break;
    if (engine.boundary && parent.matches(engine.boundary)) break;
    const others = [...parent.querySelectorAll<HTMLElement>(engine.heading!)].filter((h) => !el.contains(h));
    if (!others.every((h) => isSitelink(h, parent, site, engine))) break;
    el = parent;
  }
  return el;
}

/** A heading in `within`, linking to `site`, with no displayed address in its branch. */
function isSitelink(heading: HTMLElement, within: HTMLElement, site: string, engine: EngineDef): boolean {
  const link = heading.closest<HTMLAnchorElement>('a[href]') ?? heading.querySelector<HTMLAnchorElement>('a[href]');
  if (!link) return false;
  let branch: HTMLElement = heading;
  while (branch.parentElement && branch.parentElement !== within) branch = branch.parentElement;
  if (branch.querySelector(engine.displayed ?? 'cite')) return false;
  const url = resolveUrl(link, branch, engine);
  // An opaque redirect with no address near it (Google's /goto) can't be a result
  // of its own, so it belongs to the result it sits under. Another search can't.
  if (!url) return siteOf(link.hostname) === siteOf(location.hostname) && !/^\/search\b/.test(link.pathname);
  return siteOfUrl(url) === site;
}

function siteOfUrl(url: string): string {
  try {
    return siteOf(new URL(url).hostname.toLowerCase());
  } catch {
    return '';
  }
}

function build(
  container: HTMLElement,
  link: HTMLAnchorElement,
  titleBlock: HTMLElement,
  url: string,
  titleEl: HTMLElement,
  extras: HTMLElement[],
): FoundResult {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    // resolveUrl only returns parseable URLs
  }
  const title = (titleEl.textContent ?? '').trim();
  // Good enough for $indescription: everything in the result that isn't the title.
  const description = (container.textContent ?? '').replace(title, '').trim().slice(0, 600);
  const page = Number(container.getAttribute('data-anubis-page')) || undefined;
  return { container, link, titleBlock, url, host, title, description, extras, page };
}

/**
 * Chips go after the title: after the heading if the link is inside it, else after
 * the link. Then climb out of wrappers that hold nothing but the title, so the chips
 * sit beside the whole title block rather than inside the engine's own link
 * wrappers, which may be styled (or even flipped with transforms) in ways that
 * don't suit extra content.
 */
function titleBlockFor(title: HTMLElement, link: HTMLAnchorElement, container: HTMLElement): HTMLElement {
  let block: HTMLElement = title.contains(link) ? title : link.contains(title) ? link : title;
  if (!container.contains(block) || block === container) block = link;
  for (let parent = block.parentElement; parent && parent !== container && ownChildCount(parent) === 1; parent = parent.parentElement) {
    block = parent;
  }
  return block;
}

/** Element children that aren't Anubis's own. */
function ownChildCount(el: Element): number {
  let n = 0;
  for (const child of el.children) if (!OWN_TAGS.has(child.tagName)) n++;
  return n;
}

/**
 * Walk up from the link to the element that represents the whole result. Stops
 * before an ancestor that would hold a second result, or at a boundary like
 * Google's #rso. Never returns an <a>: a <button> inside a link is invalid HTML.
 */
function resultContainer(link: HTMLAnchorElement, heading: string, boundary: string | undefined, root: Document): HTMLElement {
  let el: HTMLElement = link;
  // Google nests a result about eight elements deep, so the limit is generous: the
  // real stops are the boundary and a parent holding a second result.
  for (let depth = 0; depth < 30; depth++) {
    const parent = el.parentElement;
    if (!parent || parent === root.body || parent === root.documentElement) break;
    if (boundary && parent.matches(boundary)) break;
    if (el.tagName !== 'A' && parent.querySelectorAll(heading).length > 1) break;
    el = parent;
  }
  // Some layouts put the link straight in the results list; give it a wrapper.
  if (el.tagName === 'A') {
    const existing = el.parentElement;
    if (existing?.hasAttribute('data-anubis-wrap')) return existing;
    const wrapper = root.createElement('div');
    wrapper.setAttribute('data-anubis-wrap', '');
    el.parentElement?.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    return wrapper;
  }
  return el;
}

/**
 * Which page does this result really point at? Engines wrap links in redirects:
 * Google's /goto?url=<opaque>, Bing's /ck/a?u=a1<base64>, Yahoo's /RU=<url>/,
 * DuckDuckGo HTML's /l/?uddg=<url>. Decode what can be decoded; otherwise fall back
 * to the domain the engine displays (uBlacklist does the same).
 */
export function resolveUrl(link: HTMLAnchorElement, container: HTMLElement, engine: EngineDef): string | null {
  const href = link.href;
  const bing = decodeBingRedirect(href);
  if (bing) return bing;

  const ru = /\/RU=([^/]+)\//.exec(link.pathname);
  if (ru) {
    try {
      const decoded = decodeURIComponent(ru[1]!);
      if (/^https?:\/\//.test(decoded)) return decoded;
    } catch {
      // fall through
    }
  }

  if (siteOf(link.hostname) !== siteOf(location.hostname)) return href;

  const fromParams = (search: string) => {
    const params = new URLSearchParams(search);
    for (const key of ['uddg', 'url', 'q', 'u', 'imgurl']) {
      const value = params.get(key);
      if (value && /^https?:\/\//i.test(value)) return value;
    }
    return undefined;
  };
  const direct = fromParams(link.search);
  if (direct) return direct;
  // Google's click-tracking address, when the link itself is opaque.
  const ping = link.getAttribute('ping');
  if (ping) {
    try {
      const pinged = fromParams(new URL(ping, location.href).search);
      if (pinged) return pinged;
    } catch {
      // not a URL
    }
  }

  // An opaque redirect (Google's /goto): the address the engine shows, then a
  // plain link to the same result, then a site's name where the address would be.
  // A link to another search is never a result.
  const shown = displayedUrl(container, engine);
  if (shown || /^\/search\b/.test(link.pathname)) return shown;
  return otherLink(container) ?? namedSite(link, engine);
}

/** A link in the result that goes straight to another site. */
function otherLink(container: HTMLElement): string | null {
  for (const a of container.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    if (/^https?:$/.test(a.protocol) && siteOf(a.hostname) !== siteOf(location.hostname)) return a.href;
  }
  return null;
}

/**
 * Google shows forums and social sites by name ("Reddit · r/learnpython", "LinkedIn
 * · Fandom") with a line like "20+ comments" or "34.4K+ followers" where the address
 * would be. The name is in the result's link, beside the title; the snippet isn't
 * read, since it can name any site.
 */
function namedSite(link: HTMLAnchorElement, engine: EngineDef): string | null {
  const walker = link.ownerDocument.createTreeWalker(link, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? '';
    if (text.length > 80 || node.parentElement?.closest(engine.heading ?? engine.title ?? 'h3')) continue;
    const url = siteNameToUrl(text);
    if (url) return url;
  }
  return null;
}

/** Read the displayed domain ("example.com › docs › page") from the result. */
function displayedUrl(container: HTMLElement, engine: EngineDef): string | null {
  const selector = engine.displayed ?? 'cite';
  let scope: HTMLElement | null = container;
  for (let depth = 0; depth < 3 && scope; depth++) {
    for (const el of scope.querySelectorAll<HTMLElement>(selector)) {
      const text = (el.textContent ?? '').replace(/​/g, '').replace(/^https?:\/\//i, '');
      const url = displayedDomainToUrl(text.split(/[/?#]/)[0]);
      if (url) return url;
    }
    const parent: HTMLElement | null = scope.parentElement;
    if (!parent || (engine.heading && parent.querySelectorAll(engine.heading).length > 1)) break;
    scope = parent;
  }
  return null;
}
