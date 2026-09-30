import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, type VNode } from 'vue';

// The Introduction's demo: a drawn results page where a pointer opens the button
// beside a result, presses Hide in its menu, and the page answers: the menu closes,
// the site leaves the page (Remove, the default), and the summary says so, with
// Undo. It plays once when it scrolls into view, and again from "Play again". With
// reduced motion there's no pointer, and the page changes without animating.
//
// Like the homepage's demo (scroll-demo.ts, whose styles it shares), it copies what
// the extension draws: the summary and its change line (utils/summary.ts, the
// summary… messages), the button on each result and the result menu's cartouche,
// balance, and rankings (entrypoints/content/ui.ts and shadow.css, utils/balance.ts,
// utils/icons.ts). Update it with them.

const svg = (body: string, size = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const balanceIcon = (l: number, r: number) =>
  svg(
    `<path d="M8 3.2v9.6M5.5 13.2h5"/><path d="M2.6 ${l}L13.4 ${r}"/>` +
      `<path d="M2.6 ${l}L1.2 ${l + 3.6}M2.6 ${l}L4 ${l + 3.6}M13.4 ${r}L12 ${r + 3.6}M13.4 ${r}l1.4 3.6"/>` +
      `<path d="M1 ${l + 3.6}h3.2a1.6 1.6 0 0 1-3.2 0zM11.8 ${r + 3.6}H15a1.6 1.6 0 0 1-3.2 0z"/>`,
  );
const ICON = {
  normal: balanceIcon(5, 5),
  raise: balanceIcon(3.6, 6.4),
  close: svg('<path d="M4 4l8 8M12 4l-8 8"/>'),
  gear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  mark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="26 14 82 108" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M39.5 19 L55 48 L101 63 Q105 66 100.5 70 L79 72.5 Q63 76 62 88 L62 97 L32 97 Z"/><path fill="currentColor" d="M31 105 L63 105 L65 118 L30 118 Z"/><ellipse cx="67" cy="58" rx="4.2" ry="2.7" transform="rotate(18 67 58)" fill="var(--demo-page)"/></svg>',
  chipRaise: svg('<path d="M4 9.5l4-4 4 4"/>', 13),
};

// The menu's rankings, each with its icon (LEVEL_ICONS).
type Level = 'hide' | 'lower' | 'normal' | 'raise' | 'pin';
const LEVELS: [Level, string, string][] = [
  ['hide', 'Hide', svg('<path d="M2 8s2.2-4.5 6-4.5c1.3 0 2.4.5 3.3 1.1M14 8s-2.2 4.5-6 4.5c-1.3 0-2.4-.5-3.3-1.1"/><path d="M2.5 13.5l11-11"/>', 14)],
  ['lower', 'Lower', svg('<path d="M4 6.5l4 4 4-4"/>', 14)],
  ['normal', 'Normal', svg('<path d="M13 3C7.5 3.5 4.5 7 4 13"/><path d="M13 3c.3 4.5-2.8 8-7.2 8.6M7.5 8.5l3-.5M6 11l3.5-.4"/>', 14)],
  ['raise', 'Raise', svg('<path d="M4 9.5l4-4 4 4"/>', 14)],
  ['pin', 'Pin', svg('<path d="M9.8 2.2l4 4-1.6.5-2.6 2.6.3 3.1-1.2 1.2L5.4 10.3 2.2 13.8M5.4 10.3L2.3 7.2l1.2-1.2 3.1.3 2.6-2.6z"/>', 14)],
];

// The menu's balance (utils/balance.ts): the site's pan on the left, the feather's on
// the right, tilting with the ranking.
const TILT: Record<Level, number> = { hide: -13, lower: -6, normal: 0, raise: 6, pin: 13 };
const ARM = 52;
function balance(level: Level): VNode {
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

type Result = { id: string; site: string; url: string; icon: [string, string, string]; title: string; snippet: string; chip?: 'tag' | 'raised' };
const RESULTS: Result[] = [
  { id: 'wiki', site: 'Wikipedia', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', chip: 'tag' },
  { id: 'fandom', site: 'Fandom', url: 'mythology.fandom.com › wiki › Anubis', icon: ['#fa005a', '#ffffff', 'F'], title: 'Anubis | Mythology Wiki | Fandom', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.' },
  { id: 'whe', site: 'World History Encyclopedia', url: 'www.worldhistory.org › Anubis', icon: ['#8b1c1c', '#ffffff', 'W'], title: 'Anubis - World History Encyclopedia', snippet: 'Anubis is the Egyptian god of mummification and the afterlife, and guardian of the scales.', chip: 'raised' },
  // Enough page below the menu that it opens over the results, not past the page.
  { id: 'brit', site: 'Britannica', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', chip: 'tag' },
];

const html = (tag: string, cls: string, markup: string) => h(tag, { class: cls, innerHTML: markup });
const fold = (open: boolean, cls: string, children: (VNode | string | null)[]) =>
  h('div', { class: ['fold', cls, { open }] }, [h('div', { class: 'fold-inner' }, children)]);
const tagMark = (name: string, color: string, n?: number) =>
  h('span', { class: 'demo-tag', style: { '--c': color } }, [h('span', { class: 'diamond' }), n ? `${name} ${n}` : name]);

export default defineComponent({
  name: 'HideDemo',
  setup() {
    const state = reactive({ open: false, level: 'normal' as Level, hidden: false, done: false, pointer: false, x: 0, y: 0, pressing: false, clicks: 0 });
    const root = ref<HTMLElement>();
    const weighRef = ref<HTMLElement>();
    const hideRef = ref<HTMLElement>();
    const menuPos = reactive({ left: 0, top: 0, width: 312 });
    let run = 0;
    let observer: IntersectionObserver | undefined;
    const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Where an element's middle is, inside the demo.
    const centre = (el?: HTMLElement) => {
      const box = root.value!.getBoundingClientRect();
      const r = el!.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    };
    const moveTo = async (el: HTMLElement | undefined, ms: number) => {
      const { x, y } = centre(el);
      state.x = x;
      state.y = y;
      await sleep(ms);
    };
    const click = async () => {
      state.pressing = true;
      state.clicks++;
      await sleep(160);
      state.pressing = false;
    };

    const play = async () => {
      const id = ++run;
      const alive = () => id === run && !!root.value;
      Object.assign(state, { open: false, level: 'normal', hidden: false, done: false, pointer: false, pressing: false });
      const box = root.value!.getBoundingClientRect();
      state.x = box.width - 40;
      state.y = box.height - 20;
      // Long enough for the pointer, still unseen, to finish moving to its start.
      await sleep(900);
      if (!alive()) return;
      const pointer = !still();
      state.pointer = pointer;
      if (pointer) await moveTo(weighRef.value, 1000);
      if (!alive()) return;
      if (pointer) await click();
      // The menu opens under the button, its right edge on the button's.
      const b = root.value!.getBoundingClientRect();
      const w = weighRef.value!.getBoundingClientRect();
      const width = Math.min(312, b.width - 16);
      menuPos.width = width;
      menuPos.left = Math.max(8, w.right - b.left - width);
      menuPos.top = w.bottom - b.top + 6;
      state.open = true;
      await nextTick();
      await sleep(pointer ? 700 : 1200);
      if (!alive()) return;
      if (pointer) await moveTo(hideRef.value, 900);
      if (!alive()) return;
      if (pointer) await click();
      state.level = 'hide';
      await sleep(900);
      if (!alive()) return;
      // The site leaves the page, which closes its menu, and the summary says so.
      state.open = false;
      state.hidden = true;
      if (pointer) {
        state.x += 60;
        state.y += 40;
      }
      await sleep(600);
      if (!alive()) return;
      state.pointer = false;
      state.done = true;
    };

    onMounted(() => {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer?.disconnect();
            void play();
          }
        },
        { threshold: 0.6 },
      );
      if (root.value) observer.observe(root.value);
    });
    onBeforeUnmount(() => {
      run++;
      observer?.disconnect();
    });

    return () => {
      const hid = state.hidden ? 3 : 2;
      const long = `Anubis raised 1 and hid ${hid} of 7 results.`;
      const short = `Anubis changed ${hid + 1} of 7 results.`;
      const result = (r: Result) => {
        const weigh = r.id === 'fandom';
        return h('div', { class: 'demo-result', key: r.id }, [
          fold(!(weigh && state.hidden), 'full', [
            h('div', { class: 'site' }, [
              h('span', { class: 'favicon', style: { background: r.icon[0], color: r.icon[1] } }, r.icon[2]),
              h('span', { class: 'site-name' }, r.site),
              h('span', { class: 'url' }, r.url),
              h('span', {
                ref: weigh ? weighRef : undefined,
                class: ['demo-weigh', 'hd-weigh', r.chip === 'raised' ? 'raise' : 'normal', { active: weigh && state.open }],
                innerHTML: r.chip === 'raised' ? ICON.raise : ICON.normal,
              }),
            ]),
            h('div', { class: 'title' }, r.title),
            r.chip
              ? h('div', { class: 'hd-chips' }, [
                  r.chip === 'raised'
                    ? h('span', { class: 'demo-verdict raise' }, [html('span', 'chip-icon', ICON.chipRaise), 'Raised'])
                    : tagMark('Reference', '#2b9aa0'),
                ])
              : null,
            h('div', { class: 'snippet' }, r.snippet),
          ]),
        ]);
      };

      return h('figure', { class: 'hide-demo' }, [
        h('div', { ref: root, class: 'hd-stage' }, [
          h('div', { class: 'demo-page hd-page', 'aria-hidden': 'true' }, [
            h('div', { class: 'demo-summary hd-summary' }, [
              h('p', [
                html('span', 'mark', ICON.mark),
                h('span', { class: 'long' }, [
                  long,
                  ' ',
                  h('span', { class: 'demo-link' }, 'Show hidden'),
                  ' ',
                  h('span', { class: 'demo-link' }, 'Load more results'),
                  ' ',
                  html('span', 'hd-gear', ICON.gear),
                ]),
                h('span', { class: 'short' }, [short, ' ', h('span', { class: 'demo-link' }, 'Show hidden'), ' ', h('span', { class: 'demo-link' }, 'Details')]),
              ]),
              fold(state.hidden, 'hd-change', [h('span', 'Hid fandom.com.'), ' ', h('span', { class: 'demo-link' }, 'Undo')]),
              h('div', { class: 'summary-tags hd-tags' }, [tagMark('Reference', '#2b9aa0', 2), tagMark('Discussion', '#7a5aa6', 1), tagMark('Paywalled', '#b5452e', 1)]),
            ]),
            h('div', { class: 'demo-results' }, RESULTS.map(result)),
          ]),
          state.open
            ? h('div', { class: 'hd-menu', style: { left: `${menuPos.left}px`, top: `${menuPos.top}px`, width: `${menuPos.width}px` }, 'aria-hidden': 'true' }, [
                h('div', { class: 'hd-head' }, [h('span', { class: 'hd-cartouche' }, [h('span', { class: 'hd-name' }, 'fandom.com')]), html('span', 'hd-close', ICON.close)]),
                balance(state.level),
                h(
                  'div',
                  { class: 'hd-levels' },
                  LEVELS.map(([level, name, icon]) =>
                    h('span', { ref: level === 'hide' ? hideRef : undefined, class: ['hd-level', level, { pressed: state.level === level }] }, [html('span', 'hd-level-icon', icon), name]),
                  ),
                ),
                h('p', { class: 'hd-hint' }, 'Your choice for fandom.com, on every search.'),
              ])
            : null,
          h('span', {
            class: ['hd-pointer', { shown: state.pointer, pressing: state.pressing }],
            style: { transform: `translate(${state.x}px, ${state.y}px)` },
            'aria-hidden': 'true',
          }, [
            h('span', { key: state.clicks, class: ['hd-ripple', { on: state.clicks > 0 }] }),
            h('svg', { viewBox: '0 0 16 22', width: 16, height: 22 }, [h('path', { d: 'M1 1v17l4.4-4.2 3 6.6 2.8-1.3-3-6.4H14z', fill: '#ffffff', stroke: '#1b1a16', 'stroke-width': 1.4, 'stroke-linejoin': 'round' })]),
          ]),
        ]),
        h('figcaption', { class: 'caption hd-caption' }, [
          'Hiding a site from the button beside its result. ',
          h('button', { type: 'button', class: 'hd-replay', disabled: !state.done, onClick: () => void play() }, 'Play again'),
        ]),
      ]);
    };
  },
});
