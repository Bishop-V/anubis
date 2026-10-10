import { parseTagDef } from './listformat';
import { formatSiteLine, listSites, parseSimpleLine } from './personal';

// Three-way merges for syncing through a server: `base` is what both sides had at
// the last sync, so what changed on this side and what changed on the other both
// survive. When both sides changed the same thing, `prefer` picks the winner.

export type Side = 'local' | 'remote';

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return (
    ka.length === kb.length &&
    ka.every((k) => Object.hasOwn(b, k) && deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
  );
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Objects merge key by key, all the way down; anything else is taken whole from one side. */
export function mergeValue<T>(base: T | undefined, local: T | undefined, remote: T | undefined, prefer: Side): T | undefined {
  if (deepEqual(local, remote)) return local;
  if (deepEqual(local, base)) return remote;
  if (deepEqual(remote, base)) return local;
  if (isRecord(local) && isRecord(remote)) {
    const b: Record<string, unknown> = isRecord(base) ? base : {};
    const out: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      const value = mergeValue(b[key], local[key], remote[key], prefer);
      if (value !== undefined) out[key] = value;
    }
    return out as T;
  }
  return prefer === 'local' ? local : remote;
}

/** Lists of things with ids (subscriptions), merged per id. This side's order, then new ones from the other. */
export function mergeById<T extends { id: string }>(base: T[], local: T[], remote: T[], prefer: Side): T[] {
  const byId = (list: T[]) => new Map(list.map((x) => [x.id, x]));
  const [b, l, r] = [byId(base), byId(local), byId(remote)];
  return [...new Set([...l.keys(), ...r.keys()])].flatMap((id) => mergeValue(b.get(id), l.get(id), r.get(id), prefer) ?? []);
}

// ---------------------------------------------------------------------------
// The personal list, merged line by line.
//
// Each line gets a key saying what it's about: a site (every simple line for it),
// a tag definition, a `! name:`-style header, or else the line itself. Lines with
// the same key on both sides are the same thing, whatever moved around them.

const TAG_LINE = /^!\s*tag\s*:\s*(.*)$/i;
const HEADER_LINE = /^!\s*([a-z][a-z-]*)\s*:/i;

function lineKey(line: string, seen: Map<string, number>): string {
  const trimmed = line.trim();
  const site = parseSimpleLine(trimmed)?.site;
  if (site) return `site:${site}`;
  const tag = TAG_LINE.exec(trimmed);
  const id = tag && parseTagDef(tag[1]!)?.id;
  if (id) return `tag:${id}`;
  const header = HEADER_LINE.exec(trimmed);
  if (header) return `header:${header[1]!.toLowerCase()}`;
  // Comments, blank lines, and hand-written rules: the line itself, counted, so two
  // blank lines stay two.
  const n = seen.get(line) ?? 0;
  seen.set(line, n + 1);
  return `line:${n}:${line}`;
}

function groupLines(text: string): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  const seen = new Map<string, number>();
  for (const line of text.split(/\r?\n/)) {
    const key = lineKey(line, seen);
    const group = groups.get(key);
    if (group) group.push(line);
    else groups.set(key, [line]);
  }
  return groups;
}

/** A site changed on both sides: its ranking from whichever side changed it, and tags added on either side. */
function mergeSite(site: string, base: string[] | undefined, local: string[] | undefined, remote: string[] | undefined, prefer: Side): string[] | undefined {
  const entry = (lines?: string[]) => (lines && listSites(lines.join('\n'))[0]) || { level: 'normal' as const, tags: [] as string[], description: undefined };
  const [b, l, r] = [entry(base), entry(local), entry(remote)];
  const level = l.level === b.level ? r.level : r.level === b.level ? l.level : (prefer === 'local' ? l : r).level;
  // A tag stays if both sides have it, or one side added it; removing it on either side removes it.
  const tags = [...new Set([...l.tags, ...r.tags])].filter((t) => (l.tags.includes(t) && r.tags.includes(t)) || !b.tags.includes(t));
  const description = l.description === r.description ? l.description : l.description === b.description ? r.description : r.description === b.description ? l.description : prefer === 'local' ? l.description : r.description;
  const line = formatSiteLine(site, level, tags, description);
  return line ? [line] : undefined;
}

function mergeGroup(key: string, base: string[] | undefined, local: string[] | undefined, remote: string[] | undefined, prefer: Side): string[] | undefined {
  const [b, l, r] = [base?.join('\n'), local?.join('\n'), remote?.join('\n')];
  if (l === r) return local;
  if (l === b) return remote;
  if (r === b) return local;
  if (key.startsWith('site:')) return mergeSite(key.slice(5), base, local, remote, prefer);
  return prefer === 'local' ? local : remote;
}

/**
 * The personal list with the changes from both sides. It keeps this side's order;
 * lines only the other side has go after the line they follow there, so a new tag
 * definition lands in the header and a new site among the sites.
 */
export function mergeLists(base: string, local: string, remote: string, prefer: Side): string {
  const [b, l, r] = [groupLines(base), groupLines(local), groupLines(remote)];
  const merged = new Map<string, string[]>();
  for (const key of new Set([...l.keys(), ...r.keys()])) {
    const lines = mergeGroup(key, b.get(key), l.get(key), r.get(key), prefer);
    if (lines) merged.set(key, lines);
  }
  // Each key only the other side has, filed under the key before it there
  // (undefined: the start of the list).
  const after = new Map<string | undefined, string[]>();
  let anchor: string | undefined;
  for (const key of r.keys()) {
    if (!l.has(key) && merged.has(key)) {
      if (!after.has(anchor)) after.set(anchor, []);
      after.get(anchor)!.push(key);
    }
    if (l.has(key) || merged.has(key)) anchor = key;
  }
  const out: string[] = [];
  const visit = (root: string | undefined) => {
    const stack: (string | undefined)[] = [root];
    while (stack.length) {
      const key = stack.pop();
      if (key !== undefined) out.push(...(merged.get(key) ?? []));
      stack.push(...[...(after.get(key) ?? [])].reverse());
    }
  };
  visit(undefined);
  for (const key of l.keys()) visit(key);
  return out.join('\n');
}
