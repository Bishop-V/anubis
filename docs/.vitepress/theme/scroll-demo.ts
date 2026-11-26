import { SPARKLE } from './demo-icons';
import { useData } from 'vitepress';
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, type VNode } from 'vue';
import { columnButton, tagMark } from './demo-parts';
import { PAYWALL, REFERENCE, SCROLL_ITEMS as ITEMS, SCROLL_RANKED as RANKED, SCROLL_SHORT as SHORT, SCROLL_STEPS as STEPS, SCROLL_SUMMARY as SUMMARY, type Tag, type ScrollBlock as Block, type ScrollItem as Item, type ScrollResult as Result } from './demo-data';

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

// Everything drawn here copies what the extension puts on a search page, so the demo
// shows what people will see. Check it against the extension after changing any of
// these, and update the demo with them:
// - icons: utils/icons.ts (LEVEL_ICONS), copied because that module needs the
//   extension's APIs;
// - the summary's wording: utils/summary.ts and the summary… messages in
//   public/_locales/en/messages.json; its layout: .summary in
//   entrypoints/content/shadow.css. On phones (600px or less) it's the short form
//   (shortSummary) with Show hidden and Details, and the tags wait behind Details;
// - the tags under a title: renderChips in ui.ts, tagMark in utils/icons.ts, and
//   .chips and .gem-mark in shadow.css (a tag that raises or lowers the result shows
//   that sign in its diamond's place; there's no separate Raised or Lowered label);
// - the button on each result: column.ts and .weigh.column in shadow.css, drawn by
//   columnButton() in demo-parts.ts (greys only);
// - hidden results: gone from the page, as Remove (the default in Settings →
//   Appearance) does, and counted in the summary. The one-line form (renderHiddenBar
//   in entrypoints/content/ui.ts, .gone in shadow.css) is only for Collapse;
// - what clean-up removes: CLEANUP in utils/cleanup.ts. Only draw panels of those
//   kinds, named in the summary in that order;
// - pinned results: .pin-frame in shadow.css (the frame, grey, taking in the button). Lowered results only move, unfaded.

type Level = 'lower' | 'normal' | 'raise' | 'pin';
// The AI answer's mark: a plain four-pointed star in blue and violet, a sketch of
// the one engines put beside their AI answers rather than any engine's own logo.

const isBlock = (item: Item): item is Block => 'heading' in item;

// Something that folds away or opens up: its height animates between none and its own.
const fold = (open: boolean, cls: string, children: (VNode | string | null)[] | VNode) =>
  h('div', { class: ['fold', cls, { open }] }, [h('div', { class: 'fold-inner' }, children)]);

const tag = (t: Tag, n?: number, effect?: 'raise' | 'lower') => tagMark(t.name, t.color, n, effect);

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
        columnButton(level),
        h('span', { class: 'favicon', style: { background: r.icon[0], color: r.icon[1] } }, r.icon[2]),
        h('span', { class: 'site-name' }, r.site),
        h('span', { class: 'url' }, r.url),
      ]),
      h('div', { class: 'title' }, r.title),
      // The tag that moved the result shows how, once it has.
      fold(tagged, 'chips', [r.tag ? h('span', { class: ['chip', { on: tagged }] }, [tag(r.tag, undefined, raised ? 'raise' : lowered ? 'lower' : undefined)]) : null]),
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
    // The page's own words, for a translated home page (docs/vi/index.md): its front
    // matter's `demo` has `cue`, `label`, and `steps`. The mock search page stays in
    // English, like the screenshots.
    const { frontmatter } = useData();
    const words = () =>
      (frontmatter.value.demo ?? {}) as { cue?: string; label?: string; steps?: { title: string; text: string }[] };
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
          h('p', { class: 'demo-cue' }, [h('span', { class: 'arrow', 'aria-hidden': 'true' }, '↓'), ` ${words().cue ?? 'Scroll, and watch Anubis tidy up this search'}`]),
        ]),
        h('div', { class: 'demo-stage' }, [renderPage(step.value)]),
        h('div', { ref: track, class: 'demo-track' }, [
          h('div', { ref: rail, class: 'demo-rail', 'aria-hidden': 'true' }, [h('span', { ref: fill, class: 'demo-rail-fill' })]),
          h(
            'ol',
            { class: 'demo-steps', 'aria-label': words().label ?? 'What Anubis does to a search' },
            STEPS.map((english, i) => {
              const s = words().steps?.[i] ?? english;
              return h(
                'li',
                {
                  class: ['demo-step', { active: step.value === i + 2, reached: step.value >= i + 2 }],
                  'aria-current': step.value === i + 2 ? 'step' : undefined,
                },
                [h('h2', [h('span', { class: 'demo-marker', 'aria-hidden': 'true' }), h('span', { class: 'demo-step-title' }, s.title)]), h('p', s.text)],
              );
            }),
          ),
        ]),
      ]);
  },
});
