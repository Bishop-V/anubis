# Tags

Tags are labels under a result's title, like "Official docs" or "Paywalled". They come from your lists and from you. You choose what each one does.

<!-- Maintainer: the generated screenshots on this page come from mock pages. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

![A result tagged "Reference"](../img/result.png)

## Tag sites yourself

- **On any site:** open the toolbar popup and press a tag under **Tags**, or type a **New tag**.
- **On a search page:** open a result's menu and press **+ Tag**.
- **In Settings → Tags:** press **Edit** on a tag to rename it, add or remove sites, and note why each site fits.

Tags you gave a site are bold and underlined. Tags from a list say which list, and only that list can remove them.

To put tags in your own order, drag them by the dots in **Settings → Tags**, or focus the dots and press the up and down arrows. The popup and the result menu follow that order.

![Settings, Tags, with an expanded tag showing the optional explanation field for a site](../img/options-tags.png)

## Decide what a tag does

Lists choose which sites get a tag. You choose what the tag does, in **Settings → Tags**:

| Choice | Results with the tag |
| --- | --- |
| **Follow the lists** | Do what the list says (default). Most lists only label. |
| **Label only** | Keep their place. |
| **Highlight** | Get a faint background in the tag's colour. |
| **Pin** | Go to the top. |
| **Raise** / **Lower** | Move five places up or down. |
| **Hide** | Are hidden. |

Turn off **Shown** to keep a tag working without its label.

### See what a tag does to a result

A tag that moves or hides a result shows a pin, an arrow, or a crossed-out eye in place of its diamond.

### Several tags on one result

Each Raise tag moves a result five places up, and each Lower tag five down, so they add up or cancel out. A Hide tag always hides, unless you ranked the site yourself. The result's menu says which lists and tags moved it.

## Show only one tag

Press a tag under a result to show only the results with that tag. Press it again, or **Show all** in the summary, to go back. The toolbar popup has the same tags under **This page**.

## Whose tag is it

A list owns its tags' names and colours, and the sites it tags. You own your sites. Your renames and colours show over the list's, and neither side overwrites the other. If a list drops a tag you use, it moves to **Your tags**.

Lists that use the same tag id, like `paywall`, share one tag. See [the list format](../list-format.md#tags).
