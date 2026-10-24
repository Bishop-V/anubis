# Introduction

Anubis is a Firefox and Chrome extension that cleans up search results on the engine you already use. It hides the sites you don't want, raises the ones you trust, tags results so you know what you're clicking, and removes AI answers and other panels.

<!-- Maintainer: on the site, HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page: if the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

<HideDemo />

<div class="github-only">

![Anubis above a page of results: a one-line summary saying what it hid and raised, and tags under each title](../img/summary.png)

<p class="caption">Shown on a test page.</p>

</div>

## Features

<!-- Maintainer: the README's "What it does" lists the same features under the same names, linking the same pages; tests/readme.test.ts checks that. Change both together. -->

- **[Rank any site from the results](./ranking.md)**: hide, lower, raise, or pin a site from the button beside any result.
- **[Tags](./tags.md)**: labels like "Official docs" or "Paywalled" under each title. You choose what each tag does.
- **[Lists anyone can publish](./lists.md)**: subscribe to lists that tag and rank sites for you, Brave Goggles and uBlacklist rulesets included, or [publish your own](./publish-a-list.md).
- **[Remove panels](./clean-up.md)**: take AI answers, video panels, and "People also ask" off every search.
- **[More than one page of results](./more-results.md)**: pull later pages onto the first and rank them together.
- **[Sync](./sync.md)**: through your browser's own sync, or between Firefox and Chrome with a WebDAV server.
- **[Bring your old lists](./import-and-backup.md)**: import from uBlacklist, HOHSER, or a Brave Goggle.
- **Easy to undo**: a summary above the results says what Anubis changed, and **Show hidden** brings it back.

It works on Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, and Yandex, and on Mojeek as an experiment. See [Search engines](./search-engines.md).

## Where the name comes from

In Egyptian myth, Anubis weighed each heart against a feather. Sites that fail the weighing are hidden.

## Get it

[Getting started](./getting-started.md) has the install links and your first steps. Anubis is young: if something looks wrong, see [Troubleshooting](./troubleshooting.md).

::: warning Languages
Anubis is written in English. Its other languages are machine translations that nobody has checked yet: use them with caution. See [Help translate](./translate.md).
:::
