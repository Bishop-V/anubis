import directoryJson from '@/lists/directory.json';
import discussions from '@/lists/discussions.anubis?raw';
import officialDocs from '@/lists/official-docs.anubis?raw';
import paywalls from '@/lists/paywalls.anubis?raw';
import reference from '@/lists/reference.anubis?raw';
import { parseList } from './listformat';
import {
  getSettings,
  listCacheItem,
  subscriptionsItem,
  type CachedList,
  type Subscription,
} from './storage';

// Subscriptions are plain text files on any static host. Git forges are the
// intended home: free, versioned, and anyone can propose a change with a pull
// request. There is no Anubis server.

export interface DirectoryEntry {
  id: string;
  name: string;
  description: string;
  url: string;
  homepage?: string;
  format?: string;
  builtin?: boolean;
  /** Subscribed on first install. */
  default?: boolean;
  lens?: boolean;
}

/** The directory shipped with this build. A fresher copy is fetched from GitHub when possible. */
export const BUNDLED_DIRECTORY = directoryJson.lists as DirectoryEntry[];
export const DIRECTORY_URL = 'https://raw.githubusercontent.com/Bishop-V/anubis/main/lists/directory.json';

/** Lists bundled into the extension, so they work offline and before the first update. */
export const BUILTIN_TEXT: Record<string, string> = {
  'builtin:official-docs': officialDocs,
  'builtin:discussions': discussions,
  'builtin:reference': reference,
  'builtin:paywalls': paywalls,
};

/** What to call a list: its own `! name:`, else the directory's name, else the file name. */
export function displayName(sub: Pick<Subscription, 'url' | 'name'>, meta?: { name?: string }): string {
  if (meta?.name) return meta.name;
  if (sub.name) return sub.name;
  try {
    return decodeURIComponent(new URL(sub.url).pathname.split('/').pop() || sub.url);
  } catch {
    return sub.url;
  }
}

export function builtinId(entry: DirectoryEntry): string {
  return `builtin:${entry.id}`;
}

export function defaultSubscriptions(): Subscription[] {
  return BUNDLED_DIRECTORY.filter((e) => e.default).map((e) => ({
    id: builtinId(e),
    url: e.url,
    enabled: true,
    addedAt: Date.now(),
    builtin: true,
    name: e.name,
  }));
}

/**
 * Accept the URL people actually copy (a GitHub page, a gist, a Brave Goggle link)
 * and turn it into the raw file URL.
 */
export function toRawUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return input.trim();
  }
  // https://search.brave.com/goggles?goggles_id=<url>
  if (url.hostname === 'search.brave.com') {
    const inner = url.searchParams.get('goggles_id');
    if (inner) return toRawUrl(inner);
  }
  // https://github.com/owner/repo/blob/ref/path → raw.githubusercontent.com/owner/repo/ref/path
  if (url.hostname === 'github.com') {
    const m = /^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(url.pathname);
    if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
  }
  // https://gist.github.com/user/id → gist.githubusercontent.com/user/id/raw
  if (url.hostname === 'gist.github.com') {
    const m = /^\/([^/]+)\/([0-9a-f]+)\/?$/i.exec(url.pathname);
    if (m) return `https://gist.githubusercontent.com/${m[1]}/${m[2]}/raw`;
  }
  // https://gitlab.com/group/repo/-/blob/ref/path → /-/raw/
  if (url.hostname === 'gitlab.com' && url.pathname.includes('/-/blob/')) {
    return url.origin + url.pathname.replace('/-/blob/', '/-/raw/');
  }
  // https://codeberg.org/owner/repo/src/branch/main/path → /raw/branch/main/path
  if (url.hostname === 'codeberg.org') {
    const m = /^\/([^/]+)\/([^/]+)\/src\/(.+)$/.exec(url.pathname);
    if (m) return `https://codeberg.org/${m[1]}/${m[2]}/raw/${m[3]}`;
  }
  return url.toString();
}

/** Hosts that send `Access-Control-Allow-Origin: *`, so fetching needs no extra permission. */
const CORS_HOSTS = new Set(['raw.githubusercontent.com', 'gist.githubusercontent.com']);

/** The origin permission needed to fetch this URL, or undefined if none is needed. */
export function originPermissionFor(url: string): string | undefined {
  try {
    const u = new URL(url);
    return CORS_HOSTS.has(u.hostname) ? undefined : `${u.protocol}//${u.hostname}/*`;
  } catch {
    return undefined;
  }
}

export function subscriptionId(url: string): string {
  let h = 5381;
  for (const ch of url) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return `sub:${h.toString(36)}`;
}

const MAX_BYTES = 5 * 1024 * 1024;

export async function fetchText(url: string, timeoutMs = 20000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // no-cache: revalidate with the server (ETag), which is cheap when nothing changed.
    const res = await fetch(url, { signal: controller.signal, cache: 'no-cache', credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.length > MAX_BYTES) throw new Error('List is larger than 5 MB');
    if (/^\s*<(!doctype|html)/i.test(text)) throw new Error('Got a web page, not a list. Use the raw file URL.');
    return text;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Timed out');
    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    clearTimeout(timer);
  }
}

/** Download a list and check that it parses to something. */
export async function downloadList(url: string): Promise<string> {
  const text = await fetchText(url);
  const parsed = parseList(text);
  if (!parsed.rules.length && !parsed.lens) {
    throw new Error(parsed.errors[0] ? `No usable rules (line ${parsed.errors[0].line}: ${parsed.errors[0].message})` : 'No rules found');
  }
  return text;
}

/** The text for a subscription: downloaded copy, else the bundled copy for built-ins. */
export function listText(sub: Subscription, cache: Record<string, CachedList>): string | undefined {
  return cache[sub.id]?.text || BUILTIN_TEXT[sub.id];
}

export async function refreshList(sub: Subscription): Promise<CachedList> {
  const cache = await listCacheItem.getValue();
  const prev = cache[sub.id];
  let entry: CachedList;
  try {
    entry = { text: await downloadList(sub.url), fetchedAt: Date.now() };
  } catch (error) {
    // Keep the last good copy; remember the failure for the options page.
    entry = {
      text: prev?.text ?? '',
      fetchedAt: prev?.fetchedAt ?? 0,
      error: error instanceof Error ? error.message : String(error),
      errorAt: Date.now(),
    };
  }
  const latest = await listCacheItem.getValue();
  await listCacheItem.setValue({ ...latest, [sub.id]: entry });
  return entry;
}

const RETRY_AFTER_ERROR_MS = 60 * 60 * 1000;

/** Update every enabled list that is older than its interval. */
export async function refreshStale(force = false): Promise<number> {
  const [subs, cache, settings] = await Promise.all([
    subscriptionsItem.getValue(),
    listCacheItem.getValue(),
    getSettings(),
  ]);
  const now = Date.now();
  let updated = 0;
  for (const sub of subs) {
    if (!sub.enabled) continue;
    const entry = cache[sub.id];
    const text = listText(sub, cache);
    const hours = (text && parseList(text).meta.expiresHours) || settings.updateHours;
    const due = !entry || now - entry.fetchedAt > hours * 3600_000;
    const backingOff = entry?.errorAt && now - entry.errorAt < RETRY_AFTER_ERROR_MS;
    if (force || (due && !backingOff)) {
      await refreshList(sub);
      updated++;
    }
  }
  return updated;
}

export async function fetchDirectory(): Promise<DirectoryEntry[]> {
  try {
    const data = JSON.parse(await fetchText(DIRECTORY_URL, 10000)) as { lists?: DirectoryEntry[] };
    if (Array.isArray(data.lists) && data.lists.length) return data.lists;
  } catch {
    // Offline or the file moved: the bundled copy is fine.
  }
  return BUNDLED_DIRECTORY;
}

/**
 * A link that opens a pre-filled issue on the list's tracker, so anyone can
 * propose an addition without an account on anything but the forge itself.
 */
export function suggestionUrl(issues: string | undefined, title: string, body: string): string | undefined {
  if (!issues) return undefined;
  try {
    const u = new URL(issues);
    const base = u.pathname.replace(/\/+$/, '').replace(/\/new$/, '');
    if (u.hostname === 'github.com' || u.hostname === 'codeberg.org') {
      const url = new URL(`${u.origin}${base}/new`);
      url.searchParams.set('title', title);
      url.searchParams.set('body', body);
      return url.toString();
    }
    if (u.hostname === 'gitlab.com') {
      const url = new URL(`${u.origin}${base}/new`);
      url.searchParams.set('issue[title]', title);
      url.searchParams.set('issue[description]', body);
      return url.toString();
    }
    return issues;
  } catch {
    return undefined;
  }
}
