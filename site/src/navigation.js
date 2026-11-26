import { html, nothing } from '@inglorious/web';
import { TRANSLATED_PAGES } from '../../utils/links.ts';
import { languages } from './languages.js';

export const base = '/anubis';
export const href = (path) => path.startsWith('/') ? base + path : path;

const sections = [
  ['startHere', [
    ['introduction', '/guide/introduction'],
    ['gettingStarted', '/guide/getting-started'],
  ]],
  ['using', [
    ['ranking', '/guide/ranking'],
    ['tags', '/guide/tags'],
    ['subscribing', '/guide/lists'],
    ['panels', '/guide/clean-up'],
    ['more', '/guide/more-results'],
    ['moving', '/guide/import-and-backup'],
    ['sync', '/guide/sync'],
  ]],
  ['help', [
    ['troubleshooting', '/guide/troubleshooting'],
    ['engines', '/guide/search-engines'],
    ['privacyFull', '/guide/privacy'],
  ]],
  ['publishing', [
    ['publish', '/guide/publish-a-list'],
    ['listFormat', '/list-format'],
    ['directory', '/lists'],
  ]],
  ['involved', [
    ['translate', '/guide/translate'],
    ['experiments', '/experiments'],
    ['platformWatch', '/platform-watch'],
    ['contributing', 'https://github.com/Bishop-V/anubis/blob/main/CONTRIBUTING.md'],
    ['developing', 'https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md'],
  ]],
];

const top = [['wiki', '/guide/introduction'], ['lists', '/lists'], ['listFormat', '/list-format'], ['privacy', '/guide/privacy']];

export function pageLink(label, path, current) {
  return html`<a data-external href=${href(path)} aria-current=${path === current ? 'page' : nothing}>${label}</a>`;
}

function localPath(path, folder) {
  return folder !== 'en' && TRANSLATED_PAGES.includes(path.slice(1)) ? '/' + folder + path : path;
}

export function homePath(folder) {
  return localPath('/', folder);
}

export function languageMenu(page, t) {
  const original = page.folder === 'en' ? page.route : page.route.slice(page.folder.length + 1);
  const translated = TRANSLATED_PAGES.includes(original.slice(1));
  return html`<details class="language-menu">
    <summary>${t('langMenu')}</summary>
    <ul>${languages.map(({ folder, label, lang }) => {
      const path = folder === page.folder ? page.route : translated ? localPath(original, folder) : homePath(folder);
      return html`<li><a data-external href=${href(path)} lang=${lang} hreflang=${lang}
        aria-current=${page.folder === folder ? 'true' : 'false'}>${label}</a></li>`;
    })}</ul>
  </details>`;
}

const navLink = ([label, path], page, t) => pageLink(t(label), localPath(path, page.folder), page.route);

export const headerLinks = (page, t) => top.map(([key, path]) => {
  const guide = localPath('/guide/introduction', page.folder);
  const active = key === 'wiki' && page.route !== localPath('/guide/privacy', page.folder)
    && (page.route.includes('/guide/') || page.route.startsWith('/experiments'));
  if (active && page.route !== guide) {
    return html`<a data-external class="active-section" href=${href(guide)}>${t(key)}</a>`;
  }
  return navLink([key, path], page, t);
});

function activeGroup(page) {
  return sections.find(([, links]) => links.some(([, path]) => localPath(path, page.folder) === page.route))?.[0]
    ?? (page.route.startsWith('/experiments/') ? 'involved' : page.route === '/subscribe' ? 'publishing' : undefined);
}

export function breadcrumbs(page, t) {
  const group = activeGroup(page);
  if (!group) return '';
  const introduction = localPath('/guide/introduction', page.folder);
  return html`<nav class="breadcrumbs" aria-label=${t('breadcrumb')}>
    <ol>
      <li>${page.route === introduction ? t('wiki') : pageLink(t('wiki'), introduction)}</li>
      <li>${t(group)}</li>
    </ol>
  </nav>`;
}

export const sidebar = (page, t) => sections.map(([group, links]) => html`<section class=${group === activeGroup(page) ? 'current-group' : nothing}>
  <h2>${t(group)}</h2>
  <ul>${links.map((item) => html`<li>${navLink(item, page, t)}</li>`)}</ul>
</section>`);

export function neighbouringPages(page, t) {
  const pages = sections.flatMap(([, links]) => links.filter(([, path]) => path.startsWith('/')));
  const index = pages.findIndex(([, path]) => localPath(path, page.folder) === page.route);
  if (index < 0) return '';
  return html`<nav class="neighbours" aria-label=${t('adjacentPages')}>
    ${[[-1, 'prev'], [1, 'next']].map(([offset, direction]) => {
      const entry = pages[index + offset];
      if (!entry) return nothing;
      const [label, path] = entry;
      return html`<a class=${direction} data-external href=${href(localPath(path, page.folder))}>
        <span>${t(direction)}</span><strong>${t(label)}</strong>
      </a>`;
    })}
  </nav>`;
}
