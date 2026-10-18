import { h } from '@/utils/dom';
import { t } from '@/utils/i18n';

// Example search results to reorder: the one thing Anubis does that needs no
// explaining. Raise and Lower move a result one place, as the button beside a real
// result does for its site. Nothing is saved, and nothing moves until pressed.

/** English on purpose: the sample results are for the search in welcomeQuery, which stays technical. */
const RESULTS: { host: string; title: string }[] = [
  { host: 'docs.python.org', title: 'Data Structures — Python documentation' },
  { host: 'en.wikipedia.org', title: 'List comprehension - Wikipedia' },
  { host: 'realpython.com', title: 'When to Use a List Comprehension in Python' },
  { host: 'stackoverflow.com', title: 'What does "list comprehension" mean? How does it work?' },
];

export function renderDemo(list: HTMLElement, said: HTMLElement, reset: HTMLElement): void {
  let order = RESULTS.map((_, i) => i);
  const rows = RESULTS.map(() => h('li'));
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Put the rows in order, and slide each from where it was (FLIP) unless motion is reduced. */
  function show(focus?: { row: number; button: 'raise' | 'lower' }) {
    const before = new Map(rows.map((row) => [row, row.getBoundingClientRect().top]));
    list.replaceChildren(...order.map((i) => rows[i]!));
    order.forEach((i, place) => {
      const [raise, lower] = rows[i]!.querySelectorAll('button');
      raise!.disabled = place === 0;
      lower!.disabled = place === order.length - 1;
    });
    if (focus) {
      const [raise, lower] = rows[focus.row]!.querySelectorAll('button');
      // A button that can't be pressed any more can't keep the focus: hand it to the other.
      const wanted = focus.button === 'raise' ? raise! : lower!;
      (wanted.disabled ? (focus.button === 'raise' ? lower! : raise!) : wanted).focus();
    }
    if (still) return;
    for (const row of rows) {
      const shift = (before.get(row) ?? 0) - row.getBoundingClientRect().top;
      if (!shift || !before.get(row)) continue;
      row.style.transition = 'none';
      row.style.transform = `translateY(${shift}px)`;
      void row.offsetHeight;
      row.style.transition = 'transform 0.35s cubic-bezier(0.3, 0.7, 0.2, 1)';
      row.style.transform = '';
    }
  }

  function move(row: number, by: -1 | 1) {
    const from = order.indexOf(row);
    const to = from + by;
    if (to < 0 || to >= order.length) return;
    order.splice(from, 1);
    order.splice(to, 0, row);
    said.textContent = t(by < 0 ? 'welcomeDemoRaised' : 'welcomeDemoLowered', RESULTS[row]!.host);
    show({ row, button: by < 0 ? 'raise' : 'lower' });
  }

  RESULTS.forEach((result, i) => {
    const button = (label: string, name: string, by: -1 | 1) =>
      h('button', { type: 'button', class: 'btn small', title: name, 'aria-label': name, on: { click: () => move(i, by) } }, label);
    rows[i]!.replaceChildren(
      h('div', { class: 'result' }, h('span', { class: 'host' }, result.host), h('span', { class: 'title' }, result.title)),
      h('div', { class: 'actions' }, button(t('welcomeDemoRaise'), t('welcomeDemoRaiseSite', result.host), -1), button(t('welcomeDemoLower'), t('welcomeDemoLowerSite', result.host), 1)),
    );
  });

  reset.addEventListener('click', () => {
    order = RESULTS.map((_, i) => i);
    said.textContent = '';
    show();
  });
  show();
}
