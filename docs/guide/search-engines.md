# Search engines

Turn any engine off in **Settings → Search engines**.

| Engine | Support | Load more results |
| --- | --- | --- |
| Google | Supported | Yes |
| DuckDuckGo | Supported | Yes |
| DuckDuckGo HTML and Lite | Supported | No |
| Bing | Supported | Yes* |
| Brave Search | Supported | Yes |
| Startpage | Supported | Yes |
| Ecosia | Supported | Yes* |
| Kagi | Supported | No |
| Yahoo | Supported | Yes* |
| Yandex | Supported | Yes* |
| Mojeek | Experimental | Yes |

**Supported** engines have been checked on their live sites; **experimental** ones haven't yet. On Firefox for Android, Google, DuckDuckGo, and Bing work.

\* These sometimes ask for a [robot check](./more-results.md#robot-checks) before the next page.

Web results are weighed everywhere. Images, Videos, and News tabs are tagged and hidden but not reordered, on most engines. Shopping tabs are left alone.

## How results are found

By their shape (a heading and its link) rather than the page's class names, so small redesigns don't break it. Where that fails, Anubis uses [uBlacklist](https://github.com/ublacklist/builtin)'s layouts.

## When an engine breaks

See [Troubleshooting](./troubleshooting.md).
