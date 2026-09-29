# Working safely in Anubis

Before changing code, read the relevant section of [`DEVELOPMENT.md`](DEVELOPMENT.md), [`STYLEGUIDE.md`](STYLEGUIDE.md) for interface work, and [`docs/experiments.md`](docs/experiments.md) before revisiting a past decision. These files describe behavior that is easy to mistake for accidental complexity.

## Protect working behavior

- Start by checking the branch, worktree, and recent upstream changes. Treat the repository as shared: never discard changes you did not make, overwrite another agent's branch, or force-push.
- Reproduce a reported bug before fixing it. Add a regression check that fails on the old behavior, then make the smallest change that passes it.
- A refactor must preserve observable behavior. Keep existing tests and add coverage for any contract the change touches; do not delete a test just to make a change pass.
- Treat stored keys and formats, list and backup compatibility, the Firefox add-on ID, permissions, public page paths, message shapes, and browser-specific behavior as compatibility contracts. A change needs an explicit migration or compatibility plan and tests.
- Search-engine markup is unstable. Model a broken layout in `e2e/fixtures.mjs`, assert the behavior in `e2e/run.mjs`, and record what was confirmed on a real page separately. A passing mock is not proof of live compatibility.
- Test interface changes in light and dark themes and at 320px, 360px, and 390px. Keep page-level horizontal overflow at zero; if a table needs more room, confine scrolling to that table.
- Keep DOM text as text nodes; do not use `innerHTML`. Keep permissions minimal and explain any new permission in the user-facing privacy and store documentation.
- Keep documentation in step with the code: when changing or overhauling a feature, component, data flow, or user-visible behaviour, update every relevant user guide, developer reference, and privacy/store/platform note. Record experiments and rejected approaches in `docs/experiments.md`.
- Explain each thing in one place and link to it. User-facing detail belongs in the wiki (`docs/`); the README only summarises and links there. Its feature list and the Features of `docs/guide/introduction.md` must match (`tests/readme.test.ts`), so change them together.
- Keep generated documentation screenshots in step with the interface. If a UI change affects what a screenshot shows, run `node e2e/run.mjs docs`, review the light and dark outputs, and commit the affected images with the text/captions that describe them. Don't commit unrelated regenerated images.
- Never add local agent notes (for example, `CLAUDE.local.md`) to version control or store source archives.

## Before handing off

Run commands through `nix develop`. At minimum, run `npm run compile`, `npm test`, both browser builds, and `npx web-ext lint -s .output/firefox-mv2`. For UI changes run `node e2e/run.mjs responsive`; CI runs this network-free check for every pull request. For search-page changes run the relevant e2e part, and the full suite when practical. Build the docs after changing docs.

Store releases must use the exact `package.json` version, a tag on `main`, the matching Chrome MV3 or Firefox MV2 package, and the protected `release` environment. Never expose store credentials in a pull-request workflow.
