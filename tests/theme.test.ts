import { afterEach, describe, expect, it, vi } from 'vitest';
import { darkWhenUnknown } from '../docs/.vitepress/config';

// On "auto", the extension and the wiki follow the browser's light or dark mode,
// and use dark when the browser reports neither.

type Reported = 'light' | 'dark' | 'neither';

/** A matchMedia for a browser that reports `reported` and is at least 0px wide. */
function fakeMatchMedia(reported: Reported) {
  return (media: string) => ({
    media,
    matches:
      media === '(min-width: 0px)' ||
      (reported !== 'neither' && media === `(prefers-color-scheme: ${reported})`),
    addEventListener() {},
  });
}

describe('the extension', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  const load = async (reported: Reported | undefined) => {
    vi.resetModules();
    if (reported) vi.stubGlobal('matchMedia', fakeMatchMedia(reported));
    else vi.stubGlobal('matchMedia', undefined);
    return import('../utils/theme');
  };

  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    ['neither', 'dark'],
    [undefined, 'dark'],
  ] as const)('reads a browser reporting %s as %s', async (reported, expected) => {
    const { browserScheme, resolveTheme } = await load(reported);
    expect(browserScheme()).toBe(expected);
    expect(resolveTheme('auto')).toBe(expected);
  });

  it('keeps a chosen theme', async () => {
    const { resolveTheme } = await load('neither');
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });
});

describe('the wiki', () => {
  /** Runs the wiki's head script and says whether VitePress's dark query then matches. */
  function wikiSeesDark(reported: Reported): boolean {
    const window = { matchMedia: fakeMatchMedia(reported) as (media: string) => { matches: boolean } };
    new Function('window', darkWhenUnknown)(window);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  it('follows a browser that reports light or dark', () => {
    expect(wikiSeesDark('light')).toBe(false);
    expect(wikiSeesDark('dark')).toBe(true);
  });

  it('is dark when the browser reports neither', () => {
    expect(wikiSeesDark('neither')).toBe(true);
  });
});
