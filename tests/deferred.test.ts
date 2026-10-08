import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeDomain } from '@/utils/domain';
import { fastDomain, parseList } from '@/utils/listformat';
import { allSites, compileList, evaluate, siteRules } from '@/utils/matcher';

// Subscribed lists are read with their plain `$site=` lines deferred until a result
// from that site turns up. Whatever is deferred, a list must weigh results exactly as
// one read in full.

const both = (text: string) => ({
  eager: compileList('l', parseList(text), false, 'L'),
  lazy: compileList('l', parseList(text, true), false, 'L'),
});

const sorted = (map: Map<string, unknown>) => [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1));

function expectSame(text: string) {
  const { eager, lazy } = both(text);
  expect(lazy.tags).toEqual(eager.tags);
  expect(lazy.lens).toBe(eager.lens);
  expect(lazy.generic).toEqual(eager.generic);
  expect(lazy.byHost).toEqual(eager.byHost);
  // Site by site, as a search page asks, then the whole list, as Settings reads it.
  for (const site of eager.bySite.keys()) expect(siteRules(lazy, site)).toEqual(eager.bySite.get(site));
  expect(sorted(allSites(lazy))).toEqual(sorted(eager.bySite));
  expect(lazy.deferred.size).toBe(0);
}

const TRICKY = `! name: Tricky
! tag: defined | Defined | #3a8a67
$site=a.com,tag=defined
$site=a.com,tag=defined,boost=3 # a comment
/docs/$site=a.com,tag=defined,downrank=2
/a#b/$site=a.com,tag=defined
$site=B.com,tag=defined
$site=www.c.com,tag=defined
$site=rs,tag=defined
$site=0x10.1,tag=defined
$site=d.com,tag=later-defined
$site=e.com,tag=never-defined
$site=f.com,tag=defined,boost=99
$site=f.com,tag=Bad_Id
$site=g.com,site=h.com,tag=defined
$site=i.com,frobnicate,tag=defined
$site=xn--bcher-kva.example,tag=defined
$site=j.com,tag=defined,discard
$site=,tag=defined
$discard
! tag: later-defined | Later | #2f5fae
`;

describe('deferred list rules', () => {
  it('weigh like the list read in full, for tricky lines', () => {
    expect(parseList(TRICKY, true).deferred!.length).toBeGreaterThan(10);
    expectSame(TRICKY);
  });

  it('weigh like the list read in full, for every bundled and generated list', () => {
    for (const dir of ['lists', 'lists/sources']) {
      for (const file of readdirSync(dir).filter((f) => f.endsWith('.anubis'))) expectSame(readFileSync(`${dir}/${file}`, 'utf8'));
    }
  });

  it('are only read for the sites a page asks about', () => {
    const text = ['! tag: t | T | #3a8a67', ...Array.from({ length: 500 }, (_, i) => `$site=s${i}.example,tag=t`)].join('\n');
    const lazy = compileList('l', parseList(text, true), false, 'L');
    expect(lazy.bySite.size).toBe(0);
    const v = evaluate({ url: 'https://www.blog.s7.example/post' }, [lazy], {});
    expect(v.tags).toEqual(['t']);
    expect(lazy.bySite.size).toBe(1);
    expect(lazy.deferred.size).toBe(499);
  });

  it('make up a tag that is never defined, as a full read does', () => {
    const { eager, lazy } = both(TRICKY);
    expect(lazy.tags.map((t) => t.id)).toContain('never-defined');
    expect(lazy.tags).toEqual(eager.tags);
  });

  it('leave other formats to a full read', () => {
    const goggle = '$boost=2,site=a.com\n$downrank=1,site=b.com';
    expect(parseList(goggle, true).deferred ?? []).toHaveLength(0);
    expect(parseList('*://a.com/*\n*://*.b.com/*', true).deferred ?? []).toHaveLength(0);
  });
});

describe('fastDomain', () => {
  it('only answers when a URL would read the domain unchanged', () => {
    for (const s of ['a.com', 'blog.example.co.uk', 'a-b.c-d.org', '-a.com', 'a.b1', '0x10.1', '1.2', '1.2.3.4', 'a.0x1f', 'a.0xg', 'a.123', 'www.a.com', 'xn--bcher-kva.example', 'A.com', 'a..com', 'a.com.', 'com']) {
      const fast = fastDomain(s);
      if (fast !== undefined) expect(normalizeDomain(s)).toBe(fast);
    }
    expect(fastDomain('a.com')).toBe('a.com');
    expect(fastDomain('0x10.1')).toBeUndefined();
    expect(fastDomain('a.0x1f')).toBeUndefined();
    expect(fastDomain('www.a.com')).toBeUndefined();
  });
});
