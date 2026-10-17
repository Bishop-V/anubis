# Subscribing to lists

A list tags, ranks, or hides sites for you. Anyone can publish one as a text file on the web.

Anubis starts with these lists: **Official docs**, **Discussions**, **Reference**, **Paywalls**, **FOSS tools**, **AI content**, and **Independent wikis**. Turn any off in **Settings → Lists**.

<!-- Maintainer: this generated screenshot comes from the mock Settings page. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark image and its description together. -->

![Settings, Lists](../img/options-lists.png)

## Subscribe

- **Settings → Lists → More lists**, and press **Subscribe**.
- Or **Subscribe** on the [Lists directory](../lists.md) or a list's own page.
- Or paste its address into **Add a list**. GitHub, GitLab, Codeberg, gist, and Goggle links all work.

Lists hosted outside GitHub ask for permission to read that one site.

## What lists work

- Anubis lists (`.anubis`)
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- [uBlacklist](https://github.com/iorate/ublacklist) rulesets
- Plain domain lists and hosts files

Rules Anubis can't use are skipped and counted.

::: warning Lenses
Some Goggles are *lenses*: they hide every site they don't list. Anubis marks them "lens".
:::

## Updates

Lists update about once a day. **Update all** in **Settings → Lists** checks now.

## Lists made from other projects

These are rebuilt weekly from other projects' data. To change one, contribute to its source.

| List | Source | What it does |
| --- | --- | --- |
| **AI content** | [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist) by laylavish (CC0) | Tags AI-generated sites. |
| **Official docs (DevDocs)** | [DevDocs](https://github.com/freeCodeCamp/devdocs) by its contributors (MPL-2.0) | Tags and slightly raises about 210 docs sites. |
| **Self-hosted FOSS** | [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) by its contributors (CC BY-SA 3.0) | Tags about 1,000 self-hostable programs FOSS. |
| **Independent wikis** | [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy) by Kevin Payravi (MIT) | Raises independent wikis and lowers the Fandom wikis they replace. |

## Turn off, or unsubscribe

Each list has a switch and an unsubscribe button. To overrule a list on one site, rank the site yourself.

## Report a mistake in a list

A result's menu names the lists behind its ranking. Press **suggest changes** beside a list in **Settings → Lists** to tell its maintainers.

## Suggest a site to a list

Use **suggest changes** beside the list in **Settings → Lists**.
