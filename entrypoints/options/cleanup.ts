import { CLEANUP, type CleanupKind } from '@/utils/cleanup';
import { h } from '@/utils/dom';
import { t, type MessageKey } from '@/utils/i18n';
import { getSettings, updateSettings, type Settings } from '@/utils/storage';
import { helpLink, pageTitle, switchRow } from './parts';

// "Remove panels": parts of search pages that aren't results (AI answers, video
// panels, "People also ask"), removed on every search. The switches come in a
// few groups, each led by a switch for the whole group, with its parts folded
// under it, so the page reads as six choices rather than eleven. Google's Web tab
// isn't a panel, and no group's switch turns it on, so it stands on its own, last.

/** One switch: a clean-up kind, or Google's Web tab, which is its own setting. */
type Item = CleanupKind | 'webTab';

interface Group {
  /** The group's name, over its parts; without one, a group is a single switch. */
  label?: MessageKey;
  items: Item[];
}

const GROUPS: Group[] = [
  { items: ['ai'] },
  { label: 'cleanupGroupMedia', items: ['videos', 'images', 'news'] },
  { label: 'cleanupGroupQuestions', items: ['questions', 'discussions', 'related'] },
  { label: 'cleanupGroupAds', items: ['ads', 'adRequests'] },
  { items: ['elsewhere'] },
  { items: ['webTab'] },
];

/** Groups whose parts are showing, kept while the page is open: it renders again after each change. */
const expanded = new Set<string>();

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
    // half-way while only some are on. An unnamed group is one switch.
    const children = name ? items : [];
    const rows = children.map((item) => {
      // Inside a group the parts' names say enough.
      const row = switchRow(t(label(item)), '', isOn(item), (on) => {
        save({ [item]: on });
        sync();
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
    if (!name) return h('div', { class: 'setting-group' }, lead);

    // The parts fold under the group's name, so the page reads as six choices.
    const key = name;
    const parts = h('div', { class: 'setting-parts', id: `parts-${key}`, hidden: !expanded.has(key) }, rows);
    const title = lead.querySelector('b')!;
    const disclose = h(
      'button',
      { class: 'disclose', type: 'button', attrs: { 'aria-expanded': String(!parts.hidden), 'aria-controls': parts.id } },
      title.textContent,
    );
    disclose.addEventListener('click', () => {
      parts.hidden = !parts.hidden;
      if (parts.hidden) expanded.delete(key);
      else expanded.add(key);
      disclose.setAttribute('aria-expanded', String(!parts.hidden));
    });
    title.replaceWith(disclose);
    // How many parts are on, said beside the name while they're folded away.
    const count = h('span', { class: 'parts-on' });
    const say = () => (count.textContent = t('cleanupPartsOn', String(inputs.filter((i) => i.checked).length), String(inputs.length)));
    say();
    for (const input of [...inputs, leadInput]) input.addEventListener('change', say);
    disclose.after(count);
    return h('div', { class: 'setting-group' }, lead, parts);
  };

  return h(
    'div',
    null,
    pageTitle(t('cleanupHeading'), t('cleanupIntro')),
    h('div', { class: 'panel' }, GROUPS.map(group)),
    h('p', { class: 'muted' }, helpLink('guide/troubleshooting#ai-answers-or-panels-still-show', t('cleanupStillShows'))),
  );
}
