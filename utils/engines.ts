// Search engine definitions. This file is imported at build time to generate the
// manifest's content script matches, so keep it free of browser APIs.
//
// Results are found one of two ways:
//
//   Structural (`heading`): find each title heading, take the link around it, and
//   climb to the smallest ancestor that holds only that one result. This survives
//   class-name churn, which is why Google and DuckDuckGo use it.
//
//   Selector (`item` + `link`): for engines whose titles aren't headings (Brave,
//   Kagi…) or whose layout is a table (DuckDuckGo Lite).
//
// When an engine breaks, compare against uBlacklist's maintained definitions:
// https://github.com/ublacklist/builtin/tree/main/serpinfo

export interface EngineDef {
  id: string;
  name: string;
  /** Content script match patterns. */
  matches: string[];
  /** Picks the engine at runtime from `location.hostname`. */
  host: RegExp;
  /** Only act on result pages. Re-checked each pass, since some engines navigate with the History API. */
  isResultsPage(url: URL): boolean;
  /** Structural detection: the heading element holding each result title. */
  heading?: string;
  /** Never climb to or past these elements when looking for a result's container. */
  boundary?: string;
  /** Selector detection: one element per result… */
  item?: string;
  /** …the result link inside it… */
  link?: string;
  /** …and its title element. */
  title?: string;
  /** Elements showing the displayed domain, used when the link is a tracking redirect. */
  displayed?: string;
  /**
   * Marks each block in the results column (a result, a video panel, "People also
   * ask"). Clean-up removes the whole marked block around a heading it recognises.
   */
  blocks?: string;
  /** Sibling rows that belong to the same result (table layouts). */
  extraRows?: number;
  /** Results are table rows: hide rows instead of collapsing, and don't rerank. */
  table?: boolean;
  /** Where the weigh button sits in the top-right corner of each result. */
  button?: { top: string; right: string };
  /** How "Weigh deeper" gets more results onto the page. */
  more?: MoreResults;
  /** Changes for the phone layout some engines send to mobile browsers (Firefox for Android). */
  mobile?: Partial<Omit<EngineDef, 'id' | 'name' | 'matches' | 'host' | 'mobile'>>;
}

/**
 * - `click`: press the engine's own "More results" button; the page loads them itself.
 * - `link`: fetch the page the "Next" link points to and bring its results over.
 * - `param`: same, building the next page's URL from a page-number parameter.
 */
export type MoreResults =
  | { kind: 'click'; button: string }
  | { kind: 'link'; next: string }
  | { kind: 'param'; name: string; first: number; step: number };

const GOOGLE_TLDS = `ad ae al am as at az ba be bf bg bi bj bs bt by ca cat cd cf cg ch ci cl cm cn co.ao co.bw co.ck
co.cr co.id co.il co.in co.jp co.ke co.kr co.ls co.ma co.mz co.nz co.th co.tz co.ug co.uk co.uz co.ve co.vi co.za co.zm
co.zw com com.af com.ag com.ar com.au com.bd com.bh com.bn com.bo com.br com.bz com.co com.cu com.cy com.do com.ec com.eg
com.et com.fj com.gh com.gi com.gt com.hk com.jm com.kh com.kw com.lb com.ly com.mm com.mt com.mx com.my com.na com.ng
com.ni com.np com.om com.pa com.pe com.pg com.ph com.pk com.pr com.py com.qa com.sa com.sb com.sg com.sl com.sv com.tj
com.tr com.tw com.ua com.uy com.vc com.vn cv cz de dj dk dm dz ee es fi fm fr ga ge gg gl gm gr gy hn hr ht hu ie im iq
is it je jo kg ki kz la li lk lt lu lv md me mg mk ml mn mu mv mw ne nl no nr nu pl pn ps pt ro rs ru rw sc se sh si sk
sm sn so sr st td tg tl tm tn to tt vu ws`.split(/\s+/);

const hasQuery = (url: URL, ...keys: string[]) => keys.some((k) => url.searchParams.get(k));

export const ENGINES: EngineDef[] = [
  {
    id: 'google',
    name: 'Google',
    // The whole site, not just /search: Google moves from its home page to results
    // with the History API, and a script matching only /search* is never injected.
    matches: GOOGLE_TLDS.map((tld) => `*://www.google.${tld}/*`),
    host: /^www\.google\.[a-z.]+$/,
    // Web results only; images (udm=2, tbm=isch) and shopping use other layouts.
    isResultsPage: (url) =>
      url.pathname === '/search' && !/^(2|28|imgs)$/.test(url.searchParams.get('udm') ?? '') && !url.searchParams.get('tbm'),
    heading: 'h3',
    boundary: '#search, #rso, #botstuff, main, [role="main"]',
    displayed: 'cite',
    // Seen on a live page (2026-09): div.A6K0A[data-rpos] inside each panel's div.MjjYud.
    blocks: '[data-rpos]',
    button: { top: '2px', right: '2px' },
    more: { kind: 'link', next: 'a#pnnext' },
    // On phones, titles are ARIA headings rather than h3 and the address isn't a
    // <cite>. From uBlacklist's "Web (mobile)" rules; unverified on a live page.
    // Top stories cards have the same headings, so they're left out. The phone
    // layout's paging is unknown, so Load more results waits until it's checked.
    mobile: {
      heading: 'h3, [role="heading"][aria-level="3"]:not([data-news-cluster-id] *)',
      displayed: 'cite, .ob9lvb',
      button: { top: '12px', right: '12px' },
      more: undefined,
    },
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    matches: [
      '*://duckduckgo.com/*',
      '*://safe.duckduckgo.com/*',
      '*://start.duckduckgo.com/*',
      '*://noai.duckduckgo.com/*',
    ],
    host: /^(safe\.|start\.|noai\.)?duckduckgo\.com$/,
    isResultsPage: (url) => hasQuery(url, 'q'),
    heading: 'h2',
    boundary: 'ol, main, [data-testid="web-vertical"]',
    // Clear of DuckDuckGo's own result menu in the corner.
    button: { top: '6px', right: '36px' },
    more: { kind: 'click', button: '#more-results, button[data-testid="more-results"]' },
  },
  {
    id: 'duckduckgo-html',
    name: 'DuckDuckGo (HTML)',
    matches: ['*://html.duckduckgo.com/*'],
    host: /^html\.duckduckgo\.com$/,
    isResultsPage: (url) => url.pathname.startsWith('/html'),
    item: '.result:not(.result--ad)',
    link: 'a.result__a',
    title: '.result__a',
    displayed: '.result__url',
    button: { top: '4px', right: '4px' },
  },
  {
    id: 'duckduckgo-lite',
    name: 'DuckDuckGo (Lite)',
    matches: ['*://lite.duckduckgo.com/*'],
    host: /^lite\.duckduckgo\.com$/,
    isResultsPage: (url) => url.pathname.startsWith('/lite'),
    item: 'tr:has(.result-link)',
    link: 'a.result-link',
    title: 'a.result-link',
    displayed: '.link-text',
    extraRows: 3,
    table: true,
  },
  {
    id: 'bing',
    name: 'Bing',
    matches: ['*://www.bing.com/*', '*://cn.bing.com/*'],
    host: /^(www|cn)\.bing\.com$/,
    isResultsPage: (url) => url.pathname === '/search',
    item: '#b_results > li.b_algo',
    link: 'h2 a',
    title: 'h2',
    displayed: '.b_attribution cite, cite',
    button: { top: '4px', right: '4px' },
    more: { kind: 'link', next: 'a.sb_pagN, a[title="Next page"]' },
  },
  {
    id: 'brave',
    name: 'Brave Search',
    matches: ['*://search.brave.com/*'],
    host: /^search\.brave\.com$/,
    isResultsPage: (url) => url.pathname === '/search',
    item: '.snippet[data-type="web"]',
    link: 'a',
    title: '.title',
    button: { top: '4px', right: '4px' },
    // Brave numbers pages from 0 in `offset`.
    more: { kind: 'param', name: 'offset', first: 0, step: 1 },
  },
  {
    id: 'startpage',
    name: 'Startpage',
    matches: ['*://*.startpage.com/*'],
    host: /(^|\.)startpage\.com$/,
    isResultsPage: (url) => /^\/(do|rvd|sp)\//.test(url.pathname),
    item: ':is(.w-gl, .w-bg) > .result',
    link: 'a.result-link',
    title: 'h2',
    button: { top: '4px', right: '4px' },
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    matches: ['*://www.ecosia.org/*'],
    host: /^www\.ecosia\.org$/,
    isResultsPage: (url) => url.pathname === '/search',
    item: '.result',
    link: 'a.result__link',
    title: 'h2',
    button: { top: '4px', right: '20px' },
    more: { kind: 'param', name: 'p', first: 0, step: 1 },
  },
  {
    id: 'kagi',
    name: 'Kagi',
    matches: ['*://kagi.com/*'],
    host: /^kagi\.com$/,
    isResultsPage: (url) => url.pathname === '/search',
    // Kagi publishes these classes specifically for extensions.
    item: '._ext_ub_r',
    link: '._ext_ub_u',
    title: '._ext_ub_t',
    button: { top: '0', right: '0' },
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    matches: ['*://search.yahoo.com/*', '*://*.search.yahoo.com/*'],
    host: /(^|\.)search\.yahoo\.com$/,
    isResultsPage: (url) => url.pathname.startsWith('/search'),
    heading: 'h3',
    boundary: '#web, ol, main',
    displayed: '.compTitle span, cite',
    button: { top: '2px', right: '2px' },
    more: { kind: 'link', next: 'a.next' },
  },
  {
    id: 'yandex',
    name: 'Yandex',
    matches: ['*://yandex.com/*', '*://yandex.ru/*', '*://yandex.com.tr/*', '*://ya.ru/*'],
    host: /^(yandex\.(com|ru|com\.tr)|ya\.ru)$/,
    isResultsPage: (url) => /^\/search\/?$/.test(url.pathname),
    item: 'li:has(> .Organic), .serp-item:has(.Organic)',
    link: '.Organic a',
    title: 'h2',
    button: { top: '4px', right: '24px' },
  },
  {
    id: 'mojeek',
    name: 'Mojeek',
    matches: ['*://www.mojeek.com/*'],
    host: /^www\.mojeek\.com$/,
    isResultsPage: (url) => url.pathname === '/search',
    heading: 'h2',
    boundary: 'ul, main',
    button: { top: '2px', right: '2px' },
  },
];

export const ENGINE_MATCHES = ENGINES.flatMap((e) => e.matches);

/** The engine for a site, with its phone layout's changes when `mobile` is set. */
export function engineFor(hostname: string, mobile = false): EngineDef | undefined {
  const engine = ENGINES.find((e) => e.host.test(hostname));
  return engine && mobile && engine.mobile ? { ...engine, ...engine.mobile } : engine;
}

/** Whether a user agent is a phone's, the way engines decide which layout to send. */
export const isMobileAgent = (userAgent: string): boolean => /\bMobi/.test(userAgent);
