import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { DOCS_URL } from '@/utils/links';

// The README is a short front page that points into the wiki (docs/), which explains
// Anubis in full. Its feature list mirrors the Features of the wiki's introduction, so
// a feature added to one fails here until the other has it too.

const read = (path: string) => readFileSync(path, 'utf8');
const README = read('README.md');
const INTRO = read('docs/guide/introduction.md');

/** The bullets under a `## heading`, up to the next one. */
function bullets(markdown: string, heading: string): string[] {
  const section = markdown.split(`\n## ${heading}\n`)[1]?.split('\n## ')[0] ?? '';
  return section.split('\n').filter((line) => line.startsWith('- '));
}

/** The feature's name: the bold text at the start of a bullet, without its link or full stop. */
const title = (bullet: string) =>
  /^- \*\*(.+?)\*\*/.exec(bullet)![1]!.replace(/^\[(.+)\]\(.+\)$/, '$1').replace(/\.$/, '');

const links = (markdown: string) => [...markdown.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]!);

/** The docs file a wiki address or a link between wiki pages leads to, like `guide/tags`. */
function wikiPage(link: string, from = ''): string | undefined {
  const path = link.split('#')[0]!;
  if (path.startsWith(DOCS_URL)) return path.slice(DOCS_URL.length) || 'index';
  if (from && path.startsWith('./')) return from + path.slice(2).replace(/\.md$/, '');
  return undefined;
}

const pages = (lines: string[], from = '') =>
  lines.flatMap((line) => links(line).map((link) => wikiPage(link, from))).filter(Boolean).sort();

describe('README', () => {
  it('lists the same features as the wiki introduction, in the same order', () => {
    const readme = bullets(README, 'What it does');
    const intro = bullets(INTRO, 'Features');
    expect(readme.map(title)).toEqual(intro.map(title));
    expect(pages(readme)).toEqual(pages(intro, 'guide/'));
  });

  it('links only to wiki pages that exist', () => {
    const wiki = links(README).filter((link) => link.startsWith(DOCS_URL));
    expect(wiki.length).toBeGreaterThan(0);
    for (const link of wiki) expect(existsSync(`docs/${wikiPage(link)}.md`), link).toBe(true);
  });

  it('links only to files in the repository that exist', () => {
    for (const link of links(README).filter((link) => !/^[a-z]+:/.test(link) && !link.startsWith('#')))
      expect(existsSync(link.split('#')[0]!), link).toBe(true);
  });

  it('points to the wiki for what it explains, rather than repeating it', () => {
    // Engine names, permissions and install steps live on these wiki pages.
    for (const page of ['guide/getting-started', 'guide/search-engines', 'guide/privacy'])
      expect(README).toContain(DOCS_URL + page);
  });
});
