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

import type { CleanupKind } from './cleanup';

/** One kind of card on an engine's other tabs (`EngineDef.cards`). */
export interface CardDef {
  item: string;
  /** The link in the card, which the ⚖ button goes after. Defaults to the first link. */
  link?: string;
  title: string;
  /** Where the site's name is, when the link goes through the engine. */
  displayed?: string;
  /** Limits this kind to the tab it's for, where its selector would also match a panel on the web tab. */
  when?: (url: URL) => boolean;
  /** On this tab the web results' finder doesn't run: the cards are all there is. */
  replacesResults?: boolean;
  /**
   * Where the card's address is when it isn't a link: the first of these that holds a
   * web address wins. `from` is a selector inside the card (the card itself when
   * left out), `attr` the attribute, and `match` picks the address out of it (the
   * first group).
   */
  address?: { from?: string; attr: string; match?: RegExp }[];
}

/** A site's icon that the engine's own script fetches and draws; results brought over by Load more results never get it. */
export interface IconDef {
  /** The element in a result the icon goes in. */
  holder: string;
  /** Where the icon comes from, for a result's site and the page's theme. */
  src: (origin: string, dark: boolean) => string;
  /** The class the engine gives its icon image. */
  img: string;
  /** A class on the holder that says no icon has loaded yet; the image takes it off. */
  fallback?: string;
}

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
  /**
   * The engine's paid blocks (Yahoo's top ads), which look like results but aren't: they are never weighed
   * and carry no button, and the Ads switch in Settings → Remove panels removes them.
   */
  ads?: string;
  /**
   * Milliseconds to leave the page alone after it has loaded. For engines that build their page in the
   * browser (Ecosia): an element added before it has finished breaks it, so results never arrive and
   * the side panel is missing.
   */
  settle?: number;
  /** Engine-specific selectors for clean-up blocks that headings cannot identify. */
  cleanupSelectors?: Partial<Record<CleanupKind, string>>;
  /**
   * A class that results brought over by Load more results are given. For engines
   * whose own script reveals each result as it scrolls into view (Ecosia hides a
   * result until `--visible` is added), which never runs for results added this way.
   */
  loadedClass?: string;
  /**
   * False for engines that won't load in a frame, so Load more results doesn't try a page it was refused in a
   * hidden one (Ecosia forbids framing: `frame-ancestors`, seen on a live page, 2026-10-15).
   */
  frames?: false;
  /** How to draw each site's icon in results brought over by Load more results (Ecosia's own script does it for its own). */
  icon?: IconDef;
  /**
   * Results brought over by Load more results are drawn with the classes of the
   * results already here. For engines that name their styles from a hash and render
   * a fetched page in another theme (Startpage's light one), so the same title has
   * a different class there and a different colour.
   */
  restyle?: boolean;
  /** Sibling rows that belong to the same result (table layouts). */
  extraRows?: number;
  /** Results are table rows: hide rows instead of collapsing, and don't rerank. */
  table?: boolean;
  /**
   * Where the weigh button sits in the top-right corner of each result. With
   * `underMenu`, it sits just under the engine's own menu button on the result
   * (DuckDuckGo's ⋯) instead, at its size and in its colour, like a second option;
   * `top` and `right` apply when a result has no such button (Yandex). `popOut` is the
   * selector of the result's card, when it is narrower than the result: the result
   * menu opens to the right of the result (or the card), level with its top, and
   * falls back to under the button when the window has no room. With `besideMenu`, it sits just right of the engine's
   * menu button instead, level with it, at its size and in its colour. With `onTitle` (phone
   * layouts), it sits on the title's first line instead, under the engine's menu button where
   * the result has one, and titles keep clear of it: on a phone the corner is the engine's
   * menu's, and the space beside it is off the screen.
   */
  button?: { top: string; right: string; underMenu?: boolean; besideMenu?: boolean; popOut?: string; onTitle?: boolean };
  /**
   * Tags go on their own line under the title's row, not in it. For engines whose
   * title row is a flex row that cuts the title off (with an ellipsis) to make room.
   */
  chipsBelowRow?: boolean;
  /**
   * Result cards on the engine's other tabs (images, videos, news), found by
   * selector, as uBlacklist's rules find them. They're hidden and tagged, but not
   * reranked, and hidden ones go without a line in their place.
   */
  cards?: CardDef[];
  /** How "Load more results" gets more results onto the page. */
  more?: MoreResults;
  /** Changes for the phone layout some engines send to mobile browsers (Firefox for Android). */
  mobile?: Partial<Omit<EngineDef, 'id' | 'name' | 'matches' | 'host' | 'mobile'>>;
}

/**
 * - `click`: press the engine's own "More results" button; the page loads them itself.
 * - `link`: fetch the page the "Next" link points to and bring its results over. `drop` names address
 *   parameters to leave out of it (Bing's `rdr` marks a page as already redirected, and Bing answers a
 *   Next link that carries it with the same page again).
 * - `param`: same, building the next page's URL from a page-number parameter.
 * - `form`: the pager is a form per page number (Startpage, which posts its searches,
 *   so the address alone can't find page 2): post the one for the next page.
 */
export type MoreResults =
  | { kind: 'click'; button: string }
  | { kind: 'link'; next: string; drop?: string[] }
  | { kind: 'form'; form: string }
  | { kind: 'param'; name: string; first: number; step: number };

const GOOGLE_TLDS = `ad ae al am as at az ba be bf bg bi bj bs bt by ca cat cd cf cg ch ci cl cm cn co.ao co.bw co.ck
co.cr co.id co.il co.in co.jp co.ke co.kr co.ls co.ma co.mz co.nz co.th co.tz co.ug co.uk co.uz co.ve co.vi co.za co.zm
co.zw com com.af com.ag com.ar com.au com.bd com.bh com.bn com.bo com.br com.bz com.co com.cu com.cy com.do com.ec com.eg
com.et com.fj com.gh com.gi com.gt com.hk com.jm com.kh com.kw com.lb com.ly com.mm com.mt com.mx com.my com.na com.ng
com.ni com.np com.om com.pa com.pe com.pg com.ph com.pk com.pr com.py com.qa com.sa com.sb com.sg com.sl com.sv com.tj
com.tr com.tw com.ua com.uy com.vc com.vn cv cz de dj dk dm dz ee es fi fm fr ga ge gg gl gm gr gy hn hr ht hu ie im iq
is it je jo kg ki kz la li lk lt lu lv md me mg mk ml mn mu mv mw ne nl no nr nu pl pn ps pt ro rs ru rw sc se sh si sk
sm sn so sr st td tg tl tm tn to tt vu ws`.split(/\s+/);

// The countries uBlacklist lists for Yandex (upstream/serpinfo/yandex.yml).
const YANDEX_TLDS = 'az by co.il com com.am com.ge com.tr ee eu kz lt lv md ru tj tm uz'.split(' ');

const hasQuery = (url: URL, ...keys: string[]) => keys.some((k) => url.searchParams.get(k));
const googleImages = (url: URL) => /^(2|imgs)$/.test(url.searchParams.get('udm') ?? '');
const googleNews = (url: URL) => url.searchParams.get('tbm') === 'nws';
const onPath = (pattern: RegExp) => (url: URL) => pattern.test(url.pathname);

export const ENGINES: EngineDef[] = [
  {
    id: 'google',
    name: 'Google',
    // The whole site, not just /search: Google moves from its home page to results
    // with the History API, and a script matching only /search* is never injected.
    matches: GOOGLE_TLDS.map((tld) => `*://www.google.${tld}/*`),
    host: /^www\.google\.[a-z.]+$/,
    // The web results, and the Images (udm=2) and News (tbm=nws) tabs, which have cards. Shopping and the
    // other tabs use layouts nothing here has seen. Videos (udm=7) lists results the way the web does.
    isResultsPage: (url) =>
      url.pathname === '/search' && (googleImages(url) || googleNews(url) || (url.searchParams.get('udm') !== '28' && !url.searchParams.get('tbm'))),
    heading: 'h3',
    boundary: '#search, #rso, #botstuff, main, [role="main"]',
    displayed: 'cite',
    // The Images and News tabs, from uBlacklist's rules (unverified on a live page). An image's address is
    // the link's if it goes to the site itself, else the `data-lpage` of its picture.
    cards: [
      {
        item: '.kb0PBd:has(.ivg-i)',
        link: '.LBcIee',
        title: '.ddBkwd',
        address: [{ from: '.LBcIee', attr: 'href' }, { from: '.ivg-i', attr: 'data-lpage' }],
        when: googleImages,
        replacesResults: true,
      },
      { item: '[data-news-cluster-id]', link: 'a', title: '[role="heading"][aria-level="3"]', when: googleNews, replacesResults: true },
    ],
    // Seen on a live page (2026-09): div.A6K0A[data-rpos] inside each panel's div.MjjYud.
    blocks: '[data-rpos]',
    cleanupSelectors: { ai: '[data-attrid="AIOverview"], .M8OgIe, .YzCcne', questions: '.related-question-pair' },
    button: { top: '2px', right: '2px' },
    more: { kind: 'link', next: 'a#pnnext' },
    // On phones, titles are ARIA headings rather than h3 and the address isn't a
    // <cite>. From uBlacklist's "Web (mobile)" rules; unverified on a live page.
    // Top stories cards have the same headings, so they're left out. The phone
    // layout's paging is unknown, so Load more results waits until it's checked.
    mobile: {
      heading: 'h3, [role="heading"][aria-level="3"]:not([data-news-cluster-id] *)',
      displayed: 'cite, .ob9lvb',
      button: { top: '12px', right: '12px', onTitle: true },
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
    // Web results are in the web-vertical list (uBlacklist's rules); the side
    // panel's heading links to a site too, and isn't a result.
    heading: '[data-testid="web-vertical"] li > article h2',
    boundary: 'ol, main, [data-testid="web-vertical"], [data-testid="zci-images"], [data-testid="zci-videos"], [data-testid="news-vertical"]',
    // The Images, Videos, and News tabs, from uBlacklist's rules.
    cards: [
      { item: '[data-testid="zci-images"] li:has(> figure)', link: 'figcaption > a', title: 'figcaption > a > p' },
      { item: '[data-testid="zci-videos"] li:has(> a > article)', link: 'a', title: 'h2' },
      { item: '[data-testid="news-vertical"] li:has(> article)', link: 'article > a', title: 'h2' },
    ],
    cleanupSelectors: { ai: '[data-testid="duckassist-answer-content"], [data-react-module-id="wikinlp"]' },
    // Right of DuckDuckGo's own ⋯ menu on each result, as a second option: under
    // it, the button sat on the thumbnails some results have below the menu.
    button: { top: '6px', right: '36px', besideMenu: true },
    more: { kind: 'click', button: '#more-results, button[data-testid="more-results"]' },
    // On phones the results are found the same way (uBlacklist's "Web (mobile)" rules), but
    // the ⋯ menu is at the screen's edge, so the button beside it was off the screen.
    mobile: { button: { top: '10px', right: '0', onTitle: true } },
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
    matches: ['*://www.bing.com/*', '*://www2.bing.com/*', '*://www4.bing.com/*', '*://cn.bing.com/*'],
    host: /^(www[24]?|cn)\.bing\.com$/,
    isResultsPage: (url) => /^\/(search|(images|videos|news)\/search)$/.test(url.pathname),
    // Paid blocks: text ads (`li.b_ad.b_adBottom`) and product-ads carousels (`li.b_PolePAContainer` holding
    // `.pa_carousel_mlo`, in `#b_pole` at the top), as a live page showed them (2026-10-15).
    ads: '.b_ad, .b_adTop, .b_adBottom, .b_PolePAContainer, .pa_carousel_mlo',
    item: '#b_results > li.b_algo',
    link: 'h2 a',
    title: 'h2',
    displayed: '.b_attribution cite, cite',
    // On phones the title's h2 is inside the link, which also holds the site's name and
    // address (uBlacklist's "Web (mobile)" rules; unverified on a live page).
    mobile: { item: '.b_algo', link: '.b_algoheader > a, h2 a', button: { top: '0', right: '0', onTitle: true } },
    // Bing's AI answer (seen on a live page, 2026-09-29): the answer is in
    // .cht_container, with a .cht_disclaimer, and has no heading to go by.
    cleanupSelectors: { ai: '.cht_container, .cht_disclaimer' },
    // The Images, Videos, and News tabs, from uBlacklist's rules (unverified on a live page). A picture's address is
    // in the `purl` of its link's `m` data, and a video's in the `ourl` of its link.
    cards: [
      {
        item: ':has(> .iuscp)',
        link: '.iusc',
        title: '.iusc',
        address: [{ from: '.iusc', attr: 'm', match: /"purl":"([^"]+)/ }],
        when: onPath(/^\/images\/search$/),
        replacesResults: true,
      },
      {
        item: ':has(> .mc_vtvc)',
        link: '.mc_vtvc_con_rc',
        title: '.mc_vtvc_title',
        address: [{ from: '.mc_vtvc_con_rc', attr: 'ourl' }],
        when: onPath(/^\/videos\/search$/),
        replacesResults: true,
      },
      { item: '.news-card, .newscard', link: '.title', title: '.title', when: onPath(/^\/news\/search$/), replacesResults: true },
    ],
    button: { top: '4px', right: '4px' },
    more: { kind: 'link', next: 'a.sb_pagN, a[title="Next page"]', drop: ['rdr', 'rdrig'] },
  },
  {
    id: 'brave',
    name: 'Brave Search',
    matches: ['*://search.brave.com/*'],
    host: /^search\.brave\.com$/,
    isResultsPage: (url) => /^\/(search|images|news|videos)$/.test(url.pathname),
    item: '.snippet[data-type="web"]',
    link: 'a',
    title: '.title',
    // The Images, News, and Videos tabs, from uBlacklist's rules; the Videos panel on the web tab has the same
    // `data-type`, so each is limited to its tab. Unverified on a live page.
    cards: [
      { item: '.image-result', link: 'a', title: '.image-metadata-title', displayed: '.image-metadata-source', when: onPath(/^\/images$/) },
      { item: '.snippet[data-type="news"]', link: 'a', title: '.snippet-title', when: onPath(/^\/news$/) },
      { item: '.snippet[data-type="videos"]', link: 'a', title: '.snippet-title', when: onPath(/^\/videos$/) },
    ],
    // Live (2026-09-29): #llm-snippet in #mixed-top. #summarizer is the older name.
    cleanupSelectors: { ai: '#llm-snippet, #summarizer' },
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
    // The whole results column, so the summary goes above the ad notice and
    // "Web results" label that come before the result list (class names there are
    // generated; `section#main` is the stable part).
    boundary: 'section#main',
    item: ':is(.w-gl, .w-bg) > .result',
    link: 'a.result-link',
    title: 'h2',
    // Images, news, and videos are on the same pages as web results (uBlacklist's rules); unverified on a live page.
    cards: [
      { item: '.image-container', link: 'a', title: '.image-quick-details > div', displayed: '.image-quick-details > span' },
      { item: '.article', link: 'a', title: 'h3' },
      { item: '.vo-bg > .result', link: 'a', title: 'h3' },
    ],
    button: { top: '4px', right: '4px' },
    // One post form per page number, each with the page in a hidden `page` field
    // (reported on a live page, 2026-10; unverified against the fetch itself).
    more: { kind: 'form', form: 'nav.pagination form' },
    restyle: true,
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    matches: ['*://www.ecosia.org/*'],
    host: /^www\.ecosia\.org$/,
    isResultsPage: (url) => /^\/(search|images|news|videos)$/.test(url.pathname),
    // The Images, News, and Videos tabs, from uBlacklist's rules; unverified on a live page.
    cards: [
      { item: '.image-result', link: 'a.image-result__details-link', title: 'h2', when: onPath(/^\/images$/) },
      { item: '.result', link: 'a.result__link', title: 'h2', when: onPath(/^\/(news|videos)$/) },
    ],
    // Each article sits alone in a wrapper, and the wrappers are what can be
    // reordered (reported on a live page, 2026-10). The area is the column
    // holding the definitions panel above them, so the summary goes above that.
    boundary: '.mainline__content',
    // Reported 2026-10-15: with Anubis on, the page stayed on grey placeholders with no side panel, and
    // loaded normally with Anubis off for Ecosia. Nothing is added to the page until it has settled.
    settle: 1500,
    item: '.mainline__result-wrapper:has(a.result__link)',
    loadedClass: 'mainline__result-wrapper--visible',
    // Each result's icon is fetched by Ecosia's script (reported 2026-10-15: the address is in the page's resource timing).
    icon: {
      holder: '[data-test-id="web-result-favicon"]',
      src: (origin, dark) => `https://api.ecosia.org/v2/favicons/fetch?domain=${encodeURIComponent(origin)}&fz=s&theme=${dark ? 'dark' : 'light'}`,
      img: 'favicon',
      fallback: 'favicon__container--fallback',
    },
    link: 'a.result__link',
    title: 'h2',
    button: { top: '4px', right: '20px' },
    more: { kind: 'param', name: 'p', first: 0, step: 1 },
    frames: false,
  },
  {
    id: 'kagi',
    name: 'Kagi',
    matches: ['*://kagi.com/*'],
    host: /^kagi\.com$/,
    isResultsPage: (url) => /^\/(search|images|videos|news|podcasts)$/.test(url.pathname),
    // The other tabs carry the same classes (uBlacklist's rules); as cards they stay in their grids, unreranked.
    cards: [{ item: '._ext_ub_r', link: '._ext_ub_u', title: '._ext_ub_t', when: onPath(/^\/(images|videos|news|podcasts)$/) }],
    // Kagi publishes these classes specifically for extensions. Its widgets (Blast
    // from the Past, Videos) have rows that carry them too, but aren't results. Their
    // class names come from a community stylesheet (unconfirmed against the live page).
    item: '._ext_ub_r:not(:is(.widget, .widgetItem, .widget-simple, .list-widget, .inline-content, .videos, .podcast_result) , :is(.widget, .widget-simple, .list-widget, .inline-content, .videos) *, :has(.widgetItemTitle))',
    link: '._ext_ub_u',
    title: '._ext_ub_t',
    // `main#main` holds the onboarding banner above the results, so the summary goes above it
    // (confirmed on a live page, 2026-10).
    boundary: 'main#main',
    chipsBelowRow: true,
    // The video panel is `.headerVideos` (confirmed on a live page, 2026-10).
    cleanupSelectors: { videos: '.headerVideos, .videos' },
    // Just right of the ⊕ in the row of buttons on each result, with the menu opening beyond it.
    button: { top: '0', right: '-28px', besideMenu: true },
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    matches: ['*://search.yahoo.com/*', '*://*.search.yahoo.com/*'],
    host: /(^|\.)search\.yahoo\.com$/,
    isResultsPage: (url) => url.pathname.startsWith('/search'),
    heading: 'h3',
    boundary: '#web, ol, main',
    // The top ads are an `ol.searchCenterTopAds` of their own, and every ad block carries `yModType: ad` in its `data-yga` (reported on a live page, 2026-10-15); the middle and bottom names are a guess.
    ads: '.searchCenterTopAds, .searchCenterMiddleAds, .searchCenterBottomAds, [data-yga*=\'"yModType":"ad"\']',
    displayed: '.compTitle span, cite',
    button: { top: '2px', right: '2px' },
    more: { kind: 'link', next: 'a.next' },
  },
  {
    id: 'yandex',
    name: 'Yandex',
    matches: [...YANDEX_TLDS.map((tld) => `*://yandex.${tld}/*`), '*://ya.ru/*'],
    host: new RegExp(`^(yandex\\.(${YANDEX_TLDS.join('|').replace(/\./g, '\\.')})|ya\\.ru)$`),
    isResultsPage: (url) => /^\/(search|video\/(touch\/)?search)\/?$/.test(url.pathname),
    item: 'li:has(> .Organic), .serp-item:has(.Organic)',
    link: '.Organic a',
    title: 'h2',
    // Yandex AI's answer: an `li` among the results named `neuro_answer`, with a `.FuturisSearch` card
    // inside (reported on a live page, 2026-10).
    cleanupSelectors: { ai: 'li[data-ilefbgq-name="neuro_answer"], .FuturisSearch' },
    // The Videos tab, from uBlacklist's rules (unverified on a live page): each video's link goes through Yandex,
    // and the site's name is in the card. The phone layout (`/video/touch/search`) has the same classes.
    cards: [
      {
        item: '.VideoSnippetSerpFeature',
        title: '.VideoSnippet-Title',
        displayed: '.VideoHostExtended-Host',
        when: onPath(/^\/video\/(touch\/)?search\/?$/),
        replacesResults: true,
      },
    ],
    // Under Yandex's own ⋮ menu on each result, like DuckDuckGo's.
    button: { top: '4px', right: '24px', underMenu: true, popOut: '.Organic' },
    // Pages are `p=1`, `p=2`… (page 1 has none); seen in the pager's links on a live page.
    more: { kind: 'param', name: 'p', first: 0, step: 1 },
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
    // Pages are `s=1`, `s=11`, `s=21`… (the number of the page's first result), page 1 having none.
    more: { kind: 'param', name: 's', first: 1, step: 10 },
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

/**
 * What says which search a results address is: the query and the tab or filters
 * picked for it. Engines add other details (Google's tracking parameters) after
 * the page loads, which don't make a new search.
 */
const SEARCH_PARAMS = ['q', 'p', 'text', 'query', 'udm', 'tbm', 'tbs', 'ia', 'iax', 'df', 'kl', 'filters', 'tf', 'offset', 'first', 'start', 's'];

/** Whether two results addresses are the same search. */
export function sameSearch(a: string, b: string): boolean {
  let x: URL;
  let y: URL;
  try {
    x = new URL(a);
    y = new URL(b);
  } catch {
    return false;
  }
  if (x.origin !== y.origin || x.pathname !== y.pathname) return false;
  return SEARCH_PARAMS.every((key) => x.searchParams.get(key) === y.searchParams.get(key));
}
