// Hostname helpers shared by the popup, options page, and content script.

/** Turn user input ("https://www.Fandom.com/wiki/x") into a bare domain ("fandom.com"). */
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase();
  if (!s) return '';
  try {
    s = new URL(s.includes('://') ? s : `https://${s}`).hostname;
  } catch {
    return '';
  }
  s = s.replace(/^www\./, '').replace(/\.$/, '');
  return isDomain(s) ? s : '';
}

/** A domain needs at least one dot and only hostname characters. */
export function isDomain(s: string): boolean {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s);
}

/** Normalize an already-parsed hostname for consistent list matching and display. */
export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

/** "www.a.b.example.com" → ["a.b.example.com", "b.example.com", "example.com", "com"]. */
export function hostSuffixes(hostname: string): string[] {
  const host = normalizeHostname(hostname);
  const parts = host.split('.');
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) out.push(parts.slice(i).join('.'));
  return out;
}

// Second-level labels that act like TLDs (co.uk, com.au…). Not a full public suffix
// list, just enough to offer a sensible "whole site" choice in the weigh menu.
const SECOND_LEVEL = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go', 'gv']);

// Hosts that give each person a site of their own under them, from the private
// section of the Public Suffix List: "someone.github.io" is one person's site, and
// "github.io" would be everyone's. Only those common in search results; the whole
// list would more than double the content script.
const SHARED_HOSTS = new Set(
  `github.io gitlab.io codeberg.page readthedocs.io gitbook.io netlify.app vercel.app pages.dev workers.dev deno.dev fly.dev
onrender.com web.app firebaseapp.com appspot.com herokuapp.com azurewebsites.net surge.sh replit.app pythonanywhere.com
blogspot.com bearblog.dev wixsite.com webflow.io carrd.co notion.site`.split(/\s+/),
);

/** How many labels at the end of a hostname every site under it shares: 2 for "co.uk" and "github.io", else 1. */
function suffixLabels(parts: string[]): number {
  const [sld = '', tld = ''] = parts.slice(-2);
  if (parts.length < 3) return 1;
  return SHARED_HOSTS.has(`${sld}.${tld}`) || (SECOND_LEVEL.has(sld) && tld.length === 2) ? 2 : 1;
}

/**
 * Choices for "apply to…" in the weigh menu: the full host down to the registrable
 * domain, and any wider domain `ranked` says already has a ranking, so it can still
 * be seen and undone.
 */
export function domainChoices(hostname: string, ranked: (domain: string) => boolean = () => false): string[] {
  const all = hostSuffixes(hostname);
  const minLabels = suffixLabels((all[0] ?? '').split('.')) + 1;
  return all.filter((d) => {
    const labels = d.split('.').length;
    return labels >= minLabels || (labels >= 2 && ranked(d));
  });
}

/**
 * A domain's name and the ending it shares with other sites, for display:
 * "metmuseum.org" → ["metmuseum", ".org"], "bbc.co.uk" → ["bbc", ".co.uk"].
 */
export function splitSuffix(domain: string): [name: string, suffix: string] {
  const parts = domain.split('.');
  const labels = suffixLabels(parts);
  if (parts.length <= labels || parts.some((p) => !p)) return [domain, ''];
  return [parts.slice(0, -labels).join('.'), `.${parts.slice(-labels).join('.')}`];
}

/** The registrable-ish domain: "docs.github.com" → "github.com", "news.bbc.co.uk" → "bbc.co.uk", "a.github.io" → "a.github.io". */
export function siteOf(hostname: string): string {
  const choices = domainChoices(hostname);
  return choices[choices.length - 1] ?? hostname;
}

/**
 * Bing wraps result links in tracking redirects like
 * https://www.bing.com/ck/a?…&u=a1aHR0cHM6Ly9leGFtcGxlLmNvbS8&… where `u` is "a1" + base64url(URL).
 */
export function decodeBingRedirect(href: string): string | undefined {
  try {
    const url = new URL(href);
    if (!/(^|\.)bing\.com$/.test(url.hostname) || !url.pathname.startsWith('/ck/')) return undefined;
    const u = url.searchParams.get('u');
    if (!u?.startsWith('a1')) return undefined;
    const b64 = u.slice(2).replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    return /^https?:\/\//.test(decoded) ? decoded : undefined;
  } catch {
    return undefined;
  }
}

/** Turn a displayed domain or breadcrumb ("example.com › docs › x") into a URL. */
export function displayedDomainToUrl(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  const first = text.trim().split(/[\s›»>]/)[0] ?? '';
  const domain = normalizeDomain(first);
  return domain ? `https://${domain}/` : undefined;
}

// Sites Google shows by name ("Reddit · r/learnpython", "LinkedIn · Fandom") with a
// line like "20+ comments" or "34.4K+ followers" where the address would be.
// Not translated: names as search pages show them.
const SITE_NAMES = new Map<string, string>([
  ['reddit', 'reddit.com'],
  ['quora', 'quora.com'],
  ['stack overflow', 'stackoverflow.com'],
  ['hacker news', 'news.ycombinator.com'],
  ['steam community', 'steamcommunity.com'],
  ['tripadvisor', 'tripadvisor.com'],
  ['linkedin', 'linkedin.com'],
  ['facebook', 'facebook.com'],
  ['instagram', 'instagram.com'],
  ['x', 'x.com'],
  ['youtube', 'youtube.com'],
  ['tiktok', 'tiktok.com'],
  ['pinterest', 'pinterest.com'],
]);

/** The site behind a displayed name, "Reddit · r/learnpython" → https://reddit.com/. */
export function siteNameToUrl(text: string | null | undefined): string | undefined {
  const name = (text ?? '').split(/\s+·\s+/)[0]!.replace(/\s+/g, ' ').trim().toLowerCase();
  const domain = SITE_NAMES.get(name);
  return domain ? `https://${domain}/` : undefined;
}
