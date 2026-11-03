import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  compareVersions,
  ENGINE_FIXES_URL,
  engineFixesItem,
  fixApplies,
  fixedEngineFor,
  readEngineFixes,
  refreshEngineFixes,
  storedEngineFixes,
  type EngineFix,
} from '@/utils/enginefixes';
import { engineFor } from '@/utils/engines';

const file = (fixes: unknown[]) => ({ anubis: 'engine-fixes', fixes });
const any = () => true;
/** As the page checks a selector: one that doesn't parse is turned down. */
const { document } = parseHTML('<!doctype html><html><body></body></html>');
const parses = (s: string) => {
  try {
    document.querySelector(s);
    return true;
  } catch {
    return false;
  }
};

describe('reading a fixes file', () => {
  it('keeps what a fix can change', () => {
    const fix = {
      engine: 'google',
      from: '0.10.0',
      until: '0.11',
      set: { heading: 'h3.x', cleanupSelectors: { ai: '.ai' }, more: { next: 'a#next' }, button: { top: '4px', right: '-28px' }, cards: { '1': { title: '.t' } } },
      mobile: { displayed: '.cite' },
    };
    expect(readEngineFixes(file([fix]))).toEqual([fix]);
  });

  it('drops anything else, and fixes that change nothing', () => {
    expect(readEngineFixes({ fixes: [{ engine: 'google', set: { heading: 'h3' } }] })).toEqual([]);
    expect(readEngineFixes(file([{ engine: 'altavista', set: { heading: 'h3' } }]))).toEqual([]);
    expect(readEngineFixes(file([{ engine: 'google', from: 'soon', set: { heading: 'h3' } }]))).toEqual([]);
    expect(readEngineFixes(file([{ engine: 'google', set: { matches: ['*://*/*'], host: '.', isResultsPage: 'true' } }]))).toEqual([]);
    const kept = readEngineFixes(
      file([
        {
          engine: 'google',
          set: {
            heading: 'h3',
            item: 42,
            title: '',
            link: 'a'.repeat(1001),
            cleanupSelectors: { ai: '.ai', newKind: '.x' },
            button: { top: '4px; color: red', right: '0' },
            cards: { first: { item: '.x' }, '0': { item: '.y', when: 'always' } },
          },
        },
      ]),
    );
    expect(kept).toEqual([{ engine: 'google', set: { heading: 'h3', cleanupSelectors: { ai: '.ai' }, button: { right: '0' }, cards: { '0': { item: '.y' } } } }]);
  });
});

describe('versions', () => {
  it('compares them part by part', () => {
    expect(compareVersions('0.10.0', '0.9.9')).toBeGreaterThan(0);
    expect(compareVersions('0.10', '0.10.0')).toBe(0);
    expect(compareVersions('1.2.3', '1.2.4')).toBeLessThan(0);
  });

  it('applies a fix from its first version up to, not including, its last', () => {
    const fix: EngineFix = { engine: 'google', from: '0.10.0', until: '0.11.0' };
    expect(['0.9.9', '0.10.0', '0.10.5', '0.11.0'].map((v) => fixApplies(fix, v))).toEqual([false, true, true, false]);
    expect(fixApplies({ engine: 'google' }, '9.9.9')).toBe(true);
  });
});

describe('the engine with its fixes', () => {
  it('puts a fix’s selectors over the bundled ones, for its engine and version only', () => {
    const fixes: EngineFix[] = [
      { engine: 'yahoo', set: { heading: 'h4', ads: '.new-ads', more: { next: 'a.more' } } },
      { engine: 'yahoo', until: '0.1.0', set: { boundary: '#old' } },
      { engine: 'bing', set: { title: 'h3' } },
    ];
    const yahoo = fixedEngineFor('search.yahoo.com', false, fixes, '0.10.0', any)!;
    const bundled = engineFor('search.yahoo.com')!;
    expect([yahoo.heading, yahoo.ads, yahoo.more, yahoo.boundary]).toEqual(['h4', '.new-ads', { kind: 'link', next: 'a.more' }, bundled.boundary]);
    expect(yahoo.isResultsPage).toBe(bundled.isResultsPage);
  });

  it('keeps the bundled value where a fix’s selector doesn’t parse, or names another kind of Load more results', () => {
    const fixes: EngineFix[] = [{ engine: 'yahoo', set: { heading: 'h3[', displayed: '.ok', more: { button: '#more' } } }];
    const yahoo = fixedEngineFor('search.yahoo.com', false, fixes, '0.10.0', parses)!;
    const bundled = engineFor('search.yahoo.com')!;
    expect([yahoo.heading, yahoo.displayed, yahoo.more]).toEqual([bundled.heading, '.ok', bundled.more]);
  });

  it('changes a card kind by its place, keeping what a fix can’t give', () => {
    const fixes: EngineFix[] = [{ engine: 'bing', set: { cards: { '0': { item: '.new-image' }, '9': { item: '.nothing' } } } }];
    const bing = fixedEngineFor('www.bing.com', false, fixes, '0.10.0', any)!;
    const bundled = engineFor('www.bing.com')!;
    expect(bing.cards![0]).toEqual({ ...bundled.cards![0], item: '.new-image' });
    expect(bing.cards!.slice(1)).toEqual(bundled.cards!.slice(1));
    expect(bing.cards).toHaveLength(bundled.cards!.length);
  });

  it('keeps the phone layout’s own values, which a fix for phones changes', () => {
    const desktop: EngineFix[] = [{ engine: 'google', set: { heading: 'h3.fixed', boundary: '#fixed' } }];
    const phone = fixedEngineFor('www.google.com', true, desktop, '0.10.0', any)!;
    expect([phone.heading, phone.boundary]).toEqual([engineFor('www.google.com', true)!.heading, '#fixed']);
    const both: EngineFix[] = [...desktop, { engine: 'google', mobile: { heading: '.phone-title' } }];
    expect(fixedEngineFor('www.google.com', true, both, '0.10.0', any)!.heading).toBe('.phone-title');
    expect(fixedEngineFor('www.google.com', false, both, '0.10.0', any)!.heading).toBe('h3.fixed');
  });

  it('gives the bundled engine when there are no fixes', () => {
    expect(fixedEngineFor('www.google.com', true, [], '0.10.0', any)).toEqual(engineFor('www.google.com', true));
    expect(fixedEngineFor('example.com', false, [], '0.10.0', any)).toBeUndefined();
  });
});

describe('downloading fixes', () => {
  beforeEach(() => fakeBrowser.reset());
  afterEach(() => vi.unstubAllGlobals());
  const serve = (body: string, status = 200) => {
    const fetch = vi.fn(async () => new Response(body, { status }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };
  const fix = { engine: 'yahoo', set: { heading: 'h4' } };

  it('keeps them, and asks again only after six hours', async () => {
    const fetch = serve(JSON.stringify(file([fix])));
    await refreshEngineFixes(1000);
    expect(fetch).toHaveBeenCalledWith(ENGINE_FIXES_URL, expect.objectContaining({ credentials: 'omit' }));
    expect(await storedEngineFixes()).toEqual([fix]);
    await refreshEngineFixes(1000 + 5 * 3600_000);
    expect(fetch).toHaveBeenCalledTimes(1);
    await refreshEngineFixes(1000 + 7 * 3600_000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps the last fixes when a download fails, and waits an hour to try again', async () => {
    await engineFixesItem.setValue({ fixes: [fix], fetchedAt: 0 });
    const fetch = serve('gone', 404);
    const now = 10 * 3600_000;
    await refreshEngineFixes(now);
    expect(await storedEngineFixes()).toEqual([fix]);
    await refreshEngineFixes(now + 30 * 60_000);
    expect(fetch).toHaveBeenCalledTimes(1);
    await refreshEngineFixes(now + 61 * 60_000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('engines/fixes.json', () => {
  const committed = JSON.parse(readFileSync('engines/fixes.json', 'utf8')) as { fixes: unknown[] };

  it('reads back whole: no fix or field is dropped', () => {
    expect(readEngineFixes(committed)).toEqual(committed.fixes);
  });

  it('has selectors that parse', () => {
    for (const fix of readEngineFixes(committed)) {
      for (const fields of [fix.set, fix.mobile]) {
        if (!fields) continue;
        const all = [
          ...Object.entries(fields).flatMap(([k, v]) => (typeof v === 'string' ? [v] : k === 'cleanupSelectors' || k === 'more' ? Object.values(v as object) : [])),
          ...Object.values(fields.cards ?? {}).flatMap((c) => Object.values(c)),
        ];
        for (const s of all) expect(parses(s), s).toBe(true);
      }
    }
  });
});
