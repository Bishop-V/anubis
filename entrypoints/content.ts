import { defineContentScript } from '#imports';
import { blockedSites, isBlocked } from '@/utils/blocklist';

// A content script runs inside web pages that match `matches`.
// This one runs on search result pages and hides blocked results.
export default defineContentScript({
  matches: [
    '*://www.google.com/search*',
    '*://www.google.ca/search*',
    '*://duckduckgo.com/*',
  ],

  async main() {
    let blocked = await blockedSites.getValue();

    const filter = () => {
      for (const { container, link } of findResults()) {
        const hide = isBlocked(link.hostname, blocked);
        container.style.display = hide ? 'none' : '';
        container.toggleAttribute('data-anubis-hidden', hide);
      }
    };

    filter();

    // Re-run when the user edits the list in the popup…
    blockedSites.watch((next) => {
      blocked = next;
      filter();
    });

    // …and when the page loads more results (infinite scroll, "More results").
    // requestAnimationFrame batches bursts of DOM changes into one filter pass.
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        filter();
      });
    }).observe(document.body, { childList: true, subtree: true });
  },
});

type Result = { container: HTMLElement; link: HTMLAnchorElement };

// Each search engine structures its HTML differently. These selectors WILL break
// when Google/DDG change their markup — keep them in one place so they're easy to fix.
function findResults(): Result[] {
  const results: Result[] = [];

  if (location.hostname.includes('duckduckgo.com')) {
    document.querySelectorAll<HTMLElement>('article[data-testid="result"]').forEach((container) => {
      const link = container.querySelector<HTMLAnchorElement>('a[data-testid="result-title-a"]');
      if (link) results.push({ container, link });
    });
  } else {
    // Google: every organic result has an <h3> title inside a link.
    document.querySelectorAll<HTMLElement>('#search a[href] h3').forEach((h3) => {
      const link = h3.closest('a')!;
      const container = link.closest<HTMLElement>('.MjjYud, .g') ?? link;
      results.push({ container, link });
    });
  }

  return results;
}
