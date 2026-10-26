import { describe, expect, it } from 'vitest';
import { holdBelow } from '@/entrypoints/content/steady';

// Reranking sorts by key, lower first: a result's place minus how far it's raised.
const order = (keys: Map<string, number>) => [...keys].sort((a, b) => a[1] - b[1]).map(([id]) => id);

describe('holdBelow', () => {
  const keys = new Map([
    ['a', 0],
    ['b', 1],
    ['c', 2],
    ['d', 3],
    // From page 2, pinned: its key would put it first.
    ['pinned', -1000],
    ['raised', 4],
  ]);

  it('ranks everything together when nothing is held', () => {
    expect(order(holdBelow(keys, new Map()))).toEqual(['pinned', 'a', 'b', 'c', 'd', 'raised']);
  });

  it('keeps a held result just below the result it arrived under', () => {
    const below = new Map([
      ['pinned', 'b'],
      ['raised', 'b'],
    ]);
    expect(order(holdBelow(keys, below))).toEqual(['a', 'b', 'pinned', 'c', 'd', 'raised']);
  });

  it('follows an anchor that is itself held, and ignores one that is gone', () => {
    const below = new Map([
      ['b', 'c'],
      ['pinned', 'b'],
      ['raised', 'gone'],
    ]);
    expect(order(holdBelow(keys, below))).toEqual(['a', 'c', 'b', 'pinned', 'd', 'raised']);
  });
});
