import '@/assets/theme.css';
import './style.css';
import { browser } from '#imports';
import { domainChoices, normalizeDomain, siteOf } from '@/utils/domain';
import { engineFor } from '@/utils/engines';
import { guide } from '@/utils/links';
import { LEVELS } from '@/utils/matcher';
import { h, icon } from '@/utils/dom';
import { ICON_CLOSE, LEVEL_CHIPS, LEVEL_ICONS, LEVEL_LABELS } from '@/utils/icons';
import { localizePage, t, tn, type MessageKey } from '@/utils/i18n';
import { hiddenCount, send, sendToActiveTab, type PageStats } from '@/utils/messages';
import { getSite, listSites, setSite, setSiteLevel, type PersonalLevel } from '@/utils/personal';
import { loadRuleSet, watchRuleSet } from '@/utils/ruleset';
import { editPersonal, updateSettings } from '@/utils/storage';
import { summarySentence } from '@/utils/summary';
import { initTheme, themeSwitcher } from '@/utils/theme';

// The toolbar popup: what Anubis did on this page, a quick way to rank or hide a
// site, and the sites you've ranked most recently.

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const input = $<HTMLInputElement>('#domain');
const levelSelect = $<HTMLSelectElement>('#level');
const list = $<HTMLUListElement>('#list');
const enabled = $<HTMLInputElement>('#enabled');

/** Keys set for the keyboard shortcuts (the manifest's `commands`), by name. */
let shortcuts: Record<string, string> = {};
const withKey = (text: string, command: string) => (shortcuts[command] ? t('withShortcut', text, shortcuts[command]) : text);

/** The tooltip on each ranking button under This site. */
const RANK_TITLES: Record<(typeof LEVELS)[number], MessageKey> = {
  hide: 'popupRankHide',
  lower: 'popupRankLower',
  normal: 'popupRankNormal',
  raise: 'popupRankRaise',
  pin: 'popupRankPin',
};

async function renderAll() {
  const rules = await loadRuleSet();
  enabled.checked = rules.settings.enabled;
  document.body.classList.toggle('paused', !rules.settings.enabled);
  $('#status').textContent = rules.settings.enabled ? t('popupOn') : t('popupOff');

  const sites = listSites(rules.personalText).reverse();
  $('#count').textContent = sites.length ? String(sites.length) : '';
  list.replaceChildren(
    ...(sites.length
      ? sites.slice(0, 40).map((entry) => {
          const level = entry.level === 'allow' ? 'normal' : entry.level;
          return h(
            'li',
            null,
            h(
              'div',
              { class: 'info' },
              h('span', { class: 'site', title: entry.site }, entry.site),
              h(
                'span',
                { class: 'notes' },
                level !== 'normal'
                  ? h('span', { class: `level-note ${level}` }, icon(LEVEL_ICONS[level]), LEVEL_CHIPS[level])
                  : entry.level === 'allow'
                    ? h('span', { class: 'level-note' }, t('popupKeptNormal'))
                    : null,
                entry.tags.map((id) => {
                  const tag = rules.tags.get(id);
                  return h('span', { class: 'tag', style: `--c: ${tag?.color ?? 'var(--gold)'}` }, h('i', { class: 'gem' }), tag?.label ?? id);
                }),
              ),
            ),
            h(
              'button',
              {
                class: 'icon-btn danger',
                type: 'button',
                title: t('popupForget', entry.site),
                attrs: { 'aria-label': t('popupForget', entry.site) },
                on: { click: () => void editPersonal((t) => setSite(t, entry.site, 'normal', [])) },
              },
              icon(ICON_CLOSE),
            ),
          );
        })
      : [h('li', { class: 'muted' }, t('popupNoSites'))]),
  );

  const subs = rules.lists.filter((l) => !l.personal);
  $('#lists-summary').textContent = t('popupListsAndTags', tn('popupListCount', subs.length), tn('popupTagCount', rules.tags.size));
  await renderHere(rules.personalText);
}

/** The site in the current tab, when it isn't a search page: rank it for future searches. */
async function renderHere(personalText: string) {
  const here = $('#here');
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let host = '';
  try {
    const url = new URL(tab?.url ?? '');
    if (/^https?:$/.test(url.protocol) && !engineFor(url.hostname)) host = url.hostname;
  } catch {
    // No URL (a browser page, or no access): nothing to rank.
  }
  const domain = host ? (domainChoices(host).find((d) => getSite(personalText, d)) ?? siteOf(host)) : '';
  if (!domain || !normalizeDomain(domain)) {
    here.hidden = true;
    return;
  }
  const entry = getSite(personalText, domain);
  const current = entry?.level === 'allow' ? 'normal' : (entry?.level ?? 'normal');
  here.hidden = false;
  here.replaceChildren(
    h('h2', null, t('popupThisSite')),
    h('p', { class: 'sentence here-site' }, domain),
    h(
      'div',
      { class: 'seg here-levels', attrs: { role: 'group', 'aria-label': t('popupRankingFor', domain) } },
      LEVELS.map((level) =>
        h(
          'button',
          {
            type: 'button',
            title: t(RANK_TITLES[level], domain),
            attrs: { 'aria-pressed': String(current === level) },
            on: { click: () => void editPersonal((t) => setSiteLevel(t, domain, level === current ? 'normal' : level)) },
          },
          LEVEL_LABELS[level],
        ),
      ),
    ),
  );
}

function renderPage(stats: PageStats | undefined) {
  const page = $('#page');
  if (!stats) {
    page.replaceChildren(
      h('h2', null, t('popupThisPage')),
      h('p', { class: 'sentence muted' }, t('popupNotSearch')),
    );
    return;
  }
  const refreshSoon = () =>
    setTimeout(async () => renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' })), 2500);
  const actions = [
    hiddenCount(stats)
      ? h(
          'button',
          {
            class: 'text-btn',
            type: 'button',
            title: withKey(stats.revealed ? t('hideAgain') : t('showHidden'), 'toggle-hidden'),
            on: { click: async () => renderPage(await sendToActiveTab<PageStats>({ type: 'set-reveal', on: !stats.revealed })) },
          },
          stats.revealed ? t('hideAgain') : t('showHidden'),
        )
      : null,
    stats.canGoDeeper || stats.loading
      ? h(
          'button',
          {
            class: 'text-btn',
            type: 'button',
            disabled: stats.loading,
            title: t('loadMoreTitle'),
            on: {
              click: async () => {
                renderPage(await sendToActiveTab<PageStats>({ type: 'go-deeper' }));
                refreshSoon();
              },
            },
          },
          stats.loading ? t('loading') : t('loadMore'),
        )
      : null,
  ].filter((b): b is HTMLButtonElement => b !== null);
  page.replaceChildren(
    h('h2', null, t('popupThisPageOn', stats.engine)),
    h('p', { class: 'sentence' }, summarySentence(stats)),
    ...(actions.length ? [h('div', { class: 'page-actions' }, actions)] : []),
  );
}

$<HTMLFormElement>('#add-form').addEventListener('submit', async (e) => {
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
$<HTMLAnchorElement>('#help').href = guide();
$('#settings').addEventListener('click', () => {
  void send({ type: 'open-options' });
  window.close();
});

async function main() {
  localizePage();
  // Firefox for Android has no keyboard shortcuts.
  const commands = (await browser.commands?.getAll().catch(() => [])) ?? [];
  shortcuts = Object.fromEntries(commands.filter((c) => c.name && c.shortcut).map((c) => [c.name!, c.shortcut!]));
  $('.switch').title = withKey(t('commandToggleEnabled'), 'toggle-enabled');
  $('#theme').append(themeSwitcher(await initTheme(), true));
  await renderAll();
  renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' }));
  watchRuleSet(async () => {
    await renderAll();
    // The page updates itself after a change; ask again a moment later.
    setTimeout(async () => renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' })), 150);
  });
}

void main();
