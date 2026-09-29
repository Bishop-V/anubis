import { browser, storage } from '#imports';
import { NO_CLEANUP, type Cleanup } from './cleanup';
import { guide } from './links';
import type { TagPref } from './matcher';
import { fromBlockedSites, PERSONAL_HEADER } from './personal';

// Where everything lives:
//
//   sync:settings        appearance and behaviour (small)
//   sync:tagPrefs        what to do with each tag (small)
//   sync:subscriptions   which lists the user subscribes to (small); absent means the defaults
//   sync:personal*       the personal list, compressed and split into chunks (see below)
//   local:personal       the personal list, when it's too big for sync
//   local:personalCopy   this device's last good copy of the personal list
//   local:listCache      downloaded list texts; too big for sync, re-fetched per device
//   local:lastUpdateCheck  when the background last checked lists for updates
//   local:colorScheme    light or dark, as the extension's own pages see it (see utils/theme.ts)
//   sync:blockedSites    legacy block list, migrated into the personal list
//   sync:hideStyleMoved  the one-time move from Collapse to Remove as the default

export type Theme = 'auto' | 'dark' | 'light';
export type HideStyle = 'collapse' | 'remove' | 'dim';
/** Colours on search pages: Anubis's gold and each tag's colour, or the page's own greys. */
export type Palette = 'gold' | 'plain';

export interface Settings {
  /** Master switch: when false the content script leaves pages alone. */
  enabled: boolean;
  /** Colour scheme for the popup, options page and in-page UI. `auto` follows the page / OS. */
  theme: Theme;
  /** Colours of what Anubis adds to search pages: `plain` drops the gold and the tags' colours. */
  palette: Palette;
  /** How hidden results look: gone (the summary counts them), a slim line you can open, or faded. */
  hideStyle: HideStyle;
  /** Reorder results on the page according to boosts, downranks and pins. */
  rerank: boolean;
  /** Show tag and verdict chips under result titles. */
  showChips: boolean;
  /** Show the one-line summary of what Anubis changed above the results. */
  showSummary: boolean;
  /** Per-engine switches; engines missing here are on. */
  engines: Record<string, boolean>;
  /** Default hours between list updates, when a list doesn't say. */
  updateHours: number;
  /** Extra result pages to load and rerank automatically (0 = only on request). */
  deeper: number;
  /** Parts of result pages to remove: AI answers, video panels and so on. */
  cleanup: Cleanup;
  /** Always open Google's Web tab (`udm=14`), which has no AI Overview or panels. */
  googleWebTab: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  theme: 'auto',
  palette: 'gold',
  hideStyle: 'remove',
  rerank: true,
  showChips: true,
  showSummary: true,
  engines: {},
  updateHours: 24,
  deeper: 0,
  cleanup: NO_CLEANUP,
  googleWebTab: false,
};

/**
 * Runs read-modify-write changes to one stored item one after another, so two
 * quick changes from this page can't read the same value and overwrite each
 * other. Each page (a search tab, the popup, settings) has its own queues; see
 * "Storage" in docs/experiments.md.
 */
export function writeQueue(): <T>(change: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();
  return (change) => {
    const run = tail.then(change);
    tail = run.catch(() => undefined);
    return run;
  };
}

export const settingsItem = storage.defineItem<Settings>('sync:settings', { fallback: DEFAULT_SETTINGS });

/** Stored settings with defaults for anything missing. */
export function normalizeSettings(stored: Partial<Settings> | null | undefined): Settings {
  // Merge one level down too, so a clean-up kind added later starts off.
  return { ...DEFAULT_SETTINGS, ...stored, cleanup: { ...NO_CLEANUP, ...stored?.cleanup } };
}

export async function getSettings(): Promise<Settings> {
  return normalizeSettings(await settingsItem.getValue());
}

const settingsQueue = writeQueue();

/** Change some settings. Pass a function to work from the current ones (turning one engine off among many). */
export function updateSettings(patch: Partial<Settings> | ((current: Settings) => Partial<Settings>)): Promise<Settings> {
  return settingsQueue(async () => {
    const current = await getSettings();
    const next = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) };
    await settingsItem.setValue(next);
    return next;
  });
}

export const tagPrefsItem = storage.defineItem<Record<string, TagPref>>('sync:tagPrefs', { fallback: {} });
const tagPrefsQueue = writeQueue();

export function setTagPref(id: string, patch: Partial<TagPref>): Promise<void> {
  return tagPrefsQueue(async () => {
    const prefs = await tagPrefsItem.getValue();
    const next = { ...prefs[id], ...patch };
    for (const k of Object.keys(next) as (keyof TagPref)[]) if (next[k] === undefined) delete next[k];
    await tagPrefsItem.setValue({ ...prefs, [id]: next });
  });
}

// ---------------------------------------------------------------------------
// Subscriptions

export interface Subscription {
  id: string;
  url: string;
  enabled: boolean;
  addedAt: number;
  /** Set for lists shipped inside the extension (see BUILTIN_TEXT in utils/subscriptions.ts). */
  builtin?: boolean;
  /** Name from the directory, for lists whose file doesn't declare one. */
  name?: string;
}

export interface CachedList {
  text: string;
  fetchedAt: number;
  /** The list's own `! expires:`, in hours, read when it was downloaded; 0 when it has none. */
  expiresHours?: number;
  error?: string;
  /** When the last failed attempt happened, so we don't hammer a dead URL. */
  errorAt?: number;
}

export const subscriptionsItem = storage.defineItem<Subscription[]>('sync:subscriptions', {
  fallback: [],
});
export const listCacheItem = storage.defineItem<Record<string, CachedList>>('local:listCache', {
  fallback: {},
});
/**
 * Light or dark as the popup sees it on "auto". Search pages can have their own
 * (Firefox's "Website appearance"), so the result menu reads this to match the popup.
 */
export const colorSchemeItem = storage.defineItem<'light' | 'dark' | null>('local:colorScheme', { fallback: null });
const listCacheQueue = writeQueue();

/** Change the downloaded lists, one change at a time. */
export function editListCache(edit: (cache: Record<string, CachedList>) => Record<string, CachedList>): Promise<void> {
  return listCacheQueue(async () => listCacheItem.setValue(edit(await listCacheItem.getValue())));
}

// ---------------------------------------------------------------------------
// Personal list, compressed and chunked across sync items.
//
// storage.sync allows 8 KB per item and ~100 KB in total, in both Chrome and
// Firefox. Compressed, the list shrinks about 3×, so sync holds about 10,000
// sites. If even that overflows, the list falls back to local storage on this
// device.
//
// The browser syncs each chunk on its own, so another computer can briefly see
// new chunks next to old ones, or chunks from two computers mixed. The checksum
// in the meta item catches that, and this device's last good copy
// (local:personalCopy) stands in until the chunks match again.

const PERSONAL_META = 'sync:personal' as const;
const PERSONAL_LOCAL = 'local:personal' as const;
const PERSONAL_COPY = 'local:personalCopy' as const;
const LEGACY_BLOCKED = 'sync:blockedSites' as const;
const CHUNK_BYTES = 7000;

/** What storage.sync holds in all, in both Chrome and Firefox. */
export const SYNC_QUOTA_BYTES = 102400;

interface PersonalMeta {
  chunks: number;
  /** True when the list outgrew sync and lives in local storage instead. */
  local?: boolean;
  updatedAt: number;
  /** `deflate`: the chunks hold the text compressed, in base64. Absent: plain text. */
  encoding?: 'deflate';
  /** The text's `checksum`. Absent in lists saved before there was one. */
  sum?: string;
}

interface PersonalCopy {
  sum: string;
  text: string;
}

const chunkKey = (i: number) => `sync:personal.${i}` as const;

/** Length and FNV-1a hash: enough to notice a list that hasn't fully arrived, not a security check. */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return `${text.length}:${(hash >>> 0).toString(16)}`;
}

/** Deflate, then base64 so it stores as a string. */
export async function compress(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = '';
  // In slices: spreading a whole big array overflows the call stack.
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function decompress(data: string): Promise<string> {
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

/** Split into pieces that fit one sync item. Joining them with '' gives the text back exactly. */
export function splitIntoChunks(text: string): string[] {
  const encoder = new TextEncoder();
  const fits = (s: string) => encoder.encode(JSON.stringify(s)).length <= CHUNK_BYTES;
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    let n = Math.min(3500, text.length - i);
    while (!fits(text.slice(i, i + n))) n = Math.floor(n * 0.8);
    // Don't split a surrogate pair.
    const last = text.charCodeAt(i + n - 1);
    if (n > 1 && last >= 0xd800 && last <= 0xdbff) n--;
    chunks.push(text.slice(i, i + n));
    i += n;
  }
  return chunks.length ? chunks : [''];
}

export const DEFAULT_PERSONAL = `${PERSONAL_HEADER}
! One instruction per line. The ⚖ menu on each search result edits this list.
! The format: ${guide('list-format')}
$site=fandom.com,discard
`;

/**
 * The personal list, and whether it's the one sync holds. `settled` is false while
 * sync's chunks don't match their checksum; the text is then this device's last
 * good copy.
 */
async function readPersonal(): Promise<{ text: string; settled: boolean }> {
  const meta = await storage.getItem<PersonalMeta>(PERSONAL_META);
  if (!meta) {
    // First run, or an install from before the personal list existed.
    const legacy = await storage.getItem<string[]>(LEGACY_BLOCKED);
    return { text: legacy ? fromBlockedSites(legacy) : DEFAULT_PERSONAL, settled: true };
  }
  const copy = await storage.getItem<PersonalCopy>(PERSONAL_COPY);
  // Another computer's list can be the one that's too big: it isn't here, so show
  // the last one that synced.
  if (meta.local) return { text: (await storage.getItem<string>(PERSONAL_LOCAL)) ?? copy?.text ?? '', settled: true };
  if (meta.sum && copy?.sum === meta.sum) return { text: copy.text, settled: true };
  const items = await storage.getItems(Array.from({ length: meta.chunks }, (_, i) => chunkKey(i)));
  const joined = items.map((it) => (typeof it.value === 'string' ? it.value : '')).join('');
  const text = meta.encoding === 'deflate' ? await decompress(joined).catch(() => undefined) : joined;
  if (text !== undefined && (!meta.sum || checksum(text) === meta.sum)) {
    if (meta.sum) await storage.setItem(PERSONAL_COPY, { sum: meta.sum, text } satisfies PersonalCopy);
    return { text, settled: true };
  }
  return { text: copy?.text ?? text ?? '', settled: false };
}

export async function loadPersonal(): Promise<string> {
  return (await readPersonal()).text;
}

/** Compressed where the browser can (Chrome 103, Firefox 113); plain text otherwise. */
async function pack(text: string): Promise<{ data: string; encoding?: 'deflate' }> {
  try {
    return { data: await compress(text), encoding: 'deflate' };
  } catch {
    return { data: text };
  }
}

export async function savePersonal(text: string): Promise<{ synced: boolean }> {
  const prev = await storage.getItem<PersonalMeta>(PERSONAL_META);
  const sum = checksum(text);
  const { data, encoding } = await pack(text);
  const chunks = splitIntoChunks(data);
  const stale = Array.from({ length: Math.max(0, (prev?.chunks ?? 0) - chunks.length) }, (_, i) =>
    chunkKey(chunks.length + i),
  );
  // The copy first, so this device reads its own change without unpacking it.
  await storage.setItem(PERSONAL_COPY, { sum, text } satisfies PersonalCopy);
  try {
    const meta: PersonalMeta = { chunks: chunks.length, updatedAt: Date.now(), sum, ...(encoding && { encoding }) };
    await storage.setItems([...chunks.map((value, i) => ({ key: chunkKey(i), value })), { key: PERSONAL_META, value: meta }]);
    if (stale.length) await storage.removeItems(stale);
    if (prev?.local) await storage.removeItem(PERSONAL_LOCAL);
    return { synced: true };
  } catch (error) {
    // Most likely QUOTA_BYTES: keep the list on this device instead of losing edits.
    console.warn('[anubis] personal list too big for sync, keeping it local', error);
    await storage.setItem(PERSONAL_LOCAL, text);
    await storage.setItem(PERSONAL_META, { chunks: 0, local: true, updatedAt: Date.now() } satisfies PersonalMeta);
    // The last list that fit is no use now, and its space is.
    await storage.removeItems(Array.from({ length: prev?.chunks ?? 0 }, (_, i) => chunkKey(i)));
    return { synced: false };
  }
}

const personalQueue = writeQueue();

/**
 * Read-modify-write helper for the personal list. Edits from this page run one
 * after another, so two quick clicks can't overwrite each other.
 */
export function editPersonal(edit: (text: string) => string): Promise<string> {
  return personalQueue(async () => {
    let current = await readPersonal();
    // Sync may still be bringing the rest of the list: wait for it rather than
    // save a change on top of an older copy.
    if (!current.settled) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      current = await readPersonal();
    }
    const next = edit(current.text);
    await savePersonal(next);
    return next;
  });
}

export async function personalIsLocal(): Promise<boolean> {
  return (await storage.getItem<PersonalMeta>(PERSONAL_META))?.local === true;
}

/** Calls back with the new text whenever the personal list changes anywhere. */
export function watchPersonal(cb: (text: string) => void): () => void {
  // One save changes several items at once: read the list once for them all.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reload = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void loadPersonal().then(cb), 20);
  };
  const unwatch = [PERSONAL_META, PERSONAL_LOCAL, PERSONAL_COPY].map((key) => storage.watch(key, reload));
  // Chunks can arrive from sync after the meta item that counts them.
  const onSync = (changes: Record<string, unknown>) => {
    if (Object.keys(changes).some((key) => key.startsWith('personal.'))) reload();
  };
  browser.storage.sync.onChanged.addListener(onSync);
  return () => {
    clearTimeout(timer);
    unwatch.forEach((u) => u());
    browser.storage.sync.onChanged.removeListener(onSync);
  };
}

/** How much of storage.sync Anubis uses, counted as the browsers count it: each key plus its value as JSON. */
export async function syncBytesInUse(): Promise<number> {
  const all = await browser.storage.sync.get(null);
  const encoder = new TextEncoder();
  return Object.entries(all).reduce((n, [key, value]) => n + encoder.encode(key + JSON.stringify(value)).length, 0);
}

/**
 * Hidden results used to collapse to a line each by default, which filled pages
 * where one site is everywhere. The default is now to remove them; move settings
 * saved with the old default over, once.
 */
const HIDE_STYLE_MOVED = 'sync:hideStyleMoved' as const;
export async function migrateSettings(): Promise<void> {
  if (await storage.getItem<boolean>(HIDE_STYLE_MOVED)) return;
  const stored = await settingsItem.getValue();
  if (stored?.hideStyle === 'collapse') await updateSettings({ hideStyle: 'remove' });
  await storage.setItem(HIDE_STYLE_MOVED, true);
}

/** Moves the legacy `sync:blockedSites` array into the personal list. Safe to call repeatedly. */
export async function migrateLegacy(): Promise<void> {
  const meta = await storage.getItem<PersonalMeta>(PERSONAL_META);
  if (meta) return;
  await savePersonal(await loadPersonal());
  await storage.removeItem(LEGACY_BLOCKED);
}
