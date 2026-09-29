# Experiments and decisions

What was tried while building the tagging and lists release, what failed, and what is still unverified. Newest notes go at the top of each section.

## Still unverified against live pages

The development sandbox could not reach any search engine, so everything on search pages was tested against mock pages (see [`e2e/`](https://github.com/Bishop-V/anubis/tree/main/e2e)) shaped like each engine's markup as described by uBlacklist's maintained [SERPINFO definitions](https://github.com/ublacklist/builtin/tree/main/serpinfo), checked on 2026-09-28. Before a release, load the extension and check each engine by hand:

| Engine | How results are found | Confidence |
| --- | --- | --- |
| Google | Structural (h3), `<cite>` fallback for `/goto` links | Structural approach verified live on `main` before this work; `#pnnext` for Load more results is long-standing. Automated Chromium gets a CAPTCHA, so the 2026-09-29 check below couldn't reach it |
| DuckDuckGo | Structural (h2) | Verified live, including `#more-results` for Load more results (2026-09-29) |
| DuckDuckGo HTML / Lite | Selectors from uBlacklist | Verified live, including its redirect links (2026-09-29) |
| Bing | Selectors from uBlacklist, `/ck/a` redirects decoded | Results and redirects verified live; `a.sb_pagN` is right, but the fetched page can be a CAPTCHA (2026-09-29) |
| Brave | Selectors from uBlacklist | Verified live, including `offset` for Load more results (2026-09-29) |
| Startpage | Selectors from uBlacklist | Verified live (2026-09-29) |
| Ecosia | Selectors from uBlacklist | Results verified live; `p` is right, but the fetched page is blocked (2026-09-29) |
| Yahoo | Structural, not covered by uBlacklist | Results and `/RU=` decoding verified live; `a.next` is right, but the fetched page is blocked (2026-09-29) |
| Kagi, Yandex, Mojeek | Selectors from uBlacklist (Mojeek structural) | Unverified: each showed a human check to automated Chromium |

Checked on live pages on 2026-09-29, with the Chrome build loaded in automated (headless) Chromium, clean-up fully on, and a test list that hid, lowered, raised, pinned and tagged common sites. Engines treat automated browsers with more suspicion than a person's, so the blocks below may not all happen in everyday use.

- **Results and redirects:** every engine that loaded found all its results, put the button on each, and applied the test list correctly, which means redirect links resolved to the real site: DuckDuckGo HTML and Lite, Bing's `/ck/a`, Yahoo's `/RU=`, and Startpage, Ecosia and Brave's direct links.
- **Load more results worked** on DuckDuckGo (11 results to 26, by pressing `#more-results`) and Brave (20 to 40, `offset=1`, which matches Brave's own Next link).
- **Load more results failed without saying why** on Bing, Ecosia and Yahoo. Their next-page selectors and parameters are right (Bing's Next link is `a.sb_pagN` with `first=11`, Ecosia's is `p=1`, Yahoo's is `a.next`), but the page Anubis fetches came back as a bot check: Bing's Turnstile page ("One last step", status 200, so it parses as a page with no results), Ecosia's Cloudflare firewall (403, and navigating to page 2 directly was challenged too), and Yahoo redirecting to a `_bv/v.gif` beacon (500). A 200 challenge page looks the same as the last page of results, so the button just disappears. **To do:** recognise an empty or challenged page and say so in the summary ("Bing asked to confirm you're not a robot"), and check these three engines again in an everyday browser.
- **DuckDuckGo loses your settings on its no-AI version.** DuckDuckGo stores settings as cookies for `duckduckgo.com` only: changing the region set `l=uk-en` on `duckduckgo.com`, and `noai.duckduckgo.com` went back to the region its location suggests. So "AI answers" quietly resets region, theme and the rest. **To do:** carry the settings over, for example as DuckDuckGo's documented URL parameters (`kl`, `kae`…), which share the cookies' names.
- **DuckDuckGo's Wikipedia panel** (`li[data-layout="about"]`, in the results list) counts as a result, linked to Wikipedia. Hiding wikipedia.org hides it. That seems reasonable, but it's a panel, not a result.
- **Brave's AI answer** is `#llm-snippet` inside `#mixed-top`, not `#summarizer` (which wasn't on the page). It has no heading; clean-up removed it through its disclaimer, "AI-generated answer. Please verify critical facts.", which starts with the `AI-generated answer` marker.
- **Bing's AI answer is not removed.** It is `li.b_ans.b_top` at the top of `#b_results`, with the answer in `.cht_container` and a `.cht_disclaimer` element. Its only label is `aria-label="AI Overview"`, which clean-up doesn't read, and its visible `h2` is the answer's first sentence. It didn't appear for every query. **To do:** accept `aria-label` text as a label, or add `.cht_container` to Bing's selectors.
- **Bing's video panel is not removed.** It's `li.b_ans.b_vidAns` (`#serpvidans`) with the heading "Videos of how to bake sourdough bread", which the whole-text match for "Videos" misses. **To do:** add `Videos of ` as a prefix. Bing's related searches were removed.
- **Yahoo:** its video and image panels and related searches were removed. **Ecosia:** related searches removed. **DuckDuckGo:** the image row and related searches removed.

DuckDuckGo's own "hide this site" was simulated in the mocks (the result collapses into a notice); Anubis removes its UI from the collapsed result. The real feature's markup is unknown.

Clean-up on Google, confirmed from a live results page on 2026-09-29 (the troubleshooting snippet's output: tags, classes and roles only):

- Everything in the results list sits in a wrapper: `#rso > div > …`. Panels are `div.ULSxyf > div.MjjYud > …`, and "People also ask" and the video panel both start with `div.A6K0A[data-rpos]`.
- The AI Overview's label is `div.Fzsovc[role=heading]`, not a heading element, inside `div.YzCcne` and `#m-x-content`. Removed correctly (the whole `div.ULSxyf`) after the label fix.
- "People also ask" and "Videos" labels are `span.mgAbYb[role=heading]`. The video panel's header row is `div.UjLRDc`, inside `div.vtSz8d` with the videos.
- AI Mode appears twice: a tab (`div[role=listitem]` in `div[role=list]` in `[role=navigation]`) and a `button[role=link]` beside the search box in `form#tsf[role=search]`. Both are removed with AI answers (the button alone, never the form).
- Tabs named "Videos" and "Short videos" are links in that navigation row and are rightly left alone.

- A second search showed the AI Overview outside the results column altogether: `#rcnt > div.bzXtMb.M8OgIe > …`, above `#center_col`. Only the selector from community filter lists (`.M8OgIe`) caught it, since its label never reaches the column. The images panel is `span.mgAbYb[role=heading]` inside `div.Lv2Cle[data-count]`, in the usual `div.ULSxyf > div.MjjYud > div.A6K0A[data-rpos]`.
- The summary went above the first result, so a panel before it (the images panel) pushed it down. It's now the first thing in the results area (`#rso` on Google), above panels. Some results carry a thumbnail in their top-right corner, where the ⇅ button sat on top of it; the button now moves left of any picture there. Both are in the `videos=google` mock; the previous build fails them.

Still to check for clean-up:

- Google: that "AI Overview", "Videos", "People also ask", "Top stories" and "Related searches" are still headings (`h1`–`h4` or `role="heading"`) at the top of their blocks, and that the blocks sit in `#rso`, `#botstuff` or the `role="main"` column. That the AI Mode tab is a link with that exact text in a `role="navigation"` or `role="list"` element. That choosing All from the Web tab lands on a `/search` URL without `udm`, so Anubis leaves it alone.
- The selectors `[data-attrid="AIOverview"]` and `.related-question-pair` (Google) come from community filter lists. `#summarizer` (Brave) wasn't on the page on 2026-09-29; see above. DuckDuckGo's settings on `noai.` and Bing's and Brave's AI answers were checked on 2026-09-29, above.

Google's phone layout (for Firefox for Android) is modelled on uBlacklist's "Web (mobile)" rules only. To check on a phone: that titles are `role="heading"` elements with `aria-level="3"` inside the result's link, that the address is in `.ob9lvb`, that top stories cards carry `data-news-cluster-id`, and how the phone layout loads more results.

## Store listings

- **Chrome's publishing API:** v1.1 and its refresh tokens stop working on 15 October 2026. `wxt submit` (publish-browser-extension 6.1.1 in WXT 0.21) can use v2 with a service account but still defaults to v1.1, so `CHROME_API_VERSION=v2` has to be set. Found by reading the installed package, not its documentation.
- **Privacy page:** it said Anubis connects to list hosts "only when you use the feature", but the four built-in lists download from GitHub on install, and opening Settings → Lists fetches the directory. Both are now listed, since the page doubles as the stores' privacy policy.
- **Store icon:** Chrome wants the logo at 96×96 inside 128×128 of transparent padding; the toolbar icon fills the square, so `store/icon-128.png` is rendered separately (`store/render.mjs`), as is the 440×280 promo tile.
- **Screenshots:** not made from the e2e mocks. They look like the engines but aren't them, and a listing has to show the real thing.

## Welcome page

Asked for: pinning and the starter lists were only explained in the user guide, which people rarely open before their first search.

- **Shipped:** `entrypoints/welcome/`, opened by the background script when `runtime.onInstalled` says `install` (never on updates, and it needs no permission). It gives this browser's steps to pin the toolbar button, a search to try on four engines, and the lists you're subscribed to with the tags each adds. The search is "python list comprehension", which brings up official docs, forums and Wikipedia, so three of the four starter lists show a tag. The lists come from storage rather than the directory, so a reinstall that syncs other subscriptions shows those.
- **Pinned or not:** Chromium browsers answer `action.getUserSettings()` with `isOnToolbar`, and newer Chrome fires `onUserSettingsChanged`. The page checks on load, on that event and when the window regains focus, and says "Anubis is in your toolbar." instead of the steps once it is. Where the browser doesn't say, the steps stay. The e2e browser can't pin, so only the unpinned state is tested.
- **Not done:** `browser_action.default_area: "navbar"` for Firefox, which would put the button on the toolbar straight away. Firefox's own default keeps new buttons in the Extensions panel, and the steps cover it.
- **Firefox for Android** has no toolbar for extensions; the page still shows Firefox's desktop steps there. Fix that when Android is checked (`ROADMAP.md`).
- `npm run dev` starts with a fresh browser profile, so it opens the welcome tab each time.

## Keyboard shortcuts

- Two `commands`: Alt+Shift+O turns Anubis on or off, Alt+Shift+H shows hidden results and hides them again. They need no permission. On a Mac they use Control, because Option+Shift types characters (Ø, Ó) and would be taken from text fields.
- Show hidden lives in the content script's state, so the background script sends the tab a `toggle-reveal` message rather than changing storage.
- A test can't press a browser-level shortcut, so the e2e `shortcuts` part checks the keys are registered and sends the same message the background script does.
- The popup's tooltips show the keys the browser actually assigned (`commands.getAll()`), since people can change them or another extension can claim them first.

## Phone layouts (Firefox for Android)

- **Found:** Google sends phones a different layout, where titles are `div role="heading" aria-level="3"` rather than `h3` (uBlacklist's "Web (mobile)" rules). Anubis found no results at all there: the new `mobile` e2e part, against a `googleMobile` mock, reported 0 results on the previous build and 7 now.
- **Shipped:** an engine can carry `mobile` changes, chosen from the user agent (`Mobi`, as engines do; tablets get the computer layout) when the content script starts. Google's heading selector adds ARIA headings but leaves out top stories cards (`[data-news-cluster-id]`), which have the same headings. Load more results is off on Google phones until the phone layout's paging is known.
- **Found in the phone screenshot:** a long hidden line ran its Show button under the ⇅ button, and the summary sat against the screen edge. Hidden lines now leave room for the button, the summary gets an inset below 600 px, and the ⇅ button is 32 px on touch screens.
- **Tried:** emulating the phone with the DevTools protocol's device metrics. Full-page screenshots came out cropped and scrolled sideways; a plain 412 px viewport with a phone user agent is enough.
- **Not yet:** `gecko_android` in the manifest. AMO offers an add-on on Android from the first version whose manifest has it, so it waits until a phone has been checked (`ROADMAP.md`).

## Translation

- **Tried:** WXT's `@wxt-dev/i18n` module. It's typed and reads YAML, but its README says its plural forms don't support languages with separate "few" or "many" forms (Arabic, Polish, Russian…), and it adds three dependencies.
- **Shipped:** the browsers' own `_locales/<language>/messages.json` format, which translation tools read as they are, with a small helper (`utils/i18n.ts`). Keys are type-checked against the English file. Counts use `Intl.PluralRules` with keys like `popupListCount_one` and `popupListCount_other`, falling back to `_other`. A `langCode` message gives the language the text is actually in, for the page's `lang` attribute, since a missing translation falls back to English.
- WXT types `getMessage` with one overload per key, which a key held in a variable can't satisfy, so the helper calls it through a looser signature.
- The fake browser in unit tests has no `i18n`; `tests/i18n.test.ts` answers from the English file.

## Engine watch

- A weekly workflow opens an issue when uBlacklist changes its rules for an engine Anubis supports. The development sandbox can't reach GitHub's API, so the script reads upstream history with `git log` over a blobless clone and only files the issue through `gh`. Run against real history, it reported four Google changes in 45 days; commits already mentioned in an `engines` issue are skipped, so the ten-day window can overlap safely.

## Documentation site

Modelled on [uBlacklist's documentation](https://ublacklist.github.io/docs/introduction): an introduction, getting started with screenshots, then one page per feature, publishing, and a directory of lists.

- **Tried:** VitePress 1.6.4, the current stable release. It pulls in Vite 5 and an esbuild with published advisories for their development servers (`npm audit`: two moderate, one high). **Shipped:** VitePress 2.0.0-alpha.20, which uses the same Vite 8 as the extension and audits clean. It only builds the documentation, so a pre-release costs little; move to 2.0 stable when it's out.
- **Not used:** Hugo, which uBlacklist's site uses. It would need a second toolchain alongside Node and the Nix flake.
- **Screenshots** come from the e2e mock pages (`node e2e/run.mjs docs`), so they can be regenerated after interface changes instead of retaken by hand. They show test pages, not the real engines, and the captions say so.
- **Images** live in `docs/img/` and pages link to them relatively, so the Markdown reads correctly on GitHub as well as on the site. Links to repository files outside `docs/` are full GitHub links, since the site can't serve them.
- The lists directory page renders `lists/directory.json` at build time, so it can't drift from what the extension offers.
- Publishing uses GitHub Pages from a workflow. Pages has to be switched to "GitHub Actions" in the repository settings once; until then the deploy step fails.

## Wording, icons and the motif

Feedback from use: "weigh" was too ambiguous for the functions people rely on ("Weigh deeper", "Weigh a site", "Weigh this site"), the settings button's icon read as a sun, and the Anubis logo on every result said who made the button, not what it does. The motif (the balance in the menu, the cartouche) was liked; it was the words and icons that got in the way.

- **Inspiration:** Scott Jenson's talk "Are we really going to use the same Desktop UX forever?" (KDE Akademy 2026) treats UX as layers (style, structure, strategy, technology) and argues for tools shaped around the task in front of you rather than around the software. Here the style layer (the Egyptian theme) had leaked into the structure layer (the names of functions). The `ux-heuristics` skill (Krug's *Don't Make Me Think*, Nielsen's heuristics) was installed in `.claude/skills/` for the review. It flags this exact pattern: clever names lose to clear names, and icons without labels make people guess ("mystery meat navigation").
- **Changed:** "Weigh deeper" is now "Load more results" (and "Loading…"), and "Look deeper automatically" is "Load more results automatically". "Weigh a site" is "Add a site". The per-site choice is called its *ranking* everywhere (Hide, Lower, Normal, Raise, Pin). The button on each result shows up and down arrows with the label "Hide, rank or tag this site". The summary's gear is now a text button, "Settings". The fallback summary "Anubis weighed 9 results" is now "Anubis left all 9 results as they were".
- **Later:** the Settings buttons (in the summary, the result menu and the popup) went back to an icon on request, this time a toothed cog (Lucide's "settings" icon) rather than the earlier circle with rays, which read as a sun. A cog is one of the few icons almost everyone recognises; each has a label for screen readers and a tooltip.
- **Kept:** the balance and cartouche in the menu, the logo as the summary's mark (it says the line comes from Anubis), and the myth in the README.
- **Considered:** a "⋯" button for the result menu. Rejected because Google and DuckDuckGo already put their own "⋮" menu on each result, and two lookalike menus would be confusing.
- Also considered: Vercel's `web-design-guidelines` skill. Not installed, because it downloads its rules from the network on every run.

## Clean up pages

Asked for: a global option to force-remove AI answers (Gemini's AI Overview, Duck.ai) and other clutter such as video panels.

- **Tried first, rejected:** class-name selectors from community uBlock filter lists (for example `.M8OgIe`, `.hdzaWe` and `[data-mcpr]` for Google's AI Overview). They are the usual approach, but the lists warn that Google rotates these names, the problem the README describes for results.
- **Shipped:** blocks are found from their visible heading ("AI Overview", "Videos", "People also ask"…, matched whole and ignoring case, with common translations in `utils/cleanup.ts`), then widened to the block in the results column. The column is the results' own list, the engine's boundary (`#rso`, `role="main"`…), or an element inside that boundary which also holds results. A heading that never reaches the column, like "Images" in Google's side panel, is left alone, and a block that contains a result or the search box is never removed. When the heading's block sits next to another heading of the same or higher level, only that section goes: "Images" inside a panel in the column removes the image row, not the panel. A first version of that rule stopped before checking the column and removed the side panel's image row too; the `cleanup` e2e part covers both. A few selectors from filter lists back the headings up where a heading isn't enough.
- **Forcing it:** removing an element after the engine renders it can always be outrun by a redesign, so the switches that stop AI answers at the source are used too. "AI answers" sends DuckDuckGo searches to `noai.duckduckgo.com`, DuckDuckGo's own no-AI version, which has no Search Assist or Duck.ai. For Google, "Always open the Web tab" adds `udm=14`, Google's own filter for plain web links (the Web tab under More). It's a separate switch because it also drops everything else that isn't a link. Choosing All from the Web tab is remembered for that search in the tab's `sessionStorage`, so it isn't bounced straight back.
- **Not used:** a `noai=1` URL parameter for DuckDuckGo, mentioned by one blog but not in DuckDuckGo's documented parameters (`duckduckgo-help-pages/_docs/settings/params.md`). Brave's `summary=0` parameter, which Brave community threads report no longer works. A `declarativeNetRequest` rule that rewrites Google URLs before the page loads: it's faster, but it needs a new permission, and the redirect from the content script is quick enough.
- **Bug found in use:** "AI answers" didn't remove Google's AI Overview. Only heading elements were read as labels, but the label can be a plain `div` beside an icon, and an icon's `<title>` adds text that breaks an exact match. The guard against removing the search box also refused any block with a `q` field, which a follow-up box inside the Overview may have. Now any short text node that is a label counts, as does text only an AI answer has ("AI responses may include mistakes"), selectors from community filter lists (`.M8OgIe`, `.YzCcne`) back them up, and only the page's first search box is protected. An `aiLabel` Google mock covers this; the previous build removes nothing on it. Google's real markup is still unconfirmed; the troubleshooting page asks for its structure (tags, classes and roles, no text).
- **Bug found in use:** "Videos" removed only the heading above a video panel. Each video has a title heading in a link, so Anubis took the videos for results, and clean-up refused to remove a block containing results. Worse, the sitelink rule merged the videos into one "result" (they share a site), which swallowed the panel's heading too. Now only the main list of results (the list holding the most) is protected, results inside a removed panel go with it and leave the summary's counts, and sitelinks are only merged under a result that shows its address, which videos don't. The `aiLabel` Google mock has such a panel; the previous build leaves it in place.
- **Still only the heading, on live Google:** a screenshot showed the dashed "removed" outline around the "Videos" header row alone. Three layouts give that, and all three are now Google mocks (`videos=titles|groups|split`) that fail on the previous build: each video's title is a heading outside its link, which the section rule took for a separate section; the videos have `<h3>` links, and Google's results sit in small groups, so the videos were the biggest "list" and got protected as the main results; or the header row, the videos and "View all" are separate blocks. Main results are now the ones that show an address; a heading repeated across look-alike cards is an item title, not a section; and when a removed block is little more than its label, the blocks after it go too, up to a result or another section. Which layout Google really uses is still unknown; the troubleshooting page's snippet now covers panels as well as AI answers.
- **Fixed from the live structure:** on the real page Anubis stopped at the video panel's header row (`div.UjLRDc`) instead of the panel. Google marks each block in the list with `data-rpos`, so engines can now declare a `blocks` selector: a recognised heading inside a marked block removes the whole block, up to the column, unless a real section of it is meant ("Images" in a panel keeps the panel). A "section" that is only its heading row no longer counts as one, and clickable cards (`[role=link]`, `[jsaction]`) count as items. The `videos=google` mock copies the reported structure; the previous build left the videos in place on it.
- **Visible and undoable:** the summary names what was removed ("…and removed an AI answer and a video panel"), and "Show hidden" brings removed blocks back on that page, marked with a dashed outline. The AI Mode tab is removed but not counted, since it isn't content.

## Hidden results: removed by default

Feedback from use, with a screenshot of a page where one site filled most results: the "Collapse" style's line per hidden result ("fandom.com hidden by your list · Show", fifteen times) clogged the page.

- **Default changed** from Collapse to Remove. Hidden results leave the page; the summary counts them ("Anubis hid 12 of 20 results") and **Show hidden** brings them back, so nothing goes without a trace. Settings saved with the old default move over once (`sync:hideStyleMoved` records it); choosing Collapse afterwards sticks.
- **Collapse, better:** hidden results in a row now share one line ("starwars.fandom.com and 1 more hidden by your list"), whose **Show** brings back the whole run. A run is results that are next to each other in the page, skipping Anubis's own elements and removed panels. The `runs` e2e part checks it on a Google page where one site is everywhere.
- The e2e harness keeps Collapse (most checks use the lines) and marks the migration as done, since it would otherwise switch the seeded setting to Remove the moment the extension installs.

## Toolbar icon when off

- Turning Anubis off now swaps the toolbar icon for a grey copy (`public/icon-off/`) and sets its tooltip to "Anubis is off". The grey icons were made once from the colour ones with a canvas in Chromium: luminance, flattened, 75% opacity, so they read as "off" on light and dark toolbars. The icon is set every time the background script starts, because the browser forgets a changed icon on restart.

## Bugs found while testing

- **Show on one hidden result reverted when the mouse moved.** The button set `data-anubis-reveal` on the result directly. Engines rewrite parts of the page on hover, that runs another pass, and the pass reset the attribute from the page-wide "Show hidden" state. Results shown one at a time are now remembered by URL until the next search. The e2e `reveal` part clicks Show, changes the page and moves the mouse; it failed on the previous build.
- **The popup got no numbers from the page in Chrome.** The content script replied to messages by returning a promise, which Firefox accepts and Chrome ignores, so the popup's "This page" section never filled in Chrome. Both scripts now reply with `sendResponse`. Found because the e2e harness asked the page for its stats and got `undefined`.
- **Testing closed shadow roots.** Page scripts and Playwright locators can't reach into closed shadow roots, so e2e clicks buttons there through the DevTools protocol (`DOM.getDocument` with `pierce: true`, then the button's box).

## Google in Firefox: flipped tags, missing buttons, misplaced summary

**Follow-up:** after the fixes below, the summary still sometimes appeared below the first results. The anchor was the first result in the list holding most results, and Google nests some results one level deeper than the rest: a first result with sitelinks, or a group of results. The first result then wasn't in that list, so the summary went below it; with six sitelinks, the sitelinks became that list and the summary went inside the first result. A `grouped` Google mock (six sitelinks under the first result, two results in a group) reproduces this on the previous build.

- **Summary anchor, again.** The results area is now the list holding most results, widened to the engine's boundary (Google's `#rso`). The summary goes above the first result anywhere in that area, as a direct child of the smallest element holding every result in it.
- **Sitelinks.** Each sitelink has its own `h3`, so each was weighed as a result, with its own tags and weigh button, and it cut the first result's container short (its parent held a second heading), leaving the snippet and sitelinks outside it. A heading that links to the same site, and shows no address of its own, now counts as part of the result above it. Grouped results each show an address, so they stay separate.
- **To confirm live:** that Google's sitelinks still use `h3` inside a link and show no `<cite>`, and that `#rso` still holds the results.

Reported from real use: on Google in Firefox the "Reference" tag and "Hidden" read upside down, the weigh button appeared on only the first two results, and on page 2 the summary sat under the first result with no weigh buttons at all. Google couldn't be loaded from the development sandbox, so the fixes target every mechanism that produces these symptoms, and a hostile Google mock (`google(…, hostile = true)` in `e2e/fixtures.mjs`) reproduces all three on the previous build and passes on the new one.

- **Flipped text.** Some layouts flip a wrapper with a transform and flip their own children back, which leaves anything else inside the wrapper upside down. The tag row was inserted inside the title link's wrapper. It now climbs out of wrappers that hold only the title, steps outside any transformed wrapper, and, as a last resort, adds up its ancestors' transforms and applies the inverse so its text reads upright.
- **Page CSS reaching Anubis's elements.** A shadow root protects its contents, not the host element, and the page's stylesheets can still match the host (`… > :last-child` and the like), hiding or transforming it. Every host now pins display, visibility, opacity, position and all transform properties inline with `!important`, which beats any page rule.
- **Nesting depth.** Finding a result's container gave up after 8 levels, a limit carried over from the original script. Google already nests a result about 8 deep, so a few more wrappers left Anubis on an inner block: the weigh button, hiding and reranking all acted on part of a result, and the summary landed inside the first result. The limit is now 30; the real stops are the results boundary and a parent holding a second result.
- **Summary anchor.** The summary went before the first heading in page order, which can belong to something else. It now goes before the first result in the list that holds most of the results (revised in the follow-up above).
- The weigh button now rests at low opacity instead of being invisible until hover, as the original block icon was always visible.

## Reranking

- **Tried:** moving result nodes in the DOM. **Rejected before building:** DuckDuckGo and Google render results with their own scripts (React on DuckDuckGo), which own those nodes; moving them risks breaking "More results", keyboard navigation and hydration.
- **Shipped:** the results' parent becomes a flex column and each result gets a CSS `order`. Nothing moves in the DOM. Caveats: vertical margins no longer collapse between results (slightly larger gaps on some layouts), and keyboard navigation (DuckDuckGo's j/k) follows DOM order, not visual order.
- **Bug found:** ties between a boosted result and its neighbour went to the original order, so `boost=1` never moved anything. Ties now go to the higher score.

## Load more results (more than one page of results)

Called "Weigh deeper" until the wording review below.

- Engines only send one page, so an extension can only rerank what is on screen. Weigh deeper brings the next pages onto the current one: DuckDuckGo gets its own "More results" button pressed; Google, Bing and Yahoo have their next-page link fetched; Brave and Ecosia get their page parameter incremented. Fetched pages are parsed with `DOMParser` and run through the same result finder as the live page, so no per-engine import code was needed.
- Off by default and never automatic unless chosen, with 700 ms between page requests, because extra requests to an engine can trigger rate limits or CAPTCHAs. Requests only go to the engine's own origin.
- **Bug found:** the automatic mode ran during the first pass, before the mutation observer's state existed (a temporal dead zone error in the minified build). The observer is now set up before the first pass.

## Shadow DOM UI

- All UI on search pages lives in closed shadow roots, so the engine's CSS can't restyle it and its scripts can't read your tag names. They can still see the `data-anubis-*` attributes on results, as with uBlacklist.
- **Not tried on purpose:** `adoptedStyleSheets` for sharing one stylesheet across roots. It has been unreliable from Firefox content scripts (Xray wrappers), so each root gets a `<style>` element; the CSS is small.
- **Bug found:** re-rendering looked up the previous content with `root.querySelector(':scope > …')`. Inside a shadow root `:scope` matches nothing, so old content was never removed and summaries and the weigh menu piled up after changes. Each host now remembers the node it rendered.
- **Bug found:** the weigh menu focused the first weight (Hide) instead of the chosen one, because a comma selector returns the first match in document order.
- **Bug found:** after a change the menu re-positioned to its result, which reranking had just moved, so it jumped off-screen. It now stays where it opened.
- `web-ext lint` flagged `innerHTML` for the constant SVG icons. Icons are now parsed with `DOMParser` and cached; the Firefox build lints clean.

## Storage

- The personal list is text in the list format (so it can be published as-is), stored in `storage.sync` split into chunks of at most 7 KB, since sync allows 8 KB per item and about 100 KB in total. If it outgrows sync it falls back to local storage and settings say so.
- **Bug found:** the first chunking split on newlines and re-joined with `\n`, which would have corrupted a single line longer than a chunk. Chunks are now cut by encoded size and joined with nothing; a test round-trips 3,000 lines with non-ASCII text.
- Default subscriptions are not written to storage on install. On a second device, sync data can arrive after `onInstalled`, and writing defaults would overwrite the user's synced subscriptions. Instead, "no stored subscriptions" means "the defaults".
- The old `sync:blockedSites` array is migrated into the personal list on install and on first read.

## Subscriptions and permissions

- Verified end to end: pressing Subscribe on "Stack Overflow copies" in the settings downloaded the real file from `raw.githubusercontent.com` inside the extension, with no host permission. (In the development sandbox Chromium had to be told to trust the network proxy's CA; `e2e/run.mjs` does that by public key when `PROXY_CA_CERT` is set, rather than turning certificate checks off.)

- `raw.githubusercontent.com` and `gist.githubusercontent.com` send `Access-Control-Allow-Origin: *`, so lists there download with no host permission at all. Other hosts ask for permission to that one host when you subscribe (`optional_host_permissions` on Chrome, `optional_permissions` on Firefox MV2, which WXT doesn't convert automatically).
- Updates run when the browser starts and when a search page loads, at most every 30 minutes, instead of using the `alarms` permission.
- Real lists parsed while testing: Brave's Hacker News Goggle (6,238 rules in 14 ms), Tech blogs, Rust, Copycats and No Pinterest Goggles; laylavish's AI blocklist in uBlacklist format (1,673 rules; one line skipped for a TLD wildcard, which isn't a valid match pattern); arosh's Stack Overflow and GitHub copy lists. A README fetched by mistake parses to zero rules and is rejected.

### Subscribe links (2026-09-29)

Subscribe on the lists directory, and links list authors share, lead to the guide's `subscribe?url=…&name=…` page, the same shape as uBlacklist's. Anubis opens Settings → Lists with a "Subscribe to …?" panel there; nothing is added until you press Subscribe, since anyone can make a link. A list from the directory shows the directory's name and description, whatever name the link gives.

- **How the link reaches the extension.** uBlacklist redirects its subscribe page to its options page with a `declarativeNetRequest` rule. That needs host access to its site, which it asks for with a separate "enable subscription links" button (so the first link someone follows does nothing), and the options page listed in `web_accessible_resources`, which lets any page frame it. Anubis uses a content script that matches only the subscribe page: no new permission, no web-accessible page, and it works from the first click. The cost is one more site in the install prompt (`bishop-v.github.io`), explained in the privacy page and the store notes.
- **Where settings open.** Turning the subscribe page's own tab into settings (`tabs.update`) would leave the subscribe page in its history, so Back would open settings again, and Chrome has no way to replace the entry (Firefox's `loadReplace`). Settings open in a new tab beside it instead, and the subscribe page goes back to where the link was, or closes if it was opened in a tab of its own. Back or Forward onto it does nothing (its navigation type is `back_forward`); the page itself explains and links to itself.
- **VitePress's router.** It follows same-site links without loading a page, and a content script only runs on a page load, so a plain link on the directory would never reach Anubis. Its router leaves links with a `target` alone (seen in its source), so the directory's carry `target="_self"`; the check against the built site below confirms it.
- Checked in Chromium: `node e2e/run.mjs subscribe-link` (mock directory, subscribe page and list; the directory tab goes back, a new tab closes, Forward doesn't reopen settings, a second link says you already subscribe), and the built docs site served at its real address, with and without the extension. Not yet run in Firefox, nor on the live site, which isn't published until GitHub Pages is on.

## Design

- **First pass (rejected by the project owner as loud and "a bit like Discord"):** filled pill badges with coloured dots, gradient gold buttons and segmented controls, ALL-CAPS section labels, rounded cards everywhere, a bordered summary with stat counters.
- **Second pass**, following Anthropic's `frontend-design` skill (now in `.claude/skills/`): on search pages Anubis uses the page's own font and muted text; tags are a small diamond and a name; the summary is one sentence; hidden results are one line. The one flourish is the weigh menu: the site's name in a cartouche (the oval that encloses names in hieroglyphs) over a small balance that tilts with the chosen weight. Settings use rows and hairlines; the light theme is a cool stone grey instead of cream; tag colours are muted Egyptian pigments.

## Filtering by tag

- **Shipped:** the summary lists the tags on the page's visible results with their counts, a legend you can click to show only one tag ("Showing only “Discussion”: 2 of 9 results"). It's the lightest version of Kagi's lenses: nothing is fetched, and a new search clears it. Filtered-out results get `data-anubis-filtered` and `display: none`, so they keep their place for when the filter is lifted.

## Importing from other tools

- **Shipped:** Settings → Share and back up → Import sites takes uBlacklist rules, a HOHSER JSON export, a Goggle or a plain domain list and merges whole-site entries into your list. HOHSER's `FULL_HIDE` becomes Hide, `PARTIAL_HIDE` becomes Lower, and its three highlight colours become `highlight-1..3` tags set to highlight. Rules that need URL patterns or regular expressions can't be expressed as whole-site entries, so they're counted and left out, with a pointer to subscribe to the original list instead.
- **Bug found:** the confirmation vanished. Saving triggers a debounced re-render of the section, which ran after the message had already been shown once. Messages now stay for a few seconds across re-renders (`entrypoints/options/flash.ts`); the Lists section had the same problem.

## Tooling

- `nix` wasn't available in the development sandbox; Node 22 (the flake's version) was used directly.
- Vitest 4 hit an npm arborist crash during install (`Cannot read properties of null (reading 'edgesOut')`); Vitest 5 installed cleanly.
- List downloads fail inside the e2e browser in the development sandbox, and Playwright's request routing doesn't reach fetches made by the extension's service worker, so serving the lists locally didn't help either. The `docs` screenshot part stores the bundled lists as the downloaded copies first, so the Lists screenshot shows what a user sees rather than "Failed to fetch".
- `chrome.tabs.query({ url })` returns nothing without host permissions, even for pages the content script runs on. The e2e harness messages every tab instead; the extension itself never needed it.
