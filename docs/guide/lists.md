# Subscribing to lists

A list tags, ranks, or hides sites for you. Anyone can publish one as a text file on the web.

Anubis starts with nine lists. Most tag official docs, discussions, reference sites, paywalls, free software, or AI content; one raises independent wikis over Fandom. The [Lists directory](../lists.md) marks them. Turn any of them off in **Settings → Lists**.

<!-- Maintainer: this generated screenshot comes from the mock Settings page. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark image and its description together. -->

![Settings, Lists](../img/options-lists.png)

## Subscribe

- In **Settings → Lists → More lists**, press **Subscribe**.
- Or press **Subscribe** on the [Lists directory](../lists.md) or on a list's own page.
- Or paste a list's address into **Add a list**. GitHub, GitLab, Codeberg, gist, and Goggle links all work.

A list hosted outside GitHub asks for permission to read that one site.

## What lists work

- Anubis lists (`.anubis`)
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- [uBlacklist](https://github.com/iorate/ublacklist) rulesets
- Plain domain lists and hosts files

Rules Anubis can't use are skipped and counted.

::: warning Lenses
Some Goggles are *lenses*: they hide every site they don't list. Anubis marks them "lens".
:::

## Manage your lists

- **Turn off or unsubscribe:** each list has a switch and an unsubscribe button. To overrule a list on one site, [rank the site](./ranking.md) yourself.
- **Reorder:** drag a list by the dots at its start, or focus them and press the up and down arrows. Tags from lists higher up come first on results.
- **Update:** lists update about once a day. **Update all** checks now. Point at a list's ↻ to see its size and when it last updated.

## Suggest changes to a list

A result's menu names the lists behind its ranking. To add a site to one of them, take a site off, or report something else, press **Suggest changes** beside the list in **Settings → Lists**. Anubis opens an issue on the list's tracker, filled in for you, and nothing is sent until you submit it there.

## Lists made from other projects

These are rebuilt weekly from other projects' data. To change one, contribute to its source.

| List | Source | What it does |
| --- | --- | --- |
| **AI content** | [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist) by laylavish (CC0) | Tags AI-generated sites. |
| **DevDocs** | [DevDocs](https://github.com/freeCodeCamp/devdocs) by its contributors (MPL-2.0) | Tags about 210 docs sites and raises them slightly. |
| **Self-hosted FOSS** | [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) by its contributors (CC BY-SA 3.0) | Tags about 1,000 self-hostable programs as FOSS. |
| **Independent wikis** | [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy) by Kevin Payravi (MIT) | Raises independent wikis and lowers the Fandom wikis they replace. |
