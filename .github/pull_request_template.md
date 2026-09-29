<!-- What does this change, and why? Link the issue if there is one. -->

## Checks

- [ ] `npm run compile` and `npm test` pass
- [ ] Both builds succeed, and `npx web-ext lint -s .output/firefox-mv2` shows no warnings
- [ ] A change on search pages has a mock in `e2e/fixtures.mjs` that fails without it
- [ ] A change to the interface follows `STYLEGUIDE.md`, in light and dark and at phone width
- [ ] A change to the interface works from the keyboard and makes sense to a screen reader (`ACCESSIBILITY.md`)
- [ ] `docs/experiments.md` notes what was tried, and `docs/guide/` and its screenshots match the change
- [ ] Nothing personal, and no page captured from a live search, is committed

See [CONTRIBUTING.md](https://github.com/Bishop-V/anubis/blob/main/CONTRIBUTING.md) for the details.
