import { h, icon } from '@/utils/dom';
import { ICON_EXTERNAL, ICON_GRIP } from '@/utils/icons';
import { t, tNumber } from '@/utils/i18n';
import { wiki } from '@/utils/wiki';

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

/** Which sections someone opened or closed, kept while the page is open: settings re-render on every change. */
const folded = new Map<string, boolean>();

/**
 * A section of a settings page that folds away under its heading, so a long one
 * doesn't push the rest out of sight. `open` is how it starts until someone
 * opens or closes it.
 */
export function foldable(id: string, heading: string, count: number | null, open: boolean, ...content: (Node | Node[] | null)[]): HTMLElement {
  const initial = folded.get(id) ?? open;
  const details = h(
    'details',
    { class: 'fold', open: initial },
    h('summary', null, h('span', { class: 'fold-title' }, heading), count === null ? null : h('span', { class: 'count' }, tNumber(count))),
    ...content,
  );
  // Opening it as it's built fires a toggle too, which isn't anyone's choice.
  details.addEventListener('toggle', () => {
    if (folded.has(id) || details.open !== initial) folded.set(id, details.open);
  });
  return details;
}

/** The handle that was moved with the keyboard, to focus again once the page shows the new order. */
let movedGrip: string | undefined;

/**
 * A handle that moves its row: drag it (mouse, pen, or touch), or focus it and
 * press the up and down arrows. The row and its siblings carry `data-order`.
 * `save` gets the ids in their new order; the page renders again from storage.
 */
export function grip(scope: string, id: string, name: string, ids: string[], save: (ids: string[]) => void): HTMLElement {
  const key = `${scope}:${id}`;
  const from = ids.indexOf(id);
  const label = t('moveItem', name, from + 1, ids.length);
  const button = h('button', { class: 'grip', type: 'button', title: t('moveTitle'), attrs: { 'aria-label': label } }, icon(ICON_GRIP));
  const moveTo = (to: number) => {
    if (to < 0 || to >= ids.length || to === from) return;
    const next = ids.filter((x) => x !== id);
    next.splice(to, 0, id);
    save(next);
  };
  button.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
    if (!step) return;
    e.preventDefault();
    movedGrip = key;
    moveTo(from + step);
  });
  button.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const row = button.closest<HTMLElement>('[data-order]');
    const rows = row ? [...row.parentElement!.children].filter((r): r is HTMLElement => r instanceof HTMLElement && r.hasAttribute('data-order')) : [];
    if (!row || rows.length < 2) return;
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    row.classList.add('dragging');
    let to = from;
    const mark = () => {
      for (const r of rows) r.classList.remove('drop-before', 'drop-after');
      if (to === from) return;
      rows[to]!.classList.add(to < from ? 'drop-before' : 'drop-after');
    };
    const onMove = (ev: PointerEvent) => {
      // The row the pointer is over, by its middle.
      const over = rows.findIndex((r) => ev.clientY < r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2);
      to = over === -1 ? rows.length - 1 : over > from ? over - 1 : over;
      mark();
    };
    const end = (ev: PointerEvent) => {
      button.removeEventListener('pointermove', onMove);
      button.removeEventListener('pointerup', end);
      button.removeEventListener('pointercancel', end);
      row.classList.remove('dragging');
      for (const r of rows) r.classList.remove('drop-before', 'drop-after');
      if (ev.type === 'pointerup') moveTo(to);
    };
    button.addEventListener('pointermove', onMove);
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
  });
  if (movedGrip === key) {
    movedGrip = undefined;
    // After the section has replaced the old one.
    setTimeout(() => button.isConnected && button.focus(), 0);
  }
  return button;
}

/** A link to a page of the wiki, like `guide/sync#browser-sync`, opening in a new tab. */
export function helpLink(path: string, text: string): HTMLElement {
  return h('a', { class: 'help-link', href: wiki(path), target: '_blank', rel: 'noopener noreferrer' }, text, icon(ICON_EXTERNAL));
}

/** A setting with an on/off switch, and a link to where the wiki explains it. */
export function switchRow(label: string, hint: string, checked: boolean, onChange: (on: boolean) => void, help?: HTMLElement): HTMLElement {
  const input = h('input', { type: 'checkbox', checked, attrs: { 'aria-label': label } });
  input.addEventListener('change', () => onChange(input.checked));
  return h(
    'div',
    { class: 'setting' },
    h('div', null, h('b', null, label), hint || help ? h('span', { class: 'muted' }, hint, help ? [' ', help] : null) : null),
    h('label', { class: 'switch' }, input, h('span')),
  );
}

/** Hands text to the browser as a file to save. */
export function download(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
