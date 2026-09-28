# Privacy and permissions

Anubis has no server and collects nothing. Everything it knows about you stays in your browser.

## What's stored, and where

- **Your list, settings, tag choices and subscriptions** are kept in your browser's sync storage. If you're signed in to your browser (a Firefox or Google account) with sync on, the browser copies them to your other computers. Anubis never sees them. If your list grows too big for sync storage, it's kept on this computer only.
- **Downloaded lists** are kept only on this computer, and downloaded again elsewhere.

## What Anubis connects to

Only these, and only when you use the feature:

- **The lists you subscribe to**, from wherever they're hosted, to check for new versions.
- **The search engine you're on**, for [Load more results](./more-results.md), which loads its next page like the "Next" link would.
- **`noai.duckduckgo.com`**, if [AI answers](./clean-up.md) are removed, because DuckDuckGo searches open there. On Google, the Web tab option adds `udm=14` to the search's address.
- **Issue trackers**, when you choose "Suggest it to…". That opens a page in a new tab; nothing is sent unless you submit the issue yourself.

## Permissions

When you install Anubis, your browser asks for:

- **Access to the search engines' sites**, so Anubis can change their results pages. It runs on those sites only.
- **Storage**, to keep your list and settings.
- **The current tab, when you open the toolbar popup** (called `activeTab`). This lets the popup read the address of the site you're on, so you can rank it. It shows no install warning and lasts until that tab goes to another page.

Anubis may also ask, at the moment you subscribe, to **read from one website** that hosts a list. That's needed for lists hosted anywhere other than GitHub or a gist. You can take it back in your browser's extension settings.

In Firefox, Anubis declares that it collects no data.
