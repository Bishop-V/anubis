# Working safely in Anubis

Before changing code, read the relevant section of [`DEVELOPMENT.md`](DEVELOPMENT.md), [`STYLEGUIDE.md`](STYLEGUIDE.md) for interface work, and [`docs/experiments.md`](docs/experiments.md) before revisiting a past decision. These files describe behaviour that is easy to mistake for accidental complexity.

## Shared instructions and skills

This file is the shared source of project instructions for every coding agent. `CLAUDE.md` and `GEMINI.md` import it; GitHub Copilot and Cursor have automatic instruction entry points that direct them here. Agents that support `AGENTS.md` read it directly. Other tools should be configured to load this file; no file name can force an unsupported agent to read instructions.

Project skills live in [`.agents/skills/`](.agents/skills). Read the matching `SKILL.md` before using one:

- `frontend-design`: visual design and layout.
- `ux-heuristics`: wording, usability, and accessibility reviews, with references beside the skill.
- `review-<lang>`: translation review, using the language codes listed in [Development](DEVELOPMENT.md#translations).

`.claude/skills` and `.github/skills` link to the shared directory for tools that discover skills there. Keep the instructions and skills in one place rather than maintaining separate copies. Claude's permission settings remain in `.claude/settings.json` because they are specific to that tool.

## Protect working behaviour

- Start by checking the branch, worktree, and recent upstream changes. Treat the repository as shared: never discard changes you did not make, overwrite another agent's branch, or force-push.
- Reproduce a reported bug before fixing it. Add a regression check that fails on the old behaviour, then make the smallest change that passes it.
- A refactor must preserve observable behaviour. Keep existing tests and add coverage for any contract the change touches; do not delete a test just to make a change pass.
- Treat stored keys and formats, list and backup compatibility, the Firefox add-on ID, permissions, public page paths, message shapes, and browser-specific behaviour as compatibility contracts. A change needs an explicit migration or compatibility plan and tests.
- Search-engine markup is unstable. Model a broken layout in `e2e/fixtures.mjs`, assert the behaviour in `e2e/run.mjs`, and record what was confirmed on a real page separately. A passing mock is not proof of live compatibility.
- Test interface changes in light and dark themes and at 320px, 360px, and 390px. Keep page-level horizontal overflow at zero; if a table needs more room, confine scrolling to that table.
- Keep DOM text as text nodes; do not use `innerHTML`. Keep permissions minimal and explain any new permission in the user-facing privacy and store documentation.
- Keep documentation in step with the code: when changing or overhauling a feature, component, data flow, or user-visible behaviour, update every relevant user guide, developer reference, and privacy/store/platform note. Record experiments and rejected approaches in `docs/experiments.md`.
- Explain each thing in one place and link to it. User-facing detail belongs in the wiki (`docs/`), kept short; how things work goes in code comments or `DEVELOPMENT.md`. The README only summarises and links there. Its feature list and the Features of `docs/guide/introduction.md` must match (`tests/readme.test.ts`), so change them together.
- Keep generated documentation screenshots in step with the interface. If a UI change affects what a screenshot shows, run `node e2e/run.mjs docs`, review the light and dark outputs, and commit the affected images with the text/captions that describe them. Don't commit unrelated regenerated images.
- Never add local agent notes (for example, `CLAUDE.local.md`) to version control or store source archives.

## Before handing off

Run commands through `nix develop` when Nix is available. In a cloud session without Nix, run `npm ci` once and use the npm scripts directly (Node.js 22.12 or newer). At minimum, run `npm run compile`, `npm test`, both browser builds, and `npx web-ext lint -s .output/firefox-mv2`. For UI changes run `node e2e/run.mjs responsive`; CI runs this network-free check for every pull request. For search-page changes run the relevant e2e part, and the full suite when practical. Build the docs after changing docs.

Store releases must use the exact `package.json` version, a tag on `main`, the matching Chrome MV3 or Firefox MV2 package, and the protected `release` environment. Never expose store credentials in a pull-request workflow.

## Project context

A Chrome/Firefox extension that weighs search results: it tags them, reranks them, and hides unwanted sites, using your own choices plus subscribable lists (Anubis lists, Brave Goggles, uBlacklist rulesets). The mascot is Anubis, who weighed hearts against a feather: sites "fail the weighing" and get hidden.

Record what was tried and what failed, not just what shipped, in `docs/experiments.md`: a short index of topic files in `docs/experiments/`. Never read them whole. Find the section you need with `grep -rn "<heading or keyword>" docs/experiments/`, read only that, and add new notes at the top of the matching section.

## Dev environment

- Locally the toolchain comes from the Nix flake: run tools through `nix develop`, and never suggest global installs.
- In cloud sessions without Nix, use Node.js 22.12 or newer; run `npm ci` once, then the npm scripts directly. Search engines are unreachable from the cloud.

## Stack

- [WXT](https://wxt.dev) 0.21 with Vite and TypeScript, building Chrome MV3 and Firefox MV2 from one codebase. No UI framework: all DOM is built with `h()` from `utils/dom.ts`, and text from lists always goes in as text nodes.
- Interface text lives in `public/_locales/en/messages.json`, used through `t()`, `tn()`, `tJoin()` and `localizePage()` from `utils/i18n.ts`. Put new text there, not in code. Translations in `locales/` are machine made and say so in the interface and docs; changing English leaves them stale, shown in English, until retranslated (`DEVELOPMENT.md`, "Translations").
- Storage uses WXT's `storage` (`#imports`); the keys are in `DEVELOPMENT.md`, "Where things are stored".

## Commands

Firefox is the default target; `:chrome` variants override it.

- `npm run compile`: type-check. Run it after every change.
- `npm test`: Vitest unit tests in `tests/`.
- `npm run build` / `npm run build:chrome`; `npm run dev` / `npm run dev:chrome` open a browser with the extension.
- `npm run e2e`, or `node e2e/run.mjs <part>` after `build:chrome`: checks against mock search pages (`e2e/fixtures.mjs`). `checks`, `responsive`, and `axe` (axe-core over Settings, the popup, and the welcome page) are among the parts CI runs.
- `npx web-ext lint -s .output/firefox-mv2`: keep it at zero warnings.
- `typos`: the spelling check CI runs, with British spelling in prose (`typos.toml` says what is checked). Not in cloud sessions; `pip install typos` gives the same binary.
- `lychee --offline --config lychee.toml './**/*.md'`: links between the Markdown files and their #headings, which CI checks on pull requests; `docs:build` only covers the docs site. A weekly job also checks web addresses. If unavailable in a cloud session, use CI for the link check.
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

- Use `STYLEGUIDE.md`'s tokens, sizes, and controls; don't add a colour, size, or radius without adding it there. The interface and the logo are Graphite: neutral greys with no gold (the logo is `#e8e8ea` on `#1c1c1f`). Red (`--danger`) is only for errors and actions that delete something, never for a ranking or a state: a chosen Hide is grey (`tests/palette.test.ts` checks).
- Design follows `.agents/skills/frontend-design`: on search pages stay quiet (the page's font, muted text, no fills); the result menu's balance is the one flourish. Sentence case, no ALL-CAPS labels, no "·"-joined meta strings.
- Write whole sentences in British spelling, with the serial comma in lists of three or more ("a, b, and c"); when a sentence needs a second "and", start another.
- Wording follows `.agents/skills/ux-heuristics`: labels say what happens in plain words. The Anubis motif stays in the logo and the menu's balance, never in a function's name. One word per concept: a site's *ranking* is Hide, Lower, Normal, Raise, or Pin. Icons only where universally understood (`ICON_GEAR`, ×), and every icon-only button gets an `aria-label` and a tooltip.
- Nothing is hidden or removed without a trace: the summary says what Anubis did, and "Show hidden" undoes it for the page.
- Ask for as few permissions as possible.
- Docs are for people who use the extension, in the interface's plain words. Keep wiki pages short: say what a feature does and where to find it, in a few lines. How it works, edge cases, and rationale go in code comments or `DEVELOPMENT.md`. When a feature changes, update every relevant guide and reference, and `README.md` together with `docs/guide/introduction.md`'s Features (`tests/readme.test.ts`). Keep docs page paths and headings stable: settings link to them.
- Search pages can only be checked for real in a browser; `npm run e2e` covers the logic against mocks.

## Working agreements

- Branches: name each after its change, `<kind>/<what-it-does>` in lower case with hyphens (`fix/shared-host-sites`, `lists/devdocs`, `docs/branch-naming`), like the workflows' `sources/update` and `engines/serpinfo`. Use one even when a session starts on a generated name. One branch per pull request; after a merge, start the next from `main`.
- Commit messages: the message text only — no trailers, no co-author or AI attribution. Keep them short and general unless detail is asked for.
- Keep replies short. Explain browser-extension concepts (manifest keys, permissions, content versus background scripts, MV2 versus MV3) briefly the first time they come up.
- Committed files stay neutral and project-scoped: no personal or identifying details.
