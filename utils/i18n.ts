import { browser } from '#imports';

// Interface text lives in public/_locales/<language>/messages.json, the browsers'
// own format, which translation tools (Weblate, Crowdin) read as they are. English
// is the source. The browser picks the user's language, and any message a
// translation lacks falls back to English.
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

/** The language the messages are in, as a BCP 47 tag (pt-BR) for Intl. */
const lang = () => t('langCode').replace('_', '-');

let pluralRules: Intl.PluralRules | undefined;

/** A message about `count` things, in the right plural form. `$1` is the count. */
export function tn(key: PluralKey, count: number, ...subs: (string | number)[]): string {
  pluralRules ??= new Intl.PluralRules(lang());
  const args = [String(count), ...subs.map(String)];
  return getMessage(`${key}_${pluralRules.select(count)}`, args) || getMessage(`${key}_other`, args) || key;
}

// Stands in for the items while the message is looked up; a private-use
// character, so it's never in a message.
const SLOT = '\uE000';

/**
 * A message whose `$1` is a list of items that may be elements, such as links:
 * "Suggest it to <a>A</a> or <a>B</a>." Returns the message's text with the items
 * in place of `$1`, joined the way the language joins a list.
 */
export function tList<T>(key: MessageKey, items: T[], type: 'conjunction' | 'disjunction' = 'conjunction'): (string | T)[] {
  const [before = '', after = ''] = t(key, SLOT).split(SLOT);
  const parts = new Intl.ListFormat(lang(), { type }).formatToParts(items.map((_, i) => String(i)));
  return [before, ...parts.map((p) => (p.type === 'element' ? items[Number(p.value)]! : p.value)), after];
}

/**
 * Fill a static page's text from messages: `data-i18n` sets the text, and
 * `data-i18n-title`, `data-i18n-aria-label` and `data-i18n-placeholder` set those
 * attributes. Also marks the page with the language its text is in.
 */
export function localizePage(root: Document = document): void {
  root.documentElement.lang = t('langCode').replace('_', '-');
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = t(el.dataset.i18n as MessageKey);
  for (const attr of ['title', 'aria-label', 'placeholder']) {
    for (const el of root.querySelectorAll<HTMLElement>(`[data-i18n-${attr}]`)) {
      el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`) as MessageKey));
    }
  }
}
