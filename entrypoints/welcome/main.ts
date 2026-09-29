import '@/assets/theme.css';
import './style.css';
import { browser } from '#imports';
import { balanceSvg, swingBalance } from '@/utils/balance';
import { h } from '@/utils/dom';
import { ENGINES } from '@/utils/engines';
import { localizePage, t, type MessageKey } from '@/utils/i18n';
import { guide } from '@/utils/links';
import { parseList } from '@/utils/listformat';
import { getSettings, listCacheItem } from '@/utils/storage';
import { displayName, getSubscriptions, listText } from '@/utils/subscriptions';
import { initTheme } from '@/utils/theme';

// The page that opens when Anubis is installed: how to keep its button in the
// toolbar, a search to try, and the lists it starts with. Opened by the background
// script on install only, never on updates.

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

/** Searches to try, on engines whose results the starter lists tag well. */
const SEARCHES: [engine: string, url: string][] = [
  ['google', 'https://www.google.com/search'],
  ['duckduckgo', 'https://duckduckgo.com/'],
  ['bing', 'https://www.bing.com/search'],
  ['brave', 'https://search.brave.com/search'],
];

/** Each browser's own way to put an extension's button on the toolbar. */
function pinSteps(): MessageKey {
  if (import.meta.env.FIREFOX) return 'welcomePinFirefox';
  const ua = navigator.userAgent;
  if (/\bEdg\//.test(ua)) return 'welcomePinEdge';
  if (/\bOPR\//.test(ua)) return 'welcomePinOpera';
  return 'welcomePinChrome';
}

// Chrome and Edge say whether the button is on the toolbar (getUserSettings), and
// newer versions say when that changes. Where they can't, the steps stay.
interface ToolbarSettings {
  getUserSettings?: () => Promise<{ isOnToolbar?: boolean }>;
  onUserSettingsChanged?: { addListener(cb: () => void): void };
}
const action = (browser.action ?? browser.browserAction) as unknown as ToolbarSettings | undefined;

async function renderPin() {
  const pinned = await action
    ?.getUserSettings?.()
    .then((s) => s.isOnToolbar === true)
    .catch(() => false);
  $('#pin').classList.toggle('done', !!pinned);
  $('#pin-text').textContent = pinned ? t('welcomePinned') : t(pinSteps());
}

async function renderSearch() {
  const settings = await getSettings();
  const query = t('welcomeQuery');
  $('#search-for').textContent = t('welcomeSearchFor', query);
  $('#engines').replaceChildren(
    ...SEARCHES.filter(([id]) => settings.engines[id] !== false).map(([id, base]) => {
      const name = ENGINES.find((e) => e.id === id)?.name ?? id;
      const url = new URL(base);
      url.searchParams.set('q', query);
      return h('a', { class: 'btn', href: url.href, target: '_blank', rel: 'noopener noreferrer', title: t('welcomeSearchOn', query, name) }, name);
    }),
  );
}

async function renderLists() {
  const [subs, cache] = await Promise.all([getSubscriptions(), listCacheItem.getValue()]);
  const lists = subs
    .filter((sub) => sub.enabled)
    .map((sub) => {
      const text = listText(sub, cache);
      const parsed = text ? parseList(text) : undefined;
      return { name: displayName(sub, parsed?.meta), description: parsed?.meta.description, tags: parsed?.tags ?? [] };
    });
  $('#lists-intro').textContent = lists.length ? t('welcomeListsIntro') : t('welcomeListsNone');
  $('#lists').replaceChildren(
    ...lists.map((list) =>
      h(
        'li',
        null,
        h('span', { class: 'name' }, list.name),
        list.description ? h('span', { class: 'description' }, list.description) : null,
        list.tags.length
          ? h(
              'span',
              { class: 'tags' },
              list.tags.slice(0, 6).map((tag) => h('span', { class: 'tag', style: `--c: ${tag.color}`, title: tag.description ?? tag.label }, h('i', { class: 'gem' }), tag.label)),
            )
          : null,
      ),
    ),
  );
}

/**
 * The heart and the feather: the balance settles level as the page opens, and a
 * click on either side presses that pan down to swing again. It's decoration, so
 * it's hidden from screen readers and holds still with reduced motion.
 */
function renderScales() {
  const svg = balanceSvg();
  $('#scales').replaceChildren(svg);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $('#scales').classList.add('moving');
  swingBalance(svg, -13, 350);
  svg.addEventListener('click', (e) => {
    const box = svg.getBoundingClientRect();
    swingBalance(svg, e.clientX < box.left + box.width / 2 ? -11 : 11);
  });
}

async function main() {
  localizePage();
  renderScales();
  $<HTMLAnchorElement>('#guide').href = guide();
  $<HTMLAnchorElement>('#privacy').href = guide('guide/privacy');
  await initTheme();
  await Promise.all([renderPin(), renderSearch(), renderLists()]);
  // Pinning happens in the browser's toolbar, outside this page.
  action?.onUserSettingsChanged?.addListener(() => void renderPin());
  window.addEventListener('focus', () => void renderPin());
}

void main();
