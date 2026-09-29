import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { t, tn } from '@/utils/i18n';

// Translations live in public/_locales/<language>/messages.json; English is the source.
type Messages = Record<string, { message: string; description?: string }>;
const LOCALES = 'public/_locales';
const read = (lang: string): Messages => JSON.parse(readFileSync(`${LOCALES}/${lang}/messages.json`, 'utf8'));
const en = read('en');
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
    for (const lang of readdirSync(LOCALES).filter((l) => l !== 'en' && existsSync(`${LOCALES}/${l}/messages.json`))) {
      const messages = read(lang);
      for (const [key, { message }] of Object.entries(messages)) {
        // Plural forms English doesn't have (_few, _many…) are fine.
        const source = en[key] ?? en[key.replace(/_(zero|two|few|many)$/, '_other')];
        expect(source, `${lang}: ${key} isn't an English key`).toBeDefined();
        expect(placeholders(message), `${lang}: ${key}`).toEqual(placeholders(source!.message));
      }
      if (messages.extDescription) expect(messages.extDescription.message.length, lang).toBeLessThanOrEqual(132);
    }
    expect(en.extDescription!.message.length).toBeLessThanOrEqual(132);
  });
});

describe('t and tn', () => {
  beforeAll(() => {
    // The fake browser has no i18n: answer from the English messages.
    fakeBrowser.i18n.getMessage = ((key: string, subs?: string[]) =>
      en[key]?.message.replace(/\$(\d)/g, (_, n: string) => subs?.[Number(n) - 1] ?? '') ?? '') as typeof fakeBrowser.i18n.getMessage;
  });

  it('fills in placeholders', () => {
    expect(t('popupForget', 'fandom.com')).toBe('Forget fandom.com');
  });

  it('picks the plural form for a count', () => {
    expect(tn('popupListCount', 1)).toBe('1 list');
    expect(tn('popupListCount', 0)).toBe('0 lists');
    expect(tn('popupTagCount', 12)).toBe('12 tags');
  });
});
