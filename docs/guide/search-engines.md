# Search engines

Anubis works on the web results of these engines. Turn any of them off in **Settings → Search engines**.

| Engine | Support | Load more results | Checked on the live site |
| --- | --- | --- | --- |
| Google (every country's domain) | Supported | Yes | Yes, results and clean-up. The phone layout isn't yet. |
| DuckDuckGo | Supported | Yes | Yes |
| DuckDuckGo HTML and Lite | Supported | No | Yes |
| Bing | Supported | Yes* | Yes |
| Brave Search | Supported | Yes | Yes |
| Startpage | Supported | Yes | Yes |
| Ecosia | Supported | Yes* | Yes |
| Kagi | Supported | No | Yes |
| Yahoo | Supported | Yes* | Yes |
| Yandex | Supported | Yes* | Yes |
| Mojeek | Experimental | No | Not yet |

On Firefox for Android, where support is experimental, Google, DuckDuckGo, and Bing send phones a layout of their own, and Anubis reads each one. These three have been tried on a phone; the other engines' phone layouts haven't yet.

**Supported** means it has been tried on the live site. **Experimental** means it follows the layout other tools document but hasn't been tried on the live site yet, so some things may not work.

\* Bing, Ecosia, Yahoo, and Yandex sometimes answer the request for the next page with a "confirm you're not a robot" check. Load more results then stops without saying why. If that happens, use the engine's own Next link.

The main web results are weighed everywhere. Beyond them:

- **Images, Videos, and News tabs** are weighed on DuckDuckGo, Bing, Brave Search, Ecosia, Kagi, Startpage, and Yandex (Videos only), and on Google's Images and News tabs. Google's Videos tab lists results like the web does, so it's weighed like web results. Pictures and videos are tagged and hidden but not reordered, so the grid keeps its shape. Hidden ones leave no gap. None of these tabs has been checked on the live sites yet.
- **Left alone:** the tabs of Yahoo and Mojeek, Yandex's other tabs, and every shopping tab.

## How results are found

Search engines change the look of their pages often, and the internal names they use change with it. Where it can, Anubis finds results by their shape instead: a heading, the link around it, and the smallest block that holds only that result. Small redesigns don't break that.

For engines where titles aren't headings, Anubis uses the result layouts that the [uBlacklist](https://github.com/ublacklist/builtin) project keeps up to date.

## When an engine breaks

If results on an engine stop getting tags or buttons, or the summary lands in the wrong place, see [Troubleshooting](./troubleshooting.md).
