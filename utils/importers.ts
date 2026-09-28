import { parseList, type TagDef } from './listformat';
import { getSite, listTagDefs, setSite, upsertTagDef, type PersonalLevel } from './personal';

// Bring sites over from the tools Anubis grew out of: uBlacklist rules, HOHSER's
// JSON export, a Brave Goggle, or a plain list of domains. Site-level entries are
// merged into the personal list; rules that need URL patterns are counted and left
// out, since subscribing to the original list keeps them working.

export interface ImportResult {
  text: string;
  source: 'hohser' | 'ublacklist' | 'goggle' | 'anubis' | 'domains';
  added: number;
  updated: number;
  skipped: number;
  /** Tags that should highlight results (HOHSER and uBlacklist highlight colours). */
  highlightTags: string[];
}

interface HohserEntry {
  domainName?: string;
  display?: string;
  color?: string;
}

const HOHSER_COLORS: Record<string, string> = {
  COLOR_1: '#f50057',
  COLOR_2: '#8bc34a',
  COLOR_3: '#03a9f4',
};

function isHohser(data: unknown): data is HohserEntry[] {
  return Array.isArray(data) && data.every((e) => e && typeof e === 'object' && typeof (e as HohserEntry).domainName === 'string');
}

function merge(
  text: string,
  site: string,
  level: PersonalLevel,
  tags: string[],
  counts: { added: number; updated: number },
): string {
  const entry = getSite(text, site);
  if (entry) counts.updated++;
  else counts.added++;
  const nextLevel = level === 'normal' ? (entry?.level ?? 'normal') : level;
  return setSite(text, site, nextLevel, [...new Set([...(entry?.tags ?? []), ...tags])]);
}

function defineTags(text: string, tags: TagDef[]): string {
  const known = new Set(listTagDefs(text).map((t) => t.id));
  let next = text;
  for (const tag of tags) if (!known.has(tag.id)) next = upsertTagDef(next, tag);
  return next;
}

export function importIntoPersonal(personalText: string, input: string): ImportResult {
  const counts = { added: 0, updated: 0 };
  const trimmed = input.trim();

  // HOHSER: [{ "domainName": "www.x.com", "display": "FULL_HIDE" | "PARTIAL_HIDE" | "HIGHLIGHT", "color": "COLOR_1" }]
  if (trimmed.startsWith('[')) {
    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch {
      data = undefined;
    }
    if (isHohser(data)) {
      let text = personalText;
      const highlightTags = new Set<string>();
      let skipped = 0;
      for (const e of data) {
        const site = (e.domainName ?? '').trim().toLowerCase().replace(/^www\./, '');
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(site)) {
          skipped++;
          continue;
        }
        if (e.display === 'FULL_HIDE') text = merge(text, site, 'hide', [], counts);
        else if (e.display === 'PARTIAL_HIDE') text = merge(text, site, 'lower', [], counts);
        else {
          const slot = /^COLOR_(\d)$/.exec(e.color ?? '')?.[1] ?? '1';
          const id = `highlight-${slot}`;
          highlightTags.add(id);
          text = defineTags(text, [{ id, label: `Highlight ${slot}`, color: HOHSER_COLORS[`COLOR_${slot}`] ?? '#c8962e' }]);
          text = merge(text, site, 'normal', [id], counts);
        }
      }
      return { text, source: 'hohser', ...counts, skipped, highlightTags: [...highlightTags] };
    }
  }

  const parsed = parseList(input);
  let text = defineTags(personalText, parsed.tags.filter((t) => parsed.rules.some((r) => r.tags.includes(t.id))));
  let skipped = parsed.errors.length;
  const highlightTags = new Set<string>();
  for (const rule of parsed.rules) {
    const site = rule.site ?? rule.host;
    // Only whole-site rules fit the personal list's simple lines.
    if (!site || rule.pattern || rule.pathPattern || !site.includes('.')) {
      skipped++;
      continue;
    }
    for (const t of rule.tags) if (/^highlight-\d+$/.test(t)) highlightTags.add(t);
    const level: PersonalLevel = rule.discard
      ? 'hide'
      : rule.pin
        ? 'pin'
        : rule.allow
          ? 'allow'
          : rule.boost > 0
            ? 'raise'
            : rule.boost < 0
              ? 'lower'
              : 'normal';
    text = merge(text, site.replace(/^www\./, ''), level, rule.tags, counts);
  }
  return { text, source: parsed.format, ...counts, skipped, highlightTags: [...highlightTags] };
}
