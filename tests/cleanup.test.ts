import { describe, expect, it } from 'vitest';
import { redirectFor } from '@/entrypoints/content/cleanup';
import { AI_ENTRY_POINTS, cleanupKindFor, cleanupMarkerFor, describeRemoved, NO_CLEANUP } from '@/utils/cleanup';
import { ENGINES } from '@/utils/engines';
import type { PageStats } from '@/utils/messages';
import { getSettings, settingsItem } from '@/utils/storage';
import { shortSummary, summarySentence } from '@/utils/summary';
import { useEnglish } from './english';

const engine = (id: string) => ENGINES.find((e) => e.id === id)!;

describe('clean-up headings', () => {
  it('keeps engine-specific cleanup selectors with their engine definitions', () => {
    expect(engine('google').cleanupSelectors).toEqual({
      ai: '[data-attrid="AIOverview"], .M8OgIe, .YzCcne',
      questions: '.related-question-pair',
    });
    expect(engine('duckduckgo').cleanupSelectors?.ai).toBe('[data-testid="duckassist-answer-content"], [data-react-module-id="wikinlp"]');
    expect(engine('brave').cleanupSelectors?.ai).toBe('#summarizer');
    expect(engine('bing').cleanupSelectors?.ai).toBe('.cht_container, .cht_disclaimer');
  });

  it('recognises whole headings, ignoring case and spacing', () => {
    expect(cleanupKindFor('AI Overview')).toBe('ai');
    expect(cleanupKindFor('  ai   overview ')).toBe('ai');
    expect(cleanupKindFor('Aperçu IA')).toBe('ai');
    expect(cleanupKindFor('People also ask')).toBe('questions');
    expect(cleanupKindFor('Short videos')).toBe('videos');
    expect(cleanupKindFor('Videos of how to bake sourdough bread')).toBe('videos');
    expect(cleanupKindFor('Related searches for python list comprehension')).toBe('related');
    expect(cleanupKindFor('Related searches based on your browsing')).toBe('related');
    expect(cleanupKindFor('Images for anubis')).toBe('images');
    expect(cleanupKindFor('Searches related to anubis')).toBe('related');
    expect(cleanupKindFor('Related queries')).toBe('related');
    expect(cleanupKindFor('Find elsewhere')).toBe('elsewhere');
    expect(cleanupKindFor('People also search for')).toBe('related');
    expect(cleanupKindFor('Discussions and forums')).toBe('discussions');
    expect(cleanupKindFor('Discussions')).toBe('discussions');
  });

  it('recognises text only an AI answer has', () => {
    expect(cleanupMarkerFor('AI responses may include mistakes. ')).toBe('ai');
    expect(cleanupMarkerFor('Why AI responses may include mistakes')).toBeUndefined();
  });

  it('leaves result titles and partial matches alone', () => {
    expect(cleanupKindFor('AI Overview of the Egyptian gods')).toBeUndefined();
    expect(cleanupKindFor('Top stories about Anubis you missed')).toBeUndefined();
    expect(cleanupKindFor('')).toBeUndefined();
  });
});

describe('summary with clean-up', () => {
  useEnglish();
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
    expect(describeRemoved({})).toBe('');
    expect(summarySentence(stats({ hidden: 2, removed: { ai: 1 } }))).toBe('Anubis hid 2 of 9 results. It also removed an AI answer.');
    expect(summarySentence(stats({ raised: 1, hidden: 2, removed: { ai: 1, videos: 1, questions: 1, images: 1 } }))).toBe(
      'Anubis raised 1 and hid 2 of 9 results. It also removed an AI answer, a video panel, a question list, and an image panel.',
    );
    expect(summarySentence(stats({ removed: { questions: 1 } }))).toBe('Anubis removed a question list.');
  });

  it('counts results and pages', () => {
    expect(summarySentence(stats({}))).toBe('Anubis left all 9 results as they were.');
    expect(summarySentence(stats({ total: 1 }))).toBe('Anubis left this result as it was.');
    expect(summarySentence(stats({ total: 20, pages: 2 }))).toBe('Anubis left all 20 results from 2 pages as they were.');
    expect(summarySentence(stats({ total: 20, pages: 2, pinned: 1, raised: 2, hidden: 3 }))).toBe('Anubis pinned 1, raised 2, and hid 3 of 20 results from 2 pages.');
    expect(summarySentence(stats({ total: 1, lowered: 1 }))).toBe('Anubis lowered 1 of 1 result.');
  });

  it('says it in a few words for phones', () => {
    expect(shortSummary(stats({ pinned: 1, raised: 1, lowered: 1, hidden: 1 }))).toBe('Anubis changed 4 of 9 results.');
    expect(shortSummary(stats({ hidden: 2, removed: { ai: 1, videos: 1 } }))).toBe('Anubis changed 2 of 9 results and cleaned up the page.');
    expect(shortSummary(stats({ removed: { questions: 1 } }))).toBe('Anubis cleaned up the page.');
    expect(shortSummary(stats({ total: 20, pages: 2, raised: 1, hidden: 1 }))).toBe('Anubis changed 2 of 20 results from 2 pages.');
    // Short already: the full sentence stands.
    expect(shortSummary(stats({}))).toBeUndefined();
    expect(shortSummary(stats({ hidden: 1 }))).toBeUndefined();
    expect(shortSummary(stats({ total: 20, pages: 2, raised: 1 }))).toBeUndefined();
    expect(shortSummary(stats({ hidden: 1, filter: 'ref', tags: [{ id: 'ref', label: 'Reference', color: '#2b9aa0', count: 2 }] }))).toBeUndefined();
  });

  it('says which tag it shows', () => {
    const tags = [{ id: 'ref', label: 'Reference', count: 2 }] as PageStats['tags'];
    expect(summarySentence(stats({ filter: 'ref', tags }))).toBe('Showing only “Reference”: 2 of 9 results.');
  });
});

describe('clean-up redirects', () => {
  it('leaves DuckDuckGo where it is, with its settings: AI answers are removed on the page', () => {
    for (const url of ['https://duckduckgo.com/?q=anubis&ia=web', 'https://safe.duckduckgo.com/?q=anubis', 'https://start.duckduckgo.com/?q=anubis']) {
      expect(redirectFor(engine('duckduckgo'), new URL(url), true)).toBeUndefined();
    }
  });

  it('knows the AI chat tabs and buttons by name', () => {
    expect(AI_ENTRY_POINTS.google!.labels.test('AI Mode')).toBe(true);
    for (const name of ['Duck.ai', 'Ask Duck.ai', 'Search Assist']) expect(AI_ENTRY_POINTS.duckduckgo!.labels.test(name), name).toBe(true);
    for (const name of ['Duck.ai settings', 'DuckDuckGo', 'All']) expect(AI_ENTRY_POINTS.duckduckgo!.labels.test(name), name).toBe(false);
  });

  it('opens Google’s Web tab only from the All tab', () => {
    const google = engine('google');
    expect(redirectFor(google, new URL('https://www.google.com/search?q=anubis'), true)).toBe(
      'https://www.google.com/search?q=anubis&udm=14',
    );
    expect(redirectFor(google, new URL('https://www.google.com/search?q=anubis&udm=2'), true)).toBeUndefined();
    expect(redirectFor(google, new URL('https://www.google.com/search?q=anubis&tbm=nws'), true)).toBeUndefined();
    expect(redirectFor(google, new URL('https://www.google.com/search?q=anubis'), false)).toBeUndefined();
  });
});

describe('clean-up settings', () => {
  it('start off, and a kind missing from stored settings stays off', async () => {
    await settingsItem.setValue({ ...(await getSettings()), cleanup: { ai: true } as never });
    expect((await getSettings()).cleanup).toEqual({ ...NO_CLEANUP, ai: true });
  });
});
