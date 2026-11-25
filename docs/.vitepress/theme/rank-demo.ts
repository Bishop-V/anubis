import { createStore } from '@inglorious/store';
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue';
import { columnButton, fold, html, ICON, menu, placeMenu, tagMark, type Level, type MenuPlace } from './demo-parts';

// Ranking sites, played out: a pointer opens the button beside the last result and
// presses Pin, and the result moves to the top in its grey frame. Then it lowers
// another site, which moves down the page as its button tips. The summary says
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

type RankDemoEntity = {
  type: 'RankDemo';
  levels: Record<string, Level>;
  menuFor: string;
  menuLevel: Level;
  said: string;
  done: boolean;
};

const initialDemo: RankDemoEntity = { type: 'RankDemo', levels: {}, menuFor: '', menuLevel: 'normal', said: '', done: false };

const RankDemo = {
  started(demo: RankDemoEntity) {
    Object.assign(demo, initialDemo);
  },
  openedMenu(demo: RankDemoEntity, id: string) {
    demo.menuFor = id;
    demo.menuLevel = demo.levels[id] ?? 'normal';
  },
  previewedRank(demo: RankDemoEntity, level: Level) {
    demo.menuLevel = level;
  },
  ranked(demo: RankDemoEntity, { id, level, said }: (typeof STEPS)[number]) {
    demo.levels = { ...demo.levels, [id]: level };
    demo.menuFor = '';
    demo.said = said;
  },
  finished(demo: RankDemoEntity) {
    demo.done = true;
  },
};

export default defineComponent({
  name: 'RankDemo',
  setup() {
    const store = createStore({ types: { RankDemo }, entities: { demo: initialDemo } });
    const state = shallowRef(store.getState().demo);
    const unsubscribe = store.subscribe(() => { state.value = store.getState().demo; });
    const cursor = reactive({
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
    let place: MenuPlace = { left: 0, width: 340, arrow: 22, below: false, edge: 0 };
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
      cursor.x = x;
      cursor.y = y;
      await sleep(ms);
    };
    const click = async () => {
      cursor.pressing = true;
      cursor.clicks++;
      await sleep(160);
      cursor.pressing = false;
    };

    /** Pinned first, lowered last, the rest in the engine's order: how the extension reranks a page this short. */
    const order = (levels: RankDemoEntity['levels']) => {
      const place = (r: Result) => (levels[r.id] === 'pin' ? 0 : levels[r.id] === 'lower' ? 2 : 1);
      return [...RESULTS].sort((a, b) => place(a) - place(b));
    };

    /** Change a ranking, and slide each result from where it was to where it lands (FLIP). */
    const rank = async (step: (typeof STEPS)[number]) => {
      const before = new Map([...rows].map(([key, el]) => [key, el.getBoundingClientRect().top]));
      store.notify('#demo:ranked', step);
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
      // Over the button, pointing down at it, or under it where there's no room above.
      place = placeMenu(root.value!, weighs.get(id)!);
      store.notify('#demo:openedMenu', id);
      await nextTick();
    };

    const play = async () => {
      const id = ++run;
      const alive = () => id === run && !!root.value;
      store.notify('#demo:started');
      Object.assign(cursor, { pointer: false, pressing: false });
      for (const el of rows.values()) {
        el.style.transition = 'none';
        el.style.transform = '';
      }
      await nextTick();
      const box = root.value!.getBoundingClientRect();
      cursor.x = box.width - 40;
      cursor.y = box.height - 20;
      await sleep(900);
      if (!alive()) return;
      const pointer = !still();
      cursor.pointer = pointer;
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
        store.notify('#demo:previewedRank', step.level);
        await sleep(800);
        if (!alive()) return;
        // The menu closes and the page reranks, as it does after a choice.
        await rank(step);
        if (pointer) {
          cursor.x += 40;
          cursor.y += 30;
        }
        await sleep(1300);
        if (!alive()) return;
      }
      cursor.pointer = false;
      store.notify('#demo:finished');
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
      unsubscribe();
    });

    return () => {
      const demo = state.value;
      const pinned = Object.values(demo.levels).filter((l) => l === 'pin').length;
      const lowered = Object.values(demo.levels).filter((l) => l === 'lower').length;
      const parts = [pinned ? `pinned ${pinned}` : '', lowered ? `lowered ${lowered}` : ''].filter(Boolean);
      const sentence = parts.length ? `Anubis ${parts.join(' and ')} of 4 results.` : 'Anubis left all 4 results as they were.';
      const result = (r: Result) => {
        const level = demo.levels[r.id] ?? 'normal';
        return h(
          'div',
          {
            key: r.id,
            ref: (el: unknown) => (el instanceof HTMLElement ? rows.set(r.id, el) : rows.delete(r.id)),
            class: ['demo-result', 'rd-result', { pinned: level === 'pin' }],
          },
          [
            h('div', { class: 'site' }, [
              columnButton(level, {
                button: (el: unknown) => (el instanceof HTMLElement ? weighs.set(r.id, el) : weighs.delete(r.id)),
                active: demo.menuFor === r.id,
              }),
              h('span', { class: 'favicon', style: { background: r.icon[0], color: r.icon[1] } }, r.icon[2]),
              h('span', { class: 'site-name' }, r.site),
              h('span', { class: 'url' }, r.url),
            ]),
            h('div', { class: 'title' }, r.title),
            r.tag ? h('div', { class: 'hd-chips' }, [tagMark(r.tag[0], r.tag[1])]) : null,
            h('div', { class: 'snippet' }, r.snippet),
          ],
        );
      };
      const menuResult = RESULTS.find((r) => r.id === demo.menuFor);

      return h('figure', { class: 'hide-demo rank-demo' }, [
        h('div', { ref: root, class: 'hd-stage' }, [
          h('div', { class: 'demo-page hd-page', 'aria-hidden': 'true' }, [
            h('div', { class: 'demo-summary hd-summary' }, [
              h('p', [h('span', [sentence, ' ', html('span', 'hd-gear', ICON.gear)])]),
              fold(!!demo.said, 'hd-change', [h('span', demo.said), ' ', h('span', { class: 'demo-link' }, 'Undo')]),
              h('div', { class: 'summary-tags hd-tags' }, [tagMark('Reference', '#2b9aa0', 2)]),
            ]),
            h('div', { class: 'demo-results' }, order(demo.levels).map(result)),
          ]),
          menuResult
            ? menu(
                place,
                {
                  site: menuResult.host,
                  level: demo.menuLevel,
                  hint: `Your choice for ${menuResult.host}, on every search.`,
                  tags: menuResult.tag ? [tagMark(menuResult.tag[0], menuResult.tag[1])] : [],
                },
                (level, el) => (el instanceof HTMLElement ? levelRefs.set(level, el) : levelRefs.delete(level)),
              )
            : null,
          h(
            'span',
            {
              class: ['hd-pointer', { shown: cursor.pointer, pressing: cursor.pressing }],
              style: { transform: `translate(${cursor.x}px, ${cursor.y}px)` },
              'aria-hidden': 'true',
            },
            [
              h('span', { key: cursor.clicks, class: ['hd-ripple', { on: cursor.clicks > 0 }] }),
              h('svg', { viewBox: '0 0 16 22', width: 16, height: 22 }, [
                h('path', { d: 'M1 1v17l4.4-4.2 3 6.6 2.8-1.3-3-6.4H14z', fill: '#ffffff', stroke: '#1b1a16', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
              ]),
            ],
          ),
        ]),
        h('figcaption', { class: 'caption hd-caption' }, [
          'Pinning one site and lowering another from the button beside each result. ',
          h('button', { type: 'button', class: 'hd-replay', disabled: !demo.done, onClick: () => void play() }, 'Play again'),
        ]),
      ]);
    };
  },
});
