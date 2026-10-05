import { normalizeDomain } from '@/utils/domain';
import { h, icon, plural, siteName } from '@/utils/dom';
import { ICON_CLOSE, ICON_DOWNLOAD, ICON_EDIT, LEVEL_ICONS, LEVEL_LABELS } from '@/utils/icons';
import { guide } from '@/utils/links';
import { colorForTag, parseList } from '@/utils/listformat';
import { LEVELS, type Level } from '@/utils/matcher';
import { listSites, setSite, type SiteEntry } from '@/utils/personal';
import { loadRuleSet, type RuleSet } from '@/utils/ruleset';
import { editPersonal, personalIsLocal, savePersonal } from '@/utils/storage';
import { rerender } from './flash';
import { download, helpLink, pageTitle } from './parts';

let editingText = false;
let filter = '';

export async function renderSites(): Promise<HTMLElement> {
  const rules = await loadRuleSet();
  const entries = listSites(rules.personalText);
  const local = await personalIsLocal();

  return h(
    'div',
    null,
    pageTitle(
      'Your sites',
      'Sites you’ve ranked or hidden yourself. Your choice beats every list you subscribe to. Use the button on any search result, or add sites here.',
      h(
        'button',
        {
          class: 'btn',
          type: 'button',
          on: {
            click: () => {
              editingText = !editingText;
              rerender();
            },
          },
        },
        icon(ICON_EDIT),
        editingText ? 'Back to the table' : 'Edit as text',
      ),
      h(
        'button',
        { class: 'btn', type: 'button', on: { click: () => download('my-anubis-list.anubis', rules.personalText) } },
        icon(ICON_DOWNLOAD),
        'Download my list',
      ),
    ),
    local
      ? h(
          'div',
          { class: 'notice' },
          'Your list is too big for browser sync, so it’s saved on this device only. Download it to keep a copy.',
        )
      : null,
    editingText ? textEditor(rules) : table(rules, entries),
  );
}

function addForm(): HTMLElement {
  const input = h('input', { type: 'text', placeholder: 'Domain or URL, e.g. fandom.com', attrs: { 'aria-label': 'Site' } });
  let level: Level = 'hide';
  const seg = levelSeg(level, (l) => {
    level = l;
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === l)));
  }, false);
  const error = h('div', { class: 'notice error', hidden: true });
  const form = h(
    'form',
    { class: 'inline-form' },
    input,
    seg,
    h('button', { class: 'btn primary', type: 'submit' }, 'Add'),
  );
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const domain = normalizeDomain(input.value);
    if (!domain) {
      error.textContent = 'That doesn’t look like a domain.';
      error.hidden = false;
      return;
    }
    error.hidden = true;
    input.value = '';
    input.blur();
    await editPersonal((t) => setSite(t, domain, level, []));
  });
  return h(
    'div',
    { class: 'panel' },
    h('h3', null, 'Add a site'),
    h('p', { class: 'muted' }, 'It applies to the site and all its subdomains.', ' ', helpLink('guide/ranking#how-much-of-the-site', 'Choosing how much of a site')),
    form,
    error,
  );
}

function levelSeg(current: Level | undefined, onPick: (l: Level) => void, compact = true): HTMLElement {
  return h(
    'div',
    { class: compact ? 'levels' : 'levels labelled', attrs: { role: 'group', 'aria-label': 'Ranking' } },
    LEVELS.map((l) =>
      h(
        'button',
        {
          type: 'button',
          class: l,
          title: LEVEL_LABELS[l],
          attrs: { 'aria-pressed': String(current === l), 'data-level': l, 'aria-label': LEVEL_LABELS[l] },
          on: { click: () => onPick(l) },
        },
        icon(LEVEL_ICONS[l]),
        compact ? null : LEVEL_LABELS[l],
      ),
    ),
  );
}

function table(rules: RuleSet, entries: SiteEntry[]): HTMLElement {
  const search = h('input', {
    type: 'search',
    placeholder: `Filter ${plural(entries.length, 'site')}…`,
    value: filter,
    attrs: { 'aria-label': 'Filter sites' },
  });
  const body = h('tbody');
  const tagIds = [...rules.tags.keys()];

  const renderRows = () => {
    const q = filter.trim().toLowerCase();
    const shown = entries
      .filter((e) => !q || e.site.includes(q) || e.tags.some((t) => t.includes(q)))
      .sort((a, b) => a.site.localeCompare(b.site))
      .slice(0, 500);
    body.replaceChildren(
      ...shown.map((entry) => {
        const level: Level = entry.level === 'allow' ? 'normal' : entry.level;
        const setLevel = (l: Level) => void editPersonal((t) => setSite(t, entry.site, l, entry.tags));
        const available = tagIds.filter((id) => !entry.tags.includes(id));
        const addTag = h(
          'select',
          { class: 'add-tag', attrs: { 'aria-label': `Add a tag to ${entry.site}` } },
          h('option', { value: '' }, 'Add tag'),
          available.map((id) => h('option', { value: id }, rules.tags.get(id)?.label ?? id)),
        );
        addTag.addEventListener('change', () => {
          if (addTag.value) void editPersonal((t) => setSite(t, entry.site, entry.level, [...entry.tags, addTag.value]));
        });
        return h(
          'tr',
          null,
          h('td', { class: 'site' }, siteName(entry.site), entry.level === 'allow' ? h('div', { class: 'muted', style: 'font-weight:400;font-size:12.5px' }, 'Kept at normal, whatever your lists say') : null),
          h('td', null, levelSeg(level, setLevel, true)),
          h(
            'td',
            null,
            h(
              'div',
              { class: 'tag-picks' },
              entry.tags.map((id) => {
                const tag = rules.tags.get(id);
                return h(
                  'button',
                  {
                    class: 'tag',
                    type: 'button',
                    style: `--c: ${tag?.color ?? colorForTag(id)}`,
                    title: `Remove “${tag?.label ?? id}” from ${entry.site}`,
                    on: { click: () => void editPersonal((t) => setSite(t, entry.site, entry.level, entry.tags.filter((x) => x !== id))) },
                  },
                  h('i', { class: 'gem' }),
                  tag?.label ?? id,
                );
              }),
              available.length ? addTag : null,
            ),
          ),
          h(
            'td',
            { class: 'actions' },
            h(
              'button',
              {
                class: 'icon-btn danger',
                type: 'button',
                title: `Forget ${entry.site}`,
                attrs: { 'aria-label': `Forget ${entry.site}` },
                on: { click: () => void editPersonal((t) => setSite(t, entry.site, 'normal', [])) },
              },
              icon(ICON_CLOSE),
            ),
          ),
        );
      }),
    );
  };
  search.addEventListener('input', () => {
    filter = search.value;
    renderRows();
  });
  renderRows();

  return h(
    'div',
    null,
    addForm(),
    h(
      'div',
      { class: 'panel' },
      entries.length
        ? h(
            'div',
            null,
            h('div', { class: 'inline-form', style: 'margin-bottom:12px' }, search),
            h(
              'div',
              { class: 'sites-scroll' },
              h(
                'table',
                { class: 'sites' },
                h('thead', null, h('tr', null, h('th', null, 'Site'), h('th', null, 'Ranking'), h('th', null, 'Tags'), h('th'))),
                body,
              ),
            ),
            entries.length > 500 ? h('p', { class: 'muted' }, 'Showing the first 500. Filter to find the rest.') : null,
          )
        : h('p', { class: 'empty' }, 'No sites yet. Add one above, or use the button on a search result.'),
    ),
  );
}

function textEditor(rules: RuleSet): HTMLElement {
  const area = h('textarea', { class: 'code', spellcheck: false, value: rules.personalText, attrs: { 'aria-label': 'Your list as text' } });
  const status = h('div');
  const check = () => {
    const parsed = parseList(area.value);
    status.replaceChildren(
      parsed.errors.length
        ? h('ul', { class: 'errors' }, parsed.errors.slice(0, 20).map((e) => h('li', null, `Line ${e.line}: ${e.message}`)))
        : h('p', { class: 'muted', style: 'font-size:12.5px' }, `${plural(parsed.rules.length, 'instruction')} and ${plural(parsed.tags.length, 'tag')}, all readable.`),
    );
  };
  area.addEventListener('input', check);
  check();
  return h(
    'div',
    { class: 'panel' },
    h('h3', null, 'Edit as text'),
    h(
      'p',
      { class: 'muted' },
      'Your list in the Anubis list format: Brave Goggles syntax plus tags. It’s exactly the file you would publish. Lines the table can’t show are kept as written.',
    ),
    area,
    status,
    h(
      'div',
      { class: 'toolbar', style: 'margin-top:12px' },
      h(
        'button',
        {
          class: 'btn primary',
          type: 'button',
          on: {
            click: async () => {
              await savePersonal(area.value);
              editingText = false;
              rerender();
            },
          },
        },
        'Save',
      ),
      h(
        'button',
        {
          class: 'btn',
          type: 'button',
          on: {
            click: () => {
              editingText = false;
              rerender();
            },
          },
        },
        'Cancel',
      ),
      h('a', { class: 'text-btn', href: guide('list-format'), target: '_blank', rel: 'noopener noreferrer' }, 'Format reference'),
    ),
  );
}
