# Introduction

Anubis is a browser extension for Firefox and Chrome that changes search results pages. It hides sites you never want to see, raises the ones you trust, tags results so you can tell them apart at a glance, and removes AI answers and other panels you didn't ask for.

It works on the search engine you already use. Your choices, and the lists you subscribe to, apply on every search.

<!-- Maintainer: on the site, HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page: if the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

<HideDemo />

<div class="github-only">

![Anubis above a page of results: a one-line summary saying what it hid and raised, and tags under each title](../img/summary.png)

<p class="caption">Shown on a test page.</p>

</div>

## Features

<!-- Maintainer: the README's "What it does" lists the same features under the same names, linking the same pages; tests/readme.test.ts checks that. Change both together. -->

- **Rank any site from the results.** Hide, lower, raise, or pin a site with the button on any result. [Ranking sites](./ranking.md)
- **Tags.** Results carry labels like "Official docs", "Discussion", "Paywalled", "AI-generated", or "Independent wiki". You decide what each tag does, from just showing the label to hiding every result that has it. [Tags](./tags.md)
- **Lists anyone can publish.** Subscribe to lists that tag and rank sites for you. A list is a text file in a Git repository, so anyone can publish one and suggest changes to one. Brave Goggles, uBlacklist rulesets, and plain domain lists work unchanged. Some lists are made every week from other projects' data, such as the HUGE AI Blocklist and Indie Wiki Buddy, and credit them. [Subscribing to lists](./lists.md) and [Publish a list](./publish-a-list.md)
- **Remove panels.** Take AI answers, video panels, "People also ask", and more off every search. [Removing panels](./clean-up.md)
- **More than one page of results.** Bring the next pages onto the first and rank them together, so a site you pinned on page 3 rises to the top. [Loading more results](./more-results.md)
- **Sync.** Your sites and settings follow you through your browser's own sync, and between Firefox and Chrome through a WebDAV server. [Syncing between computers](./sync.md)
- **Bring your old lists.** Move your sites over from uBlacklist, HOHSER, or a Brave Goggle. [Moving from other tools](./import-and-backup.md)
- **Easy to undo.** A one-line summary above the results says what Anubis changed, "Show hidden" brings everything back on that page, and "Undo" takes back your last change.

::: warning Languages
Anubis is in English. It also comes in Arabic, Bengali, Chinese (Simplified), French, German, Hindi, Indonesian, Brazilian Portuguese, Russian, Spanish, and Urdu, but those are machine translations, not yet checked by people who speak them and not fully supported: use them with caution. [Help translate](./translate.md) says more, and how to correct them.
:::

It works on Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, and Yandex. Mojeek is experimental: it hasn't been tried on the live site yet. See [Search engines](./search-engines.md) for details.

## Where the name comes from

In Egyptian myth, Anubis weighed each heart against a feather. This extension does the same to search results, and sites that fail the weighing are hidden. The balance in the menu on each result is a nod to that; everything else says plainly what it does.

## Status

Anubis is young, and it's available from [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) and the [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). Edge Add-ons doesn't list it yet. Tagged [GitHub Releases](https://github.com/Bishop-V/anubis/releases) include versioned packages and stable links to the latest Firefox and Chrome builds. Most engines have been checked on their live pages, and the rest only on test pages built to match their layout; [Search engines](./search-engines.md) says which. [Getting started](./getting-started.md) explains how to install it. If something looks wrong on a real search page, see [Troubleshooting](./troubleshooting.md).
