import '@/assets/theme.css';
import './style.css';
import { normalizeDomain } from '@/utils/domain';
import { append, h, icon, plural } from '@/utils/dom';
import { ICON_CLOSE, ICON_HIDE, ICON_SHOW, LEVEL_CHIPS, LEVEL_ICONS } from '@/utils/icons';
import { send, sendToActiveTab, type PageStats } from '@/utils/messages';
import { listSites, setSite, setSiteLevel, type PersonalLevel } from '@/utils/personal';
import { loadRuleSet, watchRuleSet } from '@/utils/ruleset';
import { editPersonal, updateSettings } from '@/utils/storage';
import { initTheme, themeSwitcher } from '@/utils/theme';

// The toolbar popup: what Anubis did on this page, a quick way to weigh a site,
// and the sites you've weighed most recently.

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const form = $<HTMLFormElement>('#add-form');
const input = $<HTMLInputElement>('#domain');
const levelSelect = $<HTMLSelectElement>('#level');
const list = $<HTMLUListElement>('#list');
const enabled = $<HTMLInputElement>('#enabled');


async function renderAll() {
  const rules = await loadRuleSet();
  enabled.checked = rules.settings.enabled;
  document.body.classList.toggle('paused', !rules.settings.enabled);
  $('#status').textContent = rules.settings.enabled ? 'Weighing your searches' : 'Paused';

  const sites = listSites(rules.personalText).reverse();
  $('#count').textContent = sites.length ? String(sites.length) : '';
  list.replaceChildren(
    ...(sites.length
      ? sites.slice(0, 40).map((entry) => {
          const level = entry.level === 'allow' ? 'normal' : entry.level;
          return h(
            'li',
            null,
            h('span', { class: 'site', title: entry.site }, entry.site),
            h(
              'span',
              { class: 'chips' },
              level !== 'normal'
                ? h('span', { class: `level-chip ${level}` }, icon(LEVEL_ICONS[level]), LEVEL_CHIPS[level])
                : entry.level === 'allow'
                  ? h('span', { class: 'level-chip' }, 'Allowed')
                  : null,
              entry.tags.slice(0, 2).map((id) => {
                const tag = rules.tags.get(id);
                return h('span', { class: 'chip', style: `--c: ${tag?.color ?? 'var(--gold)'}` }, h('i', { class: 'dot' }), tag?.label ?? id);
              }),
            ),
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
          );
        })
      : [h('li', { class: 'muted' }, 'Nothing weighed yet. Use the Anubis button on any search result.')]),
  );

  const subs = rules.lists.filter((l) => !l.personal);
  $('#lists-summary').textContent = `${plural(subs.length, 'list')} · ${plural(rules.tags.size, 'tag')}`;
}

function renderPage(stats: PageStats | undefined) {
  const page = $('#page');
  if (!stats) {
    page.replaceChildren(
      h('div', { class: 'label' }, 'This page'),
      h('p', { class: 'page-empty' }, 'Open a search on Google, DuckDuckGo, Bing, Brave and others to see Anubis at work.'),
    );
    return;
  }
  const stat = (n: number, label: string) => h('div', { class: `stat${n ? ' hot' : ''}` }, h('b', null, n), h('span', null, label));
  page.replaceChildren();
  append(
    page,
    [
    h(
      'div',
      { class: 'page-head' },
      h('div', { class: 'label', style: 'margin:0' }, 'This page'),
      h('span', { class: 'muted', style: 'font-size:12px' }, `${stats.engine} · ${plural(stats.total, 'result')}`),
    ),
    h(
      'div',
      { class: 'stats' },
      stat(stats.hidden, 'hidden'),
      stat(stats.pinned, 'pinned'),
      stat(stats.raised, 'raised'),
      stat(stats.lowered, 'lowered'),
      stat(stats.tagged, 'tagged'),
    ),
    stats.hidden
      ? h(
          'button',
          {
            class: 'btn small',
            type: 'button',
            on: {
              click: async () => renderPage(await sendToActiveTab<PageStats>({ type: 'set-reveal', on: !stats.revealed })),
            },
          },
          icon(stats.revealed ? ICON_HIDE : ICON_SHOW),
          stats.revealed ? 'Hide them again' : `Show ${plural(stats.hidden, 'hidden result')}`,
        )
      : null,
    ],
  );
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const domain = normalizeDomain(input.value);
  if (!domain) {
    input.focus();
    input.select();
    return;
  }
  await editPersonal((t) => setSiteLevel(t, domain, levelSelect.value as PersonalLevel));
  input.value = '';
});

enabled.addEventListener('change', () => void updateSettings({ enabled: enabled.checked }));
$('#settings').addEventListener('click', () => {
  void send({ type: 'open-options' });
  window.close();
});

async function main() {
  $('#theme').append(themeSwitcher(await initTheme(), true));
  await renderAll();
  renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' }));
  watchRuleSet(async () => {
    await renderAll();
    // The page re-weighs itself after a change; ask again a moment later.
    setTimeout(async () => renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' })), 150);
  });
}

void main();
