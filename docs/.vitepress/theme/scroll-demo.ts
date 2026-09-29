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
  raised?: boolean;
  lowered?: boolean;
};
type Block = { id: string; heading: string; lines: string[] };
type Item = Result | Block;

const REFERENCE: Tag = { name: 'Reference', color: '#2b9aa0' };
const PAYWALL: Tag = { name: 'Paywall', color: '#b5452e' };

const ITEMS: Item[] = [
  { id: 'ai', heading: 'AI overview', lines: ['Anubis is the jackal-headed god of the dead in ancient Egyptian religion, linked with mummification and the protection of tombs.'] },
  { id: 'wiki', site: 'Wikipedia', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', tag: REFERENCE },
  { id: 'fandom', site: 'Fandom', url: 'mythology.fandom.com › wiki › Anubis', icon: ['#fa005a', '#ffffff', 'F'], title: 'Anubis | Mythology Wiki | Fandom', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.', hidden: true },
  { id: 'videos', heading: 'Videos', lines: ['Anubis explained', 'Tomb of Anubis'] },
  { id: 'brit', site: 'Britannica', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', tag: REFERENCE },
  { id: 'nyt', site: 'The New York Times', url: 'www.nytimes.com › 2026 › 03', icon: ['#ffffff', '#000000', 'T'], title: 'Archaeologists Find a Shrine to Anubis', snippet: 'A newly excavated site near Saqqara suggests Anubis was worshipped there for centuries.', tag: PAYWALL, lowered: true },
  { id: 'paa', heading: 'People also ask', lines: ['Is Anubis good or evil?', 'Why does Anubis have a jackal head?', 'Who is the wife of Anubis?'] },
  { id: 'whe', site: 'World History Encyclopedia', url: 'www.worldhistory.org › Anubis', icon: ['#8b1c1c', '#ffffff', 'W'], title: 'Anubis - World History Encyclopedia', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.', tag: REFERENCE, raised: true },
];

// After the ranking step: raised first, lowered last, hidden sites keep their place.
const RANKED = ['whe', 'wiki', 'fandom', 'brit', 'nyt'];

const REMOVED = 'an AI answer, a video panel, and a question list';
const SUMMARY = [
  '',
  '',
  `Anubis removed ${REMOVED}.`,
  `Anubis hid 1 of 5 results. It also removed ${REMOVED}.`,
  `Anubis raised 1, lowered 1, and hid 1 of 5 results. It also removed ${REMOVED}.`,
  `Anubis raised 1, lowered 1, and hid 1 of 5 results. It also removed ${REMOVED}.`,
];

const STEPS: { title: string; text: string }[] = [
  { title: 'A search, as it comes', text: 'An AI answer, a video panel, and a list of questions push the results you came for down the page.' },
  { title: 'Clean up the page', text: 'Anubis removes AI answers, video panels, and “People also ask” on every search. You choose which.' },
  { title: 'Hide a site for good', text: 'Hide a site once, from the button beside any result, and it stays hidden on every search. A line keeps its place, so you can still show it.' },
  { title: 'Raise and lower the rest', text: 'Sites you trust move up. Sites you’d rather skip sink to the bottom and fade.' },
  { title: 'Tag what’s left', text: 'Lists label each result, as Reference or Paywall for example, and the summary says what Anubis did. Show hidden puts everything back for the page.' },
];

const isBlock = (item: Item): item is Block => 'heading' in item;

// Something that folds away or opens up: its height animates between none and its own.
const fold = (open: boolean, cls: string, children: (VNode | string | null)[] | VNode) =>
  h('div', { class: ['fold', cls, { open }] }, [h('div', { class: 'fold-inner' }, children)]);

const tag = (t: Tag, n?: number) =>
  h('span', { class: 'demo-tag', style: { '--c': t.color } }, [h('span', { class: 'diamond' }), n ? `${t.name} ${n}` : t.name]);

function renderResult(r: Result, step: number): VNode {
  const hidden = !!r.hidden && step >= 3;
  const raised = !!r.raised && step >= 4;
  const tagged = !!r.tag && step >= 5;
  return h('div', { class: ['demo-result', { lowered: r.lowered && step >= 4 }] }, [
    fold(!hidden, 'full', [
      h('div', { class: 'site' }, [
        h('span', { class: 'favicon', style: { background: r.icon[0], color: r.icon[1] } }, r.icon[2]),
        h('span', { class: 'site-name' }, r.site),
        h('span', { class: 'url' }, r.url),
      ]),
      h('div', { class: 'title' }, r.title),
      fold(raised || tagged, 'chips', [
        r.raised ? h('span', { class: ['chip', 'demo-raised', { on: raised }] }, 'Raised') : null,
        r.tag ? h('span', { class: ['chip', { on: tagged }] }, [tag(r.tag)]) : null,
      ]),
      h('div', { class: 'snippet' }, r.snippet),
    ]),
    fold(hidden, 'hidden-line', [
      h('span', { class: 'hidden-site' }, r.url.split(' ')[0]!.replace(/^www\./, '')),
      ' hidden by your list ',
      h('span', { class: 'demo-link' }, 'Show'),
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
            ]),
          ),
        ),
      ]);
  },
});
