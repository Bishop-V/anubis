import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { balance, fold, html, ICON, LEVELS, tagMark, type Level } from './demo-parts';

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

type Result = { id: string; site: string; url: string; icon: [string, string, string]; title: string; snippet: string; chip?: 'tag' | 'raised' };
const RESULTS: Result[] = [
  { id: 'wiki', site: 'Wikipedia', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', chip: 'tag' },
  { id: 'fandom', site: 'Fandom', url: 'mythology.fandom.com › wiki › Anubis', icon: ['#fa005a', '#ffffff', 'F'], title: 'Anubis | Mythology Wiki | Fandom', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.' },
  { id: 'whe', site: 'World History Encyclopedia', url: 'www.worldhistory.org › Anubis', icon: ['#8b1c1c', '#ffffff', 'W'], title: 'Anubis - World History Encyclopedia', snippet: 'Anubis is the Egyptian god of mummification and the afterlife, and guardian of the scales.', chip: 'raised' },
  // Enough page below the menu that it opens over the results, not past the page.
  { id: 'brit', site: 'Britannica', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', chip: 'tag' },
];

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
