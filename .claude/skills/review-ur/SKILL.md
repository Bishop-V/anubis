---
name: review-ur
description: 'Review or correct Anubis''s Urdu translation (locales/ur/messages.json). Use when asked to review, proofread, fix, or extend the Urdu interface text, or when English messages changed and Urdu needs retranslating. Covers register (آپ), right-to-left typography (۔ ، ؛ ؟), Latin names and domains inside Urdu sentences, the fixed glossary, the names Firefox and Google use in Urdu, and the mistakes machine translation makes, above all agreement in sentences built from parts.'
---

# Reviewing the Urdu translation

The Urdu interface is `locales/ur/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is standard Urdu in Perso-Arabic (Nastaliq) script, written right to left, as used in Pakistani and Indian software; English technical words that Urdu software users already say (ٹیگ, پن, سبسکرائب, اپ ڈیٹ, بیک اپ) are written in Urdu letters rather than replaced with coinages. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too, since direction matters as much as wording: `ANUBIS_LANG=ur node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=ur node e2e/run.mjs docs` (don't commit those).

**Who sees it: Firefox users only.** Chrome has no Urdu interface, so Chrome never picks the `ur` folder and shows Anubis in English. Firefox has an Urdu interface. The messages written for Chrome, Edge, and Opera (`welcomePinChrome`, `welcomePinEdge`, `welcomePinOpera`, `syncChrome`) are translated for completeness, but nobody is likely to see them in Urdu; review the Firefox ones first.

Anubis's own pages get `dir="rtl"` from the browser's `@@bidi_dir`, and the hosts it adds to search pages get `dir` and `lang` from `makeHost` in `entrypoints/content/ui.ts`, so Urdu reads right to left even on an English search page. The layout of right-to-left pages hasn't been checked yet.

## Register and tone

- **آپ** everywhere, with the polite imperative in ـیں: «کریں», «چنیں», «دبائیں», «درج کریں». Never تم or تو, and no bare imperatives («کر», «چن»).
- Buttons and switches are polite imperatives too («چھپائیں», «فہرست شامل کریں», «محفوظ کریں»), which is how Urdu software labels actions.
- Short and plain, like the English. No «براہ کرم» (please), no exclamation marks. Prefer everyday words over Persian-Arabic formal ones where both are understood (چنیں over منتخب فرمائیں), but keep the established software terms: ترتیبات, کالعدم کریں, ہم وقت سازی.
- Western digits (1, 2, 12), as Pakistani software and `Intl` in Urdu use; the code inserts numbers itself, so Urdu digits (۱۲) would only be inconsistent.

## Typography and direction

- Urdu punctuation: full stop ۔ (U+06D4), comma ، (U+060C), semicolon ؛ (U+061B), question mark ؟ (U+061F). The colon is the ordinary :. A Latin , ; ? or . is only acceptable inside quoted English from another site (Startpage's “Block creepy ads, not private search”) or inside a name.
- Quotation marks are “ ” in logical order: “ before the text, ” after it (the `quoted` message is “$1”). The browser draws them at the right places in a right-to-left line. A speaker may prefer « » or ‘ ’; if so, change `quoted` and every literal pair together (search for “).
- Arrows in paths point right to left: “فہرستیں ← فہرست شامل کریں”.
- Ranges are written in words, not with a dash: `lineBadStrength` reads “$1 کی قدر 1 سے $2 تک ہونی چاہیے”.
- **No soft hyphens.** Arabic script doesn't hyphenate. The ranking words that are long are two words (نیچے کریں, اوپر کریں, پن کریں), so the ⚖ menu's five narrow columns break them at the space.
- The ellipsis character … closes «لوڈ ہو رہا ہے…» and the like.

### Latin names, domains, and code inside Urdu

Sites (`$1` is often `fandom.com`), list names (`Official docs`), tag names, Anubis, and the engines stay in Latin letters. The Unicode bidirectional algorithm lays each Latin run out left to right inside the right-to-left line. What to check:

- **Order reads right.** “fandom.com اور 2 مزید چھپائے گئے” shows the domain at the right-hand start of the line, then the Urdu. A sentence that starts with Latin (“Anubis نے 9 نتائج میں سے …”) still starts at the right because the element is `dir="rtl"`; if one ever renders starting at the left, the element lacks `dir`.
- **Two Latin runs side by side merge.** In “fandom.com Official docs کے ذریعے چھپایا گیا” (a hidden-result line: the site in bold, then `barHiddenByList`) the domain and the list's name form one left-to-right run, so they still read in the right order, but nothing but the bold separates them. If a speaker finds it hard to read, rephrase `barHiddenByList` so an Urdu word comes first (for example “فہرست $2 کے ذریعے …”).
- **Punctuation at a Latin edge.** A neutral character between Latin and Urdu takes the line's direction, so `https://` before an Urdu word would show as `//:https`, `@if` at the start of a line as `if@`, and a code line such as `! name:` as `:name !`. The translation puts a left-to-right mark (U+200E, invisible) after `https://` (`webdavAddressHint`, `webdavBadAddress`), before `@if` (`lineIfGuard`), and on both sides of placeholders that hold raw code or a list's line (`publishStepDownload`, `publishStepRepository`, `publishStepIssues`, and the `line…` errors that quote the line). Keep them when editing those messages; search for U+200E to see where they are.
- **Urdu full stop after Latin.** ۔ is a strong right-to-left character, so “fandom.com۔” and “Duck.ai، Bing” keep their punctuation on the Urdu side. Don't replace it with a Latin full stop, which would attach to the Latin run.
- **Parentheses** mirror automatically: «چھپے ہوئے دکھائیں (Alt+Shift+H)» is right as written.
- **Units after numbers:** “12 KB” and “HTTP 500” stay together as one left-to-right run; that's intended.

## Glossary

One word per concept, everywhere: Settings, the popup, the ⚖ menu, the summary, and errors. Nouns use Urdu plurals and the oblique case: سائٹ → سائٹیں, سائٹوں; فہرست → فہرستیں, فہرستوں; ٹیگ and پینل are the same in the plural (ٹیگوں, پینلوں in the oblique).

| English | Urdu |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | چھپائیں / نیچے کریں / عام / اوپر کریں / پن کریں |
| Hidden / Lowered / Raised / Pinned (labels) | چھپایا گیا / نیچے کیا گیا / اوپر کیا گیا / پن کیا گیا (plural چھپائے گئے…) |
| kept at normal | عام پر برقرار |
| ranking (a site's) | درجہ; to rank: درجہ دینا |
| rerank | ترتیب بدلنا; Rerank results: نتائج کی ترتیب بدلیں |
| tag (noun, masculine), to tag, untag | ٹیگ, ٹیگ لگانا (… پر ٹیگ لگانا), ٹیگ ہٹانا |
| label (a tag that only shows) | لیبل |
| list (feminine), subscribe, unsubscribe | فہرست, سبسکرائب کرنا, ان سبسکرائب کرنا; subscription: سبسکرپشن |
| your list | آپ کی فہرست |
| site (feminine) | سائٹ |
| result, search page | نتیجہ (pl. نتائج), تلاش کا صفحہ |
| search engine | سرچ انجن |
| panel (clean-up) | پینل; Remove panels: پینل ہٹائیں |
| summary | خلاصہ |
| lens | لینز |
| highlight | نمایاں کرنا |
| Show hidden | چھپے ہوئے دکھائیں |
| Load more results | مزید نتائج لوڈ کریں |
| Undo | کالعدم کریں |
| sync, backup | ہم وقت سازی (to sync: ہم وقت ساز کرنا), بیک اپ |
| passphrase, password | پاس فریز, پاس ورڈ |
| settings, tab | ترتیبات, ٹیب |
| encrypt, end to end | خفیہ کرنا, اینڈ ٹو اینڈ |
| import, export | درآمد کرنا, ایکسپورٹ |

## Names to match

These are the translator's best knowledge and the first thing a speaker should check against the real products.

- **Google (google.com.pk in Urdu):** “AI کا جائزہ” (AI Overview), “AI موڈ” (AI Mode), “لوگ یہ بھی پوچھتے ہیں” (People also ask), “اہم خبریں” (Top stories), “مباحثے اور فورمز” (Discussions and forums), the tabs “ویب”, “تمام”, “تصاویر”. Least sure of: “AI کا جائزہ” and “تمام” (Google may say «سبھی» or «سب»).
- **Firefox:** “ایڈ آنز” (Add-ons, in the sync settings), “ابھی ہم وقت ساز کریں” (Sync Now), “ٹول بار پر پن کریں” (Pin to Toolbar), “ایکسٹینشنز” (the Extensions button and menu item). Firefox's Urdu is incomplete, and some of these may show in English in Firefox itself; if so, the message should quote whatever Firefox actually shows.
- **Chrome:** no Urdu interface; the Chrome, Edge, and Opera messages use “ایکسٹینشنز” for the puzzle-piece button.
- Product names stay in Latin letters: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, InfiniCLOUD, Nextcloud, Duck.ai, Google, Bing, DuckDuckGo, Firefox, Chrome, GitHub, WebDAV, and git terms (pull request, gist). Quoted English UI from sites with no Urdu version stays English (Brave's “Find elsewhere”, Startpage's banner). `welcomeQuery` stays “python list comprehension”, a technical search.

## What machine translation gets wrong here

- **Verb agreement with ـنے.** In the perfective, a transitive verb agrees with its object, not its subject, and the object in a built sentence is unknown. The translation avoids that: the summary's parts take کو, which leaves the verb masculine singular (“Anubis نے 9 نتائج میں سے 1 کو پن کیا، 2 کو اوپر کیا، اور 3 کو چھپایا۔”), and `summaryAlsoRemoved` lists what it removed after a colon (“اس نے یہ بھی ہٹایا: ایک AI جواب اور 2 ویڈیو پینل۔”). Keep that shape; a verb placed after a list of mixed objects can't agree with all of them.
- **Gender of the subject.** A list's name is treated as feminine, as if فہرست stood before it: “Official docs اسے 3 درجے اوپر کرتی ہے”, and the `reason…` and `tagList…` parts all end in کرتی ہے, چھپاتی ہے. The tag settings are feminine plural (آپ کی ٹیگ ترتیبات … کرتی ہیں), so the `choice…` parts end in ہیں. A tag is masculine (“یہ … پر لگا ہے”, “یہ انہیں اوپر کرتا ہے”). A result is masculine (چھپایا گیا), a site feminine (“کیا کسی فہرست میں یہ شامل ہونی چاہیے؟”).
- **The ranking labels in `popupHintLists`.** `$1` is a label (اوپر کیا گیا), masculine, while the sentence is about a site, which is feminine: “اوپر کیا گیا، Official docs اور آپ کی ٹیگ ترتیبات کی طرف سے۔” reads as an impersonal label, not as agreement. A speaker may prefer another shape; the labels also stand alone under results and in `weighLabelRanked`, so change them together.
- **Oblique case before a postposition.** Parts that end up before میں سے or پر are written in the oblique: `summaryResults_one` is “$1 نتیجے” (it is always followed by میں سے), `tagMarksYours_other` “آپ کی $1 سائٹوں” (followed by پر in `tagMarks`). Read those parts inside their frames, not alone.
- **Sentences built from parts.** Urdu is verb-final, so English frames are reshaped, not translated in order. `tagEffectOneList` reads “یہ آپ کی 3 سائٹوں اور Official docs کی 60 سائٹوں پر لگا ہے۔ Official docs ان میں سے 51 کو اوپر کرتی ہے اور 2 کو چھپاتی ہے۔”; the ⚖ menu's Why reads “آپ کی ٹیگ ترتیبات “a” اور “b” میں سے ہر ایک کی وجہ سے اسے 5 درجے اوپر کرتی ہیں اور “c” کی وجہ سے اسے 5 درجے نیچے کرتی ہیں، یوں یہ 5 درجے اوپر جاتا ہے۔”. The hidden-result line puts the site first and the verb last: “fandom.com اور 2 مزید چھپائے گئے کیونکہ ان پر “AI slop” کا ٹیگ ہے”.
- **Joined lists.** `Intl.ListFormat('ur')` joins with the serial comma and اور or یا: “A، B، اور C”. The facts under a list in Settings → Lists come out as “60 ہدایات، 5 ٹیگ، از Bishop-V، اور اپ ڈیٹ: 5 منٹ پہلے۔”; the اور comes from the browser and can't be changed in the messages.
- **Counts.** Urdu has two plural forms, `_one` and `_other`, and `_one` is only for 1 (0 takes `_other`). Many nouns don't change after a number (5 ٹیگ, 3 سیکنڈ), so some `_one` and `_other` pairs are identical; that's correct.
- **Script slips:** Latin punctuation (, . ; ?) after Urdu, Arabic-language letters where Urdu has its own (ي for ی, ك for ک, ه for ہ or ھ), a missing U+200E mark beside code, and Hindi-leaning words where the Urdu word is usual.
- **Length.** Urdu runs about as long as English, but Nastaliq is tall: check that buttons and the popup at 320px don't clip the descenders or push a label onto a second line.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become (read the description).
2. Placeholders kept (`npm test` checks), counts have `_one` and `_other`.
3. Glossary and register hold: search for تم, تمہارا, bare imperatives, and English words the glossary replaces (Ranking, Hide).
4. Typography: ۔ ، ؛ ؟ and no Latin , . ; ? outside names and quoted English, “ ” quotes, ← in paths, U+200E marks kept beside code and `https://`, no soft hyphens.
5. Read the built sentences in place, right to left: the summary, the hidden-result lines, the ⚖ menu's Why, Settings → Tags' effect lines, and the list facts in Settings → Lists.
6. Check the names of Google's panels and Firefox's menus against the real products in Urdu.

## Fixing

Edit `locales/ur/messages.json`, then `node scripts/locales.mjs record ur <key>…` for each message you changed, so it's marked as translated from today's English. `npm test` checks keys, placeholders, and records. Once a speaker has read the whole language through, change “Not yet” for Urdu in `docs/guide/translate.md`.
