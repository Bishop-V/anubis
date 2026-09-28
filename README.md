# Anubis

<img src="public/anubis.svg" width="64" alt="Anubis logo">

In Egyptian myth, Anubis weighed each soul's heart against a feather to judge whether it was worthy. This extension does the same for search results: sites you don't trust fail the weighing and get hidden. It works on Google (.com and .ca) and DuckDuckGo.

Built with [WXT](https://wxt.dev), which builds for both browsers from one codebase, and TypeScript.

## Setup

You need **Node.js 20 or newer**.

- **NixOS:** run `nix develop` in this folder. It gives you Node and Chromium, and it runs `npm install` the first time. The flake has to be tracked by git (`git add flake.nix`) or Nix won't see it.
- **Windows/macOS:** install Node LTS from nodejs.org.

```sh
npm install          # installs WXT and sets up TypeScript types
npm run dev          # opens a fresh Chrome window with the extension loaded
npm run dev:firefox  # same, in Firefox
```

Search for something on Google that returns fandom.com results. They'll be hidden. Click the Anubis icon (under the puzzle-piece menu) to add or remove blocked sites. The browser reloads the extension automatically when you save a file.

### If the browser doesn't open automatically

Run `npm run build` (or `npm run build:firefox`), then load the extension by hand:

- **Chrome:** go to `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick `.output/chrome-mv3`.
- **Firefox:** go to `about:debugging` → **This Firefox** → **Load Temporary Add-on**, and pick `.output/firefox-mv2/manifest.json`.

To point WXT at a specific browser binary, create a `web-ext.config.ts` file. See [Browser Startup](https://wxt.dev/guide/essentials/config/browser-startup). Git ignores this file, so each developer can set their own.

## What's where

| File | What it is |
|---|---|
| `wxt.config.ts` | Extension settings. WXT turns them into `manifest.json`, the file every extension needs (name, permissions, etc.) |
| `entrypoints/content.ts` | **Content script.** It runs *inside* search result pages and hides matching results |
| `entrypoints/popup/` | **Popup.** A small web page that opens when you click the toolbar icon. It edits the block list |
| `utils/blocklist.ts` | Shared code. It saves and loads the block list and matches domains |
| `public/` | Static files copied as-is: the logo (`anubis.svg`) and toolbar icons (`icon/*.png`) |

How the pieces connect: the popup saves the list to extension storage. The content script watches that storage and re-filters the page whenever the list changes.

## Things that will bite you

- **Search engines change their HTML.** The selectors in `findResults()` (in `content.ts`) are the most fragile part. To fix them, right-click a result on the real page → **Inspect**, and look for the element that wraps the whole result.
- **Debugging the content script:** use the page's normal DevTools console (F12 on the search page).
- **Debugging the popup:** right-click inside the popup → **Inspect**.

## Ideas for next steps

- A "show hidden results" toggle instead of hiding them completely
- Support for more search engines (Bing, Brave, Kagi)
- **Community filter lists:** subscribe to a URL that hosts a list of domains (this is how uBlacklist subscriptions work)
- An options page (`entrypoints/options/`) for managing bigger lists, and import/export

## Learn

- [Chrome's Hello World tutorial](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world) builds an extension without any framework. It takes about 20 minutes and makes the rest of this project make sense.
- [MDN: Browser extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [WXT docs](https://wxt.dev/guide/introduction)
- [uBlacklist source](https://github.com/iorate/ublacklist) is the closest existing project to this one. It's worth reading how it handles each search engine.
