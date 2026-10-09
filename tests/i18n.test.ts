import { readdirSync, readFileSync } from 'node:fs';
import { check, freshMessages, languages, sourceKey, translation } from '../scripts/locales.mjs';
import { describe, expect, it } from 'vitest';
import { andList } from '@/utils/dom';
import { t, tJoin, tList, tn, tParts } from '@/utils/i18n';
import type { SiteChange } from '@/utils/personal';
import { changeSentence } from '@/utils/summary';
import { hiddenReason } from '@/entrypoints/content/ui';
import type { Verdict } from '@/utils/matcher';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { parseList } from '@/utils/listformat';
import { compileList, evaluate } from '@/utils/matcher';
import { reportUrl } from '@/utils/subscriptions';
import { en as english, installEnglish, useEnglish } from './english';

// English is public/_locales/en/messages.json, the source; translations are in
// locales/<language>, with the English each message came from (scripts/locales.mjs).
type Messages = Record<string, { message: string; description?: string }>;
const en: Messages = JSON.parse(readFileSync('public/_locales/en/messages.json', 'utf8'));
const placeholders = (text: string) => [...new Set(text.match(/\$\d/g) ?? [])].sort();

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(`${dir}/${e.name}`) : e.name.endsWith('.html') ? [`${dir}/${e.name}`] : [],
  );
}

describe('messages', () => {
  it('has every key that static pages and the manifest ask for', () => {
    const used = [
      ...htmlFiles('entrypoints').flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map((m) => m[1]!)),
      ...[...readFileSync('wxt.config.ts', 'utf8').matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]!),
    ];
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((k) => !en[k])).toEqual([]);
  });

  it('gives every count in English a singular and a plural', () => {
    for (const key of Object.keys(en).filter((k) => k.endsWith('_other'))) {
      expect(en[key.replace(/_other$/, '_one')], key).toBeDefined();
    }
  });

  it('keeps each translation in step with English', () => {
    expect(readdirSync('public/_locales')).toEqual(['en']);
    for (const lang of languages()) {
      const { messages } = translation(lang);
      for (const [key, { message }] of Object.entries(messages)) {
        // Plural forms English doesn't have (_few, _many…) are fine.
        const from = sourceKey(key, en);
        expect(from, `${lang}: ${key} isn't an English key`).toBeDefined();
        expect(placeholders(message), `${lang}: ${key}`).toEqual(placeholders(en[from!]!.message));
      }
      // Every message says which English it came from, or it could never go stale.
      expect(check(lang, en).unrecorded, lang).toEqual([]);
      expect(messages.langCode?.message, lang).toBe(lang);
      if (messages.extDescription) expect(messages.extDescription.message.length, lang).toBeLessThanOrEqual(132);
    }
    expect(en.extDescription!.message.length).toBeLessThanOrEqual(132);
  });

  it('ships a translated message only while its English is unchanged', () => {
    const lang = languages()[0];
    if (!lang) return;
    const { messages } = translation(lang);
    const key = check(lang, en).fresh.find((k) => en[k]) ?? Object.keys(messages)[0]!;
    expect(freshMessages(lang, en)[key]).toEqual({ message: messages[key]!.message });
    // The English changes: the translation is stale and the build leaves it out, so English shows.
    const changed = { ...en, [key]: { ...en[key]!, message: `${en[key]!.message} (changed)` } };
    expect(check(lang, changed).stale).toContain(key);
    expect(freshMessages(lang, changed)[key]).toBeUndefined();
  });
});

describe('t and tn', () => {
  useEnglish();

  it('fills in placeholders', () => {
    expect(t('popupHintMine', 'fandom.com')).toBe('Your choice for fandom.com, on every search.');
  });

  it('picks the plural form for a count', () => {
    expect(tn('popupListCount', 1)).toBe('1 list');
    expect(tn('popupListCount', 0)).toBe('0 lists');
    expect(tn('popupTagCount', 12)).toBe('12 tags');
  });

  it('puts a list of items, which can be elements, in place of a placeholder', () => {
    const a = { name: 'A' };
    const b = { name: 'B' };
    expect(tList('menuReport', [a], 'disjunction')).toEqual(['Wrong? Report it to ', a, '.']);
    expect(tList('menuReport', [a, b], 'disjunction')).toEqual(['Wrong? Report it to ', a, ' or ', b, '.']);
    const c = { name: 'C' };
    expect(tList('menuReport', [a, b, c], 'disjunction')).toEqual(['Wrong? Report it to ', a, ', ', b, ', or ', c, '.']);
  });

  it('joins lists of three or more with the serial comma', () => {
    expect(tJoin(['a', 'b'])).toBe('a and b');
    expect(tJoin(['a', 'b', 'c'])).toBe('a, b, and c');
    expect(tJoin(['a', 'b', 'c'], 'disjunction')).toBe('a, b, or c');
    expect(andList(['a'])).toBe('a');
    expect(andList(['a', 'b'])).toBe('a and b');
    expect(andList(['a', 'b', 'c'])).toBe('a, b, and c');
  });

  it('says what a change from the result menu did', () => {
    const change = (before: Partial<SiteChange['before']>, after: Partial<SiteChange['after']>): SiteChange => ({
      site: 'fandom.com',
      before: { level: 'normal', tags: [], ...before },
      after: { level: 'normal', tags: [], ...after },
      newTags: [],
    });
    const label = (id: string) => ({ slop: 'AI slop' })[id] ?? id;
    expect(changeSentence(change({}, { level: 'hide' }), label)).toBe('Hid fandom.com.');
    expect(changeSentence(change({ level: 'pin' }, {}), label)).toBe('Cleared your ranking of fandom.com.');
    expect(changeSentence(change({}, { tags: ['slop'] }), label)).toBe('Tagged fandom.com “AI slop”.');
    expect(changeSentence(change({ level: 'hide', tags: ['slop'] }, { level: 'hide' }), label)).toBe('Removed the tag “AI slop” from fandom.com.');
    expect(changeSentence(change({}, { level: 'lower', tags: ['slop'] }), label)).toBe('Changed fandom.com in your list.');
  });
});

describe('in another language', () => {
  // A made-up language: every message in brackets, so English shows through where it shouldn't.
  const bracketed = () => {
    fakeBrowser.i18n.getMessage = ((key: string, subs?: string[]) =>
      english[key] ? `[${english[key].message.replace(/\$(\d)/g, (_, n: string) => subs?.[Number(n) - 1] ?? '')}]` : '') as typeof fakeBrowser.i18n.getMessage;
  };

  it('tells the menu’s reasons in the interface’s language, and reports them to lists in English', () => {
    bracketed();
    try {
      const list = compileList('docs', parseList('! tag: docs | Docs | #2f5fae\n$site=a.com,boost=3,tag=docs'), false, 'Docs list');
      const [reason] = evaluate({ url: 'https://a.com/x' }, [list]).reasons;
      expect(reason!.text).toMatch(/^\[/);
      expect(reason!.report).toBe('raises it by 3 and tags it “Docs”');
      const body = new URL(reportUrl('https://github.com/o/r/issues', 'Docs list', 'https://a.com/x', [reason!])!).searchParams.get('body')!;
      expect(body).toContain('**Docs list** raises it by 3 and tags it “Docs”, and I think that’s wrong.');
      expect(body).not.toContain('[');
    } finally {
      installEnglish();
    }
  });

  it('puts elements where a message’s placeholders are', () => {
    bracketed();
    try {
      const code = { el: 'code' };
      expect(tParts('publishStepIssues', code)).toEqual(['[Add ', code, ' so people can suggest sites to your list from the menu on each result.]']);
    } finally {
      installEnglish();
    }
  });

  it('agrees the hidden line’s words with how many results it stands for', () => {
    // "fandom.com and 2 more" took the singular, so French read "masqué" for three results.
    const tagged = { hiddenBy: { kind: 'tag', name: 'slop' } } as Verdict;
    const tags = new Map([['slop', { label: 'AI slop' }]]) as unknown as Parameters<typeof hiddenReason>[1];
    expect(hiddenReason(tagged, tags)).toBe('hidden because it’s tagged “AI slop”');
    expect(hiddenReason(tagged, tags, 3)).toBe('hidden because they’re tagged “AI slop”');
    const fr = translation('fr').messages;
    fakeBrowser.i18n.getMessage = ((key: string, subs?: string[]) =>
      fr[key]?.message.replace(/\$(\d)/g, (_, n: string) => subs?.[Number(n) - 1] ?? '') ?? '') as typeof fakeBrowser.i18n.getMessage;
    try {
      expect(hiddenReason({ hiddenBy: { kind: 'personal', name: 'mine' } } as Verdict, tags, 3)).toBe('masqués par votre liste');
      expect(hiddenReason({} as Verdict, tags, 1)).toBe('masqué');
    } finally {
      installEnglish();
    }
  });
});
