import { parseList, type ListMeta, type TagDef } from './listformat';
import { collectTags, compileList, listTagCards, type CompiledList, type TagPref } from './matcher';
import { keepTagDefs, PERSONAL_ID, PERSONAL_NAME } from './personal';
import {
  editPersonal,
  getSettings,
  listCacheItem,
  loadPersonal,
  subscriptionsItem,
  tagPrefsItem,
  watchPersonal,
  settingsItem,
  type Settings,
  type Subscription,
} from './storage';
import { displayName, getSubscriptions, listText, reportTracker } from './subscriptions';

export interface RuleSet {
  settings: Settings;
  prefs: Record<string, TagPref>;
  personalText: string;
  /** Personal list first, then enabled subscriptions. */
  lists: CompiledList[];
  meta: Record<string, ListMeta>;
  /** Where each subscribed list takes reports of its mistakes, when it has somewhere. */
  trackers: Record<string, string>;
  tags: Map<string, TagDef>;
}

interface CompiledSubscription {
  text: string;
  name?: string;
  url: string;
  compiled: CompiledList;
  meta: ListMeta;
  tracker?: string;
}

// Subscribed lists as last compiled, by subscription. Any change (one click in the
// result menu) reloads the rule set in every open search tab, and parsing every
// subscribed list again each time was most of that work.
const compiled = new Map<string, CompiledSubscription>();

function compiledSubscription(sub: Subscription, text: string): CompiledSubscription {
  const known = compiled.get(sub.id);
  if (known && known.text === text && known.name === sub.name && known.url === sub.url) return known;
  // A search page needs a few sites of each list: the rest are only filed by site.
  const parsed = parseList(text, true);
  const list = {
    text,
    name: sub.name,
    url: sub.url,
    compiled: compileList(sub.id, parsed, false, displayName(sub, parsed.meta)),
    meta: parsed.meta,
    tracker: reportTracker(sub.url, parsed.meta),
  };
  compiled.set(sub.id, list);
  return list;
}

export async function loadRuleSet(): Promise<RuleSet> {
  const [settings, prefs, personalText, subs, cache] = await Promise.all([
    getSettings(),
    tagPrefsItem.getValue(),
    loadPersonal(),
    getSubscriptions(),
    listCacheItem.getValue(),
  ]);

  const personal = parseList(personalText);
  const lists: CompiledList[] = [compileList(PERSONAL_ID, personal, true, PERSONAL_NAME)];
  const meta: Record<string, ListMeta> = { [PERSONAL_ID]: personal.meta };
  const trackers: Record<string, string> = {};

  const seen = new Set<string>();
  for (const sub of subs) {
    if (!sub.enabled) continue;
    const text = listText(sub, cache);
    if (!text) continue;
    const list = compiledSubscription(sub, text);
    seen.add(sub.id);
    lists.push(list.compiled);
    meta[sub.id] = list.meta;
    if (list.tracker) trackers[sub.id] = list.tracker;
  }
  for (const id of compiled.keys()) if (!seen.has(id)) compiled.delete(id);

  return { settings, prefs, personalText, lists, meta, trackers, tags: collectTags(lists, prefs) };
}

/** Calls back (debounced) whenever anything that affects the rule set changes. */
export function watchRuleSet(cb: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fire = () => {
    clearTimeout(timer);
    timer = setTimeout(cb, 30);
  };
  const unwatch = [
    settingsItem.watch(fire),
    tagPrefsItem.watch(fire),
    subscriptionsItem.watch(fire),
    listCacheItem.watch(fire),
    watchPersonal(fire),
  ];
  return () => unwatch.forEach((u) => u());
}

/**
 * Give your list a copy of each list's tag your sites use, as tagging a site now does.
 * Sites tagged before that only had the list's definition, and lost the tag's name
 * when the list dropped it. Runs after an install or update; does nothing once done.
 */
export async function copyListTags(): Promise<void> {
  const rules = await loadRuleSet();
  const cards = listTagCards(rules.lists);
  if (keepTagDefs(rules.personalText, cards) === rules.personalText) return;
  await editPersonal((text) => keepTagDefs(text, cards));
}
