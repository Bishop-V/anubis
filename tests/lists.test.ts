import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseList } from '@/utils/listformat';
import { BUNDLED_DIRECTORY, BUILTIN_TEXT } from '@/utils/subscriptions';

// Every list in lists/ is published from this repo, so it must parse cleanly.
describe('bundled lists', () => {
  const files = readdirSync('lists').filter((f) => f.endsWith('.anubis'));

  it.each(files)('%s parses without errors', (file) => {
    const list = parseList(readFileSync(`lists/${file}`, 'utf8'));
    expect(list.errors).toEqual([]);
    expect(list.format).toBe('anubis');
    expect(list.meta.name).toBeTruthy();
    expect(list.meta.description).toBeTruthy();
    expect(list.meta.issues).toMatch(/^https:\/\//);
    expect(list.rules.length).toBeGreaterThan(file === 'foss-tools.anubis' ? 1 : 5);
    // Every tag a rule uses is defined with a label, not just generated.
    for (const tag of list.tags) expect(tag.label).not.toBe(tag.id);
  });

  it('has a directory entry for each built-in list', () => {
    for (const entry of BUNDLED_DIRECTORY.filter((e) => e.builtin)) {
      expect(BUILTIN_TEXT[`builtin:${entry.id}`]).toBeTruthy();
      expect(entry.url).toMatch(new RegExp(`/lists/${entry.id}\\.anubis$`));
    }
  });

  it('bundles FOSS and AI slop tags with the requested FOSS tools', () => {
    const text = readFileSync('lists/foss-tools.anubis', 'utf8');
    const list = parseList(text);
    expect(list.tags).toContainEqual(expect.objectContaining({ id: 'foss', label: 'FOSS' }));
    expect(list.tags).toContainEqual(
      expect.objectContaining({ id: 'ai-slop', label: 'AI slop', description: 'Low-quality AI-generated content.' }),
    );
    expect(
      list.rules.map(({ site, tags, boost, discard, pin }) => ({ site, tags, boost, discard, pin })),
    ).toEqual([
      { site: 'librespeed.org', tags: ['foss'], boost: 0, discard: false, pin: false },
      { site: 'cobalt.tools', tags: ['foss'], boost: 0, discard: false, pin: false },
    ]);
    expect(BUNDLED_DIRECTORY.find((entry) => entry.id === 'foss-tools')).toMatchObject({ builtin: true, default: true });
    const taggedSiteLines = text.split(/\r?\n/).filter((line) => line.startsWith('$site=') && line.includes(',tag='));
    expect(taggedSiteLines).toHaveLength(2);
    for (const line of taggedSiteLines) expect(line).toMatch(/\s+# .+\S/);
  });

  it('has unique directory ids and https URLs', () => {
    const ids = BUNDLED_DIRECTORY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of BUNDLED_DIRECTORY) expect(e.url).toMatch(/^https:\/\//);
  });
});
