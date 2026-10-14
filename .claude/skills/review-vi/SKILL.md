---
name: review-vi
description: 'Review or correct Anubis''s Vietnamese translation (locales/vi/messages.json). Use when asked to review, proofread, fix, or extend the Vietnamese interface text, or when English messages changed and Vietnamese needs retranslating. Covers register (bạn), typography (precomposed diacritics, tone-mark placement, curly quotes), the fixed glossary, the names browsers and Google use in Vietnamese, and the mistakes machine translation makes, above all in sentences built from parts.'
---

# Reviewing the Vietnamese translation

The Vietnamese interface is `locales/vi/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is standard Vietnamese as Google, Chrome, and Firefox show it in Vietnam. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=vi node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=vi node e2e/run.mjs docs` (don't commit those).

Vietnamese has only CLDR's `other` plural form, so every count message has `_other` alone, and it must read correctly for 1 as well as for 9: no "tất cả" ("all") or "các" in a count message unless the count can't be 1.

## Register and tone

- **bạn** for "you" and "của bạn" for "your", as Google and Chrome do: "danh sách của bạn", "cài đặt nhãn của bạn". Never "anh/chị", "quý vị", or "mày".
- Buttons, switches, and menu items are bare verbs or nouns: "Ẩn", "Đăng ký", "Lưu", "Hoàn tác", "Thêm trang web", "Tải thêm kết quả". Don't add "hãy" or "vui lòng" to a button.
- Instructions in hints may use "hãy" sparingly; most read better as a plain imperative ("Nhập tên người dùng và mật khẩu."), as Google writes them.
- Notices after something happened use "Đã" with the verb: "Đã ẩn fandom.com.", "Đã khôi phục bản sao lưu.". Without "đã" they read as a button.
- Sentence case: only the first word and names take a capital ("Tải thêm kết quả", not "Tải Thêm Kết Quả"). Firefox's and Google's own names keep their capitals.

## Typography

- **Precomposed letters (NFC).** Every letter with a diacritic is one character: "ệ" is U+1EC7, not "e" + U+0323 + U+0302. Decomposed text looks the same in an editor but breaks search and can render with misplaced marks. Check with `node -e 'const m=require("./locales/vi/messages.json");for(const[k,v]of Object.entries(m))if(v.message!==v.message.normalize("NFC"))console.log(k)'`.
- **Tone marks in the old style, as Google and Microsoft place them:** "hóa", "hòa", "hủy", "thúy", "lựa" (not "hoá", "hoà", "huỷ"). Use "y" where Google does: "kỹ thuật", "lý do", "quy tắc" (not "kĩ", "lí").
- Quotes: curly double quotes as in English, “$1”. The `quoted` message is “$1”. No straight quotes, no guillemets.
- No serial comma: `Intl.ListFormat('vi')` joins "A, B và C" and "A, B hoặc C", which is Vietnamese usage. Don't write "và" or "hoặc" into a frame that `tJoin` fills.
- No space before : ; ? ! and the ellipsis character … ("Đang tải…"). A space between a number and its unit or noun: "12 ký tự", "5 MB", "3 trang web".
- The en dash in ranges ("1–$2") and in the settings page title ("$1 – Anubis").
- Vietnamese words are single syllables separated by spaces, so lines break between syllables and the ranking words need no soft hyphens.

## Glossary

| English | Vietnamese |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings, buttons) | Ẩn / Hạ / Bình thường / Nâng / Ghim |
| Hidden / Lowered / Raised / Pinned (chips under a result) | Đã ẩn / Đã hạ / Đã nâng / Đã ghim |
| hid / lowered / raised / pinned (summary parts) | ẩn / hạ / nâng / ghim, after "Anubis đã" |
| ranking (a site's), to rank | thứ hạng, xếp hạng |
| rerank, reranking | xếp hạng lại |
| tag (noun), to tag, tagged, untag | nhãn, gắn nhãn, có nhãn, gỡ nhãn |
| label (Lists label results, Label only) | gắn nhãn, Chỉ hiện nhãn: the same word as tag, which is what it means here |
| list, your list, your lists (subscribed) | danh sách, danh sách của bạn, các danh sách bạn đăng ký |
| subscribe, unsubscribe, subscription | đăng ký, hủy đăng ký, gói đăng ký |
| site, result, search page, search engine | trang web, kết quả, trang tìm kiếm, công cụ tìm kiếm |
| instruction (a list's rule line), rule, pattern | chỉ thị, quy tắc, mẫu |
| panel (clean-up), Remove panels | khung, Gỡ khung |
| remove (from the page), delete, forget | gỡ, xóa, bỏ |
| summary | bản tóm tắt |
| lens | lăng kính |
| Show hidden / Hide them again | Hiện mục đã ẩn / Ẩn lại |
| Load more results | Tải thêm kết quả |
| Undo | Hoàn tác |
| sync, backup, restore | đồng bộ hóa, sao lưu (bản sao lưu), khôi phục |
| passphrase, password | cụm mật khẩu, mật khẩu |
| end to end (encryption) | mã hóa đầu cuối |
| settings | cài đặt |
| tab (browser, Google) | thẻ ("thẻ mới", "thẻ Web"), as Chrome and Firefox say |
| on / off | bật / tắt |
| places (raise it by 3) | bậc ("nâng 3 bậc") |
| issue tracker | trình theo dõi vấn đề |
| colour scheme, theme | bảng màu, giao diện |

"Tag" is **nhãn**, not "thẻ": Chrome, Firefox, and Google call a browser tab "thẻ", and Anubis talks about both ("Mở trong thẻ mới", "thẻ Web" of Google). Keep them apart.

"Your list" (the personal one) and "your lists" (subscriptions) are different things that English tells apart only by the plural. Vietnamese keeps them apart with "danh sách của bạn" against "các danh sách bạn đăng ký"; don't merge them.

## Names to match

- **Google (google.com.vn):** "Tổng quan do AI tạo" (AI Overview), "Chế độ AI" (AI Mode), "Mọi người cũng hỏi" (People also ask), "Tin bài hàng đầu" (Top stories), "Thảo luận và diễn đàn" (Discussions and forums), the tabs "Web", "Tất cả", "Hình ảnh". These are the least certain names in the file; check them against a live Vietnamese Google page.
- **Firefox:** "Tiện ích" (Add-ons, in the sync settings), "Đồng bộ ngay" (Sync Now), "Ghim vào thanh công cụ" (Pin to Toolbar), "Tiện ích mở rộng" (the Extensions button, and the Android menu entry), "thanh địa chỉ". Check them against Mozilla's Vietnamese strings (Pontoon) before trusting them.
- **Chrome:** "Tiện ích" (the puzzle piece), "thanh địa chỉ". **Edge:** "Tiện ích mở rộng". **Opera:** "Tiện ích mở rộng" (unchecked).
- Product names stay: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, InfiniCLOUD, Nextcloud, Duck.ai, WebDAV, GitHub. GitHub's own terms stay English ("pull request", "gist"). Quoted English UI from sites with no Vietnamese version stays English: Brave's “Find elsewhere”, Startpage's “Block creepy ads, not private search”.

## What machine translation gets wrong here

- **Plural words after numbers.** Vietnamese doesn't mark the plural after a number: "3 trang web", "60 nhãn", never "3 các trang web" or "những 3". "Các" and "những" are for an unnumbered plural only: `tagEffectLists` says "Các danh sách".
- **Sentences built from parts.** Vietnamese keeps English's order (subject, verb, object), so most frames translate in place, but each part must fit the frame around it:
  - `summaryActed` + `summaryPinned`…: "Anubis đã ghim 1, nâng 2 và ẩn 3 trên tổng số 14 kết quả từ 2 trang." The parts are bare verbs; "đã" lives in the frame, once.
  - The hidden line, site + `hiddenMore_other` + `barHidden*_other`: "fandom.com và 2 kết quả khác bị ẩn bởi danh sách của bạn". The passive "bị ẩn" needs no agreement, so one form serves any count.
  - `menuReason` + `reason*`: "Official docs nâng 3 bậc và gắn nhãn “Docs”." The `reason*` parts are verb phrases with no subject, joined by "và".
  - `reasonYourTagSettings` + `choiceTotal`: "Cài đặt nhãn của bạn nâng 5 bậc với mỗi nhãn “Docs” và “Reference”, hạ 5 bậc với mỗi nhãn “Paywalled”, nên kết quả này lên 5 bậc." "Với mỗi nhãn" also has to read for one tag; it does, if a little formally.
  - `tagMarks` + `tagEffectOneList` + `tagListRaises_other`: "Gắn cho 3 trang web của bạn và 60 trang web từ Official docs. Official docs nâng 51 và ẩn 2 trong số đó."
  - `popupHintLists` + a chip + list names: "Đã ẩn bởi Official docs. Chọn một mức để tự quyết định." With `popupYourTagSettings`, kept in lower case: "Đã nâng bởi cài đặt nhãn của bạn."
  - `listsFacts` joins with the `unit` list format, which is commas only: "60 chỉ thị, 5 nhãn, do Bishop-V tạo, cập nhật 5 phút trước."
- **Labels that must start with another label's words.** `weighLabelRanked` starts with `weighLabel`'s words ("Ẩn, xếp hạng hoặc gắn nhãn fandom.com (đã hạ)"), and `hiddenShowSite` with `hiddenShow`'s ("Hiện fandom.com"), so screen readers match the visible text.
- **Sino-Vietnamese and literal wording.** Prefer what Google says: "cài đặt" (not "thiết lập" or "tùy chỉnh" for Settings), "tải xuống", "hoàn tác", "đồng bộ hóa"; not "vô hiệu hóa" for a plain Off, nor "phục hồi" mixed with "khôi phục".
- **"Remove", "delete", and "hide".** Anubis never deletes a result: it hides results ("ẩn") and removes panels from the page ("gỡ"). "Xóa" is only for deleting your own things (a tag, a site from your list).
- **"Bị" and "được".** "Bị" is for something unwelcome to the subject, "được" for something good or neutral. A hidden result "bị ẩn"; a pinned one "được ghim". Machines use "được" everywhere.
- **Length.** Vietnamese runs about 20–30% longer than English. "Hiện mục đã ẩn", "Bình thường", and the ⚖ menu's row of five are the ones to watch, and the popup at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); counts have `_other` only, and each reads right for 1.
3. Glossary and register hold: search for "thẻ" used for a tag, "anh/chị", "quý vị", "thiết lập", "hoá", "huỷ", "kĩ", and straight quotes.
4. Every message is NFC (the command above prints nothing).
5. Read the built sentences aloud: the summary, the hidden line, the ⚖ menu's Why, the popup's hint, Settings → Tags' effect lines, and Settings → Lists' facts.

## Fixing

Edit `locales/vi/messages.json`, then `node scripts/locales.mjs record vi <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Vietnamese in `docs/guide/translate.md`.
