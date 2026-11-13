---
name: review-ja
description: 'Review or correct Anubis''s Japanese translation (locales/ja/messages.json). Use when asked to review, proofread, fix, or extend the Japanese interface text, or when English messages changed and Japanese needs retranslating. Covers register (です/ます), typography (full-width punctuation, 「」 quotes, spacing around Latin words and numbers), the fixed glossary, the names browsers and Google use in Japanese, and the mistakes machine translation makes.'
---

# Reviewing the Japanese translation

The Japanese interface is `locales/ja/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is standard Japanese as Chrome, Firefox, and Google show it in Japan. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=ja node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=ja node e2e/run.mjs docs` (don't commit those).

Japanese has one plural category (`other`), so every count has only an `_other` form, and it has to read correctly for 1 as well as for 9: write 「$1 件の結果」, never anything that means "all" or "each" unless English's `_one` says so too.

## Register and tone

- Sentences are polite です/ます: 「保存しました。」, 「入力してください。」, 「もう一度お試しください。」. No plain-form sentences, and no keigo beyond that (no 「〜いただけます」, 「〜させていただきます」).
- Buttons, switches, menu items, and headings are plain nouns or dictionary-form verbs, as Google and Chrome do: 「保存」, 「サイトを追加」, 「元に戻す」, 「今すぐ同期」, 「結果を並べ替える」. Tooltips that describe a button may end in ます (「この結果を格上げします」).
- Leave out "you" where Japanese can: the subject is usually implied. "Your list", "your sites", and "your tags" are the fixed マイリスト, マイサイト, and マイタグ; avoid あなた.
- Short and plain. Hints under a setting are sentences or noun phrases ending in 。.

## Typography

- Full-width punctuation in Japanese text: 、 and 。, ？ after a question, full-width colon ： and parentheses （）. Never an ASCII comma, full stop, or colon in a Japanese sentence.
- When text follows ？ or ！ in the same message, put a full-width space after it (JTF style): 「間違っていますか？　$1 に報告してください。」. Nothing after it at the end of a message.
- Quotes are 「」: the `quoted` message is 「$1」, and names of buttons, tabs, or tags inside a sentence take 「」 too (「今すぐ同期」を押して…). Quoted English from a site with no Japanese version stays in 「」 with its own punctuation.
- **Spacing around Latin words and numbers.** Put a half-width space between Japanese and Latin letters or digits on either side, as Chrome and Firefox do in Japanese and as `Intl.RelativeTimeFormat` writes 「5 分前」: 「Anubis の設定」, 「12 文字以上」, 「$1 件」, 「Google と Bing」. No space next to full-width punctuation (「$1」, （HTTP $1）, 。Anubis…), and no space after 。. A placeholder follows the same rule by what fills it: a site, list name, or number gets the spaces (「$1 を非表示にしました。」); a Japanese phrase or a 「」-quoted tag does not (「$2中 $1しました」, 「$1により固定」).
- Joined lists come from `Intl.ListFormat('ja')`: 「A、B、C」 and 「AまたはB」. It adds no spaces around Latin items (「A listまたはB list」), and that can't be changed from the messages; leave it. Its `unit` lists (the facts under a list in Settings → Lists, `listsFacts`, and the links after them) are joined by plain spaces, with no 、; that is the code's to fix, not the messages'.
- Range dash is ～ (「1～$2」). The ellipsis is … with no space (「読み込み中…」).
- No soft hyphens: none of the ranking words is long.

## Glossary

| English | Japanese |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings, buttons) | 非表示 / 格下げ / 通常 / 格上げ / 固定 (格上げ and 格下げ stay: each works as a ranking name, a label under a result, and a する verb; 上げる/下げる don't work as labels, 優先 is used for "beats", and 上位/下位 suggest a fixed position) |
| Hidden / Lowered / Raised / Pinned (labels under a result) | 非表示 / 格下げ / 格上げ / 固定 (the same nouns) |
| to hide, lower, raise, pin | 非表示にする, 格下げする, 格上げする, 固定する |
| ranking (a site's), to rank | ランク, ランク付けする |
| rerank, reranking | 並べ替える, 並べ替え |
| tag (noun), to tag, tagged, untag | タグ, タグを付ける / タグ付け, 「X」タグ付き, タグを外す |
| list, your list | リスト, マイリスト (also `personalListName`) |
| your lists (the subscribed ones) | 購読中のリスト |
| subscribe, unsubscribe, subscriptions | 購読する, 購読を解除する, 購読リスト |
| your sites, your tags | マイサイト, マイタグ |
| site, result, search page, search engine | サイト, 結果 (検索結果), 検索ページ, 検索エンジン |
| panel (clean-up), Remove panels | パネル, パネルの削除 |
| summary | サマリー (not 概要, which is Google's AI Overview) |
| lens | レンズ |
| Show hidden | 非表示の結果を表示 |
| Load more results | さらに結果を読み込む |
| Undo | 元に戻す |
| sync, backup | 同期, バックアップ |
| passphrase | パスフレーズ |
| settings, tag settings (tag choices) | 設定, タグの設定 |
| tab | タブ |
| places (raise it by 3) | 段階 (「3 段階格上げ」) |
| counters | results and sites 件; lists and tags 個; pages ページ; lines 行 |

## Names to match

- **Google (google.co.jp):** 「AI による概要」 (AI Overview), 「AI モード」, 「他の人はこちらも質問」 (People also ask; not 「他の人はこちらも検索」, which is People also search for), 「トップニュース」 (Top stories), 「ディスカッションとフォーラム」 (Discussions and forums, as Japanese SEO writing quotes it), and the tabs 「ウェブ」, 「すべて」, 「画像」.
- **Firefox:** 「アドオン」 in its sync settings, 「今すぐ同期」, 「ツールバーにピン留め」, and the 「拡張機能」 button; Firefox for Android is 「Android 版 Firefox」.
- **Chrome:** the 「拡張機能」 button (the puzzle piece) and its pin, which Chrome calls 固定.
- Brave's 「Find elsewhere」 and Startpage's 「Block creepy ads, not private search」 are left in English, as nobody has confirmed a Japanese version; check them on the live sites.
- Product names stay in Latin letters: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, Duck.ai, GitHub, WebDAV.

## What machine translation gets wrong here

- **Sentences built from parts.** Japanese is verb-final, so the frame carries the verb and the parts are noun phrases. Check them filled in:
  - `summaryActed` 「Anubis は $2中 $1しました。」 with `summaryPinned` 「$1 件を固定」… reads 「Anubis は 9 件中 1 件を固定、2 件を格上げ、3 件を非表示にしました。」. `summaryHid` is 「$1 件を非表示に」 so that しました attaches to it; every part must end so that しました can follow.
  - `summaryAlsoRemoved` 「また、$1を削除しました。」 with 「AI による回答 1 件、動画パネル 2 件」. The code puts a space between the two sentences, after 。. `summaryRemovedOnly` is 「Anubis は、$1を削除しました。」: the 、 lets $1 start with either Japanese (動画パネル) or Latin (AI による回答) without a wrong space.
  - `importRead` 「$2として読み込みました：…」 with `importSource*`, which all end in Japanese (「HOHSER のエクスポート」, 「Goggle 形式のリスト」) so that として attaches without a space.
  - `tagMarks` 「$1に付いています。」 then `tagEffect*` with no space after it: 「マイサイト 3 件、Official docs のサイト 60 件に付いています。そのうち Official docs が 51 件を格上げ、2 件を非表示にしています。」.
  - `menuReason` is a label, 「$1：$2」, so the reasons are noun phrases: 「Docs list：3 段階格上げ、「Docs」、「Ref」のタグ付け」; your tag choices read 「タグの設定：「A」、「B」によりタグごとに 5 段階格上げ、差し引き 5 段階の格上げ」.
  - The hidden line is the site, then `hiddenMore`, then `barHidden*`, joined by spaces: 「fandom.com ほか 2 件 「AI slop」タグ付きのため非表示」. A list name there is quoted (「Official docs」で非表示) so it doesn't run into the site's name.
  - `popupHintLists` puts the lists in parentheses after the ranking, 「格上げ（Official docs、DevDocs）。」, so it works for 「タグの設定」 too.
- **Particles after placeholders.** を, に, が, で attach to the placeholder; check what fills it (a site needs 「$1 を」, a quoted tag 「$1を」).
- **Counters.** Machine translation drops them or uses the wrong one: 「3 結果」 is wrong, 「3 件」 right.
- **Katakana overload.** Prefer plain Japanese where Google does: 削除 not リムーブ, 外観 not アピアランス, 同期 not シンク.
- **Clashes with Google's own words.** 概要 is Google's AI Overview, so the summary is サマリー; 固定 is Pin only, so "kept at normal" is 「通常のまま」.
- **"Each" and "all" in counts.** Since `_other` also covers 1, avoid すべて or それぞれ in counted forms; `choiceRaise` uses タグごとに instead.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); counts have only `_other`, and each reads correctly for 1.
3. Glossary and register hold: search for あなた, ピン (only for the pin icons in Chrome and Opera and in Firefox’s own 「ツールバーにピン留め」), 概要 outside Google's name, and plain-form sentences.
4. Typography: no ASCII , . : ( ) in Japanese text, 「」 not “”, a space between Japanese and Latin letters or digits, none beside full-width punctuation, a full-width space after a ？ or ！ that text follows.
5. Read the built sentences aloud: the summary, the hidden line, the ⚖ menu's Why, and Settings → Tags' effect lines.

## Fixing

Edit `locales/ja/messages.json`, then `node scripts/locales.mjs record ja <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Japanese in `docs/guide/translate.md`.
