---
name: review-ar
description: 'Review or correct Anubis''s Arabic translation (locales/ar/messages.json). Use when asked to review, proofread, fix, or extend the Arabic interface text, or when English messages changed and Arabic needs retranslating. Covers register, right-to-left typography (، ؛ ؟ and «»), Latin names and domains inside Arabic sentences, the six plural forms, the fixed glossary, the names browsers and Google use in Arabic, and the mistakes machine translation makes.'
---

# Reviewing the Arabic translation

The Arabic interface is `locales/ar/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is Modern Standard Arabic (فصحى), the variety every Arabic-speaking browser user reads in software, with no regional dialect. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too, since direction matters as much as wording: `ANUBIS_LANG=ar node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=ar node e2e/run.mjs docs` (don't commit those). Anubis's own pages get `dir="rtl"` from the browser's `@@bidi_dir`, and the hosts it adds to search pages get `dir` and `lang` from `makeHost` in `entrypoints/content/ui.ts`, so Arabic reads right to left even on an English search page. The layout of right-to-left pages hasn't been checked yet.

## Register and tone

- Instructions address the reader in the masculine singular imperative, as Google, Microsoft, and Mozilla do in Arabic: «اضغط», «اختر», «أدخل», «استخدم». Keep it everywhere; don't mix in plural or feminine forms.
- Buttons, switches, headings, and screen reader labels are verbal nouns (مصدر), the usual form for Arabic software controls: «إخفاء», «إضافة قائمة», «تحميل المزيد من النتائج», «إعادة ضبط الإعدادات».
- Short and plain. Done actions in the summary use «تم …» («تم إخفاء $1.») so they read unambiguously without vowel marks.
- Vowel marks only where a word would otherwise be misread: shadda in «ثبّت», «مثبَّت», «رتّب»; «تَسِم» (from وَسَمَ) to tell it from other readings. Tanwīn fatḥa is written on accusative counts: «موقعًا», «وسمًا».

## Typography and direction

- Arabic punctuation: comma ، (U+060C), semicolon ؛ (U+061B), question mark ؟ (U+061F). The full stop and colon are the ordinary . and :. A Latin comma is only acceptable inside quoted English UI from another site (Startpage's «Block creepy ads, not private search»).
- Quotation marks are guillemets with no spaces: «$1». The `quoted` message is «$1». Names of buttons and Google's panels go in «» too.
- Arrows in paths point right to left: «القوائم» ← «إضافة قائمة».
- Ranges are written in words, not with a dash: `lineBadStrength` reads «يجب أن تكون قيمة boost من 1 إلى 10».
- **No soft hyphens.** The five ranking words are short («إخفاء», «خفض», «عادي», «رفع», «تثبيت»), and a soft hyphen inside Arabic would break the letters' joining. Arabic is never hyphenated.
- Numbers come in as Western digits (`String(count)`), and Arabic text around them is written to read naturally with them; don't spell counts out in words.
- Units: «كيلوبايت», «ميغابايت», «ثانية».

### Latin names, domains, and code inside Arabic

Sites ($1 is often `fandom.com`), list names (`Official docs`), tag names, Anubis, and the engines stay in Latin letters. The Unicode bidirectional algorithm lays each Latin run out left to right inside the right-to-left line. What to check:

- **Order reads right.** «fandom.com و2 غيره أخفتها قائمتك» shows the domain at the right-hand start of the line, then the Arabic. A sentence that starts with Latin («Anubis ثبّت 1 ورفع 2…») still starts at the right because the host is `dir="rtl"`; if one ever renders starting at the left, the element lacks `dir`.
- **Punctuation at a Latin edge.** A neutral character between Latin and the end of a line takes the line's direction, so `https://` at the end of a sentence would show as `://https`, and a code line such as `! name:` as `:name !`. The translation puts a left-to-right mark (U+200E, invisible) after `https://` and around placeholders that hold raw code or list lines (`publishStepDownload`, `publishStepRepository`, `publishStepIssues`, the `line…` errors, `lineIfGuard`). Keep them when editing those messages; search for `‎` to see where they are.
- **Prefixes on Latin.** Arabic attaches و، بـ، لـ to the next word. Before a Latin name the translation either puts a noun in between («للموقع $1», «قائمة $2») or writes «لـ Anubis», «بـ $1» with a tatweel and a space. Avoid «لfandom.com». `Intl.ListFormat('ar')` joins lists itself as «a وb وc», attaching و to each item with no comma; that is the browser's own Arabic and can't be changed in the messages.
- **Parentheses** mirror automatically: «إظهار المخفي (Alt+Shift+H)» is right as written.
- **Gender of a Latin name.** A list's name has no gender of its own, so verbs treat it as feminine, as if «قائمة» stood before it: «Official docs ترفعها بمقدار 3». Where a list's name follows a preposition or a verb, the translation writes «قائمة $2» to make that explicit.

## Plural forms

Arabic has all six CLDR forms, and every count message has all six: `_zero`, `_one`, `_two`, `_few` (3–10, and 103–110…), `_many` (11–99, and 111–199…), `_other` (100–102, 200…). The noun changes with each:

| Form | Rule | Example |
| --- | --- | --- |
| zero | 0 | 0 قائمة |
| one | 1 | 1 قائمة |
| two | 2 | 2 قائمتان (nominative), 2 قائمتين (accusative or genitive) |
| few | 3–10 | 5 قوائم (plural, genitive) |
| many | 11–99 | 12 وسمًا (singular, accusative) |
| other | 100–102… | 100 وسم (singular, genitive) |

- The tests require every form to keep the English `_other`'s placeholders, so `_two` writes the digit and the dual together («2 قائمتان»). A native speaker would write the dual alone; it can't be done without dropping `$1`, so this compromise is deliberate. The same holds for `_one` where English `_one` has `$1` («1 قائمة»).
- The dual's case follows the sentence: subject «$1 موقعان» (`tagMarksFromList`, `importRead`), object or after a preposition «$1 موقعين» (`tagDeleted`, `sitesFilter`, `summaryResults` after «من أصل»), and the construct dual drops its ن («لوحتي فيديو»).
- Where a message has no plural forms but holds a number, the translation avoids number agreement: «ترفعها بمقدار $1», «النتائج الـ$1», «في الصفحات الـ$2», «$1 من مواقعك».

## Glossary

| English | Arabic |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | إخفاء / خفض / عادي / رفع / تثبيت |
| Hidden / Lowered / Raised / Pinned | مخفي / مخفوض / مرفوع / مثبَّت (masculine, agreeing with موقع) |
| ranking (a site's); to rank | ترتيب; رتّب |
| rerank | إعادة ترتيب |
| tag (noun, verb); tagged | وسم، وسوم; وَسَمَ (يَسِم، تَسِمها); موسوم، «يحمل الوسم» |
| untag | إزالة الوسم |
| list, subscribe, unsubscribe | قائمة (قوائم), الاشتراك في, إلغاء الاشتراك في |
| your list | قائمتك |
| site, result | موقع (مواقع), نتيجة (نتائج) |
| search page, search engine | صفحة البحث, محرك البحث (محركات البحث) |
| panel (clean-up) | لوحة (لوحات); Remove panels: إزالة اللوحات |
| summary | الملخص |
| lens | عدسة |
| Show hidden | إظهار المخفي |
| Load more results | تحميل المزيد من النتائج |
| Undo | تراجع |
| sync, backup | المزامنة, النسخ الاحتياطي (a backup: نسخة احتياطية) |
| passphrase | عبارة المرور |
| settings | الإعدادات |
| tab | علامة تبويب |
| menu on a result | قائمة ⚖ (the ⚖ keeps it apart from قائمة, a list) |
| highlight | تمييز |
| issue tracker, pull request, repository | متتبع المشكلات, طلب سحب, مستودع |
| domain, subdomain | نطاق, نطاق فرعي |

«قائمة» means both a list and a menu in Arabic. The translation keeps it for lists and says «قائمة ⚖» or «قائمة المتصفح» for menus; watch for a bare «القائمة» that could be read either way.

## Names to match

- **Google (google.com in Arabic):** «نظرة عامة بالذكاء الاصطناعي» (AI Overview), «وضع الذكاء الاصطناعي» (AI Mode), «أسئلة ذات صلة» (People also ask), «أهم الأخبار» (Top stories), «المناقشات والمنتديات» (Discussions and forums), the tabs «الويب», «الكل», «صور». These were chosen from memory and are the first thing to check against a live Arabic Google page; AI Overview's and People also ask's Arabic names are the least certain.
- **Firefox:** «الإضافات» (Add-ons, in its sync settings and on Android's menu), «زامِن الآن» (Sync Now), «ثبّت في شريط الأدوات» (Pin to Toolbar), «الامتدادات» (the Extensions button).
- **Chrome:** «الإضافات» (the Extensions button, the puzzle piece). **Edge:** «الملحقات». **Opera:** «الإضافات».
- Product names stay in Latin letters: Anubis (not أنوبيس), Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, Duck.ai, Google, Bing, DuckDuckGo, Firefox, Chrome, GitHub, WebDAV. Quoted English UI from sites with no Arabic version stays English («Find elsewhere»).

## What machine translation gets wrong here

- **Built sentences and word order.** The summary's parts are verbs, so the frame puts Anubis first: `summaryActed` «Anubis $1 من أصل $2.» fills to «Anubis ثبّت 1 ورفع 2 وأخفى 2 من أصل 7 نتائج.», then `summaryAlsoRemoved` «وأزال أيضًا إجابة بالذكاء الاصطناعي و2 لوحتي فيديو.». In Settings → Tags, `tagMarks` makes the tag the object: «يحمله 3 من مواقعك و60 موقعًا من Official docs. قائمة Official docs ترفع 51 وتخفي 3 منها.». Check the frame and every part together.
- **Agreement once filled in.** Under Why (`menuReason`), the list's name, «قائمتك», and «إعدادات وسومك» all take feminine verbs, and the result is «ها» (نتيجة): «Official docs ترفعها بمقدار 3 وتَسِمها بـ«Docs»». The line for hidden results agrees with how many results it stands for: «fandom.com أخفته قائمتك», «fandom.com و1 غيره أخفتهما قائمتك», «fandom.com و4 غيره أخفتها قائمتك» (non-human plurals take the feminine singular).
- **Number agreement** is the commonest mistake: a plural noun after 11 or more («12 مواقع» is wrong, «12 موقعًا»), or the singular after 3–10.
- **Calques:** «بواسطة» for "by" (the translation uses «حسب» or an active verb), «تاغ» or «علامة» for tag, «باكب» for backup, «رانك» for ranking.
- **Script and direction:** Latin punctuation (, ; ?) left in Arabic text, English quotes “ ” instead of «», a left-pointing path written with →, and lost U+200E marks.
- **Length.** Arabic is usually no longer than English, but long verbal-noun phrases can wrap in the popup at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); every count has all six forms, each agreeing with its number.
3. Glossary and register hold: masculine singular imperatives, verbal nouns on buttons; search for «تاغ», «بواسطة», and a bare «القائمة».
4. Typography: no , ; ? outside quoted English, «» quotes, ← in paths, U+200E marks kept beside code and `https://`, no soft hyphens.
5. Read the built sentences in place, right to left: the summary, the hidden-result lines, the ⚖ menu's Why, Settings → Tags' effect lines, and the list facts in Settings → Lists.

## Fixing

Edit `locales/ar/messages.json`, then `node scripts/locales.mjs record ar <key>…` for each message you changed (for a count, each form: `popupListCount_zero` … `popupListCount_other`). `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Arabic in `docs/guide/translate.md`.
