import { describe, expect, it } from 'vitest';
import { currentPage, nextPagerIndex } from '../utils/pager';

describe('pager forms', () => {
  it('finds the page you are on from the numbers it links to', () => {
    expect(currentPage([2, 3, 4, 5, 6])).toBe(1);
    expect(currentPage([1, 3, 4, 5, 6])).toBe(2);
    expect(currentPage([1, 2, 3, 5, 6])).toBe(4);
    expect(currentPage([])).toBe(1);
  });

  it('picks the next page, whatever order the forms are in', () => {
    expect(nextPagerIndex([2, 3, 4, 5, 6])).toBe(0);
    expect(nextPagerIndex([1, 3, 4, 5, 6, 3])).toBe(1);
    expect(nextPagerIndex([6, 3, 2, 5], 1)).toBe(2);
    expect(nextPagerIndex([6, 3, 2, 5])).toBe(3);
  });

  it('continues from a page already loaded, and stops after the last', () => {
    expect(nextPagerIndex([1, 2, 4, 5], 3)).toBe(2);
    expect(nextPagerIndex([1, 2, 3], 3)).toBe(-1);
    expect(nextPagerIndex([])).toBe(-1);
  });
});
