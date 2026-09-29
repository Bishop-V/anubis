# Security

Anubis runs on search pages and reads lists written by other people, so a flaw in it can reach everyone who subscribes to a list. Please report one privately so it can be fixed before it's public.

## Reporting a vulnerability

Use GitHub's private reporting: the repository's **Security** tab → **Report a vulnerability**, or go straight to [the form](https://github.com/Bishop-V/anubis/security/advisories/new). Only the maintainers see the report. Don't open a public issue or pull request for it.

Include:

- the Anubis version (in `about:addons` or `chrome://extensions`) and the browser
- what an attacker can do, and what they need first (a list you subscribe to, a link you open, a search page they control)
- the steps to reproduce it, with the smallest list, link or page that shows it

Don't attach a page saved from a real search: it holds your account, your location and more. A few lines of HTML that show the problem are enough.

## What happens next

You'll get a reply on the report. Once the problem is confirmed, the fix goes out in a new release to the Chrome, Firefox and Edge stores, and the advisory is published on GitHub with credit to you, if you'd like it. Store review can take a few days, so please keep the details private until the fixed version is available.

Only the latest release is supported. There are no fixes for older versions: the stores update the extension automatically.

## What counts

Anubis has no server and collects nothing (see [Privacy and permissions](docs/guide/privacy.md)), so everything in scope is in the extension, its build and its release. For example:

- **A list that does more than a list can.** Lists hide, rank and tag sites. A list that runs script, puts markup on a page, reads your personal list or settings, sends anything anywhere, makes Anubis connect to a site other than the one it's hosted on, or freezes the browser (a pattern slow enough to hang it) is a vulnerability.
- **A subscribe link that subscribes without asking.** Anyone can make one, so Settings always asks first.
- **A search page, or a result on it, that gets into Anubis:** runs script in its menu or summary, changes your lists or settings, or reads them.
- **Permissions used for more than they're asked for,** such as a list site's permission used for anything but downloading that list.
- **The release:** a store package that doesn't match the build of its tag (the build is deterministic, so anyone can check), or a weakness in the GitHub workflows that could change what's released.

Not vulnerabilities, but welcome as ordinary issues:

- A list you subscribed to hiding, lowering or tagging sites you'd rather it didn't: that's what lists do. Tell the list, with "Report it to…" in the ⇅ menu on the result.
- A search engine changing its page so that Anubis misses results or its buttons disappear.
- Anything that needs someone to have control of your browser or computer already.
