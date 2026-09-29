import { colorForTag, parseList, type TagDef } from './listformat';
import { formatSiteLine, listSites, listTagDefs, setSites, upsertTagDef, type PersonalLevel } from './personal';

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

type SiteChange = { level: PersonalLevel; tags: string[] };

/**
 * Gathers the imported sites, merged with what the personal list already says,
 * then writes them in one pass: a list of thousands of sites (a big Goggle) took
 * half a minute when each site rewrote the whole list.
 */
function importer(personalText: string) {
  const existing = new Map(listSites(personalText).map((e) => [e.site, e]));
  const sites = new Map<string, SiteChange>();
  const tags = new Map<string, TagDef>();
  const counts = { added: 0, updated: 0 };
  return {
    counts,
    merge(site: string, level: PersonalLevel, siteTags: string[]) {
      const pending = sites.get(site);
      // A site this import already set to plain normal has no line left.
      const entry = pending ? (formatSiteLine(site, pending.level, pending.tags) ? pending : undefined) : existing.get(site);
      if (entry) counts.updated++;
      else counts.added++;
      const nextLevel = level === 'normal' ? (entry?.level ?? 'normal') : level;
      sites.set(site, { level: nextLevel, tags: [...new Set([...(entry?.tags ?? []), ...siteTags])] });
    },
    defineTags(defs: TagDef[]) {
      for (const tag of defs) if (!tags.has(tag.id)) tags.set(tag.id, tag);
    },
    text(): string {
      const known = new Set(listTagDefs(personalText).map((t) => t.id));
      let text = personalText;
      for (const tag of tags.values()) if (!known.has(tag.id)) text = upsertTagDef(text, tag);
      return setSites(text, sites);
    },
  };
}

export function importIntoPersonal(personalText: string, input: string): ImportResult {
  const into = importer(personalText);
  const { counts } = into;
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
      const highlightTags = new Set<string>();
      let skipped = 0;
      for (const e of data) {
        const site = (e.domainName ?? '').trim().toLowerCase().replace(/^www\./, '');
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(site)) {
          skipped++;
          continue;
        }
        if (e.display === 'FULL_HIDE') into.merge(site, 'hide', []);
        else if (e.display === 'PARTIAL_HIDE') into.merge(site, 'lower', []);
        else {
          const slot = /^COLOR_(\d)$/.exec(e.color ?? '')?.[1] ?? '1';
          const id = `highlight-${slot}`;
          highlightTags.add(id);
          into.defineTags([{ id, label: `Highlight ${slot}`, color: HOHSER_COLORS[`COLOR_${slot}`] ?? colorForTag(id) }]);
          into.merge(site, 'normal', [id]);
        }
      }
      return { text: into.text(), source: 'hohser', ...counts, skipped, highlightTags: [...highlightTags] };
    }
  }

  const parsed = parseList(input);
  const used = new Set(parsed.rules.flatMap((r) => r.tags));
  into.defineTags(parsed.tags.filter((t) => used.has(t.id)));
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
    into.merge(site.replace(/^www\./, ''), level, rule.tags);
  }
  return { text: into.text(), source: parsed.format, ...counts, skipped, highlightTags: [...highlightTags] };
}
