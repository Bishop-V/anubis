# Experiments and decisions

What was tried while building the tagging and lists release, what failed, and what is still unverified. Newest notes go at the top of each section.

## Still unverified against live pages

The development sandbox could not reach any search engine, so everything on search pages was tested against mock pages (see [`e2e/`](https://github.com/Bishop-V/anubis/tree/main/e2e)) shaped like each engine's markup as described by uBlacklist's maintained [SERPINFO definitions](https://github.com/ublacklist/builtin/tree/main/serpinfo), checked on 2026-09-28. Before a release, load the extension and check each engine by hand:

| Engine | How results are found | Confidence |
| --- | --- | --- |
| Google | Structural (h3), `<cite>` fallback for `/goto` links | Structural approach verified live on `main` before this work; `#pnnext` for Load more results is long-standing |
| DuckDuckGo | Structural (h2) | Verified live on `main`; the `#more-results` button selector for Load more results is a guess |
| DuckDuckGo HTML / Lite | Selectors from uBlacklist | Unverified |
| Bing | Selectors from uBlacklist, `/ck/a` redirects decoded | Unverified; `a.sb_pagN` for Load more results is a guess |
| Brave, Startpage, Ecosia, Kagi, Yandex | Selectors from uBlacklist | Unverified; Brave's `offset` and Ecosia's `p` parameters are guesses |
| Yahoo, Mojeek | Structural, not covered by uBlacklist | Guesses, including Yahoo's `/RU=` redirect decoding |

DuckDuckGo's own "hide this site" was simulated in the mocks (the result collapses into a notice); Anubis removes its UI from the collapsed result. The real feature's markup is unknown.

Clean-up is also unverified live. To check:

- Google: that "AI Overview", "Videos", "People also ask", "Top stories" and "Related searches" are still headings (`h1`–`h4` or `role="heading"`) at the top of their blocks, and that the blocks sit in `#rso`, `#botstuff` or the `role="main"` column. That the AI Mode tab is a link with that exact text in a `role="navigation"` or `role="list"` element. That choosing All from the Web tab lands on a `/search` URL without `udm`, so Anubis leaves it alone.
- DuckDuckGo: that `noai.duckduckgo.com` keeps your DuckDuckGo settings (theme, region). They are cookies, and a cookie set only for `duckduckgo.com` wouldn't reach the subdomain.
- Bing and Brave: what their AI answers' headings actually say. The selectors `[data-attrid="AIOverview"]` (Google), `.related-question-pair` (Google) and `#summarizer` (Brave) come from community filter lists.

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
- **Visible and undoable:** the summary names what was removed ("…and removed an AI answer and a video panel"), and "Show hidden" brings removed blocks back on that page, marked with a dashed outline. The AI Mode tab is removed but not counted, since it isn't content.

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
