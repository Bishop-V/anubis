# Loading more results

Search engines send one page of results at a time, so Anubis can only rerank what's on that page. **Load more results**, in the summary above the results, brings the next page onto the current one and ranks everything together. A site you pinned that only appears on page 3 rises to the top after two presses. On a phone, it's under **Details** in the summary.

Results from later pages are marked "From page 2" and so on, with a small hollow mark, under their titles. They go right after the last result, so the engine's own page links stay at the bottom.

## Automatically

**Settings → Appearance → Load more results automatically** loads the number of extra pages you type, from 0 (off) to 20, on every search. It's off by default. Each extra page is another request to the search engine and adds about a second to the search. Engines may show a CAPTCHA or slow down if they get too many, and most stop sending pages before 20. The setting says what the amount you type will cost. It starts once the engine's own "Next" link or "More results" button has arrived at the foot of the page, and the button in the summary shows from then on too.

## How it works

- **DuckDuckGo:** Anubis presses DuckDuckGo's own "More results" button.
- **Google, Bing, and Yahoo:** Anubis follows the page's "Next" link in the background and adds the results to the current page.
- **Brave Search and Ecosia:** Anubis asks for the next page the same way the page's own links do.

Requests only go to the search engine you're on, and pages are loaded one at a time with a short pause between them. If the engine sends a page without results, often because it wants you to confirm you're not a robot, Anubis tries once more by opening that page out of sight, as if you had opened it yourself, and then closes it again. Ecosia doesn't allow that, so there Anubis stops at once.

## When it stops

When a page doesn't come, the summary says why under its first line, for example "Bing sent no results for page 3" or "Ecosia wants to check you're not a robot before it sends page 2", and **Open page 3** opens that page in a new tab so you can see what the engine sent. If it asks you to confirm you're not a robot, do that there, then press **Load more results** again (see [Robot checks](#robot-checks)). An engine that asks Anubis to slow down gets one more try after a short wait. When the engine sends only results that are already on the page, there are no more, and the button goes away. Startpage, Kagi, Yandex, Mojeek, and the DuckDuckGo HTML and Lite versions don't support it yet.

## Robot checks

Search engines watch for traffic that looks automated, and a request for the next page can look like that to them. When an engine wants you to confirm you're not a robot, Load more results stops and says so, for example "Ecosia wants to check you're not a robot before it sends page 2". Anubis never answers the check for you or tries to get around it.

To carry on, press **Open page 2** (or whichever page it names), confirm you're not a robot on that page, then come back and press **Load more results** again. The engine usually lets the next pages through for a while after that. If it keeps asking, use the engine's own Next link instead, or load fewer pages automatically: each one is another request.

Ecosia asks often. It also doesn't let its pages be opened out of sight, so on Ecosia Anubis stops at once instead of trying again that way.
