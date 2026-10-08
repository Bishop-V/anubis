# Help translate

Anubis's interface is in English. Every word it shows can be translated: the toolbar popup, the settings, the welcome page, and what it adds to search pages. Your browser picks the translation for its own language, and anything a translation leaves out stays in English.

## How to translate

A translation is one file, `public/_locales/<language>/messages.json` in [Anubis's repository](https://github.com/Bishop-V/anubis), in the format browsers use for every extension. Until a hosted translation project opens, send it as a pull request:

1. Copy `public/_locales/en/messages.json` to a folder named after your language's code, with an underscore before a region: `de`, `fr`, `pt_BR`, `zh_CN`. Browsers only use [the codes they know](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales).
2. Translate each `message`. Leave the keys and the `description`s alone; a description says where the text appears and what each `$1` or `$2` stands for.
3. Set `langCode` to your language's code, the same as the folder's name.
4. Open a pull request. A check makes sure every key exists in English and every placeholder is kept.

You don't have to translate everything at once: leave out a message and it shows in English.

## What to keep

- **Placeholders.** `$1`, `$2`, and so on are filled in with a site, a number, or a name. Keep each one, in whatever order your language needs. A dollar sign that isn't a placeholder is written `$$`.
- **Counts.** Messages ending in `_one` and `_other` are the forms of a count: "1 list", "2 lists". Add the forms your language uses, named as [Unicode's plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) name them: `_zero`, `_one`, `_two`, `_few`, `_many`, and `_other`.
- **Names.** Anubis, the search engines, the browsers, and other projects (uBlacklist, HOHSER, Brave Goggles) keep their names. Where a message names part of a search engine's page, such as Google's "AI Overview" or "People also ask", use the name the engine shows in your language.
- **The words for a ranking.** A site's ranking is Hide, Lower, Normal, Raise, or Pin everywhere in Anubis. Choose one word for each and use it throughout.

## What stays in English

- **Reports and suggestions sent to a list's maintainers.** When you report a list's mistake or suggest a site to it, the issue Anubis fills in is in English, since the list's maintainers may not read your language.
- **List files.** Your own list, as Anubis starts it, and the lists you subscribe to are written by their authors.
- **This wiki and the store listings.** They're translated separately, later.

## Check your translation

Build Anubis with your file in place (`npm run build`; see [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)), and load it in a browser set to your language. In Firefox, add your language under Settings → General → Language; in Chrome, choose it under Settings → Languages, or start Chrome with `--lang=<code>`. Look at the popup and the settings at a narrow width, since a longer word can push a button onto a second line.

Languages written right to left get the right direction on Anubis's own pages; their layout hasn't been checked yet, so say so in your pull request.
