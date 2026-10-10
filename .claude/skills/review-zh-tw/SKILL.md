---
name: review-zh-tw
description: 'Review or correct Anubis''s Traditional Chinese translation (locales/zh_TW/messages.json). Use when asked to review, proofread, fix, or extend the Traditional Chinese interface text, or when English messages changed and Chinese needs retranslating. Covers register (你), typography (full-width punctuation, spacing around Latin words and numbers), the fixed glossary, the names browsers and Google use in Traditional Chinese, and the mistakes machine translation makes.'
---

# Reviewing the Traditional Chinese translation

The Traditional Chinese interface is `locales/zh_TW/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is Traditional Chinese as written in Taiwan/Hong Kong, for browsers set to `zh-TW` or `zh-HK`. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=zh_TW node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=zh_TW node e2e/run.mjs docs` (don't commit those).

## Register and tone

- **你**, never 您. Modern zh-TW software addresses the user as 你 for a friendly, plain tone. Search for 您 when reviewing.
- Buttons are short verb phrases: 隱藏, 新增網站, 載入更多結果, 取消訂閱. Don't add 請 to a button; use it only in instructions and errors (請輸入…, 請檢查網址).
- Results of an action use 已: 已隱藏 fandom.com。, 已訂閱 $1。. Progress uses 正在: 正在載入…, 正在同步….
- Short and plain. Avoid literary or bureaucratic words (予以, 進行 + verb where the verb alone works).

## Typography

- **Full-width punctuation** in Chinese text: ，。：；？！（）、. The `quoted` message is “$1”, with the curly quotes Chinese uses.
- Names of interface items in running text go in “”: 選擇“立即同步”, “載入更多結果”. A path of menus is “清單”→“新增清單”.
- **Spacing:** one half-width space between Chinese and a Latin word or a number (Anubis 已啟用, 第 3 頁, 12 個字元, 5 MB), and none next to full-width punctuation (在 Google、DuckDuckGo 或 Bing 上, not Google 、). A placeholder follows the same rule by what it stands for: sites, list names, and numbers are spaced (隱藏 $1, $1 個清單); placeholders filled with Chinese text, or with a fragment that already ends in punctuation, are not (Anubis 在 $2中$1。, $1會在…).
- Ellipsis: a single … after the verb, as browsers' Chinese menus write it (正在載入…, 篩選 $1 個網站…).
- Ranges with an en dash: 1–$2. Parentheses around a shortcut or a ranking are full width: $1（$2）.
- No soft hyphens: the ranking words are two characters each and never need breaking.

## Glossary

| English | Traditional Chinese |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | 隱藏 / 降低 / 正常 / 提升 / 釘選 |
| Hidden / Lowered / Raised / Pinned | 已隱藏 / 已降低 / 已提升 / 已釘選 |
| ranking (a site's); to rank | 排名; 設定排名 (為它的網站設定排名) |
| rerank | 重新排序 |
| tag (noun); to tag; untag | 標籤; 加上標籤 (為 $1 加上“$2”標籤); 移除…的標籤 |
| list | 清單 |
| your list (the personal list) | 你的清單 |
| your lists (the ones you subscribe to) | 你訂閱的清單 (Chinese has no plural, so this must never be 你的清單) |
| subscribe, unsubscribe | 訂閱, 取消訂閱 |
| site, result | 網站, 結果 |
| search page, search engine | 搜尋頁面, 搜尋引擎 |
| panel (what clean-up removes); Remove panels | 區塊 / 面板; 移除區塊 |
| summary | 摘要 |
| lens | 濾鏡 |
| Show hidden | 顯示已隱藏 |
| Load more results | 載入更多結果 |
| Undo | 復原 |
| sync, backup | 同步, 備份 |
| passphrase | 密碼短語 (password is 密碼) |
| settings | 設定 |
| tab (browser or Google) | 分頁, never 標籤, which is a tag |
| issue tracker, pull request | 問題追蹤器, PR / Pull Request |
| filter (the Your sites field) | 篩選 |

## Names to match

- **Google (google.com in zh-TW):** “AI 總覽”, “AI 模式”, “相關問題” (People also ask), “焦點新聞” (Top stories), “討論和論壇”, the tabs “網頁”, “全部”, “圖片”.
- **Firefox:** “擴充功能” (the puzzle-piece button and the Android menu entry), “附加元件” (the sync option), “立即同步”, “固定至工具列”.
- **Chrome:** “擴充功能” (the puzzle piece). **Edge:** “擴充功能”. **Opera:** “擴充功能”.
- Product names stay: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, Duck.ai, WebDAV. Brave's “Find elsewhere” and Startpage's “Block creepy ads, not private search” stay English, since those sites show no Chinese version.
- `welcomeQuery` stays “python list comprehension”: the starter lists tag English documentation, forums, and Wikipedia, which a Chinese query would not reach.

## What machine translation gets wrong here

- **Built sentences.** Chinese word order differs, so frames carry the structure. Check these filled in:
  - `summaryActed` puts the total first: “Anubis 在 7 個結果中釘選了 1 個、提升了 2 個和隱藏了 2 個。” The parts are verb + 了 + count + 個.
  - `summaryShortActed`: “Anubis 變更了 9 個結果中的 4 個。”
  - `tagMarks` with `tagMarksYours` and `tagMarksFromList`: “標記了你的 3 個網站和來自 Official docs 的 60 個網站。” The parts start with Chinese, so the browser's join (和, 、) needs no space.
  - `tagEffectOneList`: “……網站。Official docs 提升其中 51 個和隱藏其中 3 個。”; `tagEffect*` name their subject, 這些網站, since the frame's first sentence ends in 。.
  - `menuReason` is “$1：$2。”, so it reads the same for a Latin list name and for 你的清單 or 你的標籤設定: “Docs list：將其提升 3 位和為其加上“Docs”標籤。”
  - `choiceRaise` and `choiceLower` have only an `_other` form, used for one tag too, so “each” is “（每個標籤 $2 位）”, which still reads for one tag.
  - `popupHintLists`: “已提升（依據：Official docs）。”, because `$1` is already a past-tense ranking (已…). `$2` is list names or 你的標籤設定 (`popupYourTagSettings`), so the colon keeps it reading without a stray space either way.
- **Plural forms.** Chinese uses only `_other`. A count needs a measure word: 個 for sites, results, lists, tags, and panels; 條 for rules and instructions; 行 for lines; 頁 for pages; 位 for places in a ranking; 排 for a row of buttons. Never write an `_one` form, and never make an `_other` message that reads wrongly for 1.
- **Overused 被 and pronouns.** Machine output piles up 被 passives and 它/它們. Prefer 將其… for actions on one result, and name the subject (這些網站) where English says “them”.
- **你的清單 versus 你訂閱的清單.** English “your lists” (plural) means the subscribed lists; translated literally it collides with “your list”, the personal one. Check every “whatever your lists say”, “from your lists”, and “Your lists” heading.
- **標籤 versus 分頁.** A tab is always 分頁.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); counts have only `_other`, with the right measure word.
3. Glossary and register hold: search for 您, 標籤 used for a tab, 你的清單 where the subscribed lists are meant, and Simplified characters.
4. Typography: no ASCII , . : ? ( ) or straight quotes in Chinese text; half-width spaces only between Chinese and Latin words or numbers.
5. Read the built sentences aloud: the summary, the hidden-results line, the ⚖ menu's Why, and Settings → Tags' effect lines.

## Fixing

Edit `locales/zh_TW/messages.json`, then `node scripts/locales.mjs record zh_TW <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Chinese (Traditional) in `docs/guide/translate.md`.
