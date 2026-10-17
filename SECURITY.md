# Security

## Reporting a vulnerability

Report it privately: **Security** tab → **Report a vulnerability**, or [the form](https://github.com/Bishop-V/anubis/security/advisories/new). Don't open a public issue.

Include your Anubis and browser versions, what an attacker can do and needs first, and the smallest list, link, or page that reproduces it. Don't attach a saved search page.

## What happens next

Once confirmed, the fix ships to both stores and the advisory is published, with credit if you want it. Please keep it private until then. Only the latest release is supported.

## What counts

Anubis has no server ([privacy](docs/guide/privacy.md)), so scope is the extension, its build, and its release:

- A list that does more than hide, rank, or tag: runs script, adds markup, reads or sends your data, connects elsewhere, or freezes the browser.
- A subscribe link that subscribes without asking.
- A search page that runs script in, changes, or reads Anubis.
- A permission used for more than it was asked for.
- A store package that doesn't match its tag's build, or a workflow weakness that could change a release.

Not vulnerabilities (open an ordinary issue): a list ranking sites you disagree with, an engine's page change breaking Anubis, or anything that needs control of your computer already.
