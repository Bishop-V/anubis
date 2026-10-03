# Privacy and permissions

Anubis has no developer-operated server. It reads search results and the current tab's address in your browser to apply your choices; it does not send that browsing data to the developer. Your settings stay in your browser unless you connect a storage server of your own to sync between browsers.

## How Anubis uses data

Anubis uses information accessed through browser permissions only for its user-facing features: applying your rankings and tags to search results, showing the current site's settings in the popup, downloading subscribed lists, and syncing to a WebDAV server you connect. It does not send this information to the developer or use it for advertising. Anubis has no sync server of its own.

This use complies with the Chrome Web Store User Data Policy, including its Limited Use requirements.

## What's stored, and where

- **Your list, settings, tag choices, and subscriptions** are kept in your browser's sync storage. If you're signed in to your browser (a Firefox or Google account) with sync on, the browser copies them to your other computers. Anubis never sees them. If your list grows too big for sync storage, it's kept on this computer only. See [Syncing between computers](./sync.md).
- **A sync server's address and login**, if you connect one to sync between browsers, are saved in that browser only, never in browser sync. Anubis sends the login to that server to sign in; it is not part of the sync file. If you enable end-to-end encryption, its passphrase is also saved in that browser only so automatic syncing can decrypt and encrypt the file.
- **Downloaded lists** are kept only on this computer, and downloaded again elsewhere.

## What Anubis connects to

Only these:

- **The lists you subscribe to**, from wherever they're hosted, to check for new versions once a day, or less often when a list says so (Anubis's own lists: once a week). This starts when you install Anubis, because it subscribes you to five lists of its own, hosted on GitHub. You can turn them off under **Settings → Lists**.
- **The directory of lists** on GitHub, when you open **Settings → Lists**, so **More lists** shows the newest ones.
- **The search engine you're on**, for [Load more results](./more-results.md), which loads its next page like the "Next" link would. If the engine sends a page without results, Anubis opens that page once more out of sight, which is the same as opening it yourself.
- **The WebDAV server you connect for syncing between browsers**, if you do. Anubis sends your ranked sites, settings, tag choices, and subscriptions to the HTTPS address you provide, and nowhere else. End-to-end encryption is on by default for new connections: when enabled, the server receives an encrypted file it cannot read. You can turn it off when connecting; existing unencrypted connections stay unencrypted until you enable it. Without encryption, the server operator can read the file. See [Between browsers](./sync.md#between-browsers).
- **Anubis's issue tracker on GitHub**, when you choose **Report a problem**. That opens a new issue in a new tab with Anubis's version, your browser and its version, and the search engine you're on filled in, and nothing from the page itself. Nothing is sent unless you submit the issue yourself.
- **Issue trackers**, when you choose "Report it to…" or "Suggest it to…". That opens a page in a new tab, with the result's address (without anything after `?`, which can carry details of your visit) and the rule that matched; nothing is sent unless you submit the issue yourself.

Downloading a list works like any other download: the site hosting it sees your IP address and which file was asked for. Anubis sends nothing else with it: no cookies, no identifier, and nothing about your searches.

## Permissions

When you install Anubis, your browser asks for:

- **Access to the search engines' sites**, so Anubis can change their results pages.
- **Access to this wiki's [subscribe page](../subscribe.md)**, so a subscribe link can open Anubis's settings with a list filled in. Your browser names it after the site this wiki is on, `bishop-v.github.io`. Anubis reads only the link's address there.
- **Storage**, to keep your list and settings.
- **The current tab, when you open the toolbar popup** (called `activeTab`). This lets the popup read the address of the site you're on, so you can rank it. It shows no install warning and lasts until that tab goes to another page.

Anubis runs on no other sites.

Anubis may also ask, at the moment you subscribe, to **read from one website** that hosts a list. That's needed for lists hosted anywhere other than GitHub or a gist. It asks the same for a sync server, at the moment you connect one. You can take either back in your browser's extension settings.

In supported Firefox versions, Anubis declares no required data collection and asks for optional browsing-activity consent only when you connect a sync server. Firefox then asks whether Anubis may send your list there. **Disconnect** takes that consent back.

## Questions

This page is Anubis's privacy policy, and the Chrome Web Store and Firefox Add-ons listings link to it. If it changes, the change is in the [page's history on GitHub](https://github.com/Bishop-V/anubis/commits/main/docs/guide/privacy.md). Ask anything about it by [opening an issue](https://github.com/Bishop-V/anubis/issues).
