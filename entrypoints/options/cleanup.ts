import { CLEANUP, type CleanupKind } from '@/utils/cleanup';
import { h } from '@/utils/dom';
import { t } from '@/utils/i18n';
import { getSettings, updateSettings } from '@/utils/storage';
import { helpLink, pageTitle, switchRow } from './parts';

// "Remove panels": parts of search pages that aren't results (AI answers, video
// panels, "People also ask"), removed on every search.

export async function renderCleanup(): Promise<HTMLElement> {
  const settings = await getSettings();
  const setKind = (id: CleanupKind, on: boolean) => updateSettings((current) => ({ cleanup: { ...current.cleanup, [id]: on } }));
  return h(
    'div',
    null,
    pageTitle(
      t('cleanupHeading'),
      t('cleanupIntro'),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('cleanupEverySearch')),
      h('p', { class: 'muted' }, t('cleanupEverySearchHint'), ' ', helpLink('guide/troubleshooting#ai-answers-or-panels-still-show', t('cleanupStillShows'))),
      CLEANUP.map((def) => switchRow(t(def.label), t(def.hint), settings.cleanup[def.id], (on) => void setKind(def.id, on))),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('cleanupOnGoogle')),
      switchRow(
        t('cleanupWebTab'),
        t('cleanupWebTabHint'),
        settings.googleWebTab,
        (googleWebTab) => void updateSettings({ googleWebTab }),
      ),
    ),
  );
}
