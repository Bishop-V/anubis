// Mock Images, Videos, and News tabs, kept apart from fixtures.mjs.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const hostOf = (u) => new URL(u).hostname.replace(/^www\./, '');

// The Images, Videos, and News tabs of Brave, Ecosia, Kagi, and Startpage: a grid of
// cards, with each engine's selectors from uBlacklist's rules (utils/engines.ts).
// The contents are made up, and the markup around the selectors is a guess.
// `engine`: 'brave' | 'ecosia' | 'kagi' | 'startpage'; `tab`: 'images' | 'videos' | 'news'.
export function engineTab(engine, tab, results) {
  const makeCard = CARD_MARKUP[engine][tab] ?? CARD_MARKUP[engine].other;
  const grid = results.map(([url, title], i) => makeCard(url, esc(title), i, hostOf(url), tab)).join('');
  const body = engine === 'startpage' ? `<section id="main"><div class="grid${tab === 'videos' ? ' vo-bg' : ''}">${grid}</div></section>` : `<main id="main"><div class="grid">${grid}</div></main>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>anubis</title>
  <style>
    body{margin:0;font:14px/1.45 -apple-system,sans-serif;background:#fff;color:#333}
    nav{padding:14px 28px;border-bottom:1px solid #eee}
    main,#main{display:block;padding:18px 28px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    a{color:inherit;text-decoration:none}.thumb{height:120px;border-radius:8px;background:#c9ccd6}
    h2,h3{margin:6px 0 2px;font-size:14px}
  </style></head><body><nav>All <b>${tab}</b></nav>${body}</body></html>`;
}

const THUMB = '<div class="thumb"></div>';
const kagiCard = (url, title) => `<div class="_ext_ub_r">${THUMB}<a class="_ext_ub_u" href="${url}"><span class="_ext_ub_t">${title}</span></a></div>`;
/** One card's markup per engine and tab: `(address, title, index, site, tab) => html`. */
const CARD_MARKUP = {
  // Google's Images tab keeps a picture's address in `data-lpage`, and its link goes through Google;
  // its News tab is a list of clusters whose titles are ARIA headings (uBlacklist's rules).
  google: {
    images: (url, title, i) => `<div class="kb0PBd"><div class="ivg-i" data-lpage="${url}">${THUMB}</div><a class="LBcIee" href="/imgres?imgurl=x${i}&imgrefurl=y"><div class="ddBkwd">${title}</div></a></div>`,
    other: (url, title) => `<div data-news-cluster-id="${hostOf(url)}"><a href="${url}">${THUMB}<div role="heading" aria-level="3">${title}</div></a></div>`,
  },
  brave: {
    images: (url, title, i, host) => `<div class="image-result"><a href="/images/view?i=${i}">${THUMB}</a><div class="image-metadata-title">${title}</div><div class="image-metadata-source">${host}</div></div>`,
    other: (url, title, i, host, tab) => `<div class="snippet" data-type="${tab}"><a href="${url}">${THUMB}<div class="snippet-title">${title}</div></a></div>`,
  },
  ecosia: {
    images: (url, title, i) => `<div class="image-result"><a class="image-result__link-wrapper" href="/images/view?i=${i}">${THUMB}</a><a class="image-result__details-link" href="${url}"><h2>${title}</h2></a></div>`,
    other: (url, title) => `<div class="result"><a class="result__link" href="${url}">${THUMB}<h2>${title}</h2></a></div>`,
  },
  kagi: { other: kagiCard },
  startpage: {
    images: (url, title, i, host) => `<div class="image-container"><a href="/do/image?i=${i}">${THUMB}</a><div class="image-quick-details"><div>${title}</div><span>${host}</span></div></div>`,
    news: (url, title) => `<div class="article"><a href="${url}">${THUMB}<h3>${title}</h3></a></div>`,
    other: (url, title) => `<div class="result"><a href="${url}">${THUMB}<h3>${title}</h3></a></div>`,
  },
};

/** Where each engine's tab mocks live, as [address, engine, tab]. */
export const ENGINE_TABS = [
  ['https://www.google.com/search?q=javascript+promises&udm=2', 'google', 'images'],
  ['https://www.google.com/search?q=javascript+promises&tbm=nws', 'google', 'news'],
  ['https://search.brave.com/images?q=javascript+promises', 'brave', 'images'],
  ['https://search.brave.com/news?q=javascript+promises', 'brave', 'news'],
  ['https://search.brave.com/videos?q=javascript+promises', 'brave', 'videos'],
  ['https://www.ecosia.org/images?q=javascript+promises', 'ecosia', 'images'],
  ['https://www.ecosia.org/news?q=javascript+promises', 'ecosia', 'news'],
  ['https://www.ecosia.org/videos?q=javascript+promises', 'ecosia', 'videos'],
  ['https://kagi.com/images?q=javascript+promises', 'kagi', 'images'],
  ['https://kagi.com/videos?q=javascript+promises', 'kagi', 'videos'],
  ['https://kagi.com/news?q=javascript+promises', 'kagi', 'news'],
  ['https://www.startpage.com/sp/search?query=javascript+promises&cat=pics', 'startpage', 'images'],
  ['https://www.startpage.com/sp/search?query=javascript+promises&cat=news', 'startpage', 'news'],
  ['https://www.startpage.com/sp/search?query=javascript+promises&cat=video', 'startpage', 'videos'],
];
