import { CLEANUP, type CleanupKind } from '@/utils/cleanup';
import { h } from '@/utils/dom';
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
  const lead = switchRow('All of these', 'Turns every switch in this section on or off.', values.every(Boolean), (on) => {
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
      'Remove panels',
      'Anubis can remove the panels on search pages that aren’t results. Turn on each one you’d rather not see. “Show hidden” above the results brings them back for that search.',
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'On every search'),
      h(
        'p',
        { class: 'muted' },
        'On means Anubis removes it. Off leaves it on the page.',
        ' ',
        helpLink('guide/troubleshooting#ai-answers-or-panels-still-show', 'If a panel still shows'),
      ),
      switchGroup(
        CLEANUP.map((def) => ({ label: def.label, hint: def.hint, on: settings.cleanup[def.id] })),
        (values) => void saveKinds(values),
      ),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'On Google'),
      switchGroup(
        [
          {
            label: 'Always open the Web tab',
            hint: 'Sends every Google search to its Web tab: plain links, with no AI Overview, videos, or other panels, even ones Anubis doesn’t recognise. To leave it for one search, choose All above the results.',
            on: settings.googleWebTab,
          },
        ],
        ([googleWebTab]) => void updateSettings({ googleWebTab }),
      ),
    ),
  );
}
