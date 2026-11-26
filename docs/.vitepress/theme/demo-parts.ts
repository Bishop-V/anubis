import { h, type VNode, type VNodeRef } from 'vue';
import { ICON, LEVELS, rankIcon, WEIGH, type Level } from './demo-icons';
export { ICON, LEVELS, rankIcon, svg, type Level } from './demo-icons';

// What the site's demos (hide-demo.ts, rank-demo.ts, scroll-demo.ts) share: the icons,
// the button on each result, the result menu, and small drawing helpers. They copy what
// the extension draws (utils/icons.ts, utils/balance.ts, entrypoints/content/ui.ts,
// menuparts.ts, column.ts, and shadow.css): update them together.

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
