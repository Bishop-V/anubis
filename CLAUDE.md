# Anubis

A Chrome/Firefox extension that weighs search results: it tags them, reranks them, and hides unwanted sites, using your own choices plus subscribable lists (Anubis lists, Brave Goggles, uBlacklist rulesets). The mascot is Anubis, the Egyptian god who weighed hearts against a feather: sites "fail the weighing" and get hidden.

This project values documented experimentation, so record what was tried and what failed, not just what shipped. That record lives in `docs/experiments.md`.

## Dev environment

- The toolchain comes from the Nix flake. Run the tools through `nix develop`; never suggest global installs.
- Before editing, follow [`AGENTS.md`](AGENTS.md): reproduce existing behavior before changing it, preserve documented compatibility contracts, and add a regression check for fixes.

## Stack

- [WXT](https://wxt.dev) 0.21 with Vite and TypeScript. There's no UI framework; the popup, options page, welcome page, and in-page UI are plain DOM built with the `h()` helper in `utils/dom.ts`. Text from lists always goes in as text nodes, never markup.
- Interface text goes in `public/_locales/en/messages.json` and is used through `t()`, `tn()` (counts), `tJoin()` (lists) and `localizePage()` (static HTML) from `utils/i18n.ts`. The manifest, ranking names, popup, welcome page, the summary, and the result menu's report and suggestion lines are converted; `ROADMAP.md` lists the rest. Put new text there rather than in code.
- It builds as Chrome MV3 and Firefox MV2 from one codebase.
- Storage uses WXT's `storage` (`#imports`):
  - `sync:settings`, `sync:tagPrefs`, `sync:subscriptions` (absent means the default subscriptions)
  - `sync:personal` + `sync:personal.N`: the personal list as text in the list format, compressed and chunked to fit sync's 8 KB items, with a checksum so a list still arriving from sync isn't read short (`local:personalCopy` stands in); falls back to `local:personal` when too big
  - `local:listCache`: downloaded list texts; `local:lastUpdateCheck`: when the background last checked lists for updates; `local:colorScheme`: light or dark as the popup sees it, so the result menu can match it on Auto
  - `local:webdav` (the server's address and login, never in sync), `local:webdavBase` (what both sides had at the last sync, for the merge) and `local:webdavStatus` (when the last sync ended, and why it failed): the optional sync between browsers
  - `sync:blockedSites` is the old block list, migrated into the personal list on install; `sync:hideStyleMoved` records the one-time move from Collapse to Remove as the default

## Commands

Firefox is the default target (`browser: 'firefox'` in `wxt.config.ts`). The `:chrome` variants override it.

- `npm run dev` / `npm run dev:chrome`: opens a browser with the extension loaded and reloads it on save
- `npm run build` / `npm run build:chrome`: production build into `.output/`
- `npm run compile`: type-check. Run it after every change.
- `npm test`: Vitest unit tests in `tests/` (list format, matcher, personal list edits, storage, merging, WebDAV sync, bundled lists, clean-up, domains, and issue links, engines, interface text, importers, the palette, the README and settings' links against the wiki, and the mock pages against uBlacklist's selectors)
- `npm run e2e`: builds for Chrome and runs `e2e/run.mjs` against mock search pages, saving screenshots to `e2e/shots/`. Install Playwright's Chromium with `npx playwright-core install chromium`; on NixOS, Playwright's downloaded browser doesn't run, so the harness falls back to a `chromium` on PATH (or set `CHROMIUM_PATH`). `node e2e/run.mjs <part>` runs one part: `pages`, `hostile`, `grouped`, `reveal`, `runs`, `shortcuts`, `mobile`, `off`, `palette`, `cleanup`, `pins`, `popover`, `a11y`, `ddg-hide`, `filter`, `deeper`, `import`, `subscribe`, `subscribe-link`, `options`, `responsive`, `welcome`, `sync`, `webdav`, `checks` (assertions for the core search-page behaviour). `subscribe` downloads a real list from GitHub; behind a TLS-intercepting proxy set `PROXY_CA_CERT` to its CA.
- `npx web-ext lint -s .output/firefox-mv2`: the Mozilla add-on linter; keep it at zero warnings (CI treats warnings as errors)
- `.github/workflows/ci.yml` runs compile, tests, both builds, the `responsive` and `checks` e2e parts, and the lint on pushes to main and on pull requests. Its `check` job is required: `main` is protected, so changes land through a pull request from a branch, never a direct push. `CONTRIBUTING.md` is the contributor-facing version of these rules, `.github/pull_request_template.md` their checklist, `DEVELOPMENT.md` the developer-facing version of the Layout and Pitfalls sections below, with recipes for common changes, `STYLEGUIDE.md` the long version of the design conventions, and `ACCESSIBILITY.md` the guidelines for screen readers and the keyboard; keep all five in step with this file.
- `.github/workflows/engines.yml` runs weekly: when uBlacklist changes its rules for an engine Anubis supports, it updates the copies of its rules in `upstream/serpinfo/` and opens a pull request labelled `engines` (`.github/scripts/sync-serpinfo.mjs` reads `.github/engine-watch.json`; `tests/engine-watch.test.ts` keeps the mapping in step with `utils/engines.ts` and fails when uBlacklist matches an address an engine doesn't)
- `npm run zip` / `npm run zip:chrome`: package for the store. `store/README.md` has the listings, privacy answers, and release steps; `node store/render.mjs` redraws the store icon and promo tile.
- `npm run release:prep -- <version>` (`scripts/release-prep.mjs`): sets the version (or `patch`, `minor`, `major`; none keeps it), then runs compile, tests, the Firefox zips, the lint, and e2e, stopping at the first failure
- `.github/workflows/release.yml` releases on a `v*` tag that matches `package.json`'s version: CI, both zips, a GitHub Release, then `wxt submit` after approval in the `release` environment, which holds the store keys. It submits only to stores whose keys are all set (Firefox ships first), and fails on a store with only some
- `npm run docs:dev` / `npm run docs:build`: the documentation site (VitePress) from `docs/`. The build fails on a broken link. `.github/workflows/docs.yml` builds it on pull requests and publishes it to GitHub Pages from main. `node e2e/run.mjs docs` regenerates its screenshots in `docs/img/` from the mock pages, each in light and dark (`x.png` and `x-dark.png`: pages link to the light one and `docs/.vitepress/config.ts` adds the dark one on the site), including a before and after of one search (`before.png`, `after.png`) and the same pairs as 1920×1080 slides (`docs/public/before-after-light.png`, `-dark.png`); rerun it after changing anything they show, then commit only the images the change affects. The homepage is drawn by `docs/.vitepress/theme/home.ts` from `docs/index.md`'s frontmatter (heading, buttons, highlights, closing section), with the scroll-driven demo (`scroll-demo.ts`) as its first screen. The demo is drawn in HTML, not screenshots, and copies what the extension draws on search pages (icons, the summary, the labels under titles, the hidden line, lowered and pinned results), so update it by hand when those change; the top of `scroll-demo.ts` lists where each one comes from.

## Checking on live pages

Everything on search pages was built against the mocks in `e2e/fixtures.mjs`: the sandbox it was developed in couldn't reach any search engine. With a real browser, checking live pages is the most useful work.

- Load the extension: `npm run dev` opens Firefox with it and reloads on save. A build loads from `about:debugging` → This Firefox → Load Temporary Add-on → `.output/firefox-mv2/manifest.json` (removed when Firefox closes), or from `chrome://extensions` with Developer mode on → Load unpacked → `.output/chrome-mv3`.
- What to check: the "Still unverified" section of `docs/experiments.md` and its newest Google notes, which list open questions about the real markup. Record what was confirmed there, with the date. A browser tool that can read a live results page answers the markup questions even without the extension loaded.
- What Anubis decided: each result it found carries `data-anubis-result` and `data-anubis-state` (its level, plus `tagged`); a reranked list carries `data-anubis-rerank` and its results a CSS `order`. Anubis's elements are `anubis-chips`, `anubis-weigh`, `anubis-bar`, `anubis-summary` and `anubis-popover`, each with a closed shadow root (DevTools still shows its contents).
- Logs: the content script logs to the tab's console; the background script has its own (`about:debugging` → Inspect, or the service worker link on `chrome://extensions`).
- Turning a live bug into a test: copy the live DOM (DevTools → `<html>` → Copy → Outer HTML), find the structure that breaks, and model it as a variant of that engine's mock in `e2e/fixtures.mjs` (Google's `hostile` and `grouped` are examples), with a check in `e2e/run.mjs`. Confirm the check fails on the previous build before fixing. Don't commit captured pages: they carry the signed-in account and location, and the repo is public.

## Layout

- `wxt.config.ts`: manifest settings (name, permissions, optional host permissions, Firefox ID)
- `entrypoints/content/`: runs on result pages of every engine in `utils/engines.ts`
  - `index.ts`: the pass loop (find results, weigh, render, rerank), the mutation observer, messages
  - `results.ts`: finding results, structurally (title heading → link → smallest single-result ancestor) or by selector, and resolving redirect links to the real URL
  - `ui.ts` + `shadow.css`: tags under titles, the ⚖ button on each result and its menu, hidden-result lines, the summary; all in closed shadow roots
  - `deeper.ts`: "Load more results", bringing later result pages onto the current one
  - `cleanup.ts`: finding the blocks that clean-up removes (AI answers, video panels…), and its redirect to Google's Web tab
  - `page.css`: page-level treatments keyed off `data-anubis-*` attributes (hidden, lowered, pinned, highlight, rerank)
- `entrypoints/subscribe.content.ts`: runs only on the wiki's subscribe page (`…/anubis/subscribe?url=…&name=…`, where subscribe links lead) and asks the background to open Settings → Lists with that list filled in. Settings asks before subscribing: anyone can make a link.
- `entrypoints/background.ts`: list updates (on startup and when a search page asks, at most every 30 minutes), syncing with a WebDAV server when one is connected (a few seconds after a change, on startup, and when a search page asks, at most every 5 minutes), the toolbar badge, the grey icon while Anubis is off (`public/icon-off/`), and opening the welcome page on first install
- `entrypoints/popup/`: changes with the tab: what Anubis did on a search page (and its tags to show only), the site you're on in the cartouche and balance (`utils/balance.ts`, shared with the result menu), or adding a site by hand; then the last few of your sites
- `entrypoints/welcome/`: the page that opens on first install: how to pin the toolbar button in this browser, searches to try, and the lists you start with
- `entrypoints/options/`: settings sections (your sites, tags, lists, clean up, appearance, engines, sync, backup)
- `utils/engines.ts`: engine definitions. Also imported at build time for the manifest's matches, so keep it free of browser APIs. When an engine breaks, diff against uBlacklist's ruleset at <https://github.com/ublacklist/builtin> (`serpinfo/*.yml`), which tracks these layouts continuously. An engine's `mobile` holds its phone layout's differences, chosen by user agent when the content script starts.
- `utils/listformat.ts`: the list parser; `utils/matcher.ts`: compiling lists and weighing a result; `utils/personal.ts`: line-level edits to the personal list
- `utils/storage.ts`, `utils/ruleset.ts`, `utils/subscriptions.ts`: storage items, loading everything into one rule set, downloading lists
- `utils/importers.ts`: bringing sites over from uBlacklist rules, HOHSER exports, Goggles, and domain lists
- `utils/backup.ts`: everything that follows the user (settings, tag choices, subscriptions, the personal list), as a backup file and as the sync file; `utils/merge.ts`: three-way merges of it; `utils/webdav.ts`: the optional sync between browsers through a WebDAV server
- `utils/links.ts`: the wiki and repository addresses the extension links to, and subscribe links
- `utils/cleanup.ts`: the clean-up kinds, the headings that identify each one (with translations) and per-engine selectors
- `upstream/serpinfo/`: a copy of uBlacklist's rules for the engines Anubis supports, kept current by the weekly engine sync; tests read it, the build doesn't
- `lists/`: the bundled lists and `directory.json` (the "More lists" directory). `docs/list-format.md` is the format reference.
- `docs/`: the documentation site. `guide/` holds the wiki's pages, `lists.md` renders `lists/directory.json`, and `.vitepress/` holds the config and brand theme. The extension links to the published site through `utils/links.ts` (the manifest's `homepage_url`, the popup's Help link, a wiki link on each settings section, and `helpLink` in `entrypoints/options/parts.ts` on panels and settings that a heading explains). Earlier builds link to `docs/list-format.md` on GitHub, so don't move that file, and keep page paths and headings stable or the links from settings break (`tests/help-links.test.ts` checks them). `subscribe.md` is where subscribe links lead and what the subscribe content script matches, so it can't move either. Write for people who use the extension, in the same plain words as its interface. When changing or overhauling a feature, component, data flow, or user-visible behaviour, update every relevant guide and technical reference; review privacy, store, and platform notes whenever their claims are affected.
- `README.md`: the repository's front page. It links into the wiki rather than repeating it: one line per feature, the same features under the same names as `docs/guide/introduction.md`'s Features, linking the same pages (`tests/readme.test.ts` checks this and every README link). Change both together; details (engines, permissions, install steps) go in the wiki only. `DEVELOPMENT.md`'s Documentation section says what goes where.
- `public/`: the logo (`anubis.svg`), toolbar icons (`icon/{16,32,48,96,128}.png`) and interface text (`_locales/`). WXT detects these automatically.
- `store/`: store listing text and images. `ROADMAP.md`: planned work.

## Conventions

- `STYLEGUIDE.md` is the style guide: the palette (the same tokens in `assets/theme.css` and `entrypoints/content/shadow.css`, kept in step), the type scale, radii, controls, states, layouts, and wording. Use its tokens, sizes, and controls; don't add a new colour, size, or radius without adding it there.
- Keep the brand colours: background `#1b1a16`, gold `#d4a637`.
- Design follows `.claude/skills/frontend-design`: on search pages stay quiet (the page's font, muted text, no fills); the result menu's cartouche and balance are the one flourish (the popup repeats them for the site you're on). Sentence case, no ALL-CAPS labels, no "·"-joined meta strings.
- Write whole sentences in British spelling, with the serial comma in lists of three or more ("a, b, and c"); when a sentence needs a second "and", start another. `STYLEGUIDE.md` has examples.
- Wording and interaction follow `.claude/skills/ux-heuristics` (Krug and Nielsen). Labels say what happens in plain words ("Load more results", "Hide, rank, or tag this site"); the Anubis motif stays in the logo, the summary's mark, and the menu's balance, never in the name of a function. One word per concept: a site's *ranking* is Hide, Lower, Normal, Raise, or Pin. Use an icon only where it's universally understood (the toothed cog, `ICON_GEAR`, for settings; × to close), otherwise a text button, and give every icon-only button an `aria-label` and a tooltip.
- Keep screen readers and the keyboard in mind, on Anubis's own pages and on the search pages it changes: `ACCESSIBILITY.md` has the guidelines and the known gaps. They're guidance, not a gate.
- Nothing is hidden or removed without a trace: the summary says what Anubis did, and "Show hidden" undoes it for the page.
- Ask for as few permissions as possible. Only add a permission the feature actually needs.
- Verify changes by type-checking, `npm test`, building both browsers, and loading the extension. Search pages can only be checked for real in a browser; `npm run e2e` covers the logic against mocks.

## Pitfalls

Lessons from earlier bugs and design decisions; `docs/experiments.md` has the details.

- Never move the engine's result nodes: its scripts own them. Reranking sets CSS `order` in a flex column.
- In that flex column, margins inside a result no longer collapse through it, so results can touch (Google's do). Anything drawn outside a result's box, like the pinned frame, needs room made for it (`makeRoomForPins` in `index.ts`).
- Page CSS can still reach a shadow host and hide or flip it. Create hosts with `makeHost` in `ui.ts`, which pins their styles inline with `!important`.
- `:scope` matches nothing inside a shadow root. Keep references to rendered nodes instead of querying for them.
- Anubis's own elements are recognised by tag name (`OWN_TAGS` in `results.ts`), so the mutation observer and the result finder ignore them. Add any new custom element there.
- In Firefox, `permissions.request()` has to run before any `await` in a click handler, or it loses the user gesture and fails.
- `runtime.onMessage` listeners reply with `sendResponse` (plus `return true` when the reply is async). Chrome ignores a returned promise; Firefox accepts it, so a promise-only reply works in one browser and silently fails in the other.
- State a click sets on the page (a revealed result, a filter) belongs in the content script's variables, not only in DOM attributes: the next pass rewrites the attributes from that state, and engines trigger passes on hover.
- No `innerHTML`: `web-ext lint` flags it. Build DOM with `h()`, parse constant SVG with `DOMParser`. Pass `data-*` to `h()` through `attrs`; `dataset` is read-only.
- Engines change markup without notice. Prefer structural fixes (headings, links, nesting) over class names.
- Playwright can't answer a permission prompt, and only routes the background script's requests with `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1`. The `webdav` e2e part runs a copy of the build whose manifest already allows its mock server.
- VitePress's router follows links within the docs site without loading a page, and content scripts only run on page loads. Links to the subscribe page carry `target="_self"`, which the router leaves alone.

## Working agreements

- Commit messages: the message text only — no trailers, no co-author or AI attribution. Keep them short and general unless detail is asked for.
- Keep replies short. Explain browser-extension concepts (manifest keys, permissions, content versus background scripts, MV2 versus MV3) briefly the first time they come up.
- Committed files stay neutral and project-scoped: no personal or identifying details.

## Roadmap

Planned work lives in `ROADMAP.md`: releases, security fixes, e2e assertions, Firefox for Android, translation, and features. Move an item into `docs/experiments.md` once it's tried. If an interface change affects generated documentation screenshots, run `node e2e/run.mjs docs`, review and update the affected light and dark screenshots alongside their captions, and leave unrelated regenerated files out.
