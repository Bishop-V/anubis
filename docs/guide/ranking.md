# Ranking sites

Every site has a *ranking*, which you choose from the ⚖ button on any of its results, from the toolbar popup, or in **Settings → Your sites**.

<!-- Maintainer: on the site, RankDemo (docs/.vitepress/theme/rank-demo.ts) draws a site being pinned and another lowered, and the picture below, for reading on GitHub, is hidden. The generated screenshots on this page come from mock pages. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

<RankDemo />

<div class="github-only">

![A result with its tags and the ⚖ button](../img/result.png)

</div>

The button's balance tips with the site's ranking: down on the left for a lowered site, up for a raised one, and level for the rest. A pinned site's button shows a gold pin; a hidden site's (once you show it) shows a crossed-out eye. The result has no separate "Raised" or "Lowered" label, since the button already shows its ranking. A tag that moves or hides the result [shows that in place of its diamond](./tags.md#see-what-a-tag-does-to-a-result).

The balance in the menu weighs everything together: your ranking, your tags, and your lists. The further a result moves, the further it tips, so a site you raised twice, or one with two tags you set to Raise, tips further than a single raise.

| Ranking | What happens to the site's results |
| --- | --- |
| **Hide** | They disappear, or shrink to one line you can open (see [Hidden results](#hidden-results)). |
| **Lower** | They move five places down. Choose it again for ten places, and the arrow gets a second arrow. A third press takes it back. |
| **Normal** | Takes your own ranking back, so your tags and lists weigh the site as they would without it. |
| **Raise** | They move five places up. Choose it again for ten places, and the arrow gets a second arrow. A third press takes it back. |
| **Pin** | They go to the top, with a thin gold outline (grey with the Plain colours in **Settings → Appearance**). |

Your choice beats your lists. If a list lowers a site and you raise it, it's raised. Your choice adds to [the tags you set to Pin, Raise, or Lower](./tags.md#several-tags-on-one-result) rather than replacing them: a site you raise that carries a tag you set to Lower stays where the engine put it. A tag you set to Hide doesn't hide a site you ranked yourself, so ranking a site is how to keep one site that a Hide tag would hide. Without a choice of yours, the lists' rankings and your tags add up.

After a change from the menu, the summary above the results says what you did ("Hid fandom.com.") with an **Undo** button. Undo puts the site back as it was before you opened its menu, tags included, even after several changes. It stays until your next search, or until you change another site.

## How much of the site

A ranking covers a site and all of its subdomains. The name at the top of the menu chooses the level: choosing `wikipedia.org` covers every language's Wikipedia, and `en.wikipedia.org` only the English one. The most specific choice wins, so you can hide `fandom.com` and still raise `minecraft.fandom.com`.

On services where anyone can publish their own site, such as `github.io` or `blogspot.com`, the choices stop at that person's site: `someone.github.io` doesn't offer all of `github.io`. If you had already ranked the whole service, it is still offered, so you can change it.

## Reranking

Anubis reorders the results already on the page; it can't fetch results the engine didn't send. A raised result from the bottom of page 1 moves up, but a site that's only on page 3 needs [Load more results](./more-results.md) first.

To keep the engine's order and only use tags and hiding, turn off **Settings → Appearance → Rerank results**.

## Hidden results

**Settings → Appearance → Hidden results** sets how hidden results look:

- **Remove** (the default): gone from the page. The summary above the results counts them, and **Show hidden** brings them back.
- **Collapse**: one line naming the site and why it's hidden, with a **Show** button. Hidden results in a row share one line ("fandom.com and 5 more hidden by your list"), and its **Show** brings back all of them.
- **Dim**: left in place, faded.

## Your sites

**Settings → Your sites** lists every site you've ranked, with its tags. Change a ranking there, add a site by name, or edit the whole list as text.

![Settings, Your sites](../img/options-sites.png)

Your sites are saved as a list in the [Anubis list format](../list-format.md), so you can [publish it](./publish-a-list.md) for others to subscribe to. It's kept in your browser's sync storage, so it follows you to other computers where you're signed in to the same browser account ([more about sync](./sync.md)).
