# Loading more results

Search engines send one page of results at a time, so Anubis can only rerank what's on that page. **Load more results**, in the summary above the results, brings the next page onto the current one and ranks everything together. A site you pinned that only appears on page 3 rises to the top after two presses. On a phone, it's under **Details** in the summary.

Results from later pages are marked "From page 2" and so on, with a small hollow mark, under their titles. They go right after the last result, so the engine's own page links stay at the bottom.

## Automatically

**Settings → Appearance → Load more results automatically** loads the number of extra pages you type, from 0 (off) to 20, on every search. It's off by default. Each extra page is another request to the search engine and adds about a second to the search. Engines may show a CAPTCHA or slow down if they get too many, and most stop sending pages before 20. The setting says what the amount you type will cost. It starts once the engine's own "Next" link or "More results" button has arrived at the foot of the page, and the button in the summary shows from then on too.

## How it works

- **DuckDuckGo:** Anubis presses DuckDuckGo's own "More results" button.
- **Google, Bing, and Yahoo:** Anubis follows the page's "Next" link in the background and adds the results to the current page.
- **Brave Search and Ecosia:** Anubis asks for the next page the same way the page's own links do.

Requests only go to the search engine you're on, and pages are loaded one at a time with a short pause between them. If the engine sends a page without results, often because it wants you to confirm you're not a robot, Anubis tries once more by opening that page out of sight, as if you had opened it yourself, and then closes it again.

## When it stops

When a page doesn't come, the summary says why under its first line, for example "Bing sent no results for page 3", and **Open page 3** opens that page in a new tab so you can see what the engine sent. If it asks you to confirm you're not a robot, do that there, then press **Load more results** again. An engine that asks Anubis to slow down gets one more try after a short wait. When the engine sends only results that are already on the page, there are no more, and the button goes away. Startpage, Kagi, Yandex, Mojeek, and the DuckDuckGo HTML and Lite versions don't support it yet.
