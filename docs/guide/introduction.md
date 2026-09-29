# Introduction

Anubis is a browser extension for Firefox and Chrome that changes search results pages. It hides sites you never want to see, raises the ones you trust, tags results so you can tell them apart at a glance, and removes AI answers and other panels you didn't ask for.

It works on the search engine you already use. Your choices, and the lists you subscribe to, apply on every search.

![Anubis above a page of results: a one-line summary, tags under each title and a hidden result](../img/summary.png)

<p class="caption">Shown on a test page.</p>

## Features

- **Rank any site from the results.** Hide, lower, raise or pin a site with the button on any result. [Ranking sites](./ranking.md)
- **Tags.** Results carry labels like "Official docs", "Discussion" or "Paywall". You decide what each tag does, from just showing the label to hiding every result that has it. [Tags](./tags.md)
- **Lists anyone can publish.** Subscribe to lists that tag and rank sites for you. A list is a text file in a Git repository, so anyone can publish one and suggest changes to one. Brave Goggles, uBlacklist rulesets and plain domain lists work unchanged. [Subscribing to lists](./lists.md)
- **Clean up pages.** Remove AI answers, video panels, "People also ask" and more on every search. [Cleaning up pages](./clean-up.md)
- **More than one page of results.** Bring the next pages onto the first and rank them together, so a site you pinned on page 3 rises to the top. [Loading more results](./more-results.md)
- **Easy to undo.** A one-line summary above the results says what Anubis changed, "Show hidden" brings everything back on that page, and "Undo" takes back your last change.

It works on Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, Yandex and Mojeek. See [Search engines](./search-engines.md) for details.

## Where the name comes from

In Egyptian myth, Anubis weighed each heart against a feather. This extension does the same to search results, and sites that fail the weighing are hidden. The balance in the menu on each result is a nod to that; everything else says plainly what it does.

## Status

Anubis is young. It isn't in the browser stores yet. Most engines have been checked on their live pages, and the rest only on test pages built to match their layout; [Search engines](./search-engines.md) says which. [Getting started](./getting-started.md) explains how to install it from the source code. If something looks wrong on a real search page, see [Troubleshooting](./troubleshooting.md).
