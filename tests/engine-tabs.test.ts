import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it } from 'vitest';
import { findResults } from '@/entrypoints/content/results';
import { engineFor } from '@/utils/engines';
// @ts-expect-error: the e2e harness is plain JavaScript.
import { engineTab } from '../e2e/tab-fixtures.mjs';
// @ts-expect-error: the e2e harness is plain JavaScript.
import { JS_RESULTS } from '../e2e/fixtures.mjs';

/** The page's address, which `findResults` reads to know which tab it's on. */
const visit = (address: string) => {
  (globalThis as { location?: unknown }).location = new URL(address);
};
afterEach(() => {
  delete (globalThis as { location?: unknown }).location;
});

describe('Google', () => {
  const google = engineFor('www.google.com')!;
  const results = (address: string) => google.isResultsPage(new URL(address));

  it('weighs the web, Images, Videos, and News tabs, and leaves shopping alone', () => {
    expect(results('https://www.google.com/search?q=anubis')).toBe(true);
    expect(results('https://www.google.com/search?q=anubis&udm=14')).toBe(true);
    expect(results('https://www.google.com/search?q=anubis&udm=2')).toBe(true);
    expect(results('https://www.google.com/search?q=anubis&udm=imgs')).toBe(true);
    expect(results('https://www.google.com/search?q=anubis&udm=7')).toBe(true);
    expect(results('https://www.google.com/search?q=anubis&tbm=nws')).toBe(true);
    expect(results('https://www.google.com/search?q=anubis&udm=28')).toBe(false);
    expect(results('https://www.google.com/search?q=anubis&tbm=shop')).toBe(false);
    expect(results('https://www.google.com/maps?q=anubis')).toBe(false);
  });

  it('finds every Images card, with the address of the site it came from', () => {
    visit('https://www.google.com/search?q=anubis&udm=2');
    const { document } = parseHTML(engineTab('google', 'images', JS_RESULTS));
    const found = findResults(google, document as unknown as Document);
    // The card's own link goes through Google; the address is the picture's `data-lpage`.
    expect(found.map((r) => r.url)).toEqual(JS_RESULTS.map(([url]: [string]) => new URL(url).href));
    expect(found.every((r) => r.card)).toBe(true);
    expect(found[0]!.title).toBe(JS_RESULTS[0][1]);
  });

  it("doesn't read cards on the web tab", () => {
    visit('https://www.google.com/search?q=anubis');
    const { document } = parseHTML(engineTab('google', 'images', JS_RESULTS));
    expect(findResults(google, document as unknown as Document)).toEqual([]);
  });
});

describe('Yandex', () => {
  const yandex = engineFor('yandex.com')!;

  it('weighs the Videos tab, on a computer and on a phone', () => {
    expect(yandex.isResultsPage(new URL('https://yandex.com/search/?text=anubis'))).toBe(true);
    expect(yandex.isResultsPage(new URL('https://yandex.com/video/search?text=anubis'))).toBe(true);
    expect(yandex.isResultsPage(new URL('https://yandex.com/video/touch/search/?text=anubis'))).toBe(true);
    expect(yandex.isResultsPage(new URL('https://yandex.com/images/search?text=anubis'))).toBe(false);
    expect(yandex.isResultsPage(new URL('https://yandex.com/video/preview/123?text=anubis'))).toBe(false);
  });
});
