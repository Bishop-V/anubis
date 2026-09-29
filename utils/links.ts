// Where Anubis sends people for help and source. No browser APIs here:
// wxt.config.ts imports this for the manifest's homepage.

export const REPO_URL = 'https://github.com/Bishop-V/anubis';
export const DOCS_URL = 'https://bishop-v.github.io/anubis/';

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
