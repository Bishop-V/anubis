import { browser } from '#imports';

// Interface text lives in public/_locales/en/messages.json, the browsers' own format,
// which translation tools (Weblate, Crowdin) read as they are. English is the source;
// translations are in locales/<language>, and the build ships each message only while
// its English is unchanged (scripts/locales.mjs). The browser picks the user's
// language, and any message a translation lacks falls back to English.
//
// Counts use plural forms: `<key>_one`, `<key>_other`, plus `_zero`, `_two`,
// `_few` or `_many` where a language needs them (Intl.PluralRules names them).

type Messages = typeof import('@/public/_locales/en/messages.json');
export type MessageKey = keyof Messages;
/** Keys with plural forms, named without the form. */
export type PluralKey = MessageKey extends infer K ? (K extends `${infer Base}_other` ? Base : never) : never;

// WXT types getMessage with one overload per key, which a key held in a variable
// can't pick; MessageKey checks the keys instead.
const getMessage = (key: string, subs: string[]): string =>
  (browser.i18n.getMessage as (key: string, subs?: string[]) => string)(key, subs);

/** A message, with `$1`, `$2`… filled in. */
export function t(key: MessageKey, ...subs: (string | number)[]): string {
  return getMessage(key, subs.map(String)) || key;
}

/** The language the messages are in, as a BCP 47 tag (pt-BR) for Intl and `lang`; English if a translation's code is wrong. */
export const lang = (): string => {
  try {
    return Intl.getCanonicalLocales(t('langCode').replace('_', '-'))[0] ?? 'en';
  } catch {
    return 'en';
  }
};

/** How lists are joined: in English "a, b, and c", with the serial comma; a `unit` list is "a, b, c". */
const listFormat = (type: ListType) => new Intl.ListFormat(lang(), { type, style: type === 'unit' ? 'short' : 'long' });
type ListType = 'conjunction' | 'disjunction' | 'unit';

let pluralRules: Intl.PluralRules | undefined;

/** How long ago a time was, in the language's words: "just now", "5 minutes ago", "2 days ago". */
export function tAgo(ms: number, now = Date.now()): string {
  const s = Math.round((now - ms) / 1000);
  if (s < 60) return t('timeJustNow');
  const format = new Intl.RelativeTimeFormat(lang(), { numeric: 'auto' });
  const m = Math.round(s / 60);
  if (m < 60) return format.format(-m, 'minute');
  const hr = Math.round(m / 60);
  if (hr < 48) return format.format(-hr, 'hour');
  return format.format(-Math.round(hr / 24), 'day');
}

/** A message about `count` things, in the right plural form. `$1` is the count. */
export function tn(key: PluralKey, count: number, ...subs: (string | number)[]): string {
  pluralRules ??= new Intl.PluralRules(lang());
  const args = [String(count), ...subs.map(String)];
  return getMessage(`${key}_${pluralRules.select(count)}`, args) || getMessage(`${key}_other`, args) || key;
}

// In some languages a `unit` list has nothing between its items (Chinese) or only a
// space (Japanese, Korean, Russian), so a row of facts runs together; those get a comma.
const LIST_COMMAS: Record<string, string> = { zh: '、', ja: '、', ar: '، ', fa: '، ', ur: '، ' };

function listParts(items: string[], type: ListType): { type: string; value: string }[] {
  const format = listFormat(type);
  const separated = format.formatToParts(['a', 'b']).some((p) => p.type === 'literal' && p.value.trim());
  if (type !== 'unit' || separated) return format.formatToParts(items);
  const comma = LIST_COMMAS[lang().split('-')[0]!] ?? ', ';
  return items.flatMap((value, i) => [...(i ? [{ type: 'literal' as const, value: comma }] : []), { type: 'element' as const, value }]);
}

/** Items joined the way the language joins a list: "a, b, and c" in English, or "a, b, c" for `unit`. */
export function tJoin(items: string[], type: ListType = 'conjunction'): string {
  return listParts(items, type)
    .map((p) => p.value)
    .join('');
}

/** The space between two sentences or phrases: none in Chinese and Japanese, which don't use one. */
export const gap = (): string => (/^(zh|ja)\b/.test(lang()) ? '' : ' ');

// Stands in for the items while the message is looked up; a private-use
// character, so it's never in a message.
const SLOT = '\uE000';

/**
 * A message whose `$1` is a list of items that may be elements, such as links:
 * "Suggest it to <a>A</a> or <a>B</a>." Returns the message's text with the items
 * in place of `$1`, joined the way the language joins a list.
 */
export function tList<T>(key: MessageKey, items: T[], type: ListType = 'conjunction'): (string | T)[] {
  const [before = '', after = ''] = t(key, SLOT).split(SLOT);
  const parts = listParts(items.map((_, i) => String(i)), type);
  return [before, ...parts.map((p) => (p.type === 'element' ? items[Number(p.value)]! : p.value)), after];
}

/**
 * A message whose placeholders are elements, such as code or links: "Add <code>…</code>
 * so people can…". Returns the message's text with each item in place of its `$n`.
 */
export function tParts<T>(key: MessageKey, ...items: (string | T)[]): (string | T)[] {
  const slots = items.map((_, i) => String.fromCharCode(SLOT.charCodeAt(0) + i));
  return t(key, ...slots)
    .split(/([\uE000-\uE0FF])/)
    .filter((part) => part !== '')
    .map((part) => (part.length === 1 && part >= '\uE000' && part <= '\uE0FF' ? items[part.charCodeAt(0) - SLOT.charCodeAt(0)]! : part));
}

// Languages written right to left. Chrome's own `@@bidi_dir` said "ltr" for Arabic, so
// the direction follows the language the messages are in.
const RTL = new Set(['ar', 'ckb', 'dv', 'fa', 'he', 'ps', 'sd', 'ug', 'ur', 'yi']);

/** The interface's direction: "rtl" for Arabic, Urdu, Hebrew… */
export const dir = (): 'ltr' | 'rtl' => (RTL.has(lang().split('-')[0]!) ? 'rtl' : 'ltr');

/**
 * Fill a static page's text from messages: `data-i18n` sets the text, and
 * `data-i18n-title`, `data-i18n-aria-label` and `data-i18n-placeholder` set those
 * attributes. Also marks the page with the language its text is in, and its direction.
 */
export function localizePage(root: Document = document): void {
  root.documentElement.lang = lang();
  root.documentElement.dir = dir();
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = t(el.dataset.i18n as MessageKey);
  for (const attr of ['title', 'aria-label', 'placeholder']) {
    for (const el of root.querySelectorAll<HTMLElement>(`[data-i18n-${attr}]`)) {
      el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`) as MessageKey));
    }
  }
}
