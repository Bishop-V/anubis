import { describe, expect, it } from 'vitest';
import {
  fromBlockedSites,
  getSite,
  listSites,
  listTagDefs,
  PERSONAL_HEADER,
  removeTag,
  setSite,
  setSiteLevel,
  toggleSiteTag,
  upsertTagDef,
} from '@/utils/personal';
import { parseList } from '@/utils/listformat';

const base = `${PERSONAL_HEADER}
! Keep this comment.
/ads/$discard
$site=fandom.com,discard
`;

describe('personal list edits', () => {
  it('lists simple site lines', () => {
    expect(listSites(base)).toEqual([{ site: 'fandom.com', level: 'hide', tags: [], line: 7 }]);
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

  it('migrates the old block list', () => {
    const t = fromBlockedSites(['fandom.com', 'pinterest.com']);
    expect(listSites(t).map((e) => [e.site, e.level])).toEqual([
      ['fandom.com', 'hide'],
      ['pinterest.com', 'hide'],
    ]);
  });
});
