import { describe, expect, it } from 'vitest';
import {
  changeHolds,
  fromBlockedSites,
  getSite,
  keepTagDefs,
  listSites,
  listTagDefs,
  PERSONAL_HEADER,
  recordChange,
  removeTag,
  setSite,
  setSiteLevel,
  tagSite,
  toggleSiteTag,
  undoChange,
  upsertTagDef,
} from '@/utils/personal';
import { parseList } from '@/utils/listformat';
import { compileList, evaluate, listTagCards } from '@/utils/matcher';

const base = `${PERSONAL_HEADER}
! Keep this comment.
/ads/$discard
$site=fandom.com,discard
`;

describe('personal list edits', () => {
  it('writes and reads a Raise or Lower pressed twice', () => {
    const text = setSiteLevel(setSiteLevel('', 'a.com', 'raise2'), 'b.com', 'lower2');
    expect(text).toContain('$site=a.com,boost=10');
    expect(text).toContain('$site=b.com,downrank=10');
    expect(listSites(text).map((e) => e.level)).toEqual(['raise2', 'lower2']);
    expect(setSiteLevel('', 'c.com', 'raise')).toContain('boost=5');
  });

  it('lists simple site lines', () => {
    expect(listSites(base)).toEqual([{ site: 'fandom.com', level: 'hide', tags: [], line: 7 }]);
  });

  it('reads a site written on two lines the way search pages rank it: the first ranking wins', () => {
    const text = `${PERSONAL_HEADER}$site=example.com,pin\n$site=example.com,tag=docs\n$site=example.com,discard\n`;
    const ranked = evaluate({ url: 'https://example.com/' }, [compileList('personal', parseList(text), true)]);
    expect(ranked.level).toBe('pin');
    expect(getSite(text, 'example.com')).toMatchObject({ level: 'pin', tags: ['docs'] });
  });

  it('rewrites a site in place and keeps everything else', () => {
    const next = setSiteLevel(base, 'fandom.com', 'lower');
    expect(next).toContain('! Keep this comment.');
    expect(next).toContain('/ads/$discard');
    expect(next).toContain('$site=fandom.com,downrank=5');
    expect(next).not.toContain('$site=fandom.com,discard');
  });

  it('appends new sites and removes them again', () => {
    const added = setSiteLevel(base, 'mdn.dev', 'pin');
    expect(getSite(added, 'mdn.dev')?.level).toBe('pin');
    const removed = setSiteLevel(added, 'mdn.dev', 'normal');
    expect(getSite(removed, 'mdn.dev')).toBeUndefined();
  });

  it('toggles tags and keeps the level', () => {
    let t = toggleSiteTag(base, 'fandom.com', 'wiki');
    expect(getSite(t, 'fandom.com')).toMatchObject({ level: 'hide', tags: ['wiki'] });
    t = toggleSiteTag(t, 'fandom.com', 'wiki');
    expect(getSite(t, 'fandom.com')).toMatchObject({ level: 'hide', tags: [] });
    // Tag-only entries survive a level reset.
    t = toggleSiteTag(base, 'blog.dev', 'good');
    expect(getSite(t, 'blog.dev')).toMatchObject({ level: 'normal', tags: ['good'] });
  });

  it('writes lines the parser reads back the same way', () => {
    let t = setSite(base, 'a.com', 'raise', ['x', 'y']);
    t = setSite(t, 'b.com', 'allow', []);
    const rules = parseList(t).rules;
    expect(rules.find((r) => r.site === 'a.com')).toMatchObject({ boost: 5, tags: ['x', 'y'] });
    expect(rules.find((r) => r.site === 'b.com')).toMatchObject({ allow: true });
  });

  it('keeps an optional explanation on a tagged site through later edits', () => {
    const reason = 'FOSS: the project publishes its source under a free licence';
    const annotated = setSite(base, 'example.com', 'normal', ['foss'], reason);
    expect(annotated).toContain(`$site=example.com,tag=foss # ${reason}`);
    expect(getSite(annotated, 'example.com')).toMatchObject({ description: reason });
    const reranked = setSiteLevel(annotated, 'example.com', 'raise');
    expect(reranked).toContain(`# ${reason}`);
    expect(parseList(reranked).errors).toEqual([]);
    expect(parseList(reranked).rules.find((rule) => rule.site === 'example.com')).toMatchObject({ tags: ['foss'], boost: 5 });
  });

  it('adds tag definitions after the header and removes them everywhere', () => {
    let t = upsertTagDef(base, { id: 'wiki', label: 'Wiki', color: '#4a86d8' });
    const lines = t.split('\n');
    expect(lines.findIndex((l) => l.startsWith('! tag: wiki'))).toBeLessThan(lines.findIndex((l) => l.startsWith('/ads/')));
    t = upsertTagDef(t, { id: 'wiki', label: 'Wikis', color: '#4a86d8' });
    expect(listTagDefs(t)).toEqual([{ id: 'wiki', label: 'Wikis', color: '#4a86d8', description: undefined }]);
    t = toggleSiteTag(t, 'fandom.com', 'wiki');
    t = removeTag(t, 'wiki');
    expect(listTagDefs(t)).toEqual([]);
    expect(getSite(t, 'fandom.com')?.tags).toEqual([]);
  });

  it('removes a tag that was never defined from the sites that use it', () => {
    let t = toggleSiteTag(base, 'fandom.com', 'forum');
    expect(getSite(t, 'fandom.com')?.tags).toEqual(['forum']);
    t = removeTag(t, 'forum');
    expect(getSite(t, 'fandom.com')?.tags).toEqual([]);
  });

  it('migrates the old block list', () => {
    const t = fromBlockedSites(['fandom.com', 'pinterest.com']);
    expect(listSites(t).map((e) => [e.site, e.level])).toEqual([
      ['fandom.com', 'hide'],
      ['pinterest.com', 'hide'],
    ]);
  });
});

describe('undoing a change from the result menu', () => {
  it('puts a site back as it was', () => {
    const hid = setSiteLevel(base, 'mdn.dev', 'hide');
    const change = recordChange(undefined, 'mdn.dev', base, hid)!;
    expect(change).toMatchObject({ site: 'mdn.dev', before: { level: 'normal', tags: [] }, after: { level: 'hide', tags: [] } });
    expect(undoChange(hid, change)).toBe(base);
  });

  it('merges changes in a row to one site, and forgets them once the site is back where it started', () => {
    const lowered = setSiteLevel(base, 'fandom.com', 'lower');
    let change = recordChange(undefined, 'fandom.com', base, lowered);
    const pinned = setSiteLevel(lowered, 'fandom.com', 'pin');
    change = recordChange(change, 'fandom.com', lowered, pinned);
    expect(change).toMatchObject({ before: { level: 'hide' }, after: { level: 'pin' } });
    expect(getSite(undoChange(pinned, change!), 'fandom.com')?.level).toBe('hide');
    expect(recordChange(change, 'fandom.com', pinned, base)).toBeUndefined();
    // A change to another site starts again.
    const other = setSiteLevel(pinned, 'mdn.dev', 'raise');
    expect(recordChange(change, 'mdn.dev', pinned, other)?.before.level).toBe('normal');
  });

  it('takes out a tag the change defined, unless another site uses it', () => {
    const tagged = toggleSiteTag(upsertTagDef(base, { id: 'wiki', label: 'Wiki', color: '#4a86d8' }), 'fandom.com', 'wiki', true);
    const change = recordChange(undefined, 'fandom.com', base, tagged)!;
    expect(change.newTags).toEqual(['wiki']);
    expect(undoChange(tagged, change)).toBe(base);
    const shared = toggleSiteTag(tagged, 'wiki.dev', 'wiki', true);
    expect(listTagDefs(undoChange(shared, change)).map((t) => t.id)).toEqual(['wiki']);
  });

  it('holds until the site is changed elsewhere', () => {
    const hid = setSiteLevel(base, 'mdn.dev', 'hide');
    const change = recordChange(undefined, 'mdn.dev', base, hid)!;
    expect(changeHolds(change, hid)).toBe(true);
    // The list not reloaded yet.
    expect(changeHolds(change, base)).toBe(true);
    expect(changeHolds(change, setSiteLevel(hid, 'mdn.dev', 'pin'))).toBe(false);
  });
});

describe('tags from lists on your sites', () => {
  const wikis = compileList('wikis', parseList('! tag: indie | Independent wiki | #3fa37a | A wiki run by its community.\n$site=wiki.gg,tag=indie\n$site=x.com,tag=undefined-here\n'));
  const cards = listTagCards([wikis]);

  it('copies a list’s tag into your list when you use it, so it keeps its name without the list', () => {
    const tagged = tagSite(PERSONAL_HEADER, 'terraria.org', 'indie', cards);
    expect(getSite(tagged, 'terraria.org')?.tags).toEqual(['indie']);
    expect(listTagDefs(tagged)).toEqual([{ id: 'indie', label: 'Independent wiki', color: '#3fa37a', description: 'A wiki run by its community.' }]);
    // Unsubscribed: the copy names the tag.
    const mine = compileList('mine', parseList(tagged), true);
    expect(evaluate({ url: 'https://terraria.org/' }, [mine]).tags).toEqual(['indie']);
    expect(listTagDefs(tagged)[0]?.label).toBe('Independent wiki');
    // A second site doesn't copy it again.
    expect(listTagDefs(tagSite(tagged, 'other.org', 'indie', cards))).toHaveLength(1);
  });

  it('takes the copy out with your last site, but keeps a tag you made', () => {
    const two = tagSite(tagSite(PERSONAL_HEADER, 'a.org', 'indie', cards), 'b.org', 'indie', cards);
    const one = tagSite(two, 'a.org', 'indie', cards, false);
    expect(listTagDefs(one)).toHaveLength(1);
    expect(listTagDefs(tagSite(one, 'b.org', 'indie', cards, false))).toEqual([]);
    const made = upsertTagDef(PERSONAL_HEADER, { id: 'meh', label: 'Meh', color: '#888888' });
    expect(listTagDefs(tagSite(tagSite(made, 'a.org', 'meh', cards), 'a.org', 'meh', cards, false))).toHaveLength(1);
  });

  it('fills in copies for sites tagged before, and only adds', () => {
    const before = `${PERSONAL_HEADER}$site=terraria.org,tag=indie\n$site=y.com,tag=undefined-here\n`;
    const after = keepTagDefs(before, cards);
    expect(listTagDefs(after).map((d) => d.id)).toEqual(['indie']);
    expect(keepTagDefs(after, cards)).toBe(after);
    // A list's tag your sites don't use is left out.
    expect(keepTagDefs(PERSONAL_HEADER, cards)).toBe(PERSONAL_HEADER);
  });

  it('undo takes out a copy the change made', () => {
    const tagged = tagSite(PERSONAL_HEADER, 'a.org', 'indie', cards);
    const change = recordChange(undefined, 'a.org', PERSONAL_HEADER, tagged)!;
    expect(listTagDefs(undoChange(tagged, change))).toEqual([]);
  });
});
