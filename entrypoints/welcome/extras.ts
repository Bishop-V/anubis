import { h } from '@/utils/dom';
import { describeRemoved } from '@/utils/cleanup';
import { t, tn, type MessageKey } from '@/utils/i18n';
import { TAG_PALETTE, type ParsedList } from '@/utils/listformat';
import { STARTER_LISTS, STARTER_TAGS, reorder, resultRow, sample, tagChip, type DemoResult } from './parts';

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

/** Tags: put one of a few example tags on a result, and see it under the title. */
export function renderTagsExample(box: HTMLElement): void {
  const result = sample('realpython.com');
  // Ochre, malachite, and umber: apart from each other and from the starter lists' tags.
  const tags = ([
    ['welcomeTagTutorial', TAG_PALETTE[0]!],
    ['welcomeTagReadLater', TAG_PALETTE[2]!],
    ['welcomeTagTrusted', TAG_PALETTE[7]!],
  ] as const).map(([key, color]) => ({ id: key, label: t(key), color }));
  const on = new Set<string>();
  const under = h('span', { class: 'chips' });
  const said = h('p', { class: 'said', attrs: { role: 'status' } });
  const choices = tags.map((tag) =>
    h(
      'button',
      {
        type: 'button',
        class: 'choice',
        style: `--c: ${tag.color}`,
        attrs: { 'aria-pressed': 'false' },
        on: {
          click: (e) => {
            const added = !on.has(tag.id);
            if (added) on.add(tag.id);
            else on.delete(tag.id);
            (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(added));
            under.replaceChildren(...tags.filter((x) => on.has(x.id)).map((x) => tagChip(x)));
            said.textContent = t(added ? 'summaryChangedTagOn' : 'summaryChangedTagOff', result.host, tag.label);
          },
        },
      },
      h('i', { class: 'gem' }),
      tag.label,
    ),
  );
  const row = resultRow(result);
  row.querySelector('.chips')!.replaceWith(under);
  box.replaceChildren(
    h('p', null, t('welcomeTagsHow')),
    h('div', { class: 'choices', attrs: { role: 'group', 'aria-label': t('welcomeTagsHow') } }, choices),
    h('div', { class: 'page small' }, h('ol', { class: 'results' }, row), said),
    h('p', { class: 'more' }, h('span', null, t('welcomeTagsMore')), settingsLink('tags', 'welcomeTagsOpen')),
  );
}

/** The starter list that defines a tag. */
const listOf = (tag: string) => STARTER_LISTS.find((list) => list.tags.some((x) => x.id === tag))!;

/** Whether a result's list is on; Official docs also raises the sites it tags, as its description says. */
const listed = (r: DemoResult, on: Set<ParsedList>) => !!r.tag && on.has(listOf(r.tag));
const raised = (r: DemoResult, on: Set<ParsedList>) => listed(r, on) && r.tag === 'docs';

/** A starter list's name and description, with its switch. */
const listSwitch = (parsed: ParsedList, change: (on: boolean) => void) =>
  h(
    'li',
    null,
    h('span', { class: 'name' }, parsed.meta.name ?? ''),
    h('span', { class: 'description' }, parsed.meta.description ?? ''),
    switchFor(parsed.meta.name ?? '', true, change),
  );

/** Lists: three starter lists with switches, and results that gain their tags and move when one is on. */
export function renderListsExample(box: HTMLElement, subscribed: number): void {
  const results = ['stackoverflow.com', 'en.wikipedia.org', 'docs.python.org'].map(sample);
  const on = new Set(STARTER_LISTS);
  const rows = new Map(results.map((r) => [r, resultRow(r)]));
  const list = h('ol', { class: 'results' });

  function draw() {
    for (const [r, row] of rows) {
      row.querySelector('.chips')!.replaceChildren(...(listed(r, on) ? [tagChip(STARTER_TAGS[r.tag!]!, raised(r, on) ? 'raise' : undefined)] : []));
    }
    const order = [...results].sort((a, b) => Number(raised(b, on)) - Number(raised(a, on)));
    reorder(list, order.map((r) => rows.get(r)!));
  }

  const switches = STARTER_LISTS.map((parsed) =>
    listSwitch(parsed, (checked) => {
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

/** Removing panels: an AI answer above the results that a switch takes away, and the summary saying so. */
export function renderPanelsExample(box: HTMLElement): void {
  const panel = h(
    'div',
    { class: 'panel' },
    h('span', { class: 'panel-name' }, t('welcomePanelsExample')),
    // Stand-ins for the answer's text: the example is about the panel, not what it says.
    h('span', { class: 'bar' }),
    h('span', { class: 'bar' }),
    h('span', { class: 'bar short' }),
  );
  const summary = h('p', { class: 'summary', attrs: { role: 'status' } });
  const result = sample('docs.python.org');
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
    h('div', { class: 'page small' }, summary, panel, h('ol', { class: 'results' }, resultRow(result))),
    h('p', { class: 'more' }, h('span', null, t('welcomePanelsMore')), settingsLink('cleanup', 'welcomePanelsOpen')),
  );
}
