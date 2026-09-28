# Publishing to the stores

What the Chrome Web Store and Firefox Add-ons (AMO) ask for, with the answers ready to paste. Neither listing exists yet. Do the first upload to each store by hand in its dashboard; the APIs update listings that already exist.

## Chrome's publishing API changes on 15 October 2026

Chrome Web Store API v1.1, and the OAuth refresh tokens it uses, stop working on **15 October 2026**. Anything that publishes from a script or CI has to use API v2, which signs in with a Google Cloud **service account** instead.

`wxt submit` (the publishing tool that comes with WXT, `publish-browser-extension` 6.1.1 in WXT 0.21) speaks v2 but **still defaults to v1.1**. When publishing is automated, set:

```sh
CHROME_API_VERSION=v2
CHROME_PUBLISHER_ID=…            # from the developer dashboard
CHROME_EXTENSION_ID=…            # the item's ID, after the first manual upload
CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL=…
CHROME_SERVICE_ACCOUNT_PRIVATE_KEY=…
```

Setting it up: create a Google Cloud project, turn on the Chrome Web Store API, create a service account with a key, and add that account to the publisher in the developer dashboard ([Chrome's API guide](https://developer.chrome.com/docs/webstore/using-api)). Keep the key in a GitHub environment that needs approval, never in a workflow that runs on pull requests. The release workflow itself is on the backlog in [`ROADMAP.md`](../ROADMAP.md).

## Before each release

1. Bump `version` in `package.json` (WXT copies it into the manifest). Both stores reject a version they've already seen.
2. `npm run compile`, `npm test`, both builds, `npx web-ext lint -s .output/firefox-mv2`, and `npm run e2e`.
3. Load the build and check the engines listed under "Still unverified" in [`docs/experiments.md`](../docs/experiments.md).
4. `npm run zip:chrome` for Chrome. `npm run zip` for Firefox, which also makes `anubis-<version>-sources.zip` for AMO's reviewers.
5. The privacy policy link below has to load: GitHub Pages must be publishing the docs site.

## Chrome Web Store

### Store listing

- **Summary:** comes from the manifest's `description` (at most 132 characters).
- **Description:** [the shared description](#description-both-stores).
- **Category:** the closest fit to "search tools" the dashboard offers (for example Productivity → Tools).
- **Language:** English.
- **Store icon:** [`icon-128.png`](icon-128.png). The logo at 96×96 inside transparent padding, as the store asks; the toolbar icons in `public/icon/` fill the whole square.
- **Screenshots:** at least one, at most five, 1280×800. See [Screenshots](#screenshots).
- **Small promo tile:** [`promo-440x280.png`](promo-440x280.png).
- **Marquee tile (1400×560) and video:** optional; skipped.
- **Homepage:** `https://bishop-v.github.io/anubis/`. **Support:** `https://github.com/Bishop-V/anubis/issues`.

### Privacy practices tab

**Single purpose**

> Anubis changes search engine results pages to match the user's preferences: it hides, reorders and labels results by site, and removes page sections the user chooses to hide (such as AI answers), using the user's own rankings and lists the user subscribes to.

**storage**

> Saves the user's ranked sites, tags, settings and list subscriptions in browser storage (sync storage, so they follow the user's browser account), and keeps downloaded copies of subscribed lists on the device. Nothing is sent to the developer.

**activeTab**

> When the user opens the toolbar popup, Anubis reads the address of the current tab so the user can hide, rank or tag the site they are on. It is used only for that click, and Anubis has no other access to tabs.

**Host permissions** (the content script's sites, and the optional `https://*/*`)

> The content script runs only on the results pages of the supported search engines (Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, Yandex and Mojeek) to hide, reorder and tag the results on the page. It matches every Google country domain and the whole Google site because Google moves from its home page to results without loading a new page. It runs on no other site.
>
> `https://*/*` is optional and never granted at install. When the user subscribes to a list hosted outside GitHub, Anubis asks for access to that one host (for example `https://example.org/*`) so it can download the list file. Lists on raw.githubusercontent.com and gist.githubusercontent.com need no permission. The pattern is broad only because the host isn't known until the user types the list's address.

**Remote code:** No.

> All JavaScript ships in the package. Subscribed lists are plain-text data (site names and patterns) that Anubis parses; nothing in them is run.

**Data usage:** leave every category unticked. Anubis reads search results and the current tab's address only inside the browser and sends none of it to the developer or anyone else; settings sync through the browser's own account sync, which Anubis doesn't operate. If a reviewer disagrees, the cautious fallback is ticking "Web history" and "Website content" with the same explanation, which the certifications below still cover.

**Certifications:** tick all three (no selling or transferring data, no use unrelated to the single purpose, no use for credit decisions).

**Privacy policy:** `https://bishop-v.github.io/anubis/guide/privacy`, built from [`docs/guide/privacy.md`](../docs/guide/privacy.md). Keep that page accurate whenever a feature connects somewhere new.

### Distribution

Public, all regions.

## Firefox Add-ons (AMO)

- **Summary:** from the manifest's `description` (at most 250 characters).
- **Description:** [the shared description](#description-both-stores).
- **Category:** Search Tools.
- **Platforms:** Firefox for desktop. Leave Firefox for Android unticked until the work in [`ROADMAP.md`](../ROADMAP.md) is checked on a phone.
- **License:** GNU General Public License v3.0.
- **Homepage and support site:** as for Chrome.
- **Privacy policy:** not needed. The manifest declares no data collection (`data_collection_permissions: none`), which Firefox shows on the listing and at install, and which AMO requires of every add-on from 2026.
- **Manifest version:** stays on MV2 for Firefox. Mozilla has no plans to drop it, and MV3 in Firefox changes how host permissions are granted for no gain here.
- **Source code:** yes, the build bundles and minifies. Upload `.output/anubis-<version>-sources.zip`.

**Notes to reviewer**

> Built with WXT (Vite and TypeScript). To reproduce the uploaded package:
>
> 1. Node.js 22 with npm 10, on Linux or macOS.
> 2. `npm ci`
> 3. `npm run build`
>
> The unpacked build is in `.output/firefox-mv2`. The build is deterministic, so it should match the uploaded package file for file; `npm run zip` makes the same package.
>
> Anubis downloads plain-text list files the user subscribes to and parses them as data (`utils/listformat.ts`); nothing downloaded is run. "Load more results" fetches the search engine's next results page from the same origin, parses it with `DOMParser`, and removes scripts and event handlers before bringing the results into the page (`entrypoints/content/deeper.ts`). No `innerHTML` is used.

## Description (both stores)

Plain text, so it reads the same in both dashboards.

```text
Anubis hides, ranks and tags search results, on the search engine you already use.

Rank any site from the results. Press the ⇅ button on a result to hide, lower, raise or pin that site, or to tag it. Your choices apply to every search.

Tags. Results carry small labels such as "Official docs", "Discussion" or "Paywall", from your own tags and from lists you subscribe to. For each tag, choose whether it only shows, highlights results, or raises, lowers or hides them.

Lists anyone can publish. Subscribe to lists hosted on GitHub, GitLab, Codeberg or a gist. Anubis reads its own list format, Brave Goggles, uBlacklist rulesets and plain lists of domains, so existing community lists work as they are.

Load more results. Bring the next pages of results onto the first one and rank them together, so a site you pinned on page 3 rises to the top.

Clean up pages. Remove AI answers, video panels, "People also ask", top stories and related searches.

Nothing disappears without a trace. A one-line summary says what Anubis changed, and "Show hidden" brings it back. Keyboard shortcuts turn Anubis on or off (Alt+Shift+O) and show hidden results (Alt+Shift+H).

Works on Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, Yandex and Mojeek.

No server, no account, nothing collected. Your list and settings stay in your browser.

User guide: https://bishop-v.github.io/anubis/
Source code (GPL-3.0): https://github.com/Bishop-V/anubis
```

## Screenshots

From real search pages, not the e2e mocks: a listing has to show the product as people will see it. 1280×800 suits both stores (Chrome requires it or 640×400).

Take them in a fresh browser profile that isn't signed in, so no account picture, history or location shows. In Chrome: DevTools → device toolbar → Responsive, 1280 × 800, device pixel ratio 1 → ⋮ → Capture screenshot. Save them in `store/screenshots/`. Don't save page HTML here; it carries the account and location.

1. Google results for a programming question: tags under titles, a pinned documentation result at the top, a hidden result as one line, and the summary.
2. The ⇅ menu open on a result: the site's name, the five rankings and its tags.
3. A results page after clean-up, with the summary saying an AI answer was removed.
4. The toolbar popup over a results page.
5. Settings → Lists, with the lists Anubis starts with and More lists.

## Images in this folder

`icon-128.png` and `promo-440x280.png` are rendered from `public/anubis.svg`. After changing the logo, run `CHROMIUM_PATH=$(which chromium) node store/render.mjs`.
