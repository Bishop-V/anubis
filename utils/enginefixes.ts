import { storage } from '#imports';
import type { CleanupKind } from './cleanup';
import { ENGINES, engineFor, type CardDef, type EngineDef } from './engines';
import { fetchText } from './subscriptions';

// Fixes to the engine definitions in utils/engines.ts, downloaded from the repository,
// so a search engine that changes its page can be followed without waiting for a
// store review. They are data, not code: each one replaces a selector, or a button's
// offset, in the bundled definition of one engine, for a range of Anubis versions.
// Nothing here can add an engine, a site Anubis runs on, or a function. A fix is
// folded into utils/engines.ts in the next release, and its `until` ends it there.
// The file is engines/fixes.json; DEVELOPMENT.md, "Fixing an engine without a
// release", says how to write one.

export const ENGINE_FIXES_URL = 'https://raw.githubusercontent.com/Bishop-V/anubis/main/engines/fixes.json';

/** How often the fixes are downloaded, at most, and how long to wait after a failure. */
const FETCH_EVERY_MS = 6 * 3600_000;
const RETRY_AFTER_ERROR_MS = 3600_000;
/** The longest selector a fix may give: the longest bundled one is under 300 characters. */
const MAX_SELECTOR = 1000;

/** The parts of a definition a fix can change. */
export interface FixFields {
  heading?: string;
  boundary?: string;
  item?: string;
  link?: string;
  title?: string;
  displayed?: string;
  blocks?: string;
  ads?: string;
  cleanupSelectors?: Partial<Record<CleanupKind, string>>;
  /** The selector of the bundled kind of Load more results: `button`, `next`, or `form`. */
  more?: { button?: string; next?: string; form?: string };
  button?: { top?: string; right?: string };
  /** Bundled card kinds, by their place in `cards`. */
  cards?: Record<string, Partial<Pick<CardDef, 'item' | 'link' | 'title' | 'displayed'>>>;
}

export interface EngineFix {
  /** The engine's `id` in utils/engines.ts. */
  engine: string;
  /** The first Anubis version it's for, and the first it isn't, as `0.10.1`. */
  from?: string;
  until?: string;
  /** Changes to the definition, and to its phone layout (`mobile`). */
  set?: FixFields;
  mobile?: FixFields;
}

interface StoredFixes {
  fixes: EngineFix[];
  fetchedAt: number;
  errorAt?: number;
}

export const engineFixesItem = storage.defineItem<StoredFixes | null>('local:engineFixes', { fallback: null });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const SELECTOR_FIELDS = ['heading', 'boundary', 'item', 'link', 'title', 'displayed', 'blocks', 'ads'] as const;
const CARD_FIELDS = ['item', 'link', 'title', 'displayed'] as const;
const CLEANUP_KINDS: CleanupKind[] = ['ai', 'videos', 'questions', 'discussions', 'news', 'images', 'related', 'elsewhere', 'adRequests', 'ads'];
const VERSION = /^\d+(\.\d+){0,3}$/;
/** An offset as the bundled definitions write them: `0`, `4px`, `-28px`. */
const OFFSET = /^(0|-?\d{1,3}(\.\d+)?px)$/;

const selector = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() && v.length <= MAX_SELECTOR ? v : undefined);

/** Only the named string fields of an object, each passing `keep`. */
function pick<K extends string>(value: unknown, keys: readonly K[], keep: (v: unknown) => string | undefined): Partial<Record<K, string>> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Partial<Record<K, string>> = {};
  for (const key of keys) {
    const v = keep(value[key]);
    if (v !== undefined) out[key] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function readFields(value: unknown): FixFields | undefined {
  if (!isRecord(value)) return undefined;
  const out: FixFields = { ...pick(value, SELECTOR_FIELDS, selector) };
  const cleanup = pick(value.cleanupSelectors, CLEANUP_KINDS, selector);
  if (cleanup) out.cleanupSelectors = cleanup;
  const more = pick(value.more, ['button', 'next', 'form'], selector);
  if (more) out.more = more;
  const button = pick(value.button, ['top', 'right'], (v) => (typeof v === 'string' && OFFSET.test(v) ? v : undefined));
  if (button) out.button = button;
  if (isRecord(value.cards)) {
    const cards: NonNullable<FixFields['cards']> = {};
    for (const [index, card] of Object.entries(value.cards)) {
      const fields = /^\d{1,2}$/.test(index) ? pick(card, CARD_FIELDS, selector) : undefined;
      if (fields) cards[index] = fields;
    }
    if (Object.keys(cards).length) out.cards = cards;
  }
  return Object.keys(out).length ? out : undefined;
}

/** The fixes in a downloaded file, keeping only what a fix can change, for engines Anubis has. */
export function readEngineFixes(data: unknown): EngineFix[] {
  if (!isRecord(data) || data.anubis !== 'engine-fixes' || !Array.isArray(data.fixes)) return [];
  const ids = new Set(ENGINES.map((e) => e.id));
  return data.fixes.flatMap((fix): EngineFix[] => {
    if (!isRecord(fix) || typeof fix.engine !== 'string' || !ids.has(fix.engine)) return [];
    if ([fix.from, fix.until].some((v) => v !== undefined && !(typeof v === 'string' && VERSION.test(v)))) return [];
    const set = readFields(fix.set);
    const mobile = readFields(fix.mobile);
    if (!set && !mobile) return [];
    return [
      {
        engine: fix.engine,
        ...(fix.from ? { from: fix.from as string } : {}),
        ...(fix.until ? { until: fix.until as string } : {}),
        ...(set ? { set } : {}),
        ...(mobile ? { mobile } : {}),
      },
    ];
  });
}

/** Negative, zero, or positive as version `a` comes before, is, or comes after `b`. */
export function compareVersions(a: string, b: string): number {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  for (let i = 0; i < Math.max(x!.length, y!.length); i++) {
    const d = (x![i] ?? 0) - (y![i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** Whether a fix is for this version of Anubis. */
export function fixApplies(fix: EngineFix, version: string): boolean {
  return (!fix.from || compareVersions(version, fix.from) >= 0) && (!fix.until || compareVersions(version, fix.until) < 0);
}

/**
 * A definition with a fix's fields put in, each only where `isSelector` takes it
 * (the page checks it parses); anything else keeps the bundled value.
 */
export function applyFields(engine: EngineDef, fields: FixFields | undefined, isSelector: (s: string) => boolean): EngineDef {
  if (!fields) return engine;
  const out: EngineDef = { ...engine };
  const ok = (s: string | undefined): s is string => s !== undefined && isSelector(s);
  for (const key of SELECTOR_FIELDS) if (ok(fields[key])) out[key] = fields[key];
  const cleanup = Object.entries(fields.cleanupSelectors ?? {}).filter(([, s]) => ok(s));
  if (cleanup.length) out.cleanupSelectors = { ...engine.cleanupSelectors, ...Object.fromEntries(cleanup) };
  // Only the selector of the kind this version has: a fix can't turn a Next link into a button.
  const more = engine.more;
  if (more?.kind === 'click' && ok(fields.more?.button)) out.more = { ...more, button: fields.more.button };
  if (more?.kind === 'link' && ok(fields.more?.next)) out.more = { ...more, next: fields.more.next };
  if (more?.kind === 'form' && ok(fields.more?.form)) out.more = { ...more, form: fields.more.form };
  if (fields.button && engine.button) out.button = { ...engine.button, ...fields.button };
  if (fields.cards && engine.cards) {
    out.cards = engine.cards.map((card, i) => {
      const fix = fields.cards![String(i)];
      if (!fix) return card;
      return { ...card, ...Object.fromEntries(CARD_FIELDS.filter((k) => ok(fix[k])).map((k) => [k, fix[k]])) };
    });
  }
  return out;
}

/**
 * The engine for a site, as `engineFor` gives it, with the fixes for this version
 * put in: `set` into the definition, then `mobile` into the phone layout, whose own
 * values come before `set`'s, as they come before the bundled ones.
 */
export function fixedEngineFor(
  hostname: string,
  mobile: boolean,
  fixes: EngineFix[],
  version: string,
  isSelector: (s: string) => boolean,
): EngineDef | undefined {
  const bundled = engineFor(hostname);
  if (!bundled) return undefined;
  const mine = fixes.filter((f) => f.engine === bundled.id && fixApplies(f, version));
  let engine = mine.reduce((def, fix) => applyFields(def, fix.set, isSelector), bundled);
  if (mobile && bundled.mobile) engine = { ...engine, ...bundled.mobile };
  if (mobile) engine = mine.reduce((def, fix) => applyFields(def, fix.mobile, isSelector), engine);
  return engine;
}

/** The fixes this browser has, as last downloaded. */
export async function storedEngineFixes(): Promise<EngineFix[]> {
  return (await engineFixesItem.getValue())?.fixes ?? [];
}

/** Download the fixes, at most every six hours, keeping the last ones when it fails. */
export async function refreshEngineFixes(now = Date.now()): Promise<void> {
  const stored = await engineFixesItem.getValue();
  if (stored && now - stored.fetchedAt < FETCH_EVERY_MS) return;
  if (stored?.errorAt && now - stored.errorAt < RETRY_AFTER_ERROR_MS) return;
  try {
    const fixes = readEngineFixes(JSON.parse(await fetchText(ENGINE_FIXES_URL, 10000)));
    await engineFixesItem.setValue({ fixes, fetchedAt: now });
  } catch (error) {
    console.warn('[anubis] could not download engine fixes', error);
    // Read again: what was saved while this one waited is newer than what it started with.
    const latest = await engineFixesItem.getValue();
    await engineFixesItem.setValue({ fixes: latest?.fixes ?? [], fetchedAt: latest?.fetchedAt ?? 0, errorAt: now });
  }
}
