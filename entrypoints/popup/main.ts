import '@/assets/theme.css';
import './style.css';
import { browser } from '#imports';
import { balanceSvg, setBalance } from '@/utils/balance';
import { domainChoices, normalizeDomain, siteOf } from '@/utils/domain';
import { engineFor } from '@/utils/engines';
import { bugReportLink, describeBrowser, guide } from '@/utils/links';
import { LEVELS, evaluate, type Level } from '@/utils/matcher';
import { h, icon, siteName } from '@/utils/dom';
import { ICON_GEAR, LEVEL_CHIPS, LEVEL_ICONS, LEVEL_LABELS } from '@/utils/icons';
import { localizePage, t, tJoin, tn, type MessageKey } from '@/utils/i18n';
import { colorForTag, slugifyTag } from '@/utils/listformat';
import { hiddenCount, send, sendToActiveTab, type PageStats } from '@/utils/messages';
import { displayLevel, getSite, listSites, setSiteLevel, toggleSiteTag, upsertTagDef, type PersonalLevel } from '@/utils/personal';
import { loadRuleSet, watchRuleSet, type RuleSet } from '@/utils/ruleset';
import { editPersonal, updateSettings } from '@/utils/storage';
import { fromListsClass, nextLevel, rankingHint, rankingOf, siteCartouche, tagOrder } from '@/utils/siteranking';
import { stoppedSentence, summarySentence } from '@/utils/summary';
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
let hereFocusKey: string | undefined;
/** Counts renders, so one that a newer render overtook doesn't draw older data over it. */
let rendering = 0;

const openSettings = (tab?: string) => {
  void send({ type: 'open-options', tab });
  window.close();
};

async function renderAll() {
  const ticket = ++rendering;
  const rules = await loadRuleSet();
  if (ticket !== rendering) return;
  enabled.checked = rules.settings.enabled;
  document.body.classList.toggle('paused', !rules.settings.enabled);
  $('#status').replaceChildren(
    h('i', { class: rules.settings.enabled ? 'gem' : 'gem hollow', attrs: { 'aria-hidden': 'true' } }),
    rules.settings.enabled ? t('popupOn') : t('popupOff'),
  );

  const sites = listSites(rules.personalText).reverse();
  const seeAll = $<HTMLButtonElement>('#see-all');
  seeAll.hidden = sites.length <= RECENT;
  seeAll.textContent = t('popupSeeAll', sites.length);
  list.replaceChildren(
    ...(sites.length
      ? sites.slice(0, RECENT).map((entry) => {
          const level = displayLevel(entry.level);
          const onlyTag = entry.tags.length === 1 ? rules.tags.get(entry.tags[0]!) : undefined;
          return h(
            'li',
            null,
            h('span', { class: 'site', title: entry.site }, siteName(entry.site)),
            level !== 'normal'
              ? h('span', { class: `level-note ${level}` }, icon(LEVEL_ICONS[level]), LEVEL_CHIPS[level])
              : entry.level === 'allow'
                ? h('span', { class: 'level-note' }, t('popupKeptNormal'))
                : onlyTag
                  ? h('span', { class: 'tag', style: `--c: ${onlyTag.color}` }, h('i', { class: 'gem' }), onlyTag.label)
                  : entry.tags.length
                    ? h('span', { class: 'level-note' }, tn('popupTagCount', entry.tags.length))
                    : null,
          );
        })
      : [h('li', { class: 'empty' }, balanceSvg({ empty: true }), h('p', null, t('popupNoSites')))]),
  );

  const subs = rules.lists.filter((l) => !l.personal);
  $('#lists-summary').textContent = t('popupListsAndTags', tn('popupListCount', subs.length), tn('popupTagCount', rules.tags.size));
  renderHere(rules);
}

/** The site in the current tab, when it isn't a search page: rank it for future searches. */
function renderHere(rules: RuleSet) {
  const here = $('#here');
  const active = document.activeElement;
  const focusKey = hereFocusKey ?? (here.contains(active) && active instanceof HTMLElement ? active.dataset.focusKey : undefined);
  const host = tabUrl && !engineFor(tabUrl.hostname) ? tabUrl.hostname : '';
  const choices = host ? domainChoices(host, (d) => !!getSite(rules.personalText, d)) : [];
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
  const result = { url: tabUrl!.href, title: '', description: '' };
  const baseline = evaluate(result, rules.lists.filter((l) => !l.personal), rules.prefs);
  const r = rankingOf(entry, baseline);

  const cartouche = siteCartouche(domain, choices, (d) => {
    hereDomain = d;
    renderHere(rules);
  });

  const levels = h(
    'div',
    { class: 'seg levels', attrs: { role: 'group', 'aria-label': t('popupRankingFor', domain) } },
    LEVELS.map((level) =>
      h(
        'button',
        {
          type: 'button',
          class: `${level}${fromListsClass(level, r)}`,
          title: t(RANK_TITLES[level], domain),
          attrs: { 'aria-pressed': String(r.pressed === level) },
          on: {
            click: () => {
              hereDomain = domain;
              void editPersonal((text) => setSiteLevel(text, domain, nextLevel(level, r)));
            },
          },
        },
        h('span', { class: 'level-icon' }, icon(LEVEL_ICONS[level])),
        LEVEL_LABELS[level],
      ),
    ),
  );

  const verdict = evaluate(result, rules.lists, rules.prefs);
  const hint = rankingHint(domain, baseline, r, verdict);

  const { mine, fromList, ids: tagIds } = tagOrder(rules.tags, entry, verdict);
  // Tags you set toggle; tags from lists are shown but fixed.
  const tagItems = tagIds.map((id) => {
    const tag = rules.tags.get(id)!;
    const on = mine.has(id);
    if (!on && fromList.has(id)) {
      return h(
        'span',
        { class: 'tag', style: `--c: ${tag.color}`, title: t('popupTagFrom', tJoin(verdict.tagSources[id] ?? [])) },
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
        attrs: { 'aria-pressed': String(on), 'data-focus-key': `tag-${id}` },
        on: {
          click: () => {
            hereDomain = domain;
            hereFocusKey = `tag-${id}`;
            void editPersonal((text) => toggleSiteTag(text, domain, id));
          },
        },
      },
      h('i', { class: on ? 'gem' : 'gem hollow' }),
      tag.label,
    );
  });

  const tagInput = h('input', {
    type: 'text',
    placeholder: t('menuNewTagPlaceholder'),
    maxLength: 32,
    attrs: { 'aria-label': t('menuNewTagLabel'), 'aria-describedby': 'new-tag-error', 'data-focus-key': 'new-tag' },
  });
  const tagError = h('p', { class: 'tag-error', hidden: true, attrs: { id: 'new-tag-error', role: 'status' } });
  const showTagError = (text: string | null) => {
    tagError.textContent = text;
    tagError.hidden = !text;
    if (text) tagInput.setAttribute('aria-invalid', 'true');
    else tagInput.removeAttribute('aria-invalid');
  };
  // A change from elsewhere draws this again: keep what was typed for this site, and its error.
  const typed = here.dataset.domain === domain ? here.querySelector<HTMLInputElement>('.new-tag input') : null;
  const shownError = here.dataset.domain === domain ? here.querySelector<HTMLElement>('#new-tag-error') : null;
  if (typed) tagInput.value = typed.value;
  if (shownError && !shownError.hidden) showTagError(shownError.textContent);
  const tagForm = h(
    'form',
    { class: 'new-tag' },
    tagInput,
    h('button', { class: 'text-btn', type: 'submit' }, t('menuAddTagButton')),
    tagError,
  );
  tagForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const label = tagInput.value.trim();
    const id = slugifyTag(label);
    if (!id || mine.has(id)) {
      showTagError(t(id ? 'popupTagAlreadySet' : 'popupTagInvalid'));
      tagInput.focus();
      return;
    }
    showTagError(null);
    tagInput.value = '';
    hereDomain = domain;
    hereFocusKey = `tag-${id}`;
    void editPersonal((text) => {
      const withDefinition = rules.tags.has(id) ? text : upsertTagDef(text, { id, label, color: colorForTag(id) });
      return toggleSiteTag(withDefinition, domain, id, true);
    });
  });

  here.dataset.domain = domain;
  here.replaceChildren(
    h('div', { class: 'weigh' }, cartouche, balance, levels, h('p', { class: 'hint' }, hint)),
    h('div', { class: 'here-tags' }, h('h2', null, t('popupTags')), tagItems.length ? h('div', { class: 'tags' }, tagItems) : null, tagForm),
  );
  // At once, not on the next frame: another render could come first and find nothing focused.
  const target = focusKey ? here.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`) : null;
  target?.focus();
  // A tag just created only appears once the change is saved: keep waiting for it.
  if (target && focusKey === hereFocusKey) hereFocusKey = undefined;
  requestAnimationFrame(() => requestAnimationFrame(() => setBalance(balance, r.shown)));
}

function renderPage(next: PageStats | undefined) {
  setReportLink(next?.engine);
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

  // Loading a page can take a while (a slow engine, a second try out of sight), so
  // keep asking until it's done.
  const refreshSoon = (tries = 20) =>
    setTimeout(async () => {
      const next = await sendToActiveTab<PageStats>({ type: 'get-page-stats' });
      renderPage(next);
      if (next?.loading && tries > 1) refreshSoon(tries - 1);
    }, 1500);
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
    ...(current.stopped ? [h('p', { class: 'sentence muted' }, stoppedSentence(current.stopped, current.engine))] : []),
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
// Filled in with Anubis's version, the browser, and the search engine of this tab.
const setReportLink = (engine?: string) => {
  $<HTMLAnchorElement>('#report').href = bugReportLink({ version: browser.runtime.getManifest().version, browser: describeBrowser(navigator.userAgent), engine });
};
setReportLink();
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
  watchRuleSet(() => {
    void (async () => {
      try {
        await renderAll();
        // The page updates itself after a change; ask again a moment later.
        await new Promise<void>((resolve) => setTimeout(resolve, 150));
        renderPage(await sendToActiveTab<PageStats>({ type: 'get-page-stats' }));
      } catch (error) {
        console.warn('[anubis] could not reload popup', error);
      }
    })();
  });
}

void main();
