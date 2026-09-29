import { normalizeDomain } from '@/utils/domain';
import { andList, h, icon, plural } from '@/utils/dom';
import { ICON_CLOSE, ICON_TRASH, LEVEL_LABELS } from '@/utils/icons';
import { colorForTag, normalizeColor, slugifyTag, TAG_PALETTE, type TagDef } from '@/utils/listformat';
import type { CompiledList, TagAction } from '@/utils/matcher';
import { listSites, listTagDefs, removeTag, toggleSiteTag, upsertTagDef, type SiteEntry } from '@/utils/personal';
import { loadRuleSet } from '@/utils/ruleset';
import { editPersonal, setTagPref } from '@/utils/storage';
import { pageTitle } from './parts';

const ACTIONS: { value: TagAction; label: string }[] = [
  { value: 'list', label: 'Follow the lists' },
  { value: 'label', label: 'Label only' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'raise', label: LEVEL_LABELS.raise },
  { value: 'lower', label: LEVEL_LABELS.lower },
  { value: 'hide', label: LEVEL_LABELS.hide },
];

function ruleCount(list: CompiledList, tag: string): number {
  let n = 0;
  for (const rules of [...list.bySite.values(), ...list.byHost.values(), list.generic]) {
    for (const r of rules) if (r.tags.includes(tag)) n++;
  }
  return n;
}

/** The sites a list gives this tag. */
function listSitesWith(list: CompiledList, tag: string): string[] {
  const out: string[] = [];
  for (const map of [list.bySite, list.byHost]) {
    for (const [site, rules] of map) if (rules.some((r) => r.tags.includes(tag))) out.push(site);
  }
  return out.sort();
}

/** What a list's own rules with this tag do to rankings, by count. */
function listEffects(list: CompiledList, tag: string): { raise: number; lower: number; hide: number } {
  const out = { raise: 0, lower: 0, hide: 0 };
  for (const rules of [...list.bySite.values(), ...list.byHost.values(), list.generic]) {
    for (const r of rules) {
      if (!r.tags.includes(tag)) continue;
      if (r.discard) out.hide++;
      else if (r.pin || r.boost > 0) out.raise++;
      else if (r.boost < 0) out.lower++;
    }
  }
  return out;
}

/**
 * What the tag does, in one direct sentence: which sites carry it and what happens
 * to them. "Labels 23 sites from Paywalls. Their ranking stays the same."
 */
function effectSentence(tag: TagDef, action: TagAction, lists: CompiledList[], personalCount: number): string {
  const from = lists.filter((l) => !l.personal && l.tags.some((t) => t.id === tag.id));
  const who = [
    personalCount ? `${plural(personalCount, 'site')} of yours` : null,
    ...from.map((l) => `${plural(ruleCount(l, tag.id), 'site')} from ${l.name}`),
  ].filter((w): w is string => !!w);
  if (!who.length) return 'No sites carry it yet.';
  const carriers = `Marks ${andList(who)}.`;
  switch (action) {
    case 'label':
      return `${carriers} Only a label: their ranking stays the same.`;
    case 'highlight':
      return `${carriers} Highlights them in the tag’s colour.`;
    case 'raise':
      return `${carriers} Raises them in your searches.`;
    case 'lower':
      return `${carriers} Lowers them in your searches.`;
    case 'hide':
      return `${carriers} Hides them from your searches.`;
  }
  // "Follow the lists": what the lists' own rules say.
  const total = { raise: 0, lower: 0, hide: 0 };
  for (const l of from) {
    const e = listEffects(l, tag.id);
    total.raise += e.raise;
    total.lower += e.lower;
    total.hide += e.hide;
  }
  // One list is named and takes the singular: "Official docs raises 51 of them."
  const one = from.length === 1;
  const moves = [
    total.raise ? `${one ? 'raises' : 'raise'} ${total.raise}` : null,
    total.lower ? `${one ? 'lowers' : 'lower'} ${total.lower}` : null,
    total.hide ? `${one ? 'hides' : 'hide'} ${total.hide}` : null,
  ].filter((m): m is string => !!m);
  if (!moves.length) return `${carriers} Only a label: their ranking stays the same.`;
  return `${carriers} ${one ? from[0]!.name : 'The lists'} ${andList(moves)} of them.`;
}

/** How many of a list's sites an open tag names before "and N more". */
const LIST_PREVIEW = 8;

/** Tags whose sites are open, kept so they stay open when the page renders again after a change. */
const open = new Set<string>();
/** The tag whose Add field was in use, to put the cursor back after the page renders again. */
let refocus: string | undefined;

/**
 * Under a tag: its description (for your own tags), your sites with it, each of
 * which can be untagged, a field to tag more, and the sites lists give it.
 */
function sitesPanel(tag: TagDef, mine: boolean, sites: SiteEntry[], lists: CompiledList[], save: (patch: Partial<TagDef>) => void): HTMLElement {
  const tagged = sites.filter((s) => s.tags.includes(tag.id)).map((s) => s.site);

  const input = h('input', {
    type: 'text',
    placeholder: 'fandom.com',
    autocomplete: 'off',
    spellcheck: false,
    attrs: { 'aria-label': `Sites to tag ${tag.label}` },
  });
  const error = h('p', { class: 'notice error', hidden: true });
  const form = h('form', { class: 'inline-form' }, input, h('button', { class: 'btn small', type: 'submit' }, 'Add site'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Several at once, separated by spaces or commas.
    const words = input.value.split(/[\s,]+/).filter(Boolean);
    const domains = words.map(normalizeDomain);
    const bad = words.filter((_, i) => !domains[i]);
    if (!words.length || bad.length) {
      error.textContent = bad.length ? `“${bad[0]}” doesn’t look like a site.` : 'Type a site, like fandom.com.';
      error.hidden = false;
      input.focus();
      return;
    }
    error.hidden = true;
    input.value = '';
    refocus = tag.id;
    input.blur();
    await editPersonal((text) => domains.reduce((t, d) => toggleSiteTag(t, d!, tag.id, true), text));
  });
  if (refocus === tag.id) {
    refocus = undefined;
    // After the page has replaced the old one.
    setTimeout(() => input.focus(), 0);
  }

  const fromLists = lists
    .filter((l) => !l.personal && l.tags.some((t) => t.id === tag.id))
    .map((l) => {
      const all = listSitesWith(l, tag.id);
      const shown = all.slice(0, LIST_PREVIEW).join(', ');
      const more = all.length > LIST_PREVIEW ? ` and ${all.length - LIST_PREVIEW} more` : '';
      return all.length ? h('p', { class: 'from-list' }, h('b', null, l.name), `: ${shown}${more}.`) : null;
    });

  const name = h('input', { type: 'text', value: tag.label, maxLength: 40, attrs: { 'aria-label': 'Tag name' } });
  name.addEventListener('change', () => name.value.trim() && save({ label: name.value.trim() }));
  let description: HTMLElement | null = null;
  if (mine) {
    const desc = h('input', {
      type: 'text',
      value: tag.description ?? '',
      placeholder: 'What it means, optional',
      maxLength: 120,
      attrs: { 'aria-label': `What ${tag.label} means` },
    });
    desc.addEventListener('change', () => save({ description: desc.value.trim() || undefined }));
    description = h('label', { class: 'field' }, h('span', null, 'Description'), desc);
  }

  return h(
    'div',
    { class: 'tag-sites', hidden: !open.has(tag.id) },
    h('div', { class: 'tag-fields' }, h('label', { class: 'field' }, h('span', null, 'Name'), name), description),
    h('h4', null, 'Your sites with this tag'),
    tagged.length
      ? h(
          'ul',
          null,
          tagged.map((site) =>
            h(
              'li',
              null,
              h('span', null, site),
              h(
                'button',
                {
                  class: 'icon-btn danger',
                  type: 'button',
                  title: `Untag ${site}`,
                  attrs: { 'aria-label': `Untag ${site}` },
                  on: { click: () => void editPersonal((text) => toggleSiteTag(text, site, tag.id, false)) },
                },
                icon(ICON_CLOSE),
              ),
            ),
          ),
        )
      : h('p', { class: 'muted' }, 'None yet. Add one here, or use the ⇅ button on a search result.'),
    form,
    error,
    ...(fromLists.some(Boolean) ? [h('h4', null, 'From your lists'), ...fromLists] : []),
  );
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
      const personalCount = sites.filter((s) => s.tags.includes(tag.id)).length;

      const save = (patch: Partial<TagDef>) => {
        const next = { ...tag, ...patch };
        if (mine) void editPersonal((t) => upsertTagDef(t, next));
        else void setTagPref(tag.id, { color: next.color, label: next.label });
      };

      const color = h('input', { type: 'color', value: tag.color, title: 'Colour', attrs: { 'aria-label': `${tag.label} colour` } });
      color.addEventListener('change', () => save({ color: normalizeColor(color.value) ?? tag.color }));

      const action = h(
        'select',
        { attrs: { 'aria-label': `What to do with results tagged ${tag.label}` } },
        ACTIONS.map((a) => h('option', { value: a.value, selected: (pref.action ?? 'list') === a.value }, a.label)),
      );
      action.addEventListener('change', () => void setTagPref(tag.id, { action: action.value === 'list' ? undefined : (action.value as TagAction) }));

      const show = h('input', { type: 'checkbox', checked: !pref.muted, attrs: { 'aria-label': `Show ${tag.label} under results` } });
      show.addEventListener('change', () => void setTagPref(tag.id, { muted: show.checked ? undefined : true }));

      const panel = sitesPanel(tag, mine, sites, rules.lists, save);
      const toggleLabel = () => (open.has(tag.id) ? 'Done' : 'Edit');
      const toggle = h(
        'button',
        { class: 'text-btn', type: 'button', attrs: { 'aria-expanded': String(open.has(tag.id)), 'aria-label': `Edit ${tag.label} and its sites` } },
        toggleLabel(),
      );
      toggle.addEventListener('click', () => {
        if (open.has(tag.id)) open.delete(tag.id);
        else open.add(tag.id);
        panel.hidden = !open.has(tag.id);
        row.classList.toggle('open', !panel.hidden);
        toggle.setAttribute('aria-expanded', String(open.has(tag.id)));
        toggle.textContent = toggleLabel();
        if (!panel.hidden) panel.querySelector<HTMLInputElement>('form input')?.focus();
      });

      const row = h(
        'div',
        { class: `tag-row${open.has(tag.id) ? ' open' : ''}`, style: `--c: ${tag.color}` },
        color,
        h('b', { class: 'name' }, tag.label),
        h(
          'div',
          { class: 'controls' },
          action,
          h('label', { class: 'show', title: 'Show this tag under results' }, h('span', { class: 'switch' }, show, h('span')), 'Shown'),
        ),
        mine
          ? h(
              'button',
              {
                class: 'icon-btn danger',
                type: 'button',
                title: `Delete “${tag.label}”`,
                attrs: { 'aria-label': `Delete ${tag.label}` },
                on: {
                  click: () => {
                    if (confirm(`Delete the tag “${tag.label}” and remove it from ${plural(personalCount, 'site')}?`)) {
                      void editPersonal((t) => removeTag(t, tag.id));
                    }
                  },
                },
              },
              icon(ICON_TRASH),
            )
          : h('span'),
        h(
          'div',
          { class: 'meta' },
          h('p', { class: 'effect' }, effectSentence(tag, pref.action ?? 'list', rules.lists, personalCount), ' ', toggle),
          tag.description ? h('p', null, tag.description) : null,
        ),
        panel,
      );
      return row;
    });

  // Create a tag
  let pick = TAG_PALETTE[rules.tags.size % TAG_PALETTE.length]!;
  const name = h('input', { type: 'text', placeholder: 'Name, like “AI slop”', maxLength: 40, attrs: { 'aria-label': 'New tag name' } });
  const color = h('input', { type: 'color', value: pick, attrs: { 'aria-label': 'New tag colour' } });
  color.addEventListener('input', () => (pick = color.value));
  const desc = h('input', { type: 'text', placeholder: 'What it means, optional', maxLength: 120, attrs: { 'aria-label': 'Description' } });
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
    await editPersonal((t) => upsertTagDef(t, { id, label, color: normalizeColor(pick) ?? colorForTag(id), description }));
  });

  return h(
    'div',
    null,
    pageTitle(
      'Tags',
      'Lists label results. You decide what each label does: follow the list, only show it, highlight it, or raise, lower, or hide what carries it. Lists that use the same tag name share it.',
    ),
    h('div', { class: 'panel' }, h('h3', null, 'New tag'), h('p', { class: 'muted' }, 'Your tags are saved in your list, so they go with it when you publish it.'), form, error),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, 'All tags'),
      cards.length ? h('div', { class: 'tag-rows' }, cards) : h('p', { class: 'empty' }, 'No tags yet. Subscribe to a list or create one above.'),
    ),
  );
}
