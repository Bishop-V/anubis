import { CLEANUP, type CleanupKind } from '@/utils/cleanup';
import { h } from '@/utils/dom';
import { t } from '@/utils/i18n';
import { getSettings, updateSettings } from '@/utils/storage';
import { helpLink, pageTitle, switchRow } from './parts';

// "Remove panels": parts of search pages that aren't results (AI answers, video
// panels, "People also ask"), removed on every search.

interface Option {
  label: string;
  hint: string;
  on: boolean;
}

/**
 * A section's switches, led by one that turns them all on or off. The lead is
 * on only while every switch is; `save` gets the switches' new values in order.
 */
function switchGroup(options: Option[], save: (values: boolean[]) => void): HTMLElement[] {
  const values = options.map((o) => o.on);
  const rows = options.map((o, i) =>
    switchRow(o.label, o.hint, o.on, (on) => {
      values[i] = on;
      all.checked = values.every(Boolean);
      save([...values]);
    }),
  );
  const lead = switchRow(t('cleanupAll'), t('cleanupAllHint'), values.every(Boolean), (on) => {
    values.fill(on);
    for (const row of rows) row.querySelector('input')!.checked = on;
    save([...values]);
  });
  const all = lead.querySelector('input')!;
  return [lead, ...rows];
}

export async function renderCleanup(): Promise<HTMLElement> {
  const settings = await getSettings();
  const saveKinds = (values: boolean[]) =>
    updateSettings((current) => ({
      cleanup: { ...current.cleanup, ...Object.fromEntries(CLEANUP.map((def, i): [CleanupKind, boolean] => [def.id, values[i] ?? false])) },
    }));
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
      switchGroup(
        CLEANUP.map((def) => ({ label: t(def.label), hint: t(def.hint), on: settings.cleanup[def.id] })),
        (values) => void saveKinds(values),
      ),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('cleanupOnGoogle')),
      switchGroup(
        [
          {
            label: t('cleanupWebTab'),
            hint: t('cleanupWebTabHint'),
            on: settings.googleWebTab,
          },
        ],
        ([googleWebTab]) => void updateSettings({ googleWebTab }),
      ),
    ),
  );
}
