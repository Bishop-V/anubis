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
    host: 'studocu.com',
    path: 'document › trolley-problem-ethics-notes',
    title: 'Trolley Problem - Ethics Lecture Notes - Studocu',
    snippet: 'Notes from PHIL 101, week 4. Sign up or upload a document to read the full text.',
  },
  {
    host: 'youtube.com',
    path: 'watch',
    title: 'Would You Pull the Lever? The Trolley Problem Explained',
    snippet: "Five people, one lever, and a very hard choice. Here's why this thought experiment won't go away.",
  },
  {
    host: 'plato.stanford.edu',
    path: 'entries › doing-allowing',
    title: 'Doing vs. Allowing Harm (Stanford Encyclopedia of Philosophy)',
    snippet: 'Is it worse to kill someone than to let them die? The trolley problem is one of the cases philosophers use to ask.',
    tag: 'reference',
  },
  {
    host: 'nytimes.com',
    path: 'opinion › trolley-problem',
    title: 'The Trolley Problem Is Back',
    snippet: 'Self-driving cars have turned an old thought experiment into a question engineers have to answer.',
    tag: 'paywall',
  },
  {
    host: 'reddit.com',
    path: 'r › philosophy › comments',
    title: 'Why is the trolley problem such a big deal? : r/philosophy',
    snippet: 'Everyone I ask just says pull the lever. What am I missing?',
    tag: 'forum',
  },
  {
    host: 'en.wikipedia.org',
    path: 'wiki › Trolley_problem',
    title: 'Trolley problem - Wikipedia',
    snippet: 'The trolley problem is a series of thought experiments in ethics about whether to sacrifice one person to save a larger number.',
    tag: 'reference',
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
