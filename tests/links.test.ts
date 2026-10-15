import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { DOCS_URL, guide, TRANSLATED_PAGES, WIKI_FOLDERS } from '@/utils/links';

// The extension opens the wiki in the interface's language where the wiki has it
// (docs/<language>/), and in English everywhere else.

describe('wiki links by language', () => {
  it('stay English for English and for languages with no wiki', () => {
    expect(guide('guide/lists#what-lists-work')).toBe(`${DOCS_URL}guide/lists#what-lists-work`);
    expect(guide('guide/lists', 'ar')).toBe(`${DOCS_URL}guide/lists`);
  });

  it('open the translated page, without a heading that only exists in English', () => {
    expect(guide('', 'vi')).toBe(`${DOCS_URL}vi/`);
    expect(guide('guide/sync#browser-sync', 'vi')).toBe(`${DOCS_URL}vi/guide/sync`);
  });

  it('keep the pages that have no translation in English', () => {
    expect(guide('list-format', 'vi')).toBe(`${DOCS_URL}list-format`);
    expect(guide('subscribe', 'vi')).toBe(`${DOCS_URL}subscribe`);
  });

  it('open the folder each language lives in', () => {
    expect(guide('guide/ranking', 'zh_TW')).toBe(`${DOCS_URL}zh-tw/guide/ranking`);
    expect(guide('', 'zh_CN')).toBe(`${DOCS_URL}zh-cn/`);
    expect(guide('guide/tags#whose-tag-is-it', 'de')).toBe(`${DOCS_URL}de/guide/tags`);
  });

  it('list exactly the pages each translation has', () => {
    for (const folder of Object.values(WIKI_FOLDERS)) {
      for (const page of TRANSLATED_PAGES) expect(existsSync(`docs/${folder}/${page || 'index'}.md`), `${folder}/${page}`).toBe(true);
      const files = readdirSync(`docs/${folder}/guide`).map((f) => `guide/${f.replace(/\.md$/, '')}`);
      expect(files.sort()).toEqual(TRANSLATED_PAGES.filter(Boolean).slice().sort());
    }
  });
});
