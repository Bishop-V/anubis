import { hostSuffixes } from './domain';
import type { ParsedList, Rule, TagDef } from './listformat';

// Turns parsed lists into lookup tables and weighs search results against them.
//
// Precedence, from strongest to weakest:
//   1. The personal list (pin / raise / lower / hide / allow for a site).
//   2. The user's per-tag choices ("hide everything tagged ai-slop").
//   3. The subscribed lists' own instructions. Within one list, Goggles precedence
//      applies: discard > boost > downrank. Across lists, boosts and downranks add up.

export type Level = 'pin' | 'raise' | 'normal' | 'lower' | 'hide';
export const LEVELS: Level[] = ['hide', 'lower', 'normal', 'raise', 'pin'];

/** What the user wants done with results carrying a tag. `list` follows the list's own instructions. */
export type TagAction = 'list' | 'label' | 'highlight' | 'raise' | 'lower' | 'hide';

export interface TagPref {
  action?: TagAction;
  color?: string;
  label?: string;
  /** Hide the chip but keep the ranking effect. */
  muted?: boolean;
}

/** How far the personal "raise"/"lower" levels move a result, in list positions. */
export const PERSONAL_STRENGTH = 5;
const PIN_SCORE = 1000;
/** Subscribed lists can't pin; a `pin` from one is treated as the strongest boost. */
const MAX_LIST_BOOST = 10;

export interface CompiledList {
  id: string;
  name: string;
  personal: boolean;
  lens: boolean;
  avatar?: string;
  tags: TagDef[];
  bySite: Map<string, Rule[]>;
  byHost: Map<string, Rule[]>;
  generic: Rule[];
}

export function compileList(id: string, parsed: ParsedList, personal = false, name?: string): CompiledList {
  const bySite = new Map<string, Rule[]>();
  const byHost = new Map<string, Rule[]>();
  const generic: Rule[] = [];
  const push = (map: Map<string, Rule[]>, key: string, rule: Rule) => {
    const arr = map.get(key);
    if (arr) arr.push(rule);
    else map.set(key, [rule]);
  };
  for (const rule of parsed.rules) {
    if (rule.site) push(bySite, rule.site, rule);
    else if (rule.host) push(byHost, rule.host.replace(/^www\./, ''), rule);
    else generic.push(rule);
  }
  return {
    id,
    name: name ?? parsed.meta.name ?? id,
    personal,
    lens: parsed.lens,
    avatar: parsed.meta.avatar,
    tags: parsed.tags,
    bySite,
    byHost,
    generic,
  };
}

export interface ResultInfo {
  url: string;
  title?: string;
  description?: string;
}

export interface Reason {
  list: string;
  listId: string;
  personal: boolean;
  text: string;
}

export interface Verdict {
  level: Level;
  /** Positions to move the result up (positive) or down (negative) when reranking. */
  score: number;
  hidden: boolean;
  /** Tag ids in display order (personal tags first). */
  tags: string[];
  /** Tag id → names of the lists that applied it. */
  tagSources: Record<string, string[]>;
  /** Tag whose colour tints the result, when a tag's action is "highlight". */
  highlight?: string;
  /** The personal list's explicit level for this result, if any. */
  personal?: Level | 'allow';
  reasons: Reason[];
}

interface Target {
  url: string;
  host: string;
  path: string;
  title: string;
  description: string;
}

function toTarget(result: ResultInfo): Target | undefined {
  try {
    const u = new URL(result.url);
    return {
      url: result.url,
      host: u.hostname.toLowerCase().replace(/^www\./, ''),
      path: u.pathname + u.search,
      title: result.title ?? '',
      description: result.description ?? '',
    };
  } catch {
    return undefined;
  }
}

function ruleMatches(rule: Rule, t: Target): boolean {
  if (rule.pathPattern && !rule.pathPattern.test(t.path)) return false;
  if (rule.pattern) {
    const subject = rule.target === 'title' ? t.title : rule.target === 'description' ? t.description : t.url;
    if (!rule.pattern.test(subject)) return false;
  }
  return true;
}

/** Every rule in the list that matches, most specific site first. */
export function matchList(list: CompiledList, t: Target): Rule[] {
  const out: Rule[] = [];
  for (const rule of list.byHost.get(t.host) ?? []) if (ruleMatches(rule, t)) out.push(rule);
  for (const suffix of hostSuffixes(t.host)) {
    for (const rule of list.bySite.get(suffix) ?? []) if (ruleMatches(rule, t)) out.push(rule);
  }
  for (const rule of list.generic) if (ruleMatches(rule, t)) out.push(rule);
  return out;
}

function describe(rule: Rule): string {
  const parts: string[] = [];
  if (rule.pin) parts.push('pin');
  if (rule.allow) parts.push('allow');
  if (rule.discard) parts.push('hide');
  if (rule.boost > 0) parts.push(`raise +${rule.boost}`);
  if (rule.boost < 0) parts.push(`lower ${rule.boost}`);
  if (rule.tags.length) parts.push(`tag ${rule.tags.join(', ')}`);
  const where = rule.site ?? rule.host ?? '';
  return `${parts.join(' · ') || 'match'}${where ? ` (${where})` : ''}`;
}

type Effect = { discard: boolean; boost: number; highlight?: string };

const TAG_ACTION_RANK: Record<TagAction, number> = { list: 0, label: 1, highlight: 2, raise: 3, lower: 4, hide: 5 };

/** Apply the user's per-tag choices to a rule. Returns undefined when the rule's own action stands. */
function tagOverride(rule: Rule, prefs: Record<string, TagPref>): Effect | undefined {
  let best: TagAction = 'list';
  let tag: string | undefined;
  for (const id of rule.tags) {
    const action = prefs[id]?.action ?? 'list';
    if (TAG_ACTION_RANK[action] > TAG_ACTION_RANK[best]) {
      best = action;
      tag = id;
    }
  }
  switch (best) {
    case 'list':
      return undefined;
    case 'label':
      return { discard: false, boost: 0 };
    case 'highlight':
      return { discard: false, boost: 0, highlight: tag };
    case 'raise':
      return { discard: false, boost: PERSONAL_STRENGTH };
    case 'lower':
      return { discard: false, boost: -PERSONAL_STRENGTH };
    case 'hide':
      return { discard: true, boost: 0 };
  }
}

function personalLevel(rules: Rule[]): Level | 'allow' | undefined {
  // Rules arrive most-specific first; the first rule with an action decides.
  for (const rule of rules) {
    if (rule.discard) return 'hide';
    if (rule.pin) return 'pin';
    if (rule.allow) return 'allow';
    if (rule.boost > 0) return 'raise';
    if (rule.boost < 0) return 'lower';
  }
  return undefined;
}

export function evaluate(
  result: ResultInfo,
  lists: CompiledList[],
  prefs: Record<string, TagPref> = {},
): Verdict {
  const verdict: Verdict = { level: 'normal', score: 0, hidden: false, tags: [], tagSources: {}, reasons: [] };
  const t = toTarget(result);
  if (!t) return verdict;

  const addTag = (id: string, source: string) => {
    if (!verdict.tagSources[id]) {
      verdict.tagSources[id] = [];
      verdict.tags.push(id);
    }
    if (!verdict.tagSources[id].includes(source)) verdict.tagSources[id].push(source);
  };

  let discard = false;
  let score = 0;
  let highlight: string | undefined;

  for (const list of lists) {
    const matched = matchList(list, t);
    const reason = (text: string) =>
      verdict.reasons.push({ list: list.name, listId: list.id, personal: list.personal, text });

    if (!matched.length) {
      if (list.lens) {
        discard = true;
        reason('not in this lens');
      }
      continue;
    }

    for (const rule of matched) for (const id of rule.tags) addTag(id, list.name);

    if (list.personal) {
      verdict.personal = personalLevel(matched);
      for (const rule of matched) reason(describe(rule));
      // Personal tags still carry the user's tag choices.
      for (const rule of matched) {
        const eff = tagOverride(rule, prefs);
        if (eff?.discard) discard = true;
        if (eff) score += eff.boost;
        if (eff?.highlight) highlight ??= eff.highlight;
      }
      continue;
    }

    // Goggles precedence inside one list: discard > boost > downrank.
    let listDiscard = false;
    let up = 0;
    let down = 0;
    for (const rule of matched) {
      const eff = tagOverride(rule, prefs) ?? { discard: rule.discard, boost: rule.pin ? MAX_LIST_BOOST : rule.boost };
      if (eff.highlight) highlight ??= eff.highlight;
      if (eff.discard) listDiscard = true;
      else if (eff.boost > 0) up = Math.max(up, eff.boost);
      else if (eff.boost < 0) down = Math.min(down, eff.boost);
      reason(describe(rule));
    }
    if (listDiscard) discard = true;
    else score += up > 0 ? up : down;
  }

  verdict.highlight = highlight;

  switch (verdict.personal) {
    case 'hide':
      verdict.hidden = true;
      verdict.level = 'hide';
      verdict.score = 0;
      return verdict;
    case 'pin':
      verdict.level = 'pin';
      verdict.score = PIN_SCORE;
      return verdict;
    case 'allow':
      verdict.score = 0;
      verdict.level = 'normal';
      return verdict;
    case 'raise':
      verdict.score = PERSONAL_STRENGTH;
      verdict.level = 'raise';
      return verdict;
    case 'lower':
      verdict.score = -PERSONAL_STRENGTH;
      verdict.level = 'lower';
      return verdict;
  }

  verdict.hidden = discard;
  verdict.score = discard ? 0 : score;
  verdict.level = discard ? 'hide' : score > 0 ? 'raise' : score < 0 ? 'lower' : 'normal';
  return verdict;
}

/** Every tag known to the given lists, first definition wins, with user overrides applied. */
export function collectTags(lists: CompiledList[], prefs: Record<string, TagPref> = {}): Map<string, TagDef> {
  const out = new Map<string, TagDef>();
  for (const list of lists) {
    for (const tag of list.tags) if (!out.has(tag.id)) out.set(tag.id, { ...tag });
  }
  for (const [id, pref] of Object.entries(prefs)) {
    const tag = out.get(id);
    if (!tag) continue;
    if (pref.color) tag.color = pref.color;
    if (pref.label) tag.label = pref.label;
  }
  return out;
}
