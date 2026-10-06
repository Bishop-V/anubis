import { h } from './dom';
import { LEVEL_CHIPS } from './icons';
import { t, tJoin } from './i18n';
import { TAG_CHOICES, type Level, type Verdict } from './matcher';
import { displayLevel, PERSONAL_NAME, type PersonalLevel, type SiteEntry } from './personal';

// The pieces the result menu and the toolbar popup share when they rank a site.

export interface Ranking {
  /** What you stored for the site. */
  personal: PersonalLevel | undefined;
  /** The ranking button you pressed, if any: an allow presses Normal. */
  pressed: Level | undefined;
  /** What the lists alone would do. */
  fromLists: Level;
  /** What the site ends up as. */
  shown: Level;
}

export function rankingOf(entry: SiteEntry | undefined, baseline: Verdict): Ranking {
  const personal = entry?.level;
  const pressed = personal && personal !== 'normal' ? displayLevel(personal) : undefined;
  return { personal, pressed, fromLists: baseline.level, shown: pressed ?? baseline.level };
}

/** What pressing a ranking stores. "Normal" has to beat the lists when they rank this site, so it becomes an explicit allow. */
export function nextLevel(level: Level, r: Ranking): PersonalLevel {
  if (level === 'normal') return r.fromLists === 'normal' ? 'normal' : 'allow';
  return r.pressed === level ? 'normal' : level;
}

/** Marks the ranking the lists chose when you haven't pressed one. */
export function fromListsClass(level: Level, r: Ranking): string {
  return !r.pressed && level === r.fromLists && level !== 'normal' ? ' from-list' : '';
}

/**
 * The name sits in the ring, and when the ranking can cover more or less of the site a select lies unseen over it:
 * a select is as wide as its longest option, which put the name off centre.
 */
export function siteCartouche(domain: string, choices: string[], onPick: (domain: string) => void, focusKey?: string): HTMLElement {
  if (choices.length < 2) return h('span', { class: 'cartouche' }, h('span', { class: 'name' }, domain));
  const attrs: Record<string, string> = { 'aria-label': t('popupSite') };
  if (focusKey) attrs['data-focus-key'] = focusKey;
  const select = h(
    'select',
    { title: t('popupSiteChoice'), attrs },
    choices.map((d) => h('option', { value: d, selected: d === domain }, d)),
  );
  select.addEventListener('change', () => onPick(select.value));
  return h('span', { class: 'cartouche choosable' }, h('span', { class: 'name', attrs: { 'aria-hidden': 'true' } }, domain), select);
}

/** One sentence on where a site's ranking comes from. */
export function rankingHint(domain: string, baseline: Verdict, r: Ranking): string {
  if (r.personal === 'allow') return t('popupHintAllow');
  if (r.pressed) return t('popupHintMine', domain);
  if (r.fromLists === 'normal') return t('popupHintNone');
  const names = [...new Set(baseline.reasons.filter((x) => x.listId !== TAG_CHOICES).map((x) => x.list))];
  if (baseline.reasons.some((x) => x.listId === TAG_CHOICES)) names.push(t('popupYourTagSettings'));
  return t('popupHintLists', LEVEL_CHIPS[r.fromLists], tJoin(names));
}

/** Your tags first, then those lists gave the site, then the rest, each by label. */
export function tagOrder(tags: Map<string, { label: string }>, entry: SiteEntry | undefined, verdict: Verdict) {
  const mine = new Set(entry?.tags ?? []);
  const fromList = new Set(verdict.tags.filter((id) => (verdict.tagSources[id] ?? []).some((s) => s !== PERSONAL_NAME)));
  const rank = (id: string) => (mine.has(id) ? 0 : fromList.has(id) ? 1 : 2);
  const ids = [...tags.keys()].sort((a, b) => rank(a) - rank(b) || tags.get(a)!.label.localeCompare(tags.get(b)!.label));
  return { mine, fromList, ids };
}
