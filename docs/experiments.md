# Experiments and decisions

What was tried while building the tagging and lists release, what failed, and what is still unverified. Newest notes go at the top of each section.

## Still unverified against live pages

The development sandbox could not reach any search engine, so everything on search pages was tested against mock pages (see [`e2e/`](../e2e)) shaped like each engine's markup as described by uBlacklist's maintained [SERPINFO definitions](https://github.com/ublacklist/builtin/tree/main/serpinfo), checked on 2026-09-28. Before a release, load the extension and check each engine by hand:

| Engine | How results are found | Confidence |
| --- | --- | --- |
| Google | Structural (h3), `<cite>` fallback for `/goto` links | Structural approach verified live on `main` before this work; `#pnnext` for Weigh deeper is long-standing |
| DuckDuckGo | Structural (h2) | Verified live on `main`; the `#more-results` button selector for Weigh deeper is a guess |
| DuckDuckGo HTML / Lite | Selectors from uBlacklist | Unverified |
| Bing | Selectors from uBlacklist, `/ck/a` redirects decoded | Unverified; `a.sb_pagN` for Weigh deeper is a guess |
| Brave, Startpage, Ecosia, Kagi, Yandex | Selectors from uBlacklist | Unverified; Brave's `offset` and Ecosia's `p` parameters are guesses |
| Yahoo, Mojeek | Structural, not covered by uBlacklist | Guesses, including Yahoo's `/RU=` redirect decoding |

DuckDuckGo's own "hide this site" was simulated in the mocks (the result collapses into a notice); Anubis removes its UI from the collapsed result. The real feature's markup is unknown.

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

## Weigh deeper (more than one page of results)

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
- `chrome.tabs.query({ url })` returns nothing without host permissions, even for pages the content script runs on. The e2e harness messages every tab instead; the extension itself never needed it.
