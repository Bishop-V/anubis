import { CLEANUP, type CleanupKind } from '@/utils/cleanup';
import { h } from '@/utils/dom';
import { t, type MessageKey } from '@/utils/i18n';
import { getSettings, updateSettings, type Settings } from '@/utils/storage';
import { helpLink, pageTitle, switchRow } from './parts';

// "Remove panels": parts of search pages that aren't results (AI answers, video
// panels, "People also ask"), removed on every search. The switches come in a
// few groups, each led by a switch for the whole group, with its parts indented
// under it, so the page reads as five choices rather than eleven.

/** One switch: a clean-up kind, or Google's Web tab, which is its own setting. */
type Item = CleanupKind | 'webTab';

interface Group {
  /** The group's name; a group of one is just that switch, with any extras under it. */
  label?: MessageKey;
  items: Item[];
}

const GROUPS: Group[] = [
  { items: ['ai', 'webTab'] },
  { label: 'cleanupGroupMedia', items: ['videos', 'images', 'news'] },
  { label: 'cleanupGroupQuestions', items: ['questions', 'discussions', 'related'] },
  { label: 'cleanupGroupAds', items: ['ads', 'adRequests'] },
  { items: ['elsewhere'] },
];

const label = (item: Item): MessageKey => (item === 'webTab' ? 'cleanupWebTab' : CLEANUP.find((def) => def.id === item)!.label);
const hint = (item: Item): MessageKey => (item === 'webTab' ? 'cleanupWebTabHint' : CLEANUP.find((def) => def.id === item)!.hint);

export async function renderCleanup(): Promise<HTMLElement> {
  const settings = await getSettings();
  const isOn = (item: Item) => (item === 'webTab' ? settings.googleWebTab : settings.cleanup[item]);
  const save = (changes: Partial<Record<Item, boolean>>) =>
    void updateSettings((current): Partial<Settings> => {
      const { webTab, ...kinds } = changes;
      return { cleanup: { ...current.cleanup, ...kinds }, ...(webTab === undefined ? {} : { googleWebTab: webTab }) };
    });

  const group = ({ label: name, items }: Group): HTMLElement => {
    // A named group's lead switch turns all of its parts on or off, and shows
    // half-way while only some are on. An unnamed group leads with its first switch,
    // and the rest are extras that only make sense under it (Google's Web tab under AI answers).
    const children = name ? items : items.slice(1);
    const rows = children.map((item) => {
      // Inside a named group the parts' names say enough; Google's Web tab needs its note.
      const row = switchRow(t(label(item)), name ? '' : t(hint(item)), isOn(item), (on) => {
        save({ [item]: on });
        if (name) sync();
      });
      row.classList.add('child');
      return row;
    });
    const inputs = rows.map((row) => row.querySelector('input')!);
    const lead = name
      ? switchRow(t(name), '', false, (on) => {
          for (const input of inputs) input.checked = on;
          save(Object.fromEntries(items.map((item) => [item, on])));
          sync();
        })
      : switchRow(t(label(items[0]!)), t(hint(items[0]!)), isOn(items[0]!), (on) => save({ [items[0]!]: on }));
    const leadInput = lead.querySelector('input')!;
    function sync() {
      const on = inputs.filter((input) => input.checked).length;
      leadInput.checked = on === inputs.length;
      leadInput.indeterminate = on > 0 && on < inputs.length;
    }
    if (name) sync();
    lead.classList.add('lead');
    return h('div', { class: 'setting-group' }, lead, rows);
  };

  return h(
    'div',
    null,
    pageTitle(t('cleanupHeading'), t('cleanupIntro')),
    h('div', { class: 'panel' }, GROUPS.map(group)),
    h('p', { class: 'muted' }, helpLink('guide/troubleshooting#ai-answers-or-panels-still-show', t('cleanupStillShows'))),
  );
}
