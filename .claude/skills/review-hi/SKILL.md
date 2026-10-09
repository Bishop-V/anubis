---
name: review-hi
description: 'Review or correct Anubis''s Hindi translation (locales/hi/messages.json). Use when asked to review, proofread, fix, or extend the Hindi interface text, or when English messages changed and Hindi needs retranslating. Covers register (आप), Devanagari typography (पूर्ण विराम, nukta, quotation marks), the fixed glossary, the names browsers and Google use in Hindi, and the mistakes machine translation makes, above all in sentences built from parts.'
---

# Reviewing the Hindi translation

The Hindi interface is `locales/hi/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=hi node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=hi node e2e/run.mjs docs` (don't commit those).

## Which Hindi, and who reads it

Standard Hindi in Devanagari, as Google, Chrome, Gmail, and YouTube speak it in India. That is everyday Hindi, not Sanskritised Hindi: common English loanwords stay where Google's own Hindi keeps them (साइट, टैब, पेज, सेटिंग, सिंक, बैकअप, फ़ाइल, लिंक, सर्च इंजन), and native words are used where Google uses them (नतीजे, सूची, खोज, निजता, सहायता). Avoid coinages such as जालस्थल for site or पृष्ठ for page; readers know the loanwords better. Readers search mostly in English and Hindi together, so technical words they meet in English (WebDAV, gist, git, HTTP) stay as they are.

## Register and tone

- **आप** everywhere, with polite imperatives ending in -एं: « जोड़ें », « चुनें », « दिखाएं », « छिपाएं ». Never तुम or the bare imperative (« जोड़ो »).
- Buttons say what happens, as imperatives (« सूची जोड़ें », « और नतीजे लोड करें »). Headings are noun phrases (« आपकी साइटें », « पैनल हटाएं » is the section's name because it is also the action).
- Short and plain. Prefer « इस्तेमाल करें » over « उपयोग करें », « ज़रूरी नहीं » over « वैकल्पिक », « जांचें » over « सत्यापित करें ».
- Status messages are passive past tense, the way Gmail reports an action: « $1 को छिपाया गया। », « बैकअप रीस्टोर हो गया। ».

## Typography

- Sentences end with the पूर्ण विराम « । », not a full stop, including after a domain or a placeholder (« जैसे fandom.com। », « $1। »). Question marks, colons, and commas are as in English, with no space before them.
- Quotation marks are curly double quotes, “$1”, as Google's Hindi uses; the `quoted` message is “$1”. Never straight quotes.
- Use the nukta where Google does: फ़ाइल, फ़ोल्डर, ज़्यादा, ज़रूरी, सिर्फ़, फ़िल्टर, पासफ़्रेज़, रिपॉज़िटरी. Keep it consistent; don't drop it in some messages and keep it in others.
- Nasal vowels use the anusvara as Google writes them: « छिपाएं », « करें », « सूचियां », « हैं », not « छिपाएँ », « सूचियाँ ».
- Digits are Western (0–9), as Google and Chrome show them. Units are written in Devanagari as Chrome does: « केबी », « एमबी ».
- Interrogatives with a particle take a hyphen: « कौन-सा », « कौन-सी », « कौन-से ».
- The ellipsis is the single character … (« लोड हो रहा है… »).
- No soft hyphens: the five ranking words are short, and the two-word ones (« नीचे करें », « ऊपर करें », « पिन करें ») break at their space in the ⚖ menu's narrow columns.

## Glossary

| English | Hindi |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | छिपाएं / नीचे करें / सामान्य / ऊपर करें / पिन करें |
| Hidden / Lowered / Raised / Pinned | छिपाया गया / नीचे किया गया / ऊपर किया गया / पिन किया गया |
| ranking (a site's); to rank | रैंकिंग (feminine); रैंक करना |
| rerank | फिर से रैंक करना |
| tag (noun, verb); tagged | टैग (masculine); टैग करना; टैग किया गया, “…” टैग वाले |
| list | सूची (feminine), plural सूचियां |
| subscribe, unsubscribe | (की) सदस्यता लेना, (की) सदस्यता छोड़ना, as YouTube's Hindi |
| your list | आपकी सूची |
| site | साइट (feminine), plural साइटें |
| result | नतीजा, plural नतीजे |
| search page | खोज पेज |
| search engine | सर्च इंजन |
| panel (clean-up) | पैनल; Remove panels: पैनल हटाएं |
| summary | सारांश |
| lens | लेंस |
| Show hidden | छिपे हुए दिखाएं |
| Load more results | और नतीजे लोड करें |
| Undo | पहले जैसा करें (Gmail's word) |
| sync | सिंक, सिंक करें |
| backup | बैकअप |
| passphrase | पासफ़्रेज़ (Chrome's word) |
| settings | सेटिंग (Chrome writes it without a plural ending) |
| tab | टैब |
| places (raise it by 3) | स्थान |
| tag choices | टैग से जुड़ी पसंद; the reason line's “Your tag settings” is आपकी टैग सेटिंग |

## Names to match

- **Google (google.co.in in Hindi):** « एआई से खास जानकारी » (AI Overview), « एआई मोड » (AI Mode), « लोग यह भी पूछते हैं » (People also ask), « मुख्य खबरें » (Top stories), « चर्चाएं और फ़ोरम » (Discussions and forums), the tabs « वेब », « सभी », « इमेज ». These were chosen from memory, not checked on a live page: AI Overview, Top stories, and Discussions and forums are the least certain, so check them first on google.co.in with Hindi as the interface language.
- **Firefox (hi-IN):** « ऐड-ऑन » (Add-ons in the sync settings), « अभी सिंक करें » (Sync Now), « टूलबार पर पिन करें » (Pin to Toolbar), « एक्सटेंशन » (Extensions). Firefox's Hindi localisation lags behind the English; check these in a current build.
- **Chrome:** « एक्सटेंशन » (the puzzle-piece button), « पता बार » (address bar).
- Product names stay in Latin script: Anubis, Google, Bing, DuckDuckGo, Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, Duck.ai, Firefox, Chrome, GitHub, WebDAV. Quoted English UI from sites that show no Hindi stays English: Brave's “Find elsewhere” and Startpage's “Block creepy ads, not private search”.
- `welcomeQuery` stays the English search « python list comprehension »: the starter lists tag English documentation, and Hindi speakers search technical topics in English.

## What machine translation gets wrong here

- **Word order.** Hindi is subject–object–verb, so a frame that English fills at the end is often filled in the middle in Hindi. `summaryActed` is « Anubis ने $2 में से $1। », with `$2` (summaryResults) before the parts: « Anubis ने 7 नतीजों में से 1 को पिन किया, 2 को ऊपर किया, और 2 को छिपाया। ». Reshape the frame; don't translate it left to right.
- **Oblique case in parts.** A part that sits before a postposition (में से, को, पर, के) must be in the oblique form. That is why `summaryResults_other` is « $1 नतीजों » (not नतीजे), `summaryResultsPages_other` is « $2 पेजों के $1 नतीजों », the `summaryRemoved…_other` parts end in -ओं (« 2 वीडियो पैनलों », « सवालों की 2 सूचियों ») before `summaryAlsoRemoved`'s « को », and `tagMarksYours_other` is « आपकी $1 साइटों » before `tagMarks`'s « पर ». A nominative plural there (« 7 नतीजे में से ») is the commonest mistake.
- **Agreement with ने.** In the perfective with ने the verb agrees with an object that has no को, so a list of mixed-gender objects can't agree. The summary avoids this by putting को on every object (« 1 को पिन किया », « … को भी हटाया »), which leaves the verb in the default masculine singular. Keep को when changing these.
- **Gender.** सूची, साइट, and सेटिंग are feminine; टैग, नतीजा, and पैनल are masculine. A list's reasons agree with सूची, whatever the list is called: « **Docs list** इसे 3 स्थान ऊपर करती है और इसे “Docs” टैग करती है। », and `tagListRaises` is « $1 को ऊपर करती है » after a list's name, « करती हैं » after « सूचियां ». « आपकी टैग सेटिंग » is feminine singular, so the `choice…` parts use « करती है » too. A tag's marks (`tagMarkRaise`) are masculine: « इस नतीजे को ऊपर करता है ».
- **The hidden line.** It is drawn as the site, then `hiddenMore`, then the reason, so the reason begins with a postposition: « fandom.com का नतीजा छिपाया गया », « fandom.com और 2 अन्य के नतीजे छिपाए गए, क्योंकि उन पर “AI slop” टैग है ». `_one` is only used with no `hiddenMore`, and `_other` always follows it.
- **Plural categories.** Hindi has `one` (0 and 1) and `other`. Zero takes `_one`, so a `_one` form must still read for 0 where that can happen (« 0 सूची »). Where Hindi doesn't change the noun (« $1 टैग », « $1 निर्देश ») both forms are the same.
- **Status labels as participles.** The chips are masculine passive participles (« नीचे किया गया ») so they also fit `popupHintLists`: « Official docs द्वारा ऊपर किया गया। » and `weighLabelRanked`'s brackets.
- **Labels that must start with the button's word.** `hiddenShowSite` is « दिखाएं: $1 », so the spoken name starts with the visible « दिखाएं » for voice control; « $1 दिखाएं » would be more natural but breaks that.
- **Sanskritised or literal words:** परिणाम, पृष्ठ, अधिमान्यताएं, and समायोजन read like a government form. Use the glossary's everyday words.
- **Lists joined by the browser.** `tJoin` uses Intl.ListFormat for `hi`, which writes « a, b, और c » with a comma before और. That is the platform's output, not a message; don't try to fix it in a frame.
- **Length.** Hindi runs a little longer than English, and Devanagari's matras need line height. Watch the popup and buttons at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); counts have `_one` and `_other`.
3. Glossary and register hold: search for « तुम », « करो », « परिणाम », « पृष्ठ », « वरीयता », and English words that slipped through.
4. Typography: every sentence ends in « । », curly quotes only, nukta and anusvara consistent.
5. Fill in the built sentences and read them aloud: the summary with removed panels, the hidden line with « और 2 अन्य », the ⚖ menu's Why with several reasons and with tag choices, Settings → Tags' effect lines for one list and for several, and a list's facts in Settings → Lists.

## Fixing

Edit `locales/hi/messages.json`, then `node scripts/locales.mjs record hi <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change « Not yet » for Hindi in `docs/guide/translate.md`.
