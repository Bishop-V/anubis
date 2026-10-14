import { browser, storage } from '#imports';
import { setMessages } from './i18n';

// The interface follows the browser's language unless the person picks another in
// Settings → General. The browser can't be told to answer in a different language, so
// the picked language's messages are kept in storage and used by `t()` instead
// (`setMessages` in utils/i18n.ts). Every page and the search-page script load them
// first. The toolbar's name and the browser's own extension list stay in the browser's.

/** The languages Anubis has, each named in itself so anyone can find theirs. Folder names, as in `_locales/`. */
export const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'zh_CN', name: '简体中文' },
  { code: 'zh_TW', name: '繁體中文' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pt_BR', name: 'Português (Brasil)' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ur', name: 'اردو' },
];

/** The picked language and its messages; nothing while Anubis follows the browser. */
export interface StoredLanguage {
  code: string;
  /** The version the messages came from, so a new release's text replaces them. */
  version: string;
  messages: Record<string, string>;
}

export const languageItem = storage.defineItem<StoredLanguage | null>('local:language', { fallback: null });

type MessageFile = Record<string, { message: string }>;

async function readMessages(code: string): Promise<Record<string, string>> {
  const response = await fetch(browser.runtime.getURL(`/_locales/${code}/messages.json` as '/_locales/en/messages.json'));
  if (!response.ok) throw new Error(String(response.status));
  const file = (await response.json()) as MessageFile;
  return Object.fromEntries(Object.entries(file).map(([key, value]) => [key, value.message]));
}

/** The messages of a language: its own where it has them, English for the rest. */
export async function messagesFor(code: string): Promise<Record<string, string>> {
  const english = await readMessages('en');
  return code === 'en' ? english : { ...english, ...(await readMessages(code)) };
}

/** Pick a language, or `null` to follow the browser. */
export async function chooseLanguage(code: string | null): Promise<void> {
  if (code === null) {
    await languageItem.setValue(null);
    setMessages(undefined);
    return;
  }
  const messages = await messagesFor(code);
  await languageItem.setValue({ code, version: browser.runtime.getManifest().version, messages });
  setMessages(messages);
}

/**
 * Use the picked language for `t()`. Extension pages pass `refresh` to read the
 * messages again after an update; the search-page script can't read the extension's
 * files, so it uses what was stored.
 */
export async function loadLanguage(refresh = false): Promise<string | null> {
  let stored = await languageItem.getValue();
  if (!stored) {
    setMessages(undefined);
    return null;
  }
  if (refresh && stored.version !== browser.runtime.getManifest().version) {
    try {
      await chooseLanguage(stored.code);
      stored = await languageItem.getValue();
    } catch {
      // Keep what was stored.
    }
  }
  setMessages(stored?.messages);
  return stored?.code ?? null;
}
