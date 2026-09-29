import { andList } from './dom';
import { hostSuffixes } from './domain';
import { MAX_STRENGTH, type ParsedList, type Rule, type TagDef } from './listformat';
import { PERSONAL_NAME } from './personal';

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
const MAX_LIST_BOOST = MAX_STRENGTH;

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
  /** The rule that matched, as written in the list. Absent when a lens leaves the result out. */
  rule?: { line: number; raw: string };
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
  /** Why a hidden result is hidden: your list, a tag you chose to hide, a list, or a lens. */
  hiddenBy?: { kind: 'personal' | 'tag' | 'list' | 'lens'; name: string };
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

/** A rule as a plain sentence fragment: "raises it by 5 and tags it “Great tutorial”". */
function describe(rule: Rule, tagLabel: (id: string) => string): string {
  const parts: string[] = [];
  if (rule.pin) parts.push('pins it');
  if (rule.allow) parts.push('keeps it at normal');
  if (rule.discard) parts.push('hides it');
  if (rule.boost > 0) parts.push(`raises it by ${rule.boost}`);
  if (rule.boost < 0) parts.push(`lowers it by ${-rule.boost}`);
  if (rule.tags.length) parts.push(`tags it ${rule.tags.map((t) => `“${tagLabel(t)}”`).join(', ')}`);
  return parts.length ? andList(parts) : 'mentions it';
}

type Effect = { discard: boolean; boost: number; highlight?: string; tag?: string };

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
      return { discard: true, boost: 0, tag };
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
  const hide = (by: NonNullable<Verdict['hiddenBy']>) => {
    discard = true;
    verdict.hiddenBy ??= by;
  };

  for (const list of lists) {
    const matched = matchList(list, t);
    const reason = (text: string, rule?: Rule) =>
      verdict.reasons.push({
        list: list.name,
        listId: list.id,
        personal: list.personal,
        text,
        rule: rule && { line: rule.line, raw: rule.raw },
      });
    const label = (id: string) => list.tags.find((t) => t.id === id)?.label ?? id;

    if (!matched.length) {
      if (list.lens) {
        hide({ kind: 'lens', name: list.name });
        reason('doesn’t include it, so it’s hidden');
      }
      continue;
    }

    for (const rule of matched) for (const id of rule.tags) addTag(id, list.name);

    if (list.personal) {
      verdict.personal = personalLevel(matched);
      for (const rule of matched) reason(describe(rule, label), rule);
      // Personal tags still carry the user's tag choices.
      for (const rule of matched) {
        const eff = tagOverride(rule, prefs);
        if (eff?.discard) hide({ kind: 'tag', name: eff.tag ?? '' });
        if (eff) score += eff.boost;
        if (eff?.highlight) highlight ??= eff.highlight;
      }
      continue;
    }

    // Goggles precedence inside one list: discard > boost > downrank.
    let listDiscard: NonNullable<Verdict['hiddenBy']> | undefined;
    let up = 0;
    let down = 0;
    for (const rule of matched) {
      const eff = tagOverride(rule, prefs) ?? { discard: rule.discard, boost: rule.pin ? MAX_LIST_BOOST : rule.boost };
      if (eff.highlight) highlight ??= eff.highlight;
      if (eff.discard) listDiscard ??= eff.tag ? { kind: 'tag', name: eff.tag } : { kind: 'list', name: list.name };
      else if (eff.boost > 0) up = Math.max(up, eff.boost);
      else if (eff.boost < 0) down = Math.min(down, eff.boost);
      reason(describe(rule, label), rule);
    }
    if (listDiscard) hide(listDiscard);
    else score += up > 0 ? up : down;
  }

  verdict.highlight = highlight;

  // An explicit personal level decides everything except the tags shown.
  if (verdict.personal) {
    const p = verdict.personal;
    verdict.hidden = p === 'hide';
    verdict.hiddenBy = p === 'hide' ? { kind: 'personal', name: personalName(lists) } : undefined;
    verdict.level = p === 'allow' ? 'normal' : p;
    verdict.score = p === 'pin' ? PIN_SCORE : p === 'raise' ? PERSONAL_STRENGTH : p === 'lower' ? -PERSONAL_STRENGTH : 0;
    return verdict;
  }

  verdict.hidden = discard;
  if (!discard) verdict.hiddenBy = undefined;
  verdict.score = discard ? 0 : score;
  verdict.level = discard ? 'hide' : score > 0 ? 'raise' : score < 0 ? 'lower' : 'normal';
  return verdict;
}

function personalName(lists: CompiledList[]): string {
  return lists.find((l) => l.personal)?.name ?? PERSONAL_NAME;
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
