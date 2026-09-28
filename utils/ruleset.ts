import { parseList, type ListMeta, type TagDef } from './listformat';
import { collectTags, compileList, type CompiledList, type TagPref } from './matcher';
import {
  getSettings,
  listCacheItem,
  loadPersonal,
  subscriptionsItem,
  tagPrefsItem,
  watchPersonal,
  settingsItem,
  type Settings,
} from './storage';
import { displayName, getSubscriptions, listText } from './subscriptions';

export { getSubscriptions, saveSubscriptions } from './subscriptions';

export const PERSONAL_ID = 'personal';
export const PERSONAL_NAME = 'Your list';

export interface RuleSet {
  settings: Settings;
  prefs: Record<string, TagPref>;
  personalText: string;
  /** Personal list first, then enabled subscriptions. */
  lists: CompiledList[];
  meta: Record<string, ListMeta>;
  tags: Map<string, TagDef>;
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

  for (const sub of subs) {
    if (!sub.enabled) continue;
    const text = listText(sub, cache);
    if (!text) continue;
    const parsed = parseList(text);
    lists.push(compileList(sub.id, parsed, false, displayName(sub, parsed.meta)));
    meta[sub.id] = parsed.meta;
  }

  return { settings, prefs, personalText, lists, meta, tags: collectTags(lists, prefs) };
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
