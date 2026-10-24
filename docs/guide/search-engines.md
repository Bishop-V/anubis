# Search engines

Anubis works on these engines. Turn any of them off in **Settings → Search engines**.

| Engine | Load more results |
| --- | --- |
| Google | Yes, except on a phone |
| DuckDuckGo | Yes |
| DuckDuckGo HTML and Lite | No |
| Bing | Yes\* |
| Brave Search | Yes |
| Startpage | Yes |
| Ecosia | Yes\* |
| Kagi | No |
| Yahoo | Yes\* |
| Yandex | Yes\* |
| Mojeek (experimental) | Yes |

\* These sometimes ask for a [robot check](./more-results.md#robot-checks) before the next page.

Every engine but Mojeek has been checked on its live site. On Firefox for Android, Google, DuckDuckGo, and Bing work.

Web results are weighed everywhere. On most engines, the Images, Videos, and News tabs are tagged and hidden but not reordered. Shopping tabs are left alone.

## How results are found

By their shape (a heading and its link) rather than the page's class names, so small redesigns don't break it. Where that fails, Anubis uses [uBlacklist](https://github.com/ublacklist/builtin)'s layouts.

## When an engine breaks

See [Troubleshooting](./troubleshooting.md).
