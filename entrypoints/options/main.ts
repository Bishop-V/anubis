import { html, render } from '@/utils/view';
import { machineTranslationNote } from '@/utils/translated';
import '@/assets/theme.css';
import './style.css';
import { browser } from '#imports';
import { h, icon } from '@/utils/dom';
import { ICON_EXTERNAL } from '@/utils/icons';
import { localizePage, t, tNumber } from '@/utils/i18n';
import { bugReportLink, describeBrowser, REPO_URL } from '@/utils/links';
import { wiki } from '@/utils/wiki';
import { listSites } from '@/utils/personal';
import { loadRuleSet, watchRuleSet } from '@/utils/ruleset';
import { getSubscriptions } from '@/utils/subscriptions';
import { initTheme, themeButton } from '@/utils/theme';
import { renderCleanup } from './cleanup';
import { renderAppearance, renderEngines, renderResults, renderShare } from './general';
import { renderLists } from './lists';
import { helpLink } from './parts';
import { renderSites } from './sites';
import { renderSync, watchSync } from './sync';
import { renderTags } from './tags';

// The options page: a sidebar of sections, each rendered from storage and
// re-rendered whenever storage changes (unless you're typing in it).

interface Section {
  id: string;
  label: string;
  render: () => Promise<HTMLElement>;
  /** The wiki's page for this section, linked after its description. */
  help?: [path: string, label: string];
}

const SECTIONS: Section[] = [
  { id: 'sites', label: t('sitesHeading'), render: renderSites, help: ['guide/ranking', t('sitesHelp')] },
  { id: 'tags', label: t('tagsHeading'), render: renderTags, help: ['guide/tags', t('tagsHelp')] },
  { id: 'lists', label: t('listsHeading'), render: renderLists, help: ['guide/lists', t('listsHelp')] },
  { id: 'cleanup', label: t('cleanupHeading'), render: renderCleanup, help: ['guide/clean-up', t('cleanupHelp')] },
  { id: 'results', label: t('resultsHeading'), render: renderResults, help: ['guide/more-results', t('resultsHelp')] },
  { id: 'appearance', label: t('appearanceHeading'), render: renderAppearance, help: ['guide/ranking#hidden-results', t('appearanceHelp')] },
  { id: 'engines', label: t('enginesHeading'), render: renderEngines, help: ['guide/search-engines', t('enginesHelp')] },
  { id: 'sync', label: t('syncHeading'), render: renderSync, help: ['guide/sync', t('syncHelp')] },
  { id: 'share', label: t('backupHeading'), render: renderShare, help: ['guide/import-and-backup', t('shareHelp')] },
];

function external(href: string, text: string, title?: string): HTMLElement {
  return h('a', { href, target: '_blank', rel: 'noopener noreferrer', title }, text, icon(ICON_EXTERNAL));
}

const nav = document.querySelector<HTMLElement>('#nav')!;
const main = document.querySelector<HTMLElement>('#main')!;

function current(): Section {
  const id = location.hash.slice(1);
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0]!;
}

async function renderNav() {
  const [rules, subs] = await Promise.all([loadRuleSet(), getSubscriptions()]);
  const counts: Record<string, number> = {
    sites: listSites(rules.personalText).length,
    tags: rules.tags.size,
    lists: subs.filter((s) => s.enabled).length,
  };
  const active = current().id;
  render(html`
    <a class="brand" href=${wiki()} target="_blank" rel="noopener noreferrer" title=${t('settingsBrandTitle')}>
      <img src="/anubis.svg" alt="" width="36" height="36">
      <div><h1>Anubis</h1><p>${t('settingsTagline')}</p></div>
    </a>
    ${SECTIONS.map((section) => html`
      <a href=${`#${section.id}`} aria-current=${section.id === active ? 'page' : 'false'}>
        ${section.label}
        ${counts[section.id] === undefined ? '' : html`<span class="count">${tNumber(counts[section.id]!)}</span>`}
      </a>
    `)}
    <div class="foot">
      ${themeButton(rules.settings.theme)}
      <div class="links">
        ${external(wiki(), t('welcomeGuide'))}
        ${external(bugReportLink({ version: browser.runtime.getManifest().version, browser: describeBrowser(navigator.userAgent) }), t('reportProblem'), t('reportProblemTitle'))}
        ${external(REPO_URL, t('settingsSource'))}
      </div>
    </div>
  `, nav);
}

let rendering = 0;
async function renderMain() {
  const ticket = ++rendering;
  const section = current();
  const scroll = window.scrollY;
  const el = await section.render();
  if (ticket !== rendering) return;
  if (section.help) el.querySelector('.page-title p')?.append(' ', helpLink(...section.help));
  // Above every section, in a machine translation: use it with caution.
  render(html`${machineTranslationNote()}${el}`, main);
  document.title = t('settingsPageTitle', section.label);
  window.scrollTo(0, scroll);
}

// Re-rendering replaces the inputs, so wait until the user leaves the field.
let pending = false;
function typing(): boolean {
  const el = document.activeElement;
  return !!el && main.contains(el) && (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type !== 'checkbox'));
}
async function refresh() {
  if (typing()) {
    pending = true;
    return;
  }
  pending = false;
  await Promise.all([renderNav(), renderMain()]);
}
document.addEventListener('focusout', () => {
  setTimeout(() => {
    if (pending && !typing()) void refresh();
  }, 0);
});

window.addEventListener('hashchange', () => {
  window.scrollTo(0, 0);
  void Promise.all([renderNav(), renderMain()]);
});

async function start() {
  localizePage();
  await initTheme();
  await Promise.all([renderNav(), renderMain()]);
  watchRuleSet(() => void refresh());
  watchSync(() => void refresh());
}

void start();
