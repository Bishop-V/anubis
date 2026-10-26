# Ranking sites

Every site has a *ranking*. Set it from the button beside any result, the toolbar popup, or **Settings → Your sites**.

<!-- Maintainer: on the site, RankDemo (docs/.vitepress/theme/rank-demo.ts) draws a site being pinned and another lowered, and the picture below, for reading on GitHub, is hidden. The generated screenshots on this page come from mock pages. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

<RankDemo />

<div class="github-only">

![A result with its tags, and its button in the column on its left](../img/result.png)

</div>

The button left of each result shows its ranking and opens the menu. On images and videos it's in the top-right corner, and on a phone it's the ⚖ after the title.

| Ranking | What happens |
| --- | --- |
| **Hide** | The site's results are hidden. |
| **Lower** | Down five places. Press again for ten, and a third time to undo. |
| **Normal** | Clears your ranking; tags and lists still apply. |
| **Raise** | Up five places. Press again for ten, and a third time to undo. |
| **Pin** | To the top. |

Raise and Lower add to what your lists and tags do; Pin and Hide override them. **Undo** in the summary reverses your last change.

## How much of the site

A ranking covers the site and its subdomains. The name at the top of the menu picks the level, such as `en.wikipedia.org` or all of `wikipedia.org`. The most specific one wins.

On Reddit, YouTube, Medium, GitHub, and similar sites, it also offers the part that's someone's own, such as `reddit.com/r/rust` or `youtube.com/@name`, when the address names it. A YouTube video's address doesn't name its channel, so a video is ranked with all of YouTube.

## Reranking

Anubis reorders only the results already on the page. To rank later pages too, use [Load more results](./more-results.md). To keep the engine's order, turn off **Settings → Results → Rerank results**.

## Hidden results

**Settings → Appearance → Hidden results** sets how they look:

- **Remove** (default): gone, and counted in the summary.
- **Collapse**: one line with a **Show** button.
- **Dim**: faded in place.

## Your sites

**Settings → Your sites** lists every site you've ranked. Edit them one by one or as text. The list syncs with your browser, and you can [publish it](./publish-a-list.md).

![Settings, Your sites](../img/options-sites.png)
