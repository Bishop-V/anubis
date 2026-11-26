import { html, render } from '@/utils/view';
import { createStore } from '@inglorious/store';
import { machineTranslationNote } from '@/utils/translated';
import '@/assets/theme.css';
import './style.css';
import { browser } from '#imports';
import { balanceSvg, setBalance } from '@/utils/balance';
import { normalizeDomain, normalizeSite, siteChoices, siteOf } from '@/utils/domain';
import { engineFor } from '@/utils/engines';
import { bugReportLink, describeBrowser } from '@/utils/links';
import { wiki } from '@/utils/wiki';
import { LEVELS, evaluate, listTagCards, listTagIds, type Level } from '@/utils/matcher';
import { h, icon, siteName } from '@/utils/dom';
import { ICON_GEAR, LEVEL_CHIPS, LEVEL_LABELS, levelIcon, rankIcon, tagEffectText, tagMark } from '@/utils/icons';
import { localizePage, t, tJoin, tn, tNumber, type MessageKey } from '@/utils/i18n';
import { colorForTag, slugifyTag } from '@/utils/listformat';
import { hiddenCount, send, sendToActiveTab, type PageStats } from '@/utils/messages';
import { displayLevel, getSite, levelSteps, listSites, setSiteLevel, tagSite, upsertTagDef, type PersonalLevel } from '@/utils/personal';
import { loadRuleSet, watchRuleSet, type RuleSet } from '@/utils/ruleset';
import { editPersonal, updateSettings } from '@/utils/storage';
import { fromListsClass, nextLevel, rankingHint, rankingOf, siteCartouche, tagOrder, yourListTag, tagPicker, tagSource, type Ranking } from '@/utils/siteranking';
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

type PopupView = {
  type: 'PopupView';
  tabUrl?: URL;
  domain?: string;
  focusKey?: string;
  stats?: PageStats;
};
const PopupView = {
  tabOpened(state: PopupView, url: URL) { state.tabUrl = url; },
  siteSelected(state: PopupView, domain: string) { state.domain = domain; },
  tagEdited(state: PopupView, { domain, id }: { domain: string; id: string }) {
    state.domain = domain;
    state.focusKey = `tag-${id}`;
  },
  focusRestored(state: PopupView) { state.focusKey = undefined; },
  pageReported(state: PopupView, stats?: PageStats) { state.stats = stats; },
};
const popup: PopupView = { type: 'PopupView' };
const popupStore = createStore({ types: { PopupView }, entities: { popup } });
const view = () => popupStore.getState().popup;
/** Kept across renders so it swings to a new ranking instead of jumping. */
const balance = balanceSvg();
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
  render(html`<i class="gem ${rules.settings.enabled ? '' : 'hollow'}" aria-hidden="true"></i>
    ${rules.settings.enabled ? t('popupOn') : t('popupOff')}`, $('#status'));

  const sites = listSites(rules.personalText).reverse();
  const seeAll = $<HTMLButtonElement>('#see-all');
  seeAll.hidden = sites.length <= RECENT;
  seeAll.textContent = t('popupSeeAll', sites.length);
  render(html`
    ${sites.length ? sites.slice(0, RECENT).map((entry) => {
      const level = displayLevel(entry.level);
      const onlyTag = entry.tags.length === 1 ? rules.tags.get(entry.tags[0]!) : undefined;
      return html`<li>
        <span class="site" title=${entry.site}>${siteName(entry.site)}</span>
        ${level !== 'normal'
          ? html`<span class=${'level-note ' + level}>${icon(levelIcon(level, levelSteps(entry.level)))}${LEVEL_CHIPS[level]}</span>`
          : entry.level === 'allow'
            ? html`<span class="level-note">${t('popupKeptNormal')}</span>`
            : onlyTag
              ? html`<span class="tag" style=${'--c:' + onlyTag.color}><i class="gem"></i>${onlyTag.label}</span>`
              : entry.tags.length
                ? html`<span class="level-note">${tn('popupTagCount', entry.tags.length)}</span>`
                : ''}
      </li>`;
    }) : html`<li class="empty">${balanceSvg({ empty: true })}<p>${t('popupNoSites')}</p></li>`}
  `, list);

  const subs = rules.lists.filter((l) => !l.personal);
  $('#lists-summary').textContent = t('popupListsAndTags', tn('popupListCount', subs.length), tn('popupTagCount', rules.tags.size));
  renderHere(rules);
}

/** The rankings for the site, as in the result menu: Hide | Lower, Normal, Raise | Pin. */
function rankingButtons({ domain, r }: { domain: string; r: Ranking }): HTMLElement {
  return h(
    'div',
    { class: 'seg levels', attrs: { role: 'group', 'aria-label': t('popupRankingFor', domain) } },
    LEVELS.flatMap((level) => [
      // Hide and Pin stand apart from Lower, Normal, and Raise.
      level === 'lower' || level === 'pin' ? h('span', { class: 'sep', attrs: { 'aria-hidden': 'true' } }) : null,
      h(
        'button',
        {
          type: 'button',
          class: `${level}${fromListsClass(level, r)}`,
          title: t(RANK_TITLES[level], domain),
          attrs: { 'aria-pressed': String(r.pressed === level) },
          on: {
            click: () => {
              popupStore.notify('#popup:siteSelected', domain);
              void editPersonal((text) => setSiteLevel(text, domain, nextLevel(level, r)));
            },
          },
        },
        // Raise and Lower light one arrow per press.
        h('span', { class: 'level-icon' }, icon(rankIcon(level, r.pressed === level ? r.steps : 0))),
        LEVEL_LABELS[level],
      ),
    ]),
  );
}

/** The site in the current tab, when it isn't a search page: rank it for future searches. */
function renderHere(rules: RuleSet) {
  const here = $('#here');
  const { tabUrl, domain: hereDomain, focusKey: hereFocusKey } = view();
  const active = document.activeElement;
  const focusKey = hereFocusKey ?? (here.contains(active) && active instanceof HTMLElement ? active.dataset.focusKey : undefined);
  const host = tabUrl && !engineFor(tabUrl.hostname) ? tabUrl.hostname : '';
  const choices = host ? siteChoices(host, tabUrl!.href, (d) => !!getSite(rules.personalText, d)) : [];
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
    popupStore.notify('#popup:siteSelected', d);
    renderHere(rules);
  });

  const levels = rankingButtons({ domain, r });

  const verdict = evaluate(result, rules.lists, rules.prefs);
  const hint = rankingHint(domain, baseline, r, verdict);

  const { mine, fromList, ids: tagIds } = tagOrder(rules.tags, entry, verdict);
  // Tags you set toggle; tags from lists are shown but fixed.
  const tagItem = (id: string) => {
    const tag = rules.tags.get(id)!;
    const on = mine.has(id);
    if (!on && fromList.has(id)) {
      return h(
        'span',
        { class: 'tag fixed', style: `--c: ${tag.color}` },
        tagMark(verdict.tagEffects[id]),
        tag.label,
        tagEffectText(verdict.tagEffects[id]),
        tagSource(verdict, id),
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
            popupStore.notify('#popup:tagEdited', { domain, id });
            void editPersonal((text) => tagSite(text, domain, id, listTagCards(rules.lists)));
          },
        },
      },
      tagMark(on ? verdict.tagEffects[id] : undefined, !on),
      tag.label,
      on ? tagEffectText(verdict.tagEffects[id]) : null,
    );
  };
  const tagItems = tagPicker(tagIds, listTagIds(rules.lists), tagItem);

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
    popupStore.notify('#popup:tagEdited', { domain, id });
    void editPersonal((text) => {
      const withDefinition = rules.tags.has(id) ? text : upsertTagDef(text, { id, label, color: colorForTag(id) });
      return tagSite(withDefinition, domain, id, listTagCards(rules.lists), true);
    });
  });

  here.dataset.domain = domain;
  render(html`
    <div class="weigh">${cartouche}${balance}${levels}<p class="hint">${hint}</p></div>
    <div class="here-tags">
      <h2>${t('popupTags')}</h2>${yourListTag(entry, ['tag', 'fixed'])}${tagItems}${tagForm}
    </div>
  `, here);
  // At once, not on the next frame: another render could come first and find nothing focused.
  const target = focusKey ? here.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`) : null;
  target?.focus();
  // A tag just created only appears once the change is saved: keep waiting for it.
  if (target && focusKey === hereFocusKey) popupStore.notify('#popup:focusRestored');
  requestAnimationFrame(() => requestAnimationFrame(() => setBalance(balance, verdict.level, verdict.score)));
}

function renderPage(next: PageStats | undefined) {
  setReportLink(next?.engine);
  popupStore.notify('#popup:pageReported', next);
  const { stats } = view();
  const page = $('#page');
  const nothingHere = !stats && $('#here').hidden;
  page.hidden = !stats && !nothingHere;
  // Adding by hand leads when the tab has nothing else to show.
  if (nothingHere) addSection.hidden = false;
  $('#add-toggle').hidden = !addSection.hidden;
  if (!stats) {
    render(html`<h2>${t('popupThisPage')}</h2><p class="sentence muted">${t('popupNotSearch')}</p>`, page);
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
      h('span', { class: 'count' }, tNumber(tag.count)),
    );
  });

  render(html`
    <h2>${t('popupThisPageOn', current.engine)}</h2>
    <p class="sentence">${summarySentence(current)}</p>
    ${current.stopped ? html`<p class="sentence muted">${stoppedSentence(current.stopped, current.engine)}</p>` : ''}
    ${actions.length ? html`<div class="page-actions">${actions}</div>` : ''}
    ${filters.length ? html`
      <h2 class="filters-label">${t('popupShowOnly')}</h2>
      <div class="seg filters" role="group" aria-label=${t('summaryFilterLabel')}>${filters}</div>
    ` : ''}
  `, page);
}

$<HTMLFormElement>('#add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const domain = normalizeSite(input.value);
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
$<HTMLAnchorElement>('#help').href = wiki();
$<HTMLAnchorElement>('.brand').href = wiki();
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
  const note = machineTranslationNote(true);
  if (note) $('footer').before(note);
  // Firefox for Android has no keyboard shortcuts.
  const commands = (await browser.commands?.getAll().catch(() => [])) ?? [];
  shortcuts = Object.fromEntries(commands.filter((c) => c.name && c.shortcut).map((c) => [c.name!, c.shortcut!]));
  $('.switch').title = withKey(t('commandToggleEnabled'), 'toggle-enabled');
  await initTheme();
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab?.url ?? '');
    if (/^https?:$/.test(url.protocol)) popupStore.notify('#popup:tabOpened', url);
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
