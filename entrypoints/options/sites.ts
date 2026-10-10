import { normalizeDomain } from '@/utils/domain';
import { h, icon, siteName } from '@/utils/dom';
import { t, tn } from '@/utils/i18n';
import { ICON_CLOSE, ICON_DOWNLOAD, ICON_EDIT, LEVEL_ICONS, LEVEL_LABELS } from '@/utils/icons';
import { guide } from '@/utils/links';
import { colorForTag, parseList } from '@/utils/listformat';
import { LEVELS, type Level } from '@/utils/matcher';
import { displayLevel, listSites, setSite, type SiteEntry } from '@/utils/personal';
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
      t('sitesHeading'),
      t('sitesIntro'),
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
        editingText ? t('sitesBackToTable') : t('sitesEditAsText'),
      ),
      h(
        'button',
        { class: 'btn', type: 'button', on: { click: () => download('my-anubis-list.anubis', rules.personalText) } },
        icon(ICON_DOWNLOAD),
        t('publishDownload'),
      ),
    ),
    local
      ? h('div', { class: 'notice' }, t('sitesTooBig'))
      : null,
    editingText ? textEditor(rules) : table(rules, entries),
  );
}

function addForm(): HTMLElement {
  const input = h('input', { type: 'text', placeholder: t('sitesAddPlaceholder'), attrs: { 'aria-label': t('popupSite') } });
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
    h('button', { class: 'btn primary', type: 'submit' }, t('sitesAdd')),
  );
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const domain = normalizeDomain(input.value);
    if (!domain) {
      error.textContent = t('sitesNotDomain');
      error.hidden = false;
      return;
    }
    error.hidden = true;
    input.value = '';
    input.blur();
    await editPersonal((text) => setSite(text, domain, level, []));
  });
  return h(
    'div',
    { class: 'panel' },
    h('h3', null, t('popupAddSite')),
    h('p', { class: 'muted' }, t('sitesAddHint'), ' ', helpLink('guide/ranking#how-much-of-the-site', t('sitesAddHelp'))),
    form,
    error,
  );
}

function levelSeg(current: Level | undefined, onPick: (l: Level) => void, compact = true): HTMLElement {
  return h(
    'div',
    { class: compact ? 'levels' : 'levels labelled', attrs: { role: 'group', 'aria-label': t('popupRanking') } },
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
    placeholder: tn('sitesFilter', entries.length),
    value: filter,
    attrs: { 'aria-label': t('sitesFilterLabel') },
  });
  const body = h('tbody');
  const tagIds = [...rules.tags.keys()];

  const renderRows = () => {
    const q = filter.trim().toLowerCase();
    const shown = entries
      .filter((e) => !q || e.site.includes(q) || e.tags.some((id) => id.includes(q)))
      .sort((a, b) => a.site.localeCompare(b.site))
      .slice(0, 500);
    body.replaceChildren(
      ...shown.map((entry) => {
        const level = displayLevel(entry.level);
        const setLevel = (l: Level) => void editPersonal((text) => setSite(text, entry.site, l, entry.tags));
        const available = tagIds.filter((id) => !entry.tags.includes(id));
        const addTag = h(
          'select',
          { class: 'add-tag', attrs: { 'aria-label': t('sitesAddTagTo', entry.site) } },
          h('option', { value: '' }, t('menuAddTagButton')),
          available.map((id) => h('option', { value: id }, rules.tags.get(id)?.label ?? id)),
        );
        addTag.addEventListener('change', () => {
          if (addTag.value) void editPersonal((text) => setSite(text, entry.site, entry.level, [...entry.tags, addTag.value]));
        });
        return h(
          'tr',
          null,
          h('td', { class: 'site' }, siteName(entry.site), entry.level === 'allow' ? h('div', { class: 'muted', style: 'font-weight:400;font-size:12.5px' }, t('sitesKeptNormal')) : null),
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
                    title: t('sitesRemoveTag', tag?.label ?? id, entry.site),
                    on: { click: () => void editPersonal((text) => setSite(text, entry.site, entry.level, entry.tags.filter((x) => x !== id))) },
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
                title: t('sitesForget', entry.site),
                attrs: { 'aria-label': t('sitesForget', entry.site) },
                on: { click: () => void editPersonal((text) => setSite(text, entry.site, 'normal', [])) },
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
                h('thead', null, h('tr', null, h('th', null, t('popupSite')), h('th', null, t('popupRanking')), h('th', null, t('popupTags')), h('th'))),
                body,
              ),
            ),
            entries.length > 500 ? h('p', { class: 'muted' }, t('sitesFirst500')) : null,
          )
        : h('p', { class: 'empty' }, t('sitesNone')),
    ),
  );
}

function textEditor(rules: RuleSet): HTMLElement {
  const area = h('textarea', { class: 'code', spellcheck: false, value: rules.personalText, attrs: { 'aria-label': t('sitesTextLabel') } });
  const status = h('div');
  const check = () => {
    const parsed = parseList(area.value);
    status.replaceChildren(
      parsed.errors.length
        ? h('ul', { class: 'errors' }, parsed.errors.slice(0, 20).map((e) => h('li', null, t('listErrorLine', e.line, e.message))))
        : h('p', { class: 'muted', style: 'font-size:12.5px' }, t('sitesTextReadable', tn('listInstructions', parsed.rules.length), tn('popupTagCount', parsed.tags.length))),
    );
  };
  area.addEventListener('input', check);
  check();
  return h(
    'div',
    { class: 'panel' },
    h('h3', null, t('sitesEditAsText')),
    h('p', { class: 'muted' }, t('sitesTextIntro')),
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
        t('sitesSave'),
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
        t('offerCancel'),
      ),
      h('a', { class: 'text-btn', href: guide('list-format'), target: '_blank', rel: 'noopener noreferrer' }, t('sitesFormatReference')),
    ),
  );
}
