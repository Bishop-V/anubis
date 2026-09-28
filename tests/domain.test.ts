import { describe, expect, it } from 'vitest';
import { decodeBingRedirect, displayedDomainToUrl, domainChoices, normalizeDomain, siteOf } from '@/utils/domain';
import { originPermissionFor, suggestionUrl, toRawUrl } from '@/utils/subscriptions';

describe('domains', () => {
  it('normalizes what people type', () => {
    expect(normalizeDomain('https://www.Fandom.com/wiki/x')).toBe('fandom.com');
    expect(normalizeDomain('  example.org ')).toBe('example.org');
    expect(normalizeDomain('localhost')).toBe('');
    expect(normalizeDomain('not a domain')).toBe('');
  });

  it('offers the host down to the registrable domain', () => {
    expect(domainChoices('www.a.b.example.com')).toEqual(['a.b.example.com', 'b.example.com', 'example.com']);
    expect(domainChoices('news.bbc.co.uk')).toEqual(['news.bbc.co.uk', 'bbc.co.uk']);
    expect(siteOf('docs.github.com')).toBe('github.com');
  });

  it('decodes Bing redirects', () => {
    const target = 'https://example.com/page?x=1';
    const u = 'a1' + btoa(target).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeBingRedirect(`https://www.bing.com/ck/a?!&&p=abc&u=${u}&ntb=1`)).toBe(target);
    expect(decodeBingRedirect('https://example.com/ck/a?u=a1xyz')).toBeUndefined();
  });

  it('reads displayed domains', () => {
    expect(displayedDomainToUrl('en.wikipedia.org › wiki › Anubis')).toBe('https://en.wikipedia.org/');
    expect(displayedDomainToUrl('Wikipedia')).toBeUndefined();
  });
});

describe('subscription URLs', () => {
  it('turns shareable links into raw file URLs', () => {
    expect(toRawUrl('https://github.com/brave/goggles-quickstart/blob/main/goggles/no_pinterest.goggle')).toBe(
      'https://raw.githubusercontent.com/brave/goggles-quickstart/main/goggles/no_pinterest.goggle',
    );
    expect(toRawUrl('https://gist.github.com/someone/0123abcd')).toBe('https://gist.githubusercontent.com/someone/0123abcd/raw');
    expect(toRawUrl('https://gitlab.com/g/r/-/blob/main/x.anubis')).toBe('https://gitlab.com/g/r/-/raw/main/x.anubis');
    expect(toRawUrl('https://codeberg.org/o/r/src/branch/main/x.anubis')).toBe('https://codeberg.org/o/r/raw/branch/main/x.anubis');
    expect(
      toRawUrl(
        'https://search.brave.com/goggles?goggles_id=https%3A%2F%2Fraw.githubusercontent.com%2Fbrave%2Fgoggles-quickstart%2Fmain%2Fgoggles%2Fhacker_news.goggle',
      ),
    ).toBe('https://raw.githubusercontent.com/brave/goggles-quickstart/main/goggles/hacker_news.goggle');
  });

  it('only asks for permissions on hosts without open CORS', () => {
    expect(originPermissionFor('https://raw.githubusercontent.com/a/b/c')).toBeUndefined();
    expect(originPermissionFor('https://codeberg.org/o/r/raw/x')).toBe('https://codeberg.org/*');
  });

  it('builds pre-filled issue links', () => {
    const gh = new URL(suggestionUrl('https://github.com/o/r/issues', 'Add x', 'body')!);
    expect(gh.pathname).toBe('/o/r/issues/new');
    expect(gh.searchParams.get('title')).toBe('Add x');
    const gl = new URL(suggestionUrl('https://gitlab.com/g/r/-/issues', 'Add x', 'body')!);
    expect(gl.searchParams.get('issue[title]')).toBe('Add x');
  });
});
