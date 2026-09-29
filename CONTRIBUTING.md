# Contributing to Anubis

Thanks for helping. Everything happens on GitHub: issues for reports and ideas, pull requests for changes.

## Ways to help

- **Suggest a site for one of the built-in lists.** Use "Suggest it to…" in the ⇅ menu on a search result, which opens a pre-filled issue, or the [Suggest a site for a list](https://github.com/Bishop-V/anubis/issues/new?template=suggest-a-site.md) template. You can also open a pull request that edits the list in [`lists/`](lists).
- **Add your own list to the directory**, so everyone sees it under Settings → Lists → More lists. See [Publish a list](docs/guide/publish-a-list.md) and [`lists/README.md`](lists/README.md).
- **Report a search engine that broke.** Name the engine and its country domain (`google.de`), give a search that shows the problem, and add a screenshot. For panels that don't go away, add the output of the snippet in [Troubleshooting](docs/guide/troubleshooting.md), which copies the page's structure without its text. Never attach a saved search page: it holds your account, your location and more.
- **Report a security problem** privately, not in an issue. [SECURITY.md](SECURITY.md) says how.
- **Fix a bug or build a feature.** For anything bigger than a small fix, open an issue first so the approach can be agreed before you spend time on it. [`ROADMAP.md`](ROADMAP.md) lists planned work.
- **Improve the user guide** in [`docs/`](docs), which is published at [bishop-v.github.io/anubis](https://bishop-v.github.io/anubis/).
- **Translate.** Not open yet; the Translation section of [`ROADMAP.md`](ROADMAP.md) says what's left before it is.

## Getting set up

You need Node.js 20 or newer, or run `nix develop` for the pinned toolchain. Then:

```sh
npm install
npm run dev          # opens Firefox with the extension loaded, reloading on save
npm run dev:chrome   # the same in Chrome
```

The [README](README.md#setup) has the rest, including loading a build by hand.

## Making a change

Keep each pull request to one topic. The project's conventions, briefly:

- **Interface.** The popup, settings, welcome page and in-page UI are plain DOM built with `h()` from `utils/dom.ts`. Text from lists always goes in as text nodes, never markup, and nothing uses `innerHTML`. Interface text goes in `public/_locales/en/messages.json` and is used through `t()`, `tn()` (counts) and `localizePage()` (static HTML) from `utils/i18n.ts`.
- **Look.** [`STYLEGUIDE.md`](STYLEGUIDE.md) has the palette, type sizes, controls and layouts. Use what's there rather than a new colour, size or radius.
- **Access.** [`ACCESSIBILITY.md`](ACCESSIBILITY.md) has what to keep in mind for screen readers and the keyboard, on Anubis's own pages and on search pages.
- **Wording.** Labels say what happens in plain words ("Load more results", "Hide, rank or tag this site"). A site's *ranking* is Hide, Lower, Normal, Raise or Pin, and the same word means the same thing everywhere. Use an icon only where everyone knows it (a cog for settings, × to close), and give every icon-only button a label and a tooltip.
- **Nothing hidden without a trace.** The summary above the results says what Anubis changed, and "Show hidden" undoes it for the page.
- **Permissions.** Ask for as few as possible, and only the ones a feature actually needs.
- **Search pages.** Engines change their markup without notice, so find things by structure (headings, links, nesting) rather than class names. For a fix to an engine, add the layout that broke as a variant of that engine's mock page in `e2e/fixtures.mjs`, with a check in `e2e/run.mjs`, and confirm the check fails without your change.
- **Record what you tried** in [`docs/experiments.md`](docs/experiments.md), including what didn't work.
- **Update the guide** in `docs/guide/` when behaviour changes. Keep page paths as they are: the extension links to them.
- **Keep committed files neutral.** No captured search pages, and nothing personal: names, emails, locations or machine details.

[`DEVELOPMENT.md`](DEVELOPMENT.md) explains how the code fits together, has step-by-step recipes for the usual changes (an engine, a clean-up panel, a setting, interface text) and lists the mistakes that have already been made once.

## Checks

Run these before opening a pull request:

```sh
npm run compile                         # type-check
npm test                                # unit tests
npm run build && npm run build:chrome   # both browsers
npx web-ext lint -s .output/firefox-mv2 # must show zero warnings
```

If you changed `docs/`, also run `npm run docs:build`, which fails on a broken link. If you changed something the guide's screenshots show, redraw them with `node e2e/run.mjs docs` (it makes light and dark versions) and commit only the ones your change affects. If you changed anything on search pages and have Chromium, run `npm run e2e` with `CHROMIUM_PATH` set; it needs no network.

## Pull requests and merging

- **Changes reach `main` only through pull requests.** Direct pushes and force-pushes to `main` are refused, and the branch can't be deleted.
- **CI must pass.** The `check` job (type-check, tests, both builds and the add-on linter) is required before anything merges. Changes to the guide also run the Docs build.
- **Review and merge.** A maintainer reviews the pull request and merges it with a merge commit, sometimes by turning on auto-merge, which merges it as soon as `check` passes. Your branch doesn't have to be up to date with `main`. If it conflicts, merge `main` into it rather than rebasing a branch someone else may have checked out.
- **Commit messages** are a short summary line saying what the change does ("Remove whole video panels on Google"), with a body only when the reason isn't obvious from the diff.
- **Releases** are cut by the maintainers by tagging a version (see the [README](README.md#building-the-store-release)).

## Security

Please don't report a security problem in a public issue. Use **Report a vulnerability** on the repository's Security tab, which reaches the maintainers privately.

## Licence

Anubis is licensed under the [GNU AGPL v3.0 or later](LICENSE), and the lists in `lists/` under CC0. By contributing, you agree to license your contribution the same way. If you bring in code or assets from elsewhere, check their licence allows it and add their notice to [`public/THIRD_PARTY_NOTICES.txt`](public/THIRD_PARTY_NOTICES.txt).
