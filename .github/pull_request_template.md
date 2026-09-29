<!-- What does this change, and why? Link the issue if there is one. -->

## Checks

- [ ] `npm run compile` and `npm test` pass
- [ ] Both builds succeed, and `npx web-ext lint -s .output/firefox-mv2` shows no warnings
- [ ] A change on search pages has a mock in `e2e/fixtures.mjs` that fails without it
- [ ] A change to the interface follows `STYLEGUIDE.md`, in light and dark and at phone width
- [ ] A change to the interface passes `node e2e/run.mjs responsive` (320px, 360px, and 390px)
- [ ] A change to the interface works from the keyboard and makes sense to a screen reader (`ACCESSIBILITY.md`)
- [ ] Existing storage formats, extension identity, permissions, public URLs, and browser behavior are preserved or have a tested migration
- [ ] Relevant user and developer documentation (including privacy, store, or platform notes when affected) matches code behaviour and architectural changes
- [ ] `docs/experiments.md` records what was tried; affected generated documentation screenshots have been regenerated in light and dark, and their captions/text match
- [ ] Nothing personal, and no page captured from a live search, is committed

See [CONTRIBUTING.md](https://github.com/Bishop-V/anubis/blob/main/CONTRIBUTING.md) for the details.
