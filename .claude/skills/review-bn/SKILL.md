---
name: review-bn
description: 'Review or correct Anubis''s Bengali translation (locales/bn/messages.json). Use when asked to review, proofread, fix, or extend the Bengali (Bangla) interface text, or when English messages changed and Bengali needs retranslating. Covers register (আপনি), typography (the dari, quotation marks, suffixes on Latin names), the fixed glossary, the names browsers and Google use in Bengali, and the mistakes machine translation makes.'
---

# Reviewing the Bengali translation

The Bengali interface is `locales/bn/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=bn node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=bn node e2e/run.mjs docs` (don't commit those).

## Which Bengali, and who sees it

- One file, `bn`, serves Bangladesh and India (West Bengal, Tripura, Assam), since the browsers offer `bn` without a region. Write the standard written language (চলিত ভাষা) that both read, and avoid words only one side uses.
- The model is the everyday Bangla of Google's and Chrome's Bengali interfaces. It keeps common English tech words in Bengali script (সার্চ, সেটিংস, ট্যাগ, সিঙ্ক, সেভ, লোড, ডাউনলোড, সাবস্ক্রাইব), not the formal Sanskrit coinages (অনুসন্ধান, সংরক্ষণ, সমলয়ন) that read as stiff.
- Chrome's Bengali says পৃষ্ঠা for a page, so Anubis does too (সার্চ পৃষ্ঠা, পরের পৃষ্ঠা), not পেজ. The one exception is হোমপেজ, a list's homepage link.

## Register and tone

- **আপনি** everywhere, as Google and Chrome do. Imperatives in the আপনি form: করুন, দেখুন, লিখুন, বেছে নিন, খুলুন. Never তুমি or তুই, and never the bare imperative (কর, দেখ).
- Buttons are imperatives (লুকান, সেভ করুন, একটি তালিকা যোগ করুন). Choices that name a state are nouns or adjectives (চালু, বন্ধ, হালকা, গাঢ়, সোনালি, সাদামাটা).
- Short and plain. Plurals use -গুলি (তালিকাগুলি, ফলাফলগুলি), not -গুলো, matching Chrome. Use -গুলি only where the plural matters; ফলাফল and সাইট are plural enough after a number.
- Sentences report what happened in the passive with হয়েছে (“$1 লুকানো হয়েছে।”), or with Anubis as the subject in the past (“Anubis … লুকিয়েছে।”).

## Typography

- **The dari (।)** ends every sentence, including after a Latin word or a placeholder (“… Anubis-এর ব্যাকআপ নয়।”, “$1।”). An ASCII full stop appears only inside a domain, a file name, or a URL. Question and exclamation marks stay ? and !, with no space before them.
- **Quotation marks** are the curly English ones, “ ”. The `quoted` message is “$1”. Names of Google's, Firefox's, and Anubis's own buttons and panels are quoted when they appear in a sentence (“এআই ওভারভিউ”, “এখনই সিঙ্ক করুন”, “লুকানোগুলি দেখান”).
- **No serial comma.** Bengali joins lists as “ক, খ এবং গ”, which is what `Intl.ListFormat('bn')` gives `tJoin`, and how lists written into messages read too. Inside a sentence, এবং and আর both mean “and”; use এবং to join parts and আর for a lighter link in short phrases.
- **Suffixes on Latin names and placeholders** take a hyphen: Anubis-এর, Google-এ, Firefox-এর, $1-কে, $2-এর, পৃষ্ঠা $2-এর. Put the suffix where the frame needs it, not inside a name.
- **Counts** take the classifier টি straight after the number, with no space: $1টি তালিকা, 12টি অক্ষর. Measures (সেকেন্ড, ধাপ, KB, MB) take a space and no টি: প্রায় $1 সেকেন্ড, $1 ধাপ উপরে.
- **Digits.** Anubis fills in counts with Western digits (7টি ফলাফল), so numbers written into messages are Western too (10 মিনিট, 500টি). The browser's own relative times come in Bengali digits (৫ মিনিট আগে); leave those alone.
- **Conjuncts.** র‍্যাঙ্ক and র‍্যাঙ্কিং need the zero-width joiner (র + U+200D + ্ + য), or they show as a reph (র্যাঙ্ক). Search for র্য without the joiner.
- The ellipsis character … with no space before it: লোড হচ্ছে…
- **No soft hyphens.** All five ranking words are short, and the two-word ones (নিচে নামান, উপরে তুলুন, পিন করুন) break at their space in the ⚖ menu's row.

## Glossary

| English | Bengali |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | লুকান / নিচে নামান / সাধারণ / উপরে তুলুন / পিন করুন |
| Hidden / Lowered / Raised / Pinned | লুকানো / নিচে নামানো / উপরে তোলা / পিন করা |
| hides / lowers / raises / pins (a list or tag does) | লুকায় / নিচে নামায় / উপরে তোলে / পিন করে |
| ranking (a site's); to rank | র‍্যাঙ্কিং; র‍্যাঙ্ক করুন |
| rerank | নতুন করে সাজানো (ফলাফল নতুন করে সাজান) |
| tag (noun, verb); tagged | ট্যাগ, ট্যাগ করুন; ট্যাগ করা |
| list, subscribe, unsubscribe | তালিকা, সাবস্ক্রাইব করুন, আনসাবস্ক্রাইব করুন |
| your list; your lists | আপনার তালিকা; আপনার তালিকাগুলি |
| site, result, search page | সাইট, ফলাফল, সার্চ পৃষ্ঠা |
| search engine | সার্চ ইঞ্জিন |
| panel (clean-up); Remove panels | প্যানেল; প্যানেল সরান |
| summary | সারাংশ |
| lens | লেন্স |
| Show hidden | লুকানোগুলি দেখান |
| Load more results | আরও ফলাফল লোড করুন |
| Undo | পূর্বাবস্থায় ফেরান |
| sync, backup | সিঙ্ক, ব্যাকআপ |
| passphrase | পাসফ্রেজ |
| settings | সেটিংস |
| tab | ট্যাব |
| place (raises it by 3) | ধাপ (3 ধাপ উপরে তোলে) |
| instruction (a list's rule line) | নির্দেশ |

“Your list” (personalListName, Anubis's name for the user's own list) is singular, আপনার তালিকা; “Your lists” (welcomeListsHeading) is plural, আপনার তালিকাগুলি. Keep them apart.

## Names to match

- **Google (google.com.bd, google.co.in in Bengali):** “এআই ওভারভিউ”, “এআই মোড”, “লোকেরা এছাড়াও জিজ্ঞাসা করে”, “শীর্ষ খবর”, “আলোচনা ও ফোরাম”, and the tabs “ওয়েব”, “সব”, “ছবি”. The tab names are reliable. The panel names, especially “People also ask”, “Top stories”, and “Discussions and forums”, were chosen without seeing Google in Bengali: check them on a live Google page set to Bengali first.
- **Firefox:** “অ্যাড-অন” (Add-ons in sync settings), “এখনই সিঙ্ক করুন”, “টুলবারে পিন করুন”, “এক্সটেনশন”. Check them against Firefox's Bengali build.
- **Chrome:** “এক্সটেনশন” (the puzzle piece), অ্যাড্রেস বার. Edge and Opera use the same words.
- Product names stay in Latin script: Anubis, Google, Firefox, Brave Goggles, uBlacklist, HOHSER, WebDAV. Quoted English UI from sites that show no Bengali stays English (Brave's “Find elsewhere”, Startpage's “Block creepy ads, not private search”). The welcome page's search, `welcomeQuery`, stays “python list comprehension”, since Bengali speakers search for programming in English and the starter lists' tags only show on those results.

## What machine translation gets wrong here

- **Word order in built sentences.** Bengali is subject–object–verb, so a frame's verb comes last and its parts go before it. `summaryActed` is “Anubis $2 থেকে $1।”, with the parts as counted verbs: “Anubis 7টি ফলাফল থেকে 1টি পিন করেছে, 2টি উপরে তুলেছে এবং 3টি লুকিয়েছে।” `tagEffectOneList` reads “এটি আপনার 3টি সাইট এবং Official docs-এর 60টি সাইট চিহ্নিত করে। Official docs সেগুলির মধ্যে 51টি উপরে তোলে এবং 2টি লুকায়।” `menuReason` reads “Official docs এটিকে 3 ধাপ উপরে তোলে এবং এটিকে “Docs” ট্যাগ করে।” The ⚖ menu's tag choices read “আপনার ট্যাগ সেটিংস “A” এবং “B” ট্যাগের প্রতিটির কারণে এটিকে 2 ধাপ করে উপরে তোলে, ফলে এটি 2 ধাপ উপরে ওঠে।” Check the frame and its parts together; translating a part alone puts the verb in the wrong place.
- **The hidden-result line** is the site, then `hiddenMore`, then `barHidden…`, joined with spaces: “fandom.com এবং আরও 2টি আপনার তালিকা অনুযায়ী লুকানো”. Each part must read after the one before it, so `barHidden…` are participle phrases (… অনুযায়ী লুকানো, “$2” ট্যাগ থাকায় লুকানো), not sentences.
- **Ambiguous order with a placeholder before a noun.** “$1 পৃষ্ঠা $2 …” with $1 = Google reads as “Google page 2”. Put the page first: “পৃষ্ঠা $2 পাঠাতে $1 রাজি হয়নি।”
- **Plurals.** Bengali has `_one` and `_other`, and CLDR's `one` covers 0 as well as 1. A noun after a number stays singular, so the two forms are usually the same; where English `_one` has no `$1` (“an AI answer”), Bengali uses একটি.
- **No subject where English drops one.** “Hides them from your searches.” after a sentence about the tag needs এটি in Bengali: “এটি আপনার সার্চ থেকে সেগুলিকে লুকায়।”
- **Labels that must start with another label's words.** `hiddenShowSite` starts with `hiddenShow`'s word for voice control, so it is “দেখান: $1”, not “$1 দেখান”. `weighLabelRanked` starts as `weighLabel` does.
- **Over-formal words** from a dictionary: অনুসন্ধান for search, সংরক্ষণ for save, সমলয়ন for sync, পূর্বনির্ধারিত for default. Use what Chrome uses.
- **Script slips:** an ASCII full stop for the dari, a straight quote for “ ”, র্য for র‍্যা, and -গুলো mixed with -গুলি.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks), counts have `_one` and `_other`.
3. Glossary and register hold: search for তুমি, কর , দেখ , পেজ, অনুসন্ধান, সংরক্ষণ, and -গুলো.
4. Typography: every sentence ends in ।, no ASCII “.” outside domains and file names, no straight quotes, র‍্যাঙ্ক with the joiner.
5. Read the built sentences aloud: the summary, the hidden-result line, the ⚖ menu's Why, and Settings → Tags' effect lines.
6. Look at the popup and Settings at 320px: Bengali conjuncts sit taller than Latin text, so check that nothing clips.

## Fixing

Edit `locales/bn/messages.json`, then run `node scripts/locales.mjs record bn <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change “Not yet” for Bengali in `docs/guide/translate.md`.
