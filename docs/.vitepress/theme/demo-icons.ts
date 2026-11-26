export const svg = (body: string, size = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const ICON = {
  close: svg('<path d="M4 4l8 8M12 4l-8 8"/>'),
  gear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
};

// The menu's rankings, each with its icon (LEVEL_ICONS). Raise and Lower always show two
// arrows, lit one per press from the middle out (stepsIcon in utils/icons.ts).
export type Level = 'hide' | 'lower' | 'normal' | 'raise' | 'pin';
export const LEVELS: [Level, string][] = [
  ['hide', 'Hide'],
  ['lower', 'Lower'],
  ['normal', 'Normal'],
  ['raise', 'Raise'],
  ['pin', 'Pin'],
];
const EYE = '<path d="M2 8s2.2-4.5 6-4.5c1.3 0 2.4.5 3.3 1.1M14 8s-2.2 4.5-6 4.5c-1.3 0-2.4-.5-3.3-1.1"/><path d="M2.5 13.5l11-11"/>';
const PIN = '<path d="M9.8 2.2l4 4-1.6.5-2.6 2.6.3 3.1-1.2 1.2L5.4 10.3 2.2 13.8M5.4 10.3L2.3 7.2l1.2-1.2 3.1.3 2.6-2.6z"/>';
const FEATHER = '<path d="M13 3C7.5 3.5 4.5 7 4 13"/><path d="M13 3c.3 4.5-2.8 8-7.2 8.6M7.5 8.5l3-.5M6 11l3.5-.4"/>';
const arrows = (near: string, far: string, lit: number) =>
  svg(`<path class="${lit >= 1 ? 'lit' : 'unlit'}" d="${near}"/><path class="${lit >= 2 ? 'lit' : 'unlit'}" d="${far}"/>`, 15);
/** A ranking's icon in the menu: `lit` is how many of Raise's or Lower's arrows are lit. */
export function rankIcon(level: Level, lit = 0): string {
  if (level === 'raise') return arrows('M4 12l4-4 4 4', 'M4 7.5l4-4 4 4', lit);
  if (level === 'lower') return arrows('M4 4l4 4 4-4', 'M4 8.5l4 4 4-4', lit);
  return svg({ hide: EYE, normal: FEATHER, pin: PIN }[level], 15);
}

// The button in the column left of each result (column.ts, .weigh.column in shadow.css):
// the ranking's icon (WEIGH_ICONS), the balance tipped for Raise and Lower. `button` takes
// a ref for the pointer to aim at; `active` is its menu open.
const tipped = (left: number, right: number) =>
  svg(
    `<path d="M8 3.2v9.6M5.5 13.2h5"/><path d="M2.6 ${left}L13.4 ${right}"/>` +
      `<path d="M2.6 ${left}L1.2 ${left + 3.6}M2.6 ${left}L4 ${left + 3.6}M13.4 ${right}L12 ${right + 3.6}M13.4 ${right}l1.4 3.6"/>` +
      `<path d="M1 ${left + 3.6}h3.2a1.6 1.6 0 0 1-3.2 0zM11.8 ${right + 3.6}H15a1.6 1.6 0 0 1-3.2 0z"/>`,
  );
export const WEIGH: Record<Level, string> = { hide: svg(EYE), lower: tipped(6.4, 3.6), normal: tipped(5, 5), raise: tipped(3.6, 6.4), pin: svg(PIN) };

// Tags that change a ranking show its arrow in place of the diamond.
const mark = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const TAG_MARKS = { raise: mark('<path d="M2 6.6l3-3.2 3 3.2"/>'), lower: mark('<path d="M2 3.4l3 3.2 3-3.2"/>') };

export const SPARKLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><defs><linearGradient id="demo-sparkle" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8df5"/><stop offset="1" stop-color="#9b72cb"/></linearGradient></defs><path fill="url(#demo-sparkle)" d="M8 0c.6 4.2 3.8 7.4 8 8-4.2.6-7.4 3.8-8 8-.6-4.2-3.8-7.4-8-8 4.2-.6 7.4-3.8 8-8z"/></svg>`;
