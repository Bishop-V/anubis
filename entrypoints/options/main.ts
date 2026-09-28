import '@/assets/theme.css';
import './style.css';
import { h } from '@/utils/dom';
import { listSites } from '@/utils/personal';
import { getSubscriptions, loadRuleSet, watchRuleSet } from '@/utils/ruleset';
import { initTheme, themeSwitcher } from '@/utils/theme';
import { renderAppearance, renderEngines, renderShare } from './general';
import { renderLists } from './lists';
import { renderSites } from './sites';
import { renderTags } from './tags';

// The options page: a sidebar of sections, each rendered from storage and
// re-rendered whenever storage changes (unless you're typing in it).

interface Section {
  id: string;
  label: string;
  render: () => Promise<HTMLElement>;
}

const SECTIONS: Section[] = [
  { id: 'sites', label: 'Your sites', render: renderSites },
  { id: 'tags', label: 'Tags', render: renderTags },
  { id: 'lists', label: 'Lists', render: renderLists },
  { id: 'appearance', label: 'Appearance', render: renderAppearance },
  { id: 'engines', label: 'Search engines', render: renderEngines },
  { id: 'share', label: 'Share and back up', render: renderShare },
];

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
      h('div', null, h('h1', null, 'Anubis'), h('p', null, 'Weigh your search results')),
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
      h('div', null, h('a', { href: 'https://github.com/Bishop-V/anubis', target: '_blank', rel: 'noopener noreferrer' }, 'Source on GitHub')),
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
  main.replaceChildren(el);
  document.title = `${section.label} · Anubis`;
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
}

void start();
