import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { restyle, styleBook } from '../utils/restyle';

// Startpage names its styles from a hash, and a fetched page's hashes differ from the page's own.
const result = (hash: string, label = '') =>
  parseHTML(
    `<div class="result css-${hash}-WGl"><div class="upper css-u${hash}"><a class="result-title result-link css-t${hash}">T</a></div>${label}<div><p class="description css-d${hash}">D</p></div></div>`,
  ).document.querySelector('.result') as unknown as HTMLElement;

describe('restyle', () => {
  it('gives a fetched result the generated classes of the results already on the page', () => {
    const mine = result('A');
    const fetched = result('B');
    restyle(fetched, styleBook([mine]));
    expect(fetched.className).toBe('result css-A-WGl');
    expect(fetched.querySelector('.result-title')!.className).toBe('result-title result-link css-tA');
    expect(fetched.querySelector('.description')!.className).toBe('description css-dA');
  });

  it('keeps the classes of an element the page has no match for', () => {
    const fetched = result('B', '<span class="extra css-xB">x</span>');
    restyle(fetched, styleBook([result('A')]));
    expect(fetched.querySelector('.extra')!.className).toBe('extra css-xB');
    expect(fetched.querySelector('.description')!.className).toBe('description css-dA');
  });

  it('ignores results that were themselves fetched', () => {
    const fetched = result('B');
    fetched.setAttribute('data-anubis-page', '2');
    expect(styleBook([fetched]).size).toBe(0);
  });
});
