import { describe, expect, it } from 'vitest';
import { parseList } from '@/utils/listformat';
import { compileList, evaluate, PERSONAL_STRENGTH, type TagPref } from '@/utils/matcher';

const list = (id: string, text: string, personal = false) => compileList(id, parseList(text), personal, id);
const weigh = (url: string, lists: ReturnType<typeof list>[], prefs: Record<string, TagPref> = {}, title = '') =>
  evaluate({ url, title }, lists, prefs);

describe('evaluate', () => {
  it('matches a site and its subdomains, with or without www', () => {
    const l = list('l', '$discard,site=fandom.com');
    expect(weigh('https://harrypotter.fandom.com/wiki/x', [l]).hidden).toBe(true);
    expect(weigh('https://www.fandom.com/', [l]).hidden).toBe(true);
    expect(weigh('https://notfandom.com/', [l]).hidden).toBe(false);
  });

  it('applies Goggles precedence inside one list: discard > boost > downrank', () => {
    const l = list('l', '$downrank=4,site=a.com\n$boost=2,site=a.com');
    expect(weigh('https://a.com/', [l]).score).toBe(2);
    const d = list('d', '$boost=5,site=a.com\n/spam/$discard,site=a.com');
    expect(weigh('https://a.com/spam/1', [d]).hidden).toBe(true);
    expect(weigh('https://a.com/ok', [d]).score).toBe(5);
  });

  it('adds up scores across lists', () => {
    const a = list('a', '$boost=2,site=x.com');
    const b = list('b', '$downrank=5,site=x.com');
    const v = weigh('https://x.com/', [a, b]);
    expect(v.score).toBe(-3);
    expect(v.level).toBe('lower');
    expect(v.reasons.map((r) => r.list)).toEqual(['a', 'b']);
  });

  it('collects tags with their sources', () => {
    const a = list('Docs', '! tag: docs | Docs\n$site=mdn.dev,tag=docs');
    const b = list('Other', '$site=mdn.dev,tag=docs,tag=reference');
    const v = weigh('https://mdn.dev/', [a, b]);
    expect(v.tags).toEqual(['docs', 'reference']);
    expect(v.tagSources.docs).toEqual(['Docs', 'Other']);
    expect(v.level).toBe('normal');
  });

  it('lets the personal list win over every subscription', () => {
    const me = list('me', '$site=a.com,pin\n$site=b.com,allow\n$site=c.com,discard', true);
    const sub = list('sub', '$discard,site=a.com\n$discard,site=b.com\n$boost=9,site=c.com');
    expect(weigh('https://a.com/', [me, sub])).toMatchObject({ level: 'pin', hidden: false });
    expect(weigh('https://b.com/', [me, sub])).toMatchObject({ level: 'normal', hidden: false, score: 0 });
    expect(weigh('https://c.com/', [me, sub])).toMatchObject({ level: 'hide', hidden: true });
  });

  it('uses the most specific personal rule', () => {
    const me = list('me', '$site=fandom.com,discard\n$site=good.fandom.com,boost=5', true);
    expect(weigh('https://good.fandom.com/', [me]).level).toBe('raise');
    expect(weigh('https://bad.fandom.com/', [me]).level).toBe('hide');
  });

  it('applies tag preferences over the lists’ own actions', () => {
    const sub = list('sub', '$site=slop.ai,tag=ai-slop,downrank=1\n$site=paper.io,tag=paywall');
    expect(weigh('https://slop.ai/', [sub], { 'ai-slop': { action: 'hide' } }).hidden).toBe(true);
    expect(weigh('https://slop.ai/', [sub], { 'ai-slop': { action: 'label' } }).score).toBe(0);
    expect(weigh('https://paper.io/', [sub], { paywall: { action: 'lower' } }).score).toBe(-PERSONAL_STRENGTH);
    const hl = weigh('https://paper.io/', [sub], { paywall: { action: 'highlight' } });
    expect(hl.highlight).toBe('paywall');
  });

  it('applies tag preferences to the user’s own tags too', () => {
    const me = list('me', '! tag: meh | Meh\n$site=x.com,tag=meh', true);
    expect(weigh('https://x.com/', [me], { meh: { action: 'hide' } }).hidden).toBe(true);
  });

  it('discards what a lens doesn’t mention', () => {
    const lens = list('lens', '$discard\n$boost=3,site=blog.dev');
    expect(weigh('https://blog.dev/post', [lens])).toMatchObject({ hidden: false, score: 3 });
    expect(weigh('https://random.com/', [lens]).hidden).toBe(true);
  });

  it('matches titles with $intitle', () => {
    const l = list('l', 'sponsored$intitle,discard');
    expect(weigh('https://a.com/', [l], {}, 'A sponsored post').hidden).toBe(true);
    expect(weigh('https://a.com/', [l], {}, 'A post').hidden).toBe(false);
  });

  it('turns a list pin into the strongest boost', () => {
    const l = list('l', '$site=a.com,pin');
    expect(weigh('https://a.com/', [l])).toMatchObject({ level: 'raise', score: 10 });
  });

  it('survives unparseable URLs', () => {
    expect(weigh('not a url', [list('l', '$discard,site=a.com')]).level).toBe('normal');
  });
});
