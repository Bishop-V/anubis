import discussions from '@/lists/discussions.anubis?raw';
import officialDocs from '@/lists/official-docs.anubis?raw';
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

/** English on purpose: the sample results are for the search in welcomeQuery, which stays technical. In the engine's order. */
export const RESULTS: DemoResult[] = [
  {
    host: 'geeksforgeeks.org',
    path: 'python › list-comprehension',
    title: 'Python - List Comprehension',
    snippet: 'Learn list comprehension in Python with examples, syntax, and practice problems.',
  },
  {
    host: 'w3schools.com',
    path: 'python › python_lists_comprehension',
    title: 'Python List Comprehension',
    snippet: 'List comprehension offers a shorter syntax when you want to create a new list from an existing one.',
  },
  {
    host: 'docs.python.org',
    path: '3 › tutorial › datastructures',
    title: '5. Data Structures — Python 3 documentation',
    snippet: 'List comprehensions provide a concise way to create lists, with a for clause and optional if clauses.',
    tag: 'docs',
  },
  {
    host: 'realpython.com',
    path: 'list-comprehension-python',
    title: 'When to Use a List Comprehension in Python',
    snippet: "In this tutorial, you'll learn when a list comprehension makes your code clearer, and when it doesn't.",
  },
  {
    host: 'stackoverflow.com',
    path: 'questions › list-comprehension',
    title: 'What does "list comprehension" mean? How does it work?',
    snippet: 'I keep seeing [x for x in items] in code. What is this called, and how does it work?',
    tag: 'forum',
  },
  {
    host: 'en.wikipedia.org',
    path: 'wiki › List_comprehension',
    title: 'List comprehension - Wikipedia',
    snippet: 'A list comprehension is a syntactic construct for creating a list based on existing lists.',
    tag: 'reference',
  },
];

/** One of the sample results, by its site. */
export const sample = (host: string): DemoResult => RESULTS.find((r) => r.host === host)!;

/** Three of the lists Anubis starts with, read from their bundled copies so names, tags, and colours stay in step. */
export const STARTER_LISTS: ParsedList[] = [officialDocs, discussions, reference].map((text) => parseList(text));

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
      h('span', { class: 'favicon', attrs: { 'aria-hidden': 'true' } }, result.host.replace(/^(www|en|docs)\./, '')[0]!.toUpperCase()),
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

/** Put rows in a new order, sliding each from where it was unless motion is reduced. */
export function reorder(list: HTMLElement, rows: HTMLElement[]): void {
  const before = new Map(rows.map((row) => [row, row.getBoundingClientRect().top]));
  list.replaceChildren(...rows);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const row of rows) if (before.get(row)) slide(row, before.get(row)!);
}
