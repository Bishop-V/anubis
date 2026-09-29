# Tags

Tags are small labels under a result's title: "Official docs", "Discussion", "Paywall". They come from the lists you subscribe to and from your own choices.

![A result tagged "Reference"](../img/result.png)

## Tag a site yourself

Open the ⇅ menu on a result. Under **Tags**, press a tag to add it to the site, or press it again to remove it. To make a new tag, type its name in **New tag** and press **Add tag**.

Tags from lists appear in the menu too, but only the list can remove them.

## Decide what a tag does

A list decides which sites get a tag. You decide what the tag does, in **Settings → Tags**:

| Choice | What happens to results with the tag |
| --- | --- |
| **Follow the lists** | Whatever the list says (the default). Most lists only label. |
| **Label only** | Show the label, never change the ranking. |
| **Highlight** | Give the result a faint background in the tag's colour. |
| **Raise** / **Lower** | Move the result five places up or down. |
| **Hide** | Hide the result, whichever list tagged it. |

Turn off **Shown** to keep a tag working without showing its label under results. You can also rename a tag or change its colour there.

![Settings, Tags](../img/options-tags.png)

### Several tags on one result

When a result carries several tags you've set to **Raise** or **Lower**, Anubis weighs them together: each Raise moves it five places up and each Lower five places down.

| Tags on the result | Where it goes |
| --- | --- |
| One Raise | Five places up |
| Three Raise | Fifteen places up |
| Two Raise and one Lower | Five places up, as if it had one Raise |
| One Raise and one Lower | Where the search engine put it |

A tag counts once, however many of your lists give it. A tag set to **Hide** still hides the result, whatever the others say. **Why** in the result's ⇅ menu shows each tag's part and where the result ends up ("raise it by 5 each for “Official docs” and “Reference” and lower it by 5 for “Paywall”, so it moves 5 places up").

A ranking you gave a site yourself beats any tag. If you raised a site, a tag set to Hide won't hide it.

## Show only one tag

The summary above the results lists the tags on the page and how many results have each. Press one to show only those results; press **Show all** to go back.

## Shared tags

Tags are identified by a short id like `ai-slop`. When two lists use the same id, you see one tag fed by both. That's how lists by different people can build a shared vocabulary; see [the list format](../list-format.md#tags).
