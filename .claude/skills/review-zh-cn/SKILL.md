---
name: review-zh-cn
description: 'Review or correct Anubis''s Simplified Chinese translation (locales/zh_CN/messages.json). Use when asked to review, proofread, fix, or extend the Chinese interface text, or when English messages changed and Chinese needs retranslating. Covers register (你), typography (full-width punctuation, spacing around Latin words and numbers), the fixed glossary, the names browsers and Google use in Chinese, and the mistakes machine translation makes.'
---

# Reviewing the Simplified Chinese translation

The Chinese interface is `locales/zh_CN/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is Simplified Chinese as written in mainland China, for browsers set to `zh-CN`. Traditional Chinese (`zh_TW`) would be a separate translation, not a conversion of this one. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=zh_CN node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=zh_CN node e2e/run.mjs docs` (don't commit those).

## Register and tone

- **你**, never 您. Modern zh-CN software (Microsoft's Chinese style guide, Apple, most apps) addresses the user as 你 for a friendly, plain tone. Search for 您 when reviewing.
- Buttons are short verb phrases: 隐藏, 添加网站, 加载更多结果, 取消订阅. Don't add 请 to a button; use it only in instructions and errors (请输入…, 请检查地址).
- Results of an action use 已: 已隐藏 fandom.com。, 已订阅 $1。. Progress uses 正在: 正在加载…, 正在同步….
- Short and plain. Avoid literary or bureaucratic words (予以, 进行 + verb where the verb alone works).

## Typography

- **Full-width punctuation** in Chinese text: ，。：；？！（）、. The `quoted` message is “$1”, with the curly quotes Chinese uses; never straight quotes or 「」 (those are Traditional/Japanese practice).
- Names of interface items in running text go in “”: 选择“立即同步”, “加载更多结果”. A path of menus is “列表”→“添加列表”.
- **Spacing:** one half-width space between Chinese and a Latin word or a number (Anubis 已安装, 第 3 页, 12 个字符, 5 MB), and none next to full-width punctuation (在 Google、DuckDuckGo 或 Bing 上, not Google 、). A placeholder follows the same rule by what it stands for: sites, list names, and numbers are spaced (隐藏 $1, $1 个列表); placeholders filled with Chinese text, or with a fragment that already ends in punctuation, are not (Anubis 在 $2中$1。, $1会在…).
- Ellipsis: a single … after the verb, as browsers' Chinese menus write it (正在加载…, 筛选 $1 个网站…).
- Ranges with an en dash: 1–$2. Parentheses around a shortcut or a ranking are full width: $1（$2）.
- No soft hyphens: the ranking words are two characters each and never need breaking.

## Glossary

| English | Chinese |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | 隐藏 / 降低 / 正常 / 提升 / 置顶 |
| Hidden / Lowered / Raised / Pinned | 已隐藏 / 已降低 / 已提升 / 已置顶 |
| ranking (a site's); to rank | 排名; 设定排名 (为它的网站设定排名) |
| rerank | 重新排序 |
| tag (noun); to tag; untag | 标签; 加标签 (给 $1 加上“$2”标签); 移除…的标签 |
| list | 列表 |
| your list (the personal list) | 你的列表 |
| your lists (the ones you subscribe to) | 你订阅的列表 (Chinese has no plural, so this must never be 你的列表) |
| subscribe, unsubscribe | 订阅, 取消订阅 |
| site, result | 网站, 结果 |
| search page, search engine | 搜索页面, 搜索引擎 |
| panel (what clean-up removes); Remove panels | 面板; 移除面板 |
| summary | 摘要 |
| lens | 滤镜 |
| Show hidden | 显示已隐藏 |
| Load more results | 加载更多结果 |
| Undo | 撤销 |
| sync, backup | 同步, 备份 |
| passphrase | 密码短语 (password is 密码) |
| settings | 设置 |
| tab (browser or Google) | 标签页, never 标签, which is a tag |
| issue tracker, pull request | 问题跟踪器, 拉取请求 |
| filter (the Your sites field) | 筛选 |

## Names to match

- **Google (google.com in zh-CN):** “AI 概览”, “AI 模式”, “相关问题” (People also ask), “头条新闻” (Top stories), “讨论和论坛”, the tabs “网页”, “全部”, “图片”. “相关问题” is the least certain: check it against a live Google page in Chinese.
- **Firefox:** “扩展” (the puzzle-piece button and the Android menu entry), “附加组件” (the sync option), “立即同步”, “固定到工具栏”.
- **Chrome:** “扩展程序” (the puzzle piece). **Edge:** “扩展”. **Opera:** “扩展”.
- Product names stay: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, Duck.ai, WebDAV. Brave's “Find elsewhere” and Startpage's “Block creepy ads, not private search” stay English, since those sites show no Chinese version.
- `welcomeQuery` stays “python list comprehension”: the starter lists tag English documentation, forums, and Wikipedia, which a Chinese query would not reach.

## What machine translation gets wrong here

- **Built sentences.** Chinese word order differs, so frames carry the structure. Check these filled in:
  - `summaryActed` puts the total first: “Anubis 在 7 个结果中置顶了 1 个、提升了 2 个和隐藏了 2 个。” The parts are verb + 了 + count + 个.
  - `summaryShortActed`: “Anubis 更改了 9 个结果中的 4 个。”
  - `tagMarks` with `tagMarksYours` and `tagMarksFromList`: “标记了你的 3 个网站和来自 Official docs 的 60 个网站。” The parts start with Chinese, so the browser's join (和, 、) needs no space.
  - `tagEffectOneList`: “……网站。Official docs 提升其中 51 个和隐藏其中 3 个。”; `tagEffect*` name their subject, 这些网站, since the frame's first sentence ends in 。.
  - `menuReason` is “$1：$2。”, so it reads the same for a Latin list name and for 你的列表 or 你的标签设置: “Docs list：将其提升 3 位和为其加上“Docs”标签。”
  - `choiceRaise` and `choiceLower` have only an `_other` form, used for one tag too, so “each” is “（每个标签 $2 位）”, which still reads for one tag.
  - `popupHintLists`: “已提升（由 Official docs 决定）。”, because `$1` is already a past-tense ranking (已…).
- **Plural forms.** Chinese uses only `_other`. A count needs a measure word: 个 for sites, results, lists, tags, and panels; 条 for rules and instructions; 行 for lines; 页 for pages; 位 for places in a ranking; 排 for a row of buttons. Never write an `_one` form, and never make an `_other` message that reads wrongly for 1.
- **Overused 被 and pronouns.** Machine output piles up 被 passives and 它/它们. Prefer 将其… for actions on one result, and name the subject (这些网站) where English says “them”.
- **你的列表 versus 你订阅的列表.** English “your lists” (plural) means the subscribed lists; translated literally it collides with “your list”, the personal one. Check every “whatever your lists say”, “from your lists”, and “Your lists” heading.
- **标签 versus 标签页.** A tab is always 标签页.
- **Joins the browser makes.** `tJoin` uses the browser's Chinese list format: 和, 或, and 、 with no spaces, so “a.com、b.com和另外 5 个” is expected. In the `unit` style (Settings → Lists, the facts under each list, and a list's kind, which becomes “Anubis 列表滤镜”) Chinese joins the items with nothing at all, so “120 条指令3 个标签作者 Bishop5分钟前更新” runs together. That needs a code change in `entrypoints/options/lists.ts`, not a translation fix.
- **Spaces the code adds.** The summary's second sentence and the hidden-results line are joined with a plain space in code (`utils/summary.ts`, `entrypoints/content/ui.ts`), so “…隐藏了 2 个。 它还移除了…” and “fandom.com 及另外 2 个 已隐藏” carry a space Chinese wouldn't write. Leave the messages as they are; fixing it means changing the code.
- **Script mix-ups.** Watch for Traditional characters (們, 標籤, 設定) and Taiwanese terms (軟體, 網路, 檔案) slipping in: mainland usage is 软件, 网络, 文件.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); counts have only `_other`, with the right measure word.
3. Glossary and register hold: search for 您, 标签 used for a tab, 你的列表 where the subscribed lists are meant, and Traditional characters.
4. Typography: no ASCII , . : ? ( ) or straight quotes in Chinese text; half-width spaces only between Chinese and Latin words or numbers.
5. Read the built sentences aloud: the summary, the hidden-results line, the ⚖ menu's Why, and Settings → Tags' effect lines.

## Fixing

Edit `locales/zh_CN/messages.json`, then `node scripts/locales.mjs record zh_CN <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Chinese in `docs/guide/translate.md`.
