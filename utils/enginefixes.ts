import { storage } from '#imports';
import type { CleanupKind } from './cleanup';
import { ENGINES, engineFor, type CardDef, type EngineDef, type MoreResults } from './engines';
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

const selector = (v: unknown) => (typeof v === 'string' && v.trim() && v.length <= MAX_SELECTOR ? v : undefined);
const offset = (v: unknown) => (typeof v === 'string' && OFFSET.test(v) ? v : undefined);
const versionOf = (v: unknown) => (typeof v === 'string' && VERSION.test(v) ? v : undefined);
const ENGINE_IDS = new Set(ENGINES.map((e) => e.id));

/** The object without its undefined values; undefined when nothing is left. */
function compact<T extends object>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

/** Only the named fields of an object, each as `keep` reads it. */
function pick<K extends string>(value: unknown, keys: readonly K[], keep: (v: unknown) => string | undefined): Partial<Record<K, string>> | undefined {
  return isRecord(value) ? compact(Object.fromEntries(keys.map((key) => [key, keep(value[key])])) as Partial<Record<K, string>>) : undefined;
}

/** Card kinds by their place in `cards`, as `"0"`, `"1"`… */
function readCards(value: unknown): FixFields['cards'] {
  if (!isRecord(value)) return undefined;
  const cards = Object.entries(value).filter(([index]) => /^\d{1,2}$/.test(index));
  return compact(Object.fromEntries(cards.map(([index, card]) => [index, pick(card, CARD_FIELDS, selector)])) as NonNullable<FixFields['cards']>);
}

function readFields(value: unknown): FixFields | undefined {
  if (!isRecord(value)) return undefined;
  return compact<FixFields>({
    ...pick(value, SELECTOR_FIELDS, selector),
    cleanupSelectors: pick(value.cleanupSelectors, CLEANUP_KINDS, selector),
    more: pick(value.more, ['button', 'next', 'form'], selector),
    button: pick(value.button, ['top', 'right'], offset),
    cards: readCards(value.cards),
  });
}

/** Whether a fix names an engine Anubis has, and its versions, where given, are versions. */
function readable(fix: unknown): fix is Record<string, unknown> & { engine: string } {
  const badVersion = (v: unknown) => v !== undefined && !versionOf(v);
  return isRecord(fix) && ENGINE_IDS.has(fix.engine as string) && !badVersion(fix.from) && !badVersion(fix.until);
}

/** One fix, if it's readable and changes something. */
function readFix(fix: unknown): EngineFix[] {
  if (!readable(fix)) return [];
  const set = readFields(fix.set);
  const mobile = readFields(fix.mobile);
  if (!set && !mobile) return [];
  return [{ engine: fix.engine, ...compact({ from: versionOf(fix.from), until: versionOf(fix.until), set, mobile }) }];
}

/** The fixes in a downloaded file, keeping only what a fix can change, for engines Anubis has. */
export function readEngineFixes(data: unknown): EngineFix[] {
  const fixes = isRecord(data) && data.anubis === 'engine-fixes' ? data.fixes : undefined;
  return Array.isArray(fixes) ? fixes.flatMap(readFix) : [];
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

/** Whether a fix's selector can go in: given, and the page parses it. */
type Usable = (s: string | undefined) => s is string;

/** The fields of `fix` that are usable, as an object to spread over the bundled ones. */
function usableFields<K extends string>(fix: Partial<Record<K, string>>, keys: readonly K[], ok: Usable): Partial<Record<K, string>> {
  return Object.fromEntries(keys.filter((key) => ok(fix[key])).map((key) => [key, fix[key]])) as Partial<Record<K, string>>;
}

function fixedCleanup(bundled: EngineDef['cleanupSelectors'], fix: FixFields['cleanupSelectors'], ok: Usable): EngineDef['cleanupSelectors'] {
  const fixed = fix && usableFields(fix, CLEANUP_KINDS, ok);
  return fixed && Object.keys(fixed).length ? { ...bundled, ...fixed } : undefined;
}

/** Each kind of Load more results, and the one selector of it a fix can change. */
const MORE_FIELD = { click: 'button', link: 'next', form: 'form' } as const;

/** Only the selector of the kind this version has: a fix can't turn a Next link into a button. */
function fixedMore(more: MoreResults | undefined, fix: FixFields['more'], ok: Usable): MoreResults | undefined {
  const field = more && more.kind !== 'param' ? MORE_FIELD[more.kind] : undefined;
  const value = field ? fix?.[field] : undefined;
  return field && ok(value) ? ({ ...more, [field]: value } as MoreResults) : undefined;
}

function fixedCards(cards: CardDef[] | undefined, fixes: FixFields['cards'], ok: Usable): CardDef[] | undefined {
  if (!cards || !fixes) return undefined;
  return cards.map((card, i) => {
    const fix = fixes[String(i)];
    return fix ? { ...card, ...usableFields(fix, CARD_FIELDS, ok) } : card;
  });
}

/**
 * A definition with a fix's fields put in, each only where `isSelector` takes it
 * (the page checks it parses); anything else keeps the bundled value.
 */
export function applyFields(engine: EngineDef, fields: FixFields | undefined, isSelector: (s: string) => boolean): EngineDef {
  if (!fields) return engine;
  const ok: Usable = (s): s is string => s !== undefined && isSelector(s);
  return {
    ...engine,
    ...usableFields(fields, SELECTOR_FIELDS, ok),
    ...compact({
      cleanupSelectors: fixedCleanup(engine.cleanupSelectors, fields.cleanupSelectors, ok),
      more: fixedMore(engine.more, fields.more, ok),
      button: engine.button && fields.button ? { ...engine.button, ...fields.button } : undefined,
      cards: fixedCards(engine.cards, fields.cards, ok),
    }),
  };
}

/** What `fixedEngineFor` needs besides the site: the layout, the fixes, this version, and the page's selector check. */
export interface FixContext {
  mobile: boolean;
  fixes: EngineFix[];
  version: string;
  isSelector: (s: string) => boolean;
}

/**
 * The engine for a site, as `engineFor` gives it, with the fixes for this version
 * put in: `set` into the definition, then `mobile` into the phone layout, whose own
 * values come before `set`'s, as they come before the bundled ones.
 */
export function fixedEngineFor(hostname: string, { mobile, fixes, version, isSelector }: FixContext): EngineDef | undefined {
  const bundled = engineFor(hostname);
  if (!bundled) return undefined;
  const mine = fixes.filter((f) => f.engine === bundled.id && fixApplies(f, version));
  const apply = (def: EngineDef, part: 'set' | 'mobile') => mine.reduce((d, fix) => applyFields(d, fix[part], isSelector), def);
  const desktop = apply(bundled, 'set');
  return mobile ? apply({ ...desktop, ...bundled.mobile }, 'mobile') : desktop;
}

/** The fixes this browser has, as last downloaded. */
export async function storedEngineFixes(): Promise<EngineFix[]> {
  return (await engineFixesItem.getValue())?.fixes ?? [];
}

/** Whether it's time to download: six hours after the last download, and an hour after a failure. */
function due(stored: StoredFixes | null, now: number): boolean {
  const waited = (since: number | undefined, ms: number) => since === undefined || now - since >= ms;
  return !stored || (waited(stored.fetchedAt, FETCH_EVERY_MS) && waited(stored.errorAt, RETRY_AFTER_ERROR_MS));
}

/** Download the fixes, at most every six hours, keeping the last ones when it fails. */
export async function refreshEngineFixes(now = Date.now()): Promise<void> {
  if (!due(await engineFixesItem.getValue(), now)) return;
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
