import { describe, expect, it } from 'vitest';
import { parseList } from '@/utils/listformat';
import { compileList, evaluate, PERSONAL_STRENGTH, type TagPref } from '@/utils/matcher';

const list = (id: string, text: string, personal = false) => compileList(id, parseList(text), personal, id);
const weigh = (url: string, lists: ReturnType<typeof list>[], prefs: Record<string, TagPref> = {}, title = '') =>
  evaluate({ url, title }, lists, prefs);

describe('evaluate', () => {
  it('moves a site twice as far for a boost or downrank of ten, from your own list', () => {
    const me = list('me', '$site=a.com,boost=10\n$site=b.com,downrank=10\n$site=c.com,boost=5\n$site=d.com,boost=3', true);
    const at = (host: string) => weigh(`https://${host}/`, [me]).score;
    expect([at('a.com'), at('b.com'), at('c.com'), at('d.com')]).toEqual([2 * PERSONAL_STRENGTH, -2 * PERSONAL_STRENGTH, PERSONAL_STRENGTH, PERSONAL_STRENGTH]);
  });

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
    // Each reason carries the rule behind it, for reporting it to the list.
    expect(v.reasons.map((r) => r.rule)).toEqual([
      { line: 1, raw: '$boost=2,site=x.com' },
      { line: 1, raw: '$downrank=5,site=x.com' },
    ]);
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

  it('adds up Raise and Lower tags, counting each tag once', () => {
    const a = list('A', '! tag: docs | Official docs\n! tag: reference | Reference\n$site=x.com,tag=docs,tag=reference,boost=1');
    const b = list('B', '! tag: tutorial | Great tutorial\n! tag: paywall | Paywall\n$site=x.com,tag=docs,tag=tutorial\n$site=y.com,tag=docs,tag=reference,tag=paywall');
    const up = { docs: { action: 'raise' }, reference: { action: 'raise' }, tutorial: { action: 'raise' } } as const;
    // Three raises (docs from both lists counts once): 15 places; the lists' own boost gives way.
    expect(weigh('https://x.com/', [a, b], up)).toMatchObject({ level: 'raise', score: 3 * PERSONAL_STRENGTH });
    // Two raises and a lower make one raise.
    const mixed = weigh('https://y.com/', [b, a], { ...up, paywall: { action: 'lower' } });
    expect(mixed).toMatchObject({ level: 'raise', score: PERSONAL_STRENGTH });
    expect(mixed.reasons.at(-1)).toMatchObject({
      list: 'Your tag settings',
      text: 'raise it by 5 each for “Official docs” and “Reference” and lower it by 5 for “Paywall”, so it moves 5 places up',
    });
    // One raise and one lower cancel out; a Hide tag still hides.
    expect(weigh('https://y.com/', [b], { docs: { action: 'raise' }, paywall: { action: 'lower' } })).toMatchObject({ level: 'normal', score: 0 });
    expect(weigh('https://y.com/', [b], { ...up, paywall: { action: 'hide' } })).toMatchObject({ hidden: true, hiddenBy: { kind: 'tag', name: 'paywall' } });
    // Your own ranking for the site adds to them: two raises and your lower make one raise.
    const me = list('me', '$site=y.com,downrank=5', true);
    const own = weigh('https://y.com/', [me, b], up);
    expect(own).toMatchObject({ level: 'raise', score: PERSONAL_STRENGTH });
    expect(own.reasons.some((r) => r.list === 'Your tag settings')).toBe(true);
  });

  it('adds your own ranking to your tag choices instead of replacing them', () => {
    const sub = list('Wikis', '! tag: elsewhere | Independent wiki elsewhere\n$site=terraria.fandom.com,tag=elsewhere,downrank=3\n$site=b.com,downrank=3');
    const me = list('me', '$site=fandom.com,allow\n$site=r.fandom.com,boost=5\n$site=p.fandom.com,pin\n$site=h.fandom.com,discard\n$site=b.com,boost=5', true);
    const prefs = { elsewhere: { action: 'lower' } } as const;
    const at = (host: string, p: Record<string, TagPref> = prefs) =>
      weigh(`https://${host}/`, [me, list('Wikis', `! tag: elsewhere | Independent wiki elsewhere\n$site=${host},tag=elsewhere`)], p);
    // Kept at Normal: the Lower tag still lowers it, and Why says so.
    const kept = weigh('https://terraria.fandom.com/', [me, sub], prefs);
    expect(kept).toMatchObject({ level: 'lower', score: -PERSONAL_STRENGTH, hidden: false });
    expect(kept.reasons.at(-1)).toMatchObject({ list: 'Your tag settings' });
    // Raised with a Lower tag: they cancel out. With a Raise tag: they add up.
    expect(at('r.fandom.com')).toMatchObject({ level: 'normal', score: 0 });
    expect(at('r.fandom.com', { elsewhere: { action: 'raise' } })).toMatchObject({ level: 'raise', score: 2 * PERSONAL_STRENGTH });
    // A pin stays a pin; your ranking beats a Hide tag; your Hide hides whatever the tags say.
    expect(at('p.fandom.com')).toMatchObject({ level: 'pin', hidden: false });
    const rescued = at('r.fandom.com', { elsewhere: { action: 'hide' } });
    expect(rescued).toMatchObject({ level: 'raise', score: PERSONAL_STRENGTH, hidden: false, tagEffects: {} });
    expect(rescued.reasons.some((r) => r.list === 'Your tag settings')).toBe(false);
    expect(at('h.fandom.com', { elsewhere: { action: 'raise' } })).toMatchObject({ level: 'hide', hiddenBy: { kind: 'personal' }, tagEffects: {} });
    // The lists' own instructions still give way to your ranking.
    expect(weigh('https://b.com/', [me, sub])).toMatchObject({ level: 'raise', score: PERSONAL_STRENGTH });
  });

  it('pins a result carrying a tag set to Pin, with your own ranking and the other tags on top', () => {
    const sub = list('Docs', '! tag: docs | Official docs\n! tag: paywall | Paywalled\n$site=a.com,tag=docs,tag=paywall,downrank=3\n$site=b.com,tag=docs');
    const pin = { docs: { action: 'pin' } } as const;
    const a = weigh('https://a.com/', [sub], { ...pin, paywall: { action: 'lower' } });
    expect(a).toMatchObject({ level: 'pin', hidden: false, tagEffects: { docs: 'pin', paywall: 'lower' } });
    // Among pinned results, the Lower tag still counts.
    expect(a.score).toBeLessThan(weigh('https://b.com/', [sub], pin).score);
    expect(a.reasons.at(-1)).toMatchObject({ list: 'Your tag settings', text: 'pin it for “Official docs” and lower it by 5 for “Paywalled”' });
    // A Hide tag still hides it; your own ranking adds to the pin; your own Hide hides.
    expect(weigh('https://a.com/', [sub], { ...pin, paywall: { action: 'hide' } })).toMatchObject({ level: 'hide', hidden: true });
    const me = list('me', '$site=b.com,downrank=5\n$site=a.com,discard', true);
    expect(weigh('https://b.com/', [me, sub], pin)).toMatchObject({ level: 'pin', tagEffects: { docs: 'pin' } });
    expect(weigh('https://a.com/', [me, sub], pin)).toMatchObject({ level: 'hide', hiddenBy: { kind: 'personal' } });
  });

  it('says what each tag does to the result', () => {
    const sub = list('Wikis', '$site=a.com,tag=indie,boost=2\n$site=a.com,tag=docs\n$site=b.com,tag=farm,tag=slop,downrank=2\n$site=c.com,tag=slop,discard');
    // Following the list: the rule's own effect. Your choice: the choice. A tag that does neither: nothing.
    expect(weigh('https://a.com/', [sub]).tagEffects).toEqual({ indie: 'raise' });
    expect(weigh('https://b.com/', [sub]).tagEffects).toEqual({ farm: 'lower', slop: 'lower' });
    expect(weigh('https://c.com/', [sub]).tagEffects).toEqual({ slop: 'hide' });
    // A choice for one tag on a rule leaves the rule's own boost out, so its other tags do nothing.
    expect(weigh('https://b.com/', [sub], { slop: { action: 'raise' } }).tagEffects).toEqual({ slop: 'raise' });
    expect(weigh('https://a.com/', [sub], { docs: { action: 'hide' }, indie: { action: 'label' } }).tagEffects).toEqual({ docs: 'hide' });
    // Your own ranking keeps only your Raise and Lower tags.
    const me = list('me', '$site=a.com,boost=5', true);
    expect(weigh('https://a.com/', [me, sub], { docs: { action: 'lower' } }).tagEffects).toEqual({ docs: 'lower' });
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

  it('says why a result is hidden', () => {
    const me = list('Your list', '$site=a.com,discard\n! tag: meh | Meh\n$site=b.com,tag=meh', true);
    const sub = list('Copycats', '$discard,site=c.com');
    const lens = list('Tech blogs', '$discard\n$boost=1,site=d.com');
    expect(weigh('https://a.com/', [me, sub]).hiddenBy).toEqual({ kind: 'personal', name: 'Your list' });
    expect(weigh('https://b.com/', [me, sub], { meh: { action: 'hide' } }).hiddenBy).toEqual({ kind: 'tag', name: 'meh' });
    expect(weigh('https://c.com/', [me, sub]).hiddenBy).toEqual({ kind: 'list', name: 'Copycats' });
    expect(weigh('https://e.com/', [me, lens]).hiddenBy).toEqual({ kind: 'lens', name: 'Tech blogs' });
    expect(weigh('https://d.com/', [me, lens]).hiddenBy).toBeUndefined();
  });

  it('survives unparseable URLs', () => {
    expect(weigh('not a url', [list('l', '$discard,site=a.com')]).level).toBe('normal');
  });
});
