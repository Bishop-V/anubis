import { describe, expect, it } from 'vitest';
import { decodeBingRedirect, displayedDomainToUrl, domainChoices, normalizeDomain, siteOf } from '@/utils/domain';
import { existsSync } from 'node:fs';
import { DOCS_URL, readSubscribeLink, SUBSCRIBE_PAGE, subscribeLink } from '@/utils/links';
import { issueUrl, originPermissionFor, reportTracker, reportUrl, suggestionUrl, toRawUrl } from '@/utils/subscriptions';

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
    const gh = new URL(issueUrl('https://github.com/o/r/issues', 'Add x', 'body')!);
    expect(gh.pathname).toBe('/o/r/issues/new');
    expect(gh.searchParams.get('title')).toBe('Add x');
    const gl = new URL(issueUrl('https://gitlab.com/g/r/-/issues', 'Add x', 'body')!);
    expect(gl.searchParams.get('issue[title]')).toBe('Add x');
  });

  it('never builds a link from a non-web address', () => {
    expect(issueUrl('javascript:alert(1)', 't', 'b')).toBeUndefined();
    expect(reportUrl('javascript:alert(1)', 'L', 'https://a.com/', [{ text: 'hides it' }])).toBeUndefined();
  });

  it('finds where a list takes reports', () => {
    expect(reportTracker('https://raw.githubusercontent.com/o/r/main/list.txt', {})).toBe('https://github.com/o/r/issues');
    expect(reportTracker('https://raw.githubusercontent.com/o/r/refs/heads/main/a/b.goggle', {})).toBe('https://github.com/o/r/issues');
    expect(reportTracker('https://gitlab.com/g/sub/r/-/raw/main/list.txt', {})).toBe('https://gitlab.com/g/sub/r/-/issues');
    expect(reportTracker('https://codeberg.org/o/r/raw/branch/main/list.txt', {})).toBe('https://codeberg.org/o/r/issues');
    // The list's own say comes first, then its homepage.
    expect(reportTracker('https://raw.githubusercontent.com/o/r/main/x', { issues: 'https://example.org/bugs' })).toBe('https://example.org/bugs');
    expect(reportTracker('https://raw.githubusercontent.com/mirror/r/main/x', { homepage: 'https://github.com/o/r' })).toBe('https://github.com/o/r/issues');
    expect(reportTracker('https://raw.githubusercontent.com/o/r/main/x', { homepage: 'https://example.org/' })).toBe('https://github.com/o/r/issues');
    // Not in a repository: a gist, a plain web host, a user page.
    expect(reportTracker('https://gist.githubusercontent.com/u/abc/raw', {})).toBeUndefined();
    expect(reportTracker('https://example.org/list.txt', {})).toBeUndefined();
    expect(reportTracker('https://example.org/list.txt', { homepage: 'https://github.com/u' })).toBeUndefined();
  });

  it('builds a report with the rules that matched', () => {
    const url = new URL(
      reportUrl('https://github.com/o/r/issues', 'AI list', 'https://www.example.com/a/b?session=secret#top', [
        { text: 'hides it', rule: { line: 12, raw: '*://*.example.com/*' } },
        { text: 'tags it “AI”', rule: { line: 40, raw: '/ex`ample/' } },
      ])!,
    );
    expect(url.pathname).toBe('/o/r/issues/new');
    expect(url.searchParams.get('title')).toBe('Wrong rule for example.com');
    const body = url.searchParams.get('body')!;
    expect(body).toContain('Result: https://www.example.com/a/b\n');
    expect(body).not.toContain('secret');
    expect(body).toContain('**AI list** hides it and tags it “AI”, and I think that’s wrong.');
    expect(body).toContain('Rules on lines 12 and 40:\n```\n*://*.example.com/*\n/ex`ample/\n```');
  });

  it('builds a suggestion without the example result’s query or fragment', () => {
    const url = new URL(suggestionUrl('https://github.com/o/r/issues', 'Docs', 'example.com', '$site=example.com,tag=docs', 'https://example.com/a#token=secret')!);
    expect(url.searchParams.get('title')).toBe('Suggest example.com');
    const body = url.searchParams.get('body')!;
    expect(body).toContain('Suggested instruction for **Docs**:\n\n```\n$site=example.com,tag=docs\n```');
    expect(body).toContain('Example result: https://example.com/a\n');
    expect(body).not.toContain('secret');
  });

  it('reports a lens leaving a result out, which has no rule', () => {
    const body = new URL(reportUrl('https://github.com/o/r/issues', 'Lens', 'https://a.com/', [{ text: 'doesn’t include it, so it’s hidden' }])!).searchParams.get('body')!;
    expect(body).toContain('**Lens** doesn’t include it, so it’s hidden, and I think that’s wrong.');
    expect(body).not.toContain('Rule');
  });
});

describe('subscribe links', () => {
  const list = 'https://raw.githubusercontent.com/o/r/main/my list.anubis';

  it('round-trips a list address and name', () => {
    const link = new URL(subscribeLink({ url: list, name: 'Tech & more' }));
    expect(link.origin + link.pathname).toBe(SUBSCRIBE_PAGE);
    expect(readSubscribeLink(link.search)).toEqual({ url: list, name: 'Tech & more' });
    expect(readSubscribeLink(new URL(subscribeLink({ url: list })).search)).toEqual({ url: list });
  });

  it('reads links written by hand, as uBlacklist users write them', () => {
    expect(readSubscribeLink(`?name=Huge+AI+Blocklist&url=${encodeURIComponent(list)}`)).toEqual({ url: list, name: 'Huge AI Blocklist' });
  });

  it('only takes https addresses', () => {
    expect(readSubscribeLink('?url=http%3A%2F%2Fexample.org%2Flist.txt')).toBeUndefined();
    expect(readSubscribeLink('?url=javascript%3Aalert(1)')).toBeUndefined();
    expect(readSubscribeLink('?url=not+a+url')).toBeUndefined();
    expect(readSubscribeLink('?name=Nothing')).toBeUndefined();
  });

  it('keeps the name to one short line', () => {
    const name = readSubscribeLink(`?url=${encodeURIComponent(list)}&name=${encodeURIComponent('Evil\u202e\nlist' + 'x'.repeat(200))}`)?.name;
    expect(name).toMatch(/^Evil listx+$/);
    expect(name!.length).toBe(80);
    expect(readSubscribeLink(`?url=${encodeURIComponent(list)}&name=+++`)).toEqual({ url: list });
  });

  it('points at a page the guide has', () => {
    expect(SUBSCRIBE_PAGE.startsWith(DOCS_URL)).toBe(true);
    expect(existsSync(`docs/${SUBSCRIBE_PAGE.slice(DOCS_URL.length)}.md`)).toBe(true);
  });
});
