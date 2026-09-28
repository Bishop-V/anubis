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

// ---------------------------------------------------------------- DuckDuckGo
export function duckduckgo(query, results, dark = false, more = []) {
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
    ol{list-style:none;margin:0;padding:0}
    li{margin:0 0 26px}
    article{position:relative}
    .OHr0VX9IuNcv6iakvT6A{display:flex;align-items:center;gap:8px;font-size:13px}
    .OHr0VX9IuNcv6iakvT6A a{color:${dark ? '#8ab4f8' : '#1f7a3a'};text-decoration:none}
    .favicon{width:16px;height:16px;border-radius:4px;background:${dark ? '#444' : '#e5e5e5'}}
    h2{margin:4px 0 4px;font-size:18px;font-weight:500;line-height:1.3}
    h2 a{color:${dark ? '#a7b7ff' : '#1a0dab'};text-decoration:none}
    [data-result=snippet]{color:${dark ? '#bbb' : '#494949'};font-size:14px}
    .menu{position:absolute;top:0;right:0;border:0;background:none;color:${dark ? '#888' : '#999'};font-size:16px}
  </style></head><body>
  <div class="hdr"><div class="logo"></div><div class="q">${esc(query)}</div></div>
  <div class="tabs"><b>All</b><span>Images</span><span>Videos</span><span>News</span><span>Maps</span></div>
  <main><section data-testid="web-vertical"><ol class="react-results--main">${items}</ol>
  ${more.length ? '<button id="more-results" style="margin:10px 0;padding:8px 18px;border-radius:8px;border:1px solid #ccc;background:none;color:inherit">More results</button>' : ''}
  </section></main>
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
export function google(query, results, dark = false, next = '') {
  const items = results
    .map(([url, title, snippet], i) => {
      const host = hostOf(url);
      const crumbs = `https://${new URL(url).hostname} › ${new URL(url).pathname.split('/').filter(Boolean).slice(0, 2).join(' › ')}`;
      // Mix of link styles: direct, /url?q=, and opaque /goto (needs the <cite> fallback).
      const href = i === 1 ? `/url?q=${encodeURIComponent(url)}&sa=U` : i === 3 ? `/goto?url=CAESopaqueblob${i}` : url;
      return `
      <div class="MjjYud"><div class="g Ww4FFb vt6azd tF2Cxc asEBEc"><div class="N54PNb BToiNc">
        <div class="kb0PBd A9Y9g jGGQ5e" data-snf="x5WNvb"><div class="yuRUbf"><div><span jscontroller="msmzHf">
          <a jsname="UWckNb" href="${href}"><br><h3 class="LC20lb MBeuO DKV0Md">${esc(title)}</h3>
            <div class="notranslate TbwUpd NJjxre iUh30 ojE3Fb"><span class="H9lube"><div class="eqA2re NjwKYd Vwoesf"><div class="favicon"></div></div></span>
            <div><span class="VuuXrf">${esc(host.split('.')[0])}</span><div class="byrV5b"><cite class="qLRx3b tjvcx GvPZzd cHaqb" role="text">${esc(crumbs)}</cite></div></div></div>
          </a></span></div></div></div>
        <div class="kb0PBd A9Y9g" data-sncf="1"><div class="VwiC3b yXK7lf p4wth r025kc hJNv6b Hdw6tb" style="-webkit-line-clamp:2"><span>${esc(snippet)}</span></div></div>
      </div></div></div>`;
    })
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(query)} - Google Search</title>
  <style>
    body{margin:0;font:14px/1.58 Arial,sans-serif;background:${dark ? '#1f1f1f' : '#fff'};color:${dark ? '#e3e3e3' : '#202124'}}
    .hdr{display:flex;align-items:center;gap:28px;padding:22px 28px 16px}
    .glogo{font:600 24px/1 "Product Sans",Arial;color:${dark ? '#fff' : '#4285f4'}}
    .q{flex:0 1 690px;height:44px;border-radius:24px;box-shadow:0 1px 6px ${dark ? '#0008' : '#20212447'};padding:0 20px;display:flex;align-items:center;background:${dark ? '#303134' : '#fff'}}
    .tabs{padding:0 0 10px 180px;color:${dark ? '#bdc1c6' : '#5f6368'};font-size:14px;display:flex;gap:22px;border-bottom:1px solid ${dark ? '#3c4043' : '#ebebeb'}}
    #search{padding:20px 0 60px 180px;max-width:652px}
    .MjjYud{margin-bottom:30px}
    .yuRUbf a{text-decoration:none;display:inline-block}
    .yuRUbf br{display:none}
    h3{margin:0;padding-top:5px;font-size:20px;font-weight:400;line-height:1.3;color:${dark ? '#99c3ff' : '#1a0dab'}}
    .TbwUpd{display:flex;align-items:center;gap:10px;order:-1}
    .yuRUbf span[jscontroller]{display:flex;flex-direction:column}
    .yuRUbf a{display:flex;flex-direction:column-reverse}
    .favicon{width:26px;height:26px;border-radius:50%;background:${dark ? '#3c4043' : '#f1f3f4'}}
    .VuuXrf{display:block;font-size:14px;color:${dark ? '#dadce0' : '#202124'}}
    cite{font-style:normal;font-size:12px;color:${dark ? '#bdc1c6' : '#4d5156'}}
    .VwiC3b{color:${dark ? '#bdc1c6' : '#4d5156'};margin-top:4px}
  </style></head><body>
  <div class="hdr"><span class="glogo">Google</span><div class="q">${esc(query)}</div></div>
  <div class="tabs"><b>All</b><span>Images</span><span>News</span><span>Videos</span></div>
  <div id="search"><div data-hveid="CAQQAA"><h1 style="display:none">Search Results</h1><div id="rso">${items}</div></div></div>
  ${next ? `<table class="AaVjTc" style="margin-left:180px"><tr><td><a id="pnnext" href="${next}">Next</a></td></tr></table>` : ''}
  </body></html>`;
}

// ---------------------------------------------------------------- Bing
export function bing(query, results) {
  const b64 = (s) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const items = results
    .map(([url, title, snippet]) => `
      <li class="b_algo" data-tag="">
        <div class="b_tpcn"><a class="tilk" href="https://www.bing.com/ck/a?!&&p=abc&u=a1${b64(url)}&ntb=1"><div class="tpic"></div><div class="tptxt"><div class="tptt">${esc(hostOf(url))}</div><div class="tpmeta"><div class="b_attribution"><cite>${esc(url)}</cite></div></div></div></a></div>
        <h2><a href="https://www.bing.com/ck/a?!&&p=abc&u=a1${b64(url)}&ntb=1">${esc(title)}</a></h2>
        <div class="b_caption"><p class="b_lineclamp2">${esc(snippet)}</p></div>
      </li>`)
    .join('');
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
  </style></head><body>
  <div class="hdr"><span class="blogo">Bing</span><div class="q">${esc(query)}</div></div>
  <div id="b_content"><ol id="b_results">${items}</ol></div></body></html>`;
}

// ---------------------------------------------------------------- Brave
export function brave(query, results) {
  const items = results
    .map(([url, title, snippet]) => `
      <div class="snippet svelte-1234" data-type="web" data-pos="0">
        <a href="${url}" class="svelte-1234 l1"><div class="site-wrapper"><div class="favicon"></div><div class="site-name-content"><div class="site-name">${esc(hostOf(url).split('.')[0])}</div><cite class="snippet-url"><span class="netloc">${esc(hostOf(url))}</span></cite></div></div>
        <div class="title search-snippet-title svelte-1234" title="${esc(title)}">${esc(title)}</div></a>
        <div class="generic-snippet"><div class="content desktop-default-regular t-primary line-clamp-dynamic">${esc(snippet)}</div></div>
      </div>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(query)} - Brave Search</title>
  <style>
    body{margin:0;font:15px/1.5 Inter,-apple-system,sans-serif;background:#f3f5f7;color:#3b3e4f}
    .hdr{display:flex;align-items:center;gap:20px;padding:18px 24px;background:#fff;border-bottom:1px solid #e2e4ea}
    .brlogo{width:30px;height:34px;border-radius:6px;background:linear-gradient(#ff6000,#fb542b)}
    .q{flex:0 1 620px;height:44px;border-radius:12px;border:1px solid #d0d3de;padding:0 18px;display:flex;align-items:center;background:#fff}
    #results{padding:18px 0 60px 110px;max-width:680px}
    .snippet{position:relative;margin:0 0 14px;padding:16px 18px;border-radius:12px;background:#fff}
    .snippet a{text-decoration:none;color:inherit}
    .site-wrapper{display:flex;gap:10px;align-items:center}
    .favicon{width:28px;height:28px;border-radius:8px;background:#eef0f4}
    .site-name{font-size:14px;color:#1b1c21}
    cite{font-style:normal;font-size:12px;color:#6b6f80}
    .title{margin-top:6px;font-size:19px;color:#3e44b5;font-weight:500}
    .generic-snippet{margin-top:4px;font-size:14px;color:#51556a}
  </style></head><body>
  <div class="hdr"><div class="brlogo"></div><div class="q">${esc(query)}</div></div>
  <main id="results">${items}</main></body></html>`;
}
