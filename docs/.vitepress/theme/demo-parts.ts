import { h, type VNode, type VNodeRef } from 'vue';
import { ICON, LEVELS, rankIcon, TAG_MARKS, WEIGH, type Level } from './demo-icons';
import { balancePosition, type MenuPlace } from './demo-geometry';
export { placeMenu, type MenuPlace } from './demo-geometry';
export { ICON, LEVELS, rankIcon, svg, type Level } from './demo-icons';

// What the site's demos (hide-demo.ts, rank-demo.ts, scroll-demo.ts) share: the icons,
// the button on each result, the result menu, and small drawing helpers. They copy what
// the extension draws (utils/icons.ts, utils/balance.ts, entrypoints/content/ui.ts,
// menuparts.ts, column.ts, and shadow.css): update them together.

export const columnButton = (level: Level, opts: { button?: VNodeRef; active?: boolean } = {}) =>
  h('span', { class: ['demo-col', level, { active: opts.active }], ref: opts.button, innerHTML: WEIGH[level] });

// The menu's balance (utils/balance.ts): the site's pan on the left, the feather's on
// the right, tilting with the ranking.
export function balance(level: Level): VNode {
  const { tilt, dx, dy } = balancePosition(level);
  return h('svg', { class: 'hd-balance', viewBox: '0 0 132 40', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M66 7v28M56 37h20' }),
    h('circle', { cx: 66, cy: 5, r: 1.6, fill: 'currentColor', stroke: 'none' }),
    h('g', { class: 'hd-tilt', style: { transform: `rotate(${tilt}deg)`, transformOrigin: '66px 9px', transformBox: 'view-box' } }, [h('path', { d: 'M14 9h104' })]),
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
export const tagMark = (name: string, color: string, n?: number, effect?: keyof typeof TAG_MARKS) =>
  h('span', { class: 'demo-tag', style: { '--c': color } }, [
    effect ? html('span', 'mark', TAG_MARKS[effect]) : h('span', { class: 'diamond' }),
    n ? `${name} ${n}` : name,
  ]);

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
