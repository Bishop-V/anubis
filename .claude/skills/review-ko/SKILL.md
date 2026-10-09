---
name: review-ko
description: 'Review or correct Anubis''s Korean translation (locales/ko/messages.json). Use when asked to review, proofread, fix, or extend the Korean interface text, or when English messages changed and Korean needs retranslating. Covers register (합니다/하세요), typography (‘’ quotes, Latin names and numbers in Hangul sentences), particles after placeholders, the fixed glossary, the names browsers and Google use in Korean, and the mistakes machine translation makes.'
---

# Reviewing the Korean translation

The Korean interface is `locales/ko/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is standard South Korean (표준어), as Chrome, Firefox, and Google show it in Korea. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=ko node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=ko node e2e/run.mjs docs` (don't commit those).

Korean has only CLDR's `other` plural form, so every count message has `_other` alone, and it must read correctly for 1 as well as for 9 (no "모두" or "각각" that only fits several).

## Register and tone

- **합니다체 with 하세요 for instructions**, as Chrome and Google's Korean do: "저장했습니다", "다시 시도하세요", "구독하지 못했습니다". Don't mix in 해요체 ("했어요", "할게요") or the plain 한다체.
- No "you": Korean software leaves the person out, and "your" becomes **내** ("내 목록", "내 사이트", "내 태그", "내 태그 설정"), as Google's "내 드라이브" does. Never "당신".
- Buttons, switches, and menu items are plain nouns or verb nouns in -기: "구독", "저장", "연결", "실행취소", "숨기기", "다시 숨기기", "결과 더 불러오기". Not "구독하세요" on a button.
- Short tooltips and screen reader labels are noun phrases without a final verb ending: "$1 숨기기, 순위 매기기, 태그 붙이기", "검색 결과에서 $1 숨기기".
- Short state lines may end in a noun ("$2에서 숨김", "보통으로 유지"), as Korean interfaces commonly do; full sentences end in -니다.

## Typography

- Quotes: ‘’ (U+2018, U+2019) around names, interface labels, and tags: ‘웹’ 탭, ‘지금 동기화’, ‘$1’ 태그. The `quoted` message is ‘$1’. Never straight quotes, and not “” for these (keep “” free for real speech, which the interface doesn't have).
- Sentences end with a full stop "." and lists use ", " as in English. The ellipsis is … ("불러오는 중…").
- Latin names stay in Latin script with spaces as in a sentence: "Google에서", "Anubis가", "Firefox의". Numbers take their counter with no space: "결과 9개", "12자", "3페이지", "약 5초", "$1KB". "3페이지" is page 3; "3개 페이지" is three pages, so `summaryResultsPages` and `summaryUnchangedPages` use "$2개 페이지".
- Korean breaks lines between syllables, so the five ranking words need no soft hyphens; they are all short.
- Parentheses follow the word with no space when they explain it: "도메인 또는 URL(예: fandom.com)", "(권장)". `withShortcut` and `weighLabelRanked` keep a space before the bracket, as English does.

## Particles after placeholders

A particle's form depends on whether the word before it ends in a vowel or a consonant (은/는, 이/가, 을/를, 와/과, 으로/로, 이나/나), and a placeholder can be either: "fandom.com" is read 닷컴 (consonant), "Official docs" 독스 (vowel). Never write a particle that changes form straight after `$1`, and never write the 을(를) style, which reads as a form letter. Instead:

- **Use particles that don't change:** 에, 에서, 의, 도, 만, 까지, 마다, 에게. "$1에서 $2페이지를 보내지 않았습니다", "$1에 제안하세요", "$1의 순위".
- **Put a noun between the placeholder and the particle:** "$1 사이트를 숨겼습니다", "$1 목록을 구독할까요?", "$1 태그가 붙은", "‘$1’ 검색어로", "$1 서버와 $2 계정으로". The particle then follows the noun, whose ending is known.
- **Put the placeholder in brackets after a noun:** "목록이 있는 사이트($1)를".
- **Move the placeholder after a colon:** "사이트 형식이 아닌 것 같습니다: ‘$1’", "읽은 형식: $2.".
- **Rely on a known ending only when every possible filler ends the same way.** `summaryAlsoRemoved` and `summaryRemovedOnly` ("또한 $1를 제거했습니다") are safe only because every `summaryRemoved*` part ends in "개" ("AI 답변 1개"), and the list joins with 및, so the last word is always 개. `sitesTextReadable` ("$1와 $2") relies on `listInstructions` ending in 개. If you change any of those parts, keep them ending in 개 or rewrite the frame.

Particles after fixed words in the same message are checked as usual: "Google과 Bing에서", "Firefox와 Chrome은", "uBlacklist나 HOHSER를", "‘보통’으로", "‘내 태그’로".

## Glossary

| English | Korean |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings, buttons) | 숨기기 / 내리기 / 보통 / 올리기 / 고정 |
| Hidden / Lowered / Raised / Pinned (chips under a result) | 숨김 / 순위 내림 / 순위 올림 / 고정됨 |
| hid / lowered / raised / pinned (summary parts, effect parts) | N개 숨김 / N개 순위 내림 / N개 순위 올림 / N개 고정 |
| ranking (a site's) | 순위; to rank: 순위를 매기다 |
| rerank | 순위 재조정 |
| tag (noun, verb), tagged, untag | 태그, 태그를 붙이다, 태그가 붙은, 태그 제거 |
| list, your list, your lists (subscribed) | 목록, 내 목록, 구독 중인 목록 |
| subscribe, unsubscribe | 구독, 구독 취소 |
| site, result, search page, search engine | 사이트, 결과, 검색 페이지, 검색엔진 |
| instruction (a list's rule line) | 항목 |
| panel (clean-up), Remove panels | 패널, 패널 제거 |
| summary | 요약 |
| lens | 렌즈 |
| Show hidden / Hide them again | 숨긴 항목 표시 / 다시 숨기기 |
| Load more results | 결과 더 불러오기 |
| Undo | 실행취소 |
| sync, backup | 동기화, 백업 |
| passphrase / password | 암호 문구 / 비밀번호 |
| settings, tab | 설정, 탭 |
| places (moved up or down) | 단계 ("순위 3단계 올림") |

"Your list" (the personal one) and "your lists" (subscriptions) are different things that English tells apart only by the plural. Korean keeps them apart with 내 목록 against 구독 중인 목록; don't merge them.

## Names to match

- **Google (google.co.kr):** "AI 개요", "AI 모드", "관련 질문" (People also ask), "주요 뉴스" (Top stories), "토론 및 포럼" (Discussions and forums), the tabs "웹", "전체", "이미지". These are the least certain names in the file; check them against a live Korean Google page.
- **Firefox:** "부가 기능" (Add-ons, in the sync settings), "지금 동기화" (Sync Now), "툴바에 고정" (Pin to Toolbar), "확장 기능" (the Extensions button and the Android menu entry).
- **Chrome:** "확장 프로그램" (the puzzle piece), "주소 표시줄". **Edge:** "확장". **Opera:** "확장 프로그램" (unchecked).
- Product names stay in Latin script: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, Duck.ai. Quoted English UI from sites with no Korean version stays English: Brave's ‘Find elsewhere’, Startpage's ‘Block creepy ads, not private search’.

## What machine translation gets wrong here

- **Particles after placeholders.** See above. A machine writes "$1을 숨겼습니다", which is wrong for half the sites; search for `\$[0-9][은는이가을를와과]` and `\$[0-9]으?로`.
- **Sentences built from parts.** Korean puts the verb last and `tJoin` joins lists with 및 ("A, B 및 C"), so parts can't be verb clauses: "1개를 고정하고, 2개를 올리고 및 3개를 숨겼습니다" is broken. Parts are noun phrases and the frame carries the verb or a colon:
  - `summaryActed` reads "Anubis가 결과 9개 중 다음과 같이 바꿨습니다: 1개 고정, 2개 순위 올림 및 3개 숨김." followed by `summaryAlsoRemoved` "또한 AI 답변 1개 및 동영상 패널 2개를 제거했습니다."
  - `tagMarks` with `tagEffect*` reads "내 사이트 3개 및 Official docs의 사이트 60개에 이 태그가 붙어 있습니다. Official docs에서는 그중 51개 순위 올림 및 2개 숨김."
  - `menuReason` reads "Official docs: 순위 3단계 올림 및 ‘Docs’ 태그 붙임." and, for your tag choices, "내 태그 설정: ‘Docs’ 태그마다 순위 5단계 올림 및 ‘Paywalled’ 태그마다 순위 5단계 내림, 결과적으로 5단계 위로 이동."
  - The hidden line reads "fandom.com 외 2개 ‘AI slop’ 태그가 붙어 숨김": `hiddenMore` is "외 $1개" and `barHidden*` follow it.
  - `popupHintLists` reads "Official docs 및 내 태그 설정에서 순위 올림."
- **Labels that must start with another label's words.** `weighLabelRanked` starts with `weighLabel`'s words, and `hiddenShowSite` with `hiddenShow`'s, so screen readers match the visible text. Korean puts the verb last, so `hiddenShowSite` is "표시: $1", not "$1 표시".
- **The list facts run together.** `listsFacts` joins its parts with Korean's `unit` list format, which is only spaces: "항목 12개 태그 3개 제작: Anubis 업데이트: 5분 전." The colons in `listsBy` and `listsUpdated` keep it readable, and "업데이트: 없음" works for `timeNever`. A speaker may find a better shape.
- **"you" and "your".** A machine writes "당신의 목록"; use 내 목록, or leave the owner out.
- **Hanja-heavy or literal wording.** Prefer the words Korean software uses: "실행취소", "동기화", "복원", "초기화"; not "취소하기 동작", "싱크".
- **Length.** Korean is usually shorter than English, but the -니다 endings add up in hints. Watch buttons and the popup at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks), and counts have `_other` only, reading correctly for 1.
3. No changing particle straight after a placeholder; the 개-ending rule holds for `summaryRemoved*` and `listInstructions`.
4. Glossary and register hold: search for "당신", "해요", "했어요", "싱크", "랭킹", and straight or “” quotes.
5. Read the built sentences aloud: the summary, the hidden line, the ⚖ menu's Why, the popup's hint, and Settings → Tags' effect lines.

## Fixing

Edit `locales/ko/messages.json`, then `node scripts/locales.mjs record ko <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Korean in `docs/guide/translate.md`.
