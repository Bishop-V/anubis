import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, type VNode } from 'vue';

// The homepage's demo, below its heading: one search on a drawn results page that
// Anubis works through as you scroll. Each step on the left changes the page on the
// right: clean-up removes the panels, a site is hidden, and the rest are ranked,
// then tagged. The words match what the extension says (the summary, the hidden line,
// the tags). Without JavaScript, or before it loads, the page shows the first step.

type Tag = { name: string; color: string };
type Result = {
  id: string;
  site: string;
  url: string;
  icon: [bg: string, fg: string, letter: string];
  title: string;
  snippet: string;
  tag?: Tag;
  hidden?: boolean;
  pinned?: boolean;
  raised?: boolean;
  lowered?: boolean;
};
type Block = { id: string; heading: string; lines: string[] };
type Item = Result | Block;

const REFERENCE: Tag = { name: 'Reference', color: '#2b9aa0' };
const PAYWALL: Tag = { name: 'Paywall', color: '#b5452e' };

const ITEMS: Item[] = [
  { id: 'ai', heading: 'AI overview', lines: ['Anubis is the jackal-headed god of the dead in ancient Egyptian religion, linked with mummification and the protection of tombs.'] },
  { id: 'wiki', site: 'Wikipedia', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', tag: REFERENCE, pinned: true },
  { id: 'fandom', site: 'Fandom', url: 'mythology.fandom.com › wiki › Anubis', icon: ['#fa005a', '#ffffff', 'F'], title: 'Anubis | Mythology Wiki | Fandom', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.', hidden: true },
  { id: 'videos', heading: 'Videos', lines: ['Anubis explained', 'Tomb of Anubis'] },
  { id: 'brit', site: 'Britannica', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', tag: REFERENCE },
  { id: 'nyt', site: 'The New York Times', url: 'www.nytimes.com › 2026 › 03', icon: ['#ffffff', '#000000', 'T'], title: 'Archaeologists Find a Shrine to Anubis', snippet: 'A newly excavated site near Saqqara suggests Anubis was worshipped there for centuries.', tag: PAYWALL, lowered: true },
  { id: 'paa', heading: 'People also ask', lines: ['Is Anubis good or evil?', 'Why does Anubis have a jackal head?', 'Who is the wife of Anubis?'] },
  { id: 'whe', site: 'World History Encyclopedia', url: 'www.worldhistory.org › Anubis', icon: ['#8b1c1c', '#ffffff', 'W'], title: 'Anubis - World History Encyclopedia', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.', tag: REFERENCE, raised: true },
];

// After the ranking step: pinned first, then raised, lowered last; hidden sites keep
// their place.
const RANKED = ['wiki', 'whe', 'fandom', 'brit', 'nyt'];

const REMOVED = 'an AI answer, a video panel, and a question list';
const SUMMARY = [
  '',
  '',
  `Anubis removed ${REMOVED}.`,
  `Anubis hid 1 of 5 results. It also removed ${REMOVED}.`,
  `Anubis pinned 1, raised 1, lowered 1, and hid 1 of 5 results. It also removed ${REMOVED}.`,
  `Anubis pinned 1, raised 1, lowered 1, and hid 1 of 5 results. It also removed ${REMOVED}.`,
];

const STEPS: { title: string; text: string }[] = [
  { title: 'Before Anubis', text: 'Your results are in there somewhere, under an AI answer, videos, and a list of questions.' },
  { title: 'Clutter out', text: 'Anubis strips AI answers, video panels, and question lists. You pick which.' },
  { title: 'Done with a site?', text: 'Hide it from the scales beside any result. It stays hidden on every search, folded to one line in case you want it back.' },
  { title: 'Your sites first', text: 'Pin or raise the sites you trust. Lower the ones you put up with. The scales tip to show where each one stands.' },
  { title: 'Know before you click', text: 'Tags from lists mark reference sites, paywalls, and more. The summary says what changed, and Show hidden undoes it.' },
];

// The button on each result, as utils/icons.ts draws it (copied, since that module
// needs the extension's APIs): the balance tipped to the ranking, the pin, or the
// crossed-out eye.
type Level = 'hide' | 'lower' | 'normal' | 'raise' | 'pin';
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const balance = (left: number, right: number) =>
  svg(
    `<path d="M8 3.2v9.6M5.5 13.2h5"/><path d="M2.6 ${left}L13.4 ${right}"/>` +
      `<path d="M2.6 ${left}L1.2 ${left + 3.6}M2.6 ${left}L4 ${left + 3.6}M13.4 ${right}L12 ${right + 3.6}M13.4 ${right}l1.4 3.6"/>` +
      `<path d="M1 ${left + 3.6}h3.2a1.6 1.6 0 0 1-3.2 0zM11.8 ${right + 3.6}H15a1.6 1.6 0 0 1-3.2 0z"/>`,
  );
const WEIGH: Record<Level, string> = {
  hide: svg('<path d="M2 8s2.2-4.5 6-4.5c1.3 0 2.4.5 3.3 1.1M14 8s-2.2 4.5-6 4.5c-1.3 0-2.4-.5-3.3-1.1"/><path d="M2.5 13.5l11-11"/>'),
  lower: balance(6.4, 3.6),
  normal: balance(5, 5),
  raise: balance(3.6, 6.4),
  pin: svg('<path d="M9.8 2.2l4 4-1.6.5-2.6 2.6.3 3.1-1.2 1.2L5.4 10.3 2.2 13.8M5.4 10.3L2.3 7.2l1.2-1.2 3.1.3 2.6-2.6z"/>'),
};
// A new key on each ranking, so the icon swaps in with a small tip.
const weigh = (level: Level) => h('span', { key: level, class: ['demo-weigh', level], innerHTML: WEIGH[level] });

const isBlock = (item: Item): item is Block => 'heading' in item;

// Something that folds away or opens up: its height animates between none and its own.
const fold = (open: boolean, cls: string, children: (VNode | string | null)[] | VNode) =>
  h('div', { class: ['fold', cls, { open }] }, [h('div', { class: 'fold-inner' }, children)]);

const tag = (t: Tag, n?: number) =>
  h('span', { class: 'demo-tag', style: { '--c': t.color } }, [h('span', { class: 'diamond' }), n ? `${t.name} ${n}` : t.name]);

function renderResult(r: Result, step: number): VNode {
  const hidden = !!r.hidden && step >= 3;
  const pinned = !!r.pinned && step >= 4;
  const raised = !!r.raised && step >= 4;
  const tagged = !!r.tag && step >= 5;
  const level: Level = step < 4 ? 'normal' : r.pinned ? 'pin' : r.raised ? 'raise' : r.lowered ? 'lower' : 'normal';
  return h('div', { class: ['demo-result', { lowered: r.lowered && step >= 4, pinned }] }, [
    fold(!hidden, 'full', [
      h('div', { class: 'site' }, [
        h('span', { class: 'favicon', style: { background: r.icon[0], color: r.icon[1] } }, r.icon[2]),
        h('span', { class: 'site-name' }, r.site),
        h('span', { class: 'url' }, r.url),
        weigh(level),
      ]),
      h('div', { class: 'title' }, r.title),
      fold(pinned || raised || tagged, 'chips', [
        r.pinned ? h('span', { class: ['chip', 'demo-raised', { on: pinned }] }, 'Pinned') : null,
        r.raised ? h('span', { class: ['chip', 'demo-raised', { on: raised }] }, 'Raised') : null,
        r.tag ? h('span', { class: ['chip', { on: tagged }] }, [tag(r.tag)]) : null,
      ]),
      h('div', { class: 'snippet' }, r.snippet),
    ]),
    fold(hidden, 'hidden-line', [
      h('span', { class: 'hidden-site' }, r.url.split(' ')[0]!.replace(/^www\./, '')),
      ' hidden by your list ',
      h('span', { class: 'demo-link' }, 'Show'),
      weigh('hide'),
    ]),
  ]);
}

function renderBlock(b: Block, step: number): VNode {
  return fold(step < 2, 'demo-block', [
    h('div', { class: 'block-heading' }, b.heading),
    b.id === 'videos'
      ? h('div', { class: 'videos' }, b.lines.map((l) => h('div', { class: 'video' }, [h('span', { class: 'thumb' }), h('span', l)])))
      : b.id === 'paa'
        ? h('div', b.lines.map((l) => h('div', { class: 'question' }, l)))
        : h('p', { class: 'snippet' }, b.lines[0]),
  ]);
}

function renderPage(step: number): VNode {
  // Panels are gone by the ranking step, so they can sit anywhere then.
  const order = (item: Item, i: number) => (step < 4 ? i : isBlock(item) ? -1 : RANKED.indexOf(item.id));
  return h('div', { class: 'demo-page', 'aria-hidden': 'true' }, [
    h('div', { class: 'searchbar' }, [h('span', 'anubis'), h('span', { class: 'lens' })]),
    fold(step >= 2, 'demo-summary', [
      h('p', [h('span', { class: 'mark' }), SUMMARY[step], ' ', h('span', { class: 'demo-link' }, 'Show hidden')]),
      fold(step >= 5, 'summary-tags', [tag(REFERENCE, 3), tag(PAYWALL, 1)]),
    ]),
    h(
      'div',
      { class: 'demo-results' },
      ITEMS.map((item, i) =>
        h('div', { key: item.id, class: ['demo-item', { lifted: !isBlock(item) && item.raised }], style: { order: order(item, i) } }, [
          isBlock(item) ? renderBlock(item, step) : renderResult(item, step),
        ]),
      ),
    ),
  ]);
}

export default defineComponent({
  name: 'ScrollDemo',
  setup() {
    const step = ref(1);
    const root = ref<HTMLElement>();
    let frame = 0;

    // Slide results to their new places when the order changes (first, last, invert,
    // play); the folds animate on their own in CSS.
    const go = async (next: number) => {
      if (next === step.value) return;
      const items = [...(root.value?.querySelectorAll<HTMLElement>('.demo-item') ?? [])];
      const moving = matchMedia('(prefers-reduced-motion: no-preference)').matches && step.value >= 4 !== next >= 4;
      const before = new Map(items.map((el) => [el, el.getBoundingClientRect().top]));
      step.value = next;
      if (!moving) return;
      await nextTick();
      for (const el of items) {
        const dy = before.get(el)! - el.getBoundingClientRect().top;
        if (!dy) continue;
        el.style.transition = 'none';
        el.style.transform = `translateY(${dy}px)`;
      }
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          for (const el of items) {
            el.style.transition = '';
            el.style.transform = '';
          }
        }),
      );
    };

    // The step is the last one whose heading has passed a line across the window:
    // halfway down beside the page, lower on phones, where the page sits above.
    const update = () => {
      frame = 0;
      const steps = root.value?.querySelectorAll('.demo-step h2') ?? [];
      const line = innerHeight * (matchMedia('(min-width: 960px)').matches ? 0.55 : 0.8);
      let current = 1;
      steps.forEach((el, i) => {
        if (el.getBoundingClientRect().top < line) current = i + 1;
      });
      void go(current);
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };

    onMounted(() => {
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      update();
    });
    onBeforeUnmount(() => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    });

    return () =>
      h('section', { ref: root, class: 'scroll-demo', 'aria-label': 'What Anubis does to a search' }, [
        h('div', { class: 'demo-stage' }, [renderPage(step.value)]),
        h(
          'ol',
          { class: 'demo-steps' },
          STEPS.map((s, i) =>
            h('li', { class: ['demo-step', { active: step.value === i + 1 }], 'aria-current': step.value === i + 1 ? 'step' : undefined }, [
              h('h2', s.title),
              h('p', s.text),
              i === 0 ? h('p', { class: 'demo-cue' }, [h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↓'), ' Scroll, and watch Anubis tidy it up']) : null,
            ]),
          ),
        ),
      ]);
  },
});
