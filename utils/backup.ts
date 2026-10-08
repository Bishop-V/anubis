import { storage } from '#imports';
import { t } from './i18n';
import { normalizeColor } from './listformat';
import type { TagAction, TagPref } from './matcher';
import { deepEqual, mergeById, mergeLists, mergeValue, type Side } from './merge';
import {
  DEFAULT_PERSONAL,
  DEFAULT_SETTINGS,
  loadPersonal,
  normalizeSettings,
  savePersonal,
  settingsItem,
  tagPrefsItem,
  type Settings,
  type Subscription,
} from './storage';
import { defaultSubscriptions, saveSubscriptions } from './subscriptions';

// Everything that follows the user between computers: what a backup file holds,
// and what syncing through a server sends. Downloaded lists aren't in it; each
// computer downloads its own.

export interface SyncData {
  settings: Settings;
  tagPrefs: Record<string, TagPref>;
  subscriptions: Subscription[];
  personal: string;
}

/** A backup file, and the sync file on a server: the same format, so either restores. */
export interface Backup extends SyncData {
  anubis: 1;
  exportedAt: string;
}

/** The default subscriptions, with a fixed date so two readings compare equal. */
const defaultSubs = () => defaultSubscriptions().map((s) => ({ ...s, addedAt: 0 }));

/** What a fresh install has: the starting point for a first sync, so an untouched install takes the other side's things. */
export function freshInstall(): SyncData {
  return { settings: DEFAULT_SETTINGS, tagPrefs: {}, subscriptions: defaultSubs(), personal: DEFAULT_PERSONAL };
}

export async function collectData(): Promise<SyncData> {
  const [settings, tagPrefs, subscriptions, personal] = await Promise.all([
    settingsItem.getValue(),
    tagPrefsItem.getValue(),
    storage.getItem<Subscription[]>('sync:subscriptions'),
    loadPersonal(),
  ]);
  return { settings: normalizeSettings(settings), tagPrefs, subscriptions: subscriptions ?? defaultSubs(), personal };
}

export function toBackup(data: SyncData): Backup {
  return { anubis: 1, exportedAt: new Date().toISOString(), ...data };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const TAG_ACTIONS: readonly TagAction[] = ['list', 'label', 'highlight', 'raise', 'lower', 'hide'];

/**
 * Tag choices from a file, keeping only what Settings could have saved. Search
 * pages read each choice as an object, and put its colour into a style.
 */
function readTagPrefs(value: unknown): Record<string, TagPref> {
  const prefs: Record<string, TagPref> = {};
  if (!isRecord(value)) return prefs;
  for (const [id, pref] of Object.entries(value)) {
    if (!isRecord(pref)) continue;
    const out: TagPref = {};
    if (TAG_ACTIONS.includes(pref.action as TagAction)) out.action = pref.action as TagAction;
    const color = typeof pref.color === 'string' ? normalizeColor(pref.color) : undefined;
    if (color) out.color = color;
    if (typeof pref.label === 'string') out.label = pref.label;
    if (typeof pref.muted === 'boolean') out.muted = pref.muted;
    prefs[id] = out;
  }
  return prefs;
}

/** A backup or sync file's contents, checked and filled in; throws if it isn't one. */
export function readBackup(text: string): SyncData {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(t('backupNotBackup'));
  }
  if (!isRecord(data) || data.anubis !== 1) throw new Error(t('backupNotBackup'));
  const subs = Array.isArray(data.subscriptions) ? data.subscriptions : undefined;
  return {
    settings: normalizeSettings(isRecord(data.settings) ? (data.settings as Partial<Settings>) : undefined),
    tagPrefs: readTagPrefs(data.tagPrefs),
    subscriptions: subs
      ? subs.filter((s): s is Subscription => isRecord(s) && typeof s.id === 'string' && typeof s.url === 'string')
      : defaultSubs(),
    personal: typeof data.personal === 'string' ? data.personal : DEFAULT_PERSONAL,
  };
}

/** Save `next`, writing only what differs from `current` (all of it without one). */
export async function applyData(next: SyncData, current?: SyncData): Promise<void> {
  const changed = <K extends keyof SyncData>(key: K) => !current || !deepEqual(next[key], current[key]);
  if (changed('settings')) await settingsItem.setValue(next.settings);
  if (changed('tagPrefs')) await tagPrefsItem.setValue(next.tagPrefs);
  if (changed('subscriptions')) await saveSubscriptions(next.subscriptions);
  if (changed('personal')) await savePersonal(next.personal);
}

export function mergeData(base: SyncData, local: SyncData, remote: SyncData, prefer: Side): SyncData {
  return {
    settings: mergeValue(base.settings, local.settings, remote.settings, prefer) ?? local.settings,
    tagPrefs: mergeValue(base.tagPrefs, local.tagPrefs, remote.tagPrefs, prefer) ?? {},
    subscriptions: mergeById(base.subscriptions, local.subscriptions, remote.subscriptions, prefer),
    personal: mergeLists(base.personal, local.personal, remote.personal, prefer),
  };
}
