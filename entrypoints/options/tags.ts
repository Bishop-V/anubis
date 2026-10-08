import { normalizeDomain } from '@/utils/domain';
import { h, icon } from '@/utils/dom';
import { t, tJoin, tn, tParts } from '@/utils/i18n';
import { ICON_CLOSE, ICON_TRASH, LEVEL_LABELS } from '@/utils/icons';
import { colorForTag, normalizeColor, slugifyTag, TAG_PALETTE, type TagDef } from '@/utils/listformat';
import { allSites, listTagCards, type CompiledList, type TagAction } from '@/utils/matcher';
import { listSites, removeTag, tagSite, upsertTagDef, type SiteEntry } from '@/utils/personal';
import { loadRuleSet } from '@/utils/ruleset';
import { editPersonal, setTagPref } from '@/utils/storage';
import { flash, flashed } from './flash';
import { helpLink, pageTitle } from './parts';

const ACTIONS: { value: TagAction; label: string }[] = [
  { value: 'list', label: t('tagActionList') },
  { value: 'label', label: t('tagActionLabel') },
  { value: 'highlight', label: t('tagActionHighlight') },
  { value: 'raise', label: LEVEL_LABELS.raise },
  { value: 'lower', label: LEVEL_LABELS.lower },
  { value: 'hide', label: LEVEL_LABELS.hide },
];

function ruleCount(list: CompiledList, tag: string): number {
  let n = 0;
  for (const rules of [...allSites(list).values(), ...list.byHost.values(), list.generic]) {
    for (const r of rules) if (r.tags.includes(tag)) n++;
  }
  return n;
}

/** The sites a list gives this tag. */
function listSitesWith(list: CompiledList, tag: string): string[] {
  const out: string[] = [];
  for (const map of [allSites(list), list.byHost]) {
    for (const [site, rules] of map) if (rules.some((r) => r.tags.includes(tag))) out.push(site);
  }
  return out.sort();
}

/** What a list's own rules with this tag do to rankings, by count. */
function listEffects(list: CompiledList, tag: string): { raise: number; lower: number; hide: number } {
  const out = { raise: 0, lower: 0, hide: 0 };
  for (const rules of [...allSites(list).values(), ...list.byHost.values(), list.generic]) {
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
  const from = lists.filter((l) => !l.personal && l.tags.some((d) => d.id === tag.id));
  const who = [
    personalCount ? tn('tagMarksYours', personalCount) : null,
    // A list that only defines the tag names it, under the sentence, and marks nothing.
    ...from.filter((l) => ruleCount(l, tag.id) > 0).map((l) => tn('tagMarksFromList', ruleCount(l, tag.id), l.name)),
  ].filter((w): w is string => !!w);
  if (!who.length) return t('tagMarksNone');
  const carriers = t('tagMarks', tJoin(who));
  switch (action) {
    case 'label':
      return t('tagEffectLabel', carriers);
    case 'highlight':
      return t('tagEffectHighlight', carriers);
    case 'raise':
      return t('tagEffectRaise', carriers);
    case 'lower':
      return t('tagEffectLower', carriers);
    case 'hide':
      return t('tagEffectHide', carriers);
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
    total.raise ? tn(one ? 'tagListRaises' : 'tagListsRaise', total.raise) : null,
    total.lower ? tn(one ? 'tagListLowers' : 'tagListsLower', total.lower) : null,
    total.hide ? tn(one ? 'tagListHides' : 'tagListsHide', total.hide) : null,
  ].filter((m): m is string => !!m);
  if (!moves.length) return t('tagEffectLabel', carriers);
  return one ? t('tagEffectOneList', carriers, from[0]!.name, tJoin(moves)) : t('tagEffectLists', carriers, tJoin(moves));
}

/** How many of a list's sites an open tag names before "and N more". */
const LIST_PREVIEW = 8;

/** Tags whose sites are open, kept so they stay open when the page renders again after a change. */
const open = new Set<string>();
/**
 * The tag whose Add field was in use and the personal list it saved, to put the
 * cursor back once the page shows that list. A render of an older list (one that
 * was waiting for the field to lose focus) must not take it, or the field would
 * hold focus and keep the saved list from showing.
 */
let refocus: { tag: string; text: string } | undefined;

/**
 * Under a tag: its description (for your own tags), your sites with it, each of
 * which can be untagged, a field to tag more, and the sites lists give it.
 */
function sitesPanel(
  tag: TagDef,
  mine: boolean,
  personalText: string,
  sites: SiteEntry[],
  lists: CompiledList[],
  save: (patch: Partial<TagDef>) => void,
): HTMLElement {
  const tagged = sites.filter((s) => s.tags.includes(tag.id));

  const input = h('input', {
    type: 'text',
    placeholder: 'fandom.com',
    autocomplete: 'off',
    spellcheck: false,
    attrs: { 'aria-label': t('tagSitesToTag', tag.label) },
  });
  const reasonInput = h('input', { type: 'text', maxLength: 120 });
  const reasonField = h('label', { class: 'field' }, h('span', null, t('tagSiteReason', tag.label)), reasonInput);
  const error = h('p', { class: 'notice error', hidden: true });
  const form = h('form', { class: 'inline-form' }, input, reasonField, h('button', { class: 'btn small', type: 'submit' }, t('tagAddSite')));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Several at once, separated by spaces or commas.
    const words = input.value.split(/[\s,]+/).filter(Boolean);
    const domains = words.map(normalizeDomain);
    const bad = words.filter((_, i) => !domains[i]);
    if (!words.length || bad.length) {
      error.textContent = bad.length ? t('tagNotSite', bad[0]!) : t('tagTypeSite');
      error.hidden = false;
      input.focus();
      return;
    }
    error.hidden = true;
    input.value = '';
    const reason = reasonInput.value.trim();
    reasonInput.value = '';
    input.blur();
    const note = reason ? t('tagSiteNote', tag.label, reason) : undefined;
    const saved = await editPersonal((text) => domains.reduce((acc, d) => tagSite(acc, d!, tag.id, listTagCards(lists), true, note), text));
    refocus = { tag: tag.id, text: saved };
  });
  if (refocus?.tag === tag.id && refocus.text === personalText) {
    refocus = undefined;
    // After the page has replaced the old one.
    setTimeout(() => input.focus(), 0);
  }

  const fromLists = lists
    .filter((l) => !l.personal && l.tags.some((d) => d.id === tag.id))
    .map((l) => {
      const all = listSitesWith(l, tag.id);
      const sites = all.length > LIST_PREVIEW ? [...all.slice(0, LIST_PREVIEW), tn('tagMoreSites', all.length - LIST_PREVIEW)] : all;
      return all.length ? h('p', { class: 'from-list' }, tParts('tagFromList', h('b', null, l.name), tJoin(sites))) : null;
    });

  const name = h('input', { type: 'text', value: tag.label, maxLength: 40, attrs: { 'aria-label': t('tagName') } });
  name.addEventListener('change', () => name.value.trim() && save({ label: name.value.trim() }));
  let description: HTMLElement | null = null;
  if (mine) {
    const desc = h('input', {
      type: 'text',
      value: tag.description ?? '',
      placeholder: t('tagDescriptionPlaceholder'),
      maxLength: 120,
      attrs: { 'aria-label': t('tagMeaning', tag.label) },
    });
    desc.addEventListener('change', () => save({ description: desc.value.trim() || undefined }));
    description = h('label', { class: 'field' }, h('span', null, t('tagDescription')), desc);
  }

  return h(
    'div',
    { class: 'tag-sites', hidden: !open.has(tag.id) },
    h('div', { class: 'tag-fields' }, h('label', { class: 'field' }, h('span', null, t('tagNameShort')), name), description),
    h('h4', null, t('tagYourSites')),
    tagged.length
      ? h(
          'ul',
          null,
          tagged.map((entry) =>
            h(
              'li',
              { class: entry.description ? 'has-description' : '' },
              h('div', { class: 'tagged-site' }, h('span', null, entry.site), entry.description ? h('span', { class: 'site-note' }, entry.description) : null),
              h(
                'button',
                {
                  class: 'icon-btn danger',
                  type: 'button',
                  title: t('popupUntag', entry.site),
                  attrs: { 'aria-label': t('popupUntag', entry.site) },
                  on: { click: () => void editPersonal((text) => tagSite(text, entry.site, tag.id, listTagCards(lists), false)) },
                },
                icon(ICON_CLOSE),
              ),
            ),
          ),
        )
      : h('p', { class: 'muted' }, t('tagNoSites')),
    form,
    error,
    ...(fromLists.some(Boolean) ? [h('h4', null, t('tagFromYourLists')), ...fromLists] : []),
  );
}

export async function renderTags(): Promise<HTMLElement> {
  const rules = await loadRuleSet();
  const sites = listSites(rules.personalText);

  const cards = [...rules.tags.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((tag) => {
      // The lists that give sites the tag. A tag is yours when none does: one you made, or
      // one a list dropped that your sites still use. Your list keeps a copy of a list's
      // tag you use, for then.
      const sources = rules.lists.filter((l) => !l.personal && l.tags.some((d) => d.id === tag.id)).map((l) => l.name);
      const yours = !sources.length;
      const pref = rules.prefs[tag.id] ?? {};
      const personalCount = sites.filter((s) => s.tags.includes(tag.id)).length;

      // Your tag's name and colour live in your list; a list's tag keeps the list's, with yours over them.
      const save = (patch: Partial<TagDef>) => {
        const next = { ...tag, ...patch };
        if (yours) void editPersonal((text) => upsertTagDef(text, next));
        else void setTagPref(tag.id, { color: next.color, label: next.label });
      };

      const color = h('input', { type: 'color', value: tag.color, title: t('tagColour'), attrs: { 'aria-label': t('tagColourOf', tag.label) } });
      color.addEventListener('change', () => save({ color: normalizeColor(color.value) ?? tag.color }));

      const action = h(
        'select',
        { attrs: { 'aria-label': t('tagActionFor', tag.label) } },
        ACTIONS.map((a) => h('option', { value: a.value, selected: (pref.action ?? 'list') === a.value }, a.label)),
      );
      action.addEventListener('change', () => void setTagPref(tag.id, { action: action.value === 'list' ? undefined : (action.value as TagAction) }));

      const show = h('input', { type: 'checkbox', checked: !pref.muted, attrs: { 'aria-label': t('tagShowUnder', tag.label) } });
      show.addEventListener('change', () => void setTagPref(tag.id, { muted: show.checked ? undefined : true }));

      const panel = sitesPanel(tag, yours, rules.personalText, sites, rules.lists, save);
      const toggleLabel = () => (open.has(tag.id) ? t('tagDone') : t('tagEdit'));
      const toggle = h(
        'button',
        { class: 'text-btn', type: 'button', attrs: { 'aria-expanded': String(open.has(tag.id)), 'aria-label': t('tagEditLabel', tag.label) } },
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
          h('label', { class: 'switch show', title: t('tagShowTitle') }, show, h('span')),
          toggle,
        ),
        yours
          ? h(
              'button',
              {
                class: 'icon-btn danger',
                type: 'button',
                title: t('tagDelete', tag.label),
                attrs: { 'aria-label': t('tagDelete', tag.label) },
                on: {
                  click: async () => {
                    let before = '';
                    const after = await editPersonal((text) => {
                      before = text;
                      return removeTag(text, tag.id);
                    });
                    // Undo puts the list back as it was, unless it has changed since.
                    flash('tags', 'ok', tn('tagDeleted', personalCount, tag.label), () => editPersonal((now) => (now === after ? before : now)).then(() => undefined));
                  },
                },
              },
              icon(ICON_TRASH),
            )
          : h('span'),
        h(
          'div',
          { class: 'meta' },
          h('p', { class: 'effect' }, effectSentence(tag, pref.action ?? 'list', rules.lists, personalCount)),
          tag.description ? h('p', null, tag.description) : null,
          sources.length ? h('p', { class: 'source' }, t('tagSourceLists', tJoin(sources))) : null,
        ),
        panel,
      );
      return { row, yours };
    });

  const yours = cards.filter((c) => c.yours).map((c) => c.row);
  const elsewhere = cards.filter((c) => !c.yours).map((c) => c.row);

  // Create a tag
  let pick = TAG_PALETTE[rules.tags.size % TAG_PALETTE.length]!;
  const name = h('input', { type: 'text', placeholder: t('tagNewPlaceholder'), maxLength: 40, attrs: { 'aria-label': t('menuNewTagLabel') } });
  const color = h('input', { type: 'color', value: pick, attrs: { 'aria-label': t('tagNewColour') } });
  color.addEventListener('input', () => (pick = color.value));
  const desc = h('input', { type: 'text', placeholder: t('tagDescriptionPlaceholder'), maxLength: 120, attrs: { 'aria-label': t('tagDescription') } });
  const error = h('div', { class: 'notice error', hidden: true });
  const form = h('form', { class: 'inline-form' }, color, name, desc, h('button', { class: 'btn primary', type: 'submit' }, t('tagCreate')));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = slugifyTag(name.value);
    if (!id) {
      error.textContent = t('tagNameInvalid');
      error.hidden = false;
      return;
    }
    if (rules.tags.has(id)) {
      error.textContent = t('tagExists', rules.tags.get(id)!.label);
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const label = name.value.trim();
    const description = desc.value.trim() || undefined;
    name.value = '';
    desc.value = '';
    (document.activeElement as HTMLElement | null)?.blur();
    await editPersonal((text) => upsertTagDef(text, { id, label, color: normalizeColor(pick) ?? colorForTag(id), description }));
  });

  return h(
    'div',
    null,
    pageTitle(
      t('tagsHeading'),
      t('tagsIntro'),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('tagNewHeading')),
      h('p', { class: 'muted' }, t('tagNewHint'), ' ', helpLink('guide/tags#tag-sites-yourself', t('tagNewHelp'))),
      form,
      error,
    ),
    h(
      'div',
      { class: 'panel' },
      h('h3', null, t('tagYoursHeading')),
      flashed('tags'),
      yours.length ? h('div', { class: 'tag-rows' }, yours) : h('p', { class: 'empty' }, t('tagNoneYours')),
    ),
    elsewhere.length
      ? h(
          'div',
          { class: 'panel' },
          h('h3', null, t('tagListsHeading')),
          h('p', { class: 'muted' }, t('tagListsHint')),
          h('div', { class: 'tag-rows' }, elsewhere),
        )
      : null,
  );
}
