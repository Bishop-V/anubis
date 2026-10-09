# Roadmap

Work that's planned but not started, or started and not finished. Each item says why it matters and where to begin. What was tried and learned goes in [`docs/experiments.md`](docs/experiments.md); store listings and publishing are in [`store/README.md`](store/README.md).

## Store rollout

- **Verify store declarations.** The Firefox manifest now sets `gecko.strict_min_version` to 142 so WebDAV can use built-in data consent and the AMO linter accepts the minimum. Before submission, verify the declaration in the generated manifest and check Chrome Web Store API V2 credentials. In the Chrome dashboard, distinguish Anubis's local processing from collection by the developer; the FAQ's protocol-client example supports treating the user-configured WebDAV transfer as user-directed, not as developer collection.
- **Firefox and Chrome are published.** [Install Anubis from Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) or [the Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). The Edge listing is not set up yet.
- **Add Chrome and Edge store credentials** to the GitHub `release` environment (which already holds the Firefox keys) only after their listings exist. GitHub Release packages are built and published even when no store credentials are configured; a partially configured store still fails. See [`store/README.md`](store/README.md).
- **Check live pages.** Everything on search pages was built against mocks. Work through "Still unverified" in `docs/experiments/live-pages.md`. Done on 2026-09-29 for DuckDuckGo (all three versions), Bing, Brave, Startpage, Ecosia, and Yahoo. Kagi was checked in a person's browser in 2026-10. Left: Yandex and Mojeek (they showed automated Chromium a human check), Load more results on Bing, Ecosia, and Yahoo in an everyday browser, Google's phone layout, and DuckDuckGo's AI answer and Duck.ai buttons, which are now removed on the page (their selectors come from EasyList's AI list). From the reports of 2026-09-29 ("Reported from live pages" in `docs/experiments.md`): that Brave's Videos, Discussions, and Related queries panels and Bing's "People also search for" box are removed, and that Google's `/goto` results shown by name ("Reddit · …", "LinkedIn · …") get their ⚖ button.
- **Check the fixes from the live check of 2026-09-29 on live pages** (details in `docs/experiments/live-pages.md`). All four are fixed against mocks: Load more results now says when the engine sent no results or asked for a robot check, Bing's AI answer and video panel are removed, and Brave's AI answer is found by `#llm-snippet`. Confirm each in an everyday browser.
- **Try syncing between browsers** with real WebDAV services in Firefox and Chrome: connect both, change a site in each, and check Firefox 142+'s consent prompt on Connect. Koofr, with encryption, worked as the guide describes on 2026-10-07. Left: InfiniCLOUD and Nextcloud. Record anything either needs in `docs/guide/sync.md`.
- **Try sync between two computers**, in Firefox and in Chrome: change a site's ranking on one and wait for it on the other. Also check that a change from a Firefox search page's result menu is saved compressed (`encoding: 'deflate'` in `sync:personal`, visible in `about:debugging` → Inspect → Storage): `CompressionStream` in Firefox content scripts is unverified (`docs/experiments.md`, Storage).
- **Take real screenshots** for any new store listings, following the shot list in `store/README.md`.
- **Recheck GitHub Pages before submission.** The docs site and privacy-policy URL loaded on 2026-09-29; confirm Pages still publishes from GitHub Actions before a store submission. Then try a subscribe link in Firefox, where it hasn't been run yet.

## Releases

- **Build provenance (optional):** an attestation on each release (`actions/attest-build-provenance`). The build is deterministic (two builds give identical files), so anyone can rebuild a tag and compare.

## Security

- **Turn on private vulnerability reporting** (Settings → Code security → Private vulnerability reporting). [`SECURITY.md`](SECURITY.md) sends reports there, and its form doesn't exist until it's on.

## Testing

- **Expand asserted e2e coverage.** The `checks` part now fails on regressions in hostile/grouped Google results, reveal state, forum links, and Google's phone layout; CI runs it on every pull request. Most other parts still only report findings. Add assertions for the remaining user-facing behavior, then consider uploading `e2e/shots/` when CI fails. Don't assert `hostile`'s `containersAreResults` yet: its off-screen "Sponsored offer" heading currently counts as a result, and that needs a deliberate fixture/finder decision first.
- **Checks to add to CI,** each small and each worth a trial first: `typos` with `locale = "en-gb"` for British spelling (exclude CSS and API names such as `color`), axe-core through Playwright on the settings, popup, and welcome pages, `zizmor` on the workflows (release and store submission hold secrets), OpenSSF Scorecard, and `lychee` for links outside the docs site, which `docs:build` doesn't check.

## Performance

Fine as it is (content script 92 KB). One to measure:

- With any clean-up switch on, `findClutter` (`entrypoints/content/cleanup.ts`) walks every text node on the page, on every pass. Measure it on a live Google page before changing anything; if it matters, skip the results' subtrees, which clean-up never removes.

## Firefox for Android

Started: Anubis picks an engine's phone layout by user agent (`mobile` in `utils/engines.ts`), Google's phone layout has a mock (`googleMobile` in `e2e/fixtures.mjs`) and an e2e part (`mobile`), the ⚖ button is bigger on touch screens, and the keyboard shortcut code skips browsers without `commands`. Next:

1. Run it on a phone: turn on USB debugging on the phone and "Remote debugging via USB" in Firefox's settings, then `npm run build` and `npx web-ext run -s .output/firefox-mv2 -t firefox-android --adb-device <id> --firefox-apk org.mozilla.firefox` (`adb devices` lists the id; Firefox Nightly is `org.mozilla.fenix`).
2. Check Google's phone markup against the mock: ARIA headings for titles, whether the link wraps the heading, `.ob9lvb` for the address, top stories cards, and how more results load (Load more results is off on Google phones until then).
3. Check the other engines' phone layouts. uBlacklist's rules show Bing's phone results keep `.b_algo`; DuckDuckGo looks the same. Add `mobile` overrides where they differ.
4. Check the popup and settings, which open as full pages on Android, and the welcome page, whose toolbar steps don't apply there: Android keeps extensions in the browser's menu.
5. Add `gecko_android: { strict_min_version: '120.0' }` to `browser_specific_settings` in `wxt.config.ts` (`permissions.request` needs 120). AMO offers the add-on on Android from the first version whose manifest has this key, so add it only once the steps above pass.

## Translation

Ready for translators: every word of the interface is in `public/_locales/en/messages.json`, each with a description saying where it shows, and `tests/i18n-coverage.test.ts` fails on new text written straight into the code. How to add a language is in the wiki's [Help translate](docs/guide/translate.md). What was done and checked is in `docs/experiments/design.md`, "Translation". Next:

- **Shipped (machine translated):** Arabic, Bengali, Chinese (Simplified), French, German, Hindi, Indonesian, Italian, Japanese, Korean, Brazilian Portuguese, Russian, Spanish, and Urdu, with notes in the interface and docs that they aren't fully supported. Next: a speaker reads each through (Help translate's table says which), then the notes for that language can go.
- **Open a hosted project:** Weblate (Hosted Weblate is free for open-source projects) or Crowdin, pointed at `public/_locales/en/messages.json` and `locales/<lang>/messages.json` with the `WebExtension JSON` format. Weblate marks a translation as needing review when its English changes, which `locales/<lang>/sources.json` does now; whichever keeps the record, the build must still leave stale messages out. Then change Help translate's "Until a hosted translation project opens" to a link to it.
- **Later:** translated store listings (`store/README.md`), and the wiki.

## Features

- **Proper support for the Videos, Images, and News tabs.** Anubis weighs DuckDuckGo's tab cards, but the other engines' Videos and Images tabs are mostly untested grids where tags, the ⚖ button, and reranking may not fit. For each engine, model its tabs in `e2e/fixtures.mjs` (DuckDuckGo's `tab` option shows how), add a `cards` entry in `utils/engines.ts`, and check that the button sits on each card and that hidden cards leave no gaps in the grid. uBlacklist's SERPINFO has the selectors.
- **Engine definitions fetched from the repo,** like uBlacklist's SERPINFO, so a selector fix doesn't need a store release. Chrome forbids downloading code, so they have to be data: `isResultsPage` is a function today and would need a declarative form.
- **An archived copy for paywalled results:** a link to `https://web.archive.org/web/<address>` beside the Paywalls label. It fetches nothing until clicked and needs no permission.
- **SearXNG and Yahoo Japan.** uBlacklist's SERPINFO has `searxng.yml` and `yahoo-japan.yml`. SearXNG runs on many hosts, so let people add their instance: ask for that one host through the existing optional `https://*/*` permission, then register the content script for it (`scripting.registerContentScripts` in MV3, `contentScripts.register` in MV2). Nothing changes at install.

## Lists made from other projects

Started: a weekly job (`.github/workflows/sources.yml`) turns other projects' data into lists in `lists/sources/`, credited and under their licences. **AI content** (the HUGE AI Blocklist), **Independent wikis** (Indie Wiki Buddy), **Official docs (DevDocs)**, and **Self-hosted FOSS** (awesome-selfhosted) are on by default. Installs from before the first two subscribed to them once when they updated; that happens only once, so an install that had chosen its own lists before the last two doesn't get them. What was weighed is in `docs/experiments/storage-and-lists.md`, "Lists made from other projects". Next:

- **Where a tag shows.** Give each tag a choice of "On the result" (the chip, as now), "In the menu only" (under **Why** in the ⚖ menu, still counting for filtering and ranking), or "Off", building on `muted` in `TagPref` (`utils/matcher.ts`). Let a list suggest the starting choice for its tags, so broad categories start in the menu only. Needed before UT1, or every result gets a chip.
- **Wikidata's official websites** (CC0): a SPARQL query in the weekly job joining "official website" (P856) with how many Wikipedia articles each item has, keeping the best-known entities, tens of thousands rather than all of them. Leave out addresses on shared hosts (`facebook.com/…`, `x.com/…`) or match them by path, and drop dead domains. `query.wikidata.org` can't be reached from cloud sessions, so try the query in the workflow. Where it covers sites one of Anubis's own lists tags by hand, its data replaces those entries. The same job could tag who owns a site ("owned by", P127, and "parent organisation", P749): a group's name such as People Inc. or Future is a fact, not a rating, so it avoids the objection to credibility lists.
- **Read lists once, not on every page.** Search pages read every list on each load (`compiled` in `utils/ruleset.ts` only lasts for one page). Plain `$site=` lines are now only parsed for the sites on the page, so a 41,000-rule list takes about 65 ms instead of 180 ms (`docs/experiments/storage-and-lists.md`, "Reading long lists on search pages"). Before adding a list much over 40,000 rules, measure a search page in a browser, then compile in the background script or keep a compiled form.
- **UT1's categories** (CC BY-SA 4.0, mirrored in `olbat/ut1-blacklists` on GitHub): small ones first (press 4,600 sites, blog 1,500, forums 205, which joins the `forum` tag), starting in the menu only. Shopping, games, and gambling (35,000 to 40,000 each) wait for the two items above.
- **The HUGE AI Blocklist's Pinterest rules** are regular expressions over Pinterest's many domains; the 92 of them are left out.
- **Decided against:** credibility ratings (the Iffy Index, Wikipedia's perennial sources) on by default, since they're contested; at most an opt-in list. The Block List Project, which is built for blocking domains at the network level.

## Not planned

- Telemetry or an uninstall survey: Anubis does not send user data to a developer-operated server; the privacy policy explains local processing and optional sync to a server the user chooses.
- A server, or a UI framework.
- Safari: it needs Xcode and a paid Apple developer account.
