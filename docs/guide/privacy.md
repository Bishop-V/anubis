# Privacy and permissions

Anubis has no server and collects nothing. Everything it knows about you stays in your browser.

## What's stored, and where

- **Your list, settings, tag choices and subscriptions** are kept in your browser's sync storage. If you're signed in to your browser (a Firefox or Google account) with sync on, the browser copies them to your other computers. Anubis never sees them. If your list grows too big for sync storage, it's kept on this computer only.
- **Downloaded lists** are kept only on this computer, and downloaded again elsewhere.

## What Anubis connects to

Only these:

- **The lists you subscribe to**, from wherever they're hosted, to check for new versions once a day, or less often when a list says so (Anubis's own lists: once a week). This starts when you install Anubis, because it subscribes you to four lists of its own, hosted on GitHub. You can turn them off under **Settings → Lists**.
- **The directory of lists** on GitHub, when you open **Settings → Lists**, so **More lists** shows the newest ones.
- **The search engine you're on**, for [Load more results](./more-results.md), which loads its next page like the "Next" link would.
- **`noai.duckduckgo.com`**, if [AI answers](./clean-up.md) are removed, because DuckDuckGo searches open there. On Google, the Web tab option adds `udm=14` to the search's address.
- **Issue trackers**, when you choose "Report it to…" or "Suggest it to…". That opens a page in a new tab, with the result's address (without anything after `?`, which can carry details of your visit) and the rule that matched; nothing is sent unless you submit the issue yourself.

Downloading a list works like any other download: the site hosting it sees your IP address and which file was asked for. Anubis sends nothing else with it: no cookies, no identifier, and nothing about your searches.

## Permissions

When you install Anubis, your browser asks for:

- **Access to the search engines' sites**, so Anubis can change their results pages.
- **Access to this guide's [subscribe page](../subscribe.md)**, so a subscribe link can open Anubis's settings with a list filled in. Your browser names it after the site this guide is on, `bishop-v.github.io`. Anubis reads only the link's address there.
- **Storage**, to keep your list and settings.
- **The current tab, when you open the toolbar popup** (called `activeTab`). This lets the popup read the address of the site you're on, so you can rank it. It shows no install warning and lasts until that tab goes to another page.

Anubis runs on no other sites.

Anubis may also ask, at the moment you subscribe, to **read from one website** that hosts a list. That's needed for lists hosted anywhere other than GitHub or a gist. You can take it back in your browser's extension settings.

In Firefox, Anubis declares that it collects no data.

## Questions

This page is Anubis's privacy policy, and the Chrome Web Store and Firefox Add-ons listings link to it. If it changes, the change is in the [page's history on GitHub](https://github.com/Bishop-V/anubis/commits/main/docs/guide/privacy.md). Ask anything about it by [opening an issue](https://github.com/Bishop-V/anubis/issues).
