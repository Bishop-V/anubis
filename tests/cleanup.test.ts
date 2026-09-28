import { describe, expect, it } from 'vitest';
import { redirectFor } from '@/entrypoints/content/cleanup';
import { cleanupKindFor, describeRemoved, NO_CLEANUP } from '@/utils/cleanup';
import { ENGINES } from '@/utils/engines';
import type { PageStats } from '@/utils/messages';
import { getSettings, settingsItem } from '@/utils/storage';
import { summarySentence } from '@/utils/summary';

const engine = (id: string) => ENGINES.find((e) => e.id === id)!;

describe('clean-up headings', () => {
  it('recognises whole headings, ignoring case and spacing', () => {
    expect(cleanupKindFor('AI Overview')).toBe('ai');
    expect(cleanupKindFor('  ai   overview ')).toBe('ai');
    expect(cleanupKindFor('Aperçu IA')).toBe('ai');
    expect(cleanupKindFor('People also ask')).toBe('questions');
    expect(cleanupKindFor('Short videos')).toBe('videos');
    expect(cleanupKindFor('Images for anubis')).toBe('images');
    expect(cleanupKindFor('Searches related to anubis')).toBe('related');
  });

  it('leaves result titles and partial matches alone', () => {
    expect(cleanupKindFor('AI Overview of the Egyptian gods')).toBeUndefined();
    expect(cleanupKindFor('Top stories about Anubis you missed')).toBeUndefined();
    expect(cleanupKindFor('')).toBeUndefined();
  });
});

describe('summary with clean-up', () => {
  const stats = (patch: Partial<PageStats>): PageStats => ({
    engine: 'Google',
    total: 9,
    hidden: 0,
    pinned: 0,
    raised: 0,
    lowered: 0,
    tagged: 0,
    revealed: false,
    pages: 1,
    canGoDeeper: false,
    loading: false,
    tags: [],
    removed: {},
    ...patch,
  });

  it('names what was removed', () => {
    expect(describeRemoved({ ai: 1, videos: 2 })).toBe('an AI answer and 2 video panels');
    expect(summarySentence(stats({ hidden: 2, removed: { ai: 1 } }))).toBe('Anubis hid 2 of 9 results, and removed an AI answer.');
    expect(summarySentence(stats({ removed: { questions: 1 } }))).toBe('Anubis removed a question list.');
    expect(summarySentence(stats({}))).toBe('Anubis left all 9 results as they were.');
  });
});

describe('clean-up redirects', () => {
  it('sends DuckDuckGo searches to its no-AI version when AI answers are removed', () => {
    const url = new URL('https://duckduckgo.com/?q=anubis&ia=web');
    expect(redirectFor(engine('duckduckgo'), url, { ...NO_CLEANUP, ai: true }, false)).toBe('https://noai.duckduckgo.com/?q=anubis&ia=web');
    expect(redirectFor(engine('duckduckgo'), url, NO_CLEANUP, false)).toBeUndefined();
    expect(redirectFor(engine('duckduckgo'), new URL('https://noai.duckduckgo.com/?q=anubis'), { ...NO_CLEANUP, ai: true }, false)).toBeUndefined();
  });

  it('opens Google’s Web tab only from the All tab', () => {
    const google = engine('google');
    expect(redirectFor(google, new URL('https://www.google.com/search?q=anubis'), NO_CLEANUP, true)).toBe(
      'https://www.google.com/search?q=anubis&udm=14',
    );
    expect(redirectFor(google, new URL('https://www.google.com/search?q=anubis&udm=2'), NO_CLEANUP, true)).toBeUndefined();
    expect(redirectFor(google, new URL('https://www.google.com/search?q=anubis&tbm=nws'), NO_CLEANUP, true)).toBeUndefined();
    expect(redirectFor(google, new URL('https://www.google.com/search?q=anubis'), NO_CLEANUP, false)).toBeUndefined();
  });
});

describe('clean-up settings', () => {
  it('start off, and a kind missing from stored settings stays off', async () => {
    await settingsItem.setValue({ ...(await getSettings()), cleanup: { ai: true } as never });
    expect((await getSettings()).cleanup).toEqual({ ...NO_CLEANUP, ai: true });
  });
});
