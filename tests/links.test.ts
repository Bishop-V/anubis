import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { DOCS_URL, guide, TRANSLATED_PAGES } from '@/utils/links';

// The extension opens the wiki in the interface's language where the wiki has it
// (docs/<language>/), and in English everywhere else.

describe('wiki links by language', () => {
  it('stay English for English and for languages with no wiki', () => {
    expect(guide('guide/lists#what-lists-work')).toBe(`${DOCS_URL}guide/lists#what-lists-work`);
    expect(guide('guide/lists', 'de')).toBe(`${DOCS_URL}guide/lists`);
  });

  it('open the translated page, without a heading that only exists in English', () => {
    expect(guide('', 'vi')).toBe(`${DOCS_URL}vi/`);
    expect(guide('guide/sync#browser-sync', 'vi')).toBe(`${DOCS_URL}vi/guide/sync`);
  });

  it('keep the pages that have no translation in English', () => {
    expect(guide('list-format', 'vi')).toBe(`${DOCS_URL}list-format`);
    expect(guide('subscribe', 'vi')).toBe(`${DOCS_URL}subscribe`);
  });

  it('list exactly the pages each translation has', () => {
    for (const [language, pages] of Object.entries(TRANSLATED_PAGES)) {
      for (const page of pages) expect(existsSync(`docs/${language}/${page || 'index'}.md`), `${language}/${page}`).toBe(true);
      const files = readdirSync(`docs/${language}/guide`).map((f) => `guide/${f.replace(/\.md$/, '')}`);
      expect(files.sort()).toEqual(pages.filter(Boolean).sort());
    }
  });
});
