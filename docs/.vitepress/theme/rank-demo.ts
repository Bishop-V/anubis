import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { balance, fold, html, ICON, LEVELS, tagMark, type Level } from './demo-parts';

// Ranking sites, played out: a pointer opens the button beside the last result and
// presses Pin, and the result moves to the top in its gold frame. Then it lowers
// another site, which moves down the page with a "Lowered" label. The summary says
// what changed each time, with Undo. It plays once when it scrolls into view, and
// again from "Play again". With reduced motion there's no pointer, and results
// change places without moving.
//
// It shares hide-demo.ts's page, pointer, and menu (demo-parts.ts, brand.css), and
// like it copies what the extension draws: reranking by CSS order, the pinned frame
// (entrypoints/content/page.css), the summary and its change line (utils/summary.ts),
// and the result menu. Update it with them.

type Result = { id: string; site: string; host: string; url: string; icon: [string, string, string]; title: string; snippet: string; tag?: [string, string] };
const RESULTS: Result[] = [
  { id: 'wiki', site: 'Wikipedia', host: 'wikipedia.org', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', tag: ['Reference', '#2b9aa0'] },
  { id: 'pinterest', site: 'Pinterest', host: 'pinterest.com', url: 'www.pinterest.com › ideas › anubis', icon: ['#e60023', '#ffffff', 'P'], title: '500+ Anubis ideas | Egyptian art, Anubis, Egypt', snippet: 'Find and save ideas about Anubis on Pinterest.' },
  { id: 'brit', site: 'Britannica', host: 'britannica.com', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', tag: ['Reference', '#2b9aa0'] },
  { id: 'met', site: 'The Met', host: 'metmuseum.org', url: 'www.metmuseum.org › art › collection', icon: ['#e4002b', '#ffffff', 'M'], title: 'Statuette of Anubis | The Metropolitan Museum of Art', snippet: 'Wood statuette of the jackal-headed god, from the Ptolemaic Period.' },
];

/** The two changes the pointer makes, in turn. */
const STEPS: { id: string; level: Level; said: string }[] = [
  { id: 'met', level: 'pin', said: 'Pinned metmuseum.org.' },
  { id: 'pinterest', level: 'lower', said: 'Lowered pinterest.com.' },
];

export default defineComponent({
  name: 'RankDemo',
  setup() {
    const state = reactive({
      levels: {} as Record<string, Level>,
      menuFor: '' as string,
      menuLevel: 'normal' as Level,
      said: '',
      done: false,
      pointer: false,
      x: 0,
      y: 0,
      pressing: false,
      clicks: 0,
    });
    const root = ref<HTMLElement>();
    const weighs = new Map<string, HTMLElement>();
    const rows = new Map<string, HTMLElement>();
    const levelRefs = new Map<Level, HTMLElement>();
    const menuPos = reactive({ left: 0, top: 0, width: 312 });
    let run = 0;
    let observer: IntersectionObserver | undefined;
    const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    /** Pinned first, lowered last, the rest in the engine's order: how the extension reranks a page this short. */
    const order = () => {
      const place = (r: Result) => (state.levels[r.id] === 'pin' ? 0 : state.levels[r.id] === 'lower' ? 2 : 1);
      return [...RESULTS].sort((a, b) => place(a) - place(b));
    };

    /** Change a ranking, and slide each result from where it was to where it lands (FLIP). */
    const rank = async (id: string, level: Level) => {
      const before = new Map([...rows].map(([key, el]) => [key, el.getBoundingClientRect().top]));
      state.levels = { ...state.levels, [id]: level };
      await nextTick();
      if (still()) return;
      for (const [key, el] of rows) {
        const from = before.get(key);
        if (from === undefined) continue;
        const shift = from - el.getBoundingClientRect().top;
        if (!shift) continue;
        el.style.transition = 'none';
        el.style.transform = `translateY(${shift}px)`;
        void el.offsetHeight;
        el.style.transition = 'transform 0.7s cubic-bezier(0.3, 0.7, 0.2, 1)';
        el.style.transform = '';
      }
    };

    const openMenu = async (id: string) => {
      const b = root.value!.getBoundingClientRect();
      const w = weighs.get(id)!.getBoundingClientRect();
      const width = Math.min(312, b.width - 16);
      menuPos.width = width;
      menuPos.left = Math.max(8, w.right - b.left - width);
      // Under the button, unless that runs past the page: then above it.
      const below = w.bottom - b.top + 6;
      menuPos.top = below + 250 > b.height ? Math.max(8, w.top - b.top - 256) : below;
      state.menuLevel = state.levels[id] ?? 'normal';
      state.menuFor = id;
      await nextTick();
    };

    const play = async () => {
      const id = ++run;
      const alive = () => id === run && !!root.value;
      Object.assign(state, { levels: {}, menuFor: '', said: '', done: false, pointer: false, pressing: false });
      for (const el of rows.values()) {
        el.style.transition = 'none';
        el.style.transform = '';
      }
      await nextTick();
      const box = root.value!.getBoundingClientRect();
      state.x = box.width - 40;
      state.y = box.height - 20;
      await sleep(900);
      if (!alive()) return;
      const pointer = !still();
      state.pointer = pointer;
      for (const step of STEPS) {
        if (pointer) await moveTo(weighs.get(step.id), 1000);
        if (!alive()) return;
        if (pointer) await click();
        await openMenu(step.id);
        await sleep(pointer ? 600 : 1100);
        if (!alive()) return;
        if (pointer) await moveTo(levelRefs.get(step.level), 800);
        if (!alive()) return;
        if (pointer) await click();
        state.menuLevel = step.level;
        await sleep(800);
        if (!alive()) return;
        // The menu closes and the page reranks, as it does after a choice.
        state.menuFor = '';
        state.said = step.said;
        await rank(step.id, step.level);
        if (pointer) {
          state.x += 40;
          state.y += 30;
        }
        await sleep(1300);
        if (!alive()) return;
      }
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
      const pinned = Object.values(state.levels).filter((l) => l === 'pin').length;
      const lowered = Object.values(state.levels).filter((l) => l === 'lower').length;
      const parts = [pinned ? `pinned ${pinned}` : '', lowered ? `lowered ${lowered}` : ''].filter(Boolean);
      const sentence = parts.length ? `Anubis ${parts.join(' and ')} of 4 results.` : 'Anubis left all 4 results as they were.';
      const result = (r: Result) => {
        const level = state.levels[r.id] ?? 'normal';
        const icon = level === 'pin' ? ICON.pin : level === 'lower' ? ICON.lower : ICON.normal;
        return h(
          'div',
          {
            key: r.id,
            ref: (el: unknown) => (el instanceof HTMLElement ? rows.set(r.id, el) : rows.delete(r.id)),
            class: ['demo-result', 'rd-result', { pinned: level === 'pin' }],
          },
          [
            h('div', { class: 'site' }, [
              h('span', { class: 'favicon', style: { background: r.icon[0], color: r.icon[1] } }, r.icon[2]),
              h('span', { class: 'site-name' }, r.site),
              h('span', { class: 'url' }, r.url),
              h('span', {
                ref: (el: unknown) => (el instanceof HTMLElement ? weighs.set(r.id, el) : weighs.delete(r.id)),
                class: ['demo-weigh', 'hd-weigh', level, { active: state.menuFor === r.id }],
                innerHTML: icon,
              }),
            ]),
            h('div', { class: 'title' }, r.title),
            r.tag || level === 'lower'
              ? h('div', { class: 'hd-chips' }, [
                  level === 'lower' ? h('span', { class: 'demo-verdict' }, [html('span', 'chip-icon', ICON.chipLower), 'Lowered']) : null,
                  r.tag ? tagMark(r.tag[0], r.tag[1]) : null,
                ])
              : null,
            h('div', { class: 'snippet' }, r.snippet),
          ],
        );
      };
      const menuResult = RESULTS.find((r) => r.id === state.menuFor);

      return h('figure', { class: 'hide-demo rank-demo' }, [
        h('div', { ref: root, class: 'hd-stage' }, [
          h('div', { class: 'demo-page hd-page', 'aria-hidden': 'true' }, [
            h('div', { class: 'demo-summary hd-summary' }, [
              h('p', [h('span', [sentence, ' ', html('span', 'hd-gear', ICON.gear)])]),
              fold(!!state.said, 'hd-change', [h('span', state.said), ' ', h('span', { class: 'demo-link' }, 'Undo')]),
              h('div', { class: 'summary-tags hd-tags' }, [tagMark('Reference', '#2b9aa0', 2)]),
            ]),
            h('div', { class: 'demo-results' }, order().map(result)),
          ]),
          menuResult
            ? h('div', { class: 'hd-menu', style: { left: `${menuPos.left}px`, top: `${menuPos.top}px`, width: `${menuPos.width}px` }, 'aria-hidden': 'true' }, [
                h('div', { class: 'hd-head' }, [h('span', { class: 'hd-cartouche' }, [h('span', { class: 'hd-name' }, menuResult.host)]), html('span', 'hd-close', ICON.close)]),
                balance(state.menuLevel),
                h(
                  'div',
                  { class: 'hd-levels' },
                  LEVELS.map(([level, name, icon]) =>
                    h(
                      'span',
                      {
                        ref: (el: unknown) => (el instanceof HTMLElement ? levelRefs.set(level, el) : levelRefs.delete(level)),
                        class: ['hd-level', level, { pressed: state.menuLevel === level && level !== 'normal' }],
                      },
                      [html('span', 'hd-level-icon', icon), name],
                    ),
                  ),
                ),
                h('p', { class: 'hd-hint' }, `Your choice for ${menuResult.host}, on every search.`),
              ])
            : null,
          h(
            'span',
            {
              class: ['hd-pointer', { shown: state.pointer, pressing: state.pressing }],
              style: { transform: `translate(${state.x}px, ${state.y}px)` },
              'aria-hidden': 'true',
            },
            [
              h('span', { key: state.clicks, class: ['hd-ripple', { on: state.clicks > 0 }] }),
              h('svg', { viewBox: '0 0 16 22', width: 16, height: 22 }, [
                h('path', { d: 'M1 1v17l4.4-4.2 3 6.6 2.8-1.3-3-6.4H14z', fill: '#ffffff', stroke: '#1b1a16', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
              ]),
            ],
          ),
        ]),
        h('figcaption', { class: 'caption hd-caption' }, [
          'Pinning one site and lowering another from the button beside each result. ',
          h('button', { type: 'button', class: 'hd-replay', disabled: !state.done, onClick: () => void play() }, 'Play again'),
        ]),
      ]);
    };
  },
});
