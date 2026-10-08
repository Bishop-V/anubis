import { describe, expect, it } from 'vitest';
import { TAG_CHOICES, type Level, type Reason, type Verdict } from '@/utils/matcher';
import { displayLevel, PERSONAL_NAME, type PersonalLevel, type SiteEntry } from '@/utils/personal';
import { installEnglish } from './english';

// The ranking chips are translated as utils/icons loads.
installEnglish();
const { fromListsClass, nextLevel, rankingHint, rankingOf, tagOrder } = await import('@/utils/siteranking');

const verdict = (level: Level, reasons: Partial<Reason>[] = [], extra: Partial<Verdict> = {}): Verdict => ({
  level,
  score: 0,
  hidden: level === 'hide',
  tags: [],
  tagSources: {},
  reasons: reasons.map((r) => ({ list: 'A list', listId: 'a', personal: false, text: '', report: '', ...r })),
  ...extra,
});
const site = (level: PersonalLevel, tags: string[] = []): SiteEntry => ({ site: 'example.com', level, tags, line: 0 });

describe('displayLevel', () => {
  it('shows an allow as Normal and everything else as itself', () => {
    expect(displayLevel('allow')).toBe('normal');
    expect(displayLevel('lower')).toBe('lower');
  });
});

describe('rankingOf', () => {
  it('follows the lists when you have no ranking for the site', () => {
    expect(rankingOf(undefined, verdict('lower'))).toEqual({ personal: undefined, pressed: undefined, fromLists: 'lower', shown: 'lower' });
    expect(rankingOf(site('normal'), verdict('lower'))).toMatchObject({ pressed: undefined, shown: 'lower' });
  });

  it('presses your ranking, and Normal for an allow', () => {
    expect(rankingOf(site('pin'), verdict('hide'))).toMatchObject({ pressed: 'pin', shown: 'pin' });
    expect(rankingOf(site('allow'), verdict('hide'))).toMatchObject({ personal: 'allow', pressed: 'normal', shown: 'normal' });
  });
});

describe('nextLevel', () => {
  it('stores Normal as an allow when the lists rank the site, so it beats them', () => {
    expect(nextLevel('normal', rankingOf(undefined, verdict('lower')))).toBe('allow');
    expect(nextLevel('normal', rankingOf(undefined, verdict('normal')))).toBe('normal');
  });

  it('presses a ranking, and pressing it again clears it', () => {
    expect(nextLevel('raise', rankingOf(undefined, verdict('normal')))).toBe('raise');
    expect(nextLevel('raise', rankingOf(site('raise'), verdict('normal')))).toBe('normal');
    expect(nextLevel('hide', rankingOf(site('raise'), verdict('normal')))).toBe('hide');
  });
});

describe('fromListsClass', () => {
  it("marks the lists' ranking only while you haven't pressed one", () => {
    expect(fromListsClass('lower', rankingOf(undefined, verdict('lower')))).toBe(' from-list');
    expect(fromListsClass('raise', rankingOf(undefined, verdict('lower')))).toBe('');
    expect(fromListsClass('normal', rankingOf(undefined, verdict('normal')))).toBe('');
    expect(fromListsClass('lower', rankingOf(site('pin'), verdict('lower')))).toBe('');
  });
});

describe('rankingHint', () => {
  const hint = (entry: SiteEntry | undefined, baseline: Verdict) => rankingHint('example.com', baseline, rankingOf(entry, baseline));

  it('says where the ranking comes from', () => {
    expect(hint(site('allow'), verdict('hide'))).toBe('Normal, whatever your lists say.');
    expect(hint(site('pin'), verdict('normal'))).toBe('Your choice for example.com, on every search.');
    expect(hint(undefined, verdict('normal'))).toBe('Your choice applies on every search.');
  });

  it('says when your tag settings add to your ranking, or hide the site anyway', () => {
    const tags = verdict('lower', [{ listId: TAG_CHOICES }]);
    expect(rankingHint('example.com', verdict('normal'), rankingOf(site('raise'), verdict('normal')), tags)).toBe(
      'Your choice for example.com, on every search, added to your tag settings.',
    );
    const hidden = verdict('hide', [], { hiddenBy: { kind: 'tag', name: 'slop' } });
    expect(rankingHint('example.com', hidden, rankingOf(site('pin'), hidden), hidden)).toMatch(/^Hidden by your tag settings/);
    expect(rankingHint('example.com', hidden, rankingOf(site('hide'), hidden), hidden)).toBe('Your choice for example.com, on every search.');
  });

  it('names each list once, and your tag settings last', () => {
    const baseline = verdict('lower', [{ listId: TAG_CHOICES }, { list: 'Spam' }, { list: 'Spam' }, { list: 'Farms' }]);
    const text = hint(undefined, baseline);
    expect(text).toMatch(/Spam.*Farms.*your tag settings/);
    expect(text.match(/Spam/g)).toHaveLength(1);
  });
});

describe('tagOrder', () => {
  it('puts your tags first, then those from lists, then the rest, each by label', () => {
    const tags = new Map(['d', 'c', 'b', 'a'].map((id) => [id, { label: id.toUpperCase() }]));
    const v = verdict('normal', [], { tags: ['c', 'd'], tagSources: { c: ['A list'], d: [PERSONAL_NAME] } });
    const { mine, fromList, ids } = tagOrder(tags, site('normal', ['d']), v);
    expect(ids).toEqual(['d', 'c', 'a', 'b']);
    expect([...mine]).toEqual(['d']);
    expect([...fromList]).toEqual(['c']);
  });
});
