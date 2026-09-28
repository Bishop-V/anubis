import { h } from '@/utils/dom';

// A message shown after an action (subscribed, imported, restored…). Saving
// triggers one or more re-renders of the section, so a message stays for a few
// seconds instead of disappearing with the first one.

const messages = new Map<string, { kind: 'ok' | 'error'; text: string; until: number }>();

export function flash(key: string, kind: 'ok' | 'error', text: string): void {
  messages.set(key, { kind, text, until: Date.now() + (kind === 'error' ? 15000 : 6000) });
}

export function flashed(key: string): HTMLElement | null {
  const m = messages.get(key);
  if (!m) return null;
  if (Date.now() > m.until) {
    messages.delete(key);
    return null;
  }
  return h('div', { class: `notice ${m.kind}`, attrs: { role: 'status' } }, m.text);
}

export function rerender(): void {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
