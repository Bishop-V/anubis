import { h, icon } from '@/utils/dom';
import { ICON_EXTERNAL } from '@/utils/icons';
import { guide } from '@/utils/links';

// Pieces every settings section is built from, so they look and behave alike.

/**
 * A section's heading and what it's for, with its buttons beside them. main.ts
 * adds a link to the section's page in the wiki after the description.
 */
export function pageTitle(heading: string, text: string, ...tools: HTMLElement[]): HTMLElement {
  return h(
    'div',
    { class: 'page-title' },
    h('div', null, h('h2', null, heading), h('p', null, text)),
    tools.length ? h('div', { class: 'toolbar' }, tools) : null,
  );
}

/** A link to a page of the wiki, like `guide/sync#browser-sync`, opening in a new tab. */
export function helpLink(path: string, text: string): HTMLElement {
  return h('a', { class: 'help-link', href: guide(path), target: '_blank', rel: 'noopener noreferrer' }, text, icon(ICON_EXTERNAL));
}

/** A setting with an on/off switch, and a link to where the wiki explains it. */
export function switchRow(label: string, hint: string, checked: boolean, onChange: (on: boolean) => void, help?: HTMLElement): HTMLElement {
  const input = h('input', { type: 'checkbox', checked, attrs: { 'aria-label': label } });
  input.addEventListener('change', () => onChange(input.checked));
  return h(
    'div',
    { class: 'setting' },
    h('div', null, h('b', null, label), h('span', { class: 'muted' }, hint, help ? [' ', help] : null)),
    h('label', { class: 'switch' }, input, h('span')),
  );
}
