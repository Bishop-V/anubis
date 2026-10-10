import directoryJson from '@/lists/directory.json';
import discussions from '@/lists/discussions.anubis?raw';
import fossTools from '@/lists/foss-tools.anubis?raw';
import officialDocs from '@/lists/official-docs.anubis?raw';
import paywalls from '@/lists/paywalls.anubis?raw';
import reference from '@/lists/reference.anubis?raw';
import { storage } from '#imports';
import { andList } from './dom';
import { normalizeHostname } from './domain';
import { t } from './i18n';
import { parseList, safeWebUrl, type ParsedList } from './listformat';
import {
  editListCache,
  getSettings,
  listCacheItem,
  subscriptionsItem,
  writeQueue,
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
  /** Ids of directory lists that cover the same sites; once you have one, this one isn't offered. */
  overlaps?: string[];
}

/** Subscriptions as stored, or the defaults if the user never changed them. */
export async function getSubscriptions(): Promise<Subscription[]> {
  const stored = await storage.getItem<Subscription[]>('sync:subscriptions');
  return stored ?? defaultSubscriptions();
}

const subscriptionsQueue = writeQueue();

/** Change the subscriptions, one change at a time, starting from the defaults if they were never changed. */
export function editSubscriptions(edit: (subs: Subscription[]) => Subscription[]): Promise<void> {
  return subscriptionsQueue(async () => subscriptionsItem.setValue(edit(await getSubscriptions())));
}

export function saveSubscriptions(subs: Subscription[]): Promise<void> {
  return editSubscriptions(() => subs);
}

/** The directory shipped with this build. A fresher copy is fetched from GitHub when possible. */
export const BUNDLED_DIRECTORY = directoryJson.lists as DirectoryEntry[];
export const DIRECTORY_URL = 'https://raw.githubusercontent.com/Bishop-V/anubis/main/lists/directory.json';

/** Lists bundled into the extension, so they work offline and before the first update. */
export const BUILTIN_TEXT: Record<string, string> = {
  'builtin:official-docs': officialDocs,
  'builtin:discussions': discussions,
  'builtin:foss-tools': fossTools,
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

/**
 * The directory lists worth offering: not ones you already have, and not ones
 * that cover the same sites as a list you have (an entry's `overlaps`).
 */
export function listsToDiscover(directory: DirectoryEntry[], subs: Pick<Subscription, 'id' | 'url'>[]): DirectoryEntry[] {
  const urls = new Set(subs.map((s) => s.url));
  const ids = new Set(subs.map((s) => s.id));
  const has = (d: DirectoryEntry) => urls.has(d.url) || ids.has(d.builtin ? builtinId(d) : subscriptionId(d.url));
  const owned = new Set(directory.filter(has).map((d) => d.id));
  return directory.filter((d) => !has(d) && !d.overlaps?.some((id) => owned.has(id)));
}

/** The directory's default lists. Bundled ones work at once; the others arrive with the first update. */
export function defaultSubscriptions(): Subscription[] {
  return BUNDLED_DIRECTORY.filter((e) => e.default).map((e) => ({
    id: e.builtin ? builtinId(e) : subscriptionId(e.url),
    url: e.url,
    enabled: true,
    addedAt: Date.now(),
    ...(e.builtin ? { builtin: true } : {}),
    name: e.name,
  }));
}

const DEFAULTS_ADDED = 'sync:defaultListsAdded' as const;

/**
 * Lists that became defaults after someone first saved their subscriptions (AI
 * content and Independent wikis, after 0.2.4) only reached new installs. Once, subscribe
 * everyone to every default list and switch it on, keeping their other lists.
 */
export async function migrateDefaultLists(): Promise<void> {
  if (await storage.getItem<boolean>(DEFAULTS_ADDED)) return;
  if (await storage.getItem<Subscription[]>('sync:subscriptions')) {
    await editSubscriptions((subs) => {
      const out = subs.map((s) => s);
      for (const d of defaultSubscriptions()) {
        const i = out.findIndex((s) => s.id === d.id || s.url === d.url);
        if (i === -1) out.push(d);
        else out[i] = { ...out[i]!, enabled: true };
      }
      return out;
    });
  }
  await storage.setItem(DEFAULTS_ADDED, true);
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

/**
 * The body as text, giving up as soon as it passes `max` bytes: by the declared
 * length before reading anything, otherwise while it streams in.
 */
async function readLimited(res: Response, max: number): Promise<string> {
  const tooBig = () => new Error(t('listTooBig', Math.round(max / 1024 / 1024)));
  if (Number(res.headers.get('content-length')) > max) {
    void res.body?.cancel();
    throw tooBig();
  }
  if (!res.body) return res.text();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      void reader.cancel();
      throw tooBig();
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export async function fetchText(url: string, timeoutMs = 20000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // no-cache: revalidate with the server (ETag), which is cheap when nothing changed.
    const res = await fetch(url, { signal: controller.signal, cache: 'no-cache', credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await readLimited(res, MAX_BYTES);
    if (/^\s*<(!doctype|html)/i.test(text)) throw new Error(t('listIsWebPage'));
    return text;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error(t('listTimedOut'));
    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    clearTimeout(timer);
  }
}

/** Download a list and check that it parses to something. */
export async function downloadList(url: string): Promise<{ text: string; parsed: ParsedList }> {
  const text = await fetchText(url);
  const parsed = parseList(text);
  if (!parsed.rules.length && !parsed.lens) {
    throw new Error(parsed.errors[0] ? t('listNoUsableRules', parsed.errors[0].line, parsed.errors[0].message) : t('listNoRules'));
  }
  return { text, parsed };
}

/** A downloaded list as the cache keeps it. */
export function freshCopy({ text, parsed }: { text: string; parsed: ParsedList }): CachedList {
  return { text, fetchedAt: Date.now(), expiresHours: parsed.meta.expiresHours ?? 0 };
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
    entry = freshCopy(await downloadList(sub.url));
  } catch (error) {
    // Keep the last good copy; remember the failure for the options page.
    entry = {
      text: prev?.text ?? '',
      fetchedAt: prev?.fetchedAt ?? 0,
      expiresHours: prev?.expiresHours,
      error: error instanceof Error ? error.message : String(error),
      errorAt: Date.now(),
    };
  }
  await editListCache((latest) => ({ ...latest, [sub.id]: entry }));
  return entry;
}

const RETRY_AFTER_ERROR_MS = 60 * 60 * 1000;

/** Update every enabled list that is older than its interval. */
export async function refreshStale(force = false): Promise<number> {
  const [subs, cache, settings] = await Promise.all([getSubscriptions(), listCacheItem.getValue(), getSettings()]);
  const now = Date.now();
  let updated = 0;
  for (const sub of subs) {
    if (!sub.enabled) continue;
    const entry = cache[sub.id];
    // Copies downloaded before expiresHours was stored are parsed for it once more.
    let expires = entry?.text ? entry.expiresHours : undefined;
    if (expires === undefined) {
      const text = listText(sub, cache);
      expires = text ? parseList(text).meta.expiresHours : undefined;
    }
    const hours = expires || settings.updateHours;
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
export function issueUrl(issues: string | undefined, title: string, body: string): string | undefined {
  const safe = safeWebUrl(issues);
  if (!safe) return undefined;
  try {
    const u = new URL(safe);
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
    return safe;
  } catch {
    return undefined;
  }
}

/** The issue tracker of the forge repository an address points into: a raw file, a page, the repository itself. */
function repoIssues(address: string | undefined): string | undefined {
  let u: URL;
  try {
    u = new URL(address ?? '');
  } catch {
    return undefined;
  }
  if (u.protocol !== 'https:') return undefined;
  const parts = u.pathname.split('/').filter(Boolean);
  switch (u.hostname) {
    case 'github.com':
    case 'raw.githubusercontent.com':
      return parts.length >= 2 ? `https://github.com/${parts[0]}/${parts[1]}/issues` : undefined;
    case 'codeberg.org':
      return parts.length >= 2 ? `https://codeberg.org/${parts[0]}/${parts[1]}/issues` : undefined;
    case 'gitlab.com': {
      // GitLab projects can sit in nested groups; everything before `/-/` is the project.
      const dash = parts.indexOf('-');
      const project = dash >= 0 ? parts.slice(0, dash) : parts;
      return project.length >= 2 ? `https://gitlab.com/${project.join('/')}/-/issues` : undefined;
    }
  }
  return undefined;
}

/**
 * Where a list takes reports of its mistakes: its `! issues:`, else the tracker of
 * the repository its homepage or its own address is in. Most lists live in a Git
 * repository, so this works for lists that never set `! issues:`.
 */
export function reportTracker(url: string, meta: { issues?: string; homepage?: string }): string | undefined {
  return meta.issues ?? repoIssues(meta.homepage) ?? repoIssues(url);
}

/** A result's address for an issue: without its query and fragment, which can carry session details. */
function plainAddress(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

/**
 * A pre-filled issue telling a list it's wrong about a result: what the list does,
 * the rules that matched and the result's address. English on purpose: like
 * suggestions, the issue is for the list's maintainers, whatever the interface language.
 */
export function reportUrl(
  issues: string | undefined,
  list: string,
  resultUrl: string,
  reasons: { report: string; rule?: { line: number; raw: string } }[],
): string | undefined {
  let url: URL;
  try {
    url = new URL(resultUrl);
  } catch {
    return undefined;
  }
  const site = normalizeHostname(url.hostname);
  const rules = reasons.flatMap((r) => (r.rule ? [r.rule] : []));
  const lines = [`Result: ${plainAddress(url)}`, '', `**${list}** ${andList([...new Set(reasons.map((r) => r.report))])}, and I think that’s wrong.`];
  if (rules.length) {
    // A fence longer than any run of backticks in the rules, so none can close it.
    const longest = Math.max(0, ...rules.map((r) => Math.max(0, ...(r.raw.match(/`+/g) ?? []).map((m) => m.length))));
    const fence = '`'.repeat(Math.max(3, longest + 1));
    const numbers = andList(rules.map((r) => String(r.line)));
    lines.push('', rules.length === 1 ? `Rule on line ${numbers}:` : `Rules on lines ${numbers}:`, fence, ...rules.map((r) => r.raw), fence);
  }
  lines.push('', 'What should change:', '', '', '_Sent from Anubis._');
  return issueUrl(issues, `Wrong rule for ${site}`, lines.join('\n'));
}

/**
 * A pre-filled issue proposing a site to a list: the line for it, and a result from
 * the site as an example. English on purpose, like reportUrl's.
 */
export function suggestionUrl(issues: string | undefined, list: string, domain: string, line: string, resultUrl: string): string | undefined {
  let url: URL;
  try {
    url = new URL(resultUrl);
  } catch {
    return undefined;
  }
  const body = [`Suggested instruction for **${list}**:`, '', '```', line, '```', '', `Example result: ${plainAddress(url)}`, '', '_Sent from Anubis._'];
  return issueUrl(issues, `Suggest ${domain}`, body.join('\n'));
}
