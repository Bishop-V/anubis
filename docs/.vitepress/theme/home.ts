import { useData, withBase } from 'vitepress';
import { defineComponent, h } from 'vue';
import ScrollDemo from './scroll-demo';

// The homepage, drawn from docs/index.md's frontmatter: the heading and buttons
// open the scroll-driven demo as its first step, beside the page before Anubis;
// then what else Anubis does, as plain text between hairlines rather than cards;
// then a short closing section. Links go through withBase, so they work under the
// site's base path, and the router still follows them without a page load.

type Action = { text: string; link: string; brand?: boolean };
type Highlight = { title: string; details: string; link: string; linkText: string };
type Closing = { title: string; details: string[]; link: string; linkText: string };

export default defineComponent({
  name: 'AnubisHome',
  setup() {
    const { frontmatter } = useData();
    return () => {
      const intro = frontmatter.value.intro as { title: string; lead: string; actions: Action[] } | undefined;
      const highlights = (frontmatter.value.highlights ?? []) as Highlight[];
      const closing = frontmatter.value.closing as Closing | undefined;
      if (!intro) return null;
      return h('div', { class: 'home' }, [
        h(ScrollDemo, null, () => [
          h('h1', { class: 'home-title' }, intro.title),
          h('p', { class: 'home-lead' }, intro.lead),
          h(
            'div',
            { class: 'home-actions' },
            intro.actions.map((a) => h('a', { class: ['home-button', { brand: a.brand }], href: withBase(a.link) }, a.text)),
          ),
        ]),
        highlights.length
          ? h(
              'section',
              { class: 'home-highlights', 'aria-label': 'What else Anubis does' },
              highlights.map((f) =>
                h('div', { class: 'home-highlight' }, [
                  h('h2', f.title),
                  h('p', f.details),
                  h('a', { href: withBase(f.link) }, f.linkText),
                ]),
              ),
            )
          : null,
        closing
          ? h('section', { class: 'home-closing' }, [
              h('div', { class: 'home-closing-inner' }, [
                h('h2', closing.title),
                h('div', [...closing.details.map((d) => h('p', d)), h('a', { href: withBase(closing.link) }, closing.linkText)]),
              ]),
            ])
          : null,
      ]);
    };
  },
});
