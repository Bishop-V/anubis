# Search engines

Anubis works on the web results of these engines. Turn any of them off in **Settings → Search engines**.

| Engine | Load more results | Checked on the live site |
| --- | --- | --- |
| Google (every country's domain) | Yes | Yes, results and clean-up. The phone layout isn't yet. |
| DuckDuckGo | Yes | Yes |
| DuckDuckGo HTML and Lite | No | Yes |
| Bing | Yes* | Yes |
| Brave Search | Yes | Yes |
| Startpage | No | Yes |
| Ecosia | Yes* | Yes |
| Kagi | No | Not yet |
| Yahoo | Yes* | Yes |
| Yandex | No | Not yet |
| Mojeek | No | Not yet |

\* Bing, Ecosia and Yahoo sometimes answer the request for the next page with a "confirm you're not a robot" check. Load more results then stops without saying why. If that happens, use the engine's own Next link.

Only the main web results are changed. Image, video, news and shopping tabs are left alone.

## How results are found

Search engines change the look of their pages often, and the internal names they use change with it. Where it can, Anubis finds results by their shape instead: a heading, the link around it, and the smallest block that holds only that result. Small redesigns don't break that.

For engines where titles aren't headings, Anubis uses the result layouts that the [uBlacklist](https://github.com/ublacklist/builtin) project keeps up to date.

## When an engine breaks

If results on an engine stop getting tags or buttons, or the summary lands in the wrong place, see [Troubleshooting](./troubleshooting.md).
