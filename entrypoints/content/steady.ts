// Load more results, when it runs by itself, brings later pages in a second or more
// after the page loads. Until someone starts reading (scrolls, clicks, presses a key, or
// moves the pointer over a result) those results are ranked in with the rest, so a site
// pinned on page 3 still comes first. Once reading has begun, nothing on screen moves
// for them: a result that arrives then stays below the last result that was on screen.
// Ranking a site from the menu lets everything move again, since that change was asked for.

export interface Steady {
  /** Someone has started reading this search. */
  reading: boolean;
  /** Results already placed; any other is new. */
  seen: WeakSet<HTMLElement>;
  /** Results that arrived while someone was reading, each with the result it stays below. */
  below: Map<HTMLElement, HTMLElement>;
  /** The lowest result on screen when last looked. */
  horizon?: HTMLElement;
}

export const freshSteady = (): Steady => ({ reading: false, seen: new WeakSet(), below: new Map() });

/**
 * Look at what's on screen: when reading starts, on scrolling, and after each pass while a
 * load is on its way. Not when results arrive: the engine's new results (or Anubis's) have
 * no place in the order yet, so they sit at the top of the list until the next pass.
 */
export function lookAtScreen(steady: Steady, containers: HTMLElement[]): void {
  steady.horizon = lastOnScreen(containers.filter((el) => steady.seen.has(el)));
}

/**
 * Note the results that are new since the last pass. While `hold` (an automatic load) and
 * someone is reading, they're kept below the lowest result that was on screen.
 */
export function noteArrivals(steady: Steady, containers: HTMLElement[], hold: boolean): void {
  const fresh = containers.filter((el) => !steady.seen.has(el));
  if (!fresh.length) return;
  const anchor = hold && steady.reading && steady.horizon?.isConnected ? steady.horizon : undefined;
  for (const el of fresh) {
    steady.seen.add(el);
    // Reranking moves results within one list; a result in another list can't pass this one.
    if (anchor && anchor.parentElement === el.parentElement) steady.below.set(el, anchor);
  }
}

/** The result drawn lowest whose top is on screen or above it: as far as someone may have read. */
function lastOnScreen(containers: HTMLElement[]): HTMLElement | undefined {
  let last: HTMLElement | undefined;
  let lastTop = -Infinity;
  for (const el of containers) {
    if (!el.isConnected || !el.getClientRects().length) continue;
    const { top } = el.getBoundingClientRect();
    if (top < innerHeight && top > lastTop) {
      last = el;
      lastTop = top;
    }
  }
  return last;
}

/**
 * Reranking's sort keys (lower comes first), with each held result kept below its anchor:
 * just after it when its own key would put it higher. An anchor outside these keys holds nothing.
 */
export function holdBelow<T>(keys: Map<T, number>, below: Map<T, T>): Map<T, number> {
  const held = new Map<T, number>();
  const keyOf = (el: T, depth: number): number => {
    const own = keys.get(el)!;
    const anchor = below.get(el);
    // Anchors only point back to results placed earlier, so this ends; the depth is a guard.
    if (anchor === undefined || !keys.has(anchor) || depth > 100) return own;
    // A sliver past the anchor's key: after it, and before whatever comes next, however long the chain.
    return Math.max(own, keyOf(anchor, depth + 1) + 0.001);
  };
  for (const el of keys.keys()) held.set(el, keyOf(el, 0));
  return held;
}
