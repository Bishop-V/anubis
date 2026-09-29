# Developing Anubis

How the extension is put together, and how to make the changes that come up most often. The [README](README.md#setup) gets you set up, [CONTRIBUTING.md](CONTRIBUTING.md) covers how changes are proposed and merged, and [`docs/experiments.md`](docs/experiments.md) records why things are the way they are, including what was tried and didn't work. Read the relevant part of that record before redoing something that looks odd: it's usually odd on purpose.

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

```sh
npm run dev            # Firefox with the extension loaded, reloading on save
npm run dev:chrome     # the same in Chrome
npm run compile        # type-check
npm test               # unit tests
npm run build          # .output/firefox-mv2/
npm run build:chrome   # .output/chrome-mv3/
npx web-ext lint -s .output/firefox-mv2
npm run e2e            # Chrome build, then every end-to-end check (needs CHROMIUM_PATH)
npm run docs:dev       # the wiki, with live reload
npm run docs:build     # the wiki; fails on a broken link
npm run zip            # store packages (see "Releasing")
npm run zip:chrome
```

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

Two builds of the same commit are identical file for file. Firefox's reviewers rebuild the extension from `anubis-<version>-sources.zip`, which leaves out `docs/`, `e2e/`, `store/` and `.claude/` (`zip.excludeSources` in `wxt.config.ts`).

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
| `sync:blockedSites`, `sync:hideStyleMoved` | Sync | Migration leftovers: the old block list, and a flag for a one-time settings change. |
| `local:webdav` | This computer | The WebDAV server connected for syncing between browsers: its address, user name, and password. Never in sync. |
| `local:webdavBase` | This computer | What this browser and the server both had at the last sync: the starting point for the next merge. |
| `local:webdavStatus` | This computer | When the last sync with the server ended, and why it failed if it did. |

### Syncing between browsers

Browser sync needs nothing from Anubis beyond using `storage.sync`. Sharing between browsers is optional: the user connects a WebDAV server in Settings → Sync, and each browser reads and writes one file there, `anubis-sync.json`, in the backup format (`utils/backup.ts`). A sync (`utils/webdav.ts`, run only by the background script) reads the file, merges it with what this browser has, saves the result here and there, and keeps it as `local:webdavBase`. The merge is three-way (`utils/merge.ts`): against that base, so a change from either side since the last sync survives. Settings and tag choices merge key by key, subscriptions per list, and the personal list line by line, per site where it can. When both sides changed the same thing, this browser wins, except on its first sync, which starts from what a fresh install has and lets the server win. Writing sends `If-Match` with the file's ETag, so a browser that saved in between makes the server refuse, and the sync merges again.

The background script syncs a few seconds after a change here (unless everything still matches the base), on startup, and when a search page asks, at most every 5 minutes; that needs no `alarms` permission. Connecting asks for the server's host (`optional_host_permissions`) and, in Firefox 140 and later, for the `browsingActivity` data permission, straight from the click.

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
- `compileList` indexes rules by site and by host, so matching a result is a few map lookups.
- `loadRuleSet` puts the personal list first, then every enabled subscription (the downloaded copy, or the bundled copy of a built-in list).
- `evaluate` returns a `Verdict`: the result's ranking (`level`), how far it moves (`score`), whether it's hidden and why (`hiddenBy`), its tags, and one `Reason` per rule that matched, which the result menu shows under **Why**. The personal list beats tag choices, which beat the lists; `docs/list-format.md` has the rules. Tag choices count once per tag and add up (five places per Raise or Lower), and one more `Reason` (`TAG_CHOICES`) explains them.

### One pass over a search page

`entrypoints/content/index.ts` runs a *pass* when the page loads, whenever the page changes (a `MutationObserver`, batched to one pass per frame) and whenever storage changes (`watchRuleSet`):

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

The popup, settings, and welcome page are plain DOM, built with `h()` from `utils/dom.ts`: no framework and no `innerHTML`. Text from lists always goes in as text nodes. Settings sections live in `entrypoints/options/` and are listed in `SECTIONS` in `options/main.ts`; each renders from storage and renders again when storage changes, unless someone is typing in it. `options/parts.ts` has the pieces they share (a section's title, a setting with a switch) and `options/flash.ts` the messages shown after an action.

## Recipes

### Add or fix a search engine

1. Add or edit its entry in `ENGINES` (`utils/engines.ts`). Prefer structural detection (`heading`, with a `boundary` the climb must not pass) when titles are headings; otherwise give `item`, `link` and `title` selectors, taking them from [uBlacklist's rules](https://github.com/ublacklist/builtin) (`serpinfo/*.yml`). `matches` becomes the manifest's content script matches. Add `more` if the engine can load another page of results, and `mobile` for its phone layout's differences.
2. If uBlacklist has a file for it, add the file to `WATCHED` in `.github/scripts/watch-engines.mjs`, so the weekly engine watch reports changes to it.
3. Model the engine's page as a mock in `e2e/fixtures.mjs`, serve it from the `pages` map in `e2e/run.mjs` at the engine's real address, and add a check. For a fix, first confirm the check fails on the current build.
4. Update the engine table in `docs/guide/search-engines.md`, the engine lists in the README, and `store/README.md`, and `docs/guide/more-results.md` if it loads more results.
5. Load it on the live engine and record what you confirmed, with the date, in `docs/experiments.md`.

### Recognise another clean-up panel or language

Clean-up kinds live in `utils/cleanup.ts`:

- **A heading in another language:** add it to the kind's `headings` (matched whole, ignoring case) or `prefixes` (for "Images for …").
- **A block without a heading:** a disclaimer only that kind has goes in `markers`; a selector goes in `CLEANUP_SELECTORS` under the engine's id. Selectors are the last resort: engines rename classes without notice.
- **A tab or button that opens an AI chat:** `AI_ENTRY_POINTS`. These go with AI answers but aren't counted in the summary.
- **A new kind:** add it to `CleanupKind`, `NO_CLEANUP` and `CLEANUP` (`label` and `hint` for settings, `one` and `many` for the summary). Settings shows it automatically, and `getSettings` switches it off for people who saved settings before it existed. Add it to the table in `docs/guide/clean-up.md`.

`tests/cleanup.test.ts` covers headings and the summary's wording; the `cleanup` e2e part covers finding blocks on mock pages.

### Add a setting

1. Add it to `Settings` and `DEFAULT_SETTINGS` in `utils/storage.ts`. `getSettings` fills it in for anyone whose stored settings predate it.
2. Add a row to the right settings section: `toggleRow` or `segRow` in `options/general.ts`, or `switchRow` from `options/parts.ts`.
3. Read it where it's needed: `rules.settings` in the content script, `getSettings()` elsewhere.
4. Changing a default for people who already use Anubis needs a one-time migration, run from the background script's `onInstalled` (see `migrateSettings`, which moved hidden results from Collapse to Remove).
5. Describe it in the wiki page for that section. Settings links each section to its page (`help` in `SECTIONS`), so keep page paths as they are.

Backups and the sync between browsers include every setting without further work.

### Add interface text

Interface text belongs in `public/_locales/en/messages.json`, the browsers' own translation format:

- Name keys after where they appear: `popup…`, `welcome…`, `menu…`, `summary…`, `offer…`, and no prefix for text used in more than one place (`showHidden`, `anubisSettings`).
- Give each message a `description` for translators: where it appears, and what each `$1`, `$2` stands for.
- Use `t('key', …)` for text, `tn('key', count)` for counts (with `key_one` and `key_other` messages), `tJoin(items)` to join a list the way the language does ("a, b, and c"), and `tList('key', items)` for a sentence with a list of links in it. Build a sentence from whole messages, one per shape, rather than from English fragments. In tests, `useEnglish()` from `tests/english.ts` makes `t()` answer in English. Static HTML takes `data-i18n`, `data-i18n-title`, `data-i18n-aria-label` or `data-i18n-placeholder`, filled in by `localizePage()`.
- `tests/i18n.test.ts` checks that every key the HTML and manifest use exists, and that counts have both forms.

Not everything is converted yet: `ROADMAP.md` lists what's left. Wording follows the interface's conventions: labels say what happens in plain words, and a site's ranking is always Hide, Lower, Normal, Raise, or Pin.

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
- Colours, sizes, and controls come from [`STYLEGUIDE.md`](STYLEGUIDE.md). The palette is defined in `assets/theme.css` for extension pages and again in `shadow.css` for search pages, under the same names; change both together.

### Add a list to the extension

- **A list in the directory** (Settings → Lists → More lists): an entry in `lists/directory.json`. The docs site's lists page renders the same file.
- **A list bundled with the extension:** the file in `lists/`, an entry in `directory.json` with `"builtin": true` (and `"default": true` to subscribe new users to it), and an import in `BUILTIN_TEXT` (`utils/subscriptions.ts`). `tests/lists.test.ts` checks that every list in `lists/` parses cleanly, and that every built-in directory entry has its bundled copy.

## Testing

**Unit tests** (`npm test`) cover what doesn't need a real page:

| File | Covers |
| --- | --- |
| `listformat.test.ts` | Parsing each format, the header, tags, slow patterns |
| `matcher.test.ts` | Which rule wins, tag choices, lenses, reasons |
| `personal.test.ts` | Line-level edits to the personal list, and undoing them |
| `importers.test.ts` | Importing uBlacklist, HOHSER, Goggles, and domain lists |
| `storage.test.ts` | Chunking and compressing the personal list, lists arriving from sync in pieces, migrations, default subscriptions |
| `merge.test.ts` | Three-way merges of the personal list, settings, and subscriptions |
| `webdav.test.ts` | Syncing two browsers through a fake WebDAV server: first sync, changes on both sides, a save in between, errors |
| `lists.test.ts` | Every bundled list, and the directory |
| `cleanup.test.ts` | Clean-up headings and markers, the summary sentence, redirects |
| `domain.test.ts` | Domains, redirect links, raw list addresses, issue links, subscribe links |
| `engines.test.ts` | Picking an engine's phone layout |
| `i18n.test.ts` | Message keys, plural forms, and placeholders, the undo line's wording |

**End-to-end checks** (`npm run e2e`, or `node e2e/run.mjs <part>` after `npm run build:chrome`) load the Chrome build into Chromium. `CHROMIUM_PATH` has to point at a Chromium binary: branded Chrome no longer loads unpacked extensions from the command line. The harness answers the real engines' addresses with the mock pages in `e2e/fixtures.mjs` (Google, DuckDuckGo, Bing, Brave, and Google's phone layout), seeds storage with a test personal list and settings, prints what Anubis decided, and saves screenshots to `e2e/shots/`. Each part is a block in `e2e/run.mjs`: `pages`, `hostile`, `grouped`, `reveal`, `runs`, `shortcuts`, `mobile`, `off`, `cleanup`, `pins`, `popover`, `a11y`, `ddg-hide`, `filter`, `deeper`, `import`, `subscribe`, `subscribe-link`, `options`, `welcome`, `sync`, and `webdav`. `webdav` connects a mock WebDAV server in Settings; a script can't answer the browser's permission prompt, so it runs a copy of the build whose manifest already allows the mock's host, and Playwright only reaches the background script's requests with `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1`, which the part sets.

Parts print their findings rather than failing on them (turning them into assertions is on the roadmap), so read the output: a check that should say `false` and says `true` is a failure. Mock pages are models of the engines' markup, not copies of it; when an engine breaks, model the markup that broke as a variant of its mock (Google's `hostile` and `grouped` are examples) and never commit a page saved from a live search.

`node e2e/run.mjs docs` redraws the wiki's screenshots in `docs/img/`, each in light and dark, a before and after of one search, and the same pair as slides in `docs/public/`. Rendering differs slightly between runs, so commit only the images your change affects. The homepage's scroll-driven demo (`docs/.vitepress/theme/scroll-demo.ts`) is drawn in HTML rather than screenshots: update its wording by hand when the summary, tags, or hidden line change.

## Checking live pages

The mocks can't prove a live engine still works. With the extension loaded (`npm run dev`, or a build loaded by hand as the README describes), open a results page and look at:

- **What Anubis decided:** each result it found carries `data-anubis-result` and `data-anubis-state`; a reranked list carries `data-anubis-rerank`. Anubis's own elements show in DevTools with their shadow roots.
- **Logs:** the content script logs to the tab's console, the background script to its own (`about:debugging` → Inspect in Firefox, the service worker link on `chrome://extensions` in Chrome). Anubis's messages start with `[anubis]`.

`docs/experiments.md` lists what's still unverified on live pages; record what you confirm there, with the date.

## Releasing

The steps are in the README ([Building the store release](README.md#building-the-store-release)) and `store/README.md`: set `version` in `package.json`, merge, and push a matching `v…` tag. `.github/workflows/release.yml` checks the tag, runs CI, builds the zips, creates a GitHub Release and, once approved, submits to the Chrome, Firefox, and Edge stores.

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
- **Links to the wiki's subscribe page carry `target="_self"`**, or VitePress's router follows them without loading the page, and the subscribe content script never runs.
- **Keep `utils/engines.ts` and `utils/links.ts` free of browser APIs.** The build and the docs site import them.
- **Don't change the Firefox add-on ID** in `wxt.config.ts`: it's the add-on's permanent identity, and a new one orphans everyone's stored settings.
