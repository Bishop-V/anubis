# Removing panels

**Settings → Remove panels** takes the parts you choose off every search page. All start off.

<!-- Maintainer: the generated screenshots on this page come from mock pages. If the shown interface changes, run `node e2e/run.mjs docs`, then update the affected light/dark images and their descriptions together. -->

![Settings, Clean up](../img/options-cleanup.png)

| Switch | Removes |
| --- | --- |
| **AI answers** | Google's AI Overview and AI Mode, Duck.ai, and Bing's and Brave's AI answers. |
| **Video panels** | Video and short-video panels. |
| **People also ask** | Expandable question lists. |
| **Discussion panels** | Forum panels. Forum results stay. |
| **Top stories** | News panels. |
| **Image rows** | Rows of images. |
| **Related searches** | "Related searches" and "People also search for". |
| **Other search engines** | Buttons that repeat your search elsewhere. |
| **Ads** | Sponsored results and product carousels. |
| **Requests to allow ads** | Banners asking you to allow ads. |

## What was removed

The summary says what went. **Show hidden** brings it back, outlined.

![The summary after cleaning up](../img/cleanup-summary.png)

## How panels are found

By their headings, in English, French, German, Spanish, Portuguese, Italian, and Dutch. If one isn't removed in your language, [open an issue](https://github.com/Bishop-V/anubis/issues) with its heading.

## Stopping AI answers at the source

On Google, **Always open the Web tab** opens Google's plain list of links, with no AI and no panels. Choose **All** above the results for the usual page.
