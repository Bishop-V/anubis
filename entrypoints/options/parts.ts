import { h } from '@/utils/dom';

// Pieces every settings section is built from, so they look and behave alike.

/**
 * A section's heading and what it's for, with its buttons beside them. main.ts
 * adds a link to the section's page in the user guide after the description.
 */
export function pageTitle(heading: string, text: string, ...tools: HTMLElement[]): HTMLElement {
  return h(
    'div',
    { class: 'page-title' },
    h('div', null, h('h2', null, heading), h('p', null, text)),
    tools.length ? h('div', { class: 'toolbar' }, tools) : null,
  );
}

/** A setting with an on/off switch. */
export function switchRow(label: string, hint: string, checked: boolean, onChange: (on: boolean) => void): HTMLElement {
  const input = h('input', { type: 'checkbox', checked, attrs: { 'aria-label': label } });
  input.addEventListener('change', () => onChange(input.checked));
  return h(
    'div',
    { class: 'setting' },
    h('div', null, h('b', null, label), h('span', { class: 'muted' }, hint)),
    h('label', { class: 'switch' }, input, h('span')),
  );
}
