import { h, icon, plural } from '@/utils/dom';
import { ICON_TRASH } from '@/utils/icons';
import { normalizeColor, slugifyTag, TAG_PALETTE, type TagDef } from '@/utils/listformat';
import type { CompiledList, TagAction } from '@/utils/matcher';
import { listSites, listTagDefs, removeTag, upsertTagDef } from '@/utils/personal';
import { loadRuleSet } from '@/utils/ruleset';
import { editPersonal, setTagPref } from '@/utils/storage';

const ACTIONS: { value: TagAction; label: string }[] = [
  { value: 'list', label: 'Follow the lists' },
  { value: 'label', label: 'Label only' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'raise', label: 'Raise' },
  { value: 'lower', label: 'Lower' },
  { value: 'hide', label: 'Hide' },
];

function ruleCount(list: CompiledList, tag: string): number {
  let n = 0;
  for (const rules of [...list.bySite.values(), ...list.byHost.values(), list.generic]) {
    for (const r of rules) if (r.tags.includes(tag)) n++;
  }
  return n;
}

export async function renderTags(): Promise<HTMLElement> {
  const rules = await loadRuleSet();
  const personalDefs = new Map(listTagDefs(rules.personalText).map((t) => [t.id, t]));
  const sites = listSites(rules.personalText);

  const cards = [...rules.tags.values()]
    .sort((a, b) => Number(personalDefs.has(b.id)) - Number(personalDefs.has(a.id)) || a.label.localeCompare(b.label))
    .map((tag) => {
      const mine = personalDefs.has(tag.id);
      const pref = rules.prefs[tag.id] ?? {};
      const sources = rules.lists
        .filter((l) => !l.personal && l.tags.some((t) => t.id === tag.id))
        .map((l) => `${l.name} (${plural(ruleCount(l, tag.id), 'site')})`);
      const personalCount = sites.filter((s) => s.tags.includes(tag.id)).length;

      const save = (patch: Partial<TagDef>) => {
        const next = { ...tag, ...patch };
        if (mine) void editPersonal((t) => upsertTagDef(t, next));
        else void setTagPref(tag.id, { color: next.color, label: next.label });
      };

      const color = h('input', { type: 'color', value: tag.color, title: 'Colour', attrs: { 'aria-label': `${tag.label} colour` } });
      color.addEventListener('change', () => save({ color: normalizeColor(color.value) ?? tag.color }));
      const label = h('input', { type: 'text', value: tag.label, maxLength: 40, attrs: { 'aria-label': 'Tag name' } });
      label.addEventListener('change', () => label.value.trim() && save({ label: label.value.trim() }));

      const action = h(
        'select',
        { attrs: { 'aria-label': `What to do with results tagged ${tag.label}` } },
        ACTIONS.map((a) => h('option', { value: a.value, selected: (pref.action ?? 'list') === a.value }, a.label)),
      );
      action.addEventListener('change', () => void setTagPref(tag.id, { action: action.value === 'list' ? undefined : (action.value as TagAction) }));

      const show = h('input', { type: 'checkbox', checked: !pref.muted, attrs: { 'aria-label': 'Show chip' } });
      show.addEventListener('change', () => void setTagPref(tag.id, { muted: show.checked ? undefined : true }));

      return h(
        'div',
        { class: 'tag-card', style: `--c: ${tag.color}` },
        h('header', null, color, label),
        h(
          'div',
          { class: 'preview' },
          h('span', { class: 'chip', style: `--c: ${tag.color}` }, h('i', { class: 'dot' }), tag.label),
          h('span', { class: 'muted', style: 'font-size:12px' }, h('code', null, tag.id)),
        ),
        tag.description ? h('div', { class: 'meta' }, tag.description) : null,
        h(
          'div',
          { class: 'meta' },
          [mine ? `Yours${personalCount ? ` · ${plural(personalCount, 'site')}` : ''}` : null, ...sources].filter(Boolean).join(' · ') ||
            'Not used yet',
        ),
        h('div', { class: 'row' }, h('span', null, 'When a result has it'), action),
        h('div', { class: 'row' }, h('span', null, 'Show the chip'), h('label', { class: 'switch' }, show, h('span'))),
        mine
          ? h(
              'div',
              { class: 'row' },
              h('span'),
              h(
                'button',
                {
                  class: 'btn small danger',
                  type: 'button',
                  on: {
                    click: () => {
                      if (confirm(`Delete the tag “${tag.label}” and remove it from ${plural(personalCount, 'site')}?`)) {
                        void editPersonal((t) => removeTag(t, tag.id));
                      }
                    },
                  },
                },
                icon(ICON_TRASH),
                'Delete',
              ),
            )
          : null,
      );
    });

  // Create a tag
  let pick = TAG_PALETTE[rules.tags.size % TAG_PALETTE.length] ?? '#d4a637';
  const name = h('input', { type: 'text', placeholder: 'Tag name, e.g. AI slop', maxLength: 40, attrs: { 'aria-label': 'New tag name' } });
  const color = h('input', { type: 'color', value: pick, attrs: { 'aria-label': 'New tag colour' } });
  color.addEventListener('input', () => (pick = color.value));
  const desc = h('input', { type: 'text', placeholder: 'What it means (optional)', maxLength: 120, attrs: { 'aria-label': 'Description' } });
  const error = h('div', { class: 'notice error', hidden: true });
  const form = h('form', { class: 'inline-form' }, color, name, desc, h('button', { class: 'btn primary', type: 'submit' }, 'Create tag'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = slugifyTag(name.value);
    if (!id) {
      error.textContent = 'Give the tag a name with at least one letter or number.';
      error.hidden = false;
      return;
    }
    if (rules.tags.has(id)) {
      error.textContent = `There is already a tag called “${rules.tags.get(id)!.label}”.`;
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const label = name.value.trim();
    const description = desc.value.trim() || undefined;
    name.value = '';
    desc.value = '';
    (document.activeElement as HTMLElement | null)?.blur();
    await editPersonal((t) => upsertTagDef(t, { id, label, color: normalizeColor(pick) ?? '#d4a637', description }));
  });

  return h(
    'div',
    null,
    h(
      'div',
      { class: 'page-title' },
      h(
        'div',
        null,
        h('h2', null, 'Tags'),
        h(
          'p',
          null,
          'Lists label results; you decide what a label means. Tags from different lists with the same id are merged, so communities can share a vocabulary.',
        ),
      ),
    ),
    h('div', { class: 'panel' }, h('h3', null, 'New tag'), h('p', { class: 'muted' }, 'Your tags live in your list, so they travel with it when you publish it.'), form, error),
    cards.length ? h('div', { class: 'tag-grid' }, cards) : h('div', { class: 'empty' }, 'No tags yet. Subscribe to a list or create one above.'),
  );
}
