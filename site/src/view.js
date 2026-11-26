import { Input } from '@inglorious/ui/input';
import { html } from '@inglorious/web';
import { unsafeHTML } from '@inglorious/web/directives/unsafe-html';
import directory from '../../lists/directory.json';
import { readSubscribeLink, REPO_URL, subscribeQuery } from '../../utils/links.ts';
import { blankDemo, guideDemo, homeView, playDemo, startScrollDemo } from './demos.js';
import { translate } from './languages.js';
import { base, headerLinks, homePath, href, languageMenu, neighbouringPages, pageLink, sidebar } from './navigation.js';

const formatNames = { anubis: 'Anubis list', goggle: 'Brave Goggle', ublacklist: 'uBlacklist ruleset', domains: 'Domain list' };
const issueBase = 'https://github.com/Bishop-V/anubis/edit/main/docs/';
const searchDialog = () => document.querySelector('#site-search');
const searchIndexes = new Map();

function matchSearch(index, query) {
  const terms = query.toLowerCase().trim().split(/\s+/);
  return index.flatMap((entry) => {
    const headline = (entry.heading + ' ' + entry.title).toLowerCase();
    const text = entry.text.trim();
    const content = text.toLowerCase();
    if (terms.some((term) => !headline.includes(term) && !content.includes(term))) return [];
    const score = terms.filter((term) => headline.includes(term)).length;
    const match = content.indexOf(terms[0]);
    const offset = match > 35 ? text.indexOf(' ', match - 35) + 1 : 0;
    const snippet = (offset ? '…' : '') + text.slice(offset);
    return [{ ...entry, score, snippet }];
  }).sort((a, b) => b.score - a.score).slice(0, 12);
}

function showSearch() {
  const dialog = searchDialog();
  const menu = document.querySelector('#site-menu');
  if (menu.matches(':popover-open')) {
    menu.hidePopover();
    document.querySelector('.site-menu-toggle').focus();
  }
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('input').focus();
}

function siteMenu(page, dark, t, changeTheme) {
  return html`<button class="site-menu-toggle" type="button" popovertarget="site-menu" aria-label=${t('menu')}>
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
  </button>
  <div id="site-menu" popover>
    <nav class="compact-nav" aria-label=${t('mainNavigation')}>${headerLinks(page, t)}</nav>
    <button type="button" @click=${showSearch}>${t('search.button')}</button>
    <button class="appearance-toggle" type="button" role="switch" aria-checked=${String(dark)} title=${t(dark ? 'toLight' : 'toDark')} @click=${changeTheme}>
      ${t('appearance')}
      ${dark
        ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.9 14.4A9 9 0 0 1 9.6 3.1 9 9 0 1 0 20.9 14.4Z"/></svg>`
        : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19m0-14-1.5 1.5m-11 11L5 19"/></svg>`}
    </button>
    ${languageMenu(page, t)}
    <a href=${REPO_URL}>GitHub</a>
  </div>`;
}

function searchView(entity, emit, t) {
  return html`<dialog id="site-search" aria-labelledby="search-title" @keydown=${(event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.currentTarget.close();
  }}>
    <div class="search-title"><h2 id="search-title">${t('searchTitle')}</h2>
      <form method="dialog"><button type="submit">${t('searchClose')}</button></form>
    </div>
    ${Input.render({
      id: 'search-query', label: t('searchLabel'), inputType: 'search', autocomplete: 'off',
      value: entity.query, onChange: (value) => emit('searchChanged', value),
    })}
    <p role="status">${entity.searchError ? t('searchError') : entity.searching ? t('searching') : entity.query && !entity.matches.length ? t('searchNone') : ''}</p>
    <ul class="search-results">
      ${entity.matches.map(({ url, heading, title, snippet }) => html`<li>
        <a data-external href=${url} @click=${() => searchDialog().close()}><strong>${heading || title}</strong>
          ${heading ? html`<span>${title}</span>` : ''}<small>${snippet}</small>
        </a>
      </li>`)}
    </ul>
  </dialog>`;
}

function directoryView(query, emit) {
  const term = query.trim().toLowerCase();
  const matches = directory.lists.filter(({ name, description, format }) => [name, description, format].some((value) => value?.toLowerCase().includes(term)));
  return html`${Input.render({
      id: 'directory-filter', label: 'Filter lists', inputType: 'search',
      value: query, onChange: (value) => emit('directoryFiltered', value),
    })}
    <p class="directory-count" role="status">${matches.length} of ${directory.lists.length} lists</p>
    <div class="table-scroll"><table class="list-directory">
      <thead><tr><th scope="col">List</th><th scope="col">What it does</th><th scope="col">Format</th><th scope="col">Subscribe</th></tr></thead>
      <tbody>${matches.map((list) => html`<tr>
        <td><a href=${list.homepage ?? list.url} target="_blank" rel="noopener noreferrer">${list.name}</a></td>
        <td>${list.description}${list.default ? ' Subscribed from the start.' : ''}${list.lens ? ' A lens hides every result it doesn’t mention.' : ''}</td>
        <td>${formatNames[list.format] ?? list.format}</td>
        <td><a data-external class="subscribe-link" href=${href('/subscribe?' + subscribeQuery(list))} aria-label=${'Subscribe to ' + list.name}>Subscribe</a></td>
      </tr>`)}</tbody>
    </table></div>`;
}

function subscribeView({ link, broken }) {
  if (!link) return broken
    ? html`<p>This link doesn’t name a list Anubis can subscribe to. The list address has to start with <code>https://</code>.</p>`
    : html`<p>Subscribe links open Anubis’s settings with a list filled in. The ${pageLink('lists directory', '/lists')} has one for each list.</p>`;
  let name = link.name;
  if (!name) {
    const address = new URL(link.url);
    const tail = address.pathname.split('/').filter(Boolean).at(-1) || address.hostname;
    try { name = decodeURIComponent(tail); } catch { name = tail; }
  }
  return html`<p>This link subscribes you to <strong>${name}</strong> in Anubis. The list is at:</p>
    <p class="list-address"><a href=${link.url} target="_blank" rel="noopener noreferrer">${link.url}</a></p>
    <ul>
      <li><strong>With Anubis installed</strong>, press <strong>Subscribe</strong> in the settings that open. If settings didn’t open, <a data-external href=${href('/subscribe?' + subscribeQuery(link))}>open the link again</a>.</li>
      <li><strong>Without Anubis</strong>, ${pageLink('install it', '/guide/getting-started')} and open this link again, or paste the address into <strong>Settings → Lists → Add a list</strong>.</li>
    </ul>
    <p>A list can hide, rank, and tag sites in your results. Only subscribe to lists you trust.</p>`;
}

function article(page, entity, emit, replay, t) {
  return html`<div class="wiki-layout">
    <aside class="wiki-sidebar" aria-label=${t('wikiNavigation')}>
      <details open><summary>${t('wikiNavigation')}</summary><nav>${sidebar(page, t)}</nav></details>
    </aside>
    <main id="content" class="vp-doc wiki-article">
      ${page.headings.length ? html`<details class="outline"><summary>${t('outline')}</summary><nav aria-label=${t('outline')}>
        ${page.headings.map(({ id, label, level }) => html`<a data-external class=${level === 3 ? 'subheading' : ''} href=${'#' + id}>${label}</a>`)}
      </nav></details>` : ''}
      ${page.parts.map((part, i) => {
        if (i % 2 === 0) return unsafeHTML(part); // Compiled from repository Markdown at build time.
        if (part === 'directory') return directoryView(entity.directoryQuery, emit);
        if (part === 'subscribe') return subscribeView(entity.subscribe);
        return guideDemo(part, entity.demo, replay, t);
      })}
      ${page.route === '/subscribe' ? '' : html`<div class="article-footer"><a href=${issueBase + page.file}>${t('editLink')}</a>
        ${neighbouringPages(page, t)}</div>`}
    </main>
  </div>`;
}

export function createPage(page) {
  const t = translate(page.lang);
  const demoKind = page.parts.includes('ranking') ? 'ranking' : page.parts.includes('hiding') ? 'hiding' : undefined;
  const replay = (emit) => playDemo(demoKind, emit);
  return {
    create(entity) {
      Object.assign(entity, {
        query: '', searching: false, matches: [], searchError: false,
        dark: false, step: 1, demo: blankDemo(), directoryQuery: '', subscribe: { broken: false },
      });
    },
    init(entity, _payload, api) {
      const id = entity.id;
      const emit = (event, payload) => api.notify('#' + id + ':' + event, payload);
      emit('themeRead', document.documentElement.classList.contains('dark'));
      matchMedia('(prefers-color-scheme: light)').addEventListener('change', (event) => {
        try { if (localStorage.getItem('anubis-docs-theme')) return; } catch { /* Follow the browser. */ }
        document.documentElement.classList.toggle('dark', !event.matches);
        emit('themeRead', !event.matches);
      });
      if (matchMedia('(max-width: 760px)').matches) {
        const navigation = document.querySelector('.wiki-sidebar details');
        if (navigation) navigation.open = false;
      }
      document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          showSearch();
        }
      });
      if (page.home) startScrollDemo(emit);
      if (page.route === '/subscribe') {
        const params = new URLSearchParams(location.search);
        const link = readSubscribeLink(params);
        emit('subscribeRead', { link, broken: !link && params.has('url') });
      }
      if (demoKind) {
        const figure = document.querySelector('[data-guide-demo]');
        const observer = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          void replay(emit);
        }, { threshold: 0.45 });
        observer.observe(figure);
      }
    },
    searchChanged(entity, query, api) {
      entity.query = query;
      entity.searchError = false;
      entity.searching = !!query.trim();
      entity.matches = [];
      if (!entity.searching) return;
      const { folder } = page;
      if (!searchIndexes.has(folder)) {
        const indexPath = folder === 'en' ? '/search.json' : '/search-' + folder + '.json';
        const request = fetch(base + indexPath).then((response) => {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        }).catch((error) => { searchIndexes.delete(folder); throw error; });
        searchIndexes.set(folder, request);
      }
      const event = '#' + entity.id + ':searchReady';
      void searchIndexes.get(folder).then(
        (index) => api.notify(event, { query, matches: matchSearch(index, query) }),
        () => api.notify(event, { query, matches: [], error: true }),
      );
    },
    searchReady(entity, { query, matches, error }) {
      if (query !== entity.query) return;
      entity.searching = false;
      entity.matches = matches;
      entity.searchError = !!error;
    },
    themeRead(entity, dark) { entity.dark = dark; },
    themeChanged(entity) {
      entity.dark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('anubis-docs-theme', entity.dark ? 'dark' : 'light'); } catch { /* The theme still works for this page. */ }
    },
    directoryFiltered(entity, query) { entity.directoryQuery = query; },
    subscribeRead(entity, subscribe) { entity.subscribe = subscribe; },
    scrollChanged(entity, step) { entity.step = step; },
    demoStarted(entity) { entity.demo = blankDemo(); },
    pointerMoved(entity, point) { entity.demo.pointer = point; },
    demoOpened(entity, menu) { entity.demo.menu = menu; entity.demo.selected = null; },
    rankSelected(entity, level) { entity.demo.selected = level; },
    demoRanked(entity, { id, level, said }) {
      entity.demo.levels[id] = level;
      entity.demo.menu = null;
      entity.demo.said = said;
    },
    demoFinished(entity) { entity.demo.done = true; },
    render(entity, api) {
      const emit = (event, payload) => api.notify('#' + entity.id + ':' + event, payload);
      return html`<a data-external class="skip-link" href="#content">${t('skip')}</a>
        <header class="site-header">
          <a data-external class="site-brand" href=${href(homePath(page.folder))}><img src=${href('/anubis.svg')} alt="" width="25" height="25"> Anubis</a>
          <nav class="primary-nav" aria-label=${t('mainNavigation')}>${headerLinks(page, t)}</nav>
          ${siteMenu(page, entity.dark, t, () => emit('themeChanged'))}
        </header>
        ${searchView(entity, emit, t)}
        ${page.home ? homeView(page.home, entity.step) : article(page, entity, emit, () => replay(emit), t)}
        <footer class="site-footer">
          ${t('footer')} <a data-external href=${href('/THIRD_PARTY_NOTICES.txt')}>${t('notices')}</a></footer>`;
    },
  };
}
