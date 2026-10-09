# Tags

Tags are small labels under a result's title: "Official docs", "Discussion", "Paywalled". They come from the lists you subscribe to and from your own choices.

<!-- Maintainer: the generated screenshots on this page come from mock pages. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

![A result tagged "Reference"](../img/result.png)

## Tag a site yourself

On any website, open the Anubis toolbar popup. Under **Tags**, press a tag to add it to the site, or press it again to remove it. To make a new tag for the site, type its name in **New tag** and press **Add tag**. On search pages, the ⚖ menu on each result offers the same controls.

Your own tags are under **Your tags**, and the tags your lists use are under **Tags from lists**. You can add a tag from a list to any site, and that changes only your own list, not the list's. A tag you gave the site is in bold and underlined in its colour. A tag a list gave the site is plain, with the list's name after it ("from Paywalls"): only the list can take it off, and **Wrong? Report it** in the ⚖ menu tells its maintainers.

## Whose tag is it

Three things make a tag, and each has one owner:

| What | Who changes it |
| --- | --- |
| Its id, such as `paywall` | Nobody: lists that use the same id share the tag ([Shared tags](#shared-tags)). |
| Its name, colour, and description | The list that defines it. Your renaming or recolouring in **Settings → Tags** shows over the list's and is never overwritten. |
| Which sites carry it | Each list for its own sites, and you for yours. A list's update never changes your sites, and your sites never change the list. |

When you add a list's tag to one of your sites, your list keeps a copy of the tag's name, colour, and description. While the list defines the tag, you see the list's version, so its updates reach you. If the list stops using the tag, or you unsubscribe, your sites keep it under the same name, and it moves to **Your tags**.

## See where a tag comes from

**Settings → Tags** has two groups. **Your tags** are the ones you made, or that only your own sites use. **Tags from lists** are the ones your subscribed lists give sites, and each says which lists it is from, for example "From Paywalls". A tag of yours that a list also uses says "Also used by" and the list's name. Unsubscribe from a list and its tags leave the second group.

## Decide what a tag does

A list decides which sites get a tag. You decide what the tag does, in **Settings → Tags**:

| Choice | What happens to results with the tag |
| --- | --- |
| **Follow the lists** | Whatever the list says (the default). Most lists only label. |
| **Label only** | Show the label, never change the ranking. |
| **Highlight** | Give the result a faint background in the tag's colour. |
| **Pin** | Put the result at the top, as if you'd pinned its site. |
| **Raise** / **Lower** | Move the result five places up or down. |
| **Hide** | Hide the result, whichever list tagged it. |

Under each tag's name, one line says which sites carry it and what happens to them, for example "Marks 23 sites from Paywalls. Only a label: their ranking stays the same." The Paywalls list only labels; to lower paywalled sites, choose **Lower** for the tag.

### See what a tag does to a result

Under a result, each tag starts with a diamond in its colour. When the tag moves or hides that result, a pin (it pins it), an arrow up (it raises it), an arrow down (it lowers it), or a crossed-out eye (it hides it) takes the diamond's place. This shows your choice for the tag, or, when you follow the lists, what the list does. The same marks show in the result's ⚖ menu and in the toolbar popup.

Turn off **Shown** to keep a tag working without showing its label under results. Press a tag's colour to change it. To see every tag in grey on search pages, choose **Plain** in **Settings → Appearance → Colours on search pages**. Tags are then told apart by their names.

## Tag sites yourself

Press **Edit** beside a tag to open it. There you can:

- rename it, and give your own tags a description;
- see your sites with the tag, and press × to untag one;
- tag more sites: type one, or several separated by spaces or commas, and press **Add site**. You can optionally add one explanation for the site or sites; each note is saved with its site rule as a comment;
- see the first sites each of your lists gives the tag.

The ⚖ button on a search result tags that result's site the same way.

The bin beside one of your own tags deletes it and takes it off your sites. Anubis doesn't ask first: it says what it deleted, with **Undo** beside it for a few seconds.

![Settings, Tags, with an expanded tag showing the optional explanation field for a site](../img/options-tags.png)

### Several tags on one result

When a result carries several tags you've set to **Raise** or **Lower**, Anubis weighs them together: each Raise moves it five places up and each Lower five places down.

| Tags on the result | Where it goes |
| --- | --- |
| One Raise | Five places up |
| Three Raise | Fifteen places up |
| Two Raise and one Lower | Five places up, as if it had one Raise |
| One Raise and one Lower | Where the search engine put it |

A tag counts once, however many of your lists give it. A tag set to **Hide** still hides the result, whatever the others say. **Why** in the result's ⚖ menu shows each tag's part and where the result ends up ("raise it by 5 each for “Official docs” and “Reference” and lower it by 5 for “Paywall”, so it moves 5 places up").

A ranking you gave a site yourself adds to its tags. If you raised a site and it has a tag set to Lower, they cancel out. A tag set to Hide doesn't hide a site you ranked yourself, so you can keep one site that the tag would hide. If you hid a site yourself, it stays hidden whatever its tags say.

## Show only one tag

The summary above the results lists the tags on the page and how many results have each. Press one to show only those results; press **Show all** to go back. On a phone, press **Details** in the summary to see them.

## Shared tags

Tags are identified by a short id like `ai-slop`. When two lists use the same id, you see one tag fed by both, under the name the first list gives it. There's nothing extra to subscribe to: lists by different people build a shared vocabulary by using the same ids; see [the list format](../list-format.md#tags).
