import { h, icon } from '@/utils/dom';
import { t } from '@/utils/i18n';
import { LEVEL_LABELS, rankIcon, tagEffectText, tagMark } from '@/utils/icons';
import type { Level } from '@/utils/matcher';
import { getSite } from '@/utils/personal';
import { fromListsClass, tagOrder, tagPicker, tagSource, type Ranking } from '@/utils/siteranking';
import type { PopoverActions, PopoverData } from './ui';

// Parts of the result menu (buildPopover in ui.ts): a ranking's button, and the tags.

/** One ranking's button. Raise and Lower show two arrows, lit one per press, so the unlit one says there's another step. */
export function levelButton(level: Level, r: Ranking, press: () => void): HTMLElement {
  const pressed = r.pressed === level;
  const drawing = rankIcon(level, pressed ? r.steps : 0);
  return h(
    'button',
    {
      class: `level ${level}${fromListsClass(level, r)}`,
      type: 'button',
      attrs: { 'aria-pressed': String(pressed), 'data-focus-key': `level-${level}` },
      on: { click: press },
    },
    h('span', { class: 'level-icon' }, icon(drawing)),
    LEVEL_LABELS[level],
  );
}

/** The site's tags on one line, and + Tag, which shows every tag to choose from. */
export function menuTags(data: PopoverData, actions: PopoverActions, domain: string, all: { shown: boolean; toggle: () => void }): HTMLElement {
  const entry = getSite(data.personalText, domain);
  const { mine, fromList, ids } = tagOrder(data.tags, entry, data.verdict);
  // Tags you set toggle; tags from lists are shown but fixed.
  const tagItem = (id: string) => {
    const tag = data.tags.get(id)!;
    const on = mine.has(id);
    if (!on && fromList.has(id)) {
      return h(
        'span',
        { class: 'fixed', style: `--c: ${tag.color}` },
        tagMark(data.verdict.tagEffects[id]),
        tag.label,
        tagEffectText(data.verdict.tagEffects[id]),
        tagSource(data.verdict, id),
      );
    }
    return h(
      'button',
      {
        type: 'button',
        style: `--c: ${tag.color}`,
        title: tag.description ?? (on ? t('popupUntag', domain) : t('popupTagSite', domain, tag.label)),
        attrs: { 'aria-pressed': String(on), 'data-focus-key': `tag-${id}` },
        on: { click: () => actions.toggleTag(domain, id) },
      },
      tagMark(on ? data.verdict.tagEffects[id] : undefined, !on),
      tag.label,
      on ? tagEffectText(data.verdict.tagEffects[id]) : null,
    );
  };
  const more = h(
    'button',
    {
      class: 'text-btn more-tags',
      type: 'button',
      attrs: { 'aria-expanded': String(all.shown), 'data-focus-key': 'more-tags' },
      on: { click: all.toggle },
    },
    all.shown ? t('menuTagsDone') : t('menuTagsMore'),
  );
  if (!all.shown) {
    const onSite = ids.filter((id) => mine.has(id) || fromList.has(id));
    return h('div', { class: 'menu-tags' }, h('div', { class: 'tags' }, onSite.map(tagItem), more));
  }
  return h('div', { class: 'menu-tags open' }, tagPicker(ids, data.listTags, tagItem), newTag(actions, domain), more);
}

/** The field that names a new tag and puts it on the site. */
function newTag(actions: PopoverActions, domain: string): HTMLElement {
  const input = h('input', {
    type: 'text',
    placeholder: t('menuNewTagPlaceholder'),
    maxLength: 32,
    attrs: { 'aria-label': t('menuNewTagLabel'), 'data-focus-key': 'new-tag' },
  });
  const create = () => {
    const label = input.value.trim();
    if (label) actions.createTag(domain, label);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      create();
    }
  });
  return h('div', { class: 'new-tag' }, input, h('button', { class: 'text-btn', type: 'button', on: { click: create } }, t('menuAddTagButton')));
}
