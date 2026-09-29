import { CLEANUP, type CleanupKind } from '@/utils/cleanup';
import { h } from '@/utils/dom';
import { getSettings, updateSettings } from '@/utils/storage';

// "Clean up": parts of search pages that aren't results, removed on every search.

function switchRow(label: string, hint: string, checked: boolean, onChange: (on: boolean) => void): HTMLElement {
  const input = h('input', { type: 'checkbox', checked, attrs: { 'aria-label': label } });
  input.addEventListener('change', () => onChange(input.checked));
  return h(
    'div',
    { class: 'setting' },
    h('div', null, h('b', null, label), h('span', { class: 'muted' }, hint)),
    h('label', { class: 'switch' }, input, h('span')),
  );
}

export async function renderCleanup(): Promise<HTMLElement> {
  const settings = await getSettings();
  const setKind = async (id: CleanupKind, on: boolean) => {
    const current = await getSettings();
    await updateSettings({ cleanup: { ...current.cleanup, [id]: on } });
  };
  return h(
    'div',
    null,
    h(
      'div',
      { class: 'page-title' },
      h(
        'div',
        null,
        h('h2', null, 'Clean up pages'),
        h('p', null, 'Remove parts of search pages that aren’t results. “Show hidden” above the results brings them back on that page.'),
      ),
    ),
    h(
      'div',
      { class: 'panel' },
      CLEANUP.map((def) => switchRow(def.label, def.hint, settings.cleanup[def.id], (on) => void setKind(def.id, on))),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Google'),
      switchRow(
        'Always open the Web tab',
        'Google’s own view of plain web links. It never has an AI Overview, videos or other panels, even ones Anubis doesn’t recognise. Choose All above the results to leave it for one search.',
        settings.googleWebTab,
        (googleWebTab) => void updateSettings({ googleWebTab }),
      ),
    ),
  );
}
