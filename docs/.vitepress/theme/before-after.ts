import { h } from 'vue';
import after from '../../img/after.png';
import before from '../../img/before.png';

// The homepage's before and after, between its heading and the features: one search
// on a test page, without and with Anubis. `node e2e/run.mjs docs` redraws both
// pictures, and the same pair as a slide in docs/public/before-after.png.

const shot = (label: string, src: string, alt: string, after = false) =>
  h('div', { class: after ? 'shot after' : 'shot' }, [
    h('p', { class: 'label' }, label),
    h('img', { src, alt, width: 720, height: 880 }),
  ]);

export default function BeforeAfter() {
  return h('figure', { class: 'before-after' }, [
    h('div', { class: 'shots' }, [
      shot(
        'Without Anubis',
        before,
        'A search for anubis: an AI Overview first, then results including a Fandom wiki, then a video panel.',
      ),
      shot(
        'With Anubis',
        after,
        'The same search with Anubis: a line saying it raised 1 and hid 2 of 7 results and removed the AI answer and panels, then results tagged Reference or Paywall, with the Fandom wiki shown as hidden by your list.',
        true,
      ),
    ]),
    h('figcaption', 'The same search, without and with Anubis: it removed the AI answer and panels, hid a site you don’t want and tagged the rest. Shown on a test page.'),
  ]);
}
