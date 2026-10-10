import { describe, expect, it } from 'vitest';
import { importIntoPersonal } from '@/utils/importers';
import { getSite, listTagDefs, PERSONAL_HEADER, setSite } from '@/utils/personal';

describe('importing into the personal list', () => {
  it('reads a HOHSER export', () => {
    const json = JSON.stringify([
      { domainName: 'www.spam.com', display: 'FULL_HIDE' },
      { domainName: 'meh.org', display: 'PARTIAL_HIDE' },
      { domainName: 'good.dev', display: 'HIGHLIGHT', color: 'COLOR_2' },
      { domainName: 'not a domain', display: 'FULL_HIDE' },
    ]);
    const r = importIntoPersonal(PERSONAL_HEADER, json);
    expect(r.source).toBe('hohser');
    expect([r.added, r.skipped]).toEqual([3, 1]);
    expect(getSite(r.text, 'spam.com')?.level).toBe('hide');
    expect(getSite(r.text, 'meh.org')?.level).toBe('lower');
    expect(getSite(r.text, 'good.dev')?.tags).toEqual(['highlight-2']);
    expect(listTagDefs(r.text)).toEqual([expect.objectContaining({ id: 'highlight-2', color: '#8bc34a' })]);
    expect(r.highlightTags).toEqual(['highlight-2']);
  });

  it('reads uBlacklist rules and skips what needs patterns', () => {
    const rules = `*://*.pinterest.com/*
*://example.net/*
*://example.org/path/*
/copycat\\.(net|org)/
@1*://*.docs.dev/*`;
    const r = importIntoPersonal(PERSONAL_HEADER, rules);
    expect(r.source).toBe('ublacklist');
    expect(getSite(r.text, 'pinterest.com')?.level).toBe('hide');
    expect(getSite(r.text, 'example.net')?.level).toBe('hide');
    expect(getSite(r.text, 'docs.dev')?.tags).toEqual(['highlight-1']);
    expect(r.skipped).toBe(2);
  });

  it('reads a Goggle and merges with what is already there', () => {
    const existing = setSite(PERSONAL_HEADER, 'rust-lang.org', 'normal', ['mine']);
    const r = importIntoPersonal(existing, '! name: Rust\n$discard\n$boost=3,site=rust-lang.org\n$discard,site=spam.rs');
    expect(r.updated).toBe(1);
    expect(getSite(r.text, 'rust-lang.org')).toMatchObject({ level: 'raise', tags: ['mine'] });
    expect(getSite(r.text, 'spam.rs')?.level).toBe('hide');
  });
});
