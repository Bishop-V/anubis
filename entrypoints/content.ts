import { defineContentScript } from '#imports';
import { blockedSites, isBlocked, normalizeDomain } from '@/utils/blocklist';

// A content script runs inside web pages that match `matches`.
// This one runs on search result pages, hides blocked results, puts a block
// icon on each result, and adds a small panel listing what it hid.
export default defineContentScript({
  // Matches the whole site, not just /search. Google navigates from its home
  // page to results with the History API, and a content script that only matches
  // /search* is never injected for that — the page never reloads. Being present
  // from the start means the MutationObserver below sees the results appear.
  matches: [
    '*://www.google.com/*',
    '*://www.google.ca/*',
    '*://duckduckgo.com/*',
  ],

  async main() {
    let blocked: string[];
    try {
      blocked = await blockedSites.getValue();
    } catch (error) {
      // storage.sync can fail in some setups; don't let that kill the whole script.
      console.warn('[anubis] could not read the block list', error);
      blocked = [];
    }
    // When true, blocked results stay on the page, dimmed, instead of vanishing.
    let reveal = false;

    injectStyles();

    const filter = () => {
      const results = findResults();
      const hiddenDomains = new Set<string>();

      for (const { container, host } of results) {
        const domain = normalizeDomain(host);
        const blockedNow = isBlocked(host, blocked);
        if (blockedNow && domain) hiddenDomains.add(domain);

        // Hidden, unless the user asked to see what was hidden.
        container.style.display = blockedNow && !reveal ? 'none' : '';
        container.toggleAttribute('data-anubis-hidden', blockedNow);
        container.style.opacity = blockedNow && reveal ? '0.45' : '';

        addActionButton(container, host, blockedNow);
      }

      updatePanel(results.length, hiddenDomains, blocked, reveal, {
        onToggleReveal: () => {
          reveal = !reveal;
          filter();
        },
        onUnblock: async (domain) => {
          const current = await blockedSites.getValue();
          await blockedSites.setValue(current.filter((d) => d !== domain));
        },
      });

      if (import.meta.env?.DEV) {
        console.debug(
          `[anubis] ${results.length} results, ${hiddenDomains.size} blocked domain(s) on ${location.hostname}`,
        );
      }
    };

    filter();

    // Re-run when the list changes (popup, block icon, or panel).
    blockedSites.watch((next) => {
      blocked = next;
      filter();
    });

    // …and when the page loads more results (infinite scroll, "More results").
    // requestAnimationFrame batches bursts of DOM changes into one filter pass.
    // The observer is detached while we write to the DOM, so our own icons and
    // panel don't queue another pass — on a live results page that feedback ran
    // to ~19 passes a second.
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        observer.disconnect();
        try {
          filter();
        } finally {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
});

type Result = { container: HTMLElement; link: HTMLAnchorElement; host: string };

// Google and DuckDuckGo both use obfuscated class names that change without
// warning (.MjjYud, .vt6azd, …), so matching on them breaks constantly. Instead
// we find each result by structure: a link wrapping the title heading, then walk
// up to the smallest ancestor that still holds only that one result.
//
// uBlacklist keeps a class-name ruleset up to date if a fast path is ever needed:
// https://github.com/ublacklist/builtin -> serpinfo/{google,duckduckgo}.yml

function isDuckDuckGo(): boolean {
  return location.hostname.endsWith('duckduckgo.com');
}

/** The heading each engine puts the result title in. */
function titleSelector(): string {
  return isDuckDuckGo() ? 'h2' : 'h3';
}

function findResults(): Result[] {
  const heading = titleSelector();
  const results: Result[] = [];
  const seen = new Set<HTMLElement>();

  for (const title of document.querySelectorAll<HTMLElement>(heading)) {
    // The title is inside (or next to) the link pointing at the result.
    const link =
      title.closest<HTMLAnchorElement>('a[href]') ??
      title.querySelector<HTMLAnchorElement>('a[href]');
    if (!link) continue;
    if (link.protocol !== 'http:' && link.protocol !== 'https:') continue;

    const container = resultContainer(link, heading);
    const host = resolveHost(link, container, heading);
    if (!host) continue;

    if (seen.has(container)) continue;
    seen.add(container);
    results.push({ container, link, host });
  }

  return results;
}

/**
 * Which site does this result actually point at?
 *
 * Google no longer puts the destination in the href — result links go to
 * /goto?url=<opaque blob> on google.com, and the blob is encoded, not a URL. So
 * when the href only tells us "google.com", fall back to the visible <cite>,
 * which still shows the real domain. (uBlacklist solves it the same way.)
 * Returns null for links that aren't results, like page navigation.
 */
function resolveHost(link: HTMLAnchorElement, container: HTMLElement, heading: string): string | null {
  const engine = location.hostname.toLowerCase();
  const direct = link.hostname.toLowerCase();
  if (direct && direct !== engine) return direct;

  // Older style: the destination sat in a query parameter.
  const params = new URLSearchParams(link.search);
  for (const key of ['q', 'url', 'imgurl']) {
    const value = params.get(key);
    if (value && /^https?:\/\//i.test(value)) {
      try {
        return new URL(value).hostname.toLowerCase();
      } catch {
        // Not a URL after all; keep looking.
      }
    }
  }

  return citeHost(container, heading);
}

/** Read the domain out of the result's <cite> ("example.com › page › x"). */
function citeHost(container: HTMLElement, heading: string): string | null {
  // The <cite> is usually inside the result block, but if our container came out
  // tight, look one or two levels up while it still holds a single result.
  let scope: HTMLElement | null = container;
  for (let depth = 0; depth < 3 && scope; depth++) {
    const cite = scope.querySelector('cite');
    if (cite) {
      const raw = (cite.textContent ?? '').replace(/​/g, '').trim();
      const host = (raw.replace(/^https?:\/\//i, '').split(/[\s›/?#]/)[0] ?? '').toLowerCase();
      if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return host;
    }
    const parent: HTMLElement | null = scope.parentElement;
    if (!parent || parent.querySelectorAll(heading).length > 1) break;
    scope = parent;
  }
  return null;
}

/**
 * Walk up from the link to the element that represents the whole result.
 * Stops as soon as the next ancestor would swallow a second result, so it works
 * regardless of what the classes are called. Never returns an <a>: a <button>
 * inside a link is invalid HTML and browsers handle it unpredictably.
 */
function resultContainer(link: HTMLAnchorElement, heading: string): HTMLElement {
  let el: HTMLElement = link;

  for (let depth = 0; depth < 8; depth++) {
    const parent = el.parentElement;
    if (!parent || parent === document.body || parent === document.documentElement) break;
    // Don't climb out past a landmark like #search / #rso / <main>.
    if (parent.id === 'search' || parent.id === 'rso' || parent.tagName === 'MAIN') break;
    // A results list holds many headings; a single result holds exactly one.
    // The one exception is the anchor itself, which we always climb out of.
    if (el.tagName !== 'A' && parent.querySelectorAll(heading).length > 1) break;
    el = parent;
  }

  // Some layouts put the title straight inside the link, with the link as a
  // direct child of the results list. A <button> inside an <a> is invalid HTML,
  // so give the link its own wrapper to hang the icon on.
  if (el.tagName === 'A') {
    const existing = el.parentElement;
    if (existing?.hasAttribute('data-anubis-wrap')) return existing;
    const wrapper = document.createElement('span');
    wrapper.setAttribute('data-anubis-wrap', '');
    wrapper.style.cssText = 'position:relative;display:block';
    el.parentElement?.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    return wrapper;
  }

  return el;
}

const BUTTON_CLASS = 'anubis-block-button';

/** Add (or update) the block/unblock icon on a result. */
function addActionButton(container: HTMLElement, host: string, blockedNow: boolean): void {
  const domain = normalizeDomain(host);
  if (!domain) return;

  let button = container.querySelector<HTMLButtonElement>(`:scope > .${BUTTON_CLASS}`);

  if (!button) {
    button = document.createElement('button');
    button.className = BUTTON_CLASS;
    button.type = 'button';
    // Inline styles so the page's own CSS can't hide or restyle the icon.
    button.style.cssText = [
      'position:absolute',
      'top:2px',
      'right:2px',
      'z-index:2147483000',
      'display:inline-flex',
      'align-items:center',
      'justify-content:center',
      'width:22px',
      'height:22px',
      'padding:0',
      'margin:0',
      'border:none',
      'border-radius:50%',
      'background:transparent',
      'color:#d4a637',
      'cursor:pointer',
      'opacity:0.65',
      'line-height:1',
    ].join(';');

    button.addEventListener('mouseenter', () => {
      button!.style.opacity = '1';
      button!.style.background = 'rgba(212, 166, 55, 0.18)';
    });
    button.addEventListener('mouseleave', () => {
      button!.style.opacity = '0.65';
      button!.style.background = 'transparent';
    });

    // Stop the click from reaching the result link underneath.
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const current = await blockedSites.getValue();
      const has = current.includes(domain);
      // Saving triggers the watch() above, which re-filters the page.
      await blockedSites.setValue(has ? current.filter((d) => d !== domain) : [...current, domain]);
    });

    // The icon is absolutely positioned, so the result needs to be a
    // positioning context. Only set it if the page hasn't already.
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    container.toggleAttribute('data-anubis-result', true);
    container.appendChild(button);
  }

  // Reflect the current state.
  button.title = blockedNow ? `Unblock ${domain}` : `Block ${domain}`;
  button.setAttribute('aria-label', button.title);
  button.innerHTML = blockedNow ? ICON_UNDO : ICON_BLOCK;
}

// Drawn inline so no icon file or extra permission is needed.
const ICON_BLOCK =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">' +
  '<circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
  '<line x1="3.6" y1="12.4" x2="12.4" y2="3.6" stroke="currentColor" stroke-width="1.7"/></svg>';

const ICON_UNDO =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">' +
  '<path d="M3 8a5 5 0 1 1 5 5" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
  '<path d="M3 4.5V8h3.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';

const PANEL_ID = 'anubis-panel';

type PanelActions = {
  onToggleReveal: () => void;
  onUnblock: (domain: string) => void;
};

/** The small "N results hidden" bar above the results, with the blocked list. */
function updatePanel(
  total: number,
  hiddenOnPage: Set<string>,
  blocked: string[],
  reveal: boolean,
  actions: PanelActions,
): void {
  let panel = document.getElementById(PANEL_ID);

  if (hiddenOnPage.size === 0 && blocked.length === 0) {
    panel?.remove();
    return;
  }

  if (!panel) {
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    const anchor = panelAnchor();
    if (!anchor) return;
    anchor.parent.insertBefore(panel, anchor.before);
  }

  const count = hiddenOnPage.size;
  panel.textContent = '';

  const label = document.createElement('span');
  label.textContent = count
    ? `Anubis hid ${count} site${count === 1 ? '' : 's'} from these ${total} results`
    : 'Anubis is watching these results';
  panel.appendChild(label);

  if (count) {
    panel.appendChild(panelButton(reveal ? 'Hide them' : 'Show them', actions.onToggleReveal));
  }

  const listToggle = panelButton(`Blocked sites (${blocked.length})`, () => {
    list.hidden = !list.hidden;
    listToggle.setAttribute('aria-expanded', String(!list.hidden));
  });
  listToggle.setAttribute('aria-expanded', 'false');
  panel.appendChild(listToggle);

  const list = document.createElement('ul');
  list.hidden = true;
  list.style.cssText =
    'flex-basis:100%;margin:6px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px';
  for (const domain of [...blocked].sort()) {
    const item = document.createElement('li');
    item.style.cssText =
      'display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border:1px solid rgba(212,166,55,0.5);border-radius:10px';
    const name = document.createElement('span');
    name.textContent = domain;
    item.appendChild(name);
    const remove = panelButton('✕', () => actions.onUnblock(domain));
    remove.title = `Unblock ${domain}`;
    remove.style.cssText += ';padding:0 2px;border:none';
    item.appendChild(remove);
    list.appendChild(item);
  }
  panel.appendChild(list);
}

function panelButton(text: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.style.cssText =
    'padding:1px 8px;border:1px solid rgba(212,166,55,0.6);border-radius:10px;' +
    'background:transparent;color:#d4a637;font:inherit;font-size:12px;cursor:pointer';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return button;
}

/** Where to put the panel: just above the first result on the page. */
function panelAnchor(): { parent: HTMLElement; before: Node } | null {
  const first = findResults()[0];
  if (!first) return null;
  // Insert above the outermost block that only holds results.
  let node: HTMLElement = first.container;
  const parent = node.parentElement;
  if (!parent) return null;
  return { parent, before: node };
}

function injectStyles(): void {
  if (document.getElementById('anubis-styles')) return;
  const style = document.createElement('style');
  style.id = 'anubis-styles';
  style.textContent = `
    #${PANEL_ID} {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 12px;
      padding: 6px 10px;
      border-left: 3px solid #d4a637;
      border-radius: 4px;
      background: rgba(212, 166, 55, 0.08);
      color: inherit;
      font-size: 12px;
    }
  `;
  document.head.append(style);
}
