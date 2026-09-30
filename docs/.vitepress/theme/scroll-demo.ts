import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, type VNode } from 'vue';

// The homepage's demo: one search on a drawn results page that Anubis works through
// as you scroll. The page's heading (the default slot, from home.ts) is the first
// step, beside the page before Anubis. Each step after it changes the page:
// clean-up removes the panels, a site is hidden, and the rest are ranked, then
// tagged, while a line beside the steps fills as you go. The words match what the
// extension says (the summary, the labels, the tags). Without JavaScript, or before
// it loads, the page shows the first step.
//
// The page is a search engine's, but no one engine's: a plain search box and tabs,
// no wordmark. Before Anubis it's as crowded as a real one gets, with panels between
// the results, and only with kinds of panel clean-up can remove, so the demo doesn't
// promise more than the extension does.

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
// A panel between the results: `lines` are what it lists, `meta` a line of small
// print for each (a source, a length, a count).
type Block = { id: string; kind: 'ai' | 'news' | 'questions' | 'videos' | 'discussions' | 'images'; heading: string; lines: string[]; meta?: string[] };
type Item = Result | Block;

const REFERENCE: Tag = { name: 'Reference', color: '#2b9aa0' };
const PAYWALL: Tag = { name: 'Paywalled', color: '#b5452e' };

const ITEMS: Item[] = [
  {
    id: 'ai',
    kind: 'ai',
    heading: 'AI overview',
    lines: ['Anubis is the jackal-headed god of the dead in ancient Egyptian religion, linked with mummification and the protection of tombs. He was said to weigh the hearts of the dead against a feather.'],
    meta: ['Wikipedia', 'Britannica', '+4 sites'],
  },
  { id: 'wiki', site: 'Wikipedia', url: 'en.wikipedia.org › wiki › Anubis', icon: ['#ffffff', '#000000', 'W'], title: 'Anubis - Wikipedia', snippet: 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld.', tag: REFERENCE, pinned: true },
  {
    id: 'news',
    kind: 'news',
    heading: 'Top stories',
    lines: ['Jackal mummies found in a Saqqara catacomb', 'Museum reopens its gallery of Anubis statues', 'What the weighing of the heart tells us'],
    meta: ['Heritage Daily', 'The Museum Post', 'Ancient Review'],
  },
  { id: 'fandom', site: 'Fandom', url: 'mythology.fandom.com › wiki › Anubis', icon: ['#fa005a', '#ffffff', 'F'], title: 'Anubis | Mythology Wiki | Fandom', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.', hidden: true },
  {
    id: 'questions',
    kind: 'questions',
    heading: 'People also ask',
    lines: ['Is Anubis good or evil?', 'Why does Anubis have a jackal head?', 'Who is the wife of Anubis?', 'What is Anubis the god of?'],
  },
  { id: 'videos', kind: 'videos', heading: 'Videos', lines: ['Anubis explained', 'Tomb of Anubis', 'The weighing of the heart'], meta: ['6:14', '12:03', '3:47'] },
  { id: 'brit', site: 'Britannica', url: 'www.britannica.com › topic › Anubis', icon: ['#0f4c81', '#ffffff', 'B'], title: 'Anubis | Egyptian God, Mythology, & Facts', snippet: 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal.', tag: REFERENCE },
  {
    id: 'discussions',
    kind: 'discussions',
    heading: 'Discussions and forums',
    lines: ['Why is Anubis always shown as a jackal?', 'Best books on Anubis and the afterlife?'],
    meta: ['Egyptology forum, 38 replies', 'History questions, 12 replies'],
  },
  { id: 'nyt', site: 'The New York Times', url: 'www.nytimes.com › 2026 › 03', icon: ['#ffffff', '#000000', 'T'], title: 'Archaeologists Find a Shrine to Anubis', snippet: 'A newly excavated site near Saqqara suggests Anubis was worshipped there for centuries.', tag: PAYWALL, lowered: true },
  { id: 'images', kind: 'images', heading: 'Images', lines: ['', '', '', '', '', ''] },
  { id: 'whe', site: 'World History Encyclopedia', url: 'www.worldhistory.org › Anubis', icon: ['#8b1c1c', '#ffffff', 'W'], title: 'Anubis - World History Encyclopedia', snippet: 'Anubis is the Egyptian god of mummification and the afterlife.', tag: REFERENCE, raised: true },
];

// After the ranking step: pinned first, then raised, lowered last. The hidden site
// has left the page by then, so its place doesn't matter.
const RANKED = ['wiki', 'whe', 'fandom', 'brit', 'nyt'];

// In the order the extension names them (CLEANUP in utils/cleanup.ts).
const REMOVED = 'an AI answer, a video panel, a question list, a discussions panel, a news panel, and an image panel';
const SUMMARY = [
  '',
  '',
  `Anubis removed ${REMOVED}.`,
  `Anubis hid 1 of 5 results. It also removed ${REMOVED}.`,
  `Anubis pinned 1, raised 1, lowered 1, and hid 1 of 5 results. It also removed ${REMOVED}.`,
  `Anubis pinned 1, raised 1, lowered 1, and hid 1 of 5 results. It also removed ${REMOVED}.`,
];

// The steps after the heading; the heading is step 1, the page before Anubis.
// The same in a few words, as the extension says it on phones (shortSummary), with
// Details for the rest.
const SHORT = [
  '',
  '',
  'Anubis cleaned up the page.',
  'Anubis changed 1 of 5 results and cleaned up the page.',
  'Anubis changed 4 of 5 results and cleaned up the page.',
  'Anubis changed 4 of 5 results and cleaned up the page.',
];

const STEPS: { title: string; text: string }[] = [
  { title: 'Clutter out', text: 'Anubis strips AI answers, question lists, and the panels in between. You pick which.' },
  { title: 'Done with a site?', text: 'Hide it from the scales beside any result. It’s gone from every search after that, and Show hidden brings it back.' },
  { title: 'Your sites first', text: 'Pin or raise the sites you trust. Lower the ones you put up with. The scales tip to show where each one stands.' },
  { title: 'Know before you click', text: 'Tags from lists mark reference sites, paywalls, and more. The summary says what changed, and Show hidden undoes it.' },
];

// Everything drawn here copies what the extension puts on a search page, so the demo
// shows what people will see. Check it against the extension after changing any of
// these, and update the demo with them:
// - icons: utils/icons.ts (WEIGH_ICONS, LEVEL_ICONS, ICON_ANUBIS), copied because that
//   module needs the extension's APIs;
// - the summary's wording: utils/summary.ts and the summary… messages in
//   public/_locales/en/messages.json; its mark and layout: .summary in
//   entrypoints/content/shadow.css. On phones (600px or less) it's the short form
//   (shortSummary) with Show hidden and Details, and the tags wait behind Details;
// - the labels under a title: renderChips in ui.ts and .chips and .verdict in
//   shadow.css (Raised in gold and Lowered muted, each with its icon; a pinned site
//   has no label, since its button shows the pin);
// - the button on each result: .weigh in shadow.css (muted, and gold only for a
//   pinned site);
// - hidden results: gone from the page, as Remove (the default in Settings →
//   Appearance) does, and counted in the summary. The one-line form (renderHiddenBar
//   in entrypoints/content/ui.ts, .gone in shadow.css) is only for Collapse;
// - what clean-up removes: CLEANUP in utils/cleanup.ts. Only draw panels of those
//   kinds, named in the summary in that order;
// - pinned results: entrypoints/content/page.css (the frame). Lowered results only move, unfaded.

// The button on each result: the balance tipped to the ranking, or the pin.
type Level = 'lower' | 'normal' | 'raise' | 'pin';
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const balance = (left: number, right: number) =>
  svg(
    `<path d="M8 3.2v9.6M5.5 13.2h5"/><path d="M2.6 ${left}L13.4 ${right}"/>` +
      `<path d="M2.6 ${left}L1.2 ${left + 3.6}M2.6 ${left}L4 ${left + 3.6}M13.4 ${right}L12 ${right + 3.6}M13.4 ${right}l1.4 3.6"/>` +
      `<path d="M1 ${left + 3.6}h3.2a1.6 1.6 0 0 1-3.2 0zM11.8 ${right + 3.6}H15a1.6 1.6 0 0 1-3.2 0z"/>`,
  );
const WEIGH: Record<Level, string> = {
  lower: balance(6.4, 3.6),
  normal: balance(5, 5),
  raise: balance(3.6, 6.4),
  pin: svg('<path d="M9.8 2.2l4 4-1.6.5-2.6 2.6.3 3.1-1.2 1.2L5.4 10.3 2.2 13.8M5.4 10.3L2.3 7.2l1.2-1.2 3.1.3 2.6-2.6z"/>'),
};
// A new key on each ranking, so the icon swaps in with a small tip.
// The labels' icons (LEVEL_ICONS) and the summary's mark (ICON_ANUBIS, its eye cut out
// in the page's colour).
const CHIP_ICONS = { raise: svg('<path d="M4 9.5l4-4 4 4"/>'), lower: svg('<path d="M4 6.5l4 4 4-4"/>') };
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="26 14 82 108" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M39.5 19 L55 48 L101 63 Q105 66 100.5 70 L79 72.5 Q63 76 62 88 L62 97 L32 97 Z"/><path fill="currentColor" d="M31 105 L63 105 L65 118 L30 118 Z"/><ellipse cx="67" cy="58" rx="4.2" ry="2.7" transform="rotate(18 67 58)" fill="var(--demo-page)"/></svg>';
const chip = (on: boolean, level: 'raise' | 'lower', text: string) =>
  h('span', { class: ['chip', 'demo-verdict', level, { on }] }, [h('span', { class: 'chip-icon', innerHTML: CHIP_ICONS[level] }), text]);
// The AI answer's mark: a plain four-pointed star in blue and violet, a sketch of
// the one engines put beside their AI answers rather than any engine's own logo.
const SPARKLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><defs><linearGradient id="demo-sparkle" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8df5"/><stop offset="1" stop-color="#9b72cb"/></linearGradient></defs><path fill="url(#demo-sparkle)" d="M8 0c.6 4.2 3.8 7.4 8 8-4.2.6-7.4 3.8-8 8-.6-4.2-3.8-7.4-8-8 4.2-.6 7.4-3.8 8-8z"/></svg>`;
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
  const lowered = !!r.lowered && step >= 4;
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
      fold(raised || lowered || tagged, 'chips', [
        r.raised ? chip(raised, 'raise', 'Raised') : null,
        r.lowered ? chip(lowered, 'lower', 'Lowered') : null,
        r.tag ? h('span', { class: ['chip', { on: tagged }] }, [tag(r.tag)]) : null,
      ]),
      h('div', { class: 'snippet' }, r.snippet),
    ]),
  ]);
}

function renderBlock(b: Block, step: number): VNode {
  const meta = (i: number) => b.meta?.[i] ?? '';
  const body =
    b.kind === 'ai'
      ? [h('p', { class: 'snippet' }, b.lines[0]), h('div', { class: 'sources' }, (b.meta ?? []).map((m) => h('span', { class: 'source' }, m)))]
      : b.kind === 'news'
        ? h('div', { class: 'cards' }, b.lines.map((l, i) => h('div', { class: 'card' }, [h('span', { class: 'card-image' }), h('span', { class: 'card-source' }, meta(i)), h('span', { class: 'card-title' }, l)])))
        : b.kind === 'questions'
          ? h('div', b.lines.map((l) => h('div', { class: 'question' }, l)))
          : b.kind === 'videos'
            ? h('div', { class: 'videos' }, b.lines.map((l, i) => h('div', { class: 'video' }, [h('span', { class: 'thumb' }, [h('span', { class: 'length' }, meta(i))]), h('span', l)])))
            : b.kind === 'discussions'
              ? h('div', b.lines.map((l, i) => h('div', { class: 'thread' }, [h('span', { class: 'forum' }, meta(i)), h('span', { class: 'thread-title' }, l)])))
              : h('div', { class: 'tiles' }, b.lines.map(() => h('span', { class: 'tile' })));
  const heading = h('div', { class: 'block-heading' }, b.kind === 'ai' ? [h('span', { class: 'sparkle', innerHTML: SPARKLE }), b.heading] : b.heading);
  return fold(step < 2, 'demo-block', [heading, body].flat());
}

function renderPage(step: number): VNode {
  // Panels are gone by the ranking step, so they can sit anywhere then.
  const order = (item: Item, i: number) => (step < 4 ? i : isBlock(item) ? -1 : RANKED.indexOf(item.id));
  return h('div', { class: 'demo-page', 'aria-hidden': 'true' }, [
    h('div', { class: 'searchbar' }, [h('span', 'anubis'), h('span', { class: 'lens' })]),
    h('div', { class: 'tabs' }, ['All', 'Images', 'Videos', 'News', 'Maps', 'More'].map((t, i) => h('span', { class: { current: i === 0 } }, t))),
    fold(step >= 2, 'demo-summary', [
      h('p', [
        h('span', { class: 'mark', innerHTML: MARK }),
        h('span', { class: 'long' }, [SUMMARY[step], ' ', h('span', { class: 'demo-link' }, 'Show hidden')]),
        h('span', { class: 'short' }, [
          SHORT[step],
          ' ',
          h('span', { class: 'demo-link' }, 'Show hidden'),
          ' ',
          h('span', { class: 'demo-link' }, 'Details'),
        ]),
      ]),
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
  setup(_, { slots }) {
    const step = ref(1);
    const root = ref<HTMLElement>();
    const track = ref<HTMLElement>();
    const rail = ref<HTMLElement>();
    const fill = ref<HTMLElement>();
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
    // halfway down beside the page, lower on phones, where the page sits above. The
    // line beside the steps runs from the first step's marker to the last one's and
    // fills up to that same line, so it moves with the scroll, not only per step.
    const update = () => {
      frame = 0;
      const headings = [...(track.value?.querySelectorAll<HTMLElement>('.demo-step h2') ?? [])];
      const line = innerHeight * (matchMedia('(min-width: 960px)').matches ? 0.55 : 0.8);
      let current = 1;
      headings.forEach((el, i) => {
        if (el.getBoundingClientRect().top < line) current = i + 2;
      });
      if (track.value && rail.value && fill.value && headings.length) {
        const top = track.value.getBoundingClientRect().top;
        const first = headings[0]!.getBoundingClientRect().top + 14;
        const last = headings[headings.length - 1]!.getBoundingClientRect().top + 14;
        rail.value.style.top = `${first - top}px`;
        rail.value.style.height = `${last - first}px`;
        fill.value.style.height = `${Math.min(Math.max(line - first, 0), last - first)}px`;
      }
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
      h('div', { ref: root, class: 'scroll-demo' }, [
        h('div', { class: ['demo-intro', { active: step.value === 1 }] }, [
          slots.default?.(),
          h('p', { class: 'demo-cue' }, [h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↓'), ' Scroll, and watch Anubis tidy up this search']),
        ]),
        h('div', { class: 'demo-stage' }, [renderPage(step.value)]),
        h('div', { ref: track, class: 'demo-track' }, [
          h('div', { ref: rail, class: 'demo-rail', 'aria-hidden': 'true' }, [h('span', { ref: fill, class: 'demo-rail-fill' })]),
          h(
            'ol',
            { class: 'demo-steps', 'aria-label': 'What Anubis does to a search' },
            STEPS.map((s, i) =>
              h(
                'li',
                {
                  class: ['demo-step', { active: step.value === i + 2, reached: step.value >= i + 2 }],
                  'aria-current': step.value === i + 2 ? 'step' : undefined,
                },
                [h('h2', [h('span', { class: 'demo-marker', 'aria-hidden': 'true' }), h('span', { class: 'demo-step-title' }, s.title)]), h('p', s.text)],
              ),
            ),
          ),
        ]),
      ]);
  },
});
