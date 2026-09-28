import { storage } from '#imports';

// The user's block list, saved with the extension's storage API.
// "sync:" means it follows the user across devices where the browser syncs.
export const blockedSites = storage.defineItem<string[]>('sync:blockedSites', {
  fallback: ['fandom.com'],
});

/** Turn user input ("https://www.Fandom.com/wiki/x") into a bare domain ("fandom.com"). */
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase();
  if (!s) return '';
  try {
    s = new URL(s.includes('://') ? s : `https://${s}`).hostname;
  } catch {
    return '';
  }
  return s.replace(/^www\./, '');
}

/** True if hostname is the blocked domain or any subdomain of it. */
export function isBlocked(hostname: string, blocked: string[]): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return blocked.some((d) => host === d || host.endsWith(`.${d}`));
}
