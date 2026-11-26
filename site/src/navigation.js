import { html } from '@inglorious/web';

export const base = '/anubis';
export const href = (path) => path.startsWith('/') ? base + path : path;

export const sections = [
  ['Start here', [
    ['Introduction', '/guide/introduction'],
    ['Getting started', '/guide/getting-started'],
  ]],
  ['Using Anubis', [
    ['Ranking sites', '/guide/ranking'],
    ['Tags', '/guide/tags'],
    ['Subscribing to lists', '/guide/lists'],
    ['Removing panels', '/guide/clean-up'],
    ['Loading more results', '/guide/more-results'],
    ['Moving from other tools', '/guide/import-and-backup'],
    ['Syncing between computers', '/guide/sync'],
  ]],
  ['Help', [
    ['Troubleshooting', '/guide/troubleshooting'],
    ['Search engines', '/guide/search-engines'],
    ['Privacy and permissions', '/guide/privacy'],
  ]],
  ['Publishing lists', [
    ['Publish a list', '/guide/publish-a-list'],
    ['List format', '/list-format'],
    ['Lists directory', '/lists'],
  ]],
  ['Get involved', [
    ['Help translate', '/guide/translate'],
    ['Experiments and decisions', '/experiments'],
    ['Platform watch', '/platform-watch'],
    ['Contributing', 'https://github.com/Bishop-V/anubis/blob/main/CONTRIBUTING.md'],
    ['Developing Anubis', 'https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md'],
  ]],
];

const top = [['Wiki', '/guide/introduction'], ['Lists', '/lists'], ['List format', '/list-format'], ['Privacy', '/guide/privacy']];

export function pageLink(label, path, current) {
  return html`<a data-external href=${href(path)} aria-current=${path === current ? 'page' : 'false'}>${label}</a>`;
}

export const headerLinks = (current) => top.map(([label, path]) => pageLink(label, path, current));
export const sidebar = (current) => sections.map(([group, links]) => html`<section>
  <h2>${group}</h2>
  ${links.map(([label, path]) => pageLink(label, path, current))}
</section>`);

export function neighbouringPages(current) {
  const pages = sections.flatMap(([, links]) => links.filter(([, path]) => path.startsWith('/')));
  const index = pages.findIndex(([, path]) => path === current);
  if (index < 0) return '';
  return html`<nav class="neighbours" aria-label="Adjacent pages">
    ${pages.slice(Math.max(index - 1, 0), index).map(([label, path]) => pageLink(label, path, current))}
    ${pages.slice(index + 1, index + 2).map(([label, path]) => pageLink(label, path, current))}
  </nav>`;
}
