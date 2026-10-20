# Contributing to Anubis

Issues for reports and ideas, pull requests for changes.

## Ways to help

- **Suggest a site for a list:** **Suggest changes** in **Settings → Lists**, the [issue template](https://github.com/Bishop-V/anubis/issues/new?template=suggest-a-site.md), or a pull request to [`lists/`](lists). Lists in [`lists/sources/`](lists/sources) are rebuilt weekly, so change their source project instead.
- **Add your list to the directory:** see [Publish a list](docs/guide/publish-a-list.md).
- **Report a broken engine:** the engine's domain (`google.de`), a search, a screenshot, and for panels the snippet from [Troubleshooting](docs/guide/troubleshooting.md). Never attach a saved search page.
- **Report a security problem** privately: see [SECURITY.md](SECURITY.md).
- **Fix a bug or build a feature:** open an issue first for anything big. See [`ROADMAP.md`](ROADMAP.md).
- **Improve the wiki** in [`docs/`](docs). Keep its pages short: what a feature does and where to find it.
- **Translate:** the non-English languages are unchecked machine translations. See [Help translate](https://bishop-v.github.io/anubis/guide/translate).

## Getting set up

Run `nix develop`, or install Node.js 22.12+ and run `npm install`. Then `npm run dev` (Firefox) or `npm run dev:chrome`. [DEVELOPMENT.md](DEVELOPMENT.md#commands) has the other commands, and [Getting started](docs/guide/getting-started.md#other-browsers) how to load a build by hand.

## Making a change

One topic per pull request.

- **Protect working behaviour:** follow [`AGENTS.md`](AGENTS.md). Reproduce a bug and add a regression check before fixing it.
- **Interface:** DOM built with `h()` from `utils/dom.ts`, never `innerHTML`. Text goes in `public/_locales/en/messages.json`, used through `utils/i18n.ts`.
- **Look and access:** follow [`STYLEGUIDE.md`](STYLEGUIDE.md) and [`ACCESSIBILITY.md`](ACCESSIBILITY.md). Red is only for errors and deleting.
- **Wording:** short, plain labels. A site's ranking is Hide, Lower, Normal, Raise, or Pin. British spelling, with the serial comma.
- **Nothing hidden without a trace:** the summary says what changed, and "Show hidden" undoes it.
- **Permissions:** as few as possible.
- **Search pages:** find things by structure, not class names. Add a failing mock to `e2e/fixtures.mjs` for engine fixes. New engines go in `.github/engine-watch.json`.
- **Docs:** update the wiki and references with the code, and keep the README's features in step with the wiki introduction (`npm test` checks). Record what you tried in [`docs/experiments.md`](docs/experiments.md).
- **Screenshots:** if your change shows in one, run `node e2e/run.mjs docs` and commit only the affected images.
- **Nothing personal** in committed files.

## Checks

```sh
npm run compile                         # type-check
npm test                                # unit tests
npm run build && npm run build:chrome   # both browsers
npx web-ext lint -s .output/firefox-mv2 # zero warnings
typos                                   # spelling
```

Also run `npm run docs:build` for docs changes, `node e2e/run.mjs responsive` for interface changes, and `npm run e2e` for search-page changes. Read [`docs/platform-watch.md`](docs/platform-watch.md) before changing browser APIs, manifests, or storage.

## Pull requests and merging

- `main` only changes through pull requests, and CI's `check` job must pass.
- A maintainer merges with a merge commit. To resolve a conflict, merge `main` in rather than rebasing.
- **Branches:** `<kind>/<what-it-does>`, like `fix/shared-host-sites` or `docs/branch-naming`.
- **Commits:** a short line saying what the change does, and a body only when the reason isn't obvious.
- Maintainers tag releases (see [Releasing](DEVELOPMENT.md#releasing)).

## Security

Report vulnerabilities through **Report a vulnerability** on the Security tab, not in an issue.

## Licence

Contributions are licensed like the project: [GNU AGPL v3.0 or later](LICENSE), and CC0 for `lists/`. Add the notice for any third-party code to [`public/THIRD_PARTY_NOTICES.txt`](public/THIRD_PARTY_NOTICES.txt).
