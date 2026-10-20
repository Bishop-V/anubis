import { h, icon } from '@/utils/dom';
import { ICON_SPARKLE, tagEffectText, tagMark } from '@/utils/icons';
import type { Level } from '@/utils/matcher';
import { describeRemoved } from '@/utils/cleanup';
import { t, tn, type MessageKey } from '@/utils/i18n';
import { TAG_PALETTE, type ParsedList } from '@/utils/listformat';
import { STARTER_LISTS, STARTER_TAGS, resultRow, sample, tagChip, type DemoResult } from './parts';

// "More to try" on the welcome page: tags, lists, and removing panels, each a short
// example that opens on its own, so the first look stays on ranking. Like the ranking
// example, nothing here is saved; each ends with a way into its settings.

const settingsLink = (section: string, key: MessageKey) =>
  h('a', { class: 'btn small', href: `/options.html#${section}`, target: '_blank' }, t(key));

const switchFor = (label: string, on: boolean, change: (on: boolean) => void) => {
  const input = h('input', { type: 'checkbox', checked: on, attrs: { 'aria-label': label } });
  input.addEventListener('change', () => change(input.checked));
  return h('span', { class: 'switch' }, input, h('span'));
};

interface ExampleTag {
  id: MessageKey;
  color: string;
  /** What the tag does to every site that has it, shown by its mark. */
  effect?: Level;
}

/** Tags people make for themselves: a plain label, one that raises, and one that lowers. In ochre, malachite, and umber, apart from the starter lists' colours. */
const EXAMPLE_TAGS: ExampleTag[] = [
  { id: 'welcomeTagReviews', color: TAG_PALETTE[0]! },
  { id: 'welcomeTagTrusted', color: TAG_PALETTE[2]!, effect: 'raise' },
  { id: 'welcomeTagAds', color: TAG_PALETTE[7]!, effect: 'lower' },
];

/** Tags: a result with one example tag already on, and the others to add or take off. */
export function renderTagsExample(box: HTMLElement): void {
  const result = sample('techradar.com');
  const tags = EXAMPLE_TAGS.map((tag) => ({ ...tag, label: t(tag.id) }));
  const on = new Set<string>([tags[0]!.id]);
  const under = h('span', { class: 'chips' });
  const said = h('p', { class: 'said', attrs: { role: 'status' } });
  const drawTags = () => under.replaceChildren(...tags.filter((x) => on.has(x.id)).map((x) => tagChip(x, x.effect)));
  const choices = tags.map((tag) =>
    h(
      'button',
      {
        type: 'button',
        class: 'choice',
        style: `--c: ${tag.color}`,
        attrs: { 'aria-pressed': String(on.has(tag.id)) },
        on: {
          click: (e) => {
            const added = !on.has(tag.id);
            if (added) on.add(tag.id);
            else on.delete(tag.id);
            (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(added));
            drawTags();
            said.textContent = t(added ? 'summaryChangedTagOn' : 'summaryChangedTagOff', result.host, tag.label);
          },
        },
      },
      tagMark(tag.effect),
      tag.label,
      tagEffectText(tag.effect),
    ),
  );
  const row = resultRow(result);
  row.querySelector('.chips')!.replaceWith(under);
  drawTags();
  box.replaceChildren(
    h('p', null, t('welcomeTagsHow')),
    h('div', { class: 'choices', attrs: { role: 'group', 'aria-label': t('welcomeTagsHow') } }, choices),
    h('div', { class: 'page small' }, h('ol', { class: 'results' }, row), said),
    h('p', { class: 'more' }, h('span', null, t('welcomeTagsMore')), settingsLink('tags', 'welcomeTagsOpen')),
  );
}

/** The starter list that defines a tag. */
const listOf = (tag: string) => STARTER_LISTS.find((list) => list.tags.some((x) => x.id === tag))!;

/** Whether a result has a tag from a list that's on. */
const listed = (r: DemoResult, on: Set<ParsedList>) => !!r.tag && on.has(listOf(r.tag));

/** A starter list's name and description, with its switch. */
const listSwitch = (parsed: ParsedList, on: boolean, change: (on: boolean) => void) =>
  h(
    'li',
    null,
    h('span', { class: 'name' }, parsed.meta.name ?? ''),
    h('span', { class: 'description' }, parsed.meta.description ?? ''),
    switchFor(parsed.meta.name ?? '', on, change),
  );

/** Lists: three starter lists with switches, two on, and a result for each that has its tag while the list is on. */
export function renderListsExample(box: HTMLElement, subscribed: number): void {
  const results = ['reddit.com', 'en.wikipedia.org', 'nytimes.com'].map(sample);
  // One list starts off, so there's a switch to turn on as well as ones to turn off.
  const on = new Set(STARTER_LISTS.slice(0, -1));
  const rows = new Map(results.map((r) => [r, resultRow(r)]));
  const list = h('ol', { class: 'results' }, [...rows.values()]);

  function draw() {
    for (const [r, row] of rows) row.querySelector('.chips')!.replaceChildren(...(listed(r, on) ? [tagChip(STARTER_TAGS[r.tag!]!)] : []));
  }

  const switches = STARTER_LISTS.map((parsed) =>
    listSwitch(parsed, on.has(parsed), (checked) => {
      if (checked) on.add(parsed);
      else on.delete(parsed);
      draw();
    }),
  );
  box.replaceChildren(
    h('p', null, t('welcomeListsHow')),
    h('ul', { class: 'switches' }, switches),
    h('div', { class: 'page small' }, list),
    h('p', { class: 'more' }, h('span', null, `${tn('welcomeListsCount', subscribed)} ${t('welcomeListsMore')}`), settingsLink('lists', 'welcomeListsOpen')),
  );
  draw();
}

/** Removing panels: an AI answer, marked with the sparkle engines give it, above a few results; a switch takes it away and the summary says so. */
export function renderPanelsExample(box: HTMLElement): void {
  const panel = h(
    'div',
    { class: 'panel' },
    h('span', { class: 'panel-name' }, icon(ICON_SPARKLE), t('welcomePanelsExample')),
    // Stand-ins for the answer's text: the example is about the panel, not what it says.
    h('span', { class: 'bar' }),
    h('span', { class: 'bar' }),
    h('span', { class: 'bar short' }),
  );
  const summary = h('p', { class: 'summary', attrs: { role: 'status' } });
  const results = ['techradar.com', 'reddit.com', 'nytimes.com'].map((host) => resultRow(sample(host)));
  const label = t('cleanupAi');
  box.replaceChildren(
    h(
      'label',
      { class: 'switch-row' },
      h('span', { class: 'name' }, label),
      switchFor(label, false, (checked) => {
        panel.hidden = checked;
        summary.textContent = checked ? t('summaryRemovedOnly', describeRemoved({ ai: 1 })) : '';
      }),
    ),
    h('div', { class: 'page small' }, summary, panel, h('ol', { class: 'results' }, results)),
    h('p', { class: 'more' }, h('span', null, t('welcomePanelsMore')), settingsLink('cleanup', 'welcomePanelsOpen')),
  );
}
