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

1. `npm run release:prep -- <version>` (or `patch`, `minor`, or `major`). It sets `version` in `package.json` and `package-lock.json` (WXT copies it into the manifest), then runs the type-check, unit tests, `npm run zip`, `npx web-ext lint`, and `npm run e2e`, stopping at the first failure. Both stores reject a version they've already seen. Run it without a version to repeat the checks. `npm run zip` makes the Firefox zip and `anubis-<version>-sources.zip` for AMO's reviewers; run `npm run zip:chrome` too when Chrome is ready.
2. Load the build and check the engines listed under "Still unverified" in [`docs/experiments/live-pages.md`](../docs/experiments/live-pages.md).
3. The privacy policy link below has to load: GitHub Pages must be publishing the docs site.
4. Merge, then push a matching tag (`git tag v<version> && git push origin v<version>`). [`release.yml`](../.github/workflows/release.yml) builds the zips, creates the GitHub Release and, once approved, submits to each store whose keys are in the `release` environment.

The release workflow rejects tags whose commit is not already on `main`, as well as tags that do not match `package.json`. It submits only to stores whose keys are all set in the `release` environment and skips the rest, so Firefox ships first: add `FIREFOX_JWT_ISSUER` and `FIREFOX_JWT_SECRET` (AMO → Tools → Manage API Keys) and leave the Chrome and Edge keys out until those listings exist. A store with only some of its keys set fails the release rather than being skipped. Before the first submission, create the store listings manually, verify their permanent IDs and privacy answers, confirm the docs site is publishing on GitHub Pages, and configure the protected `release` environment with the store credentials. As of 2026-09-29, that environment was not configured. Do not test publishing against production store credentials from a pull request.

## Chrome Web Store

### Store listing

- **Summary:** comes from the manifest's `description` (at most 132 characters).
- **Description:** [the shared description](#description-both-stores).
- **Category:** the closest fit to "search tools" the dashboard offers (for example Productivity → Tools).
- **Language:** English.
- **Store icon:** [`icon-128.png`](icon-128.png). The logo at 96×96 inside transparent padding, as the store asks; the toolbar icons in `public/icon/` fill the whole square.
- **Screenshots:** at least one, at most five, 1280×800. See [Screenshots](#screenshots).
- **Small promo tile:** [`promo-440x280.png`](promo-440x280.png).
- **Marquee promo tile:** [`marquee-1400x560.png`](marquee-1400x560.png), optional and shown only if the store features Anubis. **Video:** skipped.
- **Homepage:** `https://bishop-v.github.io/anubis/`. **Support:** `https://github.com/Bishop-V/anubis/issues`.
- **Official URL:** `https://bishop-v.github.io/anubis/`, verified in Google Search Console as a URL-prefix property with the file [`docs/public/googleccef4dde1509753c.html`](../docs/public/googleccef4dde1509753c.html). Keep that file: Google checks it again from time to time, and the listing loses its verified link without it.

### Privacy practices tab

**Single purpose**

> Anubis changes search engine results pages to match the user's preferences: it hides, reorders, and labels results by site, and removes page sections the user chooses to hide (such as AI answers), using the user's own rankings and lists the user subscribes to.

**storage**

> Saves the user's ranked sites, tags, settings, and list subscriptions in browser storage (sync storage, so they follow the user's browser account), and keeps downloaded copies of subscribed lists on the device. If the user connects a WebDAV server of their own to sync between browsers, its address and login are kept in local storage on that device only; the login is sent to that server to sign in. End-to-end encryption is on by default for new connections: the user-chosen passphrase is saved in local extension storage on each device and never sent to the server; Anubis derives an AES-256-GCM key and encrypts the sync file before upload. The server operator cannot read an encrypted file. Users can turn encryption off, and existing connections remain unencrypted until enabled; in that case the server operator can read the file. Nothing is sent to the developer.

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

**Data usage:** Chrome's [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) says local processing can still be handling user data, so Anubis discloses its local use of search results and the current tab's address in its privacy policy. The FAQ's FTP/IRC example says a protocol client communicating with a server chosen by the user does not thereby collect data for the developer; it also says Limited Use does not apply to data exchanged with that server. Anubis has no sync server of its own: WebDAV runs only after the user connects their server, and sends the sync file there. New connections encrypt the file by default, but users can turn encryption off and existing connections require opting in; the privacy policy describes both cases. That exception concerns the user-directed server transfer; it does not change how Anubis locally uses browsing data.

**Before submission:** Answer the Chrome dashboard's current questions based on what Anubis and its developer actually do. Do not report the user's WebDAV server as a developer-operated collection endpoint: it is user-configured and the FAQ's protocol-client example directly supports treating that transfer as user-directed. Separately disclose Anubis's local processing accurately, and check that the dashboard answers, listing, and privacy policy agree. Google's FAQ is policy guidance, not a guarantee of a particular review outcome.

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
> Anubis downloads plain-text list files the user subscribes to and parses them as data (`utils/listformat.ts`); nothing downloaded is run. "Load more results" fetches the search engine's next results page from the same origin, parses it with `DOMParser`, and removes scripts and event handlers before bringing the results into the page (`entrypoints/content/deeper.ts`). When the fetched copy has no results (a robot check), it loads the same same-origin page once in a hidden iframe, sandboxed without top navigation, and imports from it the same way. No `innerHTML` is used.

## Description (both stores)

Plain text, so it reads the same in both dashboards.

```text
Anubis hides, ranks, and tags search results, on the search engine you already use.

Rank any site from the results. Press the ⚖ button on a result to hide, lower, raise, or pin that site, or to tag it. Your choices apply to every search.

Tags. Results carry small labels such as "Official docs", "Discussion", or "Paywalled", from your own tags and from lists you subscribe to. For each tag, choose whether it only shows, highlights results, or raises, lowers, or hides them.

Lists anyone can publish. Subscribe to lists hosted on GitHub, GitLab, Codeberg, or a gist. Anubis reads its own list format, Brave Goggles, uBlacklist rulesets, and plain lists of domains, so existing community lists work as they are.

Load more results. Bring the next pages of results onto the first one and rank them together, so a site you pinned on page 3 rises to the top.

Remove panels. Take AI answers, video panels, "People also ask", top stories, image rows, and related searches off search pages.

Nothing disappears without a trace. A one-line summary says what Anubis changed, and "Show hidden" brings it back. Keyboard shortcuts turn Anubis on or off (Alt+Shift+O) and show hidden results (Alt+Shift+H).

Works on Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo, Yandex, and Mojeek.

No Anubis server or account. Anubis does not send your searches or settings to the developer. If you connect your own WebDAV server, it sends your rankings, tags, settings, and lists there to sync between browsers; the sync file is encrypted by default for new connections, but you can turn encryption off.

Wiki: https://bishop-v.github.io/anubis/
Source code (AGPL-3.0): https://github.com/Bishop-V/anubis
```

## Screenshots

From real search pages, not the e2e mocks: a listing has to show the product as people will see it. 1280×800 suits both stores (Chrome requires it or 640×400).

Take them in a fresh browser profile that isn't signed in, so no account picture, history, or location shows. Crop out the system's taskbar (its clock and status) and other tabs' titles; the store takes JPEG or 24-bit PNG without alpha, so JPEG is simplest. In Chrome: DevTools → device toolbar → Responsive, 1280 × 800, device pixel ratio 1 → ⋮ → Capture screenshot. Save them in `store/screenshots/`. Don't save page HTML here; it carries the account and location.

In `store/screenshots/` now (2026-09-30, Chrome, Google in dark mode): `1-popup.jpg` (the toolbar popup over results, with a pinned result and the summary), and `2-menu.jpg` (the ⚖ menu open on the pinned result). Still to take: 1 and 3 above.

1. Google results for a programming question: tags under titles, a pinned documentation result at the top, and the summary counting a hidden result.
2. The ⚖ menu open on a result: the site's name, the five rankings, and its tags.
3. A results page after clean-up, with the summary saying an AI answer was removed.
4. The toolbar popup over a results page.
5. Settings → Lists, with the lists Anubis starts with and More lists.

## Images in this folder

`icon-128.png` and `promo-440x280.png` are rendered from `public/anubis.svg`. After changing the logo, run `CHROMIUM_PATH=$(which chromium) node store/render.mjs`.
