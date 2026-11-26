import { html } from '@inglorious/web';
import { unsafeHTML } from '@inglorious/web/directives/unsafe-html';
import directory from '../../lists/directory.json';
import { readSubscribeLink, subscribeQuery } from '../../utils/links.ts';
import { blankDemo, guideDemo, homeView, playDemo, startScrollDemo } from './demos.js';
import { base, headerLinks, href, neighbouringPages, pageLink, sidebar } from './navigation.js';

const formatNames = { anubis: 'Anubis list', goggle: 'Brave Goggle', ublacklist: 'uBlacklist ruleset', domains: 'Domain list' };
const issueBase = 'https://github.com/Bishop-V/anubis/edit/main/docs/';
const searchDialog = () => document.querySelector('#site-search');
let searchIndex;

function matchSearch(index, query) {
  const terms = query.toLowerCase().trim().split(/\s+/);
  return index.flatMap((entry) => {
    const headline = (entry.heading + ' ' + entry.title).toLowerCase();
    const content = entry.text.toLowerCase();
    if (terms.some((term) => !headline.includes(term) && !content.includes(term))) return [];
    const score = terms.filter((term) => headline.includes(term)).length;
    const offset = Math.max(0, content.indexOf(terms[0]) - 35);
    return [{ ...entry, score, snippet: (offset ? '…' : '') + entry.text.trim().slice(offset, offset + 135) }];
  }).sort((a, b) => b.score - a.score).slice(0, 12);
}

function showSearch() {
  const dialog = searchDialog();
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('input').focus();
}

function searchView(entity, emit) {
  return html`<dialog id="site-search" aria-labelledby="search-title">
    <div class="search-title"><h2 id="search-title">Search the wiki</h2>
      <form method="dialog"><button type="submit">Close</button></form>
    </div>
    <label for="search-query">Search guides</label>
    <input id="search-query" type="search" autocomplete="off" .value=${entity.query}
      @input=${(event) => emit('searchChanged', event.currentTarget.value)}>
    <p role="status">${entity.searchError ? 'Search could not load. Try again.' : entity.searching ? 'Searching…' : entity.query && !entity.matches.length ? 'No results' : ''}</p>
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
  return html`<label for="directory-filter">Filter lists</label>
    <input id="directory-filter" type="search" .value=${query} @input=${(event) => emit('directoryFiltered', event.currentTarget.value)}>
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

function article(page, entity, emit, replay) {
  return html`<div class="wiki-layout">
    <aside class="wiki-sidebar" aria-label="Wiki navigation">
      <details open><summary>Wiki navigation</summary><nav>${sidebar(page.route)}</nav></details>
    </aside>
    <main id="content" class="vp-doc wiki-article">
      ${page.headings.length ? html`<details class="outline"><summary>On this page</summary><nav aria-label="On this page">
        ${page.headings.map(({ id, label, level }) => html`<a data-external class=${level === 3 ? 'subheading' : ''} href=${'#' + id}>${label}</a>`)}
      </nav></details>` : ''}
      ${page.parts.map((part, i) => {
        if (i % 2 === 0) return unsafeHTML(part); // Compiled from repository Markdown at build time.
        if (part === 'directory') return directoryView(entity.directoryQuery, emit);
        if (part === 'subscribe') return subscribeView(entity.subscribe);
        return guideDemo(part, entity.demo, replay);
      })}
      ${page.route === '/subscribe' ? '' : html`<div class="article-footer"><a href=${issueBase + page.file}>Edit this page on GitHub</a>
        ${neighbouringPages(page.route)}</div>`}
    </main>
  </div>`;
}

export function createPage(page) {
  const demoKind = page.parts.includes('ranking') ? 'ranking' : page.parts.includes('hiding') ? 'hiding' : undefined;
  const replay = (emit) => playDemo(demoKind, emit);
  return {
    create(entity) {
      Object.assign(entity, {
        query: '', searching: false, matches: [], searchError: false,
        step: 1, demo: blankDemo(), directoryQuery: '', subscribe: { broken: false },
      });
    },
    init(entity, _payload, api) {
      const id = entity.id;
      const emit = (event, payload) => api.notify('#' + id + ':' + event, payload);
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
      searchIndex ??= fetch(base + '/search.json').then((response) => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      }).catch((error) => { searchIndex = undefined; throw error; });
      const event = '#' + entity.id + ':searchReady';
      void searchIndex.then(
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
    demoFinished(entity) { entity.demo.done = true; entity.demo.pointer = null; },
    render(entity, api) {
      const emit = (event, payload) => api.notify('#' + entity.id + ':' + event, payload);
      return html`<a data-external class="skip-link" href="#content">Skip to content</a>
        <header class="site-header">
          <a data-external class="site-brand" href=${href('/')}><img src=${href('/anubis.svg')} alt="" width="25" height="25"> Anubis</a>
          <nav aria-label="Main navigation">${headerLinks(page.route)}</nav>
          <div class="header-actions"><button type="button" @click=${showSearch}>Search</button>
            <button type="button" @click=${() => {
              const dark = document.documentElement.classList.toggle('dark');
              try { localStorage.setItem('anubis-docs-theme', dark ? 'dark' : 'light'); } catch { /* The theme still works for this page. */ }
            }}>Theme</button>
          </div>
        </header>
        ${searchView(entity, emit)}
        ${page.home ? homeView(page.home, entity.step) : article(page, entity, emit, () => replay(emit))}
        <footer class="site-footer">Released under the GNU AGPL v3. <a data-external href=${href('/THIRD_PARTY_NOTICES.txt')}>Third-party notices</a></footer>`;
    },
  };
}
