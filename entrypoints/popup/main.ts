import '@/assets/theme.css';
import './style.css';
import { browser } from '#imports';
import { balanceSvg, setBalance } from '@/utils/balance';
import { domainChoices, normalizeDomain, siteOf } from '@/utils/domain';
import { engineFor } from '@/utils/engines';
import { guide } from '@/utils/links';
import { LEVELS, TAG_CHOICES, evaluate, type Level } from '@/utils/matcher';
import { h, icon } from '@/utils/dom';
import { ICON_GEAR, LEVEL_CHIPS, LEVEL_ICONS, LEVEL_LABELS } from '@/utils/icons';
import { localizePage, t, tn, type MessageKey } from '@/utils/i18n';
import { hiddenCount, send, sendToActiveTab, type PageStats } from '@/utils/messages';
import { PERSONAL_NAME, getSite, listSites, setSiteLevel, toggleSiteTag, type PersonalLevel } from '@/utils/personal';
import { loadRuleSet, watchRuleSet, type RuleSet } from '@/utils/ruleset';
import { editPersonal, updateSettings } from '@/utils/storage';
import { summarySentence } from '@/utils/summary';
import { initTheme } from '@/utils/theme';

// The toolbar popup changes with the tab. On a search page: what Anubis did there,
// and the tags to show only. On any other site: that site, to rank or tag for future
// searches, with the result menu's cartouche and balance. Elsewhere: adding a site
// by hand. The last few sites in your list are always underneath.

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const input = $<HTMLInputElement>('#domain');
const list = $<HTMLUListElement>('#list');
const enabled = $<HTMLInputElement>('#enabled');
const addSection = $('#add');

/** How many sites from your list the popup shows, newest first. */
const RECENT = 3;

/** Keys set for the keyboard shortcuts (the manifest's `commands`), by name. */
let shortcuts: Record<string, string> = {};
const withKey = (text: string, command: string) => (shortcuts[command] ? t('withShortcut', text, shortcuts[command]) : text);

/** The tooltip on each ranking button under This site. */
const RANK_TITLES: Record<Level, MessageKey> = {
  hide: 'popupRankHide',
  lower: 'popupRankLower',
  normal: 'popupRankNormal',
  raise: 'popupRankRaise',
  pin: 'popupRankPin',
};

/** The tab's address, when it's a web page. */
let tabUrl: URL | undefined;
/** The site under This site, once chosen from the cartouche. */
let hereDomain: string | undefined;
/** Kept across renders so it swings to a new ranking instead of jumping. */
const balance = balanceSvg();
let stats: PageStats | undefined;

const openSettings = (tab?: string) => {
  void send({ type: 'open-options', tab });
  window.close();
};

async function renderAll() {
  const rules = await loadRuleSet();
  enabled.checked = rules.settings.enabled;
  document.body.classList.toggle('paused', !rules.settings.enabled);
  $('#status').textContent = rules.settings.enabled ? t('popupOn') : t('popupOff');

  const sites = listSites(rules.personalText).reverse();
  const seeAll = $<HTMLButtonElement>('#see-all');
  seeAll.hidden = sites.length <= RECENT;
  seeAll.textContent = t('popupSeeAll', sites.length);
  list.replaceChildren(
    ...(sites.length
      ? sites.slice(0, RECENT).map((entry) => {
          const level = entry.level === 'allow' ? 'normal' : entry.level;
          return h(
            'li',
            null,
            h('span', { class: 'site', title: entry.site }, entry.site),
            level !== 'normal'
              ? h('span', { class: `level-note ${level}` }, icon(LEVEL_ICONS[level]), LEVEL_CHIPS[level])
              : entry.level === 'allow'
                ? h('span', { class: 'level-note' }, t('popupKeptNormal'))
                : entry.tags.length
                  ? h('span', { class: 'level-note' }, tn('popupTagCount', entry.tags.length))
                  : null,
          );
        })
      : [h('li', { class: 'muted' }, t('popupNoSites'))]),
  );

  const subs = rules.lists.filter((l) => !l.personal);
  $('#lists-summary').textContent = t('popupListsAndTags', tn('popupListCount', subs.length), tn('popupTagCount', rules.tags.size));
  renderHere(rules);
}

/** The site in the current tab, when it isn't a search page: rank it for future searches. */
function renderHere(rules: RuleSet) {
  const here = $('#here');
  const host = tabUrl && !engineFor(tabUrl.hostname) ? tabUrl.hostname : '';
  const choices = host ? domainChoices(host) : [];
  const domain =
    hereDomain && choices.includes(hereDomain)
      ? hereDomain
      : (choices.find((d) => getSite(rules.personalText, d)) ?? (host ? siteOf(host) : ''));
  if (!domain || !normalizeDomain(domain)) {
    here.hidden = true;
    return;
  }
  here.hidden = false;

  const entry = getSite(rules.personalText, domain);
  const personal = entry?.level;
  const pressed: Level | undefined = personal === 'allow' ? 'normal' : personal && personal !== 'normal' ? personal : undefined;
  const result = { url: tabUrl!.href, title: '', description: '' };
  const baseline = evaluate(result, rules.lists.filter((l) => !l.personal), rules.prefs);
  const fromLists = baseline.level;
  const shown: Level = pressed ?? fromLists;

  // As in the result menu, the name sits in the ring and a select lies unseen over it
  // when the ranking can cover more or less of the site.
  let cartouche: HTMLElement;
  if (choices.length > 1) {
    const select = h(
      'select',
      { title: t('popupSiteChoice'), attrs: { 'aria-label': t('popupSite') } },
      choices.map((d) => h('option', { value: d, selected: d === domain }, d)),
    );
    select.addEventListener('change', () => {
      hereDomain = select.value;
      renderHere(rules);
    });
    cartouche = h('span', { class: 'cartouche choosable' }, h('span', { class: 'name', attrs: { 'aria-hidden': 'true' } }, domain), select);
  } else {
    cartouche = h('span', { class: 'cartouche' }, h('span', { class: 'name' }, domain));
  }

  const levels = h(
    'div',
    { class: 'seg levels', attrs: { role: 'group', 'aria-label': t('popupRankingFor', domain) } },
    LEVELS.map((level) =>
      h(
        'button',
        {
          type: 'button',
          class: `${level}${!pressed && level === fromLists && level !== 'normal' ? ' from-list' : ''}`,
          title: t(RANK_TITLES[level], domain),
          attrs: { 'aria-pressed': String(pressed === level) },
          on: {
            click: () => {
              hereDomain = domain;
              // "Normal" has to beat the lists when they rank this site, so it becomes an explicit allow.
              const next: PersonalLevel =
                level === 'normal' ? (fromLists === 'normal' ? 'normal' : 'allow') : pressed === level ? 'normal' : level;
              void editPersonal((text) => setSiteLevel(text, domain, next));
            },
          },
        },
        LEVEL_LABELS[level],
      ),
    ),
  );

  let hint: string;
  if (personal === 'allow') hint = t('popupHintAllow');
  else if (pressed) hint = t('popupHintMine', domain);
  else if (fromLists !== 'normal') {
    const names = [...new Set(baseline.reasons.filter((r) => r.listId !== TAG_CHOICES).map((r) => r.list))];
    if (baseline.reasons.some((r) => r.listId === TAG_CHOICES)) names.push(t('popupYourTagSettings'));
    hint = t('popupHintLists', LEVEL_CHIPS[fromLists], names.join(', '));
  } else hint = t('popupHintNone');

  // Tags you set toggle; tags from lists are shown but fixed.
  const verdict = evaluate(result, rules.lists, rules.prefs);
  const mine = new Set(entry?.tags ?? []);
  const fromList = new Set(verdict.tags.filter((id) => (verdict.tagSources[id] ?? []).some((s) => s !== PERSONAL_NAME)));
  const tagIds = [...rules.tags.keys()].sort((a, b) => {
    const rank = (id: string) => (mine.has(id) ? 0 : fromList.has(id) ? 1 : 2);
    return rank(a) - rank(b) || rules.tags.get(a)!.label.localeCompare(rules.tags.get(b)!.label);
  });
  const tagItems = tagIds.map((id) => {
    const tag = rules.tags.get(id)!;
    const on = mine.has(id);
    if (!on && fromList.has(id)) {
      return h(
        'span',
        { class: 'tag', style: `--c: ${tag.color}`, title: t('popupTagFrom', (verdict.tagSources[id] ?? []).join(', ')) },
        h('i', { class: 'gem' }),
        tag.label,
      );
    }
    return h(
      'button',
      {
        type: 'button',
        class: `tag${on ? '' : ' off'}`,
        style: `--c: ${tag.color}`,
        title: tag.description ?? (on ? t('popupUntag', domain) : t('popupTagSite', domain, tag.label)),
        attrs: { 'aria-pressed': String(on) },
        on: {
          click: () => {
            hereDomain = domain;
            void editPersonal((text) => toggleSiteTag(text, domain, id));
          },
        },
      },
      h('i', { class: on ? 'gem' : 'gem hollow' }),
      tag.label,
    );
  });

  here.replaceChildren(
    h('div', { class: 'weigh' }, cartouche, balance, levels, h('p', { class: 'hint' }, hint)),
    ...(tagItems.length ? [h('div', { class: 'here-tags' }, h('h2', null, t('popupTags')), h('div', { class: 'tags' }, tagItems))] : []),
  );
  requestAnimationFrame(() => requestAnimationFrame(() => setBalance(balance, shown)));
}

function renderPage(next: PageStats | undefined) {
  stats = next;
  const page = $('#page');
  const nothingHere = !stats && $('#here').hidden;
  page.hidden = !stats && !nothingHere;
  // Adding by hand leads when the tab has nothing else to show.
  if (nothingHere) addSection.hidden = false;
  $('#add-toggle').hidden = !addSection.hidden;
  if (!stats) {
    page.replaceChildren(h('h2', null, t('popupThisPage')), h('p', { class: 'sentence muted' }, t('popupNotSearch')));
    return;
  }
  const current = stats;

  const refreshSoon = () =>
    setTimeout(async () => renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' })), 2500);
  const actions = [
    hiddenCount(current)
      ? h(
          'button',
          {
            class: 'text-btn',
            type: 'button',
            title: withKey(current.revealed ? t('hideAgain') : t('showHidden'), 'toggle-hidden'),
            on: { click: async () => renderPage(await sendToActiveTab<PageStats>({ type: 'set-reveal', on: !current.revealed })) },
          },
          current.revealed ? t('hideAgain') : t('showHidden'),
        )
      : null,
    current.canGoDeeper || current.loading
      ? h(
          'button',
          {
            class: 'text-btn',
            type: 'button',
            disabled: current.loading,
            title: t('loadMoreTitle'),
            on: {
              click: async () => {
                renderPage(await sendToActiveTab<PageStats>({ type: 'go-deeper' }));
                refreshSoon();
              },
            },
          },
          current.loading ? t('loading') : t('loadMore'),
        )
      : null,
  ].filter((b): b is HTMLButtonElement => b !== null);

  // The tags on the page's results, as in the summary above them: pick one to see only its results.
  const filters = current.tags.slice(0, 8).map((tag) => {
    const on = current.filter === tag.id;
    return h(
      'button',
      {
        type: 'button',
        class: 'tag-filter',
        style: `--c: ${tag.color}`,
        title: on ? t('summaryFilterOff') : t('summaryFilterOn', tag.label),
        attrs: { 'aria-pressed': String(on) },
        on: {
          click: async () => renderPage(await sendToActiveTab<PageStats>({ type: 'set-filter', tag: on ? undefined : tag.id })),
        },
      },
      h('i', { class: 'gem' }),
      tag.label,
      h('span', { class: 'count' }, tag.count),
    );
  });

  page.replaceChildren(
    h('h2', null, t('popupThisPageOn', current.engine)),
    h('p', { class: 'sentence' }, summarySentence(current)),
    ...(actions.length ? [h('div', { class: 'page-actions' }, actions)] : []),
    ...(filters.length
      ? [
          h('h2', { class: 'filters-label' }, t('popupShowOnly')),
          h('div', { class: 'seg filters', attrs: { role: 'group', 'aria-label': t('summaryFilterLabel') } }, filters),
        ]
      : []),
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
  // Enter picks the first button, Hide.
  const level = ((e.submitter as HTMLButtonElement | null)?.value || 'hide') as PersonalLevel;
  await editPersonal((t) => setSiteLevel(t, domain, level));
  input.value = '';
});

$('#add-toggle').addEventListener('click', () => {
  addSection.hidden = false;
  $('#add-toggle').hidden = true;
  input.focus();
});

enabled.addEventListener('change', () => void updateSettings({ enabled: enabled.checked }));
$<HTMLAnchorElement>('#help').href = guide();
$('#settings').append(icon(ICON_GEAR));
$('#settings').addEventListener('click', () => openSettings());
$('#see-all').addEventListener('click', () => openSettings('sites'));
$('#lists-summary').addEventListener('click', () => openSettings('lists'));

async function main() {
  localizePage();
  // Firefox for Android has no keyboard shortcuts.
  const commands = (await browser.commands?.getAll().catch(() => [])) ?? [];
  shortcuts = Object.fromEntries(commands.filter((c) => c.name && c.shortcut).map((c) => [c.name!, c.shortcut!]));
  $('.switch').title = withKey(t('commandToggleEnabled'), 'toggle-enabled');
  await initTheme();
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab?.url ?? '');
    if (/^https?:$/.test(url.protocol)) tabUrl = url;
  } catch {
    // No URL (a browser page, or no access): nothing to rank.
  }
  await renderAll();
  renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' }));
  watchRuleSet(async () => {
    await renderAll();
    // The page updates itself after a change; ask again a moment later.
    setTimeout(async () => renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' })), 150);
  });
}

void main();
