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
    pageTitle(
      'Clean up pages',
      'Anubis can remove the parts of search pages that aren’t results. Turn on each one you’d rather not see. “Show hidden” above the results brings them back for that search.',
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'Remove from every search'),
      h('p', { class: 'muted' }, 'On means Anubis removes it. Off leaves it on the page.'),
      CLEANUP.map((def) => switchRow(def.label, def.hint, settings.cleanup[def.id], (on) => void setKind(def.id, on))),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'On Google'),
      switchRow(
        'Always open the Web tab',
        'Sends every Google search to its Web tab: plain links, with no AI Overview, videos, or other panels, even ones Anubis doesn’t recognise. To leave it for one search, choose All above the results.',
        settings.googleWebTab,
        (googleWebTab) => void updateSettings({ googleWebTab }),
      ),
    ),
  );
}
