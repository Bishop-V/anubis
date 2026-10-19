import { h } from '@/utils/dom';
import { describeRemoved } from '@/utils/cleanup';
import { t, tn, type MessageKey } from '@/utils/i18n';
import { TAG_PALETTE } from '@/utils/listformat';
import { STARTER_LISTS, STARTER_TAGS, resultRow, sample, slide, tagChip, type DemoResult } from './parts';

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

/** Lists: three starter lists with switches, and results that gain their tags and move when one is on. */
export function renderListsExample(box: HTMLElement, subscribed: number): void {
  const results = ['stackoverflow.com', 'en.wikipedia.org', 'docs.python.org'].map(sample);
  /** Which list each tag comes from; Official docs also raises the sites it tags, as its description says. */
  const from = (tag: string) => STARTER_LISTS.find((list) => list.tags.some((x) => x.id === tag))!;
  const raises = (tag: string) => tag === 'docs';
  const on = new Set(STARTER_LISTS);
  const rows = new Map(results.map((r) => [r, resultRow(r)]));
  const list = h('ol', { class: 'results' });
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    const before = new Map([...rows.values()].map((row) => [row, row.getBoundingClientRect().top]));
    for (const [r, row] of rows) {
      const tagged = !!r.tag && on.has(from(r.tag));
      row.querySelector('.chips')!.replaceChildren(...(tagged ? [tagChip(STARTER_TAGS[r.tag!]!, raises(r.tag!) ? 'raise' : undefined)] : []));
    }
    const lifted = (r: DemoResult) => !!r.tag && raises(r.tag) && on.has(from(r.tag));
    list.replaceChildren(...[...results].sort((a, b) => Number(lifted(b)) - Number(lifted(a))).map((r) => rows.get(r)!));
    if (!still) for (const row of rows.values()) if (before.get(row)) slide(row, before.get(row)!);
  }

  box.replaceChildren(
    h('p', null, t('welcomeListsHow')),
    h(
      'ul',
      { class: 'switches' },
      STARTER_LISTS.map((parsed) =>
        h(
          'li',
          null,
          h('span', { class: 'name' }, parsed.meta.name ?? ''),
          h('span', { class: 'description' }, parsed.meta.description ?? ''),
          switchFor(parsed.meta.name ?? '', true, (checked) => {
            if (checked) on.add(parsed);
            else on.delete(parsed);
            draw();
          }),
        ),
      ),
    ),
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
