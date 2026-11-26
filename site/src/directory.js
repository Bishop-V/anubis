import { Input } from '@inglorious/ui/input';
import { html } from '@inglorious/web';
import directory from '../../lists/directory.json';
import { subscribeQuery } from '../../utils/links.ts';
import { href, pageLink } from './navigation.js';

const formats = { anubis: 'Anubis list', goggle: 'Brave Goggle', ublacklist: 'uBlacklist ruleset', domains: 'Domain list' };
export const emptyFilters = () => ({ query: '', availability: 'all' });

function listEntry(list) {
  return html`<li class="directory-item">
    <div class="directory-description">
      <h2><a href=${list.homepage ?? list.url} target="_blank" rel="noopener noreferrer">${list.name}</a></h2>
      <div class="directory-meta">
        <span>${formats[list.format] ?? list.format}</span>
        ${list.default ? html`<span>Included by default</span>` : ''}
        ${list.lens ? html`<span>Lens</span>` : ''}
      </div>
      <p>${list.description}${list.lens ? ' A lens hides every result it doesn’t mention.' : ''}</p>
    </div>
    <a data-external class="directory-subscribe" href=${href('/subscribe?' + subscribeQuery(list))}
      aria-label=${'Subscribe to ' + list.name}>Subscribe</a>
  </li>`;
}

export function directoryView({ query, availability }, emit) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = directory.lists.filter((list) => {
    if (availability !== 'all' && Boolean(list.default) !== (availability === 'included')) return false;
    const searchable = [list.name, list.description, list.format, formats[list.format], list.lens ? 'lens' : ''].join(' ').toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });

  return html`<div class="directory">
    <div class="directory-controls">
      ${Input.render({
        id: 'directory-filter', label: 'Filter lists', inputType: 'search', placeholder: 'List name, topic, or format',
        value: query, onChange: (value) => emit('directoryFiltered', { query: value }),
      })}
      <label class="directory-availability">Availability
        <select .value=${availability} @change=${(event) => emit('directoryFiltered', { availability: event.target.value })}>
          <option value="all">All lists</option>
          <option value="included">Included by default</option>
          <option value="optional">Optional lists</option>
        </select>
      </label>
    </div>
    <div class="directory-toolbar">
      <span role="status">${matches.length} of ${directory.lists.length} lists</span>
      <a data-external href="#add-your-list">Add your list</a>
    </div>
    ${matches.length ? html`<ul class="directory-list" role="list">${matches.map(listEntry)}</ul>` : html`
      <div class="directory-empty">
        <h2>No matching lists</h2>
        <p>Try another name or show all lists.</p>
        <button type="button" @click=${() => emit('directoryFiltered', emptyFilters())}>Clear filters</button>
      </div>
    `}
  </div>`;
}

export function subscribeView({ link, broken, copied }, copyAddress) {
  if (!link) return broken
    ? html`<div class="callout"><p>This link doesn’t name a list Anubis can subscribe to. The list address has to start with <code>https://</code>.</p>
        <p>${pageLink('Find a list in the directory', '/lists')}.</p></div>`
    : html`<p>Subscribe links open Anubis’s settings with a list filled in. The ${pageLink('lists directory', '/lists')} has one for each list.</p>`;
  let name = link.name;
  if (!name) {
    const address = new URL(link.url);
    const tail = address.pathname.split('/').filter(Boolean).at(-1) || address.hostname;
    try { name = decodeURIComponent(tail); } catch { name = tail; }
  }
  return html`<section class="subscribe-details" aria-label="List details">
    <p>Subscribe to <strong>${name}</strong> in Anubis.</p>
    <p class="list-address"><a href=${link.url} target="_blank" rel="noopener noreferrer">${link.url}</a></p>
    <button type="button" @click=${() => copyAddress(link.url)}>Copy list address</button>
    <span role="status">${copied === true ? 'Address copied.' : copied === false ? 'Select and copy the address above.' : ''}</span>
  </section>
    <ul>
      <li><strong>With Anubis installed</strong>, press <strong>Subscribe</strong> in the settings that open. If settings didn’t open, <a data-external href=${href('/subscribe?' + subscribeQuery(link))}>open the link again</a>.</li>
      <li><strong>Without Anubis</strong>, ${pageLink('install it', '/guide/getting-started')} and open this link again, or paste the address into <strong>Settings → Lists → Add a list</strong>.</li>
    </ul>
    <p>A list can hide, rank, and tag sites in your results. Only subscribe to lists you trust.</p>`;
}
