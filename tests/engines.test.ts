import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { engineFor, isMobileAgent, sameSearch } from '@/utils/engines';

describe('engines', () => {
  it('tells phones from computers by their user agent', () => {
    expect(isMobileAgent('Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0')).toBe(true);
    expect(isMobileAgent('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36')).toBe(true);
    // Tablets get the computer layout.
    expect(isMobileAgent('Mozilla/5.0 (Android 15; Tablet; rv:143.0) Gecko/143.0 Firefox/143.0')).toBe(false);
    expect(isMobileAgent('Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0')).toBe(false);
  });

  it('applies the phone layout only on phones', () => {
    const desktop = engineFor('www.google.com')!;
    const phone = engineFor('www.google.com', true)!;
    expect(desktop.heading).toBe('h3');
    expect(phone.heading).toContain('[role="heading"][aria-level="3"]');
    expect(phone.id).toBe('google');
    expect(desktop.more).toBeDefined();
    expect(phone.more).toBeUndefined();
    // Engines without a phone layout are the same either way.
    expect(engineFor('duckduckgo.com', true)).toBe(engineFor('duckduckgo.com'));
  });
});

describe('Kagi', () => {
  const kagi = engineFor('kagi.com')!;

  it('leaves out the widgets that carry result classes', () => {
    const { document } = parseHTML(`<body>
      <div class="_ext_ub_r search-result" id="web"></div>
      <div class="widget list-widget"><div class="_ext_ub_r widgetItem" id="past"></div></div>
      <div class="_ext_ub_r widget" id="widget"></div></body>`);
    const found = [...document.querySelectorAll(kagi.item!)].map((el) => el.id);
    expect(found).toEqual(['web']);
  });

  it('puts tags under the title row and the button beside the menu', () => {
    expect(kagi.chipsBelowRow).toBe(true);
    expect(kagi.button?.besideMenu).toBe(true);
  });
});

describe('sameSearch', () => {
  it('ignores details an engine adds to its address after loading', () => {
    expect(sameSearch('https://www.google.com/search?q=anubis', 'https://www.google.com/search?q=anubis&sei=abc&ved=2ah')).toBe(true);
  });

  it('tells a new query, tab, or page apart', () => {
    expect(sameSearch('https://duckduckgo.com/?q=anubis', 'https://duckduckgo.com/?q=jackal')).toBe(false);
    expect(sameSearch('https://duckduckgo.com/?q=anubis&ia=web', 'https://duckduckgo.com/?q=anubis&ia=images')).toBe(false);
    expect(sameSearch('https://www.google.com/search?q=anubis', 'https://www.google.com/search?q=anubis&start=10')).toBe(false);
    expect(sameSearch('https://www.google.com/search?q=anubis', 'https://www.google.com/webhp?q=anubis')).toBe(false);
  });
});
