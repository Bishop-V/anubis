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
    expect(engineFor('search.brave.com', true)).toBe(engineFor('search.brave.com'));
  });

  it('puts the button on the title line on phones, clear of the engine\'s menu', () => {
    for (const host of ['www.google.com', 'duckduckgo.com', 'www.bing.com']) {
      expect(engineFor(host, true)!.button?.onTitle).toBe(true);
      expect(engineFor(host)!.button?.onTitle).toBeUndefined();
    }
  });

  it('finds Bing results on phones, where the title is inside the link', () => {
    const bing = engineFor('www.bing.com', true)!;
    const { document } = parseHTML(`<body><ol id="b_results"><li class="b_algo">
      <div class="b_algoheader"><a href="https://www.speedtest.net/"><div class="tptt">Speedtest</div><h2>Test</h2></a></div>
    </li></ol></body>`);
    const item = document.querySelector(bing.item!)!;
    expect(item.querySelector(bing.link!)!.getAttribute('href')).toBe('https://www.speedtest.net/');
    expect(item.querySelector(bing.title!)!.textContent).toBe('Test');
    // The computer layout's link selector finds nothing there.
    expect(item.querySelector(engineFor('www.bing.com')!.link!)).toBeNull();
  });
});

describe('Kagi', () => {
  const kagi = engineFor('kagi.com')!;

  it('leaves out the widgets that carry result classes', () => {
    const { document } = parseHTML(`<body>
      <div class="_ext_ub_r search-result" id="web"></div>
      <div class="widget list-widget"><div class="_ext_ub_r widgetItem" id="past"></div></div>
      <div class="_ext_ub_r widget" id="widget"></div>
      <div class="widget-simple"><div><div class="_ext_ub_r" id="simple"></div></div></div>
      <div class="inline-content"><div class="_ext_ub_r" id="inline"></div></div>
      <div class="_ext_ub_r" id="row"><div class="widgetItemTitle"></div></div>
      <div id="web_archive" class="list-widget inline-content"><div class="widget-simple"><div class="widgetItem _0_SRI flex-column _ext_ub_r" id="blast"></div></div></div>
      <main id="main"><div class="new-user-onboarding-banner"></div><div id="page0"><div id="layout-v2"><div class="sri-group _ext_ub_r" id="group"></div></div></div></main></body>`);
    expect(document.querySelector('#layout-v2')!.closest(kagi.boundary!)!.firstElementChild!.className).toBe('new-user-onboarding-banner');
    const found = [...document.querySelectorAll(kagi.item!)].map((el) => el.id);
    expect(found).toEqual(['web', 'group']);
  });

  it('finds the video panel for clean-up', () => {
    const { document } = parseHTML('<body><div class="headerVideos inline-content"><a class="inlineHeader">Videos</a></div></body>');
    expect(document.querySelectorAll(kagi.cleanupSelectors!.videos!)).toHaveLength(1);
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

describe('Mojeek', () => {
  it('loads more results by the number of the first result on each page', () => {
    expect(engineFor('www.mojeek.com')!.more).toEqual({ kind: 'param', name: 's', first: 1, step: 10 });
  });

  it("tells one page of results from another by that number", () => {
    expect(sameSearch('https://www.mojeek.com/search?q=terraria', 'https://www.mojeek.com/search?q=terraria&s=11')).toBe(false);
    expect(sameSearch('https://www.mojeek.com/search?q=terraria&s=11', 'https://www.mojeek.com/search?q=terraria&s=11')).toBe(true);
  });
});
