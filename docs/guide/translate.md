# Help translate

::: warning Machine translated: use with caution
Anubis is written in English, the only language it fully supports. The languages below are machine translations that no speaker has checked yet. If one leaves you unsure, set your browser to English.
:::

Anubis uses your browser's language. Messages a translation lacks, or whose English has changed since, show in English. Tag names stay as their lists wrote them.

## Machine-translated languages

| Language | Folder | Checked by a speaker |
| --- | --- | --- |
| Arabic | `ar` | Not yet |
| Bengali | `bn` | Not yet |
| Chinese (Simplified) | `zh_CN` | Not yet |
| Chinese (Traditional) | `zh_TW` | Not yet |
| French | `fr` | Not yet |
| German | `de` | Not yet |
| Hindi | `hi` | Not yet |
| Indonesian | `id` | Not yet |
| Italian | `it` | Not yet |
| Japanese | `ja` | Not yet |
| Korean | `ko` | Not yet |
| Portuguese (Brazil) | `pt_BR` | Not yet |
| Russian | `ru` | Not yet |
| Spanish | `es` | Not yet |
| Turkish | `tr` | Not yet |
| Urdu | `ur` | Not yet |
| Vietnamese | `vi` | Not yet |

Urdu shows in Firefox only. If you speak one of these languages, correcting it helps most; once you've read a whole language through, change its "Not yet".

## How to translate

Each language is a folder in [the repository](https://github.com/Bishop-V/anubis), `locales/<code>/`, with `messages.json`. Send changes as a pull request.

- **Correct a language:** edit its `messages.json`, then run `node scripts/locales.mjs record <code> <key>` for each message you changed. Say in the pull request that you speak it.
- **Add a language:** copy `public/_locales/en/messages.json` to `locales/<code>/` (codes like `de` or `pt_BR`), translate each `message`, set `langCode`, and run `node scripts/locales.mjs record <code>`.

`node scripts/locales.mjs status` lists messages whose English has changed.

## What to keep

- **Placeholders** like `$1`, in any order. Write a literal dollar sign as `$$`.
- **Counts:** add the plural forms your language uses (`_one`, `_few`, `_other`, and so on).
- **Names** of Anubis, engines, and browsers. For engine panels like "People also ask", use the engine's own name in your language.
- **One word per ranking:** Hide, Lower, Normal, Raise, and Pin.

## What stays in English

Reports sent to list maintainers, list files, and the wiki's pages for list publishers. The wiki's guide also comes machine-translated in Vietnamese, German, and Chinese.

## Check your translation

Build with `npm run build` (see [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)) and load it in a browser set to your language. Check the popup and Settings at a narrow width.
