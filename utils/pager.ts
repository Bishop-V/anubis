// Engines whose pager is a row of forms, one per page number (Startpage), carry the
// page in a hidden field. The page you're on has no form of its own, so it's the
// gap in the numbers, or the one before the first when there's no gap.

/** The page being shown, from the page numbers its pager links to. */
export function currentPage(pages: number[]): number {
  const sorted = [...new Set(pages.filter(Number.isFinite))].sort((a, b) => a - b);
  if (!sorted.length) return 1;
  for (let i = 1; i < sorted.length; i++) if (sorted[i]! - sorted[i - 1]! > 1) return sorted[i - 1]! + 1;
  return sorted[0]! - 1;
}

/** The index of the pager entry for the page after `current` (default: the one shown), or -1 at the last page. */
export function nextPagerIndex(pages: number[], current = currentPage(pages)): number {
  let best = -1;
  pages.forEach((p, i) => {
    if (Number.isFinite(p) && p > current && (best < 0 || p < pages[best]!)) best = i;
  });
  return best;
}
