import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
// @ts-expect-error: the e2e harness is plain JavaScript.
import { ANUBIS_RESULTS, bing, brave, duckduckgo, google, googleMobile } from '../e2e/fixtures.mjs';

// The e2e mock pages stand in for engines the development sandbox can't reach. uBlacklist
// keeps its rules current against the real pages (the copy in upstream/serpinfo/), so its
// result selectors are a second opinion on whether a mock still looks like the engine.
// When the weekly engine sync brings a new selector, the first check fails: update the
// mock in e2e/fixtures.mjs to the new markup, then the selector here.

type Page = (query: string, results: unknown[]) => string;

const CASES: { name: string; file: string; root: string; page: Page }[] = [
  { name: 'Google', file: 'google.yml', root: '.vt6azd:not(.g-blk), .Ww4FFb', page: google },
  { name: "Google's awkward layout", file: 'google.yml', root: '.vt6azd:not(.g-blk), .Ww4FFb', page: (q, r) => google(q, r, { hostile: true }) },
  { name: "Google's phone layout", file: 'google.yml', root: '.vt6azd, .Ww4FFb', page: googleMobile },
  { name: 'DuckDuckGo', file: 'duckduckgo.yml', root: '[data-testid="web-vertical"] li > article', page: duckduckgo },
  { name: 'Bing', file: 'bing.yml', root: '.b_algo', page: bing },
  { name: 'Brave Search', file: 'brave.yml', root: '.snippet[data-type="web"]', page: brave },
];

describe('mock pages against uBlacklist', () => {
  it.each(CASES)('$name: uBlacklist still finds results with this selector', ({ file, root }) => {
    expect(readFileSync(resolve('upstream/serpinfo', file), 'utf8')).toContain(root);
  });

  it.each(CASES)("$name: the mock has one of uBlacklist's results per result", ({ root, page }) => {
    const { document } = parseHTML(page('test', ANUBIS_RESULTS));
    expect(document.querySelectorAll(root).length).toBe(ANUBIS_RESULTS.length);
  });
});
