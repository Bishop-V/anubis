# Privacy and permissions

Anubis has no server and collects nothing. It reads search results and the current tab's address in your browser to apply your choices, and never sends them to the developer.

## How Anubis uses data

Data from browser permissions is used only for Anubis's features: ranking and tagging results, showing the current site in the popup, downloading your lists, and syncing to a WebDAV server you connect. It is never sent to the developer or used for advertising.

This use complies with the Chrome Web Store User Data Policy, including its Limited Use requirements.

## What's stored, and where

- **Your sites, settings, tag choices, and subscriptions:** in your browser's sync storage, which your browser may copy to your other computers. See [Syncing between computers](./sync.md).
- **A sync server's address, login, and passphrase:** in that browser only, never in browser sync or the sync file.
- **Downloaded lists:** on this computer only.

## What Anubis connects to

Only these:

- **The lists you subscribe to**, about once a day. Anubis starts with nine lists hosted on GitHub; turn them off in **Settings → Lists**.
- **The list directory** on GitHub, when you open **Settings → Lists**.
- **The search engine you're on**, for [Load more results](./more-results.md). On Ecosia, site icons for those results come from Ecosia's icon service.
- **Your WebDAV server**, if you connect one. It receives your sites, settings, tag choices, and subscriptions, encrypted by default. Without encryption, its operator can read them.
- **Issue trackers**, when you choose **Report a problem** (prefilled with Anubis's version, your browser, and the engine) or a list's **Suggest changes**. They open in a new tab, and nothing is sent until you submit.

A list's host sees your IP address and which file was asked for, as with any download. Nothing else is sent.

## Permissions

- **The search engines' sites**, to change their results pages.
- **This wiki's [subscribe page](../subscribe.md)** (`bishop-v.github.io`), so subscribe links work. Anubis reads only the link's address.
- **Storage**, for your sites and settings.
- **The current tab, when you open the popup** (`activeTab`), to read the site's address.

Anubis runs on no other sites. It asks to read one more site only when you subscribe to a list hosted outside GitHub, or connect a sync server. In Firefox, Anubis declares no required data collection, and asks for browsing-activity consent only when you connect a sync server; **Disconnect** withdraws it.

## Questions

This page is Anubis's privacy policy. Changes are in its [history on GitHub](https://github.com/Bishop-V/anubis/commits/main/docs/guide/privacy.md). Ask anything by [opening an issue](https://github.com/Bishop-V/anubis/issues).
