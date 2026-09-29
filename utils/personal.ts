import { formatTagDef, parseTagDef, type TagDef } from './listformat';
import type { Level } from './matcher';

// The personal list is stored as text in the Anubis list format, so it can be
// published unchanged. These helpers edit it line by line and leave comments and
// hand-written rules alone.

/** The personal list's id, and its name wherever Anubis shows it (a reason, a tag's source). */
export const PERSONAL_ID = 'personal';
export const PERSONAL_NAME = 'Your list';

export const PERSONAL_HEADER = `! name: My list
! description: Sites I've weighed myself.
! author: me
`;

export type PersonalLevel = Level | 'allow';

export interface SiteEntry {
  site: string;
  level: PersonalLevel;
  tags: string[];
  line: number;
}

// A "simple" site line: only options, one of which is site=. Anything with a URL
// pattern is treated as hand-written and never rewritten.
const SIMPLE_SITE_LINE = /^\$([a-z_]+(?:=[^,\s]*)?(?:,[a-z_]+(?:=[^,\s]*)?)*)$/i;

function parseSimpleLine(line: string): { site: string; level: PersonalLevel; tags: string[] } | undefined {
  const m = SIMPLE_SITE_LINE.exec(line.trim());
  if (!m) return undefined;
  let site = '';
  let level: PersonalLevel = 'normal';
  const tags: string[] = [];
  for (const opt of m[1]!.split(',')) {
    const [key, value] = opt.split('=') as [string, string | undefined];
    switch (key.toLowerCase()) {
      case 'site':
        site = (value ?? '').toLowerCase();
        break;
      case 'discard':
        level = 'hide';
        break;
      case 'pin':
        level = 'pin';
        break;
      case 'allow':
        level = 'allow';
        break;
      case 'boost':
        if (level === 'normal') level = 'raise';
        break;
      case 'downrank':
        if (level === 'normal') level = 'lower';
        break;
      case 'tag':
        if (value) tags.push(value.toLowerCase());
        break;
    }
  }
  return site ? { site, level, tags } : undefined;
}

export function formatSiteLine(site: string, level: PersonalLevel, tags: string[]): string | undefined {
  const opts = [`site=${site}`];
  if (level === 'hide') opts.push('discard');
  else if (level === 'pin') opts.push('pin');
  else if (level === 'allow') opts.push('allow');
  else if (level === 'raise') opts.push('boost=5');
  else if (level === 'lower') opts.push('downrank=5');
  for (const t of tags) opts.push(`tag=${t}`);
  if (level === 'normal' && !tags.length) return undefined;
  return `$${opts.join(',')}`;
}

/** Every simple site entry in the personal list, merged per site. */
export function listSites(text: string): SiteEntry[] {
  const bySite = new Map<string, SiteEntry>();
  text.split(/\r?\n/).forEach((line, i) => {
    const parsed = parseSimpleLine(line);
    if (!parsed) return;
    const prev = bySite.get(parsed.site);
    if (!prev) {
      bySite.set(parsed.site, { ...parsed, line: i + 1 });
      return;
    }
    if (parsed.level !== 'normal') prev.level = parsed.level;
    for (const t of parsed.tags) if (!prev.tags.includes(t)) prev.tags.push(t);
  });
  return [...bySite.values()];
}

export function getSite(text: string, site: string): SiteEntry | undefined {
  return listSites(text).find((e) => e.site === site);
}

/** Replace every simple line for `site` with one canonical line (or none). */
export function setSite(text: string, site: string, level: PersonalLevel, tags: string[]): string {
  return setSites(text, new Map([[site, { level, tags }]]));
}

/**
 * `setSite` for many sites in one pass over the text, so importing thousands of
 * sites doesn't re-read the list once per site. A site's line goes where its first
 * line was; new sites go at the end, in the order given.
 */
export function setSites(text: string, sites: Map<string, { level: PersonalLevel; tags: string[] }>): string {
  const line = (site: string) => {
    const { level, tags } = sites.get(site)!;
    return formatSiteLine(site, level, [...new Set(tags)]);
  };
  const placed = new Set<string>();
  const kept: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const site = parseSimpleLine(raw)?.site;
    if (site === undefined || !sites.has(site)) {
      kept.push(raw);
      continue;
    }
    if (placed.has(site)) continue;
    placed.add(site);
    const next = line(site);
    if (next) kept.push(next);
  }
  const added = [...sites.keys()].filter((site) => !placed.has(site)).flatMap((site) => line(site) ?? []);
  if (added.length) {
    while (kept.length && kept[kept.length - 1]!.trim() === '') kept.pop();
    kept.push(...added, '');
  }
  return kept.join('\n');
}

export function setSiteLevel(text: string, site: string, level: PersonalLevel): string {
  return setSite(text, site, level, getSite(text, site)?.tags ?? []);
}

export function toggleSiteTag(text: string, site: string, tag: string, on?: boolean): string {
  const entry = getSite(text, site);
  const tags = entry?.tags ?? [];
  const has = tags.includes(tag);
  const want = on ?? !has;
  if (want === has) return text;
  return setSite(text, site, entry?.level ?? 'normal', want ? [...tags, tag] : tags.filter((t) => t !== tag));
}

// ---------------------------------------------------------------------------
// Tag definitions (`! tag:` lines)

export function listTagDefs(text: string): TagDef[] {
  const out: TagDef[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^!\s*tag\s*:\s*(.*)$/i.exec(line.trim());
    const tag = m && parseTagDef(m[1]!);
    if (tag && !out.some((t) => t.id === tag.id)) out.push(tag);
  }
  return out;
}

export function upsertTagDef(text: string, tag: TagDef): string {
  const lines = text.split(/\r?\n/);
  const line = formatTagDef(tag);
  const idx = lines.findIndex((l) => {
    const m = /^!\s*tag\s*:\s*(.*)$/i.exec(l.trim());
    return m && parseTagDef(m[1]!)?.id === tag.id;
  });
  if (idx !== -1) {
    lines[idx] = line;
    return lines.join('\n');
  }
  // New tags go right after the header (the leading `!` lines) so the file keeps its shape.
  const bodyStart = lines.findIndex((l) => l.trim() && !l.trim().startsWith('!'));
  const header = bodyStart === -1 ? lines : lines.slice(0, bodyStart);
  let at = 0;
  header.forEach((l, i) => {
    if (l.trim().startsWith('!')) at = i + 1;
  });
  lines.splice(at, 0, line);
  return lines.join('\n');
}

/** Remove a tag definition and every use of it in simple site lines. */
export function removeTag(text: string, id: string): string {
  let next = text
    .split(/\r?\n/)
    .filter((l) => {
      const m = /^!\s*tag\s*:\s*(.*)$/i.exec(l.trim());
      return !(m && parseTagDef(m[1]!)?.id === id);
    })
    .join('\n');
  for (const entry of listSites(next)) {
    if (entry.tags.includes(id)) {
      next = setSite(
        next,
        entry.site,
        entry.level,
        entry.tags.filter((t) => t !== id),
      );
    }
  }
  return next;
}

/** Old versions stored a plain array of blocked domains. */
export function fromBlockedSites(domains: string[]): string {
  let text = PERSONAL_HEADER;
  for (const d of domains) text = setSite(text, d, 'hide', []);
  return text;
}
