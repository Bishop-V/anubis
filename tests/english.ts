import { readFileSync } from 'node:fs';
import { beforeAll } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

type Messages = Record<string, { message: string; description?: string }>;

/** The English messages, as the extension ships them. */
export const en: Messages = JSON.parse(readFileSync('public/_locales/en/messages.json', 'utf8'));

/** The fake browser has no i18n: answer from the English messages. Call it before importing a module that translates as it loads. */
export function installEnglish(): void {
  fakeBrowser.i18n.getMessage = ((key: string, subs?: string[]) =>
    en[key]?.message.replace(/\$(\d)/g, (_, n: string) => subs?.[Number(n) - 1] ?? '') ?? '') as typeof fakeBrowser.i18n.getMessage;
}

/** Answers from the English messages for the tests that follow. */
export function useEnglish(): void {
  beforeAll(installEnglish);
}
