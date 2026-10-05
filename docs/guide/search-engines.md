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
| Kagi | Experimental | No | Not yet |
| Yahoo | Supported | Yes* | Yes |
| Yandex | Experimental | No | Not yet |
| Mojeek | Experimental | No | Not yet |

**Supported** means it has been tried on the live site. **Experimental** means it follows the layout other tools document but hasn't been tried on the live site yet, so some things may not work.

\* Bing, Ecosia, and Yahoo sometimes answer the request for the next page with a "confirm you're not a robot" check. Load more results then stops without saying why. If that happens, use the engine's own Next link.

Only the main web results are changed. Image, video, news, and shopping tabs are left alone.

## How results are found

Search engines change the look of their pages often, and the internal names they use change with it. Where it can, Anubis finds results by their shape instead: a heading, the link around it, and the smallest block that holds only that result. Small redesigns don't break that.

For engines where titles aren't headings, Anubis uses the result layouts that the [uBlacklist](https://github.com/ublacklist/builtin) project keeps up to date.

## When an engine breaks

If results on an engine stop getting tags or buttons, or the summary lands in the wrong place, see [Troubleshooting](./troubleshooting.md).
