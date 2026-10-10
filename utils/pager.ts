// Engines whose pager is a row of forms (Startpage) carry each page number in a
// hidden field. The row lists every page including the one shown, then a "Next" form
// last, repeating the number of the page after this one (seen on a live page:
// `1,2,3,4,5,2` on page 1, `1,1,2,3,4,5,3` on page 2).

/** The page being shown: one before the page "Next" asks for, or the last one listed when there's no "Next". */
export function currentPage(pages: number[]): number {
  const numbers = pages.filter(Number.isFinite);
  if (!numbers.length) return 1;
  const last = pages[pages.length - 1]!;
  if (Number.isFinite(last) && pages.slice(0, -1).includes(last)) return last - 1;
  return Math.max(...numbers);
}

/** The index of the pager entry for the page after `current` (default: the one shown), or -1 at the last page. */
export function nextPagerIndex(pages: number[], current = currentPage(pages)): number {
  let best = -1;
  pages.forEach((p, i) => {
    if (Number.isFinite(p) && p > current && (best < 0 || p < pages[best]!)) best = i;
  });
  return best;
}
