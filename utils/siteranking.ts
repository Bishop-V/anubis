import { h } from './dom';
import { LEVEL_CHIPS } from './icons';
import { t, tJoin } from './i18n';
import { TAG_CHOICES, type Level, type Verdict } from './matcher';
import type { PersonalLevel, SiteEntry } from './personal';

// The pieces the result menu and the toolbar popup share when they rank a site.

/** What you chose for a site (`pressed`), against what the lists alone would do (`fromLists`). */
export function rankingOf(entry: SiteEntry | undefined, baseline: Verdict) {
  const personal = entry?.level;
  const pressed: Level | undefined = personal === 'allow' ? 'normal' : personal && personal !== 'normal' ? personal : undefined;
  const fromLists = baseline.level;
  return { personal, pressed, fromLists, shown: (pressed ?? fromLists) as Level };
}

/** What pressing a ranking stores. "Normal" has to beat the lists when they rank this site, so it becomes an explicit allow. */
export function nextLevel(level: Level, pressed: Level | undefined, fromLists: Level): PersonalLevel {
  if (level === 'normal') return fromLists === 'normal' ? 'normal' : 'allow';
  return pressed === level ? 'normal' : level;
}

/** The name sits in the ring and a select lies unseen over it when the ranking can cover more or less of the site. */
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
export function rankingHint(domain: string, baseline: Verdict, r: ReturnType<typeof rankingOf>): string {
  if (r.personal === 'allow') return t('popupHintAllow');
  if (r.pressed) return t('popupHintMine', domain);
  if (r.fromLists === 'normal') return t('popupHintNone');
  const names = [...new Set(baseline.reasons.filter((x) => x.listId !== TAG_CHOICES).map((x) => x.list))];
  if (baseline.reasons.some((x) => x.listId === TAG_CHOICES)) names.push(t('popupYourTagSettings'));
  return t('popupHintLists', LEVEL_CHIPS[r.fromLists], tJoin(names));
}
