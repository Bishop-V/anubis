import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

// Settings link into the wiki, often to a heading on a page. Moving a page or renaming
// a heading breaks those links in every installed copy, so each one is checked here.

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(`${dir}/${e.name}`) : e.name.endsWith('.ts') ? [`${dir}/${e.name}`] : [],
  );
}

/** Every wiki path the extension links to: `guide('…')`, `helpLink('…'`, and the sections' `help: ['…'`. */
const LINKS = sources('entrypoints').flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(/(?:guide\(|helpLink\(|help: \[)'([^']+)'/g)].map((m) => ({ file, path: m[1]! })),
);

/** The anchor VitePress gives a heading. */
const slug = (heading: string) =>
  heading
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const anchors = (markdown: string) => [...markdown.matchAll(/^#{2,6} (.+)$/gm)].map((m) => slug(m[1]!));

describe('links from settings to the wiki', () => {
  it('finds them', () => {
    expect(LINKS.filter((l) => l.path.includes('#')).length).toBeGreaterThan(3);
  });

  it('lead to pages and headings that exist', () => {
    for (const { file, path } of LINKS) {
      const [page, anchor] = path.split('#');
      const doc = `docs/${page}.md`;
      expect(existsSync(doc), `${file}: ${path}`).toBe(true);
      if (anchor) expect(anchors(readFileSync(doc, 'utf8')), `${file}: ${path}`).toContain(anchor);
    }
  });
});
