# anubis
Browser extension for filtering search results, and much more.

In Egyptian myth, Anubis weighed each heart against a feather. This extension weighs search results: it tags them, raises the ones you trust, lowers or hides the ones you don't, and lets you subscribe to lists other people publish, the way Brave Goggles do, but on the search engine you already use.

**[Read the user guide →](https://bishop-v.github.io/anubis/)**

## What it does

- **Rank any site from the results.** Hover a result and press its ⇅ button to hide, lower, raise or pin that site, and to tag it. Your choices apply on every search and beat every list.
- **Tags.** Results carry small labels ("Official docs", "Discussion", "Paywall"…) from your own tags and from lists you subscribe to. For each tag you decide what it does: just show it, highlight results, or raise, lower or hide them.
- **Reranking.** Raised, lowered and pinned sites move up or down the page. **Load more results** brings the next pages of results onto the first one and reranks them together, so a pinned site on page 3 rises to the top.
- **Lists anyone can publish.** A list is a text file on GitHub, GitLab, Codeberg or a gist; there is no server. Anubis reads its own list format, Brave Goggles, uBlacklist rulesets and plain domain lists, so existing community lists work unchanged. Subscribe links (on the [lists directory](https://bishop-v.github.io/anubis/lists), or any list's own page) open Anubis with the list filled in. The menu on each result can open a pre-filled issue to suggest a site to a list.
- **Your list is a list too.** Every site you rank is stored in the same format, so you can download it and publish it for others.
- **Bring your old lists.** Paste uBlacklist rules, a HOHSER export or a Goggle into Settings → Share and back up to move your sites over.
- **Filter by tag.** The summary above the results lists the tags on the page; click one to see only those results.
- **Clean up pages.** Remove AI answers (Google's AI Overview, Brave's AI answers, and DuckDuckGo's Search Assist and Duck.ai by opening its no-AI version), video panels, "People also ask", top stories, image rows and related searches, on every search (Bing's AI answer and video panel aren't recognised yet). Google can also always open its plain Web tab. "Show hidden" brings removed parts back on that page.
- **Quiet on the page.** Hidden results leave the page (or collapse to one line, if you prefer); the summary above the results is one sentence. Light and dark themes follow the search engine or your choice.
- **Keyboard shortcuts.** Alt+Shift+O turns Anubis on or off, and Alt+Shift+H shows hidden results (Control instead of Alt on a Mac).

Works on Google (every country domain), DuckDuckGo (including the HTML and Lite versions), Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, Yandex and Mojeek.

It asks for the `storage` and `activeTab` permissions (the second lets the toolbar popup read the address of the tab you're on, only when you open it) and runs on search result pages, plus the user guide's subscribe page so subscribe links work. Lists hosted on GitHub download without any extra permission; lists hosted elsewhere ask for access to that one host when you subscribe. Nothing is sent anywhere else.

## Setup

You need **Node.js 20 or newer** — install the LTS from [nodejs.org](https://nodejs.org) if you don't have it.

```sh
npm install          # installs WXT and sets up TypeScript types
npm run dev          # opens Firefox with the extension loaded, reloading on save
npm run dev:chrome   # same, in Chrome
```

Firefox is the default target; every `:chrome` variant overrides it.

### Building and testing

```sh
npm run compile      # type-check; run it after every change
npm test             # unit tests in tests/
npm run build        # production build into .output/firefox-mv2
npm run build:chrome # production build into .output/chrome-mv3
```

`npm run e2e` loads the Chrome build into Chromium against mock result pages and saves screenshots to `e2e/shots/`. Set `CHROMIUM_PATH` to a Chromium binary first. `node e2e/run.mjs subscribe` also downloads a real list from GitHub; behind a TLS-intercepting proxy, point `PROXY_CA_CERT` at its CA.

### Loading it by hand

If the dev browser doesn't open on its own, build and load the extension yourself:

- **Firefox:** `about:debugging` → This Firefox → Load Temporary Add-on → pick `.output/firefox-mv2/manifest.json`. Temporary add-ons are removed when Firefox closes.
- **Chrome:** `chrome://extensions` with Developer mode on → Load unpacked → pick `.output/chrome-mv3`.

### With Nix

`flake.nix` pins the whole toolchain. `nix develop` in this folder gives you Node and runs `npm install` on first entry; run the commands above inside that shell rather than installing anything globally. For one-offs, `nix develop -c npm test`.

### Building the store release

These are the steps the release uses, and the ones for rebuilding the Firefox add-on from its source zip. Use **Node.js 22** and npm on Linux or macOS:

```sh
npm ci               # installs the exact versions in package-lock.json
npm run zip          # .output/anubis-<version>-firefox.zip and -sources.zip
npm run zip:chrome   # .output/anubis-<version>-chrome.zip, also used for Edge
```

The extension itself is in `.output/firefox-mv2/` (and `.output/chrome-mv3/`) after the zips are made.

To publish a version, set `version` in `package.json`, merge it, then push a matching tag (`git tag v0.3.0 && git push origin v0.3.0`). `.github/workflows/release.yml` checks the tag against `package.json`, runs CI, builds the zips, creates a GitHub Release and, once approved in the `release` environment, submits to the Chrome Web Store, Firefox Add-ons and Edge Add-ons.

### Before opening a pull request

[CONTRIBUTING.md](CONTRIBUTING.md) covers how to contribute and how changes are merged. In short: `npm run compile` and `npm test` should pass, both builds should succeed, and `npx web-ext lint -s .output/firefox-mv2` should be at zero warnings (CI treats warnings as errors). Changes reach `main` only through pull requests, once CI's `check` job has passed.

### Worth knowing

- **Search pages can only be verified for real in a browser.** The unit tests and `npm run e2e` cover the logic against mock pages; neither proves a live engine still works.
- **Engines break when they change their markup.** `utils/engines.ts` holds the definitions. When one stops working, diff it against [ublacklist/builtin](https://github.com/ublacklist/builtin) (`serpinfo/*.yml`), which tracks these layouts continuously.
- **`utils/engines.ts` is imported at build time** to generate the manifest's `matches`, so it must stay free of browser APIs.
- **The Firefox extension ID lives in `wxt.config.ts`** and has to stay put. It is the add-on's permanent identity, so changing it makes an existing install read as a different extension and orphans its stored settings.
- **Keep permissions minimal.** Only add one a feature actually needs; hosts for non-GitHub lists are requested at subscribe time, not up front.

## Documentation

The user guide is at **[bishop-v.github.io/anubis](https://bishop-v.github.io/anubis/)**, built from [`docs/`](docs) (start with [the introduction](docs/guide/introduction.md)). `npm run docs:dev` previews it locally.

- [The list format](docs/list-format.md): how to write and publish a list.
- [Lists](lists/README.md): the lists that ship with Anubis and how to contribute one.
- [Experiments and decisions](docs/experiments.md): what was tried, what failed, and what still needs checking on live pages.
- [Roadmap](ROADMAP.md): planned work.
- [Publishing](store/README.md): store listings, privacy answers and release steps.

## Inspirations

**[uBlacklist](https://github.com/iorate/ublacklist)** is the closest existing project and the main influence. The interaction model comes from it: a block icon on each search result, so you curate the list while searching instead of opening settings. Anubis follows the same idea of hiding blocked results in place, with a summary of what was hidden. Anubis also reads uBlacklist rulesets, so its subscriptions work here.

uBlacklist was also the reference for how search engines are matched. It no longer hardcodes per-engine selectors — those moved to a declarative ruleset in [ublacklist/builtin](https://github.com/ublacklist/builtin) (`serpinfo/google.yml`, `serpinfo/duckduckgo.yml`), which is updated as the engines change their markup. Reading it made the underlying problem clear: Google's class names (`.vt6azd`, `.MjjYud`, `.yuRUbf`) rotate without warning, so anything matching on them breaks quietly.

Anubis takes a different approach because of that. Rather than tracking class names, it finds results *structurally*: locate the title heading, take the link around it, then walk up to the smallest ancestor still holding a single result. That survives a layout change without an update, at the cost of being less precise than a curated ruleset. The uBlacklist rulesets remain the reference to check against when something does break, and they supply the selectors for engines whose titles aren't headings (Brave, Kagi, Startpage…).

**[Brave Search Goggles](https://github.com/brave/goggles-quickstart)** are the model for lists: plain text files hosted on GitHub or GitLab that anyone can publish, with instructions to boost, downrank or discard results. The Anubis list format is the Goggles syntax plus tags, and any public Goggle can be subscribed to as-is. Goggles rerank inside Brave's own index; Anubis reranks what your engine returns, which is why Load more results exists.

**[Kagi](https://help.kagi.com/kagi/features/website-info-personalized-results.html)** personalised results gave the five rankings (hide, lower, normal, raise, pin) chosen from a menu on each result.

**[HOHSER](https://github.com/pistom/hohser)** (Highlight or Hide Search Engine Results) showed the value of highlighting as well as hiding, and of letting people choose how hidden results look.

Other influences:

- **[Firefox's `web-ext`](https://github.com/mozilla/web-ext)** does the development loading, via [WXT](https://wxt.dev), which builds Chrome MV3 and Firefox MV2 from one codebase.
- The name and framing come from the Egyptian myth in which Anubis weighs a heart against a feather: sites that fail the weighing are hidden. The menu on each result shows the site's name in a cartouche over a small balance. The motif stays in the look; buttons say plainly what they do.

## License

Anubis is released under the [GNU Affero General Public License v3.0](LICENSE) or any later version. The bundled lists in [`lists/`](lists) are CC0.

The extension includes third-party code under its own licenses (WXT's runtime and the Lucide settings icon); their notices are in [`public/THIRD_PARTY_NOTICES.txt`](public/THIRD_PARTY_NOTICES.txt), which ships inside every build. The Claude skills in [`.claude/skills/`](.claude/skills) keep their upstream licenses (Apache-2.0 for `frontend-design`, MIT for `ux-heuristics`) and aren't part of the extension.
