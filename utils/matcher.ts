import { andList } from './dom';
import { hostSuffixes, normalizeHostname } from './domain';
import { t, tJoin, tn } from './i18n';
import { MAX_STRENGTH, parseDeferred, type DeferredRule, type ParsedList, type Rule, type TagDef } from './listformat';
import { displayLevel, PERSONAL_NAME } from './personal';

// Turns parsed lists into lookup tables and weighs search results against them.
//
// Precedence, from strongest to weakest:
//   1. The personal list (pin / raise / lower / hide / allow for a site).
//   2. The user's per-tag choices ("hide everything tagged ai-slop"). Each tag counts
//      once, however many lists give it; Hide hides, and Raise and Lower add up, five
//      places each, so two raises and a lower make one raise. A rule carrying a tag
//      with a choice leaves the ranking to the choices.
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

/** How far the personal "raise"/"lower" levels move a result, in list positions. Also each Raise or Lower tag's pull. */
export const PERSONAL_STRENGTH = 5;
/** The `listId` of the reason that explains your tag choices, in the result menu's Why. */
export const TAG_CHOICES = 'tag-choices';
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
  /** Read through `siteRules` or `allSites`, which parse the deferred rules they need. */
  bySite: Map<string, Rule[]>;
  byHost: Map<string, Rule[]>;
  generic: Rule[];
  /** Rules for a site not parsed yet (`parseList(text, true)`), by site. */
  deferred: Map<string, DeferredRule | DeferredRule[]>;
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
    else if (rule.host) push(byHost, normalizeHostname(rule.host), rule);
    else generic.push(rule);
  }
  // Most sites have one rule, kept without an array.
  const deferred = new Map<string, DeferredRule | DeferredRule[]>();
  for (const d of parsed.deferred ?? []) {
    const known = deferred.get(d.site);
    if (!known) deferred.set(d.site, d);
    else if (Array.isArray(known)) known.push(d);
    else deferred.set(d.site, [known, d]);
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
    deferred,
  };
}

/** The list's rules for exactly this site, in line order, parsing any it deferred. */
export function siteRules(list: CompiledList, site: string): Rule[] {
  const later = list.deferred.get(site);
  if (later) {
    list.deferred.delete(site);
    const parsed: Rule[] = [];
    for (const d of Array.isArray(later) ? later : [later]) {
      const rule = parseDeferred(d);
      if (typeof rule !== 'string') parsed.push(rule);
    }
    if (parsed.length) list.bySite.set(site, [...(list.bySite.get(site) ?? []), ...parsed].sort((a, b) => a.line - b.line));
  }
  return list.bySite.get(site) ?? [];
}

/** Every site's rules, all parsed: for going through a whole list. */
export function allSites(list: CompiledList): Map<string, Rule[]> {
  for (const site of [...list.deferred.keys()]) siteRules(list, site);
  return list.bySite;
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
  /** What the list does to the result, in the interface's language: "raises it by 3". */
  text: string;
  /** The same in English, for an issue sent to the list's maintainers. */
  report: string;
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
      host: normalizeHostname(u.hostname),
      path: u.pathname + u.search,
      title: result.title ?? '',
      description: result.description ?? '',
    };
  } catch {
    return undefined;
  }
}

function ruleMatches(rule: Rule, target: Target): boolean {
  if (rule.pathPattern && !rule.pathPattern.test(target.path)) return false;
  if (rule.pattern) {
    const subject = rule.target === 'title' ? target.title : rule.target === 'description' ? target.description : target.url;
    if (!rule.pattern.test(subject)) return false;
  }
  return true;
}

/** Every rule in the list that matches, most specific site first. */
export function matchList(list: CompiledList, target: Target): Rule[] {
  const out: Rule[] = [];
  for (const rule of list.byHost.get(target.host) ?? []) if (ruleMatches(rule, target)) out.push(rule);
  for (const suffix of hostSuffixes(target.host)) {
    for (const rule of siteRules(list, suffix)) if (ruleMatches(rule, target)) out.push(rule);
  }
  for (const rule of list.generic) if (ruleMatches(rule, target)) out.push(rule);
  return out;
}

/** The words a list's reasons are told in. */
interface ReasonWords {
  pin: string;
  allow: string;
  hide: string;
  raise: (n: number) => string;
  lower: (n: number) => string;
  tags: (labels: string[]) => string;
  none: string;
  lens: string;
  join: (parts: string[]) => string;
}

const localWords = (): ReasonWords => ({
  pin: t('reasonPins'),
  allow: t('reasonKeepsNormal'),
  hide: t('reasonHides'),
  raise: (n) => t('reasonRaises', n),
  lower: (n) => t('reasonLowers', n),
  tags: (labels) => t('reasonTags', tJoin(labels.map((l) => t('quoted', l)))),
  none: t('reasonMentions'),
  lens: t('reasonLens'),
  join: (parts) => tJoin(parts),
});

// English on purpose: issues go to a list's maintainers in English, whatever the interface language.
const REPORT_WORDS: ReasonWords = {
  pin: 'pins it',
  allow: 'keeps it at normal',
  hide: 'hides it',
  raise: (n) => `raises it by ${n}`,
  lower: (n) => `lowers it by ${n}`,
  tags: (labels) => `tags it ${andList(labels.map((l) => `“${l}”`))}`,
  none: 'mentions it',
  lens: 'doesn’t include it, so it’s hidden',
  join: andList,
};

/** A rule as a plain sentence fragment: "raises it by 5 and tags it “Great tutorial”". */
function describe(rule: Rule, tagLabel: (id: string) => string, words: ReasonWords): string {
  const parts: string[] = [];
  if (rule.pin) parts.push(words.pin);
  if (rule.allow) parts.push(words.allow);
  if (rule.discard) parts.push(words.hide);
  if (rule.boost > 0) parts.push(words.raise(rule.boost));
  if (rule.boost < 0) parts.push(words.lower(-rule.boost));
  if (rule.tags.length) parts.push(words.tags(rule.tags.map(tagLabel)));
  return parts.length ? words.join(parts) : words.none;
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
  const target = toTarget(result);
  if (!target) return verdict;
  const words = localWords();

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

  // Your tag choices, each tag once however many lists give it. Returns whether the
  // rule carries a tag with a choice, which then decides instead of the rule.
  const chosen = new Map<string, TagAction>();
  const applyChoices = (rule: Rule): boolean => {
    let decides = false;
    for (const id of rule.tags) {
      const action = prefs[id]?.action ?? 'list';
      if (action === 'list') continue;
      decides = true;
      if (chosen.has(id)) continue;
      chosen.set(id, action);
      if (action === 'hide') hide({ kind: 'tag', name: id });
      else if (action === 'raise') score += PERSONAL_STRENGTH;
      else if (action === 'lower') score -= PERSONAL_STRENGTH;
      else if (action === 'highlight') highlight ??= id;
    }
    return decides;
  };

  for (const list of lists) {
    const matched = matchList(list, target);
    const reason = (text: string, report: string, rule?: Rule) =>
      verdict.reasons.push({
        list: list.name,
        listId: list.id,
        personal: list.personal,
        text,
        report,
        rule: rule && { line: rule.line, raw: rule.raw },
      });
    const label = (id: string) => list.tags.find((tag) => tag.id === id)?.label ?? id;

    if (!matched.length) {
      if (list.lens) {
        hide({ kind: 'lens', name: list.name });
        reason(words.lens, REPORT_WORDS.lens);
      }
      continue;
    }

    for (const rule of matched) for (const id of rule.tags) addTag(id, list.name);

    if (list.personal) {
      verdict.personal = personalLevel(matched);
      for (const rule of matched) reason(describe(rule, label, words), describe(rule, label, REPORT_WORDS), rule);
      // Personal tags still carry the user's tag choices.
      for (const rule of matched) applyChoices(rule);
      continue;
    }

    // Goggles precedence inside one list: discard > boost > downrank.
    let listDiscard = false;
    let up = 0;
    let down = 0;
    for (const rule of matched) {
      reason(describe(rule, label, words), describe(rule, label, REPORT_WORDS), rule);
      if (applyChoices(rule)) continue;
      const boost = rule.pin ? MAX_LIST_BOOST : rule.boost;
      if (rule.discard) listDiscard = true;
      else if (boost > 0) up = Math.max(up, boost);
      else if (boost < 0) down = Math.min(down, boost);
    }
    if (listDiscard) hide({ kind: 'list', name: list.name });
    else score += up > 0 ? up : down;
  }

  verdict.highlight = highlight;

  // An explicit personal level decides everything except the tags shown.
  if (verdict.personal) {
    const p = verdict.personal;
    verdict.hidden = p === 'hide';
    verdict.hiddenBy = p === 'hide' ? { kind: 'personal', name: personalName(lists) } : undefined;
    verdict.level = displayLevel(p);
    verdict.score = p === 'pin' ? PIN_SCORE : p === 'raise' ? PERSONAL_STRENGTH : p === 'lower' ? -PERSONAL_STRENGTH : 0;
    return verdict;
  }

  const choices = describeChoices(chosen, (id) => prefs[id]?.label ?? tagLabel(lists, id));
  if (choices) verdict.reasons.push({ list: t('reasonYourTagSettings'), listId: TAG_CHOICES, personal: true, text: choices, report: choices });
  verdict.hidden = discard;
  if (!discard) verdict.hiddenBy = undefined;
  verdict.score = discard ? 0 : score;
  verdict.level = discard ? 'hide' : score > 0 ? 'raise' : score < 0 ? 'lower' : 'normal';
  return verdict;
}

/** A tag's name from the first list that declares one; a list that only uses the tag names it by its id. */
function tagLabel(lists: CompiledList[], id: string): string {
  for (const list of lists) {
    const tag = list.tags.find((d) => d.id === id && d.label !== id);
    if (tag) return tag.label;
  }
  return id;
}

/**
 * Your tag choices as a sentence fragment, for the result menu's Why: "raise it by
 * 5 for “Official docs” and “Reference” and lower it by 5 for “Paywalled”, so it
 * moves 5 places up". Undefined when no choice moves or hides the result.
 */
function describeChoices(chosen: Map<string, TagAction>, label: (id: string) => string): string | undefined {
  const ids = (action: TagAction) => [...chosen].filter(([, a]) => a === action).map(([id]) => t('quoted', label(id)));
  const hide = ids('hide');
  if (hide.length) return t('choiceHide', tJoin(hide));
  const raise = ids('raise');
  const lower = ids('lower');
  const parts: string[] = [];
  if (raise.length) parts.push(tn('choiceRaise', raise.length, PERSONAL_STRENGTH, tJoin(raise)));
  if (lower.length) parts.push(tn('choiceLower', lower.length, PERSONAL_STRENGTH, tJoin(lower)));
  if (!parts.length) return undefined;
  const moves = [...chosen.values()].filter((a) => a === 'raise' || a === 'lower');
  if (moves.length < 2) return parts[0];
  const net = moves.reduce((sum, a) => sum + (a === 'raise' ? PERSONAL_STRENGTH : -PERSONAL_STRENGTH), 0);
  const total = net > 0 ? tn('choiceNetUp', net) : net < 0 ? tn('choiceNetDown', -net) : t('choiceNetSame');
  return t('choiceTotal', tJoin(parts), total);
}

function personalName(lists: CompiledList[]): string {
  return lists.find((l) => l.personal)?.name ?? PERSONAL_NAME;
}

/** Every tag known to the given lists, first definition wins, with user overrides applied. */
export function collectTags(lists: CompiledList[], prefs: Record<string, TagPref> = {}): Map<string, TagDef> {
  const out = new Map<string, TagDef>();
  for (const list of lists) {
    for (const tag of list.tags) {
      const known = out.get(tag.id);
      // A defined tag beats a made-up one, whichever list comes first (yours is first).
      if (!known || (known.generated && !tag.generated)) out.set(tag.id, { ...tag });
    }
  }
  for (const tag of out.values()) delete tag.generated;
  for (const [id, pref] of Object.entries(prefs)) {
    const tag = out.get(id);
    if (!tag) continue;
    if (pref.color) tag.color = pref.color;
    if (pref.label) tag.label = pref.label;
  }
  return out;
}
