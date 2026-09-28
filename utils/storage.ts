import { storage } from '#imports';
import { NO_CLEANUP, type Cleanup } from './cleanup';
import type { TagPref } from './matcher';
import { fromBlockedSites, PERSONAL_HEADER } from './personal';

// Where everything lives:
//
//   sync:settings        appearance and behaviour (small)
//   sync:tagPrefs        what to do with each tag (small)
//   sync:subscriptions   which lists the user subscribes to (small)
//   sync:personal*       the personal list as text, split into chunks (see below)
//   local:listCache      downloaded list texts; too big for sync, re-fetched per device
//   sync:blockedSites    legacy block list, migrated into the personal list

export type Theme = 'auto' | 'dark' | 'light';
export type HideStyle = 'collapse' | 'remove' | 'dim';

export interface Settings {
  /** Master switch: when false the content script leaves pages alone. */
  enabled: boolean;
  /** Colour scheme for the popup, options page and in-page UI. `auto` follows the page / OS. */
  theme: Theme;
  /** How hidden results look: a slim bar you can expand, gone entirely, or faded. */
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
  hideStyle: 'collapse',
  rerank: true,
  showChips: true,
  showSummary: true,
  engines: {},
  updateHours: 24,
  deeper: 0,
  cleanup: NO_CLEANUP,
  googleWebTab: false,
};

export const settingsItem = storage.defineItem<Settings>('sync:settings', { fallback: DEFAULT_SETTINGS });

export async function getSettings(): Promise<Settings> {
  const stored = await settingsItem.getValue();
  // Merge one level down too, so a clean-up kind added later starts off.
  return { ...DEFAULT_SETTINGS, ...stored, cleanup: { ...NO_CLEANUP, ...stored?.cleanup } };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await settingsItem.setValue(next);
  return next;
}

export const tagPrefsItem = storage.defineItem<Record<string, TagPref>>('sync:tagPrefs', { fallback: {} });

export async function setTagPref(id: string, patch: Partial<TagPref>): Promise<void> {
  const prefs = await tagPrefsItem.getValue();
  const next = { ...prefs[id], ...patch };
  for (const k of Object.keys(next) as (keyof TagPref)[]) if (next[k] === undefined) delete next[k];
  await tagPrefsItem.setValue({ ...prefs, [id]: next });
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

// ---------------------------------------------------------------------------
// Personal list, chunked across sync items.
//
// storage.sync allows 8 KB per item and ~100 KB in total, in both Chrome and
// Firefox. One item holds ~300 rules; chunking gets to a few thousand. If even
// that overflows, the list falls back to local storage on this device.

const PERSONAL_META = 'sync:personal' as const;
const PERSONAL_LOCAL = 'local:personal' as const;
const LEGACY_BLOCKED = 'sync:blockedSites' as const;
const CHUNK_BYTES = 7000;

interface PersonalMeta {
  chunks: number;
  /** True when the list outgrew sync and lives in local storage instead. */
  local?: boolean;
  updatedAt: number;
}

const chunkKey = (i: number) => `sync:personal.${i}` as const;

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
! One instruction per line. The weigh menu on each search result edits this list.
! See docs/list-format.md for the syntax.
$site=fandom.com,discard
`;

export async function loadPersonal(): Promise<string> {
  const meta = await storage.getItem<PersonalMeta>(PERSONAL_META);
  if (!meta) {
    // First run, or an install from before the personal list existed.
    const legacy = await storage.getItem<string[]>(LEGACY_BLOCKED);
    return legacy ? fromBlockedSites(legacy) : DEFAULT_PERSONAL;
  }
  if (meta.local) return (await storage.getItem<string>(PERSONAL_LOCAL)) ?? '';
  const items = await storage.getItems(Array.from({ length: meta.chunks }, (_, i) => chunkKey(i)));
  return items.map((it) => (typeof it.value === 'string' ? it.value : '')).join('');
}

export async function savePersonal(text: string): Promise<{ synced: boolean }> {
  const prev = await storage.getItem<PersonalMeta>(PERSONAL_META);
  const chunks = splitIntoChunks(text);
  const stale = Array.from({ length: Math.max(0, (prev?.chunks ?? 0) - chunks.length) }, (_, i) =>
    chunkKey(chunks.length + i),
  );
  try {
    await storage.setItems([
      ...chunks.map((value, i) => ({ key: chunkKey(i), value })),
      { key: PERSONAL_META, value: { chunks: chunks.length, updatedAt: Date.now() } satisfies PersonalMeta },
    ]);
    if (stale.length) await storage.removeItems(stale);
    if (prev?.local) await storage.removeItem(PERSONAL_LOCAL);
    return { synced: true };
  } catch (error) {
    // Most likely QUOTA_BYTES: keep the list on this device instead of losing edits.
    console.warn('[anubis] personal list too big for sync, keeping it local', error);
    await storage.setItem(PERSONAL_LOCAL, text);
    await storage.setItem(PERSONAL_META, { chunks: 0, local: true, updatedAt: Date.now() } satisfies PersonalMeta);
    return { synced: false };
  }
}

let editQueue: Promise<unknown> = Promise.resolve();

/**
 * Read-modify-write helper for the personal list. Edits from this page run one
 * after another, so two quick clicks can't overwrite each other.
 */
export function editPersonal(edit: (text: string) => string): Promise<string> {
  const run = editQueue.then(async () => {
    const next = edit(await loadPersonal());
    await savePersonal(next);
    return next;
  });
  editQueue = run.catch(() => undefined);
  return run;
}

export async function personalIsLocal(): Promise<boolean> {
  return (await storage.getItem<PersonalMeta>(PERSONAL_META))?.local === true;
}

/** Calls back with the new text whenever the personal list changes anywhere. */
export function watchPersonal(cb: (text: string) => void): () => void {
  const reload = () => void loadPersonal().then(cb);
  const a = storage.watch(PERSONAL_META, reload);
  const b = storage.watch(PERSONAL_LOCAL, reload);
  return () => {
    a();
    b();
  };
}

/** Moves the legacy `sync:blockedSites` array into the personal list. Safe to call repeatedly. */
export async function migrateLegacy(): Promise<void> {
  const meta = await storage.getItem<PersonalMeta>(PERSONAL_META);
  if (meta) return;
  await savePersonal(await loadPersonal());
  await storage.removeItem(LEGACY_BLOCKED);
}
