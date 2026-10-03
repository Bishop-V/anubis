# anubis
Browser extension for filtering search results, and much more.

In Egyptian myth, Anubis weighed each heart against a feather. This extension weighs search results: it tags them, raises the ones you trust, lowers or hides the ones you don't, and lets you subscribe to lists other people publish, the way Brave Goggles do, but on the search engine you already use.

**[Read the wiki →](https://bishop-v.github.io/anubis/)**

<!-- Keep this README short: the wiki (docs/) explains how Anubis works, and this page points to it. Each feature below is one line that links to its wiki page, the same pages the wiki's introduction lists under Features; tests/readme.test.ts checks that the two lists match and that every link works. -->

## What it does

- **[Rank any site from the results](https://bishop-v.github.io/anubis/guide/ranking)**: hide, lower, raise, or pin a site from the ⚖ button on any result.
- **[Tags](https://bishop-v.github.io/anubis/guide/tags)**: labels like "Official docs", "Paywalled", "FOSS", or "AI slop" under each title, which can highlight, raise, lower, or hide results.
- **[Lists anyone can publish](https://bishop-v.github.io/anubis/guide/lists)**: subscribe to Anubis lists, Brave Goggles, uBlacklist rulesets, and plain domain lists, or [publish your own](https://bishop-v.github.io/anubis/guide/publish-a-list).
- **[Remove panels](https://bishop-v.github.io/anubis/guide/clean-up)**: take AI answers, video panels, "People also ask", and more off search pages.
- **[More than one page of results](https://bishop-v.github.io/anubis/guide/more-results)**: bring later pages onto the first and rank them together.
- **[Sync](https://bishop-v.github.io/anubis/guide/sync)**: your sites and settings follow you through your browser's own sync, and between Firefox and Chrome through a WebDAV server.
- **[Bring your old lists](https://bishop-v.github.io/anubis/guide/import-and-backup)**: move your sites over from uBlacklist, HOHSER, or a Brave Goggle.
- **Easy to undo**: a one-line summary above the results says what Anubis changed, and "Show hidden" brings it back.

It works on Google, DuckDuckGo, Bing, and [more search engines](https://bishop-v.github.io/anubis/guide/search-engines). It has no server and collects nothing; [Privacy and permissions](https://bishop-v.github.io/anubis/guide/privacy) says what it stores, what it connects to, and why it asks for each permission.

## Install

**[Install Anubis for Firefox from Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/).** The next tagged [GitHub Release](https://github.com/Bishop-V/anubis/releases) will include a [direct Firefox build download](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-firefox.zip), as well as versioned packages. [Getting started](https://bishop-v.github.io/anubis/guide/getting-started) explains how to build and load it in other browsers.

## Develop

On Linux, `nix develop` gives you the pinned toolchain. Otherwise, install Node.js 22.12 or newer and run `npm install`. Then:

```sh
npm run dev          # opens Firefox with the extension loaded, reloading on save
npm run dev:chrome   # the same in Chrome
```

- [Developing Anubis](DEVELOPMENT.md): every command, how the extension is put together, recipes for common changes, testing, and releasing.
- [Contributing](CONTRIBUTING.md): ways to help, the project's conventions, and how pull requests are merged.
- [Agent instructions](AGENTS.md): compatibility contracts, regression checks, and safe working practices.
- [Style guide](STYLEGUIDE.md) and [accessibility](ACCESSIBILITY.md): how the interface looks, and how it works with a screen reader and the keyboard.
- [Experiments and decisions](docs/experiments.md): what was tried, what failed, and what still needs checking on live pages.
- [Roadmap](ROADMAP.md): planned work.
- [Lists](lists/README.md): the lists that ship with Anubis, and how to contribute one.
- [Publishing](store/README.md) and the [platform watch](docs/platform-watch.md): store listings, release steps, and browser deadlines.
- [Security](SECURITY.md): how to report a vulnerability privately.

The wiki is built from [`docs/`](docs); `npm run docs:dev` previews it.

## How it's made

Anubis is almost entirely written by AI. Nearly all of its code, tests, and documentation were written by AI coding assistants (mostly [Claude Code](https://claude.ai/code)), directed, reviewed, and tried out on real search pages by the maintainer. The instructions they work from are in [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md), and what was tried and what failed is in [`docs/experiments.md`](docs/experiments.md). Every change goes through the same checks before it lands: type-checking, unit tests, the end-to-end run against mock search pages, and the Firefox add-on linter.

## Inspirations

**[uBlacklist](https://github.com/iorate/ublacklist)** is the closest existing project and the main influence. The interaction model comes from it: a block icon on each search result, so you curate the list while searching instead of opening settings. Anubis follows the same idea of hiding blocked results in place, with a summary of what was hidden. Anubis also reads uBlacklist rulesets, so its subscriptions work here.

uBlacklist was also the reference for how search engines are matched. It no longer hardcodes per-engine selectors — those moved to a declarative ruleset in [ublacklist/builtin](https://github.com/ublacklist/builtin) (`serpinfo/google.yml`, `serpinfo/duckduckgo.yml`), which is updated as the engines change their markup. Reading it made the underlying problem clear: Google's class names (`.vt6azd`, `.MjjYud`, `.yuRUbf`) rotate without warning, so anything matching on them breaks quietly.

Anubis takes a different approach because of that. Rather than tracking class names, it finds results *structurally*: locate the title heading, take the link around it, then walk up to the smallest ancestor still holding a single result. That survives a layout change without an update, at the cost of being less precise than a curated ruleset. The uBlacklist rulesets remain the reference to check against when something does break, and they supply the selectors for engines whose titles aren't headings (Brave, Kagi, Startpage…).

**[Brave Search Goggles](https://github.com/brave/goggles-quickstart)** are the model for lists: plain text files hosted on GitHub or GitLab that anyone can publish, with instructions to boost, downrank, or discard results. The Anubis list format is the Goggles syntax plus tags, and any public Goggle can be subscribed to as-is. Goggles rerank inside Brave's own index; Anubis reranks what your engine returns, which is why Load more results exists.

**[Kagi](https://help.kagi.com/kagi/features/website-info-personalized-results.html)** personalised results gave the five rankings (hide, lower, normal, raise, pin) chosen from a menu on each result.

**[HOHSER](https://github.com/pistom/hohser)** (Highlight or Hide Search Engine Results) showed the value of highlighting as well as hiding, and of letting people choose how hidden results look.

Other influences:

- **[Firefox's `web-ext`](https://github.com/mozilla/web-ext)** does the development loading, via [WXT](https://wxt.dev), which builds Chrome MV3 and Firefox MV2 from one codebase.
- The name and framing come from the Egyptian myth in which Anubis weighs a heart against a feather: sites that fail the weighing are hidden. The menu on each result shows the site's name in a cartouche over a small balance. The motif stays in the look; buttons say plainly what they do.

## License

Anubis is released under the [GNU Affero General Public License v3.0](LICENSE) or any later version. The bundled lists in [`lists/`](lists) are CC0.

The extension includes third-party code under its own licenses (WXT's runtime and the Lucide settings icon); their notices are in [`public/THIRD_PARTY_NOTICES.txt`](public/THIRD_PARTY_NOTICES.txt), which ships inside every build. The Claude skills in [`.claude/skills/`](.claude/skills) keep their upstream licenses (Apache-2.0 for `frontend-design`, MIT for `ux-heuristics`) and aren't part of the extension.
