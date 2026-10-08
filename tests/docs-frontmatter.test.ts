import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

// The wiki's pages carry text in YAML front matter (the home page's sections). In YAML
// an unquoted value with ": " in it is a key and a value, not a sentence, and the page
// then shows nothing where the sentence should be.

function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name.startsWith('.') || e.name === 'node_modules'
      ? []
      : e.isDirectory()
        ? pages(`${dir}/${e.name}`)
        : e.name.endsWith('.md')
          ? [`${dir}/${e.name}`]
          : [],
  );
}

/** Front matter lines whose unquoted text has a ": " that YAML would read as a key. */
function splitLines(markdown: string): string[] {
  const front = /^---\n([\s\S]*?)\n---/.exec(markdown)?.[1] ?? '';
  return front.split('\n').filter((line) => {
    // A list item, a key, or both (`- text: Get started`); the rest is the value.
    const m = /^\s*(- )?([\w-]+: )?(.*)$/.exec(line)!;
    const value = m[3]!.trim();
    return !!(m[1] || m[2]) && !/^["'|>[{]/.test(value) && value.includes(': ');
  });
}

describe('wiki front matter', () => {
  it('quotes any text with a colon in it', () => {
    const bad = pages('docs').flatMap((file) => splitLines(readFileSync(file, 'utf8')).map((line) => `${file}: ${line.trim()}`));
    expect(bad).toEqual([]);
  });

  it('notices an unquoted colon', () => {
    expect(splitLines('---\ndetails:\n  - Mojeek is experimental: not tried yet.\n  - "Quoted: fine."\n  - text: Plain\ntitle: A key: and more\n---\n')).toHaveLength(2);
  });
});
