# Introduction

Anubis is a Firefox and Chrome extension for search results. It hides sites you don't want, raises the ones you trust, tags results, and removes AI answers and other panels. It works on the search engine you already use.

<!-- Maintainer: on the site, HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page: if the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

<HideDemo />

<div class="github-only">

![Anubis above a page of results: a one-line summary saying what it hid and raised, and tags under each title](../img/summary.png)

<p class="caption">Shown on a test page.</p>

</div>

## Features

<!-- Maintainer: the README's "What it does" lists the same features under the same names, linking the same pages; tests/readme.test.ts checks that. Change both together. -->

- **Rank any site from the results.** Hide, lower, raise, or pin a site from the button beside any result. [Ranking sites](./ranking.md)
- **Tags.** Labels like "Official docs" or "Paywalled" under each title. You choose what each tag does. [Tags](./tags.md)
- **Lists anyone can publish.** Subscribe to lists that tag and rank sites for you, including Brave Goggles and uBlacklist rulesets. [Subscribing to lists](./lists.md) and [Publish a list](./publish-a-list.md)
- **Remove panels.** Take AI answers, video panels, and "People also ask" off every search. [Removing panels](./clean-up.md)
- **More than one page of results.** Pull later pages onto the first and rank them together. [Loading more results](./more-results.md)
- **Sync.** Through your browser's own sync, or between Firefox and Chrome with a WebDAV server. [Syncing between computers](./sync.md)
- **Bring your old lists.** Import from uBlacklist, HOHSER, or a Brave Goggle. [Moving from other tools](./import-and-backup.md)
- **Easy to undo.** A summary above the results says what Anubis changed, and "Show hidden" brings it back.

::: warning Languages
Anubis is in English. Its other languages are machine translations that nobody has checked yet: use them with caution. See [Help translate](./translate.md).
:::

It works on Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, and Yandex, with Mojeek experimental. See [Search engines](./search-engines.md).

## Where the name comes from

In Egyptian myth, Anubis weighed each heart against a feather. Sites that fail the weighing are hidden.

## Status

Anubis is young. Get it from [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) or the [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi); [GitHub Releases](https://github.com/Bishop-V/anubis/releases) has packages too. See [Getting started](./getting-started.md), and [Troubleshooting](./troubleshooting.md) if something looks wrong.
