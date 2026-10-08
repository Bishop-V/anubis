import { h, type VNode } from 'vue';

// What the site's demos (hide-demo.ts, rank-demo.ts) share: the icons, the result
// menu's balance and rankings, and small drawing helpers. They copy what the
// extension draws (utils/icons.ts, utils/balance.ts, entrypoints/content/ui.ts and
// shadow.css): update them together.

export const svg = (body: string, size = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const balanceIcon = (l: number, r: number) =>
  svg(
    `<path d="M8 3.2v9.6M5.5 13.2h5"/><path d="M2.6 ${l}L13.4 ${r}"/>` +
      `<path d="M2.6 ${l}L1.2 ${l + 3.6}M2.6 ${l}L4 ${l + 3.6}M13.4 ${r}L12 ${r + 3.6}M13.4 ${r}l1.4 3.6"/>` +
      `<path d="M1 ${l + 3.6}h3.2a1.6 1.6 0 0 1-3.2 0zM11.8 ${r + 3.6}H15a1.6 1.6 0 0 1-3.2 0z"/>`,
  );
export const ICON = {
  normal: balanceIcon(5, 5),
  raise: balanceIcon(3.6, 6.4),
  close: svg('<path d="M4 4l8 8M12 4l-8 8"/>'),
  gear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  chipRaise: svg('<path d="M4 9.5l4-4 4 4"/>', 13),
  chipLower: svg('<path d="M4 6.5l4 4 4-4"/>', 13),
  lower: balanceIcon(6.4, 3.6),
  pin: svg('<path d="M9.8 2.2l4 4-1.6.5-2.6 2.6.3 3.1-1.2 1.2L5.4 10.3 2.2 13.8M5.4 10.3L2.3 7.2l1.2-1.2 3.1.3 2.6-2.6z"/>'),
};

// The menu's rankings, each with its icon (LEVEL_ICONS).
export type Level = 'hide' | 'lower' | 'normal' | 'raise' | 'pin';
export const LEVELS: [Level, string, string][] = [
  ['hide', 'Hide', svg('<path d="M2 8s2.2-4.5 6-4.5c1.3 0 2.4.5 3.3 1.1M14 8s-2.2 4.5-6 4.5c-1.3 0-2.4-.5-3.3-1.1"/><path d="M2.5 13.5l11-11"/>', 14)],
  ['lower', 'Lower', svg('<path d="M4 6.5l4 4 4-4"/>', 14)],
  ['normal', 'Normal', svg('<path d="M13 3C7.5 3.5 4.5 7 4 13"/><path d="M13 3c.3 4.5-2.8 8-7.2 8.6M7.5 8.5l3-.5M6 11l3.5-.4"/>', 14)],
  ['raise', 'Raise', svg('<path d="M4 9.5l4-4 4 4"/>', 14)],
  ['pin', 'Pin', svg('<path d="M9.8 2.2l4 4-1.6.5-2.6 2.6.3 3.1-1.2 1.2L5.4 10.3 2.2 13.8M5.4 10.3L2.3 7.2l1.2-1.2 3.1.3 2.6-2.6z"/>', 14)],
];

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
export const tagMark = (name: string, color: string, n?: number) =>
  h('span', { class: 'demo-tag', style: { '--c': color } }, [h('span', { class: 'diamond' }), n ? `${name} ${n}` : name]);

