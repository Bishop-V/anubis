import { h } from '@/utils/dom';
import { t } from '@/utils/i18n';

// A message shown after an action (subscribed, imported, restored…). Saving
// triggers one or more re-renders of the section, so a message stays for a few
// seconds instead of disappearing with the first one.
//
// Deleting something says what went and offers Undo, rather than asking first:
// a browser can be told to stop showing a page's dialogs, and confirm() then
// answers "no" at once, so the button would do nothing.

interface Flash {
  kind: 'ok' | 'error';
  text: string;
  until: number;
  undo?: () => Promise<void>;
}

const messages = new Map<string, Flash>();
/**
 * The Undo button to keep focus on, since what was deleted (and focused) is gone.
 * Saving renders the section more than once; focus follows each new button until
 * it moves somewhere else.
 */
let focusUndo: string | undefined;
document.addEventListener('focusin', (e) => {
  if (!(e.target instanceof HTMLElement && e.target.dataset.undo)) focusUndo = undefined;
});

export function flash(key: string, kind: 'ok' | 'error', text: string, undo?: () => Promise<void>): void {
  messages.set(key, { kind, text, undo, until: Date.now() + (kind === 'error' || undo ? 15000 : 6000) });
  if (undo) focusUndo = key;
}

export function flashed(key: string): HTMLElement | null {
  const m = messages.get(key);
  if (!m) return null;
  if (Date.now() > m.until) {
    messages.delete(key);
    return null;
  }
  const undo = m.undo
    ? h(
        'button',
        {
          class: 'text-btn',
          type: 'button',
          attrs: { 'data-undo': key },
          on: {
            click: async () => {
              messages.delete(key);
              await m.undo!();
              rerender();
            },
          },
        },
        t('summaryUndo'),
      )
    : null;
  // After the section has replaced the old one.
  if (undo && focusUndo === key) setTimeout(() => focusUndo === key && undo.isConnected && undo.focus(), 0);
  return h('div', { class: `notice ${m.kind}`, attrs: { role: 'status' } }, m.text, undo ? [' ', undo] : null);
}

export function rerender(): void {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
