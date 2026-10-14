import { readdirSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { en, installEnglish } from './english';
import { liveMessages, setMessages, t, tn } from '@/utils/i18n';
import { chooseLanguage, LANGUAGES, languageItem, loadLanguage } from '@/utils/language';

// The browser answers in its own language; a language picked in Settings is kept in
// storage and used by t() instead (utils/language.ts).

type Messages = Record<string, { message: string }>;
const file = (code: string): Messages =>
  JSON.parse(readFileSync(code === 'en' ? 'public/_locales/en/messages.json' : `locales/${code}/messages.json`, 'utf8'));

/** Serve `_locales/<code>/messages.json` from the repository, as the built extension does. */
function serveLocales() {
  fakeBrowser.runtime.getManifest = (() => ({ version: '1.0.0' })) as typeof fakeBrowser.runtime.getManifest;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const code = /_locales\/([^/]+)\/messages\.json$/.exec(String(url))?.[1];
      return code ? { ok: true, json: async () => file(code) } : { ok: false, json: async () => ({}) };
    }),
  );
}

afterEach(async () => {
  setMessages(undefined);
  await languageItem.removeValue();
  vi.unstubAllGlobals();
});

describe('picking a language', () => {
  it('lists English and every translation, and nothing else', () => {
    const folders = readdirSync('locales', { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
    expect(LANGUAGES.map((l) => l.code).sort()).toEqual(['en', ...folders].sort());
  });

  it('answers from the browser until a language is picked', () => {
    installEnglish();
    expect(t('themeAuto')).toBe(en.themeAuto!.message);
  });

  it('answers from the picked language, English filling what it lacks', async () => {
    installEnglish();
    serveLocales();
    const de = file('de');
    const missing = Object.keys(en).find((k) => !de[k] && !k.includes('_') && !en[k]!.message.includes('$'))!;
    await chooseLanguage('de');
    expect(t('themeAuto')).toBe(de.themeAuto!.message);
    expect(t(missing as never)).toBe(en[missing]!.message);
    expect(t('langCode')).toBe('de');
  });

  it('fills in $1 and picks plural forms', async () => {
    installEnglish();
    serveLocales();
    await chooseLanguage('de');
    const de = file('de');
    expect(t('deeperAutoHint', 7)).toBe(de.deeperAutoHint!.message.replace('$1', '7'));
    expect(tn('deeperTipTime', 1)).toBe(de.deeperTipTime_one!.message.replace('$1', '1'));
  });

  it('is used by the next page, and Browser default puts the browser back', async () => {
    installEnglish();
    serveLocales();
    await chooseLanguage('fr');
    setMessages(undefined);
    expect(await loadLanguage()).toBe('fr');
    expect(t('langCode')).toBe('fr');
    await chooseLanguage(null);
    expect(await loadLanguage()).toBeNull();
    expect(t('langCode')).toBe('en');
  });

  it('reads the messages again after an update, but keeps the old ones if it can’t', async () => {
    installEnglish();
    serveLocales();
    await chooseLanguage('de');
    await languageItem.setValue({ ...(await languageItem.getValue())!, version: '0.0.0', messages: { langCode: 'de', themeAuto: 'old' } });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    await loadLanguage(true);
    expect(t('themeAuto')).toBe('old');
    serveLocales();
    await loadLanguage(true);
    expect(t('themeAuto')).toBe(file('de').themeAuto!.message);
  });

  it('leaves the choice alone when the language can’t be read', async () => {
    installEnglish();
    serveLocales();
    await chooseLanguage('fr');
    await expect(chooseLanguage('xx')).rejects.toThrow();
    expect((await languageItem.getValue())?.code).toBe('fr');
  });

  it('gives labels that follow the language, not the one in force when the file loaded', () => {
    installEnglish();
    const labels = liveMessages({ a: 'themeAuto', b: '' });
    expect(labels.a).toBe(en.themeAuto!.message);
    setMessages({ themeAuto: 'Automatique' });
    expect(labels.a).toBe('Automatique');
    expect(labels.b).toBe('');
  });
});

describe('modules that load before the language does', () => {
  it('look up no message while they load', async () => {
    const asked: string[] = [];
    fakeBrowser.i18n.getMessage = ((key: string) => {
      asked.push(key);
      return en[key]?.message ?? '';
    }) as typeof fakeBrowser.i18n.getMessage;
    for (const f of readdirSync('utils').filter((f) => f.endsWith('.ts') && f !== 'language.ts')) {
      await import(/* @vite-ignore */ `../utils/${f}`);
    }
    expect(asked).toEqual([]);
  });
});
