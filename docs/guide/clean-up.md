# Cleaning up pages

Search pages carry a lot that isn't results: AI answers, video panels, "People also ask". **Settings → Clean up** removes them on every search.

![Settings, Clean up](../img/options-cleanup.png)

| Switch | What it removes |
| --- | --- |
| **AI answers** | Google's AI Overview and its AI Mode tab, Bing's Copilot answers, Brave's AI answers. On DuckDuckGo, searches open in its no-AI version instead (see below). |
| **Videos** | Video and short-video panels between the results. |
| **People also ask** | Lists of other people's questions with expandable answers. |
| **Top stories** | News panels between the results. |
| **Images** | Rows of images between the results. The Images tab still works. |
| **Related searches** | Lists of other searches, usually at the bottom of the page. |

All of them start off.

## What was removed

The summary above the results says what went: "…and removed an AI answer and a video panel." **Show hidden** brings removed panels back on that page, with a dashed outline so you can tell them apart.

![The summary after cleaning up](../img/cleanup-summary.png)

## How panels are found

Anubis recognises a panel by its heading ("AI Overview", "Videos", "People also ask") rather than by the engine's internal names for it, which change often. It only removes panels between the results. The side panel on the right of Google's results is left alone, and so is anything containing a result or the search box.

Headings are recognised in English and some common translations (French, German, Spanish, Portuguese, Italian and Dutch). If a panel in your language isn't removed, [open an issue](https://github.com/Bishop-V/anubis/issues) with the heading's exact text.

## Stopping AI answers at the source

Removing a panel after the engine sends it depends on recognising it. Two engines have their own switch for a page without AI, and Anubis uses them:

- **DuckDuckGo:** with **AI answers** on, searches open on `noai.duckduckgo.com`, DuckDuckGo's own version without Search Assist or Duck.ai.
- **Google:** **Always open the Web tab** opens Google's own "Web" view (the one under **More → Web**), which shows plain links with no AI Overview and no panels at all. This is a separate switch because it removes everything that isn't a link, including panels you might want. To see the usual page for one search, choose **All** above the results.
