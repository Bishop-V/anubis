import { balanceSvg, setBalance } from '@/utils/balance';
import { h, icon } from '@/utils/dom';
import { t, tParts, type MessageKey } from '@/utils/i18n';
import { ICON_CLOSE, LEVEL_CHIPS, LEVEL_LABELS, levelIcon, rankIcon, WEIGH_ICONS } from '@/utils/icons';
import { LEVELS, type Level } from '@/utils/matcher';
import { displayLevel, levelSteps, type PersonalLevel } from '@/utils/personal';
import { nextLevel, type Ranking } from '@/utils/siteranking';
import { changeSentence, summarySentence } from '@/utils/summary';
import { RESULTS, STARTER_TAGS, slide, tagChip, type DemoResult } from './parts';

// The welcome page's first impression: an example search page to rank sites on, with
// the same parts a real one has. The balance button beside each result opens the
// result menu (its name, the balance, the five rankings, and whose choice it is),
// pressing a ranking moves the result as a search page would, and the summary above
// says what changed, with Undo and Show hidden. Nothing is saved.
//
// It copies the extension's own pieces where it can: the rankings and their icons,
// what pressing one again does (nextLevel), the summary's sentences, and the balance.
// The menu opens under its result rather than floating over it, so it never covers
// the page at phone width. Tags show from the starter lists, as a hint.

/** Raise and Lower move a site five places a press, as on a search page; it passes the result it lands on. */
const SHIFT: Partial<Record<PersonalLevel, number>> = { raise: -5.5, raise2: -10.5, lower: 5.5, lower2: 10.5 };
/** How far each one tips the balance: the places it moves the site. */
const SCORE: Partial<Record<PersonalLevel, number>> = { raise: 5, raise2: 10, lower: -5, lower2: -10 };
const RANK_TITLES: Record<Level, MessageKey> = {
  hide: 'popupRankHide',
  lower: 'popupRankLower',
  normal: 'popupRankNormal',
  raise: 'popupRankRaise',
  pin: 'popupRankPin',
};

export function renderDemo(how: HTMLElement, page: HTMLElement, reset: HTMLElement): void {
  how.replaceChildren(
    ...t('welcomeDemoHow', '')
      .split('')
      .flatMap((part, i) => (i ? [h('span', { class: 'inline-weigh' }, icon(WEIGH_ICONS.normal)), part] : [part])),
  );

  const levels = new Map<string, PersonalLevel>(RESULTS.map((r) => [r.host, 'normal']));
  let revealed = false;
  let open: DemoResult | undefined;
  let last: { host: string; before: PersonalLevel; after: PersonalLevel } | undefined;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const summary = h('p', { class: 'summary' });
  const said = h('p', { class: 'said', attrs: { role: 'status' } });
  const list = h('ol', { class: 'results', attrs: { 'aria-label': t('welcomeDemoLabel', t('welcomeQuery')) } });
  page.replaceChildren(h('div', { class: 'query', attrs: { 'aria-hidden': 'true' } }, t('welcomeQuery')), h('div', { class: 'summary-box' }, summary, said), list);

  // One menu, moved under whichever result it's open for, so its balance swings from where it was.
  const balance = balanceSvg();
  const name = h('span', { class: 'name' });
  const hint = h('p', { class: 'hint' });
  const rankButtons = new Map<Level, HTMLButtonElement>();
  const group = h(
    'div',
    { class: 'seg levels', attrs: { role: 'group' } },
    LEVELS.flatMap((level) => {
      const button = h('button', { type: 'button', class: level, on: { click: () => press(level) } });
      rankButtons.set(level, button);
      // Hide and Pin stand apart from Lower, Normal, and Raise.
      return [level === 'lower' || level === 'pin' ? h('span', { class: 'sep', attrs: { 'aria-hidden': 'true' } }) : null, button];
    }),
  );
  const close = h(
    'button',
    { type: 'button', class: 'icon-btn', title: t('menuCloseLabel'), attrs: { 'aria-label': t('menuCloseLabel') }, on: { click: () => closeMenu(true) } },
    icon(ICON_CLOSE),
  );
  const menu = h('div', { class: 'menu', id: 'demo-menu', attrs: { role: 'group' } }, h('div', { class: 'menu-head' }, name, close), balance, group, hint);
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu(true);
  });

  const rows = new Map(
    RESULTS.map((result) => {
      const weigh = h('button', {
        type: 'button',
        class: 'weigh',
        attrs: { 'aria-expanded': 'false', 'aria-controls': 'demo-menu' },
        on: { click: () => (open === result ? closeMenu(false) : openMenu(result)) },
      });
      const chips = h('span', { class: 'chips' });
      const row = h(
        'li',
        null,
        weigh,
        h('div', { class: 'result' }, h('span', { class: 'host' }, result.host), h('span', { class: 'title' }, result.title), chips),
      );
      return [result.host, { row, weigh, chips }];
    }),
  );

  const rankingOf = (host: string): Ranking => {
    const personal = levels.get(host)!;
    return { personal, pressed: personal === 'normal' ? undefined : displayLevel(personal), steps: levelSteps(personal), fromLists: 'normal' };
  };
  const shown = (r: DemoResult) => revealed || levels.get(r.host) !== 'hide';

  /** Pinned first, then each result where Raise and Lower put it; hidden ones go, unless shown. */
  function order(): DemoResult[] {
    const key = (r: DemoResult, i: number) => (levels.get(r.host) === 'pin' ? i - 100 : i + (SHIFT[levels.get(r.host)!] ?? 0));
    return RESULTS.map((r, i) => ({ r, k: key(r, i) }))
      .sort((a, b) => a.k - b.k)
      .map(({ r }) => r)
      .filter(shown);
  }

  function summarise() {
    const count = (...of: PersonalLevel[]) => [...levels.values()].filter((l) => of.includes(l)).length;
    const hidden = count('hide');
    const stats = {
      ...{ engine: '', total: RESULTS.length, tagged: 0, revealed, pages: 1, canGoDeeper: false, loading: false, tags: [], removed: {} },
      ...{ hidden, pinned: count('pin'), raised: count('raise', 'raise2'), lowered: count('lower', 'lower2') },
    };
    summary.replaceChildren(summarySentence(stats));
    if (hidden) summary.append(h('button', { type: 'button', class: 'text-btn', on: { click: toggleHidden } }, revealed ? t('hideAgain') : t('showHidden')));
    if (!last) return said.replaceChildren();
    const sentence = changeSentence({ site: last.host, before: { level: last.before, tags: [] }, after: { level: last.after, tags: [] }, newTags: [] }, (id) => id);
    said.replaceChildren(sentence, ' ', h('button', { type: 'button', class: 'text-btn', on: { click: undo } }, t('summaryUndo')));
  }

  /** Each result's button, and the ranking under its title, as on a search page. */
  function drawRow(result: DemoResult) {
    const { row, weigh, chips } = rows.get(result.host)!;
    const level = displayLevel(levels.get(result.host)!);
    row.dataset.level = level;
    weigh.dataset.level = level;
    weigh.replaceChildren(icon(WEIGH_ICONS[level]));
    const label = level === 'normal' ? t('weighLabel', result.host) : t('weighLabelRanked', result.host, LEVEL_CHIPS[level]);
    weigh.title = label;
    weigh.setAttribute('aria-label', label);
    weigh.setAttribute('aria-expanded', String(open === result));
    chips.replaceChildren();
    if (level !== 'normal') chips.append(h('span', { class: `level-note ${level}` }, icon(levelIcon(level, levelSteps(levels.get(result.host)!))), LEVEL_CHIPS[level]));
    if (result.tag) chips.append(tagChip(STARTER_TAGS[result.tag]!));
  }

  function drawMenu() {
    if (!open) return;
    const host = open.host;
    const r = rankingOf(host);
    name.textContent = host;
    menu.setAttribute('aria-label', t('weighLabel', host));
    group.setAttribute('aria-label', t('popupRankingFor', host));
    for (const [level, button] of rankButtons) {
      button.title = t(RANK_TITLES[level], host);
      button.setAttribute('aria-pressed', String(r.pressed === level));
      // Raise and Lower light one arrow per press.
      button.replaceChildren(h('span', { class: 'level-icon' }, icon(rankIcon(level, r.pressed === level ? r.steps : 0))), LEVEL_LABELS[level]);
    }
    hint.textContent = r.pressed ? t('popupHintMine', host) : t('popupHintNone');
    // Laid out first, so a menu just opened swings from level to the site's ranking.
    void balance.getBoundingClientRect();
    setBalance(balance, displayLevel(r.personal!), SCORE[r.personal!] ?? 0);
  }

  /** Put the rows in order, sliding them from where they were unless motion is reduced. */
  function draw() {
    const before = new Map([...rows.values()].map(({ row }) => [row, row.getBoundingClientRect().top]));
    RESULTS.forEach(drawRow);
    list.replaceChildren(...order().map((r) => rows.get(r.host)!.row));
    if (open && shown(open)) rows.get(open.host)!.row.append(menu);
    else menu.remove();
    drawMenu();
    summarise();
    reset.hidden = !last && [...levels.values()].every((l) => l === 'normal');
    if (!still) for (const { row } of rows.values()) if (row.isConnected && before.get(row)) slide(row, before.get(row)!);
  }

  function openMenu(result: DemoResult) {
    open = result;
    // The balance starts level and swings to the site's ranking, as the real menu's does.
    setBalance(balance, 'normal');
    draw();
    rankButtons.get(rankingOf(result.host).pressed ?? 'normal')!.focus();
  }

  function closeMenu(refocus: boolean) {
    const was = open;
    open = undefined;
    draw();
    if (refocus && was && shown(was)) rows.get(was.host)!.weigh.focus();
  }

  function press(level: Level) {
    if (!open) return;
    const host = open.host;
    const before = levels.get(host)!;
    const after = nextLevel(level, rankingOf(host));
    levels.set(host, after);
    last = { host, before, after };
    if (after === 'hide' && !revealed) {
      open = undefined;
      draw();
      // The result is gone: Undo, in the summary, is what brings it back.
      said.querySelector('button')?.focus();
      return;
    }
    draw();
    rankButtons.get(level)!.focus();
  }

  function undo() {
    if (!last) return;
    levels.set(last.host, last.before);
    const host = last.host;
    last = undefined;
    draw();
    rows.get(host)!.weigh.focus();
  }

  function toggleHidden() {
    revealed = !revealed;
    if (!revealed && open && levels.get(open.host) === 'hide') open = undefined;
    draw();
    summary.querySelector('button')?.focus();
  }

  reset.addEventListener('click', () => {
    for (const r of RESULTS) levels.set(r.host, 'normal');
    revealed = false;
    last = undefined;
    open = undefined;
    draw();
    rows.get(RESULTS[0]!.host)!.weigh.focus();
  });
  draw();
}
