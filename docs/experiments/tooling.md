# Tooling and releases

Builds, tests, the end-to-end run, stores, and releases. Part of [Experiments and decisions](../experiments.md). Newest notes go at the top of each section.

## The ⚖ button check depends on fonts (2026-10-08)

- **Found:** in a cloud session, `node e2e/run.mjs checks` fails "the ⚖ button on the first row, never over text" on the DuckDuckGo mock, on `main` as well: a long title ("How do I return the response from an asy…") wraps under the button. CI, on Ubuntu with Playwright's fonts, passes. The cloud container's fallback font is wider.
- **Not changed:** the check is right for the fonts CI has. Leaving DuckDuckGo out of that one check locally showed every other check passing.

## Shared ranking code and trimming duplication (2026-10-05)

- **Kept:** the result menu and the popup share their ranking, hint, cartouche, and tag order through `utils/siteranking.ts`, with unit tests; `displayLevel` in `utils/personal.ts` replaces four copies of "an allow shows as Normal".
- **Checked and left:** `tsc --noUnusedLocals --noUnusedParameters` and a search for unused exports found nothing else dead. The few repeated lines left on search pages (the tree walkers in `ui.ts`, the climbs in `results.ts`) differ in what they stop at, and sharing them would make that harder to read.
- **Tripped over:** WXT auto-imports every export of `utils/`. An export named `siteTags` matched a parameter in `utils/importers.ts`, so its unit test loaded `utils/icons.ts`, which translates as it loads, and failed. Renamed to `tagOrder`; a pitfall in `DEVELOPMENT.md` says so.

## 0.2.2 release: first Chrome submission (2026-10-05)

- **Listed:** the Chrome Web Store accepted Anubis (item `aninblefigadaigfppckanjgiijcmmhi`). The install guides, README, and store notes now link to it.
- **Submitted:** `v0.2.2` sent Firefox to AMO for review; validation reported zero errors, warnings, or notices.
- **Found:** Chrome failed with `SERVICE_DISABLED`, because the Chrome Web Store API wasn't turned on in the service account's Google Cloud project. Once it was on, Chrome failed again with `PERMISSION_DENIED` on `publishers/<id>/items/<id>`: the service account needs to be added under Account in the developer dashboard of the publisher that owns the item, and `CHROME_PUBLISHER_ID` must be that publisher's ID.
- **Found:** the JSON key stores `private_key` with `\n` escapes. The submit tool passes the secret to Node's signer unchanged, so set the secret from `jq -r .private_key`, which gives real line breaks.
- **Note:** re-running the submit job after Firefox succeeded fails Firefox with a duplicate version. The Chrome part still runs, because the tool submits to each store separately.

## 0.2.1 release: artifact upload path (2026-10-03)

- **Found:** the release checks and zip builds passed, but `upload-artifact` failed with "No files were found" for `.output/*.zip`. The zip files existed; the action excludes hidden directories by default, and `.output` is hidden.
- **Changed:** stage the six versioned and stable release archives in the visible `release-assets/` directory and upload from there. Explicit filenames prevent stale archives from being included. The submit job still downloads them to `.output/` for `wxt submit`.
- **Checked:** after the workflow fix merged, the retagged `v0.2.1` run passed version validation, CI, zip creation, and artifact upload; the GitHub Release was published with all six versioned and stable packages.
- **Found:** AMO still returned `404 Not found` after both API credentials were refreshed. The release log confirmed both secrets were present. The submit library strips braces from `FIREFOX_EXTENSION_ID` before calling AMO; AMO's public API resolves the Anubis listing by slug (`anubis-search`), while the unbraced GUID lookup returns 404.
- **Changed:** configure the submit tool with the AMO listing slug. Keep the braced permanent GUID in `wxt.config.ts`, where it identifies the Firefox add-on for browser storage; it is a different identifier use.
- **Submitted:** the protected `v0.2.1-amo-submit` run uploaded the published Firefox package, AMO validation reported zero errors, warnings, or notices, and the version was submitted for review.
- **Pending:** AMO's public listing still serves 0.2.0 while the 0.2.1 submission is reviewed. The GitHub Release and all six download packages are available.

## Firefox approval and automated release downloads (2026-10-03)

- **Confirmed:** Anubis is live on [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/). Updated the install guidance and status pages; Chrome and Edge listings are still pending.
- **Changed:** the tag workflow now attaches stable `anubis-firefox.zip`, `anubis-chrome.zip`, and `anubis-sources.zip` aliases alongside the versioned packages. This makes `releases/latest/download/anubis-firefox.zip` a persistent link for the latest Firefox build.
- **Configured:** the `release` environment requires approval by Bishop-V, disallows administrator bypass, and is restricted to `v*` tags. The Firefox AMO API secrets were not set at this check.
- **Changed:** if no store credentials are configured, the release workflow now leaves the successful GitHub package release intact and skips store submissions with a notice. A partially configured store remains an error.
- **Checked:** `.github/workflows/release.yml` builds packages and attaches them to GitHub Releases for matching tags, then submits to stores whose credentials are configured. The repository had no published release at this check.
- **Next:** add Firefox AMO API secrets to the protected environment. The source archive and Firefox package are not published to GitHub until a matching release tag is pushed from `main`; no duplicate AMO version was tagged or submitted here.

## Finding Chromium for the end-to-end run (2026-09-29)

- **Nix fetches it (2026-09-30):** the owner asked not to need `nix shell nixpkgs#chromium -c npm run release:prep` each time. Adding Chromium to the dev shell was still left out, for the reason below; instead, when there's no Chromium and `nix` is on PATH, `e2e/run.mjs` runs `nix build --inputs-from . nixpkgs#chromium --no-link --print-out-paths` and uses its `bin/chromium`. It's the nixpkgs the flake pins, stays in the Nix store after the first time, and works in or out of `nix develop`. Checked with a stand-in `nix` that returns a store path (the `responsive` part passed) and with no Nix (the message now says Nix will do).

- **Found:** `npm run release:prep` on NixOS stopped at the end-to-end step with "Chromium is missing". Playwright's downloaded Chromium doesn't run there, and the harness only looked at `CHROMIUM_PATH` and Playwright's own path.
- **Changed:** `e2e/run.mjs` now tries `CHROMIUM_PATH`, then Playwright's build, then `chromium` or `chromium-browser` on PATH. Playwright's build still comes before PATH so CI keeps using it. The error names all three ways, including `nix shell nixpkgs#chromium`.
- **Kept out:** adding Chromium to the Nix dev shell. `flake.nix` deliberately takes browsers from the system, and it would make every `nix develop` fetch Chromium.
- **Checked:** with no Chromium anywhere the part stops with the new message; with only a `chromium` on PATH the `responsive` part passes.

## Firefox first, and one command before a release (2026-09-29)

- **Found:** the release workflow passed the Chrome, Firefox, and Edge zips to one `wxt submit`, so a release needed every store's keys, even with only the Firefox listing ready.
- **Changed:** the submit step now passes only the stores whose keys are all set in the `release` environment and notes the ones it skips. A store with only some of its keys fails the release, since that is a setup mistake rather than a store that isn't ready. The branches were run locally with each combination of keys and a stand-in `npx`; the real submission is still untried.
- **Added:** `npm run release:prep -- <version>` sets the version, then runs the type-check, unit tests, Firefox zips, `web-ext lint`, and the full end-to-end run, stopping at the first failure. It passed in full on 0.2.0.

## Store privacy disclosure (2026-09-29)

- **Checked:** Google's [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) says local processing is handling user data and needs disclosure. Its FTP/IRC example says data exchanged with a server chosen by the user is not collected for the developer, and Limited Use does not apply to that transfer. Anubis's optional WebDAV connection follows that model: the user supplies the server, Anubis has no sync endpoint, and the sync file goes only to that server. The exception is about this transfer; it does not erase the separate local processing of search results and the current tab's address.
- **Changed:** added the Limited Use statement to the privacy page, linked Privacy directly from site navigation, and replaced the store listing's absolute "nothing collected" wording with local processing and optional user-directed sync.
- **Correction:** the earlier note treated whether WebDAV qualified for the user-specified-server exception as an unresolved submission blocker. The FAQ's own protocol-client example supports describing this user-directed transfer as not developer collection; the dashboard should still be completed truthfully for Anubis's local processing, without representing the user's server as developer-operated collection. This is a policy reading, not a guarantee of review outcome.
- **Compared:** Floccus's [public privacy policy](https://floccus.org/privacy/) separates local data, the user-selected backend, and data received by its developers. That comparison also prompted explicit disclosure of who can read the sync file; see the end-to-end encryption experiment below for the implemented protection and its limits.
- **Screenshot:** system Chrome 154 did not start the extension service worker under the runner. Switching to Nix-provided Chromium worked; regenerated the documentation screenshots and slides with `node e2e/run.mjs docs`.
- **Still outstanding:** the release GitHub environment is not configured, store listings and real-page screenshots do not exist, and Firefox's consent prompt with a real WebDAV server remains untested.

## Final runtime and listing review (2026-09-29)

- **Found:** the toolbar badge counted hidden results but not clean-up removals, and its last count could remain after a tab left search. "Update now" also proceeded when a list's host permission was denied. Storage changes could trigger rejected list reloads without a handler in the content script and popup.
- **Fixed:** derive the badge from the shared hidden-count helper, clear it when navigation starts, stop list updates with a localized permission message when access is denied, and log reload errors while keeping the last working rules and popup state.
- **Checked:** the asserted Chromium checks now cover a badge that includes removed panels and clearing it on navigation; compile, unit tests, docs build, and those browser checks pass.
- **Listing copy:** clarified that Bing's AI answer and video panel are not recognized yet, and aligned the WebDAV inventory with the privacy guide.

## Full end-to-end run stability (2026-09-29)

- **Found:** the full Chromium run could reach the second extension context before its service worker exposed `chrome.storage`; the seed then failed with `ReferenceError: chrome is not defined`. Running the WebDAV part alone passed, which initially hid the startup race.
- **Fixed:** the shared harness waits up to five seconds for the extension storage API before seeding a context, then fails with a specific readiness error if it never appears.
- **Confirmed:** reran `npm run e2e` with the Nix-provided Chromium; all fixture parts completed, including Subscribe, storage sync, and WebDAV.

## Declared Node.js minimum (2026-09-29)

- **Found:** `package.json` and setup docs allowed Node 20, but the locked WXT release requires Node 22 and Vitest requires Node 22.12 or later. The lockfile and store rebuild instructions already used Node 22, leaving the advertised minimum inconsistent with the actual toolchain.
- **Fixed:** raised the package engine and all setup/rebuild instructions to Node 22.12 or later, then synchronized the lockfile. CI and the Nix shell already use Node 22.
- **Checked:** the installed tool metadata confirms the WXT and Vitest engine requirements; the repository's compile, test, and build commands run on the pinned Node 22 toolchain.

## Asserted end-to-end checks (2026-09-29)

- **Flaky `hostile google` failure (2026-10-07):** CI once counted 8 results but 6 visible weigh buttons, and passed on a re-run. Not a slow content script: results are marked and given their button in one synchronous pass, so an early look finds 0 results, never some without buttons. The two missing buttons were the hidden results, laid out with "Remove". On install, the extension's one-time move of a stored "Collapse" to "Remove" can read the settings just after the harness writes "Collapse", and then switch them. It happened in 1 of 30 fresh launches. A longer or polling wait would not have helped, since those buttons never appear with "Remove". The harness now waits for the move to finish before writing settings (0 of 40 flipped), and `hostile google` asserts "Collapse" is in effect, so a recurrence names its cause.
- **Starting point:** the Chromium harness printed most findings but did not fail when behavior was wrong; only missing buttons stopped a run. CI checked Settings responsiveness, not what the extension did on search pages.
- **Shipped:** `node e2e/run.mjs checks` asserts that hostile Google markup keeps visible weigh buttons and upright chips, grouped results retain sitelinks and the summary, opaque forum results are recognized and tagged, revealing a hidden result survives another page pass without a redundant chip, pins keep their accessible gold selector while Raise/Lower chips remain, DuckDuckGo's light/dark selector colors match its menu with gold hover, Google's phone layout has no horizontal overflow, and clean-up removes only the expected panels. It runs against local fixtures without search-engine network access; CI runs it alongside the responsive Settings test on pull requests.
- **Not asserted yet:** the hostile fixture's `containersAreResults` is false because its off-screen "Sponsored offer" heading is detected as a result. The check was deliberately not promoted to an assertion until the desired treatment is decided; other parts still report findings without failing.

## Store listings

- **Chrome's publishing API:** v1.1 and its refresh tokens stop working on 15 October 2026. `wxt submit` (publish-browser-extension 6.1.1 in WXT 0.21) can use v2 with a service account but still defaults to v1.1, so `CHROME_API_VERSION=v2` has to be set. Found by reading the installed package, not its documentation.
- **Privacy page:** it said Anubis connects to list hosts "only when you use the feature", but the four built-in lists download from GitHub on install, and opening Settings → Lists fetches the directory. Both are now listed, since the page doubles as the stores' privacy policy.
- **Store icon:** Chrome wants the logo at 96×96 inside 128×128 of transparent padding; the toolbar icon fills the square, so `store/icon-128.png` is rendered separately (`store/render.mjs`), as is the 440×280 promo tile.
- **Screenshots:** not made from the e2e mocks. They look like the engines but aren't them, and a listing has to show the real thing.

## Tooling

- `nix` wasn't available in the development sandbox; Node 22 (the flake's version) was used directly.
- Vitest 4 hit an npm arborist crash during install (`Cannot read properties of null (reading 'edgesOut')`); Vitest 5 installed cleanly.
- List downloads fail inside the e2e browser in the development sandbox, and Playwright's request routing doesn't reach fetches made by the extension's service worker, so serving the lists locally didn't help either. The `docs` screenshot part stores the bundled lists as the downloaded copies first, so the Lists screenshot shows what a user sees rather than "Failed to fetch".
- `chrome.tabs.query({ url })` returns nothing without host permissions, even for pages the content script runs on. The e2e harness messages every tab instead; the extension itself never needed it.
- **Hardening CI (2026-09-29):** `npm ci --ignore-scripts` then `npx wxt prepare` (the only install script the project needs) in CI, the docs build and releases; compile, tests, both builds and the docs build all pass that way. `ci.yml` gets `contents: read`, actions are pinned to commit SHAs with the version in a comment, and `.github/dependabot.yml` moves them and npm packages weekly, grouped, after a 7-day cooldown. List downloads now stop at 5 MB: by `Content-Length` before reading, else while the body streams in (`readLimited` in `utils/subscriptions.ts`), where they used to read the whole body first.
- **Less re-parsing (2026-09-29):** any change, even one click in the result menu, reloaded the rule set in every open search tab and parsed every subscribed list again. `loadRuleSet` now keeps each subscription's compiled list and compiles it again only when its text, name or address changes (`tests/ruleset.test.ts`). `refreshStale` parsed each list just to read `! expires:`; the cache now stores it as `expiresHours` when a list is downloaded, and copies from before that are parsed for it as before.
- **"User guide" is now "Wiki" (2026-09-29):** the documentation site's nav, the Wiki link in Settings and on the welcome page, the popup's Help tooltip ("Open the wiki"), the README and the developer docs. Page addresses stay under `/guide/`, since earlier builds link to them.
- **Settings at 320px (2026-09-29):** the Your sites table originally widened the page, so it now scrolls only inside its own wrapper below 390px. A `display: block` table experiment was rejected because it collapsed the columns and broke site names into narrow vertical fragments. The labelled ranking choices use a small grid on the narrowest screens, with Add on a separate line. `node e2e/run.mjs responsive` guards every settings section at 320px, 360px, and 390px, and CI runs it on every pull request. A 320px visual check with a long domain confirmed the document stays viewport-wide and the columns remain usable.
- **A separate weighing illustration (2026-09-29):** drew [`weighing-study.svg`](https://github.com/Bishop-V/anubis/blob/main/store/concepts/weighing-study.svg) as a visual direction only. It reuses the existing dark and gold palette and the heart-and-feather motif; it does not replace or change the approved logo, store icon, or listing artwork.
- **Firefox source package (2026-09-29):** inspecting the generated reviewer archive showed it included a git-ignored local agent-notes file. WXT's source exclusions now omit it; verify the source zip contents after changing packaging rules.
