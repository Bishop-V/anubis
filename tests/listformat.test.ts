import { describe, expect, it } from 'vitest';
import { compileGogglePattern, detectFormat, nestedRepeat, parseList, parseTagDef } from '@/utils/listformat';

describe('Goggles instructions', () => {
  it('reads site, actions and strengths', () => {
    const list = parseList(`! name: Test
$boost=3,site=example.com
$downrank,site=w3schools.com
$discard,site=pinterest.com
/blog/$site=medium.com`);
    expect(list.format).toBe('goggle');
    expect(list.meta.name).toBe('Test');
    expect(list.errors).toEqual([]);
    const [boost, down, discard, pattern] = list.rules;
    expect(boost).toMatchObject({ site: 'example.com', boost: 3, discard: false });
    expect(down).toMatchObject({ site: 'w3schools.com', boost: -1 });
    expect(discard).toMatchObject({ site: 'pinterest.com', discard: true });
    // No action means boost=1, as in Goggles.
    expect(pattern).toMatchObject({ site: 'medium.com', boost: 1 });
    expect(pattern!.pattern!.test('https://medium.com/blog/post')).toBe(true);
  });

  it('treats a bare $discard as a lens', () => {
    const list = parseList('$discard\n$boost=3,site=rust-lang.org');
    expect(list.lens).toBe(true);
    expect(list.rules).toHaveLength(1);
  });

  it('accepts bare TLDs as sites, like the Rust goggle', () => {
    const list = parseList('*rust*$boost=1,site=rs');
    expect(list.rules[0]).toMatchObject({ site: 'rs', boost: 1 });
  });

  it('rejects bad strengths and unknown options', () => {
    const list = parseList('$boost=11,site=a.com\n$frobnicate,site=b.com\n$site=c.com,boost=2');
    expect(list.errors.map((e) => e.line)).toEqual([1, 2]);
    expect(list.rules).toHaveLength(1);
  });

  it('reads intitle and indescription targets', () => {
    const list = parseList('recipe$intitle,downrank=2');
    expect(list.rules[0]).toMatchObject({ target: 'title', boost: -2 });
  });
});

describe('Goggles patterns', () => {
  const match = (pattern: string, url: string) => (compileGogglePattern(pattern) as RegExp).test(url);

  it('treats ^ as a separator or the end of the URL', () => {
    expect(match('|https://example.org^', 'https://example.org')).toBe(true);
    expect(match('|https://example.org^', 'https://example.org/path')).toBe(true);
    expect(match('|https://example.org^', 'https://example.org.ac')).toBe(false);
    expect(match('/foo.js^', 'https://x.org/foo.js?x=1')).toBe(true);
    expect(match('/foo.js^', 'https://x.org/foo.jsx')).toBe(false);
  });

  it('anchors with |', () => {
    expect(match('|https://en.', 'https://en.wikipedia.org/')).toBe(true);
    expect(match('|https://en.', 'https://fr.wikipedia.org/?q=https://en.')).toBe(false);
    expect(match('/some/path.html|', 'https://x.org/some/path.html')).toBe(true);
    expect(match('/some/path.html|', 'https://x.org/some/path.html?y')).toBe(false);
  });

  it('expands * and escapes everything else', () => {
    expect(match('/this/is/*/pattern', 'https://x.org/this/is/a/b/pattern')).toBe(true);
    expect(match('a.b', 'https://axb.org')).toBe(false);
  });

  it('limits wildcards like Goggles does', () => {
    expect(typeof compileGogglePattern('*a*b*c')).toBe('string');
  });
});

describe('Anubis extensions', () => {
  it('reads tag definitions and tag= options', () => {
    const list = parseList(`! name: Docs
! tag: docs | Official docs | #4a86d8 | First-party documentation
$site=developer.mozilla.org,tag=docs,boost=1
$site=example.com,tag=docs,tag=reference`);
    expect(list.format).toBe('anubis');
    expect(list.tags[0]).toEqual({ id: 'docs', label: 'Official docs', color: '#4a86d8', description: 'First-party documentation' });
    // Undefined tags get a generated definition.
    expect(list.tags.map((t) => t.id)).toEqual(['docs', 'reference']);
    expect(list.rules[0]).toMatchObject({ tags: ['docs'], boost: 1 });
    // Tag-only instructions don't change ranking.
    expect(list.rules[1]).toMatchObject({ tags: ['docs', 'reference'], boost: 0 });
  });

  it('reads pin and allow', () => {
    const list = parseList('$site=a.com,pin\n$site=b.com,allow');
    expect(list.rules[0]!.pin).toBe(true);
    expect(list.rules[1]!.allow).toBe(true);
  });

  it('parses tag definitions leniently', () => {
    expect(parseTagDef('ai-slop')).toMatchObject({ id: 'ai-slop', label: 'ai-slop' });
    expect(parseTagDef('x | X | #abc')!.color).toBe('#aabbcc');
    expect(parseTagDef('Not Valid!')).toBeUndefined();
  });

  it('reads the update interval', () => {
    expect(parseList('! expires: 2 days\n$site=a.com').meta.expiresHours).toBe(48);
    expect(parseList('! expires: 12 hours\n$site=a.com').meta.expiresHours).toBe(12);
  });
});

describe('uBlacklist rulesets', () => {
  it('reads match patterns, regexes, unblock and highlight rules', () => {
    const list = parseList(`---
name: My ruleset
---
# comment
*://*.example.com/*
*://example.net/*
*://example.org/hoge/*  # trailing comment
/example\\.(net|org)/
@*://good.example.com/*
@1*://docs.example.com/*
title *= "x"`);
    expect(list.format).toBe('ublacklist');
    expect(list.meta.name).toBe('My ruleset');
    const [sub, exact, path, regex, allow, highlight] = list.rules;
    expect(sub).toMatchObject({ site: 'example.com', discard: true });
    expect(exact).toMatchObject({ host: 'example.net', discard: true });
    expect(path!.pathPattern!.test('/hoge/page')).toBe(true);
    expect(path!.pathPattern!.test('/other')).toBe(false);
    expect(regex!.pattern!.test('https://example.org/')).toBe(true);
    expect(allow).toMatchObject({ host: 'good.example.com', allow: true, discard: false });
    expect(highlight).toMatchObject({ host: 'docs.example.com', tags: ['highlight-1'], discard: false });
    // Expressions aren't supported: reported, not silently misread.
    expect(list.errors).toHaveLength(1);
  });
});

describe('slow regular expressions', () => {
  it('spots a repeated group that repeats inside', () => {
    for (const bad of ['(a+)+$', '(\\w+\\s?)*$', '(?:x|y+)*', '(a{2,})+', '((a+))+', '(?<n>a*)+', '(a+)+?']) {
      expect(nestedRepeat(bad), bad).toBe(true);
    }
    for (const ok of ['pinterest.+\\/foo', '^https?:\\/\\/(www\\.)?example\\.(net|org)\\/', '(a+)?', '(a+){3}', '((a)+)', '[(+]*', '\\(a+\\)+', '(?:a|b)+', 'x{2,}']) {
      expect(nestedRepeat(ok), ok).toBe(false);
    }
  });

  it('turns them down as list errors, and keeps the rest of the list', () => {
    const list = parseList('*://*.example.com/*\n/(a+)+$/\n/example\\.net/');
    expect(list.format).toBe('ublacklist');
    expect(list.rules).toHaveLength(2);
    expect(list.errors).toEqual([{ line: 2, message: expect.stringContaining('could freeze search pages') }]);
    expect(parseList(`*://*.example.com/*\n/${'a'.repeat(1001)}/`).errors[0]!.message).toContain('longer than 1000');
  });
});

describe('plain domain lists', () => {
  it('discards every listed domain, hosts-file lines included', () => {
    const list = parseList('example.com\nwww.spam.net\n0.0.0.0 tracker.io');
    expect(list.format).toBe('domains');
    expect(list.rules.map((r) => [r.site, r.discard])).toEqual([
      ['example.com', true],
      ['spam.net', true],
      ['tracker.io', true],
    ]);
  });
});

describe('detectFormat', () => {
  it('tells formats apart', () => {
    expect(detectFormat(['! name: x', '$site=a.com'])).toBe('goggle');
    expect(detectFormat(['$site=a.com,tag=x'])).toBe('anubis');
    expect(detectFormat(['*://*.a.com/*'])).toBe('ublacklist');
    expect(detectFormat(['a.com', 'b.org'])).toBe('domains');
  });
});

describe('untrusted metadata', () => {
  it('keeps only web addresses for links', () => {
    const list = parseList(`! homepage: javascript:alert(1)
! issues: https://github.com/o/r/issues
$site=a.com`);
    expect(list.meta.homepage).toBeUndefined();
    expect(list.meta.issues).toBe('https://github.com/o/r/issues');
    expect(parseList('! issues: data:text/html,hi\n$site=a.com').meta.issues).toBeUndefined();
  });
});
