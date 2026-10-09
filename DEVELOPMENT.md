# Developing Anubis

How the extension is put together, and how to make the changes that come up most often. [Commands](#commands) gets you set up, [CONTRIBUTING.md](CONTRIBUTING.md) covers how changes are proposed and merged, and [`docs/experiments.md`](docs/experiments.md) records why things are the way they are, including what was tried and didn't work. Read the relevant part of that record before redoing something that looks odd: it's usually odd on purpose.

## The toolchain

| Tool | What it does here |
| --- | --- |
| [WXT](https://wxt.dev) 0.21 | Builds the extension from `entrypoints/` and `wxt.config.ts`, for Chrome (Manifest V3) and Firefox (Manifest V2) from the same code. Wraps Vite. |
| TypeScript | Everything but the end-to-end harness. `npm run compile` type-checks. |
| Vitest | Unit tests in `tests/`, with WXT's fake browser so storage code runs in Node. |
| Playwright (`playwright-core`) | Drives Chromium for the end-to-end checks in `e2e/`. |
| `web-ext lint` | Mozilla's add-on linter. CI fails on any warning. |
| VitePress | The wiki in `docs/`, published to GitHub Pages. |

Node 22 is what CI and releases use; `flake.nix` pins it for `nix develop`. `npm install` runs `wxt prepare`, which writes `.wxt/` (generated types and the `tsconfig.json` the repo's own extends). Type-checking fails until it has run.

Two import aliases come from WXT: `#imports` (`browser`, `storage`, `defineContentScript`, `defineBackground`…) and `@/` for the repository root.

### Commands

On Linux, enter `nix develop` first; it provides Node 22 and installs dependencies on first entry.

Outside Nix, use Node 22.12 or newer and run `npm install` once before these commands.

```sh
npm run dev            # Firefox with the extension loaded, reloading on save
npm run dev:chrome     # the same in Chrome
npm run compile        # type-check
npm test               # unit tests
npm run build          # .output/firefox-mv2/
npm run build:chrome   # .output/chrome-mv3/
npx web-ext lint -s .output/firefox-mv2
npm run e2e            # Chrome build, then every end-to-end check (needs Chromium)
node e2e/run.mjs responsive # Settings layout at 320px, 360px, 375px, 389px, and 390px
npm run docs:dev       # the wiki, with live reload
npm run docs:build     # the wiki; fails on a broken link
npm run zip            # store packages (see "Releasing")
npm run zip:chrome
npm run release:prep -- 0.3.0 # set the version, run every check above, make the Firefox zips
```

Firefox is the default target; every `:chrome` variant overrides it. If the dev browser doesn't open on its own, build and load the extension by hand, as [Getting started](docs/guide/getting-started.md#install) describes.

## How a build is made

WXT turns each file or folder in `entrypoints/` into a part of the extension and writes the manifest from `wxt.config.ts`:

| Entry point | Becomes | Runs |
| --- | --- | --- |
| `content/index.ts` | The main content script, `content.js`, with `page.css` injected beside it | On every search engine's pages (`ENGINE_MATCHES` from `utils/engines.ts`) |
| `subscribe.content.ts` | A second content script | Only on the wiki's subscribe page |
| `background.ts` | The background script: a service worker in Chrome, a background page in Firefox | Whenever the browser wakes it: install, startup, a message, a keyboard shortcut |
| `popup/` | The toolbar button's popup | When the toolbar button is pressed |
| `options/` | The settings page, opened in a tab | When opened |
| `welcome/` | `welcome.html`, opened once on install | When opened |

A **content script** runs inside a web page (here, a search results page), can read and change that page, and shares nothing with the page's own scripts but the DOM. The **background script** has no page; it handles browser events and keeps the toolbar button up to date. In Chrome's Manifest V3 it's a service worker the browser can stop at any moment, so it keeps nothing important in variables: what it needs to remember goes in storage (`local:lastUpdateCheck`, for example).

Things that differ between the two builds:

- The manifest: `optional_host_permissions` (MV3) or `optional_permissions` (MV2), and Firefox's add-on ID and data-collection declaration (`browser_specific_settings`). Both are in `wxt.config.ts`.
- The toolbar button's API: `browser.action` in MV3, `browser.browserAction` in MV2. Code uses whichever exists.
- `import.meta.env.FIREFOX` is `true` in the Firefox build, for the rare browser-specific branch (the welcome page's pinning steps).

`utils/engines.ts` is imported by `wxt.config.ts` at build time to write the content script's `matches`, so it must never touch a browser API. `utils/links.ts` is imported by the config and by the docs site, for the same reason.

Before changing existing behavior, check [`AGENTS.md`](AGENTS.md) for compatibility contracts and reproduce the old behavior with a regression test. Before changing browser APIs, permissions, manifest targets, or release steps, check [`docs/platform-watch.md`](docs/platform-watch.md) and verify the current vendor requirements.

Two builds of the same commit are identical file for file. Firefox's reviewers rebuild the extension from `anubis-<version>-sources.zip`, which leaves out `docs/`, `e2e/`, `store/` and `.claude/` (`zip.excludeSources` in `wxt.config.ts`).

## Layout

- `wxt.config.ts`: manifest settings (name, permissions, optional host permissions, Firefox ID).
- `entrypoints/content/`: runs on result pages of every engine in `utils/engines.ts`.
  - `index.ts`: the pass loop (find results, weigh, render, rerank), the mutation observer, and messages.
  - `results.ts`: finding results, structurally (title heading → link → smallest single-result ancestor) or by selector, and resolving redirect links to the real URL.
  - `ui.ts` + `shadow.css`: tags under titles, the ⚖ button on each result and its menu, hidden-result lines, and the summary, all in closed shadow roots.
  - `deeper.ts`: "Load more results", bringing later result pages onto the current one: fetched as the page would (`content.fetch` in Firefox), in a hidden sandboxed frame (`anubis-frame`) when the fetched copy has no results, and put right after the last result so the engine's pager stays below. Why a load stopped goes to the summary as `PageStats.stopped`.
  - `cleanup.ts`: finding the blocks that clean-up removes (AI answers, video panels…), and its redirect to Google's Web tab.
  - `page.css`: page-level treatments keyed off `data-anubis-*` attributes (hidden, lowered, pinned, highlight, rerank).
- `entrypoints/subscribe.content.ts`: runs only on the wiki's subscribe page (`…/anubis/subscribe?url=…&name=…`, where subscribe links lead) and asks the background to open Settings → Lists with that list filled in. Settings asks before subscribing, because anyone can make a link.
- `entrypoints/background.ts`: list updates (on startup and when a search page asks, at most every 30 minutes), syncing with a WebDAV server when one is connected (a few seconds after a change, on startup, and when a search page asks, at most every 5 minutes), the toolbar badge, the grey icon while Anubis is off (`public/icon-off/`), and opening the welcome page on first install.
- `entrypoints/popup/`: changes with the tab. It shows what Anubis did on a search page (and its tags to show only), the site you're on in the cartouche and balance (`utils/balance.ts`, and its ranking, hint, and tags from `utils/siteranking.ts`, both shared with the result menu), or adding a site by hand; then the last few of your sites.
- `entrypoints/welcome/`: the page that opens on first install: how to pin the toolbar button in this browser, searches to try, and the lists you start with.
- `entrypoints/options/`: settings sections (your sites, tags, lists, clean up, appearance, engines, sync, and backup).
- `utils/engines.ts`: engine definitions. Also imported at build time for the manifest's matches, so keep it free of browser APIs. When an engine breaks, diff against uBlacklist's ruleset at <https://github.com/ublacklist/builtin> (`serpinfo/*.yml`), which tracks these layouts continuously. An engine's `mobile` holds its phone layout's differences, chosen by user agent when the content script starts.
- `utils/listformat.ts`: the list parser. `utils/matcher.ts`: compiling lists and weighing a result. `utils/personal.ts`: line-level edits to the personal list. `utils/ruletext.ts`: splitting a matched rule into its options for the result menu.
- `utils/storage.ts`, `utils/ruleset.ts`, `utils/subscriptions.ts`: storage items, loading everything into one rule set, and downloading lists.
- `utils/importers.ts`: bringing sites over from uBlacklist rules, HOHSER exports, Goggles, and domain lists.
- `utils/backup.ts`: everything that follows the user (settings, tag choices, subscriptions, and the personal list), as a backup file and as the sync file. `utils/merge.ts`: three-way merges of it. `utils/webdav.ts`: the optional sync between browsers through a WebDAV server.
- `utils/links.ts`: the wiki and repository addresses the extension links to, and subscribe links.
- `utils/cleanup.ts`: the clean-up kinds, the headings that identify each one (with translations), and per-engine selectors.
- `upstream/serpinfo/`: a copy of uBlacklist's rules for the engines Anubis supports, kept current by the weekly engine sync. Tests read it; the build doesn't.
- `lists/`: the bundled lists and `directory.json` (the "More lists" directory). `docs/list-format.md` is the format reference. `lists/sources/` holds lists made from other projects' data, rewritten weekly by `.github/workflows/sources.yml` (`.github/scripts/update-sources.mjs`, with the conversions in `.github/scripts/sources/convert.mjs`).
- `docs/`: the documentation site. `guide/` holds the wiki's pages, `lists.md` renders `lists/directory.json`, and `.vitepress/` holds the config and brand theme. The extension links to the published site through `utils/links.ts` (the manifest's `homepage_url`, the popup's Help link, a wiki link on each settings section, and `helpLink` in `entrypoints/options/parts.ts` on panels and settings that a heading explains). Earlier builds link to `docs/list-format.md` on GitHub, so don't move that file, and keep page paths and headings stable or the links from settings break (`tests/help-links.test.ts` checks them). `subscribe.md` is where subscribe links lead and what the subscribe content script matches, so it can't move either. `.github/workflows/docs.yml` builds the site on pull requests and publishes it to GitHub Pages from main.
- `README.md`: the repository's front page (see [Documentation](#documentation)).
- `public/`: the logo (`anubis.svg`), toolbar icons (`icon/{16,32,48,96,128}.png`), and the English interface text (`_locales/en/`). WXT detects these automatically.
- `locales/<lang>/`: translations (`messages.json`) and the English each message came from (`sources.json`). The build adds them as `_locales/<lang>/`, leaving out messages whose English has changed since (`scripts/locales.mjs`, called from `wxt.config.ts`'s `build:publicAssets` hook).
- `store/`: store listing text and images; `node store/render.mjs` redraws the store icon and promo tile. `ROADMAP.md`: planned work.

## How it works

### Where things are stored

| Key | Where | What |
| --- | --- | --- |
| `sync:settings` | Sync | Every setting (`Settings` in `utils/storage.ts`). Read with `getSettings()`, which fills in defaults for anything missing. |
| `sync:tagPrefs` | Sync | What the user chose for each tag: its action, colour, label, and whether it's shown. |
| `sync:subscriptions` | Sync | The lists the user subscribes to. Absent means the default subscriptions, so a second computer's sync can't be overwritten by defaults on install. |
| `sync:personal`, `sync:personal.N` | Sync | The personal list: text in the list format, compressed (deflate, then base64) and split into chunks under sync's 8 KB per item. `sync:personal` counts the chunks and holds the text's checksum; lists saved before compression are plain text with no checksum, and still read. |
| `local:personal` | This computer | The personal list, once it's too big for sync (about 100 KB in total, some 10,000 sites compressed). |
| `local:personalCopy` | This computer | The last personal list read whole, with its checksum. Read instead of unpacking the chunks while the checksum matches, and in their place while chunks arriving from sync don't match it yet. |
| `local:listCache` | This computer | Downloaded lists, with when they were fetched and the last error. |
| `local:lastUpdateCheck` | This computer | When the background script last checked lists for updates. |
| `local:colorScheme` | This computer | Light or dark as the extension's own pages see it, written by the popup, settings, and (in Firefox) the background page. On Auto the result menu uses it, since a search page can be told otherwise (Firefox's Website appearance). |
| `sync:blockedSites`, `sync:hideStyleMoved`, `sync:defaultListsAdded` | Sync | Migration leftovers: the old block list, and flags for a one-time settings change and a one-time subscription to every default list. |
| `local:webdav` | This computer | The WebDAV server connected for syncing between browsers: its address, user name, and password. Never in sync. |
| `local:webdavBase` | This computer | What this browser and the server both had at the last sync: the starting point for the next merge. |
| `local:webdavStatus` | This computer | When the last sync with the server ended, and why it failed if it did. |

### Syncing between browsers

Browser sync needs nothing from Anubis beyond using `storage.sync`. Sharing between browsers is optional: the user connects a WebDAV server in Settings → Sync, and each browser reads and writes one file there, `anubis-sync.json`, in the backup format (`utils/backup.ts`). A sync (`utils/webdav.ts`, run only by the background script) reads the file, merges it with what this browser has, saves the result here and there, and keeps it as `local:webdavBase`. The merge is three-way (`utils/merge.ts`): against that base, so a change from either side since the last sync survives. Settings and tag choices merge key by key, subscriptions per list, and the personal list line by line, per site where it can. When both sides changed the same thing, this browser wins, except on its first sync, which starts from what a fresh install has and lets the server win. Writing sends `If-Match` with the file's ETag, so a browser that saved in between makes the server refuse, and the sync merges again.

The background script syncs a few seconds after a change here (unless everything still matches the base), on startup, and when a search page asks, at most every 5 minutes; that needs no `alarms` permission. Connecting asks for the server's host (`optional_host_permissions`) and in Firefox for the `browsingActivity` data permission, straight from the click. Anubis requires Firefox 142 or later.

Every change reads the stored value, changes it and writes it back, so writes go through a queue per item (`writeQueue` in `utils/storage.ts`): `editPersonal`, `updateSettings`, `setTagPref`, `editSubscriptions` and `editListCache`. Use them rather than `setValue` whenever the new value depends on the old one. Pass `updateSettings` a function when the change depends on the current settings (turning one engine off among several).

### From lists to a decision about one result

```
list text ──parseList──► ParsedList ──compileList──► CompiledList ─┐
  (utils/listformat.ts)                   (utils/matcher.ts)       │
                                                                   ▼
personal list + subscriptions + tag choices ──loadRuleSet──► RuleSet (utils/ruleset.ts)
                                                                   │
a result's URL, title, snippet ──evaluate(result, lists, prefs)──► Verdict
```

- `parseList` detects the format (Anubis, Goggle, uBlacklist, plain domains), reads the `! key: value` header and turns each line into a `Rule`, or a line error.
- `compileList` indexes rules by site and by host, so matching a result is a few map lookups. Subscribed lists are parsed with `parseList(text, true)`: plain `$site=` lines are only filed under their site, and parsed when `siteRules` first asks for that site. Code that goes through a whole list uses `allSites`, not `bySite`.
- `loadRuleSet` puts the personal list first, then every enabled subscription (the downloaded copy, or the bundled copy of a built-in list).
- `evaluate` returns a `Verdict`: the result's ranking (`level`), how far it moves (`score`), whether it's hidden and why (`hiddenBy`), its tags and what each does to the result (`tagEffects`, drawn by `tagMark` in place of the tag's diamond), and one `Reason` per rule that matched, which the result menu shows under **Why**. The personal list replaces the lists' own instructions and Hide tag choices and adds to Raise and Lower tag choices, which beat the lists. The menu's and the popup's balance tip by the result's `score` (`tiltFor` in `utils/balance.ts`). `collectTags` names each tag from the first subscribed list that defines it, then from the personal list: tagging a site with a list's tag copies the list's definition into the personal list (`tagSite`, `keepTagDefs` in `utils/personal.ts`), so the tag keeps its name once no list defines it, and the background script fills in copies after an install or update (`copyListTags` in `utils/ruleset.ts`). `docs/list-format.md` has the rules. Tag choices count once per tag and add up (five places per Raise or Lower), and one more `Reason` (`TAG_CHOICES`) explains them.

### One pass over a search page

`entrypoints/content/index.ts` runs a *pass* when the page loads, whenever the page changes (a `MutationObserver`, batched to one pass per frame) and whenever storage changes (`watchRuleSet`). On `pagehide` it disconnects the observer and cancels a queued frame; on a persisted `pageshow` it observes and scans again:

1. **Find the results** (`findResults` in `results.ts`). Engines with headings for titles are found by structure: each title heading, the link around it, then the smallest ancestor that holds only that result. Others use selectors from the engine's definition. Redirect links (Bing's `/ck/a`, Yahoo's `/RU=`…) are resolved to the real address. An opaque one (Google's `/goto`) falls back to the address the engine shows, another direct link in the result, and then a forum's name ("Reddit · r/…") where the address would be.
2. **Find what clean-up removes** (`findClutter` in `cleanup.ts`): blocks recognised by their heading, a marker text, or a selector, widened to the whole block in the results column. Nothing that holds a result, the search box, or the links to later pages is removed. Related searches and "People also ask" can also be a panel inside a result (the box Bing and Google add under a result you came back to); only that panel goes.
3. **Weigh each result** (`evaluate`) and write the decision onto the page as attributes: `data-anubis-result`, `data-anubis-state` (the ranking, plus `tagged`), `data-anubis-reveal`, `data-anubis-highlight`. `page.css` does the hiding, fading, and outlining from those attributes. Each result also gets its tags under the title and its ⚖ button (`ui.ts`), and in the Collapse style each run of hidden results gets one line.
4. **Rerank** by setting CSS `order` on the results inside a flex column. The engine's nodes never move: its scripts own them.
5. **Draw the summary** above the results: what Anubis did, Show hidden, Load more results, the tags on the page, and Undo for the last change from the result menu. When an AI answer sits above the results area (Google can put its AI Overview above the results column), the summary goes above it, inset to line up with the results, and falls back to the top of the results if the page lays it out anywhere else.
6. **Send the page's numbers** to the background script, which shows the hidden count on the toolbar button, and to the popup when it asks.

State that a click sets on the page (a result shown with its own Show button, a tag filter, Show hidden, the change Undo would take back) lives in the content script's variables, because the next pass rewrites every attribute from them.

Every piece of Anubis on the page is a custom element (`anubis-chips`, `anubis-weigh`, `anubis-bar`, `anubis-summary`, `anubis-popover`) with a closed shadow root, so the page's CSS and scripts can't reach inside. Hosts are made with `makeHost`, which pins their own styles inline, since page CSS can still reach the host element itself.

### Messages between the parts

Parts talk through `browser.runtime` messages, all typed in `utils/messages.ts`:

| Message | From | To | For |
| --- | --- | --- | --- |
| `stats` | Content script | Background | The hidden count on the toolbar button |
| `refresh-stale` | Content script | Background | Update lists that are due (at most every 30 minutes), and sync with a WebDAV server if one is connected (at most every 5 minutes) |
| `refresh-all` | Settings | Background | "Update all" |
| `sync-server` | Settings | Background | Connect and "Sync now": sync with the WebDAV server, answering with the outcome |
| `open-options` | Content script, popup | Background | Open settings |
| `open-subscribe` | Subscribe page | Background | Open Settings → Lists with a list filled in |
| `get-page-stats`, `set-reveal`, `go-deeper`, `set-filter` | Popup | Content script | "This page" in the popup: its numbers, Show hidden, Load more results, and Show only |
| `toggle-reveal` | Background | Content script | The Show hidden keyboard shortcut |

A listener that answers calls `sendResponse`, and returns `true` if the answer comes later. Chrome ignores a promise returned from a listener, so an answer sent that way works in Firefox and silently fails in Chrome.

### Extension pages

The popup, settings, and welcome page are plain DOM, built with `h()` from `utils/dom.ts`: no framework and no `innerHTML`. Text from lists always goes in as text nodes. Settings sections live in `entrypoints/options/` and are listed in `SECTIONS` in `options/main.ts`; each renders from storage and renders again when storage changes, unless someone is typing in it. `options/parts.ts` has the pieces they share (a section's title, a setting with a switch, a file to save) and `options/flash.ts` the messages shown after an action.

## Recipes

### Add or fix a search engine

1. Add or edit its entry in `ENGINES` (`utils/engines.ts`). Prefer structural detection (`heading`, with a `boundary` the climb must not pass) when titles are headings; otherwise give `item`, `link` and `title` selectors, taking them from [uBlacklist's rules](https://github.com/ublacklist/builtin) (`serpinfo/*.yml`). `matches` becomes the manifest's content script matches. Add `more` if the engine can load another page of results, and `mobile` for its phone layout's differences.
2. Add its display name to `.github/engine-watch.json` under the matching `serpinfo/*.yml` file, or document why there is no upstream file under `unwatched`. `tests/engine-watch.test.ts` checks that every engine is accounted for exactly once. For a watched engine, run `node .github/scripts/sync-serpinfo.mjs <a clone of ublacklist/builtin>` to add its file to `upstream/serpinfo/`.
3. Model the engine's page as a mock in `e2e/fixtures.mjs`, serve it from the `pages` map in `e2e/run.mjs` at the engine's real address, and add a check. For a fix, first confirm the check fails on the current build.
4. Update the engine table in `docs/guide/search-engines.md`, the engine list in `docs/guide/introduction.md`, and `store/README.md`. If it loads more results, add it to `docs/guide/more-results.md` too.
5. Load it on the live engine and record what you confirmed, with the date, in `docs/experiments.md`.

### Recognise another clean-up panel or language

Clean-up kinds live in `utils/cleanup.ts`:

- **A heading in another language:** add it to the kind's `headings` (matched whole, ignoring case) or `prefixes` (for "Images for …").
- **A block without a heading:** a disclaimer only that kind has goes in `markers`; a selector goes in that engine's `cleanupSelectors` in `utils/engines.ts`. Selectors are the last resort: engines rename classes without notice.
- **A tab or button that opens an AI chat:** `AI_ENTRY_POINTS`. These go with AI answers but aren't counted in the summary.
- **A new kind:** add it to `CleanupKind`, `NO_CLEANUP` and `CLEANUP` (`label` and `hint` for settings, `one` and `many` for the summary). Settings shows it automatically, and `getSettings` switches it off for people who saved settings before it existed. Add it to the table in `docs/guide/clean-up.md`.

`tests/cleanup.test.ts` covers headings and the summary's wording; the `cleanup` e2e part covers finding blocks on mock pages.

### Keep engine definitions in view

`upstream/serpinfo/` holds a copy of the mapped files from [uBlacklist's SERPINFO repository](https://github.com/ublacklist/builtin/tree/main/serpinfo), with the commit they came from in `source.json`. Every Monday `.github/workflows/engines.yml` runs `.github/scripts/sync-serpinfo.mjs`: when a copy is out of date, it updates it on the `engines/serpinfo` branch and opens a pull request (or comments on the one already open), so the diff shows exactly what uBlacklist changed. `.github/engine-watch.json` maps those files to supported engines; CI checks that mapping against `utils/engines.ts`, and that each engine's `matches` covers every address uBlacklist matches for it. When uBlacklist adds an address, that sync pull request fails CI until the engine gains it (or `ignoredHosts` gives a reason not to). Pull requests opened with a workflow's own token don't start CI, so the workflow starts it on the branch itself; GitHub also has to allow workflows to open pull requests (Settings → Actions → General), and without that the workflow opens an issue instead. This is a review signal, not an automatic selector update: Anubis's structural detection, cleanup, and paging can differ from uBlacklist, so verify proposed changes against a mock and a live results page.

### Add a setting

1. Add it to `Settings` and `DEFAULT_SETTINGS` in `utils/storage.ts`. `getSettings` fills it in for anyone whose stored settings predate it.
2. Add a row to the right settings section: `toggleRow` or `segRow` in `options/general.ts`, or `switchRow` from `options/parts.ts`.
3. Read it where it's needed: `rules.settings` in the content script, `getSettings()` elsewhere.
4. Changing a default for people who already use Anubis needs a one-time migration, run from the background script's `onInstalled` (see `migrateSettings`, which moved hidden results from Collapse to Remove).
5. Describe it in the wiki page for that section. Settings links each section to its page (`help` in `SECTIONS`), and panels or settings that a heading explains to that heading (`helpLink` in `parts.ts`), so keep page paths and headings as they are. `tests/help-links.test.ts` fails on a link that leads nowhere.

Backups and the sync between browsers include every setting without further work.

### Add interface text

Interface text belongs in `public/_locales/en/messages.json`, the browsers' own translation format:

- Name keys after where they appear: `popup…`, `welcome…`, `menu…`, `summary…`, `offer…`, and no prefix for text used in more than one place (`showHidden`, `anubisSettings`).
- Give each message a `description` for translators: where it appears, and what each `$1`, `$2` stands for.
- Use `t('key', …)` for text, `tn('key', count)` for counts (with `key_one` and `key_other` messages), `tJoin(items)` to join a list the way the language does ("a, b, and c", or "a, b, c" with `'unit'`), `tList('key', items)` for a sentence with a list of links in it, `tParts('key', …elements)` for a sentence with elements (code, a link, bold) in place of its `$1`, `$2`, and `tAgo(time)` for "5 minutes ago". Build a sentence from whole messages, one per shape, rather than from English fragments, and quote names with the `quoted` message. Static HTML takes `data-i18n`, `data-i18n-title`, `data-i18n-aria-label` or `data-i18n-placeholder`, filled in by `localizePage()`, which also sets the page's language and direction.
- Unit tests answer in English: `tests/setup.ts` installs the English messages before any test, so modules that translate as they load (`LEVEL_LABELS`, `PERSONAL_NAME`) work.
- `tests/i18n.test.ts` checks that every key the HTML and manifest use exists, that counts have both forms, and that translations keep English's placeholders. `tests/i18n-coverage.test.ts` fails on interface text written straight into the code or a page, on a message without a description, on a key nothing uses, and on a `$` that isn't a placeholder.
- Text that stays English on purpose goes under a comment saying so ("English on purpose: …"): the issues Anubis fills in for a list's maintainers (`reportUrl`, `suggestionUrl`, and each reason's `report`), and the start of a list file. Words Anubis matches on search pages, in the engines' own languages, go under "Not translated: …", or in an engine's selectors and clean-up's `headings`, `prefixes`, and `markers`, which the test knows.

Wording follows the interface's conventions: labels say what happens in plain words, and a site's ranking is always Hide, Lower, Normal, Raise, or Pin. How to add a language is in the wiki's [Help translate](docs/guide/translate.md).

### Translations

Arabic, Bengali, Chinese (Simplified), French, German, Hindi, Indonesian, Brazilian Portuguese, Russian, Spanish, and Urdu are machine translations, and every page that shows one says so (`machineTranslationNote` in `utils/translated.ts`: Settings above each section, the welcome page, and the popup's foot). Keep the notes until a speaker has read a language through, and keep the docs saying so too: the README, the wiki's Introduction, Getting started, and Help translate, and the store description.

- **Changing English makes its translations stale.** The build then ships that message in English for each language until it's translated again, so nobody reads an old meaning. Nothing fails: `node scripts/locales.mjs status` lists what's stale in each language.
- **After translating or correcting messages,** run `node scripts/locales.mjs record <lang> [key…]`, which records the English they came from. `tests/i18n.test.ts` fails on a translated message with no record, on one whose placeholders differ from English, and on a `langCode` that isn't its folder's name.
- **New messages** show in English in every translation until someone adds them.
- **Reviewing a language:** each has a project skill, `.claude/skills/review-<lang>/SKILL.md` (`review-ar`, `review-bn`, `review-de`, `review-es`, `review-fr`, `review-hi`, `review-id`, `review-pt-br`, `review-ru`, `review-ur`, and `review-zh-cn`), with its register, typography, glossary, the names browsers and Google use in it, and the mistakes machine translation makes there. Use it when correcting or retranslating messages.
- `ANUBIS_LANG=<lang> node e2e/run.mjs responsive` runs the browser in a translation and checks Settings at phone widths; parts that read English text don't work that way. The ranking words in German and French carry soft hyphens, so the ⚖ menu's row of five can break them. Arabic and Urdu run right to left: style with start and end (`margin-inline-start`, `text-align: start`), not left and right, and `ANUBIS_LANG=ar` shows the result.

### Store something new

1. Define an item in `utils/storage.ts` with `storage.defineItem`, in `sync:` if it's small and should follow the user between computers, otherwise `local:`. Sync allows 8 KB per item and about 100 KB in all.
2. If changes depend on the current value, give it a `writeQueue` and an `edit…` helper, as the others have.
3. Add it to the list of keys at the top of `utils/storage.ts`, to "Where things are stored" above and to the storage list in `CLAUDE.md`.
4. If it should reload open search pages when it changes, watch it in `watchRuleSet` (`utils/ruleset.ts`).
5. If it belongs in backups and the sync between browsers, add it to `SyncData` in `utils/backup.ts`, to `collectData`, `readBackup`, `applyData` and `mergeData` there, and to `freshInstall` with its default.

### Add something to the page

- A new element on the search page: make its host with `makeHost` in `ui.ts`, and add its tag name to `OWN_TAGS` in `results.ts`, which keeps the mutation observer and the result finder from mistaking it for the page's own content.
- Keep a reference to what you rendered instead of querying for it: `:scope` matches nothing inside a shadow root.
- Styles for inside the shadow roots go in `shadow.css`; page-level treatments keyed off `data-anubis-*` attributes go in `page.css`.
- On search pages, stay quiet: the page's own font, muted text, no fills. The result menu's cartouche and balance are the one flourish (`.claude/skills/frontend-design`).
- Colours, sizes, and controls come from [`STYLEGUIDE.md`](STYLEGUIDE.md). The palette is defined in `assets/theme.css` for extension pages and again in `shadow.css` for search pages, under the same names; change both together. `tests/palette.test.ts` checks they match.

### Add a list to the extension

- **A list in the directory** (Settings → Lists → More lists): an entry in `lists/directory.json`. The docs site's lists page renders the same file.
- **A list bundled with the extension:** the file in `lists/`, an entry in `directory.json` with `"builtin": true` (and `"default": true` to subscribe new users to it), and an import in `BUILTIN_TEXT` (`utils/subscriptions.ts`). `tests/lists.test.ts` checks that every list in `lists/` parses cleanly, and that every built-in directory entry has its bundled copy.
- **A new tagged site in a list:** add a trailing `#` comment to its rule explaining why the site fits the tag. The Anubis parser ignores this explanation.
- **A list made from another project's data:** a conversion function in `.github/scripts/sources/convert.mjs` and an entry in `SOURCES` (`.github/scripts/update-sources.mjs`). Run `node .github/scripts/update-sources.mjs` to write `lists/sources/<id>.anubis`, then add a directory entry with the source's repository as `homepage`. Check the source's licence allows it, keep that licence in the list's `! license:`, and include its notice in the header when the licence asks for that. Name the source in the list's name, author, and header. Leave out `! issues:`: it would offer "Suggest it to…", sending Anubis rules to a project that never asked for them; reports of mistakes still reach it through `homepage`. Where the source covers what one of Anubis's own lists does, the source replaces those hand-made entries: remove them from the bundled list, since boosts from two lists add up (`tests/sources.test.ts` checks this for DevDocs and Official docs). A source from a repository with no single data file can read a folder of it through a shallow clone (`folder` in `update-sources.mjs`). `tests/sources.test.ts` checks each generated list.

## Testing

**Unit tests** (`npm test`) cover what doesn't need a real page:

| File | Covers |
| --- | --- |
| `listformat.test.ts` | Parsing each format, the header, tags, slow patterns |
| `matcher.test.ts` | Which rule wins, tag choices, lenses, reasons |
| `personal.test.ts` | Line-level edits to the personal list, and undoing them |
| `siteranking.test.ts` | What pressing a ranking stores, the hint, and the order of tags in the result menu and the popup |
| `importers.test.ts` | Importing uBlacklist, HOHSER, Goggles, and domain lists |
| `storage.test.ts` | Chunking and compressing the personal list, lists arriving from sync in pieces, migrations, default subscriptions |
| `merge.test.ts` | Three-way merges of the personal list, settings, and subscriptions |
| `webdav.test.ts` | Syncing two browsers through a fake WebDAV server: first sync, changes on both sides (to the list, settings, and tag choices), a save in between, errors |
| `lists.test.ts` | Every bundled list, and the directory |
| `cleanup.test.ts` | Clean-up headings and markers, the summary sentence, redirects |
| `domain.test.ts` | Domains, redirect links, raw list addresses, issue links, subscribe links |
| `engines.test.ts` | Picking an engine's phone layout |
| `i18n.test.ts` | Message keys, plural forms, and placeholders; translations recorded against their English and left out once it changes; the undo line's wording, and reasons that stay English in reports |
| `i18n-coverage.test.ts` | No interface text outside the messages; every message described and used |
| `readme.test.ts` | The README's features against the wiki's introduction, and its links |
| `help-links.test.ts` | Settings' links into the wiki, to pages and headings that exist |

**End-to-end checks** (`npm run e2e`, or `node e2e/run.mjs <part>` after `npm run build:chrome`) load the Chrome build into Chromium. Install Playwright's Chromium with `npx playwright-core install chromium`. On NixOS, where Playwright's downloaded browser doesn't run, the harness uses a `chromium` on PATH, and without one fetches `nixpkgs#chromium` itself with Nix (from the nixpkgs `flake.lock` pins, kept in the Nix store), so `npm run e2e` and `npm run release:prep` work without a `nix shell`. `CHROMIUM_PATH` overrides all of them. Lists this repository publishes (`raw.githubusercontent.com/Bishop-V/anubis/main/lists/…`) are answered from the checkout, so a run tests the branch's lists. The `subscribe` part downloads a real list from GitHub; behind a TLS-intercepting proxy, set `PROXY_CA_CERT` to its CA. Branded Chrome no longer loads unpacked extensions from the command line. The harness answers the real engines' addresses with the mock pages in `e2e/fixtures.mjs` (Google, DuckDuckGo, Bing, Brave, and Google's phone layout), seeds storage with a test personal list and settings, prints what Anubis decided, and saves screenshots to `e2e/shots/`. Each part is a block in `e2e/run.mjs`: `pages`, `hostile`, `grouped`, `reveal`, `runs`, `shortcuts`, `mobile`, `off`, `palette`, `cleanup`, `pins`, `popover`, `a11y`, `ddg-hide`, `filter`, `deeper`, `import`, `subscribe`, `subscribe-link`, `options`, `responsive`, `popup-tags`, `tag-notes`, `welcome`, `sync`, `webdav`, and `checks`. `responsive` checks every Settings section at 320px, 360px, 375px, 389px, and 390px in light and dark schemes; below 390px it confines horizontal scrolling to the Your sites table and checks that labelled rankings stay in a compact grid with Add below. `popup-tags` checks selected-tag styling and creating a tag for the current site in light and dark themes and at 320px, 360px, and 390px. `tag-notes` checks adding a site explanation, its saved comment, and responsive layout in both themes. `sync` checks that a list arriving from browser sync in pieces is used only once all of it is there, and that settings and tag choices arriving from sync change an open search page. `checks` asserts hostile and grouped Google results, forum links, reveal state, back-forward-cache restoration, the phone layout, and AI/video cleanup on Google, DuckDuckGo, and Brave; CI runs it alongside `responsive` on every pull request. `webdav` connects a mock WebDAV server in Settings; a script can't answer the browser's permission prompt, so it runs a copy of the build whose manifest already allows the mock's host, and Playwright only reaches the background script's requests with `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1`, which the part sets.

Most parts print their findings rather than failing on them, so read the output: a check that should say `false` and says `true` is a failure. `checks` is the asserted group; when converting a reported value into an assertion, prefer user-visible behavior and stable thresholds over incidental markup. Mock pages are models of the engines' markup, not copies of it; when an engine breaks, model the markup that broke as a variant of its mock (Google's `hostile` and `grouped` are examples) and never commit a page saved from a live search.

`node e2e/run.mjs docs` redraws the wiki's screenshots in `docs/img/`, each in light and dark, a before and after of one search, and the same pair as slides in `docs/public/`. Rendering differs slightly between runs, so commit only the images your change affects. The homepage is drawn by `docs/.vitepress/theme/home.ts` from the frontmatter of `docs/index.md` (the heading, buttons, highlights, and closing section), and opens with the scroll-driven demo (`docs/.vitepress/theme/scroll-demo.ts`) beside the heading. The demo is drawn in HTML rather than screenshots, and copies what the extension draws on search pages: icons, the summary, the labels under titles, lowered and pinned results, and a hidden site leaving the page. Its panels are only of the kinds clean-up removes. Update it by hand when any of those change; the comment at the top of `scroll-demo.ts` lists the file each one comes from. The Introduction's animation of hiding a site, `docs/.vitepress/theme/hide-demo.ts` (`<HideDemo />` in the Markdown), is drawn the same way and shares the demo's styles. The page's Markdown keeps `summary.png` for reading on GitHub, and the site hides it. Ranking sites has one too, `rank-demo.ts` (`<RankDemo />`): a site pinned to the top and another lowered, with `result.png` kept for GitHub. The two share their icons, menu, and balance through `demo-parts.ts`. After `npm run docs:build`, `node e2e/homepage.mjs` plays both animations through, with and without reduced motion, and checks the homepage's layout at window sizes from 1024×768 to 2560×1440: the heading is centred beside the drawn page, the two sit in the middle of the window and stay there when scrolling starts, and the steps' diamonds are solid. It also checks that phones don't scroll sideways. The docs workflow runs it on every pull request that touches the docs.

## Documentation

Each thing is explained in one place, and everything else links to it:

| Where | For | What it holds |
| --- | --- | --- |
| The wiki, [`docs/`](docs) | People who use Anubis | How every feature works, installing, search engines, privacy and permissions, troubleshooting, and the list format. The extension links to its pages. |
| [`README.md`](README.md) | Anyone landing on the repository | What Anubis is, one line per feature linking to its wiki page, the few commands to start developing, and links to everything below. Nothing it could link to instead. |
| `DEVELOPMENT.md` (this file), [`CONTRIBUTING.md`](CONTRIBUTING.md), [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) | People and agents changing the code | How it's built and tested, the conventions, and releasing. `CLAUDE.md` is the condensed version for agents. |
| [`store/README.md`](store/README.md) | Releasing | The store listings, privacy answers, and the checklist before each release. |

When a feature or code area is changed or overhauled, update the documentation that explains its behaviour, implementation, data flow, or user-facing promises, not only the guide page. Check related references such as this file, `CLAUDE.md`, the privacy guide, store listing notes, and platform notes as applicable. Pages with generated screenshots have source comments pointing maintainers to the regeneration command; update the affected light and dark images and the nearby captions and text together.

The README's "What it does" and the Features in `docs/guide/introduction.md` list the same features under the same names, linking the same wiki pages. When you add, rename, or drop a feature, change both; `tests/readme.test.ts` fails until they match, and also checks that every link in the README leads somewhere. Details (engine names, permissions, install steps, settings) go in the wiki only, and the README links to them. `npm run docs:build` catches broken links inside the wiki.

## Checking live pages

The mocks can't prove a live engine still works. With the extension loaded (`npm run dev`, or a build loaded by hand as [Getting started](docs/guide/getting-started.md#install) describes), open a results page and look at:

- **What Anubis decided:** each result it found carries `data-anubis-result` and `data-anubis-state`; a reranked list carries `data-anubis-rerank`. Anubis's own elements show in DevTools with their shadow roots.
- **Logs:** the content script logs to the tab's console, the background script to its own (`about:debugging` → Inspect in Firefox, the service worker link on `chrome://extensions` in Chrome). Anubis's messages start with `[anubis]`.

- **What to check:** the "Still unverified" section of [`docs/experiments/live-pages.md`](docs/experiments/live-pages.md), and the newest notes in the same file, list open questions about the real markup. Record what you confirm there, with the date. A browser tool that can read a live results page answers the markup questions even without the extension loaded.
- **Turning a live bug into a test:** copy the live DOM (DevTools → `<html>` → Copy → Outer HTML), find the structure that breaks, and model it as a variant of that engine's mock in `e2e/fixtures.mjs`, with a check in `e2e/run.mjs`. Confirm the check fails on the previous build before fixing. Don't commit captured pages: they carry the signed-in account and location, and the repository is public.

## Releasing

These are the steps the release uses, and the ones for rebuilding the Firefox add-on from its source zip. Use the Nix shell on Linux, or Node.js 22.12 or newer on other platforms:

```sh
npm ci               # installs the exact versions in package-lock.json
npm run zip          # .output/anubis-<version>-firefox.zip and -sources.zip
npm run zip:chrome   # .output/anubis-<version>-chrome.zip, also used for Edge
```

The extension itself is in `.output/firefox-mv2/` (and `.output/chrome-mv3/`) after the zips are made.

To publish a version, run `npm run release:prep -- 0.3.0` (or `patch`, `minor`, or `major`; `scripts/release-prep.mjs`). It sets `version` in `package.json` and `package-lock.json`, then runs the type-check, unit tests, Firefox build and zips, the add-on linter, and the end-to-end checks, stopping at the first failure. Merge the change, then push a matching tag (`git tag v0.3.0 && git push origin v0.3.0`). `.github/workflows/release.yml` checks the tag against `package.json`, runs CI, builds the zips, and creates a GitHub Release with the packages attached. It then submits to each store whose keys are set in the protected `release` environment. A store with no keys is skipped; a store with only some keys fails the release. The environment needs required-reviewer protection restricted to `v*` tags and the store credentials; see [`store/README.md`](store/README.md) for setup and release details.

## Pitfalls

Mistakes that have been made once already. `docs/experiments.md` has the details of each.

- **Never move the engine's result nodes.** Its scripts own them. Reranking uses CSS `order`.
- **Reranked results can touch.** In the flex column, margins inside a result stop collapsing through it, so the space between results moves inside them (on Google). Anything drawn outside a result, like the pinned frame, needs room made for it: `makeRoomForPins` in `index.ts`.
- **Page CSS can reach a shadow host** and hide, fade, or flip it. `makeHost` pins the host's styles with `!important`.
- **`:scope` matches nothing inside a shadow root.** Keep references to what you rendered.
- **Add every new custom element to `OWN_TAGS`**, or the mutation observer and result finder treat it as the page's content.
- **Firefox's permission prompt needs the click.** `permissions.request()` must run before any `await` in the click handler.
- **Answer messages with `sendResponse`**, not a returned promise, or Chrome never gets the answer.
- **Keep page state in the content script's variables**, not only in attributes: the next pass rewrites attributes, and engines trigger passes on hover.
- **No `innerHTML`.** The add-on linter flags it. Build with `h()`, parse constant SVG with `DOMParser`, and pass `data-*` attributes to `h()` through `attrs`.
- **Engines change their markup without notice.** Prefer structure (headings, links, nesting) to class names.
- **The page is still arriving when the first pass runs.** The content script starts at `document_start` and engines stream their pages, so what sits below the results (a Next link, a More results button) may not be there yet. Don't treat its absence as final; wait for a later pass.
- **Links to the wiki's subscribe page carry `target="_self"`**, or VitePress's router follows them without loading the page, and the subscribe content script never runs.
- **WXT auto-imports every export of `utils/`.** A local name that matches one (a parameter, say) pulls that module in wherever the name appears (a `siteTags` export once broke `importers.test.ts`). Import explicitly, and give new exports names that locals won't share.
- **Keep `utils/engines.ts` and `utils/links.ts` free of browser APIs.** The build and the docs site import them.
- **Don't change the Firefox add-on ID** in `wxt.config.ts`: it's the add-on's permanent identity, and a new one orphans everyone's stored settings.
