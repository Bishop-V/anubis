import { Input } from '@inglorious/ui/input';
import { html, nothing } from '@inglorious/web';
import { unsafeHTML } from '@inglorious/web/directives/unsafe-html';
import { readSubscribeLink, REPO_URL } from '../../utils/links.ts';
import { blankDemo, guideDemo, homeView, playDemo, startScrollDemo } from './demos.js';
import { directoryView, emptyFilters, subscribeView } from './directory.js';
import { translate } from './languages.js';
import { copyText, followOutline, prepareReader, restoreFragment } from './reader.js';
import { base, breadcrumbs, headerLinks, homePath, href, languageMenu, neighbouringPages, sidebar } from './navigation.js';

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

function showSearch(event) {
  const dialog = searchDialog();
  const menu = document.querySelector('#site-menu');
  if (menu.matches(':popover-open')) {
    menu.hidePopover();
    document.querySelector('.site-menu-toggle').focus();
  }
  event?.currentTarget.focus();
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('input').focus();
}

function siteMenu(page, dark, t, changeTheme) {
  return html`<button class="site-menu-toggle" type="button" popovertarget="site-menu" aria-label=${t('menu')}>
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
  </button>
  <div id="site-menu" popover>
    <nav class="compact-nav" aria-label=${t('mainNavigation')}>${headerLinks(page, t)}</nav>
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

function searchButton(t) {
  return html`<button class="site-search-trigger" type="button" aria-haspopup="dialog" aria-label=${t('search.button')} @click=${showSearch}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/></svg>
    <span>${t('search.button')}</span>
    <kbd aria-hidden="true"><span class="shortcut-ctrl">Ctrl K</span><span class="shortcut-cmd">⌘ K</span></kbd>
  </button>`;
}

function searchKeys(event) {
  if (event.isComposing) return;
  const dialog = event.currentTarget;
  if (event.key === 'Escape') {
    event.preventDefault();
    dialog.close();
    return;
  }
  const input = dialog.querySelector('input');
  const results = [...dialog.querySelectorAll('.search-results a')];
  if (!results.length) return;
  const active = results.indexOf(event.target);
  if (event.target === input && event.key === 'Enter') {
    event.preventDefault();
    results[0].click();
  }
  if ((active >= 0 || event.target === input) && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    if (active < 0 && event.key === 'ArrowUp') return results.at(-1).focus();
    const index = active + (event.key === 'ArrowDown' ? 1 : -1);
    (results[index] ?? input).focus();
  }
}

function searchView(entity, emit, t) {
  return html`<dialog id="site-search" aria-labelledby="search-title" @keydown=${searchKeys}
    @click=${(event) => {
      const dialog = event.currentTarget;
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }}>
    <div class="search-title"><h2 id="search-title">${t('searchTitle')}</h2>
      <form method="dialog"><button type="submit">${t('searchClose')}</button></form>
    </div>
    ${Input.render({
      id: 'search-query', label: t('searchLabel'), placeholder: t('searchLabel'), inputType: 'search', autocomplete: 'off',
      value: entity.query, onChange: (value) => emit('searchChanged', value),
    })}
    <div class="search-feedback">
      <p role="status">${entity.searchError ? t('searchError') : entity.searching ? t('searching') : entity.query && !entity.matches.length ? t('searchNone') : ''}</p>
      ${entity.searchError ? html`<button type="button" @click=${() => {
        searchDialog().querySelector('input').focus();
        emit('searchChanged', entity.query);
      }}>${t('searchRetry')}</button>` : ''}
    </div>
    <ul class="search-results">
      ${entity.matches.map(({ url, heading, title, snippet }) => html`<li>
        <a data-external href=${url} @click=${() => searchDialog().close()}><strong>${heading || title}</strong>
          ${heading ? html`<span>${title}</span>` : ''}<small>${snippet}</small>
        </a>
      </li>`)}
    </ul>
    ${entity.matches.length ? html`<div class="search-keys" aria-hidden="true">${t('searchBrowse')}<span>${t('searchEnter')}</span></div>` : ''}
  </dialog>`;
}

function outline(page, current, t) {
  return html`<nav aria-label=${t('outline')}>
    ${page.headings.map(({ id, label, level }) => html`<a data-external class=${level === 3 ? 'subheading' : nothing}
      aria-current=${current === id ? 'location' : nothing} href=${'#' + id}>${label}</a>`)}
  </nav>`;
}

function article(page, entity, emit, replay, t) {
  const hasOutline = page.headings.length > 0;
  const contents = () => outline(page, entity.outline, t);
  return html`<div class=${'wiki-layout' + (hasOutline ? ' has-outline' : '')}>
    <aside class="wiki-sidebar" aria-label=${t('wikiNavigation')}>
      <details open>
        <summary>${t('wikiNavigation')}</summary>
        <p class="wiki-topics-title">${t('wikiNavigation')}</p>
        <nav aria-label=${t('wikiNavigation')}>${sidebar(page, t)}</nav>
      </details>
    </aside>
    <main id="content" tabindex="-1" class="vp-doc wiki-article">
      <header class="article-heading">
        ${breadcrumbs(page, t)}
        ${page.heading ? unsafeHTML(page.heading) : html`<h1>${page.title}</h1>`}
      </header>
      ${hasOutline ? html`<details class="outline outline-compact"><summary>${t('outline')}</summary>${contents()}</details>` : ''}
      ${page.parts.map((part, i) => {
        if (i % 2 === 0) return unsafeHTML(part); // Compiled from repository Markdown at build time.
        if (part === 'directory') return directoryView(entity.directoryFilters, emit);
        if (part === 'subscribe') return subscribeView(entity.subscribe, async (url) => emit('addressCopied', await copyText(url)));
        return guideDemo(part, entity.demo, replay, t);
      })}
      ${page.route === '/subscribe' ? '' : html`<div class="article-footer">
        <div class="article-actions">
          <a href=${issueBase + page.file}>${t('editLink')}</a>
          <a data-external href="#content">${t('top')}</a>
        </div>
        ${neighbouringPages(page, t)}
      </div>`}
    </main>
    ${hasOutline ? html`<aside class="outline outline-sticky" aria-label=${t('outline')}>
      <p>${t('outline')}</p>${contents()}
    </aside>` : ''}
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
        dark: false, step: 1, demo: blankDemo(), outline: '', directoryFilters: emptyFilters(), subscribe: { broken: false },
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
      if (!page.home) {
        prepareReader(t);
        followOutline(page.headings, emit);
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
    routeChange() { restoreFragment(); },
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
    directoryFiltered(entity, filter) { Object.assign(entity.directoryFilters, filter); },
    outlineChanged(entity, id) { entity.outline = id; },
    addressCopied(entity, copied) { entity.subscribe.copied = copied; },
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
        <header class="site-header" ?data-wiki=${!page.home}>
          <a data-external class="site-brand" href=${href(homePath(page.folder))}><img src=${href('/anubis.svg')} alt="" width="25" height="25"> Anubis</a>
          ${searchButton(t)}
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
