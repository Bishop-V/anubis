---
name: review-ru
description: 'Review or correct Anubis''s Russian translation (locales/ru/messages.json). Use when asked to review, proofread, fix, or extend the Russian interface text, or when English messages changed and Russian needs retranslating. Covers register (вы), typography (guillemets, em dashes), the fixed glossary, the four plural forms, case and gender agreement in built sentences, the names browsers and Google use in Russian, and the mistakes machine translation makes.'
---

# Reviewing the Russian translation

The Russian interface is `locales/ru/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is standard Russian as Firefox, Chrome, and Google show it in Russia and the other Russian-speaking countries; nothing in it is regional. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=ru node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=ru node e2e/run.mjs docs` (don't commit those).

## Register and tone

- **вы** everywhere, in lower case, as the browsers' and Google's own Russian does. Imperatives in the вы form: «Нажмите», «Выберите», «Введите». Never ты.
- Buttons, switches, and menu items are infinitives («Скрыть», «Добавить список», «Показывать метки под результатами»). Status lines are short participles or past tense («Сайт fandom.com скрыт.», «Вы подписались на $1.»).
- Anubis is masculine: «Anubis скрыл», «Anubis включён», «он убрал». A search engine named in a sentence (`loadMore*`) is treated as masculine too: «$1 не прислал результатов».
- Short and plain. Sentence case: only the first word and proper names take a capital («Загрузить ещё результаты»).

## Typography

- Guillemets «…» for quotes, and „…“ only for a quote inside a quote. The `quoted` message is «$1». No straight quotes, no English “…”.
- The em dash — with a space on each side, and a no-break space (U+00A0) before it so a line never starts with a dash. The settings tab title is «$1 — Anubis».
- The ellipsis character … («Загрузка…»), and ё where it belongs («Закреплён», «ещё», «Тёмная»): don't flatten it to е.
- Units after a number: «КБ», «МБ», with a space.
- The ranking words carry soft hyphens (U+00AD) for the ⚖ menu's five narrow columns: «Пони­зить», «Обыч­ный», «Под­нять», «Закре­пить». Keep them, and break only between syllables, never leaving one letter on a line.

## Glossary

| English | Russian |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | Скрыть / Понизить / Обычный / Поднять / Закрепить |
| Hidden / Lowered / Raised / Pinned | скрыт / понижен / поднят / закреплён (masculine: a result or a site) |
| ranking (a site's) | ранг; to rank: ранжировать, задать ранг; How ranking works: Как работает ранжирование |
| rerank | менять порядок (результатов) |
| tag (noun, verb) | метка (feminine); пометить, помечать; tagged “X”: помечен как «X»; untag: снять метку |
| list, subscribe, unsubscribe | список; подписаться на; отписаться от |
| your list | ваш список (as a list's name: «Ваш список») |
| site, result | сайт, результат |
| search page, search engine | страница поиска, поисковая система |
| panel (clean-up) | блок; Remove panels: Убрать блоки; remove: убрать |
| summary | сводка |
| lens | линза |
| Show hidden | Показать скрытые |
| Load more results | Загрузить ещё результаты |
| Undo | Отменить |
| sync, backup | синхронизация, резервная копия |
| passphrase | парольная фраза |
| settings, tag choices, your tag settings | настройки; выбор для меток; ваши настройки меток |
| tab | вкладка |
| instruction (a list's rule line) | инструкция |

## Names to match

- **Google (google.ru):** «Обзор от ИИ», «Режим ИИ», «Похожие вопросы», «Главные новости», «Обсуждения и форумы», the tabs «Веб», «Все», «Картинки». «Веб» (the `&udm=14` tab, under «Ещё») is the name Russian tech press quotes from google.ru.
- **Firefox** (as in Mozilla's Russian localisation): «Дополнения» (in the sync settings), «Синхронизировать» for Sync Now (Firefox's Russian has no «сейчас»), «Закрепить на панели инструментов» for Pin to Toolbar, «Расширения» (the toolbar button, and Firefox for Android's menu). Anubis's own Sync now button (`webdavSyncNow`) is «Синхронизировать сейчас»; that one isn't Firefox's.
- **Chrome, Edge, Opera:** «Расширения» (the puzzle piece; Opera's cube).
- Product names stay in Latin script, undeclined: Anubis, Google, Firefox, Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, Duck.ai, WebDAV. Quoted English UI from sites that show no Russian stays English: Brave's «Find elsewhere», Startpage's «Block creepy ads, not private search».

## What machine translation gets wrong here

- **Four plural forms.** Every count has `_one` (1, 21, 31…), `_few` (2–4, 22–24…), `_many` (0, 5–20, 25…), and `_other` (fractions). The noun's case follows the frame: after «из» it is genitive in every form (`summaryResults`: «из $1 результата» / «из $1 результатов»), in `tagMarksYours` it is accusative («1 ваш сайт», «3 ваших сайта», «5 ваших сайтов»). `_other` takes the genitive singular («1,5 секунды»).
- **`_one` covers 21, 31, 101.** Where English's `_one` has no `$1`, Russian's can't have one either (the test checks placeholders against English), so it must read right for 21 as well as 1. `summaryUnchanged_one` says «Anubis ничего не изменил в результатах.» rather than «этот результат» for that reason. `summaryRemoved*_one` («ответ ИИ», «блок видео») and `barHidden*_one` («скрыт») stay singular: 21 AI answers is unrealistic, and a run of 21 hidden results in a row is rare, but it would read «fandom.com и ещё 20 скрыт».
- **Numbers the frame can't inflect.** A second number has no plural forms of its own, so the Russian puts it after a colon instead of before a noun: `summaryResultsPages` «$1 результатов (страниц: $2)», `summaryUnchangedPages` «результатов — $1, страниц — $2», `importRead` «обновлено: $3». Places in the ⚖ menu's Why have no noun at all, as in English: «поднимает его на 3».
- **Case after list names.** List names are English and don't decline, so frames put them after a word that carries the case: «скрыт списком $2», «из списка $2», «Сообщите об этом в $1». `popupHintLists` reads «Скрыт. Источник: Official docs и ваши настройки меток.», all nominative, because `$2` can be list names and `popupYourTagSettings` joined together.
- **Built sentences.** Check the frame and the parts together:
  - `summaryActed`: «Anubis закрепил 1, поднял 2 и скрыл 3 из 7 результатов. Кроме того, он убрал ответ ИИ, 2 блока видео и просьбу разрешить рекламу.» The `summaryRemoved*` parts are in the accusative («просьбу», not «просьба»).
  - The ⚖ menu's Why (`menuReason` with `reason*`): «Official docs поднимает его на 3 и помечает его как «Docs».» A list's verb is singular; «Ваши настройки меток» takes the plural `choice*` forms: «Ваши настройки меток поднимают его на 5 за каждую из меток «A» и «B» и понижают его на 5 из-за «C», поэтому он поднимается на 5 позиций.»
  - Settings → Tags (`tagMarks`, `tagEffect*`): «Помечает 3 ваших сайта и 60 сайтов из списка Official docs. Official docs поднимает 51 и скрывает 2 из них.»
  - The line for hidden results (`barHidden*` after a site and `hiddenMore`): «fandom.com скрыт вашим списком», «fandom.com и ещё 4 скрыты, потому что помечены как «ИИ-мусор»». The count includes the first site, so «и ещё 1» already takes the plural.
- **Gender.** «метка» is feminine («её сайты», «она переместится»); «сайт», «результат», «список», «ранг» are masculine, so «он», «его», «Оставлен обычным». The colour schemes and palettes are feminine (схема, палитра): «Светлая», «Тёмная», «Золотая», «Простая».
- **Lists joined by the browser.** `tJoin` uses `Intl.ListFormat`, which gives «a, b и c» with no serial comma, as Russian wants. Its `unit` style joins Russian with spaces only, so `listsFacts` reads «12 инструкций 3 метки автор: X обновление: 5 минут назад» and a list's kind «список Anubis линза»; that needs a code change, not a translation fix.
- **Anglicisms and calques:** «тег» for метка, «ранкинг» or «рейтинг» for ранг, «бэкап» for резервная копия, «кликните» for нажмите, «Да» and «Нет» as switch states.
- **Length.** Russian runs 10–25% longer than English and has long words. Watch buttons and the popup at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); every count has `_one`, `_few`, `_many`, and `_other`, each in the case its frame needs.
3. Glossary and register hold: search for «ты», «твой», «тег», «рейтинг», «бэкап», and English quotes.
4. Typography: «» quotes, a no-break space before each em dash, ё kept, soft hyphens in the five ranking words.
5. Read the built sentences aloud with 1, 2, 5, and 21: the summary, the hidden-result line, the ⚖ menu's Why, the popup's hint, and Settings → Tags' effect lines.

## Fixing

Edit `locales/ru/messages.json`, then `node scripts/locales.mjs record ru <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change «Not yet» for Russian in `docs/guide/translate.md`.
