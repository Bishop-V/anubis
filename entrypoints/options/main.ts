import '@/assets/theme.css';
import './style.css';
import { h, icon } from '@/utils/dom';
import { ICON_EXTERNAL } from '@/utils/icons';
import { t } from '@/utils/i18n';
import { guide, REPO_URL } from '@/utils/links';
import { listSites } from '@/utils/personal';
import { loadRuleSet, watchRuleSet } from '@/utils/ruleset';
import { getSubscriptions } from '@/utils/subscriptions';
import { initTheme, themeSwitcher } from '@/utils/theme';
import { renderCleanup } from './cleanup';
import { renderAppearance, renderEngines, renderShare } from './general';
import { renderLists } from './lists';
import { renderSites } from './sites';
import { renderSync, watchSync } from './sync';
import { renderTags } from './tags';

// The options page: a sidebar of sections, each rendered from storage and
// re-rendered whenever storage changes (unless you're typing in it).

interface Section {
  id: string;
  label: string;
  render: () => Promise<HTMLElement>;
  /** The user guide's page for this section, linked after its description. */
  help?: [path: string, label: string];
}

const SECTIONS: Section[] = [
  { id: 'sites', label: 'Your sites', render: renderSites, help: ['guide/ranking', 'How ranking works'] },
  { id: 'tags', label: 'Tags', render: renderTags, help: ['guide/tags', 'How tags work'] },
  { id: 'lists', label: 'Lists', render: renderLists, help: ['guide/lists', 'How lists work'] },
  { id: 'cleanup', label: 'Clean up', render: renderCleanup, help: ['guide/clean-up', 'How clean-up works'] },
  { id: 'appearance', label: 'Appearance', render: renderAppearance, help: ['guide/ranking#hidden-results', 'About hidden results'] },
  { id: 'engines', label: 'Search engines', render: renderEngines, help: ['guide/search-engines', 'Which engines work'] },
  { id: 'sync', label: t('syncHeading'), render: renderSync, help: ['guide/sync', 'How sync works'] },
  { id: 'share', label: 'Share and back up', render: renderShare, help: ['guide/import-and-backup', 'Moving from other tools'] },
];

function external(href: string, text: string, className?: string): HTMLElement {
  return h('a', { class: className, href, target: '_blank', rel: 'noopener noreferrer' }, text, icon(ICON_EXTERNAL));
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
  nav.replaceChildren(
    h(
      'div',
      { class: 'brand' },
      h('img', { src: '/anubis.svg', alt: '', width: 36, height: 36 }),
      h('div', null, h('h1', null, 'Anubis'), h('p', null, 'Hide, rank and tag search results')),
    ),
    ...SECTIONS.map((s) =>
      h(
        'a',
        { href: `#${s.id}`, attrs: { 'aria-current': s.id === active ? 'page' : undefined } },
        s.label,
        counts[s.id] !== undefined ? h('span', { class: 'count' }, counts[s.id]) : null,
      ),
    ),
    h(
      'div',
      { class: 'foot' },
      themeSwitcher(rules.settings.theme),
      h('div', { class: 'links' }, external(guide(), 'User guide'), external(REPO_URL, 'Source on GitHub')),
    ),
  );
}

let rendering = 0;
async function renderMain() {
  const ticket = ++rendering;
  const section = current();
  const scroll = window.scrollY;
  const el = await section.render();
  if (ticket !== rendering) return;
  if (section.help) el.querySelector('.page-title p')?.append(' ', external(guide(section.help[0]), section.help[1], 'help-link'));
  main.replaceChildren(el);
  document.title = `${section.label} – Anubis`;
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
  await initTheme();
  await Promise.all([renderNav(), renderMain()]);
  watchRuleSet(() => void refresh());
  watchSync(() => void refresh());
}

void start();
