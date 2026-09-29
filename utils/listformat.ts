import { normalizeDomain, normalizeHostname } from './domain';

// Parser for the list files Anubis can subscribe to. It reads:
//
//   - Anubis lists: Brave Goggles syntax plus `tag=` / `pin` / `allow` options and
//     `! tag:` definitions. See docs/list-format.md.
//   - Brave Goggles, as published on GitHub/GitLab.
//   - uBlacklist rulesets (match patterns, /regex/, @unblock, @N highlight).
//   - Plain domain lists, one domain per line.
//
// The personal list is stored in the same text format, so anything a user builds
// can be published as-is.

export type ListFormat = 'anubis' | 'goggle' | 'ublacklist' | 'domains';
export type RuleTarget = 'url' | 'title' | 'description';

export interface TagDef {
  /** Lowercase slug shared across lists, e.g. "docs". Lists that use the same id add to the same tag. */
  id: string;
  label: string;
  color: string;
  description?: string;
}

export interface ListMeta {
  name?: string;
  description?: string;
  author?: string;
  homepage?: string;
  issues?: string;
  license?: string;
  avatar?: string;
  version?: string;
  /** Suggested update interval in hours (from `! expires: 2 days`). */
  expiresHours?: number;
}

export interface Rule {
  line: number;
  raw: string;
  /** Matches this domain and its subdomains. */
  site?: string;
  /** Matches exactly this host (uBlacklist `*://example.com/*`). */
  host?: string;
  /** Tested against the target (URL, title, or description). */
  pattern?: RegExp;
  /** Tested against the URL's path + query (uBlacklist match pattern paths). */
  pathPattern?: RegExp;
  target: RuleTarget;
  /** Positive boosts, negative downranks, 0 leaves the ranking alone. */
  boost: number;
  discard: boolean;
  pin: boolean;
  allow: boolean;
  tags: string[];
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParsedList {
  format: ListFormat;
  meta: ListMeta;
  tags: TagDef[];
  rules: Rule[];
  /** The list has a generic `$discard`: results it doesn't mention are discarded (Goggles semantics). */
  lens: boolean;
  errors: ParseError[];
}

export const MAX_STRENGTH = 10;
const TAG_ID = /^[a-z0-9][a-z0-9-]{0,31}$/;
const META_KEYS = new Set([
  'name',
  'description',
  'author',
  'homepage',
  'issues',
  'license',
  'avatar',
  'version',
  'expires',
  'public',
  'transferred_to',
  'title',
]);

// Tag colours for tags that don't pick one: the pigments of Egyptian painting,
// muted enough to sit quietly on light and dark search pages.
export const TAG_PALETTE = [
  '#c8962e', // yellow ochre
  '#b5452e', // red ochre
  '#3a8a67', // malachite
  '#2f5fae', // Egyptian blue
  '#7a5aa6', // amethyst
  '#2b9aa0', // turquoise
  '#7f8f3a', // papyrus
  '#8c6a4f', // umber
];

export function colorForTag(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length]!;
}

export function normalizeColor(input: string | undefined): string | undefined {
  const s = input?.trim();
  if (!s) return undefined;
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    return ('#' + [...s.slice(1)].map((c) => c + c).join('')).toLowerCase();
  }
  return undefined;
}

export function slugifyTag(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

/** `! tag: id | Label | #color | Description` */
export function parseTagDef(value: string): TagDef | undefined {
  const [idRaw = '', label, color, ...desc] = value.split('|').map((s) => s.trim());
  const id = idRaw.toLowerCase();
  if (!TAG_ID.test(id)) return undefined;
  return {
    id,
    label: label || id,
    color: normalizeColor(color) ?? colorForTag(id),
    description: desc.join(' | ') || undefined,
  };
}

export function formatTagDef(tag: TagDef): string {
  const parts = [tag.id, tag.label, tag.color];
  if (tag.description) parts.push(tag.description);
  return `! tag: ${parts.join(' | ')}`;
}

function parseExpires(value: string): number | undefined {
  const m = /^(\d+)\s*(h|hours?|d|days?)?/i.exec(value.trim());
  if (!m) return undefined;
  const n = Number(m[1]);
  return m[2]?.toLowerCase().startsWith('h') ? n : n * 24;
}

/** The URL if it is http(s), else undefined. List metadata is untrusted. */
export function safeWebUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function setMeta(meta: ListMeta, key: string, value: string) {
  switch (key) {
    case 'name':
    case 'title':
      meta.name = value;
      break;
    case 'avatar':
      meta.avatar = normalizeColor(value) ?? meta.avatar;
      break;
    case 'expires':
      meta.expiresHours = parseExpires(value);
      break;
    case 'homepage':
    case 'issues':
      // These become links, so anything but a web address (javascript:, data:…) is dropped.
      meta[key] = safeWebUrl(value);
      break;
    case 'description':
    case 'author':
    case 'license':
    case 'version':
      meta[key] = value;
      break;
  }
}

// ---------------------------------------------------------------------------
// Format detection

export function detectFormat(lines: string[]): ListFormat {
  let goggle = 0;
  let anubis = 0;
  let ublacklist = 0;
  let domains = 0;
  let seen = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (++seen > 300) break;
    if (/^!\s*tag\s*:/i.test(line)) anubis++;
    else if (line.startsWith('!')) goggle++;
    else if (line === '---' || line.startsWith('#')) ublacklist++;
    else if (/\$([a-z]+(=[^,]*)?)(,[a-z]+(=[^,]*)?)*$/i.test(line)) {
      goggle++;
      if (/[$,](tag=|pin\b|allow\b)/.test(line)) anubis++;
    } else if (/^@?\d*(\*|https?|ftp|wss?):\/\//.test(line)) ublacklist++;
    else if (normalizeDomain(line) === normalizeHostname(line)) domains++;
  }
  if (anubis) return 'anubis';
  if (goggle && goggle >= ublacklist) return 'goggle';
  if (ublacklist) return 'ublacklist';
  if (domains) return 'domains';
  return 'goggle';
}

// ---------------------------------------------------------------------------
// Parsing

function emptyRule(line: number, raw: string): Rule {
  return { line, raw, target: 'url', boost: 0, discard: false, pin: false, allow: false, tags: [] };
}

export function parseList(text: string): ParsedList {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const format = detectFormat(lines);
  const list: ParsedList = { format, meta: {}, tags: [], rules: [], lens: false, errors: [] };
  const tagIds = new Set<string>();

  let inFrontmatter = false;
  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.trim();
    if (!line) return;

    // uBlacklist YAML front matter: only `key: value` pairs are read.
    if (format === 'ublacklist' && line === '---' && (inFrontmatter || list.rules.length === 0)) {
      inFrontmatter = !inFrontmatter;
      return;
    }
    if (inFrontmatter) {
      const m = /^([a-z_]+)\s*:\s*(.*)$/i.exec(line);
      if (m) setMeta(list.meta, m[1]!.toLowerCase(), m[2]!.replace(/^["']|["']$/g, ''));
      return;
    }

    if (line.startsWith('!')) {
      const m = /^!\s*([a-z_]+)\s*:\s*(.*)$/i.exec(line);
      if (!m) return; // comment
      const key = m[1]!.toLowerCase();
      const value = m[2]!;
      if (key === 'tag') {
        const tag = parseTagDef(value);
        if (!tag) list.errors.push({ line: lineNo, message: `Bad tag definition: ${value}` });
        else if (!tagIds.has(tag.id)) {
          tagIds.add(tag.id);
          list.tags.push(tag);
        }
      } else if (META_KEYS.has(key)) setMeta(list.meta, key, value.trim());
      return;
    }
    if (line.startsWith('#')) return;

    const result =
      format === 'ublacklist'
        ? parseUblacklistLine(line, lineNo)
        : format === 'domains'
          ? parseDomainLine(line, lineNo)
          : parseGoggleLine(line, lineNo);

    if (result === 'lens') list.lens = true;
    else if (typeof result === 'string') list.errors.push({ line: lineNo, message: result });
    else list.rules.push(result);
  });

  // Tags used by rules but never defined get a generated definition.
  for (const rule of list.rules) {
    for (const id of rule.tags) {
      if (tagIds.has(id)) continue;
      tagIds.add(id);
      list.tags.push({ id, label: id, color: colorForTag(id) });
    }
  }
  return list;
}

/** Goggles/Anubis instruction: `pattern$option,option=value`. */
export function parseGoggleLine(line: string, lineNo: number): Rule | 'lens' | string {
  if (line.length > 500) return 'Instruction is longer than 500 characters';
  const rule = emptyRule(lineNo, line);

  let pattern = line;
  let options = '';
  const dollar = line.lastIndexOf('$');
  if (dollar !== -1 && /^[a-z_]+(=[^,]*)?(,[a-z_]+(=[^,]*)?)*$/i.test(line.slice(dollar + 1))) {
    pattern = line.slice(0, dollar);
    options = line.slice(dollar + 1);
  }

  let hasAction = false;
  for (const opt of options ? options.split(',') : []) {
    const eq = opt.indexOf('=');
    const key = (eq === -1 ? opt : opt.slice(0, eq)).trim().toLowerCase();
    const value = eq === -1 ? undefined : opt.slice(eq + 1).trim();
    switch (key) {
      case 'site': {
        const site = normalizeDomain(value ?? '');
        // Goggles allow bare TLDs like `site=rs`.
        const tld = /^[a-z]{2,63}$/.test(value ?? '') ? value : undefined;
        if (!site && !tld) return `Bad site: ${value}`;
        rule.site = site || tld;
        break;
      }
      case 'boost':
      case 'downrank': {
        const n = value === undefined ? 1 : Number(value);
        if (!Number.isInteger(n) || n < 1 || n > MAX_STRENGTH) return `${key} must be 1–${MAX_STRENGTH}`;
        rule.boost = key === 'boost' ? n : -n;
        hasAction = true;
        break;
      }
      case 'discard':
        rule.discard = true;
        hasAction = true;
        break;
      case 'pin':
        rule.pin = true;
        hasAction = true;
        break;
      case 'allow':
        rule.allow = true;
        hasAction = true;
        break;
      case 'tag': {
        const id = (value ?? '').toLowerCase();
        if (!TAG_ID.test(id)) return `Bad tag id: ${value}`;
        if (!rule.tags.includes(id)) rule.tags.push(id);
        break;
      }
      case 'inurl':
        rule.target = 'url';
        break;
      case 'intitle':
        rule.target = 'title';
        break;
      case 'indescription':
      case 'incontent':
        rule.target = 'description';
        break;
      default:
        return `Unknown option: ${key}`;
    }
  }

  if (pattern) {
    const compiled = compileGogglePattern(pattern);
    if (typeof compiled === 'string') return compiled;
    rule.pattern = compiled;
  }

  if (!rule.site && !rule.pattern) {
    // A bare `$discard` turns the list into a lens: everything else is discarded.
    if (rule.discard && !rule.tags.length) return 'lens';
    return 'Instruction needs a pattern or a site';
  }

  // Goggles: an instruction without an action boosts.
  if (!hasAction && !rule.tags.length) rule.boost = 1;
  return rule;
}

/** Goggles URL pattern → RegExp. `*` = anything, `^` = separator or end, `|` = anchor. */
export function compileGogglePattern(pattern: string): RegExp | string {
  let p = pattern;
  let start = false;
  let end = false;
  if (p.startsWith('|')) {
    start = true;
    p = p.slice(1);
  }
  if (p.endsWith('|')) {
    end = true;
    p = p.slice(0, -1);
  }
  if (!p) return 'Empty pattern';
  if ((p.match(/\*/g)?.length ?? 0) > 2) return 'At most 2 wildcards (*) per instruction';
  if ((p.match(/\^/g)?.length ?? 0) > 2) return 'At most 2 separators (^) per instruction';
  let re = '';
  for (const ch of p) {
    if (ch === '*') re += '.*';
    else if (ch === '^') re += '(?:[^\\w.%-]|$)';
    else re += ch.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  }
  return new RegExp((start ? '^' : '') + re + (end ? '$' : ''), 'i');
}

/** Longest `/regex/` a list may use. The longest in the directory's lists is under 100 characters. */
const MAX_REGEX = 1000;

/**
 * Whether a regular expression repeats a group that repeats something inside, like
 * `(a+)+` or `(\w+\s?)*`. On the wrong address those backtrack for seconds, and
 * rules run on every result of every search, in the page. Judged by structure
 * alone, so it also turns down a few safe patterns like `([a-z]+\.)*`; none of
 * the directory's lists uses a repeated group at all.
 */
export function nestedRepeat(source: string): boolean {
  // For each open group: whether something inside it repeats.
  const groups: boolean[] = [];
  // Whether the atom just read is a group with a repeat inside.
  let afterRepeatingGroup = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!;
    if (ch === '\\') {
      i++;
    } else if (ch === '[') {
      // A character class: skip to its end, minding escapes and a leading ].
      i++;
      if (source[i] === '^') i++;
      if (source[i] === ']') i++;
      while (i < source.length && source[i] !== ']') i += source[i] === '\\' ? 2 : 1;
    } else if (ch === '(') {
      groups.push(false);
      // (?:…), (?=…), (?<name>…): that ? isn't a quantifier.
      if (source[i + 1] === '?') i++;
    } else if (ch === ')') {
      const inner = groups.pop() ?? false;
      if (inner && groups.length) groups[groups.length - 1] = true;
      afterRepeatingGroup = inner;
      continue;
    } else {
      // A quantifier: *, +, and {n,} or {n,m} repeat; ? and {n} don't.
      const range = ch === '{' ? /^\{(\d+)(,(\d*))?\}/.exec(source.slice(i)) : null;
      const repeats = ch === '*' || ch === '+' || (!!range && range[2] !== undefined && (range[3] === '' || Number(range[3]) > Number(range[1])));
      if (repeats && afterRepeatingGroup) return true;
      if (repeats && groups.length) groups[groups.length - 1] = true;
      if (range) i += range[0].length - 1;
      // A lazy quantifier's ?.
      if ((repeats || ch === '?' || range) && source[i + 1] === '?') i++;
    }
    afterRepeatingGroup = false;
  }
  return false;
}

/** uBlacklist: match patterns, /regex/, `@` unblock and `@N` highlight prefixes. */
export function parseUblacklistLine(input: string, lineNo: number): Rule | string {
  // Trailing comments: "rule # comment"
  const line = input.replace(/\s+#.*$/, '').trim();
  const rule = emptyRule(lineNo, input);

  let body = line;
  const prefix = /^@(\d*)/.exec(line);
  if (prefix) {
    body = line.slice(prefix[0].length);
    if (prefix[1]) {
      const slot = prefix[1];
      rule.tags.push(`highlight-${slot}`);
    } else rule.allow = true;
  } else rule.discard = true;

  if (/\s@if\(/.test(body)) return '@if guards are not supported yet';

  const regex = /^\/(.+)\/([a-z]*)$/i.exec(body);
  if (regex) {
    if (regex[1]!.length > MAX_REGEX) return `Regular expression is longer than ${MAX_REGEX} characters`;
    if (nestedRepeat(regex[1]!)) return `Regular expression could freeze search pages (a repeated group repeats inside): ${body}`;
    try {
      rule.pattern = new RegExp(regex[1]!, regex[2]!.replace(/[^imsu]/g, ''));
    } catch {
      return `Bad regular expression: ${body}`;
    }
    return rule;
  }

  const mp = /^(\*|https?|ftp|wss?):\/\/([^/]+)(\/.*)$/i.exec(body);
  if (!mp) return `Unsupported rule: ${body}`;
  const hostPart = mp[2]!;
  const path = mp[3]!;
  if (hostPart === '*') {
    // Matches every host: keep only the path part.
  } else if (hostPart.startsWith('*.')) {
    const site = normalizeDomain(hostPart.slice(2));
    if (!site) return `Bad host: ${hostPart}`;
    rule.site = site;
  } else {
    if (hostPart.includes('*')) return `Bad host: ${hostPart}`;
    rule.host = hostPart.toLowerCase().replace(/:\d+$/, '');
  }
  if (path !== '/*') {
    const re = path
      .split('*')
      .map((s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
      .join('.*');
    rule.pathPattern = new RegExp(`^${re}$`, 'i');
  }
  if (!rule.site && !rule.host && !rule.pathPattern) return 'Rule matches everything';
  return rule;
}

/** Plain domain lists: every line is a site to discard. Hosts-file lines are accepted too. */
export function parseDomainLine(line: string, lineNo: number): Rule | string {
  const bare = line.replace(/^(0\.0\.0\.0|127\.0\.0\.1)\s+/, '').split(/\s/)[0] ?? '';
  const site = normalizeDomain(bare);
  if (!site) return `Not a domain: ${line}`;
  return { ...emptyRule(lineNo, line), site, discard: true };
}
