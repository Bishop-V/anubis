# Anubis

A Chrome/Firefox extension that weighs search results: it tags them, reranks them and hides unwanted sites, using your own choices plus subscribable lists (Anubis lists, Brave Goggles, uBlacklist rulesets). The mascot is Anubis, the Egyptian god who weighed hearts against a feather: sites "fail the weighing" and get hidden.

This project values documented experimentation, so record what was tried and what failed, not just what shipped. That record lives in `docs/experiments.md`.

## Dev environment

- The toolchain comes from the Nix flake. Run the tools through `nix develop`; never suggest global installs.

## Stack

- [WXT](https://wxt.dev) 0.21 with Vite and TypeScript. There's no UI framework; the popup, options page and in-page UI are plain DOM built with the `h()` helper in `utils/dom.ts`. Text from lists always goes in as text nodes, never markup.
- It builds as Chrome MV3 and Firefox MV2 from one codebase.
- Storage uses WXT's `storage` (`#imports`):
  - `sync:settings`, `sync:tagPrefs`, `sync:subscriptions` (absent means the default subscriptions)
  - `sync:personal` + `sync:personal.N`: the personal list as text in the list format, chunked to fit sync's 8 KB items; falls back to `local:personal` when too big
  - `local:listCache`: downloaded list texts
  - `sync:blockedSites` is the old block list, migrated into the personal list on install

## Commands

Firefox is the default target (`browser: 'firefox'` in `wxt.config.ts`). The `:chrome` variants override it.

- `npm run dev` / `npm run dev:chrome`: opens a browser with the extension loaded and reloads it on save
- `npm run build` / `npm run build:chrome`: production build into `.output/`
- `npm run compile`: type-check. Run it after every change.
- `npm test`: Vitest unit tests in `tests/` (list format, matcher, personal list edits, storage, bundled lists)
- `npm run e2e`: builds for Chrome and runs `e2e/run.mjs` against mock search pages, saving screenshots to `e2e/shots/`. Needs `CHROMIUM_PATH`.
- `npx web-ext lint -s .output/firefox-mv2`: the Mozilla add-on linter; keep it at zero warnings
- `npm run zip` / `npm run zip:chrome`: package for the store

## Layout

- `wxt.config.ts`: manifest settings (name, permissions, optional host permissions, Firefox ID)
- `entrypoints/content/`: runs on result pages of every engine in `utils/engines.ts`
  - `index.ts`: the pass loop (find results, weigh, render, rerank), the mutation observer, messages
  - `results.ts`: finding results, structurally (title heading → link → smallest single-result ancestor) or by selector, and resolving redirect links to the real URL
  - `ui.ts` + `shadow.css`: tags under titles, the weigh button and menu, hidden-result lines, the summary; all in closed shadow roots
  - `deeper.ts`: "Weigh deeper", bringing later result pages onto the current one
  - `page.css`: page-level treatments keyed off `data-anubis-*` attributes (hidden, lowered, pinned, highlight, rerank)
- `entrypoints/background.ts`: list updates (on startup and when a search page asks, at most every 30 minutes) and the toolbar badge
- `entrypoints/popup/`: what Anubis did on this page, quick weigh, recent sites
- `entrypoints/options/`: settings sections (your sites, tags, lists, appearance, engines, share and back up)
- `utils/engines.ts`: engine definitions. Also imported at build time for the manifest's matches, so keep it free of browser APIs. When an engine breaks, diff against uBlacklist's ruleset at <https://github.com/ublacklist/builtin> (`serpinfo/*.yml`), which tracks these layouts continuously.
- `utils/listformat.ts`: the list parser; `utils/matcher.ts`: compiling lists and weighing a result; `utils/personal.ts`: line-level edits to the personal list
- `utils/storage.ts`, `utils/ruleset.ts`, `utils/subscriptions.ts`: storage items, loading everything into one rule set, downloading lists
- `lists/`: the bundled lists and `directory.json` (the "More lists" directory). `docs/list-format.md` is the format reference.
- `public/`: the logo (`anubis.svg`) and toolbar icons (`icon/{16,32,48,96,128}.png`). WXT detects these automatically.

## Conventions

- Keep the brand colours: background `#1b1a16`, gold `#d4a637`.
- Design follows `.claude/skills/frontend-design`: on search pages stay quiet (the page's font, muted text, no fills); the weigh menu's cartouche and balance are the one flourish. Sentence case, no ALL-CAPS labels, no "·"-joined meta strings.
- Ask for as few permissions as possible. Only add a permission the feature actually needs.
- Verify changes by type-checking, `npm test`, building both browsers, and loading the extension. Search pages can only be checked for real in a browser; `npm run e2e` covers the logic against mocks.

## Roadmap ideas

- Check the unverified engines and Weigh deeper selectors listed in `docs/experiments.md` against live pages
- Image, video and news results (uBlacklist's SERPINFO has the selectors)
- Fetch engine definitions from the repo, like uBlacklist's SERPINFO, so a selector fix doesn't need a store release
- Import from uBlacklist and HOHSER backups
