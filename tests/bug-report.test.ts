import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bugReportLink, describeBrowser } from '../utils/links';

// "Report a problem" opens the issue form in .github/ISSUE_TEMPLATE with fields
// filled in by their ids, so the link and the form must agree.

describe('bug report link', () => {
  it('opens the form with the version, browser, and engine filled in', () => {
    const url = new URL(bugReportLink({ version: '0.2.0', browser: 'Firefox 143 on Linux', engine: 'Bing' }));
    expect(url.origin + url.pathname).toBe('https://github.com/Bishop-V/anubis/issues/new');
    expect(Object.fromEntries(url.searchParams)).toEqual({ template: 'bug-report.yml', version: '0.2.0', browser: 'Firefox 143 on Linux', engine: 'Bing' });
  });

  it('leaves out what it doesn’t know', () => {
    const url = new URL(bugReportLink({ version: '0.2.0' }));
    expect([...url.searchParams.keys()]).toEqual(['template', 'version']);
  });

  it('names fields the form has', () => {
    const form = readFileSync('.github/ISSUE_TEMPLATE/bug-report.yml', 'utf8');
    const ids = [...form.matchAll(/^\s+id: (\S+)$/gm)].map((m) => m[1]);
    const url = new URL(bugReportLink({ version: '1', browser: 'b', engine: 'e' }));
    for (const key of url.searchParams.keys()) if (key !== 'template') expect(ids).toContain(key);
  });
});

describe('describeBrowser', () => {
  it.each([
    ['Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0', 'Firefox 143 on Linux'],
    ['Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0', 'Firefox 143 on Android'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'Chrome 140 on Windows'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', 'Edge 140 on Windows'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0', 'Opera 124 on macOS'],
  ])('%s', (ua, expected) => {
    expect(describeBrowser(ua)).toBe(expected);
  });

  it('gives up on one it doesn’t know', () => {
    expect(describeBrowser('curl/8.0')).toBeUndefined();
  });
});
