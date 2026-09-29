import { CLEANUP, type CleanupKind } from '@/utils/cleanup';
import { h } from '@/utils/dom';
import { getSettings, updateSettings } from '@/utils/storage';
import { pageTitle, switchRow } from './parts';

// "Clean up": parts of search pages that aren't results, removed on every search.

export async function renderCleanup(): Promise<HTMLElement> {
  const settings = await getSettings();
  const setKind = (id: CleanupKind, on: boolean) => updateSettings((current) => ({ cleanup: { ...current.cleanup, [id]: on } }));
  return h(
    'div',
    null,
    pageTitle('Clean up pages', 'Remove parts of search pages that aren’t results. “Show hidden” above the results brings them back on that page.'),
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
