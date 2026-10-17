<!-- What does this change, and why? Link the issue if there is one. -->

## Checks

- [ ] `npm run compile`, `npm test`, both builds, and `web-ext lint` pass
- [ ] Search-page changes have a mock in `e2e/fixtures.mjs` that fails without them
- [ ] Interface changes follow `STYLEGUIDE.md` and `ACCESSIBILITY.md`, and pass `node e2e/run.mjs responsive`
- [ ] Storage, permissions, extension identity, and public URLs still work, or have a tested migration
- [ ] Docs match the change, and `docs/experiments.md` records what was tried
- [ ] Nothing personal or captured from a live search is committed

See [CONTRIBUTING.md](https://github.com/Bishop-V/anubis/blob/main/CONTRIBUTING.md).
