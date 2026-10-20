import { balanceSvg, setBalance } from '@/utils/balance';
import { h, icon } from '@/utils/dom';
import { gap, t, tParts, type MessageKey } from '@/utils/i18n';
import { ICON_CHECK, ICON_CLOSE, ICON_SEARCH, LEVEL_CHIPS, LEVEL_LABELS, levelIcon, rankIcon, WEIGH_ICONS } from '@/utils/icons';
import { LEVELS, type Level } from '@/utils/matcher';
import { displayLevel, levelSteps, type PersonalLevel } from '@/utils/personal';
import { nextLevel, type Ranking } from '@/utils/siteranking';
import { changeSentence, summarySentence } from '@/utils/summary';
import { RESULTS, STARTER_TAGS, resultBody, slide, tagChip, type DemoResult } from './parts';

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
//
// A short tour leads the way, written for someone who has never seen Anubis: what the
// button is, what its choices do, what just happened, and what to do next. Each tip is
// a callout beside the control it's about, which it marks with a dot, so it's where the
// person is already looking, and it moves along as they go. Each step follows what the
// person does, and while a tip asks for one control, the others are dimmed and do
// nothing, so there's no wrong thing to press. Close and Skip always work, and once the
// tour is done or skipped, everything does.

/** Raise and Lower move a site five places a press, as on a search page; it passes the result it lands on. */
const SHIFT: Partial<Record<PersonalLevel, number>> = { raise: -5.5, raise2: -10.5, lower: 5.5, lower2: 10.5 };
/** How far each one tips the balance: the places it moves the site. */
const SCORE: Partial<Record<PersonalLevel, number>> = { raise: 5, raise2: 10, lower: -5, lower2: -10 };
/** The result the tour starts on: where people who own them talk, third on the page. */
const TOUR_SITE = 'reddit.com';
const TOUR_STEPS = 3;
const RANK_TITLES: Record<Level, MessageKey> = {
  hide: 'popupRankHide',
  lower: 'popupRankLower',
  normal: 'popupRankNormal',
  raise: 'popupRankRaise',
  pin: 'popupRankPin',
};

/** The checklist beside the practice search on a wide window: its steps, and the line once all are done. */
export interface Checklist {
  list: HTMLElement;
  done: HTMLElement;
}

const STEPS: MessageKey[] = ['welcomeStepOpen', 'welcomeStepRank', 'welcomeStepHide'];

export function renderDemo(page: HTMLElement, reset: HTMLElement, checklist: Checklist): void {
  const levels = new Map<string, PersonalLevel>(RESULTS.map((r) => [r.host, 'normal']));
  let revealed = false;
  let open: DemoResult | undefined;
  let last: { host: string; before: PersonalLevel; after: PersonalLevel } | undefined;
  /** The tour's progress: whether a menu was opened, the first site ranked, whether a site was hidden, and whether it was skipped or closed. */
  const tour: { opened: boolean; first?: string; hid: boolean; skipped: boolean; closed: boolean } = { opened: false, hid: false, skipped: false, closed: false };
  let beckoning: HTMLElement | undefined;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const summary = h('p', { class: 'summary' });
  const said = h('p', { class: 'said', attrs: { role: 'status' } });
  const list = h('ol', { class: 'results', attrs: { 'aria-label': t('welcomeDemoLabel', t('welcomeQuery')) } });
  const summaryBox = h('div', { class: 'summary-box' }, summary, said);
  // The tour's tip, moved beside whatever it's about; its words are also said here, as they change.
  const coach = h('div', { class: 'coach' });
  const coachSaid = h('p', { class: 'sr-only', attrs: { role: 'status' } });
  page.replaceChildren(h('div', { class: 'query', attrs: { 'aria-hidden': 'true' } }, icon(ICON_SEARCH), t('welcomeQuery')), summaryBox, list, coachSaid);

  // One menu, moved under whichever result it's open for, so its balance swings from where it was.
  const balance = balanceSvg();
  const name = h('span', { class: 'name' });
  const hint = h('p', { class: 'hint' });
  const rankButtons = new Map<Level, HTMLButtonElement>();
  const group = h(
    'div',
    { class: 'seg levels', attrs: { role: 'group' } },
    LEVELS.flatMap((level) => {
      const button = h('button', { type: 'button', class: level, on: { click: () => !locked(button) && press(level) } });
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
        on: { click: () => locked(weigh) || (open === result ? closeMenu(false) : openMenu(result)) },
      });
      const body = resultBody(result);
      const chips = body.querySelector<HTMLElement>('.chips')!;
      const row = h('li', null, weigh, body);
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
    // Putting rows back in the list takes the focus off whatever was in them: keep it.
    const focused = page.contains(document.activeElement) ? (document.activeElement as HTMLElement) : undefined;
    RESULTS.forEach(drawRow);
    list.replaceChildren(...order().map((r) => rows.get(r.host)!.row));
    if (open && shown(open)) rows.get(open.host)!.row.append(menu);
    else menu.remove();
    if (focused?.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
    // The tip goes after the menu, wherever both are.
    coach.remove();
    drawMenu();
    summarise();
    drawTour();
    drawChecklist();
    reset.hidden = !last && [...levels.values()].every((l) => l === 'normal');
    if (!still) for (const { row } of rows.values()) if (row.isConnected && before.get(row)) slide(row, before.get(row)!);
  }

  const weighIcon = () => h('span', { class: 'inline-weigh' }, icon(WEIGH_ICONS.normal));

  interface Tip {
    /** The step, or none for the closing tip. */
    n?: number;
    says: (string | Node)[];
    /** The control to mark with a dot. */
    target?: HTMLElement;
    /** Where the tip goes, and which way its pointer points: up at the button or a ranking at the start or end of the menu, or down at the results. */
    at: HTMLElement;
    point: 'weigh' | 'menu-start' | 'menu-end' | 'down' | 'up';
  }

  /** What step 3 says: what the first ranking did, if it still stands, then to hide a site. */
  function nextSays(): (string | Node)[] {
    const host = tour.first!;
    const level = levels.get(host);
    const done = level === 'pin' ? t('welcomeTourPinned', host) : level?.startsWith('raise') ? t('welcomeTourRaised', host) : level?.startsWith('lower') ? t('welcomeTourLowered', host) : '';
    const find = tParts('welcomeTourFind', weighIcon());
    return done ? [done, gap(), ...find] : find;
  }

  /** Where the tour is: its step, what to say, the control to mark, and where the tip goes. Undefined once it's closed. */
  function tourTip(): Tip | undefined {
    if (tour.skipped || tour.closed) return undefined;
    if (!tour.first) {
      if (!open) return { n: 1, says: tParts('welcomeTourOpen', weighIcon(), TOUR_SITE), target: rows.get(TOUR_SITE)!.weigh, at: rows.get(TOUR_SITE)!.row, point: 'weigh' };
      return { n: 2, says: tParts('welcomeTourRank', open.host), target: rankButtons.get('pin'), at: rows.get(open.host)!.row, point: 'menu-end' };
    }
    if (tour.hid) return { says: tParts('welcomeTourDone', weighIcon()), at: summaryBox, point: 'up' };
    if (open && levels.get(open.host) === 'normal') {
      return { n: 3, says: tParts('welcomeTourHide', open.host), target: rankButtons.get('hide'), at: rows.get(open.host)!.row, point: 'menu-start' };
    }
    return { n: 3, says: nextSays(), at: summaryBox, point: 'down' };
  }

  const locked = (el: HTMLElement) => el.getAttribute('aria-disabled') === 'true';

  /**
   * While a tip asks for one control, dim the others and make them do nothing: the
   * result's button in step 1, Pin in step 2, and Hide in step 3, which also leaves the
   * button of every site not yet ranked, so any can be the one to hide. They stay
   * focusable, so a keyboard doesn't lose its place, and say they're unavailable.
   */
  function lockTo(tip: Tip | undefined) {
    const unranked = () => RESULTS.filter((r) => levels.get(r.host) === 'normal').map((r) => rows.get(r.host)!.weigh);
    const allowed = tip?.target ? [tip.target, ...(tip.n === 3 ? unranked() : [])] : undefined;
    for (const el of [...[...rows.values()].map((r) => r.weigh), ...rankButtons.values()]) {
      const off = !!allowed && !allowed.includes(el);
      if (off) el.setAttribute('aria-disabled', 'true');
      else el.removeAttribute('aria-disabled');
      el.classList.toggle('locked', off);
    }
  }

  /** The tip beside what it's about, the dot on the control that comes next, and the others dimmed. */
  function drawTour() {
    const tip = tourTip();
    lockTo(tip);
    if (!tip) coach.remove();
    else {
      // A step's tip has its number and Skip above what it says; the last one ends with Got it.
      const parts = tip.n
        ? [
            h(
              'div',
              { class: 'coach-head' },
              h('span', { class: 'step' }, t('welcomeTourStep', tip.n, TOUR_STEPS)),
              h('button', { type: 'button', class: 'text-btn', on: { click: () => endTour('skipped') } }, t('welcomeTourSkip')),
            ),
            h('p', { class: 'says' }, ...tip.says),
          ]
        : [
            h('p', { class: 'says' }, ...tip.says),
            h('div', { class: 'coach-foot' }, h('button', { type: 'button', class: 'btn small', on: { click: () => endTour('closed') } }, t('welcomeTourGotIt'))),
          ];
      const says = parts.find((part) => part.classList.contains('says'))!;
      // A new tip arrives with a short fade where it lands; the same one stays put.
      const fresh = coach.textContent !== parts.map((part) => part.textContent).join('') || coach.dataset.point !== tip.point;
      coach.replaceChildren(...parts);
      coach.dataset.point = tip.point;
      if (coach.parentElement !== tip.at) tip.at.append(coach);
      if (fresh) {
        coachSaid.textContent = says.textContent;
        coach.classList.remove('arrive');
        void coach.offsetWidth;
        coach.classList.add('arrive');
      }
    }
    // Mark the control that comes next. A dot that stays put doesn't pulse again.
    const target = tip?.target;
    if (target === beckoning) return;
    beckoning?.classList.remove('beckon');
    target?.classList.add('beckon');
    beckoning = target;
  }

  /** Tick off each step as it's done, and mark the next. It keeps counting after the tour is skipped. */
  function drawChecklist() {
    const done = [tour.opened, !!tour.first, tour.hid];
    const next = done.indexOf(false);
    checklist.list.replaceChildren(
      ...STEPS.map((key, i) =>
        h(
          'li',
          { class: done[i] ? 'done' : undefined, attrs: { 'aria-current': i === next ? 'step' : undefined } },
          h('span', { class: 'mark', attrs: { 'aria-hidden': 'true' } }, done[i] ? icon(ICON_CHECK) : String(i + 1)),
          t(key),
          done[i] ? h('span', { class: 'sr-only' }, `${gap()}${t('welcomeStepDone')}`) : null,
        ),
      ),
    );
    checklist.done.hidden = next !== -1;
  }

  function endTour(end: 'skipped' | 'closed') {
    tour[end] = true;
    draw();
    page.querySelector<HTMLElement>('.weigh')?.focus();
  }

  function openMenu(result: DemoResult) {
    open = result;
    tour.opened = true;
    // The balance starts level and swings to the site's ranking, as the real menu's does.
    setBalance(balance, 'normal');
    draw();
    // Into the menu, on the ranking the tour asks for, or else the site's own.
    const asked = tourTip()?.target;
    (asked && [...rankButtons.values()].includes(asked as HTMLButtonElement) ? asked : rankButtons.get(rankingOf(result.host).pressed ?? 'normal')!).focus();
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
    // Normal on a site that has no ranking changes nothing, so it isn't news.
    if (after === before) return;
    levels.set(host, after);
    last = { host, before, after };
    tour.first ??= host;
    if (after === 'hide') tour.hid = true;
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
    tour.first = undefined;
    tour.opened = tour.hid = tour.closed = false;
    draw();
    rows.get(RESULTS[0]!.host)!.weigh.focus();
  });
  draw();
}
