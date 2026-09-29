# Roadmap

Work that's planned but not started, or started and not finished. Each item says why it matters and where to begin. What was tried and learned goes in [`docs/experiments.md`](docs/experiments.md); store listings and publishing are in [`store/README.md`](store/README.md).

## Before the first store release

- **Verify store declarations.** The Firefox manifest now sets `gecko.strict_min_version` to 142 so WebDAV can use built-in data consent and the AMO linter accepts the minimum. Before submission, verify the declaration in the generated manifest and check Chrome Web Store API V2 credentials.
- **Check live pages.** Everything on search pages was built against mocks. Work through "Still unverified" in `docs/experiments.md`. Done on 2026-09-29 for DuckDuckGo (all three versions), Bing, Brave, Startpage, Ecosia, and Yahoo. Left: Kagi, Yandex, and Mojeek (they showed automated Chromium a human check), Load more results on Bing, Ecosia, and Yahoo in an everyday browser, Google's phone layout, and DuckDuckGo's AI answer and Duck.ai buttons, which are now removed on the page (their selectors come from EasyList's AI list). From the reports of 2026-09-29 ("Reported from live pages" in `docs/experiments.md`): that Brave's Videos, Discussions, and Related queries panels and Bing's "People also search for" box are removed, and that Google's `/goto` results shown by name ("Reddit · …", "LinkedIn · …") get their ⚖ button.
- **Fix what the live check found** (details in `docs/experiments.md`, 2026-09-29). For each, model the live markup in `e2e/fixtures.mjs` and confirm the check fails before fixing:
  - *Load more results stops without saying why.* On Bing, Ecosia, and Yahoo the fetched page came back as a bot check, and Bing's (status 200) reads as a last page with no results. In `fetchNext` (`entrypoints/content/deeper.ts`), recognise a page with no results, or a challenge, and set an error the summary shows ("Bing asked to confirm you're not a robot. Open the next page instead.").
  - *Bing's AI answer stays.* It's `li.b_ans.b_top` with `.cht_container`, labelled only by `aria-label="AI Overview"`. Read `aria-label` as a label, or add `.cht_container` to Bing's `cleanupSelectors` (`utils/engines.ts`).
  - *Bing's video panel stays.* Its heading is "Videos of <search>": add `Videos of ` to the videos kind's `prefixes`.
  - *Brave's AI selector is out of date.* The block is `#llm-snippet`, not `#summarizer`. It's removed anyway through its disclaimer, so this is only a backup; update the selector.
- **Try syncing between browsers** with a real WebDAV service (Koofr, InfiniCLOUD, and Nextcloud at least) in Firefox and Chrome: connect both, change a site in each, and check Firefox 142+'s consent prompt on Connect. Record what each service needed in `docs/guide/sync.md`.
- **Try sync between two computers**, in Firefox and in Chrome: change a site's ranking on one and wait for it on the other. Also check that a change from a Firefox search page's result menu is saved compressed (`encoding: 'deflate'` in `sync:personal`, visible in `about:debugging` → Inspect → Storage): `CompressionStream` in Firefox content scripts is unverified (`docs/experiments.md`, Storage).
- **Take real screenshots** for the listings, following the shot list in `store/README.md`.
- **Recheck GitHub Pages before submission.** The docs site and privacy-policy URL loaded on 2026-09-29; confirm Pages still publishes from GitHub Actions before the first listing upload. Then try a subscribe link in Firefox, where it hasn't been run yet.

## Releases

- **Build provenance (optional):** an attestation on each release (`actions/attest-build-provenance`). The build is deterministic (two builds give identical files), so anyone can rebuild a tag and compare.

## Security

- **Turn on private vulnerability reporting** (Settings → Code security → Private vulnerability reporting). [`SECURITY.md`](SECURITY.md) sends reports there, and its form doesn't exist until it's on.

## Testing

- **Expand asserted e2e coverage.** The `checks` part now fails on regressions in hostile/grouped Google results, reveal state, forum links, and Google's phone layout; CI runs it on every pull request. Most other parts still only report findings. Add assertions for the remaining user-facing behavior, then consider uploading `e2e/shots/` when CI fails. Don't assert `hostile`'s `containersAreResults` yet: its off-screen "Sponsored offer" heading currently counts as a result, and that needs a deliberate fixture/finder decision first.

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

Started: interface text is moving into `public/_locales/<language>/messages.json` (the browsers' own format), used through `t()`, `tn()` for counts, and `localizePage()` for static HTML (`utils/i18n.ts`). Done: the manifest's description and shortcut names, the ranking names, the welcome page, the toolbar popup, and on search pages the summary (its sentence and buttons) and the result menu's report and suggestion lines. `tests/i18n.test.ts` checks keys and placeholders. Next:

- **The in-page UI** (`entrypoints/content/ui.ts`): the rest of the result menu, hidden lines' reasons, and chips.
- **Settings** (`entrypoints/options/`), list errors shown there (`utils/listformat.ts`).
- **Then invite translators:** a hosted Weblate or Crowdin project (both are free for open-source projects and read this format), a "Help translate" page in the wiki, and translated store listings.

## Features

- **Engine definitions fetched from the repo,** like uBlacklist's SERPINFO, so a selector fix doesn't need a store release. Chrome forbids downloading code, so they have to be data: `isResultsPage` is a function today and would need a declarative form.
- **Image, video, and news results.** uBlacklist's SERPINFO has the selectors.

## Not planned

- Telemetry or an uninstall survey: Anubis collects nothing, and says so.
- A server, or a UI framework.
- Safari: it needs Xcode and a paid Apple developer account.
