// Where Anubis sends people for help and source. No browser APIs here:
// wxt.config.ts imports this for the manifest's homepage.

export const REPO_URL = 'https://github.com/Bishop-V/anubis';
export const DOCS_URL = 'https://bishop-v.github.io/anubis/';

/** What a bug report starts with. Nothing from the page itself: no address, no search. */
export interface BugDetails {
  version: string;
  /** From the user agent, e.g. "Firefox 143 on Linux". */
  browser?: string;
  /** The search engine of the tab it was reported from. */
  engine?: string;
}

/**
 * A new issue from the "Report a problem" form, with what Anubis knows filled in.
 * Nothing is sent until you submit it on GitHub.
 */
export function bugReportLink({ version, browser, engine }: BugDetails): string {
  const params = new URLSearchParams({ template: 'bug-report.yml', version });
  if (browser) params.set('browser', browser);
  if (engine) params.set('engine', engine);
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

const BROWSERS: [string, RegExp][] = [
  ['Edge', /\bEdg(?:e|A|iOS)?\/(\d+)/],
  ['Opera', /\bOPR\/(\d+)/],
  ['Firefox', /\b(?:Firefox|FxiOS)\/(\d+)/],
  ['Chrome', /\b(?:Chrome|CriOS)\/(\d+)/],
  ['Safari', /\bVersion\/(\d+).*Safari\//],
];
const SYSTEMS: [string, RegExp][] = [
  ['Android', /Android/],
  ['iOS', /iPhone|iPad/],
  ['Windows', /Windows/],
  ['macOS', /Mac OS X/],
  ['ChromeOS', /CrOS/],
  ['Linux', /Linux/],
];

/** "Firefox 143 on Windows", from a user agent; undefined for one it doesn't know. */
export function describeBrowser(userAgent: string): string | undefined {
  for (const [name, re] of BROWSERS) {
    const version = re.exec(userAgent)?.[1];
    if (!version) continue;
    const os = SYSTEMS.find(([, test]) => test.test(userAgent))?.[0];
    return os ? `${name} ${version} on ${os}` : `${name} ${version}`;
  }
  return undefined;
}

/** A page of the wiki, e.g. `guide('guide/lists')`. */
export const guide = (path = ''): string => `${DOCS_URL}${path}`;

/**
 * The page subscribe links point to. With Anubis installed, a content script there
 * opens Settings → Lists with the list filled in; without it, the page explains.
 */
export const SUBSCRIBE_PAGE = guide('subscribe');

export interface SubscribeLink {
  /** The list's address, as the link gave it. */
  url: string;
  /** What the link calls the list. The list's own `! name:` wins once it's downloaded. */
  name?: string;
}

/** A link that subscribes to a list: `…/subscribe?url=…&name=…`, the same shape as uBlacklist's. */
export function subscribeLink(link: SubscribeLink): string {
  return `${SUBSCRIBE_PAGE}?${subscribeQuery(link)}`;
}

/** The query part of a subscribe link, which the settings page takes too. */
export function subscribeQuery({ url, name }: SubscribeLink): string {
  const params = new URLSearchParams({ url });
  if (name) params.set('name', name);
  return params.toString();
}

/** The list a subscribe link's query asks for, or undefined if it doesn't name an https address. */
export function readSubscribeLink(query: string | URLSearchParams): SubscribeLink | undefined {
  const params = new URLSearchParams(query);
  const url = params.get('url')?.trim();
  if (!url || url.length > 2048) return undefined;
  try {
    if (new URL(url).protocol !== 'https:') return undefined;
  } catch {
    return undefined;
  }
  // Anyone can make a link, so keep the name to one short line of text.
  const name = params.get('name')?.replace(/[\p{C}\s]+/gu, ' ').trim().slice(0, 80);
  return name ? { url, name } : { url };
}
