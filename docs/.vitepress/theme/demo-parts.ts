import { h, type VNode, type VNodeRef } from 'vue';

// What the site's demos (hide-demo.ts, rank-demo.ts, scroll-demo.ts) share: the icons,
// the button on each result, the result menu, and small drawing helpers. They copy what
// the extension draws (utils/icons.ts, utils/balance.ts, entrypoints/content/ui.ts,
// menuparts.ts, column.ts, and shadow.css): update them together.

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
const WEIGH: Record<Level, string> = { hide: svg(EYE), lower: tipped(6.4, 3.6), normal: tipped(5, 5), raise: tipped(3.6, 6.4), pin: svg(PIN) };
export const columnButton = (level: Level, opts: { button?: VNodeRef; active?: boolean } = {}) =>
  h('span', { class: ['demo-col', level, { active: opts.active }], ref: opts.button, innerHTML: WEIGH[level] });

// The menu's balance (utils/balance.ts): the site's pan on the left, the feather's on
// the right, tilting with the ranking.
export const TILT: Record<Level, number> = { hide: -13, lower: -6, normal: 0, raise: 6, pin: 13 };
const ARM = 52;
export function balance(level: Level): VNode {
  const rad = (TILT[level] * Math.PI) / 180;
  const dx = ARM * (1 - Math.cos(rad));
  const dy = ARM * Math.sin(rad);
  return h('svg', { class: 'hd-balance', viewBox: '0 0 132 40', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M66 7v28M56 37h20' }),
    h('circle', { cx: 66, cy: 5, r: 1.6, fill: 'currentColor', stroke: 'none' }),
    h('g', { class: 'hd-tilt', style: { transform: `rotate(${TILT[level]}deg)`, transformOrigin: '66px 9px', transformBox: 'view-box' } }, [h('path', { d: 'M14 9h104' })]),
    h('g', { class: 'hd-tilt', style: { transform: `translate(${dx}px, ${-dy}px)` } }, [
      h('path', { d: 'M14 9 7 24M14 9l7 15' }),
      h('path', { d: 'M4 24h20a10 5 0 0 1-20 0z', fill: 'currentColor', 'fill-opacity': 0.14 }),
      h('path', { d: 'M14 21.5c-1.8-1.6-3.2-2.6-3.2-4a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 1.4-1.4 2.4-3.2 4z', fill: 'currentColor', stroke: 'none' }),
    ]),
    h('g', { class: 'hd-tilt', style: { transform: `translate(${-dx}px, ${dy}px)` } }, [
      h('path', { d: 'M118 9l-7 15M118 9l7 15' }),
      h('path', { d: 'M108 24h20a10 5 0 0 1-20 0z', fill: 'currentColor', 'fill-opacity': 0.14 }),
      h('path', { d: 'M115 22.5c1.5-3.5 3.5-5.8 6-7-.3 3.2-2.4 5.6-6 7zM116.4 20.6l2.4-.4' }),
    ]),
  ]);
}

export const html = (tag: string, cls: string, markup: string) => h(tag, { class: cls, innerHTML: markup });
export const fold = (open: boolean, cls: string, children: (VNode | string | null)[]) =>
  h('div', { class: ['fold', cls, { open }] }, [h('div', { class: 'fold-inner' }, children)]);
// A tag that moves the result shows the ranking's sign in its diamond's place (tagMark in utils/icons.ts).
const mark = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const TAG_MARKS = { raise: mark('<path d="M2 6.6l3-3.2 3 3.2"/>'), lower: mark('<path d="M2 3.4l3 3.2 3-3.2"/>') };
export const tagMark = (name: string, color: string, n?: number, effect?: keyof typeof TAG_MARKS) =>
  h('span', { class: 'demo-tag', style: { '--c': color } }, [
    effect ? html('span', 'mark', TAG_MARKS[effect]) : h('span', { class: 'diamond' }),
    n ? `${name} ${n}` : name,
  ]);

/** Where the result menu goes in a demo's stage: over its button, its arrow pointing down at it, or under it where there's no room above (position() in ui.ts). */
export interface MenuPlace {
  left: number;
  width: number;
  arrow: number;
  below: boolean;
  /** From the stage's top when below the button, else its bottom from the stage's bottom. */
  edge: number;
}
export function placeMenu(stage: HTMLElement, button: HTMLElement, height = 215): MenuPlace {
  const b = stage.getBoundingClientRect();
  const w = button.getBoundingClientRect();
  const width = Math.min(340, b.width - 16);
  const centre = w.left - b.left + w.width / 2;
  const left = Math.max(8, Math.min(centre - 22, b.width - width - 8));
  const below = w.top - b.top - 12 - height < 8;
  return { left, width, arrow: centre - left, below, edge: below ? w.bottom - b.top + 12 : b.bottom - w.top + 12 };
}

/** The result menu (buildPopover in ui.ts): the site's name, the balance, the rankings, one hint, and the site's tags with + Tag. */
export function menu(
  place: MenuPlace,
  shown: { site: string; level: Level; steps?: number; hint: string; tags?: VNode[] },
  levelRef?: (level: Level, el: unknown) => void,
): VNode {
  const { site, level, steps = 1, hint, tags = [] } = shown;
  const style = { left: `${place.left}px`, width: `${place.width}px`, [place.below ? 'top' : 'bottom']: `${place.edge}px`, '--arrow-x': `${place.arrow}px` };
  return h('div', { class: ['hd-menu', { below: place.below }], style, 'aria-hidden': 'true' }, [
    h('div', { class: 'hd-head' }, [h('span', { class: 'hd-name' }, site), html('span', 'hd-close', ICON.close)]),
    balance(level),
    h(
      'div',
      { class: 'hd-levels' },
      LEVELS.flatMap(([l, name]) => [
        l === 'lower' || l === 'pin' ? h('span', { class: 'hd-sep' }) : null,
        h('span', { ref: levelRef && ((el: unknown) => levelRef(l, el)), class: ['hd-level', l, { pressed: level === l && l !== 'normal' }] }, [
          html('span', 'hd-level-icon', rankIcon(l, level === l ? steps : 0)),
          name,
        ]),
      ]),
    ),
    h('p', { class: 'hd-hint' }, hint),
    h('div', { class: 'hd-menu-tags' }, [...tags, h('span', { class: 'hd-add' }, '+ Tag')]),
  ]);
}
