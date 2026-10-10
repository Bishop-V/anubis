import { describe, expect, it } from 'vitest';
import { mergeById, mergeLists, mergeValue } from '@/utils/merge';
import { listSites, PERSONAL_HEADER, setSite, setSites, upsertTagDef } from '@/utils/personal';
import { DEFAULT_PERSONAL } from '@/utils/storage';

const list = (...lines: string[]) => `${PERSONAL_HEADER}${lines.join('\n')}\n`;
const sites = (text: string) => Object.fromEntries(listSites(text).map((e) => [e.site, [e.level, ...e.tags].join(' ')]));

describe('merging the personal list', () => {
  const base = list('$site=a.com,discard', '$site=b.com,boost=5');

  it('keeps sites added on both sides, each after the line it followed', () => {
    const local = setSite(base, 'c.com', 'pin', []);
    const remote = setSite(setSite(base, 'd.com', 'lower', []), 'e.com', 'hide', []);
    const merged = mergeLists(base, local, remote, 'local');
    expect(listSites(merged).map((e) => e.site)).toEqual(['a.com', 'b.com', 'd.com', 'e.com', 'c.com']);
    expect(merged.endsWith('\n')).toBe(true);
  });

  it('removes a site removed on one side and left alone on the other', () => {
    const local = setSite(base, 'a.com', 'normal', []);
    expect(sites(mergeLists(base, local, base, 'local'))).toEqual({ 'b.com': 'raise' });
    expect(sites(mergeLists(base, base, local, 'local'))).toEqual({ 'b.com': 'raise' });
  });

  it('combines a ranking changed on one side with a tag added on the other', () => {
    const local = setSite(base, 'b.com', 'hide', []);
    const remote = setSite(base, 'b.com', 'raise', ['forum']);
    expect(sites(mergeLists(base, local, remote, 'local'))['b.com']).toBe('hide forum');
  });

  it('keeps a site explanation when its other-device edit changes the ranking', () => {
    const reason = 'FOSS: the source is published under a free licence';
    const annotated = setSite(base, 'a.com', 'normal', ['foss'], reason);
    const local = setSite(annotated, 'a.com', 'lower', ['foss']);
    const remote = setSite(annotated, 'a.com', 'normal', ['foss', 'docs']);
    const merged = mergeLists(annotated, local, remote, 'local');
    expect(merged).toContain(`# ${reason}`);
    expect(listSites(merged).find((site) => site.site === 'a.com')).toMatchObject({ level: 'lower', tags: ['foss', 'docs'], description: reason });
  });

  it('lets the preferred side win when both change the same site’s ranking', () => {
    const local = setSite(base, 'a.com', 'pin', []);
    const remote = setSite(base, 'a.com', 'lower', []);
    expect(sites(mergeLists(base, local, remote, 'local'))['a.com']).toBe('pin');
    expect(sites(mergeLists(base, local, remote, 'remote'))['a.com']).toBe('lower');
  });

  it('puts a tag defined on the other side in the header, and takes a renamed list', () => {
    const remote = upsertTagDef(base.replace('! name: My list', '! name: Research'), { id: 'slop', label: 'Slop', color: '#aa0000' });
    const merged = mergeLists(base, setSite(base, 'c.com', 'hide', []), remote, 'local');
    const lines = merged.split('\n');
    expect(lines[0]).toBe('! name: Research');
    expect(lines.indexOf('! tag: slop | Slop | #aa0000')).toBeLessThan(lines.findIndex((l) => l.startsWith('$')));
    expect(sites(merged)).toEqual({ 'a.com': 'hide', 'b.com': 'raise', 'c.com': 'hide' });
  });

  it('keeps hand-written rules and comments from both sides', () => {
    const local = `${base}! mine\n/spam/$discard\n`;
    const remote = `${base}||example.org/ads^\n`;
    const merged = mergeLists(base, local, remote, 'local');
    for (const line of ['! mine', '/spam/$discard', '||example.org/ads^']) expect(merged.split('\n')).toContain(line);
  });

  it('gives an untouched install the other side’s list on the first sync', () => {
    const theirs = setSite(DEFAULT_PERSONAL.replace('$site=fandom.com,discard\n', ''), 'x.com', 'pin', []);
    expect(mergeLists(DEFAULT_PERSONAL, DEFAULT_PERSONAL, theirs, 'remote')).toBe(theirs);
    // A site added here before the first sync still stays.
    const mine = setSite(DEFAULT_PERSONAL, 'mine.com', 'raise', []);
    expect(sites(mergeLists(DEFAULT_PERSONAL, mine, theirs, 'remote'))).toEqual({ 'x.com': 'pin', 'mine.com': 'raise' });
  });

  it('handles thousands of new sites from the other side', () => {
    const many = new Map(Array.from({ length: 6000 }, (_, i) => [`s${i}.com`, { level: 'hide' as const, tags: [] }]));
    const remote = setSites(base, many);
    const local = setSites(base, new Map([...many].filter((_, i) => i % 2)));
    const started = performance.now();
    expect(listSites(mergeLists(base, local, remote, 'local'))).toHaveLength(6002);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

describe('merging settings and subscriptions', () => {
  it('merges objects key by key, nested ones too', () => {
    const base = { theme: 'auto', engines: { google: true, bing: true } };
    const local = { theme: 'dark', engines: { google: true, bing: false } };
    const remote = { theme: 'auto', engines: { google: false, bing: true } };
    expect(mergeValue(base, local, remote, 'local')).toEqual({ theme: 'dark', engines: { google: false, bing: false } });
  });

  it('merges subscriptions per list: added on one side, removed on the other', () => {
    const a = { id: 'a', url: 'https://a', enabled: true, addedAt: 0 };
    const b = { id: 'b', url: 'https://b', enabled: true, addedAt: 0 };
    const c = { id: 'c', url: 'https://c', enabled: true, addedAt: 0 };
    expect(mergeById([a, b], [a, b, c], [a, { ...b, enabled: false }], 'local')).toEqual([a, { ...b, enabled: false }, c]);
    expect(mergeById([a, b], [a], [a, b, c], 'local')).toEqual([a, c]);
  });
});
