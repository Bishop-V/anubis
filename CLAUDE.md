# Anubis

A Chrome/Firefox extension that weighs search results: it tags them, reranks them, and hides unwanted sites, using your own choices plus subscribable lists (Anubis lists, Brave Goggles, uBlacklist rulesets). The mascot is Anubis, who weighed hearts against a feather: sites "fail the weighing" and get hidden.

Record what was tried and what failed, not just what shipped, in `docs/experiments.md`: a short index of topic files in `docs/experiments/`. Never read them whole. Find the section you need with `grep -rn "<heading or keyword>" docs/experiments/`, read only that, and add new notes at the top of the matching section.

## Dev environment

- Locally the toolchain comes from the Nix flake: run tools through `nix develop`, and never suggest global installs.
- Cloud sessions have no Nix. Node 22 is installed; run `npm ci` once, then the npm scripts directly. Search engines are unreachable from the cloud.
- Before editing, follow [`AGENTS.md`](AGENTS.md): reproduce existing behaviour before changing it, preserve documented compatibility contracts, and add a regression check for fixes.

## Stack

- [WXT](https://wxt.dev) 0.21 with Vite and TypeScript, building Chrome MV3 and Firefox MV2 from one codebase. No UI framework: all DOM is built with `h()` from `utils/dom.ts`, and text from lists always goes in as text nodes.
- Interface text lives in `public/_locales/en/messages.json`, used through `t()`, `tn()`, `tJoin()` and `localizePage()` from `utils/i18n.ts`. Put new text there, not in code.
- Storage uses WXT's `storage` (`#imports`); the keys are in `DEVELOPMENT.md`, "Where things are stored".

## Commands

Firefox is the default target; `:chrome` variants override it.

- `npm run compile`: type-check. Run it after every change.
- `npm test`: Vitest unit tests in `tests/`.
- `npm run build` / `npm run build:chrome`; `npm run dev` / `npm run dev:chrome` open a browser with the extension.
- `npm run e2e`, or `node e2e/run.mjs <part>` after `build:chrome`: checks against mock search pages (`e2e/fixtures.mjs`). `checks` and `responsive` are the parts CI runs.
- `npx web-ext lint -s .output/firefox-mv2`: keep it at zero warnings.
- `npm run docs:build`: the documentation site; fails on a broken link. `node e2e/run.mjs docs` redraws its screenshots; commit only the ones a change affects.
- `npm run release:prep -- <version>`: the checks before a release.
- CI (`.github/workflows/ci.yml`) runs compile, tests, both builds, the `responsive` and `checks` e2e parts, and the lint. `main` is protected: changes land through a pull request.

## Where to read more

Read these only when the task touches them, and only the relevant section:

- `DEVELOPMENT.md`: the file layout, how it works, recipes for common changes, testing, checking live pages, releasing, and **Pitfalls** (read before changing search-page code, messaging, permissions, or the e2e harness).
- `STYLEGUIDE.md`: the palette, type scale, controls, and wording. `ACCESSIBILITY.md`: screen readers and the keyboard.
- `CONTRIBUTING.md` and `.github/pull_request_template.md`: how changes are proposed. Keep them, `DEVELOPMENT.md`, `STYLEGUIDE.md`, and `ACCESSIBILITY.md` in step with this file.
- `store/README.md`: listings, privacy answers, and release steps. `ROADMAP.md`: planned work; move an item into `docs/experiments/` once it's tried.

## Conventions

- Use `STYLEGUIDE.md`'s tokens, sizes, and controls; don't add a colour, size, or radius without adding it there. Brand colours: background `#1b1a16`, gold `#d4a637`. Red (`--danger`) is only for errors and actions that delete something, never for a ranking or a state: a chosen Hide is grey (`tests/palette.test.ts` checks).
- Design follows `.claude/skills/frontend-design`: on search pages stay quiet (the page's font, muted text, no fills); the result menu's cartouche and balance are the one flourish. Sentence case, no ALL-CAPS labels, no "·"-joined meta strings.
- Write whole sentences in British spelling, with the serial comma in lists of three or more ("a, b, and c"); when a sentence needs a second "and", start another.
- Wording follows `.claude/skills/ux-heuristics`: labels say what happens in plain words. The Anubis motif stays in the logo and the menu's balance, never in a function's name. One word per concept: a site's *ranking* is Hide, Lower, Normal, Raise, or Pin. Icons only where universally understood (`ICON_GEAR`, ×), and every icon-only button gets an `aria-label` and a tooltip.
- Nothing is hidden or removed without a trace: the summary says what Anubis did, and "Show hidden" undoes it for the page.
- Ask for as few permissions as possible.
- Docs are for people who use the extension, in the interface's plain words. When a feature changes, update every relevant guide and reference, and `README.md` together with `docs/guide/introduction.md`'s Features (`tests/readme.test.ts`). Keep docs page paths and headings stable: settings link to them.
- Search pages can only be checked for real in a browser; `npm run e2e` covers the logic against mocks.

## Working agreements

- Branches: name each after its change, `<kind>/<what-it-does>` in lower case with hyphens (`fix/shared-host-sites`, `lists/devdocs`, `docs/branch-naming`), like the workflows' `sources/update` and `engines/serpinfo`. Use one even when a session starts on a generated name. One branch per pull request; after a merge, start the next from `main`.
- Commit messages: the message text only — no trailers, no co-author or AI attribution. Keep them short and general unless detail is asked for.
- Keep replies short. Explain browser-extension concepts (manifest keys, permissions, content versus background scripts, MV2 versus MV3) briefly the first time they come up.
- Committed files stay neutral and project-scoped: no personal or identifying details.
