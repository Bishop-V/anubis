# anubis

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Bishop-V/anubis/badge)](https://scorecard.dev/viewer/?uri=github.com/Bishop-V/anubis)

A browser extension that tags, ranks, and hides search results on the engine you already use, with lists anyone can publish.

**[Read the wiki →](https://bishop-v.github.io/anubis/)**

<!-- Keep this README short. Each feature is one line linking the same wiki page as the wiki introduction's Features; tests/readme.test.ts checks they match. -->

## What it does

- **[Rank any site from the results](https://bishop-v.github.io/anubis/guide/ranking)**: hide, lower, raise, or pin a site from any result.
- **[Tags](https://bishop-v.github.io/anubis/guide/tags)**: labels like "Official docs" or "Paywalled", which can also move or hide results.
- **[Lists anyone can publish](https://bishop-v.github.io/anubis/guide/lists)**: Anubis lists, Brave Goggles, uBlacklist rulesets, and domain lists, or [your own](https://bishop-v.github.io/anubis/guide/publish-a-list).
- **[Remove panels](https://bishop-v.github.io/anubis/guide/clean-up)**: AI answers, video panels, "People also ask", and more.
- **[More than one page of results](https://bishop-v.github.io/anubis/guide/more-results)**: later pages ranked together with the first.
- **[Sync](https://bishop-v.github.io/anubis/guide/sync)**: through your browser, or between Firefox and Chrome with WebDAV.
- **[Bring your old lists](https://bishop-v.github.io/anubis/guide/import-and-backup)**: from uBlacklist, HOHSER, or a Brave Goggle.
- **Easy to undo**: a summary says what changed, and "Show hidden" brings it back.

Works on Google, DuckDuckGo, Bing, and [more](https://bishop-v.github.io/anubis/guide/search-engines). No server, no data collected ([privacy](https://bishop-v.github.io/anubis/guide/privacy)). Languages other than English are **machine translations: use them with caution** ([help translate](https://bishop-v.github.io/anubis/guide/translate)).

## Install

- **Firefox:** [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/), or the [latest build](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-firefox.zip).
- **Chrome, Edge, and other Chromium browsers:** [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi), or the [latest build](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-chrome.zip).
- **Firefox for Android (experimental):** [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/). See [Getting started](https://bishop-v.github.io/anubis/guide/getting-started#install).

## Develop

Use `nix develop`, or Node.js 22.12+ and `npm install`. Then `npm run dev` (Firefox) or `npm run dev:chrome`.

- [Developing](DEVELOPMENT.md), [Contributing](CONTRIBUTING.md), and [agent instructions](AGENTS.md)
- [Style guide](STYLEGUIDE.md) and [accessibility](ACCESSIBILITY.md)
- [Experiments](docs/experiments.md) and [roadmap](ROADMAP.md)
- [Lists](lists/README.md), [publishing](store/README.md), [platform watch](docs/platform-watch.md), and [security](SECURITY.md)

## How it's made

Almost all of Anubis's code, tests, and docs were written by AI coding assistants (mostly [Claude Code](https://claude.ai/code)), directed and reviewed by the maintainer. Their instructions are in [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md).

## Inspirations

- **[uBlacklist](https://github.com/iorate/ublacklist):** blocking from each result, and its [engine rules](https://github.com/ublacklist/builtin). Anubis finds results by structure instead, and reads uBlacklist rulesets.
- **[Brave Search Goggles](https://github.com/brave/goggles-quickstart):** the list format, which Anubis extends with tags.
- **[Kagi](https://help.kagi.com/kagi/features/website-info-personalized-results.html):** the five rankings.
- **[HOHSER](https://github.com/pistom/hohser):** highlighting, and a choice of how hidden results look.
- **[WXT](https://wxt.dev)** builds it for Chrome and Firefox.

## License

[GNU AGPL v3.0](LICENSE) or later. The lists in [`lists/`](lists) are CC0; those in [`lists/sources/`](lists/sources) keep their sources' licences. Third-party notices are in [`public/THIRD_PARTY_NOTICES.txt`](public/THIRD_PARTY_NOTICES.txt). The skills in [`.claude/skills/`](.claude/skills) keep their own licences (Apache-2.0 for `frontend-design`, MIT for `ux-heuristics`).
