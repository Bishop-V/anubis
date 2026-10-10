import { describe, expect, it } from 'vitest';
import { currentPage, nextPagerIndex } from '../utils/pager';

// Page numbers of Startpage's pager forms, as seen on a live page.
const PAGE_1 = [1, 2, 3, 4, 5, 2];
const PAGE_2 = [1, 1, 2, 3, 4, 5, 3];
const PAGE_5 = [4, 1, 4, 5, 6, 6];

describe('pager forms', () => {
  it('finds the page you are on from the "Next" form at the end', () => {
    expect(currentPage(PAGE_1)).toBe(1);
    expect(currentPage(PAGE_2)).toBe(2);
    expect(currentPage(PAGE_5)).toBe(5);
    expect(currentPage([])).toBe(1);
  });

  it('asks for the page after the one shown', () => {
    expect(nextPagerIndex(PAGE_1)).toBe(1);
    expect(nextPagerIndex(PAGE_2)).toBe(3);
    expect(nextPagerIndex(PAGE_5)).toBe(4);
  });

  it('stops when there is no "Next"', () => {
    expect(nextPagerIndex([1, 2, 3, 4, 5])).toBe(-1);
    expect(nextPagerIndex([])).toBe(-1);
  });

  it('continues from a page already loaded', () => {
    expect(nextPagerIndex(PAGE_2, 3)).toBe(4);
    expect(nextPagerIndex(PAGE_5, 6)).toBe(-1);
  });
});
