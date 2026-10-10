# Help translate

::: warning Machine translated: use with caution
Anubis is written in English, the only language it fully supports. It also comes in **Arabic, Bengali, Chinese (Simplified), Chinese (Traditional), French, German, Hindi, Indonesian, Italian, Japanese, Korean, Brazilian Portuguese, Russian, Spanish, Turkish, and Urdu**, but a machine made those translations and nobody who speaks the language has checked them yet. Some words may be wrong or unclear, so use them with caution. When you rank or hide sites, the ⚖ menu's **Why** and the summary above the results say exactly what happened; if a translation leaves you unsure, check the English. To see Anubis in English, set your browser's language to English.
:::

Anubis's interface is in English. Every word it shows can be translated: the toolbar popup, the settings, the welcome page, and what it adds to search pages. Your browser picks the translation for its own language, and anything a translation leaves out stays in English. In any language but English, Settings, the welcome page, and the toolbar popup say that the translation is a machine's, with a link to this page.

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

Chrome has no Urdu interface of its own, so Urdu shows in Firefox only.

They were machine translated from the English with a fixed set of words: the five rankings, "tag", "list", and the names search engines give their own panels in each language. When the English for a message changes, its translation is out of date, and Anubis shows that message in English until someone translates it again, so you never read an old meaning. Lists and the tags they give sites are written by their authors, usually in English, so tag names stay as the lists wrote them.

If you speak one of these languages, correcting it is the most useful thing to do first: see below.

## How to translate

A translation is a folder, `locales/<language>/` in [Anubis's repository](https://github.com/Bishop-V/anubis), holding `messages.json`, in the format browsers use for every extension, and `sources.json`, the English each message was translated from. Until a hosted translation project opens, send it as a pull request:

1. Copy `public/_locales/en/messages.json` to `locales/<language>/messages.json`, in a folder named after your language's code, with an underscore before a region: `de`, `fr`, `pt_BR`, `zh_CN`, `zh_TW`. Browsers only use [the codes they know](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales).
2. Translate each `message`. You can drop the `description`s; in English, a description says where the text appears and what each `$1` or `$2` stands for.
3. Set `langCode` to your language's code, the same as the folder's name.
4. Run `node scripts/locales.mjs record <language>`. It writes `sources.json`, so Anubis can tell later when the English has changed.
5. Open a pull request. A check makes sure every key exists in English, every placeholder is kept, and every message says which English it came from.

You don't have to translate everything at once: leave out a message and it shows in English.

### Correct a machine translation

Change the `message` in `locales/<language>/messages.json`, and say in the pull request that you speak the language. When you've read a whole language through, change "Not yet" in the table above. `node scripts/locales.mjs status` lists the messages whose English changed since they were translated; translate each again, then run `node scripts/locales.mjs record <language> <key>` for it.

## What to keep

- **Placeholders.** `$1`, `$2`, and so on are filled in with a site, a number, or a name. Keep each one, in whatever order your language needs. A dollar sign that isn't a placeholder is written `$$`.
- **Counts.** Messages ending in `_one` and `_other` are the forms of a count: "1 list", "2 lists". Add the forms your language uses, named as [Unicode's plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) name them: `_zero`, `_one`, `_two`, `_few`, `_many`, and `_other`.
- **Names.** Anubis, the search engines, the browsers, and other projects (uBlacklist, HOHSER, Brave Goggles) keep their names. Where a message names part of a search engine's page, such as Google's "AI Overview" or "People also ask", use the name the engine shows in your language.
- **The words for a ranking.** A site's ranking is Hide, Lower, Normal, Raise, or Pin everywhere in Anubis. Choose one word for each and use it throughout. In a language with long words, put soft hyphens (U+00AD) in them, so the ⚖ menu's row of rankings can break them where they should break.

## What stays in English

- **Reports and suggestions sent to a list's maintainers.** When you report a list's mistake or suggest a site to it, the issue Anubis fills in is in English, since the list's maintainers may not read your language.
- **List files.** Your own list, as Anubis starts it, and the lists you subscribe to are written by their authors.
- **This wiki and the store listings.** They're translated separately, later.

## Check your translation

Build Anubis with your file in place (`npm run build`; see [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)), and load it in a browser set to your language; `ANUBIS_LANG=<code> node e2e/run.mjs responsive` checks Settings at phone widths in it. In Firefox, add your language under Settings → General → Language; in Chrome, choose it under Settings → Languages, or start Chrome with `--lang=<code>`. Look at the popup and the settings at a narrow width, since a longer word can push a button onto a second line.

Arabic and Urdu are written right to left: Anubis's pages, and what it adds to search pages, turn to match. Check a right-to-left language at a narrow width too.
