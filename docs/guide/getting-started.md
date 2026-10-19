# Getting started

::: warning Languages
Anubis uses your browser's language when it has a translation. Only English is fully supported; the others are machine translations, so use them with caution. [Help translate](./translate.md) says more.
:::

## Install in Firefox

Get [Anubis from Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/).

## Install in Firefox for Android

Experimental. Install it from [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) on your phone, and open it from Firefox's menu. Google, DuckDuckGo, and Bing work; other engines may not yet. Each result has a ⚖ button at the end of its title.

## Install in Chrome

Get [Anubis from the Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi).

## Other browsers

Brave, Vivaldi, Opera, and Edge install it from the [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). In Edge, choose **Allow extensions from other stores** first.

To load it by hand, download a package from [GitHub Releases](https://github.com/Bishop-V/anubis/releases), or build it with [Node.js](https://nodejs.org) 22.12 or newer:

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox
npm run build:chrome   # Chrome, Edge, and other Chromium browsers
```

- **Firefox:** in `about:debugging`, choose **This Firefox → Load Temporary Add-on** and pick `.output/firefox-mv2/manifest.json`. It's removed when Firefox closes.
- **Chrome or Edge:** in `chrome://extensions` or `edge://extensions`, turn on **Developer mode**, choose **Load unpacked**, and pick `.output/chrome-mv3` or the extracted package.

Anubis works without its toolbar button. If you'd like it there, open the puzzle-piece menu and pin it.

## Search as usual

Search on any [supported engine](./search-engines.md). Anubis starts with lists that tag official docs, discussions, reference sites, paywalls, FOSS tools, and AI-generated content, and that raise independent wikis over Fandom.

A summary above the results says what Anubis did. On a phone, **Details** shows the rest.

<!-- Maintainer: the generated screenshots on this page come from mock pages. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

![The summary line above the results](../img/summary.png)

## Hide a site

Press the round button to the left of a result and choose **Hide**. Every result from that site is now hidden, on every search. **Undo** in the summary takes it back.

![The menu on a result: Hide, Lower, Normal, Raise, and Pin, with tags below](../img/menu.png)

- **Show hidden** in the summary shows hidden results on this page.
- To unhide a site, show it, open its menu, and choose **Normal**.
- To leave a line in place of each hidden result, choose **Collapse** in **Settings → Appearance → Hidden results**.

![A hidden result in the Collapse style: one line with a Show button](../img/hidden.png)

## Rank the site you're on

Press the Anubis toolbar button on any website to rank or tag that site. On a search page, the popup shows what Anubis did instead.

<img src="../img/popup.png" width="364" alt="The toolbar popup on wikipedia.org: the Reference tag is selected and underlined among the site's tags">

## Turn Anubis off

Use the switch in the toolbar popup. The icon turns grey.

## Keyboard shortcuts

- **Alt+Shift+O** turns Anubis on or off.
- **Alt+Shift+H** shows or hides the hidden results.

On a Mac, use Control instead of Alt. Change them in `chrome://extensions/shortcuts`, or in Firefox under `about:addons` → gear → **Manage Extension Shortcuts**.

## Help

**Help** in the popup opens this wiki, and each section of **Settings** links to its page.

## Next

- [Ranking sites](./ranking.md)
- [Tags](./tags.md)
- [Subscribing to lists](./lists.md)
- [Removing panels](./clean-up.md)
