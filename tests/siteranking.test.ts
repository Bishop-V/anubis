import { parseHTML } from 'linkedom';
import { beforeAll, describe, expect, it } from 'vitest';
import { TAG_CHOICES, type Level, type Reason, type Verdict } from '@/utils/matcher';
import { displayLevel, PERSONAL_NAME, type PersonalLevel, type SiteEntry } from '@/utils/personal';
import { installEnglish } from './english';

// The ranking chips are translated as utils/icons loads.
installEnglish();
const { fromListsClass, nextLevel, rankingHint, rankingOf, tagOrder, tagPicker } = await import('@/utils/siteranking');

const verdict = (level: Level, reasons: Partial<Reason>[] = [], extra: Partial<Verdict> = {}): Verdict => ({
  level,
  score: 0,
  hidden: level === 'hide',
  tags: [],
  tagSources: {},
  tagEffects: {},
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
    expect(rankingOf(undefined, verdict('lower'))).toEqual({ personal: undefined, pressed: undefined, steps: 1, fromLists: 'lower' });
    expect(rankingOf(site('normal'), verdict('lower'))).toMatchObject({ pressed: undefined, fromLists: 'lower' });
  });

  it('presses your ranking, and Normal for an allow', () => {
    expect(rankingOf(site('pin'), verdict('hide'))).toMatchObject({ pressed: 'pin' });
    expect(rankingOf(site('allow'), verdict('hide'))).toMatchObject({ personal: 'allow', pressed: 'normal' });
  });
});

describe('nextLevel', () => {
  it('takes your ranking back with Normal, and leaves the weighing to tags and lists', () => {
    expect(nextLevel('normal', rankingOf(undefined, verdict('lower')))).toBe('normal');
    expect(nextLevel('normal', rankingOf(site('raise'), verdict('raise')))).toBe('normal');
    expect(nextLevel('normal', rankingOf(site('lower2'), verdict('lower')))).toBe('normal');
    expect(nextLevel('normal', rankingOf(site('allow'), verdict('raise')))).toBe('normal');
  });

  it('answers lists that hide a site you have not ranked with an allow', () => {
    expect(nextLevel('normal', rankingOf(undefined, verdict('hide')))).toBe('allow');
  });

  it('presses a ranking, and pressing it again clears it', () => {
    expect(nextLevel('raise', rankingOf(undefined, verdict('normal')))).toBe('raise');
    expect(nextLevel('hide', rankingOf(site('raise'), verdict('normal')))).toBe('hide');
    expect(nextLevel('pin', rankingOf(site('pin'), verdict('normal')))).toBe('normal');
  });

  it('moves a site twice as far when Raise or Lower is pressed twice, then takes it back', () => {
    expect(nextLevel('raise', rankingOf(site('raise'), verdict('normal')))).toBe('raise2');
    expect(nextLevel('raise', rankingOf(site('raise2'), verdict('normal')))).toBe('normal');
    expect(nextLevel('lower', rankingOf(site('lower'), verdict('normal')))).toBe('lower2');
    expect(nextLevel('lower', rankingOf(site('lower2'), verdict('normal')))).toBe('normal');
    expect(rankingOf(site('lower2'), verdict('normal'))).toMatchObject({ pressed: 'lower', steps: 2 });
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

  it('says when your tag settings add to your ranking', () => {
    const tags = verdict('lower', [{ listId: TAG_CHOICES }]);
    expect(rankingHint('example.com', verdict('normal'), rankingOf(site('raise'), verdict('normal')), tags)).toBe(
      'Your choice for example.com, on every search, added to your tag settings.',
    );
    expect(rankingHint('example.com', tags, rankingOf(site('hide'), tags), tags)).toBe('Your choice for example.com, on every search.');
  });

  it('names each list once, and your tag settings last', () => {
    const baseline = verdict('lower', [{ listId: TAG_CHOICES }, { list: 'Spam' }, { list: 'Spam' }, { list: 'Farms' }]);
    const text = hint(undefined, baseline);
    expect(text).toMatch(/Spam.*Farms.*your tag settings/);
    expect(text.match(/Spam/g)).toHaveLength(1);
  });
});

describe('tagOrder', () => {
  it('puts your tags first, then those from lists, then the rest, each in the order the tags come in', () => {
    // collectTags gives them in your order, then by name: here b was moved before a.
    const tags = new Map(['b', 'a', 'c', 'd'].map((id) => [id, { label: id.toUpperCase() }]));
    const v = verdict('normal', [], { tags: ['c', 'd'], tagSources: { c: ['A list'], d: [PERSONAL_NAME] } });
    const { mine, fromList, ids } = tagOrder(tags, site('normal', ['d']), v);
    expect(ids).toEqual(['d', 'c', 'b', 'a']);
    expect([...mine]).toEqual(['d']);
    expect([...fromList]).toEqual(['c']);
  });
});

describe('tagPicker', () => {
  const { document, Node } = parseHTML('<html><body></body></html>');
  // No layout here: each tag is given a row, four to a row, and the picker a width.
  const perRow = 4;
  const draw = (pressed: string[]) => {
    let n = 0;
    return (id: string) => {
      const el = document.createElement('button') as unknown as HTMLElement;
      el.textContent = id;
      if (pressed.includes(id)) el.setAttribute('aria-pressed', 'true');
      const row = Math.floor(n++ / perRow);
      el.getBoundingClientRect = () => ({ top: row * 30, width: 40 }) as DOMRect;
      return el;
    };
  };
  const ids = Array.from({ length: 12 }, (_, i) => `t${i}`);
  const hiddenOf = (root: HTMLElement) => [...root.querySelectorAll('button')].filter((b) => b.hidden && b.textContent?.startsWith('t')).length;
  const lay = (picker: HTMLElement) => {
    picker.getBoundingClientRect = () => ({ width: 300 }) as DOMRect;
    observed.forEach((cb) => cb());
  };
  const observed: (() => void)[] = [];

  beforeAll(() => {
    class FakeObserver {
      constructor(private cb: () => void) {}
      observe() {
        observed.push(this.cb);
      }
    }
    Object.assign(globalThis, { document, Node, ResizeObserver: FakeObserver });
  });

  it('shows every tag when they fit in two rows', () => {
    const picker = tagPicker(ids.slice(0, 8), new Set(), draw([]))!;
    lay(picker);
    expect(picker.querySelector('.tags-more')!.hasAttribute('hidden')).toBe(true);
    expect(hiddenOf(picker)).toBe(0);
  });

  it('folds the rows past the second behind a button that shows and hides them', () => {
    const picker = tagPicker(ids, new Set(), draw([]))!;
    lay(picker);
    const more = picker.querySelector('.tags-more') as HTMLElement;
    expect(more.textContent).toBe('Show 4 more tags');
    expect(hiddenOf(picker)).toBe(4);
    more.click();
    expect(hiddenOf(picker)).toBe(0);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    more.click();
    expect(hiddenOf(picker)).toBe(4);
  });

  it('keeps a tag on the site in view', () => {
    const picker = tagPicker(ids, new Set(), draw(['t10']))!;
    lay(picker);
    expect(hiddenOf(picker)).toBe(3);
  });
});
