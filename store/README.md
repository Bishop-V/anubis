# Publishing to the stores

What the Chrome Web Store and Firefox Add-ons (AMO) ask for, with the answers ready to paste. Neither listing exists yet. Do the first upload to each store by hand in its dashboard; the APIs update listings that already exist.

## Chrome Web Store publishing API

The Chrome Web Store API V2 is current and supports Google Cloud **service accounts**. The older V1.1 API and its refresh tokens are scheduled to stop working on **15 October 2026**; the current [API overview](https://developer.chrome.com/docs/webstore/api) now marks V1 as archived. Recheck the publisher dashboard and current Google documentation before the first automated submission and before that date.

`wxt submit` (the publishing tool that comes with WXT, `publish-browser-extension` 6.1.1 in WXT 0.21) supports v2 but **still defaults to v1.1**. The release workflow sets `CHROME_API_VERSION=v2`; keep it explicit:

```sh
CHROME_API_VERSION=v2
CHROME_PUBLISHER_ID=…            # from the developer dashboard
CHROME_EXTENSION_ID=…            # the item's ID, after the first manual upload
CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL=…
CHROME_SERVICE_ACCOUNT_PRIVATE_KEY=…
```

Setting it up: create a Google Cloud project, turn on the Chrome Web Store API, create a service account with a key, and add that account to the publisher in the developer dashboard ([Chrome's API guide](https://developer.chrome.com/docs/webstore/using-api)). Keep the key in a GitHub environment that needs approval, never in a workflow that runs on pull requests. [`release.yml`](../.github/workflows/release.yml) reads these from the `release` environment.

## Before each release

1. Bump `version` in `package.json` (WXT copies it into the manifest). Both stores reject a version they've already seen.
2. `npm run compile`, `npm test`, both builds, `npx web-ext lint -s .output/firefox-mv2`, and `npm run e2e`.
3. Load the build and check the engines listed under "Still unverified" in [`docs/experiments.md`](../docs/experiments.md).
4. `npm run zip:chrome` for Chrome. `npm run zip` for Firefox, which also makes `anubis-<version>-sources.zip` for AMO's reviewers.
5. The privacy policy link below has to load: GitHub Pages must be publishing the docs site.
6. Merge, then push a matching tag (`git tag v<version> && git push origin v<version>`). [`release.yml`](../.github/workflows/release.yml) builds the zips, creates the GitHub Release and, once approved, submits to Chrome, Firefox, and Edge.

The release workflow rejects tags whose commit is not already on `main`, as well as tags that do not match `package.json`. Before the first submission, create the store listings manually, verify their permanent IDs and privacy answers, enable GitHub Pages, and configure the protected `release` environment with the store credentials. Do not test publishing against production store credentials from a pull request.

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

> Anubis changes search engine results pages to match the user's preferences: it hides, reorders, and labels results by site, and removes page sections the user chooses to hide (such as AI answers), using the user's own rankings and lists the user subscribes to.

**storage**

> Saves the user's ranked sites, tags, settings, and list subscriptions in browser storage (sync storage, so they follow the user's browser account), and keeps downloaded copies of subscribed lists on the device. If the user connects a WebDAV server of their own to sync between browsers, its address and login are kept in local storage on that device only. Nothing is sent to the developer.

**activeTab**

> When the user opens the toolbar popup, Anubis reads the address of the current tab so the user can hide, rank, or tag the site they are on. It is used only for that click, and Anubis has no other access to tabs.

**Host permissions** (the content scripts' sites, and the optional `https://*/*`)

> The main content script runs only on the results pages of the supported search engines (Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, Yandex, and Mojeek) to hide, reorder, and tag the results on the page. It matches every Google country domain and the whole Google site because Google moves from its home page to results without loading a new page.
>
> A second, small content script runs on one page of Anubis's own wiki, `https://bishop-v.github.io/anubis/subscribe`, where subscribe links lead. It reads the list address from the link and opens Anubis's settings with that list filled in; the user presses Subscribe to add it. Neither script runs on any other site.
>
> `https://*/*` is optional and never granted at install. When the user subscribes to a list hosted outside GitHub, Anubis asks for access to that one host (for example `https://example.org/*`) so it can download the list file. Lists on raw.githubusercontent.com and gist.githubusercontent.com need no permission. The same goes for a WebDAV server the user connects in Settings → Sync to sync between browsers: Anubis asks for that one host when they press Connect. The pattern is broad only because the host isn't known until the user types the address.

**Remote code:** No.

> All JavaScript ships in the package. Subscribed lists are plain-text data (site names and patterns) that Anubis parses; nothing in them is run.

**Data usage (decision required before submission):** Anubis reads search results and the current tab's address only inside the browser and sends none of it to the developer; settings sync through the browser's own account sync, which Anubis doesn't operate. The optional, user-chosen WebDAV sync sends ranked sites, settings, tag choices, and subscriptions to the server the user connects, and nowhere else. Decide against the store's current policy whether that user-directed transfer counts as collection; declare the applicable categories and explain that the user chooses the server if required. Do not submit until this classification is resolved.

**Certifications:** tick all three (no selling or transferring data, no use unrelated to the single purpose, no use for credit decisions).

**Privacy policy:** `https://bishop-v.github.io/anubis/guide/privacy`, built from [`docs/guide/privacy.md`](../docs/guide/privacy.md). Keep that page accurate whenever a feature connects somewhere new.

### Distribution

Public, all regions.

## Firefox Add-ons (AMO)

- **Summary:** from the manifest's `description` (at most 250 characters).
- **Description:** [the shared description](#description-both-stores).
- **Category:** Search Tools.
- **Platforms:** Firefox for desktop. Leave Firefox for Android unticked until the work in [`ROADMAP.md`](../ROADMAP.md) is checked on a phone.
- **License:** GNU Affero General Public License v3.0 (the project is AGPL-3.0 or later; the lists in `lists/` are CC0).
- **Homepage and support site:** as for Chrome.
- **Privacy policy:** `https://bishop-v.github.io/anubis/guide/privacy`. The manifest declares no required data collection (`required: ['none']`), which Firefox shows on the listing and at install, and one optional category, `browsingActivity`, which Settings requests only when the user connects a WebDAV server to sync between browsers (their list is a set of sites). AMO requires the declaration of every add-on from 2026.
- **Consent policy check:** the Firefox manifest requires 142.0 or later and declares optional `browsingActivity` for the built-in data-consent flow. Before submission, verify the generated manifest and test Firefox's prompt on WebDAV Connect against [AMO's current consent policy](https://extensionworkshop.com/documentation/publish/add-on-policies/).
- **Manifest version:** stays on MV2 for Firefox. No MV2 retirement date was found in Mozilla's current documentation; check [`docs/platform-watch.md`](../docs/platform-watch.md) again before each release. MV3 in Firefox changes how host permissions are granted, so migrate only for a concrete Firefox requirement.
- **Source code:** yes, the build bundles and minifies. Upload `.output/anubis-<version>-sources.zip`.

**Notes to reviewer**

> Built with WXT (Vite and TypeScript). To reproduce the uploaded package:
>
> 1. Node.js 22.12 or newer with npm 10, on Linux or macOS.
> 2. `npm ci`
> 3. `npm run build`
>
> The unpacked build is in `.output/firefox-mv2`. The build is deterministic, so it should match the uploaded package file for file; `npm run zip` makes the same package.
>
> Anubis downloads plain-text list files the user subscribes to and parses them as data (`utils/listformat.ts`); nothing downloaded is run. "Load more results" fetches the search engine's next results page from the same origin, parses it with `DOMParser`, and removes scripts and event handlers before bringing the results into the page (`entrypoints/content/deeper.ts`). No `innerHTML` is used.

## Description (both stores)

Plain text, so it reads the same in both dashboards.

```text
Anubis hides, ranks, and tags search results, on the search engine you already use.

Rank any site from the results. Press the ⚖ button on a result to hide, lower, raise, or pin that site, or to tag it. Your choices apply to every search.

Tags. Results carry small labels such as "Official docs", "Discussion", or "Paywall", from your own tags and from lists you subscribe to. For each tag, choose whether it only shows, highlights results, or raises, lowers, or hides them.

Lists anyone can publish. Subscribe to lists hosted on GitHub, GitLab, Codeberg, or a gist. Anubis reads its own list format, Brave Goggles, uBlacklist rulesets, and plain lists of domains, so existing community lists work as they are.

Load more results. Bring the next pages of results onto the first one and rank them together, so a site you pinned on page 3 rises to the top.

Clean up pages. Remove AI answers, video panels, "People also ask", top stories, image rows, and related searches. Bing's AI answer and video panel aren't recognized yet.

Nothing disappears without a trace. A one-line summary says what Anubis changed, and "Show hidden" brings it back. Keyboard shortcuts turn Anubis on or off (Alt+Shift+O) and show hidden results (Alt+Shift+H).

Works on Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, Yandex, and Mojeek.

No server, no account, nothing collected. Your list and settings stay in your browser, or go to a storage service of your own if you connect one to sync between browsers.

Wiki: https://bishop-v.github.io/anubis/
Source code (AGPL-3.0): https://github.com/Bishop-V/anubis
```

## Screenshots

From real search pages, not the e2e mocks: a listing has to show the product as people will see it. 1280×800 suits both stores (Chrome requires it or 640×400).

Take them in a fresh browser profile that isn't signed in, so no account picture, history, or location shows. In Chrome: DevTools → device toolbar → Responsive, 1280 × 800, device pixel ratio 1 → ⋮ → Capture screenshot. Save them in `store/screenshots/`. Don't save page HTML here; it carries the account and location.

1. Google results for a programming question: tags under titles, a pinned documentation result at the top, and the summary counting a hidden result.
2. The ⚖ menu open on a result: the site's name, the five rankings, and its tags.
3. A results page after clean-up, with the summary saying an AI answer was removed.
4. The toolbar popup over a results page.
5. Settings → Lists, with the lists Anubis starts with and More lists.

## Images in this folder

`icon-128.png` and `promo-440x280.png` are rendered from `public/anubis.svg`. After changing the logo, run `CHROMIUM_PATH=$(which chromium) node store/render.mjs`.
