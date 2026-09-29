import { h } from 'vue';
import afterDark from '../../img/after-dark.png';
import after from '../../img/after.png';
import beforeDark from '../../img/before-dark.png';
import before from '../../img/before.png';

// The homepage's before and after, below its heading: one search on a test page,
// without and with Anubis, in the site's light or dark mode. `node e2e/run.mjs docs`
// redraws the pictures, and the same pairs as slides in docs/public/.

const shot = (label: string, [light, dark]: [string, string], alt: string, after = false) =>
  h('div', { class: after ? 'shot after' : 'shot' }, [
    h('p', { class: 'label' }, label),
    h('img', { class: 'light-only', src: light, alt, width: 868, height: 920, loading: 'lazy' }),
    h('img', { class: 'dark-only', src: dark, alt, width: 868, height: 920, loading: 'lazy' }),
  ]);

export default function BeforeAfter() {
  return h('figure', { class: 'before-after' }, [
    h('div', { class: 'shots' }, [
      shot(
        'Without Anubis',
        [before, beforeDark],
        'A search for anubis: an AI Overview first, then results including a Fandom wiki, then a video panel.',
      ),
      shot(
        'With Anubis',
        [after, afterDark],
        'The same search with Anubis: a line saying it raised 1 and hid 2 of 7 results and also removed the AI answer and panels, then results tagged Reference or Paywall, with the Fandom wiki shown as hidden by your list.',
        true,
      ),
    ]),
    h('figcaption', 'The same search, without and with Anubis: it removed the AI answer and panels, hid a site you don’t want and tagged the rest. Shown on a test page.'),
  ]);
}
