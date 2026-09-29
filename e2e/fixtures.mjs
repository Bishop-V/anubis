// Mock search result pages shaped like each engine's current markup (per
// uBlacklist's serpinfo definitions). Negative examples use made-up domains.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const JS_RESULTS = [
  ['https://www.w3schools.com/js/js_promise.asp', 'JavaScript Promises - W3Schools', 'A Promise contains both the producing code and calls to the consuming code. Promise syntax, states and examples.'],
  ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise', 'Promise - JavaScript | MDN', 'The Promise object represents the eventual completion (or failure) of an asynchronous operation and its resulting value.'],
  ['https://ai-answers-example.net/javascript-promises-explained', 'JavaScript Promises Explained (2026 Ultimate Guide) - AI Answers', 'Discover everything you need to know about JavaScript promises in this comprehensive, ultimate, complete guide for beginners.'],
  ['https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call', 'How do I return the response from an asynchronous call? - Stack Overflow', 'I have a function foo which makes an asynchronous request. How can I return the response/result from foo?'],
  ['https://javascript.info/promise-basics', 'Promise - The Modern JavaScript Tutorial', 'Imagine that you’re a top singer, and fans ask day and night for your upcoming song. A promise is a special JavaScript object that links the “producing code” and the “consuming code” together.'],
  ['https://codefarm-example.com/js/promises-tutorial-2026', 'Promises in JS | Codefarm Tutorials', 'Learn promises in JS with our easy tutorial. Click here for the best promises tutorial with examples and quizzes.'],
  ['https://www.reddit.com/r/javascript/comments/abc123/when_should_i_use_async_await_vs_then/', 'When should I use async/await vs .then()? : r/javascript', '42 comments · I keep going back and forth between the two styles and would love to hear how people decide…'],
  ['https://en.wikipedia.org/wiki/Futures_and_promises', 'Futures and promises - Wikipedia', 'In computer science, futures, promises, delays, and deferreds are constructs used for synchronizing program execution in some concurrent programming languages.'],
  ['https://web.dev/articles/promises', 'JavaScript Promises: an introduction | web.dev', 'Promises simplify deferred and asynchronous computations. A promise represents an operation that hasn’t completed yet.'],
];

export const ANUBIS_RESULTS = [
  ['https://en.wikipedia.org/wiki/Anubis', 'Anubis - Wikipedia', 'Anubis is the god of funerary rites, protector of graves, and guide to the underworld in ancient Egyptian religion, usually depicted as a canine or a man with a canine head.'],
  ['https://mythology.fandom.com/wiki/Anubis', 'Anubis | Mythology Wiki | Fandom', 'Anubis is the Egyptian god of mummification and the afterlife as well as the patron god of lost souls and the helpless.'],
  ['https://www.britannica.com/topic/Anubis', 'Anubis | Egyptian God, Mythology, & Facts | Britannica', 'Anubis, also called Anpu, ancient Egyptian god of the dead, represented by a jackal or the figure of a man with the head of a jackal.'],
  ['https://www.nytimes.com/2026/03/02/science/egypt-tomb-anubis.html', 'Archaeologists Find a Shrine to Anubis - The New York Times', 'A newly excavated site near Saqqara suggests jackal-headed Anubis was worshiped there for centuries.'],
  ['https://www.reddit.com/r/AskHistorians/comments/xyz/why_was_anubis_a_jackal/', 'Why was Anubis depicted as a jackal? : r/AskHistorians', 'Jackals were often seen near cemeteries in ancient Egypt, and it’s commonly argued that…'],
  ['https://mythgenerator-example.com/anubis-facts-you-wont-believe', '17 Anubis Facts You Won’t Believe (#9 Will Shock You)', 'Anubis was the most powerful god ever? Find out the truth about Anubis in this list of amazing facts.'],
  ['https://www.worldhistory.org/Anubis/', 'Anubis - World History Encyclopedia', 'Anubis is the Egyptian god of mummification and the afterlife as well as the patron god of lost souls and the helpless.'],
];

export const ANUBIS_PAGE2 = [
  ['https://www.metmuseum.org/art/collection/search/anubis', 'Statuette of Anubis | The Metropolitan Museum of Art', 'Anubis, the jackal-headed god associated with mummification, is shown here in a bronze statuette from the Late Period.'],
  ['https://egypt.fandom.com/wiki/Anubis', 'Anubis | Egyptian Gods Wiki | Fandom', 'Anubis is one of the most prominent gods in the Egyptian pantheon.'],
  ['https://www.smithsonianmag.com/history/anubis-jackal-god', 'How Anubis Became the God of the Dead | Smithsonian', 'Egyptologists trace the jackal god from early funerary texts to the Ptolemaic era.'],
  ['https://www.wsj.com/arts-culture/anubis-exhibit-review', 'Review: The Jackal God Comes to New York - WSJ', 'An exhibit on Anubis gathers statues, amulets and papyri from a dozen collections.'],
  ['https://en.wikipedia.org/wiki/Anubis', 'Anubis - Wikipedia', 'Duplicate of a first-page result, which must not be added twice.'],
];

export const JS_MORE = [
  ['https://tc39.es/ecma262/#sec-promise-objects', 'ECMAScript® 2027 Language Specification: Promise Objects', 'A Promise is an object that is used as a placeholder for the eventual results of a deferred computation.'],
  ['https://ai-answers-example.net/promise-vs-async', 'Promise vs Async: Everything You Need to Know - AI Answers', 'In this article we will explore everything you need to know about promises vs async.'],
  ['https://nodejs.org/api/timers.html#timers-promises-api', 'Timers | Node.js Documentation', 'The timers/promises API provides an alternative set of timer functions that return Promise objects.'],
];

const hostOf = (u) => new URL(u).hostname.replace(/^www\./, '');

// Google shows each result's site name and icon. Simple stand-ins for the icons of
// the sites in the results above; any other site gets its address and a globe.
const letter = (bg, fg, ch, font = 'Arial,sans-serif', size = 11) =>
  `<rect width="16" height="16" rx="3" fill="${bg}"/><text x="8" y="${8 + size * 0.36}" text-anchor="middle" font-family="${font}" font-weight="700" font-size="${size}" fill="${fg}">${ch}</text>`;
const SITES = [
  ['wikipedia.org', 'Wikipedia', letter('#fff', '#202122', 'W', 'Georgia,serif', 12)],
  ['fandom.com', 'Fandom', letter('#fa005a', '#fff', 'F')],
  ['britannica.com', 'Britannica', letter('#0f4c81', '#fff', 'B', 'Georgia,serif')],
  ['nytimes.com', 'The New York Times', letter('#fff', '#000', 'T', 'Georgia,serif', 13)],
  ['reddit.com', 'Reddit', '<circle cx="8" cy="8" r="8" fill="#ff4500"/><ellipse cx="8" cy="9.6" rx="4.8" ry="3.3" fill="#fff"/><circle cx="6.2" cy="9.4" r="1" fill="#ff4500"/><circle cx="9.8" cy="9.4" r="1" fill="#ff4500"/>'],
  ['worldhistory.org', 'World History Encyclopedia', letter('#7a1f2b', '#fff', 'W', 'Georgia,serif')],
  ['metmuseum.org', 'The Metropolitan Museum of Art', letter('#e4002b', '#fff', 'M')],
  ['smithsonianmag.com', 'Smithsonian Magazine', letter('#1d1d1b', '#fff', 'S', 'Georgia,serif')],
  ['wsj.com', 'The Wall Street Journal', letter('#fff', '#000', 'W', 'Georgia,serif', 12)],
];
const GLOBE = '<circle cx="8" cy="8" r="6.4" fill="none" stroke="#5f6368" stroke-width="1.3"/><path d="M1.6 8h12.8M8 1.6c-2.3 2.3-2.3 10.5 0 12.8M8 1.6c2.3 2.3 2.3 10.5 0 12.8" fill="none" stroke="#5f6368" stroke-width="1.1"/>';
const siteOf = (host) => SITES.find(([d]) => host === d || host.endsWith(`.${d}`)) ?? [host, host, GLOBE];
const siteIcon = (svg) =>
  `<img class="XNo5Ab" alt="" width="18" height="18" src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">${svg}</svg>`)}">`;

// ---------------------------------------------------------------- DuckDuckGo
// `ai`: DuckDuckGo's AI features, modelled on EasyList's AI filters (unchecked on a
// live page): the answer as the list's first item, found by its data-testid with no
// heading to go by, and Duck.ai as a tab and a button in the search box.
// `wide`: the results in a list that isn't an <ol>, inside a <main> that also holds
// a side panel, so the results area is wider than the results.
export function duckduckgo(query, results, dark = false, more = [], { ai = false, wide = false } = {}) {
  const item = ([url, title, snippet], i) => `
      <li data-layout="organic" class="wLL07_0Xnd1QZpzpfR4W">
        <article id="r1-${i}" data-testid="result" data-nrn="result" class="yQDlj3B5DI5YO8c8Ulio CpkrTDP54mqzpuCSn1Fa SKlplDuh9FjtDprgoMxk">
          <div class="OHr0VX9IuNcv6iakvT6A"><div class="favicon"></div>
            <a href="${url}" rel="noopener" class="Rn_JXVtoPVAFyGkcaXyK"><span>${esc(hostOf(url))}</span></a>
          </div>
          <h2 class="LnpumSThxEWMIsDdAT17 CXMyPcQ6nDv47DKFeywM"><a href="${url}" rel="noopener" data-testid="result-title-a" class="eVNpHGjtxRBq_gLOfGDr LQNqh2U1kzYxREs65IJu"><span class="EKtkFWMYpwzMKOYr0GYm LQVY1Jpkk8nyJ6HBWKAk">${esc(title)}</span></a></h2>
          <div data-result="snippet" class="OgdwYG6KE2qthn9XQWFC"><div><span class="kY2IgmnCmOGjharHErah">${esc(snippet)}</span></div></div>
          <button class="menu" aria-label="Result options">⋯</button>
        </article>
      </li>`;
  const items = results.map(item).join('');
  const moreHtml = JSON.stringify(more.map((r, i) => item(r, 100 + i)).join(''));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(query)} at DuckDuckGo</title>
  <style>
    body{margin:0;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:${dark ? '#161616' : '#fff'};color:${dark ? '#eee' : '#333'}}
    .hdr{display:flex;align-items:center;gap:14px;padding:16px 28px;border-bottom:1px solid ${dark ? '#333' : '#eee'}}
    .logo{width:34px;height:34px;border-radius:50%;background:#de5833}
    .q{flex:0 1 580px;height:40px;border-radius:8px;border:1px solid ${dark ? '#444' : '#ddd'};padding:0 14px;display:flex;align-items:center;background:${dark ? '#222' : '#fff'};color:inherit}
    .tabs{padding:10px 28px 0 76px;color:${dark ? '#aaa' : '#666'};font-size:13px;display:flex;gap:20px;border-bottom:1px solid ${dark ? '#333' : '#eee'}}
    .tabs b{color:${dark ? '#fff' : '#111'};border-bottom:2px solid #de5833;padding-bottom:8px}
    main{padding:18px 28px 60px 76px;max-width:660px}
    main.wide{position:relative;max-width:none}
    main.wide li{list-style:none}
    main.wide [data-testid=mainline]{max-width:620px}
    main.wide [data-area=sidebar]{position:absolute;top:18px;left:760px;width:300px;padding:12px;border:1px solid ${dark ? '#333' : '#e5e5e5'};border-radius:10px}
    ol{list-style:none;margin:0;padding:0}
    li{margin:0 0 26px}
    article{position:relative}
    .OHr0VX9IuNcv6iakvT6A{display:flex;align-items:center;gap:8px;font-size:13px}
    .OHr0VX9IuNcv6iakvT6A a{color:${dark ? '#8ab4f8' : '#1f7a3a'};text-decoration:none}
    .favicon{width:16px;height:16px;border-radius:4px;background:${dark ? '#444' : '#e5e5e5'}}
    h2{margin:4px 0 4px;font-size:18px;font-weight:500;line-height:1.3}
    h2 a{color:${dark ? '#a7b7ff' : '#1a0dab'};text-decoration:none}
    [data-result=snippet]{color:${dark ? '#bbb' : '#494949'};font-size:14px}
    .menu{position:absolute;top:-4px;right:0;display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;border-radius:50%;background:none;color:${dark ? '#ccc' : '#666'};font-size:16px;cursor:pointer;transition:background .15s}
    .menu:hover{background:${dark ? '#ffffff26' : '#0000000f'}}
    .ask{margin-left:auto;border:0;background:none;color:#de5833}
    .chat{color:inherit;text-decoration:none}
    .assist-box{border:1px solid ${dark ? '#333' : '#e5e5e5'};border-radius:10px;padding:12px 14px}
  </style></head><body>
  <div class="hdr"><div class="logo"></div><div class="q">${esc(query)}${ai ? '<button type="button" class="ask" title="Ask Duck.ai" data-ssg-id="ai-searchbox-chat-submit">✦</button>' : ''}</div></div>
  <div class="tabs"><b>All</b><span>Images</span><span>Videos</span><span>News</span><span>Maps</span>${ai ? `<a class="chat" href="/?q=${encodeURIComponent(query)}&ia=chat">Duck.ai</a>` : ''}</div>
  <main${wide ? ' class="wide"' : ''}><section data-testid="${wide ? 'mainline' : 'web-vertical'}"><${wide ? 'div' : 'ol'} class="react-results--main">${ai ? `
      <li class="assist"><div class="assist-box"><div data-testid="duckassist-answer-content"><p>A promise is an object representing the eventual completion or failure of an asynchronous operation, and its resulting value.</p></div>
        <a href="/?q=${encodeURIComponent(query)}&ia=chat&duckai=1">Ask a follow-up</a></div></li>` : ''}${items}</${wide ? 'div' : 'ol'}>
  ${more.length ? '<button id="more-results" style="margin:10px 0;padding:8px 18px;border-radius:8px;border:1px solid #ccc;background:none;color:inherit">More results</button>' : ''}
  </section>${wide ? '<section data-area="sidebar"><b>JavaScript</b><p>A programming language for the web.</p></section>' : ''}</main>
  <script>
    // DuckDuckGo's own "hide this site": the result's menu collapses it into a notice.
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button.menu');
      if (!btn) return;
      const article = btn.closest('article');
      const site = article.querySelector('a').textContent;
      article.innerHTML = '<div class="ddg-hidden" style="padding:8px 0;color:#888">Results from <b>' + site + '</b> are hidden. <button class="undo">Undo</button></div>';
    });
    const more = document.getElementById('more-results');
    more?.addEventListener('click', () => setTimeout(() => {
      document.querySelector('ol').insertAdjacentHTML('beforeend', ${moreHtml});
      more.remove();
    }, 300));
  </script>
  </body></html>`;
}

// ---------------------------------------------------------------- Google
// `hostile` adds the kinds of markup and CSS that broke Anubis on real Google in
// Firefox: deeper nesting, a title wrapper flipped with a transform (with the
// page's own children flipped back), a rule hiding stray last children, and an
// unrelated heading earlier in the page source than the results.
// Options: `dark`; `next`, a next-page link; `hostile`, page CSS that fights
// Anubis's elements; `grouped`, results nested the way Google does for a first
// result with sitelinks and for a group of results from one site; `modules`, the
// blocks that aren't results (AI Overview, videos, "People also ask", a side panel).
// `inner`: the space between results is a margin inside each one. It collapses
// through the result in the page's own layout, but stays inside it once reranking
// makes the list a flex column, so results touch. Modelled on a live Google page
// (2026-09-29) where the frames of pinned results in a row crossed.
// `forum`: every link is an opaque /goto redirect, as Google has sent since August
// 2026, and the Reddit result is shown the way Google shows forum threads: the
// forum's name ("Reddit · r/AskHistorians") and "20+ comments · 2 years ago" where
// the address would be, so there's no <cite> to read the site from. `aiAbove`: the
// AI Overview above the results column (#rcnt > div.M8OgIe, seen on a live page),
// spanning the row; `aiAbove: 'grid'` lays #rcnt out as a grid instead, as a live
// page did (the Overview `grid-column: 1 / -1`, #center_col `2 / span 12`), where
// an element added before the Overview lands in a narrow cell of its own. `related`: "People also search for" and the page navigation in
// one block at the bottom, in #botstuff. Not copied from a live page.
export function google(query, results, { dark = false, next = '', hostile = false, grouped = false, modules = false, aiLabel = false, videos = '', inner = false, forum = false, aiAbove = false, related = false } = {}) {
  const sitelinks = (url) =>
    `<div class="sitelinks">${['History', 'Symbols', 'Worship', 'Family', 'Names', 'Legacy']
      .map((s) => `<div class="usJj9c"><h3><a href="${forum ? `/goto?url=CAESsitelink${s}` : `${url}#${s}`}">${s}</a></h3><div>About ${s.toLowerCase()}.</div></div>`)
      .join('')}</div>`;
  // With `forum`, a social profile too: "LinkedIn · Anubis" and "34.4K+ followers"
  // where the address would be.
  if (forum) results = [...results, ['https://www.linkedin.com/company/anubis-example', 'Anubis Example | LinkedIn', 'Anubis Example builds tools for weighing search results.']];
  const items = results
    .map(([url, title, snippet], i) => {
      const [, name, icon] = siteOf(hostOf(url));
      const crumbs = `https://${new URL(url).hostname} › ${new URL(url).pathname.split('/').filter(Boolean).slice(0, 2).join(' › ')}`;
      // Mix of link styles: direct, /url?q=, and opaque /goto (needs the <cite> fallback).
      const href = forum ? `/goto?url=CAESopaqueblob${i}` : i === 1 ? `/url?q=${encodeURIComponent(url)}&sa=U` : i === 3 ? `/goto?url=CAESopaqueblob${i}` : url;
      const open = hostile ? '<div class="hw1"><div class="hw2"><div class="hw3">' : '';
      const close = hostile ? '</div></div></div>' : '';
      if (forum && (name === 'Reddit' || hostOf(url) === 'linkedin.com')) {
        const social = name !== 'Reddit';
        const sub = new URL(url).pathname.split('/')[2];
        return `
      <div class="MjjYud"><div class="g Ww4FFb vt6azd tF2Cxc asEBEc"><div class="N54PNb BToiNc">
        <div class="kb0PBd A9Y9g jGGQ5e" data-snf="x5WNvb"><div class="xe8e1b"><div class="flipwrap"><span jscontroller="msmzHf">
          <a jsname="UWckNb" href="${href}"><br><h3 class="LC20lb MBeuO DKV0Md">${esc(title)}</h3>
            <div class="notranslate TbwUpd NJjxre iUh30 ojE3Fb"><span class="H9lube"><div class="eqA2re NjwKYd Vwoesf"><div class="favicon">${siteIcon(icon)}</div></div></span>
            <div><span class="VuuXrf">${social ? 'LinkedIn · Anubis' : `${esc(name)} · r/${esc(sub)}`}</span><div class="byrV5b">${social ? '<cite class="forum-meta social">34.4K+ followers</cite>' : '<span class="forum-meta">20+ comments · 2 years ago</span>'}</div></div></div>
          </a><span class="aux"></span></span><div class="B6fmyf">⋮</div></div></div></div>
        <div class="kb0PBd A9Y9g" data-sncf="1"><div class="VwiC3b yXK7lf p4wth r025kc hJNv6b Hdw6tb" style="-webkit-line-clamp:2"><span>${esc(snippet)}</span></div></div>
        ${social ? '' : `<div class="kb0PBd A9Y9g"><a class="answers" href="/goto?url=CAESanswers${i}">20 answers</a> · Top answer: Jackals scavenged near tombs…</div>`}
      </div></div></div>`;
      }
      return `
      <div class="MjjYud">${open}<div class="g Ww4FFb vt6azd tF2Cxc asEBEc"><div class="N54PNb BToiNc">
        <div class="kb0PBd A9Y9g jGGQ5e" data-snf="x5WNvb"><div class="yuRUbf"><div class="flipwrap"><span jscontroller="msmzHf">
          <a jsname="UWckNb" href="${href}"><br><h3 class="LC20lb MBeuO DKV0Md">${esc(title)}</h3>
            <div class="notranslate TbwUpd NJjxre iUh30 ojE3Fb"><span class="H9lube"><div class="eqA2re NjwKYd Vwoesf"><div class="favicon">${siteIcon(icon)}</div></div></span>
            <div><span class="VuuXrf">${esc(name)}</span><div class="byrV5b"><cite class="qLRx3b tjvcx GvPZzd cHaqb" role="text">${esc(crumbs)}</cite></div></div></div>
          </a><span class="aux"></span></span><div class="B6fmyf">⋮</div></div></div></div>
        <div class="kb0PBd A9Y9g" data-sncf="1"><div class="VwiC3b yXK7lf p4wth r025kc hJNv6b Hdw6tb" style="-webkit-line-clamp:2"><span>${esc(snippet)}</span></div></div>
      </div>${grouped && i === 0 ? sitelinks(url) : ''}</div>${close}</div>`;
    });
  if (grouped) items.splice(1, 2, `<div class="hlcw0c">${items[1]}${items[2]}</div>`);
  // `videos`: a video panel laid out like Google's (a header row with a menu, a list
  // of cards, "View all"), in two ways a panel can defeat clean-up. `titles`: each
  // video's title is a heading outside its link, so it looks like a section of the
  // panel. `groups`: titles are <h3> links, so the videos look like results, and the
  // real results come in pairs, so the three videos are the biggest list. `split`:
  // titles as in `titles`, with the panel's parts as separate blocks.
  if (videos) {
    const card = (t, i) =>
      videos !== 'groups'
        ? `<div class="vcard"><a class="thumb" href="https://www.youtube.com/watch?v=${i}">▶</a><div><div role="heading">${t}</div><div>YouTube · Channel ${i}</div></div></div>`
        : `<div class="vcard"><a class="thumb" href="https://www.youtube.com/watch?v=${i}">▶</a><div><a href="https://www.youtube.com/watch?v=${i}"><h3>${t}</h3></a><div>YouTube · Channel ${i}</div></div></div>`;
    if (videos === 'groups') {
      const pairs = [];
      for (let i = 0; i < items.length; i += 2) pairs.push(`<div class="pair">${items.slice(i, i + 2).join('')}</div>`);
      items.splice(0, items.length, ...pairs);
    }
    const head = `<div class="vhead"><div role="heading" aria-level="2"><span>Videos</span></div><div class="vmenu">⋮</div></div>`;
    const list = `<div class="vlist">${['What is a fandom?', 'Stop using Fandom', 'What exactly is Fandom?'].map(card).join('')}</div>`;
    const all = `<div class="vall"><a href="/search?q=anubis&tbm=vid">View all</a></div>`;
    // `google`: the layout reported from a live page. The list sits in a wrapper div
    // in #rso; the panel is div.ULSxyf > div.MjjYud > div.A6K0A[data-rpos] > the
    // header row, the videos and "View all"; the header row is div.UjLRDc holding a
    // span[role=heading]. Each video is a card clickable through a script, not a
    // link, with its title as a heading, and the cards don't all share a class.
    if (videos === 'google') {
      const gcard = (t, i) =>
        `<div class="${i === 0 ? 'vcard first' : 'vcard'}" jsaction="click:open"><span class="thumb">▶</span><div><div role="heading">${t}</div><div>YouTube · Channel ${i}</div></div></div>`;
      const glist = `<div class="vlist">${['What is a fandom?', 'Stop using Fandom', 'What exactly is Fandom?'].map(gcard).join('')}</div>`;
      // An images panel above the first result, as reported: span[role=heading]
      // inside div.Lv2Cle, in the same ULSxyf/MjjYud/A6K0A[data-rpos] wrapping.
      const shots = ['Comic Con 2016', 'Fandoms: Where to start', 'Fandoms and culture'].map((t, i) => `<a class="icard" href="https://example.com/${i}"><img alt="" width="120" height="80" style="background:#8884"><div>${t}</div><div>Source ${i}</div></a>`).join('');
      items.unshift(`<div class="ULSxyf"><div class="MjjYud"><div class="A6K0A" data-rpos="0"><div class="Lv2Cle ipanel" data-count="6"><div class="x7cRLb"><div class="fIuY1b"><div class="adDDi"><span class="mgAbYb" role="heading">Images</span></div></div></div>
        <div class="igrid">${shots}</div><div class="imore"><button type="button">Show more images</button></div></div></div></div></div>`);
      items.splice(2, 0, `<div class="ULSxyf"><div class="MjjYud"><div class="A6K0A" data-rpos="1"><div class="vtSz8d vpanel">
        <div class="UjLRDc vhead"><div class="PJI6ge"><span class="mgAbYb" role="heading"><span>Videos</span></span></div><div class="vmenu">⋮</div></div>
        ${glist}${all}</div></div></div></div>`);
      // The first result has a thumbnail in its top-right corner, as Google shows.
      items[1] = items[1].replace('<div class="g ', '<div style="position:relative"><img class="rthumb" alt="" width="92" height="92" style="position:absolute;top:0;right:0;background:#8884;border-radius:8px"></div><div class="g ');
      items.splice(0, items.length, `<div>${items.join('')}</div>`);
    } else if (videos === 'split') items.splice(1, 0, `<div class="MjjYud vpanel">${head}</div>`, `<div class="MjjYud vpanel">${list}</div>`, `<div class="MjjYud vpanel">${all}</div>`);
    else items.splice(1, 0, `<div class="MjjYud"><div class="module vpanel">${head}${list}${all}</div></div>`);
  }
  if (aiLabel) {
    // A video panel whose videos each have an <h3> title in a link, so they look
    // like results, and whose "Videos" label has no heading level.
    items.splice(2, 0, `
      <div class="MjjYud"><div class="module videos"><div role="heading"><span>Videos</span></div>
        <div class="vrow">${['Anubis explained', 'Tomb of Anubis', 'Jackal gods'].map((t) => `<div class="vitem"><a href="https://www.youtube.com/watch?v=${t.length}"><h3>${t}</h3></a><div>YouTube</div></div>`).join('')}</div></div></div>`);
  }
  // Image rows are pictures with no text.
  const thumbs = [1, 2, 3].map(() => '<img alt="" width="48" height="48" style="background:#8884">').join(' ');
  if (modules) {
    // Modelled on community filter lists and uBlacklist's notes; not copied from a live page.
    items.splice(2, 0, `
      <div class="MjjYud"><div class="module videos"><div role="heading" aria-level="2">Videos</div>
        <div class="vrow">${[
          ['Anubis explained', 'Ancient Egypt Explained', 'Mar 3, 2025'],
          ['Tomb of Anubis', 'Museum Talks', '8 months ago'],
          ['Jackal gods', 'Desert Nights', '2 years ago'],
        ]
          .map(([t, channel, when]) => `<a href="https://www.youtube.com/watch?v=${t.length}"><div role="heading" aria-level="3">${t}</div><span>YouTube · ${channel}</span><span>${when}</span></a>`)
          .join('')}</div></div></div>`);
    items.splice(6, 0, `
      <div class="MjjYud"><div data-rpos="7"><div class="module kp"><h2>Anubis in art</h2><p>Statues, amulets and papyri.</p>
        <div class="kp-images"><div role="heading" aria-level="2">Images</div><div class="thumbs">${thumbs}</div></div></div></div></div>`);
    items.splice(4, 0, `
      <div class="MjjYud"><div class="module paa"><div><h2 role="heading">People also ask</h2></div>
        ${['Who is Anubis?', 'Why is Anubis a jackal?', 'Is Anubis good or evil?'].map((q) => `<div class="related-question-pair"><div role="button">${q}</div></div>`).join('')}</div></div>`);
  }
  // `aiLabel`: harder cases. The "AI Overview" label is a plain div beside an icon
  // whose <title> adds text, the block holds a follow-up box named like the search
  // box, the AI Mode tab sits in an unlabelled row of links, and the video panel
  // (above) holds videos that look like results.
  const aiOverview = aiLabel
    ? `<div class="module ai"><div><div class="nk9vdc"><svg width="16" height="16"><title>Sparkle</title><circle cx="8" cy="8" r="6"/></svg><div class="Fzsovc">AI Overview</div></div>
        <div>Anubis is the jackal-headed god of the dead in ancient Egyptian religion…</div>
        <div class="followup"><textarea name="q" aria-label="Ask a follow up"></textarea></div>
        <div class="disclaimer">AI responses may include mistakes. <a href="/learn">Learn more</a></div></div></div>`
    : modules
      ? `<div class="M8OgIe module ai"><div><h1 class="aio">AI Overview</h1><div>Anubis is the jackal-headed god of the dead in ancient Egyptian religion, linked with mummification and the protection of tombs. He guided souls into the afterlife and oversaw the Weighing of the Heart, in which a person’s heart was weighed against the feather of Maat…</div>
        <button type="button">Dive deeper in AI Mode</button></div></div>`
      : '';
  // Above the results column, spanning the row like the live page's AI Overview.
  const aiRow = aiAbove
    ? `<div class="bzXtMb M8OgIe aiabove"><div class="YzCcne"><div class="nk9vdc"><div class="Fzsovc" role="heading">AI Overview</div></div>
        <div class="aitext">Anubis is the jackal-headed god of the dead in ancient Egyptian religion, linked with mummification and the protection of tombs.</div>
        <div class="disclaimer">AI responses may include mistakes.</div></div></div>`
    : '';
  const pager = next
    ? `<div role="navigation"><table class="AaVjTc"${related ? '' : ' style="margin-left:180px"'}><tr><td>1</td><td><a href="${next}">2</a></td><td><a href="${next}&p=3">3</a></td><td><a id="pnnext" href="${next}">Next</a></td></tr></table></div>`
    : '';
  const botstuff = related
    ? `<div id="botstuff"><div class="bottom"><div id="bres"><div class="rhead"><span role="heading" aria-level="2">People also search for</span></div>
        <div class="rgrid">${['Anubis and Osiris', 'Anubis symbol', 'Anubis powers', 'Anubis weighing of the heart'].map((q) => `<a href="/search?q=${encodeURIComponent(q)}">${q}</a>`).join('')}</div></div>
        ${pager}</div></div>`
    : '';
  const sidePanel = modules
    ? `<div id="rhs"><h2>Anubis</h2><p>Egyptian deity</p><div><div role="heading" aria-level="2">Images</div><div class="thumbs">${thumbs}</div></div></div>`
    : '';
  // Colours for light and dark mode.
  const c = dark
    ? { bg: '#1f1f1f', text: '#e3e3e3', site: '#dadce0', muted: '#bdc1c6', link: '#99c3ff', line: '#3c4043', rule: '#5f6368', soft: '#303134', box: '#303134', shadow: '0 1px 6px #0008' }
    : { bg: '#fff', text: '#1f1f1f', site: '#202124', muted: '#4d5156', link: '#1a0dab', line: '#ebebeb', rule: '#dadce0', soft: '#f1f3f4', box: '#fff', shadow: '0 2px 5px 1px #403c4329' };
  // Google's wordmark, from the CC0 collection at github.com/gilbarbara/logos, in Google's colours.
  const logo = `<svg viewBox="0 0 512 168" width="92" height="30" role="img" aria-label="Google"><path fill="#ea4335" d="M496.1,102.7L510.3,112.1C505.6,118.9 494.6,130.6 475.6,130.6C451.9,130.6 434.3,112.3 434.3,89C434.3,64.2 452.1,47.4 473.6,47.4C495.2,47.4 505.8,64.5 509.2,73.8L511.1,78.6L455.4,101.6C459.6,110 466.2,114.2 475.6,114.2C484.9,114.2 491.4,109.6 496.1,102.7L496.1,102.7ZM452.4,87.7L489.6,72.2C487.5,67 481.4,63.4 474.1,63.4C464.8,63.4 451.9,71.6 452.4,87.7L452.4,87.7Z"/><path fill="#34a853" d="M407.4,4.9L425.3,4.9L425.3,126.8L407.4,126.8L407.4,4.9L407.4,4.9Z"/><path fill="#4285f4" d="M379.1,50.6L396.4,50.6L396.4,124.6C396.4,155.3 378.3,168 356.9,168C336.7,168 324.6,154.4 320,143.4L335.9,136.7C338.8,143.5 345.7,151.6 356.9,151.6C370.7,151.6 379.1,143 379.1,127.1L379.1,121.1L378.5,121.1C374.4,126.1 366.5,130.6 356.6,130.6C335.8,130.6 316.7,112.5 316.7,89.1C316.7,65.6 335.8,47.3 356.6,47.3C366.5,47.3 374.4,51.7 378.5,56.6L379.1,56.6L379.1,50.6L379.1,50.6ZM380.4,89.1C380.4,74.4 370.6,63.7 358.1,63.7C345.5,63.7 335,74.4 335,89.1C335,103.6 345.5,114.1 358.1,114.1C370.6,114.2 380.4,103.6 380.4,89.1L380.4,89.1Z"/><path fill="#ea4335" d="M218.2,88.8C218.2,112.8 199.5,130.4 176.6,130.4C153.7,130.4 135,112.7 135,88.8C135,64.7 153.7,47.1 176.6,47.1C199.5,47.1 218.2,64.7 218.2,88.8L218.2,88.8ZM200,88.8C200,73.8 189.2,63.6 176.6,63.6C164,63.6 153.2,73.8 153.2,88.8C153.2,103.6 164,114 176.6,114C189.2,114 200,103.6 200,88.8L200,88.8Z"/><path fill="#fbbc05" d="M309.1,89C309.1,113 290.4,130.6 267.5,130.6C244.6,130.6 225.9,113 225.9,89C225.9,64.9 244.6,47.4 267.5,47.4C290.4,47.4 309.1,64.8 309.1,89L309.1,89ZM290.9,89C290.9,74 280,63.7 267.4,63.7C254.8,63.7 244,74 244,89C244,103.8 254.8,114.2 267.4,114.2C280.1,114.2 290.9,103.7 290.9,89L290.9,89Z"/><path fill="#4285f4" d="M66.6,112.3C40.5,112.3 20.1,91.3 20.1,65.2C20.1,39.1 40.5,18 66.6,18C80.7,18 90.9,23.6 98.5,30.7L111.1,18.1C100.5,8 86.3,0.3 66.6,0.3C30.8,0.3 0.7,29.4 0.7,65.2C0.7,100.9 30.8,130.1 66.6,130.1C85.9,130.1 100.5,123.7 111.9,111.9C123.6,100.2 127.2,83.7 127.2,70.4C127.2,66.2 126.7,61.9 126.1,58.8L66.6,58.8L66.6,76.1L109,76.1C107.8,86.9 104.3,94.3 99.3,99.4C93.2,105.5 83.5,112.3 66.6,112.3L66.6,112.3L66.6,112.3Z"/></svg>`;
  // The search box's buttons: clear, voice, Lens and search.
  const boxButtons = `<span class="qbtns" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path fill="#70757a" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg><span class="qsep"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="9" y="3" width="6" height="11" rx="3" fill="#4285f4" stroke="none"/><path d="M6 11a6 6 0 0 0 6 6" stroke="#fbbc04"/><path d="M18 11a6 6 0 0 1-6 6" stroke="#ea4335"/><path d="M12 17v4" stroke="#34a853"/></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M4 10V7a3 3 0 0 1 3-3h3" stroke="#4285f4"/><path d="M14 4h3a3 3 0 0 1 3 3v3" stroke="#ea4335"/><path d="M4 14v3a3 3 0 0 0 3 3h3" stroke="#34a853"/><circle cx="12" cy="12" r="3" fill="#4285f4" stroke="none"/><circle cx="17.5" cy="17.5" r="2" fill="#fbbc04" stroke="none"/></svg>
      <svg viewBox="0 0 24 24"><path fill="#4285f4" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
    </span>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(query)} - Google Search</title>
  <style>
    body{margin:0;font:14px/1.58 Arial,sans-serif;background:${c.bg};color:${c.text}}
    .hdr{display:flex;align-items:center;padding:20px 0 12px}
    .glogo{box-sizing:border-box;flex:0 0 168px;padding:2px 0 0 30px}.glogo svg{display:block}
    .q{box-sizing:border-box;flex:0 0 692px;height:46px;margin:0;border-radius:24px;box-shadow:${c.shadow};padding:0 6px 0 20px;display:flex;align-items:center;background:${c.box}}
    .q textarea{flex:1;height:22px;border:0;padding:0;resize:none;overflow:hidden;background:none;color:inherit;font:16px/22px Arial,sans-serif;outline:none}
    .qbtns{display:flex;align-items:center}.qbtns svg{width:24px;height:24px;padding:0 8px}
    .qsep{width:1px;height:28px;margin:0 4px;background:${c.rule}}
    .tabs{display:flex;padding:0 0 0 168px;border-bottom:1px solid ${c.line};font-size:14px;color:${dark ? '#bdc1c6' : '#5f6368'}}
    .tabs>*{padding:8px 12px 9px;border-bottom:3px solid transparent;color:inherit;text-decoration:none;white-space:nowrap}
    .tabs>b{font-weight:700;color:${c.text};border-bottom-color:${c.text}}
    .tabs>.tools{margin-left:28px}
    #search{padding:20px 0 60px 180px;max-width:652px}
    .MjjYud{margin-bottom:30px}
    ${inner ? '.MjjYud{margin-bottom:0}.MjjYud>.g{margin-bottom:30px}' : ''}
    :is(.yuRUbf,.xe8e1b) a{text-decoration:none;display:inline-block}
    :is(.yuRUbf,.xe8e1b) br{display:none}
    h3{margin:0 0 3px;padding-top:5px;font-size:20px;font-weight:400;line-height:1.3;color:${c.link}}
    .TbwUpd{display:flex;align-items:center;gap:12px;order:-1}
    :is(.yuRUbf,.xe8e1b) span[jscontroller]{display:flex;flex-direction:column}
    :is(.yuRUbf,.xe8e1b) a{display:flex;flex-direction:column}
    .favicon{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:${dark ? '#3c4043' : '#f3f5f6'}}
    .VuuXrf{display:block;font-size:14px;line-height:20px;color:${c.site}}
    cite{font-style:normal;font-size:12px;line-height:18px;color:${c.muted}}
    .VwiC3b{color:${dark ? '#bdc1c6' : '#474747'};line-height:22px}
    .B6fmyf{display:none}
    #rcnt{display:flex;gap:40px}
    #rhs{width:300px;margin-top:20px;padding:16px;border:1px solid ${c.rule};border-radius:8px;align-self:flex-start}
    ${aiAbove === 'grid' ? `#rcnt{display:grid;grid-template-columns:180px repeat(12,54px) 1fr;column-gap:0}
    .aiabove{grid-column:1 / -1}#center_col{grid-column:2 / span 12}#rhs{grid-column:14;margin-left:40px}` : ''}
    ${aiAbove ? `#rcnt{flex-wrap:wrap;row-gap:0}
    .aiabove{flex:0 0 100%;box-sizing:border-box;padding:24px 0 22px 180px;border-bottom:1px solid ${c.line}}
    .aiabove .YzCcne{max-width:652px}.aiabove .Fzsovc{font-size:16px;margin-bottom:10px}.aiabove .aitext{font-size:16px;line-height:26px}
    .aiabove .disclaimer{margin-top:8px;font-size:12px;color:${c.muted}}` : ''}
    .forum-meta{font-size:12px;line-height:18px;color:${c.muted}}.answers{color:${c.link}}
    #botstuff{padding:0 0 40px 180px;max-width:652px}.rhead [role=heading]{font-size:20px}
    .rgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 30px}.rgrid a{padding:10px 16px;border-radius:8px;background:${c.soft};color:inherit;text-decoration:none}
    .AaVjTc td{padding:0 6px}
    .module{margin:0 0 30px;padding:14px 16px;border-radius:12px;background:${c.soft}}
    .module [role=heading][aria-level="2"],.module h1,.module h2{font-size:18px;margin:0 0 8px}
    .vrow{display:flex;gap:12px}.vrow a{flex:1;color:inherit;text-decoration:none}
    .ai{margin:20px 0 10px 180px;max-width:620px}
    .sitelinks{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin:8px 0 0 20px}
    .sitelinks h3{font-size:16px}
    /* Google's own panels have no background: a heading, then the content. */
    .module.ai,.module.videos,.module.paa{padding:0;border-radius:0;background:none}
    .module.ai{margin:24px 0 12px 180px;max-width:652px;padding-bottom:22px;border-bottom:1px solid ${c.line}}
    .ai .aio{display:flex;align-items:center;gap:10px;margin:0 0 12px;font:400 16px/24px "Google Sans",Arial,sans-serif}
    .ai .aio::before{content:"";width:20px;height:20px;background:linear-gradient(135deg,#4285f4,#9b72cb 55%,#d96570);clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)}
    .ai .aio+div{max-height:104px;overflow:hidden;font-size:16px;line-height:26px;-webkit-mask-image:linear-gradient(#000 45%,transparent);mask-image:linear-gradient(#000 45%,transparent)}
    .ai button{margin-top:12px;height:40px;padding:0 18px;border:0;border-radius:20px;background:${c.soft};color:inherit;font:14px "Google Sans",Arial,sans-serif}
    .module.videos>[role=heading],.module.paa h2{margin:0 0 14px;font:400 22px/28px "Google Sans",Arial,sans-serif}
    .module.videos .vrow{flex-direction:column;gap:18px}
    .module.videos .vrow>a{position:relative;display:grid;grid-template-columns:152px 1fr;column-gap:16px;align-content:start}
    .module.videos .vrow>a::before{content:"";grid-row:1/4;height:86px;border-radius:8px}
    .module.videos .vrow>a::after{position:absolute;left:8px;top:60px;padding:0 5px;border-radius:4px;background:#000b;color:#fff;font-size:12px;line-height:18px}
    .module.videos .vrow>a:nth-child(1)::before{background:linear-gradient(transparent 66%,#8c5a2e 66%),conic-gradient(from 150deg at 40% 26%,#a66a35 0 60deg,transparent 0),linear-gradient(#f4c07a,#e39a52)}
    .module.videos .vrow>a:nth-child(2)::before{background:radial-gradient(ellipse 16% 34% at 50% 58%,#c89b3c 0 90%,transparent 100%),linear-gradient(135deg,#46423b,#1e1d1a)}
    .module.videos .vrow>a:nth-child(3)::before{background:radial-gradient(circle at 76% 26%,#f5f1e3 0 7%,transparent 8%),linear-gradient(transparent 72%,#26221e 72%),linear-gradient(#1c2a44,#4a5775)}
    .module.videos .vrow>a:nth-child(1)::after{content:"6:14"}
    .module.videos .vrow>a:nth-child(2)::after{content:"12:40"}
    .module.videos .vrow>a:nth-child(3)::after{content:"3:52"}
    .module.videos .vrow [role=heading]{font-size:18px;line-height:24px;color:${c.link}}
    .module.videos .vrow span{font-size:14px;line-height:20px;color:${c.muted}}
    .module.paa>div:first-child{border-bottom:1px solid ${c.rule}}
    .module.paa h2{margin:0;padding-bottom:12px}
    .related-question-pair{display:flex;align-items:center;min-height:48px;border-bottom:1px solid ${c.rule};font-size:16px}
    .related-question-pair>div{flex:1}
    .related-question-pair::after{content:"";width:7px;height:7px;margin:0 10px 5px;border:solid ${c.muted};border-width:0 2px 2px 0;transform:rotate(45deg)}
    ${hostile ? `
    .aux{display:none}
    .flipwrap>span{transform:scaleY(-1)}
    .flipwrap>span>a{transform:scaleY(-1)}
    .MjjYud>:last-child:not(.hw1){display:none}
    #top-extra{position:absolute;left:-9999px}` : ''}
  </style></head><body>
  <div class="hdr"><span class="glogo">${logo}</span><form class="q" role="search" action="/search"><textarea name="q" rows="1">${esc(query)}</textarea>${boxButtons}</form></div>
  <div class="tabs" ${aiLabel ? '' : 'role="navigation"'}>${modules || aiLabel ? '<a href="/search?q=anubis&udm=50"><span>AI Mode</span></a>' : ''}<b>All</b><span>Images</span><span>Videos</span><span>News</span><span>Short videos</span><span>Forums</span><span>More</span><span class="tools">Tools</span></div>
  ${hostile ? '<div id="top-extra"><a href="https://ads.example.net/offer"><h3>Sponsored offer</h3></a></div>' : ''}
  <div id="rcnt">${aiRow}<div id="center_col" role="main">${aiOverview}
  <div id="search"><div data-hveid="CAQQAA"><h1 style="display:none">Search Results</h1><div id="rso">${items.join('')}</div></div></div>
  ${botstuff}</div>${sidePanel}</div>
  ${related ? '' : pager}
  </body></html>`;
}

// Google's phone layout (Firefox for Android, Chrome on a phone). Modelled on
// uBlacklist's "Web (mobile)" rules in serpinfo/google.yml, not on a live page:
// titles are ARIA headings instead of h3, the address is in its own element
// (.ob9lvb) rather than <cite>, and top stories cards have headings of their own.
export function googleMobile(query, results) {
  const card = (t, i) =>
    `<div class="nc" data-news-cluster-id="${i}"><a href="https://news-example.com/${i}"><div role="heading" aria-level="3">${t}</div><span>News Example</span></a></div>`;
  const stories = `
      <div class="MjjYud"><div class="module news"><div role="heading" aria-level="2">Top stories</div>
        <div class="nrow">${['Shrine to Anubis found', 'Jackal mummies in Saqqara'].map(card).join('')}</div></div></div>`;
  const items = results.map(([url, title, snippet], i) => {
    const u = new URL(url);
    // One opaque /goto link, which needs the displayed address.
    const href = i === 3 ? `/goto?url=CAESopaqueblob${i}` : url;
    return `
      <div class="MjjYud"><div class="vt6azd Ww4FFb"><div class="Z26q7c">
        <a class="UBFage" href="${href}"><div class="v7jaNc" role="heading" aria-level="3">${esc(title)}</div>
          <div class="site"><span class="favicon"></span><span class="ob9lvb">${esc(`${u.hostname} › ${u.pathname.split('/').filter(Boolean)[0] ?? ''}`)}</span></div></a>
        </div><div class="snippet">${esc(snippet)}</div></div></div>`;
  });
  items.splice(2, 0, stories);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(query)} - Google Search</title>
  <style>
    body{margin:0;font:16px/1.5 Arial,sans-serif;background:#fff;color:#202124}
    .hdr{padding:12px 16px}.q{height:44px;border-radius:22px;box-shadow:0 1px 6px #20212447;padding:0 18px;display:flex;align-items:center}
    #rso{padding:8px 0}
    .MjjYud{margin:0 0 10px;padding:14px 16px;border-bottom:1px solid #ebebeb}
    .UBFage{display:flex;flex-direction:column-reverse;text-decoration:none;color:#1a0dab}
    [role=heading][aria-level="3"]{font-size:18px;line-height:1.3}
    .site{display:flex;gap:8px;align-items:center;color:#202124;font-size:13px;margin-bottom:6px}
    .favicon{width:22px;height:22px;border-radius:50%;background:#f1f3f4}
    .snippet{color:#4d5156;font-size:14px;margin-top:6px}
    .nrow{display:flex;gap:10px;overflow-x:auto}.nc{flex:0 0 220px}.nc a{color:inherit;text-decoration:none}
  </style></head><body>
  <div class="hdr"><div class="q">${esc(query)}</div></div>
  <div id="main" role="main"><div id="rso">${items.join('')}</div></div>
  </body></html>`;
}

// ---------------------------------------------------------------- Bing
// `inline`: Bing's "People also search for" box. On a live page (2026-09-29) it is
// div#inline_rs.b_hide, hidden, in an li.b_ans of its own in #b_results, and it
// shows with a close button under a result you went to and came back from. That
// it moves into that result is inferred, not seen: here it moves after a moment.
export function bing(query, results, { inline = false } = {}) {
  const b64 = (s) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const box = `
      <li class="b_ans" data-tag=""><div id="inline_rs" class="b_hide" data-priority=""><div class="rslist_head"><span class="rslist_title b_strong">People also search for</span><button type="button" aria-label="Close">×</button></div>
          <ul>${['javascript promise all', 'javascript async await', 'promise then catch', 'javascript promise example'].map((q) => `<li><a href="/search?q=${encodeURIComponent(q)}">${q}</a></li>`).join('')}</ul></div></li>`;
  const items = results
    .map(([url, title, snippet], i) => `
      <li class="b_algo" data-tag="">
        <div class="b_tpcn"><a class="tilk" href="https://www.bing.com/ck/a?!&&p=abc&u=a1${b64(url)}&ntb=1"><div class="tpic"></div><div class="tptxt"><div class="tptt">${esc(hostOf(url))}</div><div class="tpmeta"><div class="b_attribution"><cite>${esc(url)}</cite></div></div></div></a></div>
        <h2><a href="https://www.bing.com/ck/a?!&&p=abc&u=a1${b64(url)}&ntb=1">${esc(title)}</a></h2>
        <div class="b_caption"><p class="b_lineclamp2">${esc(snippet)}</p></div>
      </li>`)
    .join('') + (inline ? box : '');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(query)} - Search</title>
  <style>
    body{margin:0;font:14px/1.5 "Segoe UI",Arial,sans-serif;background:#fff;color:#444}
    .hdr{display:flex;align-items:center;gap:20px;padding:18px 24px;border-bottom:1px solid #eee}
    .blogo{font:700 22px/1 "Segoe UI";color:#00809d}
    .q{flex:0 1 560px;height:40px;border-radius:24px;border:1px solid #ddd;padding:0 18px;display:flex;align-items:center}
    #b_content{padding:16px 0 60px 160px;max-width:640px}
    #b_results{list-style:none;margin:0;padding:0}
    .b_algo{position:relative;margin:0 0 28px}
    .tilk{display:flex;gap:8px;align-items:center;text-decoration:none;color:#444}
    .tpic{width:28px;height:28px;border-radius:50%;background:#f3f3f3}
    .tptt{font-size:14px;color:#111}
    cite{font-style:normal;font-size:13px;color:#006d21}
    h2{margin:6px 0 4px;font-size:20px;font-weight:400}
    h2 a{color:#4007a2;text-decoration:none}
    .b_hide{display:none}
    #inline_rs{margin-top:14px;padding:14px 16px;border:1px solid #eee;border-radius:12px}.rslist_head{display:flex;justify-content:space-between;margin-bottom:10px}
    .rslist_title{font-size:18px;font-weight:600;color:#111}#inline_rs button{border:0;background:none;font-size:18px}
    #inline_rs ul{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0;padding:0;list-style:none}#inline_rs li a{display:block;padding:8px 14px;border:1px solid #ddd;border-radius:20px;color:#111;text-decoration:none}
  </style></head><body>
  <div class="hdr"><span class="blogo">Bing</span><div class="q">${esc(query)}</div></div>
  <div id="b_content"><main><ol id="b_results">${items}</ol></main></div>
  ${inline ? `<script>setTimeout(() => { const rs = document.getElementById('inline_rs'); document.querySelectorAll('#b_results > li.b_algo')[1].append(rs); rs.classList.remove('b_hide'); }, 500);</script>` : ''}</body></html>`;
}

// ---------------------------------------------------------------- Brave
// `panels`: Brave's Videos, Discussions and Related queries panels between the
// results, with the structure reported from a live page (2026-09-29): each is a
// div.snippet in section#mixed-main with its title in a <header>, and the page's
// tabs (one of them "Videos") are links in nav.tabs. The contents are made up.
export function brave(query, results, { panels = false } = {}) {
  const icon = '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor"/></svg>';
  const title = (t) => `${icon}<span class="desktop-heading-h4 t-secondary">${t}</span>`;
  const videos = `
      <div class="snippet panel cluster-videos" data-pos="3" data-type="videos" data-keynav><header class="mb-xl cluster-header">${title('Videos')}</header>
        <div class="vgrid">${['Anubis explained', 'Tomb of Anubis', 'Jackal gods', 'The weighing of the heart'].map((t, i) => `<a class="vcard" href="https://www.youtube.com/watch?v=${i}"><img alt="" width="120" height="68" style="background:#8884"><div class="vtitle">${t}</div><div>YouTube</div></a>`).join('')}</div>
        <button type="button" class="viewall">View all</button></div>`;
  const discussions = `
      <div id="discussions" class="snippet panel cluster-discussions"><header class="cluster-header">${title('Discussions')}</header><hr>
        ${[
          ['https://www.reddit.com/r/AskHistorians/comments/1/', 'Why was Anubis a jackal?', 'r/AskHistorians'],
          ['https://history.stackexchange.com/questions/2/', 'Was Anubis worshipped outside Egypt?', 'history.stackexchange.com'],
        ]
          .map(([u, t, src]) => `<div class="ditem"><a href="${u}">${t}</a><div class="dmeta">${src}</div><button type="button" aria-label="Show more">⌄</button></div>`)
          .join('')}
        <button type="button" class="more">Show more</button></div>`;
  const relatedQueries = `
      <div id="related-queries" class="snippet panel related-queries"><div class="related-queries-wrapper"><header class="cluster-header">${title('Related queries')}</header>
        <div class="rgrid">${['anubis symbol', 'anubis and osiris', 'anubis powers', 'anubis weighing of the heart'].map((q) => `<a class="related-query" href="/search?q=${encodeURIComponent(q)}">${q}</a>`).join('')}</div></div></div>`;
  const items = results
    .map(([url, title, snippet]) => `
      <div class="snippet svelte-1234" data-type="web" data-pos="0">
        <a href="${url}" class="svelte-1234 l1"><div class="site-wrapper"><div class="favicon"></div><div class="site-name-content"><div class="site-name">${esc(hostOf(url).split('.')[0])}</div><cite class="snippet-url"><span class="netloc">${esc(hostOf(url))}</span></cite></div></div>
        <div class="title search-snippet-title svelte-1234" title="${esc(title)}">${esc(title)}</div></a>
        <div class="generic-snippet"><div class="content desktop-default-regular t-primary line-clamp-dynamic">${esc(snippet)}</div></div>
      </div>`);
  if (panels) {
    items.splice(2, 0, videos);
    items.splice(5, 0, discussions);
    items.push(relatedQueries);
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(query)} - Brave Search</title>
  <style>
    body{margin:0;font:15px/1.5 Inter,-apple-system,sans-serif;background:#f3f5f7;color:#3b3e4f}
    .hdr{display:flex;align-items:center;gap:20px;padding:18px 24px;background:#fff;border-bottom:1px solid #e2e4ea}
    .brlogo{width:30px;height:34px;border-radius:6px;background:linear-gradient(#ff6000,#fb542b)}
    .q{flex:0 1 620px;height:44px;border-radius:12px;border:1px solid #d0d3de;padding:0 18px;display:flex;align-items:center;background:#fff}
    .main-column{display:block;padding:18px 0 60px 110px;max-width:680px}
    .q input{flex:1;border:0;font:inherit;background:none;outline:none}
    #primary-tabs{display:flex;gap:18px;margin:0;padding:10px 0 0 110px;list-style:none}#primary-tabs a{color:#3b3e4f;text-decoration:none}
    .snippet{position:relative;margin:0 0 14px;padding:16px 18px;border-radius:12px;background:#fff}
    .snippet a{text-decoration:none;color:inherit}
    .site-wrapper{display:flex;gap:10px;align-items:center}
    .favicon{width:28px;height:28px;border-radius:8px;background:#eef0f4}
    .site-name{font-size:14px;color:#1b1c21}
    cite{font-style:normal;font-size:12px;color:#6b6f80}
    .title{margin-top:6px;font-size:19px;color:#3e44b5;font-weight:500}
    .generic-snippet{margin-top:4px;font-size:14px;color:#51556a}
    .panel{margin:0 0 14px;padding:16px 18px;border-radius:12px;background:#fff}
    .cluster-header{display:flex;gap:8px;align-items:center;font-weight:600;color:#1b1c21}.cluster-header a{display:flex;gap:8px;align-items:center;color:inherit;text-decoration:none}
    .vgrid,.rgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.vcard,.related-query{color:inherit;text-decoration:none}
    .related-query{padding:10px 14px;border:1px solid #d0d3de;border-radius:20px}
    .ditem{position:relative;padding:10px 0}.ditem a{color:#1b1c21;text-decoration:none}.dmeta{font-size:13px;color:#6b6f80}.ditem button{position:absolute;right:0;top:12px}
  </style></head><body>
  <div id="main"><header class="hdr"><div class="brlogo"></div><form class="q" role="search" action="/search"><input name="q" value="${esc(query)}"></form></header>
  <div id="nav-tabs"><div class="nav-tabs-content"><nav class="tabs"><ul id="primary-tabs">${['All', 'Images', 'Videos', 'News'].map((t) => `<li class="tab-item"><a href="/${t === 'All' ? 'search' : t.toLowerCase()}?q=anubis"><span>${t}</span></a></li>`).join('')}</ul></nav></div></div>
  <main id="search-page"><div class="serp-layout"><div class="serp-columns"><div class="serp-columns-main"><main class="main-column"><section id="mixed-main">${items.join('')}</section></main></div></div></div></main></div></body></html>`;
}
