import discussions from '@/lists/discussions.anubis?raw';
import paywalls from '@/lists/paywalls.anubis?raw';
import reference from '@/lists/reference.anubis?raw';
import { h } from '@/utils/dom';
import { tagEffectText, tagMark } from '@/utils/icons';
import { parseList, type ParsedList, type TagDef } from '@/utils/listformat';
import type { Level } from '@/utils/matcher';

// What the welcome page's examples share: their results, the starter lists' tags, and
// how a result slides to its new place.

export interface DemoResult {
  host: string;
  /** The page's address after the site, as engines show it under the site's name. */
  path: string;
  title: string;
  /** A line from the page, as engines show under the title. */
  snippet: string;
  /** A tag from the starter lists, by id. */
  tag?: string;
}

/** English on purpose: the sample results are for the search in welcomeQuery, which stays in English. In the engine's order. */
export const RESULTS: DemoResult[] = [
  {
    host: 'amazon.com',
    path: 'noise-cancelling-headphones › s',
    title: 'Amazon.com: Noise Cancelling Headphones',
    snippet: 'Over 10,000 results for "noise cancelling headphones". Sponsored. Free delivery on eligible orders.',
  },
  {
    host: 'techradar.com',
    path: 'news › best-noise-cancelling-headphones',
    title: 'The 12 best noise-cancelling headphones 2026: tested and ranked',
    snippet: 'Our experts have picked the best noise-cancelling headphones you can buy, with deals updated daily.',
  },
  {
    host: 'en.wikipedia.org',
    path: 'wiki › Noise-cancelling_headphones',
    title: 'Noise-cancelling headphones - Wikipedia',
    snippet: 'Noise-cancelling headphones reduce unwanted sound from around you by playing a second sound that cancels it out.',
    tag: 'reference',
  },
  {
    host: 'nytimes.com',
    path: 'wirecutter › reviews › best-noise-cancelling-headphones',
    title: 'The Best Noise-Cancelling Headphones | Reviews by Wirecutter',
    snippet: 'After testing dozens of pairs on planes, trains, and busy streets, these are the ones we recommend.',
    tag: 'paywall',
  },
  {
    host: 'reddit.com',
    path: 'r › headphones › comments',
    title: 'Which noise cancelling headphones are actually worth it? : r/headphones',
    snippet: "I've owned the Sony, the Bose, and the AirPods Max. Here's which ones I'd actually buy again.",
    tag: 'forum',
  },
  {
    host: 'youtube.com',
    path: 'watch',
    title: 'Sony vs Bose vs Apple: Which Should You Buy?',
    snippet: 'We compared noise cancelling, sound, comfort, and battery life over a month of daily use.',
  },
];

/** One of the sample results, by its site. */
export const sample = (host: string): DemoResult => RESULTS.find((r) => r.host === host)!;

/** Three of the lists Anubis starts with, read from their bundled copies so names, tags, and colours stay in step. */
export const STARTER_LISTS: ParsedList[] = [discussions, reference, paywalls].map((text) => parseList(text));

export const STARTER_TAGS: Record<string, TagDef> = Object.fromEntries(STARTER_LISTS.flatMap((list) => list.tags).map((tag) => [tag.id, tag]));

/** A tag under a result's title: its diamond in the tag's colour, or the ranking's sign when it moves the result, then its name. */
export const tagChip = (tag: TagDef, effect?: Level): HTMLElement =>
  h('span', { class: 'tag', style: `--c: ${tag.color}`, title: tag.description ?? tag.label }, tagMark(effect), tag.label, tagEffectText(effect));

/**
 * An example result as engines draw one: the site's round icon (its first letter), its
 * name and address, the title, a line from the page, and room under it for tags.
 */
export const resultBody = (result: DemoResult): HTMLElement =>
  h(
    'div',
    { class: 'result' },
    h(
      'span',
      { class: 'site' },
      h('span', { class: 'favicon', attrs: { 'aria-hidden': 'true' } }, result.host.replace(/^(www|en)\./, '')[0]!.toUpperCase()),
      h('span', { class: 'where' }, h('span', { class: 'host' }, result.host), h('span', { class: 'path' }, ` › ${result.path}`)),
    ),
    h('span', { class: 'title' }, result.title),
    h('span', { class: 'snippet' }, result.snippet),
    h('span', { class: 'chips' }),
  );

/** An example result in a list of them. */
export const resultRow = (result: DemoResult): HTMLLIElement => h('li', null, resultBody(result));

/** Slide an element from where it was (FLIP). */
export function slide(el: HTMLElement, from: number): void {
  const shift = from - el.getBoundingClientRect().top;
  if (!shift) return;
  el.style.transition = 'none';
  el.style.transform = `translateY(${shift}px)`;
  void el.offsetHeight;
  el.style.transition = 'transform 0.35s cubic-bezier(0.3, 0.7, 0.2, 1)';
  el.style.transform = '';
}
