# Getting started

Install Anubis, search as you always do, and hide your first site.

## Install

- **Firefox:** [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/).
- **Chrome, Brave, Vivaldi, Opera, and Edge:** [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). In Edge, choose **Allow extensions from other stores** first.
- **Firefox for Android** (experimental): [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) on your phone, then open Anubis from Firefox's menu. Google, DuckDuckGo, and Bing work; other engines may not yet.

Anubis works without its toolbar button. To have it there in Chrome, open the puzzle-piece menu and pin it.

## Search as usual

Search on any [supported engine](./search-engines.md). Anubis starts with lists that tag official docs, discussions, reference sites, paywalls, FOSS tools, and AI-generated content. Another raises independent wikis over Fandom.

A summary above the results says what Anubis did. On a phone, **Details** shows the rest.

<!-- Maintainer: the generated screenshots on this page come from mock pages. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

![The summary line above the results](../img/summary.png)

## Hide a site

Press the round button to the left of a result and choose **Hide**. That site is gone from every search, and **Undo** in the summary brings it back. On a phone, the button is the ⚖ at the end of the title.

![The menu on a result: Hide, Lower, Normal, Raise, and Pin, with tags below](../img/menu.png)

- **Show hidden** in the summary shows this page's hidden results.
- To unhide a site for good, show it, open its menu, and choose **Normal**.
- To leave a line in place of each hidden result, choose **Collapse** in **Settings → Appearance → Hidden results**.

![A hidden result in the Collapse style: one line with a Show button](../img/hidden.png)

## Rank the site you're on

Press the Anubis toolbar button on any website to rank or tag that site. On a search page, the popup shows what Anubis did instead.

<img src="../img/popup.png" width="364" alt="The toolbar popup on wikipedia.org: the Reference tag is selected and underlined among the site's tags">

## Keyboard shortcuts

- **Alt+Shift+O** turns Anubis on or off.
- **Alt+Shift+H** shows or hides the hidden results.

On a Mac, use Control instead of Alt. Change them in `chrome://extensions/shortcuts`, or in Firefox under `about:addons` → gear → **Manage Extension Shortcuts**.

## Next

- [Ranking sites](./ranking.md): lower, raise, or pin a site.
- [Tags](./tags.md): choose what each tag does.
- [Subscribing to lists](./lists.md): let lists tag and rank sites for you.
- [Removing panels](./clean-up.md): take AI answers off every search.

## Load it by hand

Download a package from [GitHub Releases](https://github.com/Bishop-V/anubis/releases), or build it with [Node.js](https://nodejs.org) 22.12 or newer:

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox
npm run build:chrome   # Chrome, Edge, and other Chromium browsers
```

- **Firefox:** in `about:debugging`, choose **This Firefox → Load Temporary Add-on** and pick `.output/firefox-mv2/manifest.json`. It's removed when Firefox closes.
- **Chrome or Edge:** in `chrome://extensions` or `edge://extensions`, turn on **Developer mode**, choose **Load unpacked**, and pick `.output/chrome-mv3` or the extracted package.

::: warning Languages
Anubis uses your browser's language when it has a translation. Only English is fully supported; the others are machine translations, so use them with caution. [Help translate](./translate.md) says more.
:::
