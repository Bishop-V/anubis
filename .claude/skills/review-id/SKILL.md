---
name: review-id
description: 'Review or correct Anubis''s Indonesian translation (locales/id/messages.json). Use when asked to review, proofread, fix, or extend the Indonesian interface text, or when English messages changed and Indonesian needs retranslating. Covers register (Anda), typography, the fixed glossary, the names browsers and Google use in Indonesian, and the mistakes machine translation makes.'
---

# Reviewing the Indonesian translation

The Indonesian interface is `locales/id/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is standard Indonesian (Bahasa Indonesia baku, as PUEBI describes it), the variety Google, Chrome, and Firefox use for Indonesia; it is not Malay, and Malaysian words (*tetapan*, *carian*, *pautan*) don't belong in it. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=id node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=id node e2e/run.mjs docs` (don't commit those).

## Register and tone

- **Anda**, always with a capital A, as Google's and Chrome's Indonesian do. Never *kamu*, *kau*, or *-mu*; possessives are "daftar Anda", "setelan tag Anda".
- Buttons and switches are bare imperatives with the -kan or -i ending: "Sembunyikan", "Tambahkan situs", "Sinkronkan sekarang", "Urungkan". Don't add *silakan* or *tolong*; software doesn't.
- Hints and notices are whole sentences in the active voice where someone acts ("Anubis menghapus 2 panel video"), and in the di- passive where only the outcome matters ("$1 disembunyikan.", "Cadangan dipulihkan.").
- Short and plain, the way Google writes Indonesian: loanwords Google uses stay ("file", "link", "login", "browser", "toolbar", "tab", "filter", "Edit", "Reset"), and nothing more formal than Google would say.
- Sentence case: only the first word and names take a capital ("Muat hasil lainnya", not "Muat Hasil Lainnya"). Firefox's own menu names keep Firefox's capitals ("Sinkronkan Sekarang", "Sematkan ke Bilah Alat").

## Typography

- Curly double quotes as in English: “$1”. The `quoted` message is “$1”. No straight quotes, no guillemets.
- The serial comma before *dan* and *atau* in lists of three or more, as PUEBI asks: "a, b, dan c". `tJoin` produces it through `Intl.ListFormat('id')`; don't write the conjunction into a frame.
- The ellipsis character … with no space before it ("Memuat…").
- Units stay as written: "12 karakter", "5 MB", "100 KB". No plural marking on nouns after a number: "3 situs", "60 tag", never "situs-situs" after a count.
- The en dash in ranges ("1–$2") and in the settings page title ("$1 – Anubis").
- One ranking word is long: "Sem­bu­nyi­kan" (11 letters) carries soft hyphens (U+00AD) at its syllables, sem-bu-nyi-kan, so the ⚖ menu's row of five can break it. Keep them; the others ("Turunkan", "Naikkan", "Sematkan") are short enough without.

## Glossary

| English | Indonesian |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | Sembunyikan / Turunkan / Normal / Naikkan / Sematkan |
| Hidden / Lowered / Raised / Pinned | disembunyikan / diturunkan / dinaikkan / disematkan |
| ranking (a site's) | peringkat; to rank: memberi peringkat |
| rerank, reranking | mengurutkan ulang (Urutkan ulang hasil), pengurutan ulang |
| tag (noun, verb) | tag; to tag: memberi tag (Beri $1 tag “$2”); tagged: diberi tag; untag: hapus tag dari |
| label (Lists label results, Label only) | label, memberi label; kept distinct from tag only where English does |
| list, subscribe, unsubscribe | daftar, berlangganan (ke), berhenti berlangganan |
| subscription | langganan |
| your list | daftar Anda (as a list's name: Daftar Anda) |
| site, result, search page | situs, hasil, halaman penelusuran |
| search (noun, verb) | penelusuran, menelusuri (Telusuri) |
| search engine | mesin telusur |
| panel (clean-up) | panel; Remove panels: Hapus panel |
| summary | ringkasan |
| lens | lensa |
| Show hidden | Tampilkan yang disembunyikan |
| Load more results | Muat hasil lainnya |
| Undo | Urungkan |
| sync, backup | sinkronisasi (sinkronkan), cadangan (cadangkan) |
| passphrase, password | frasa sandi, sandi |
| end to end (encryption) | end-to-end (dienkripsi secara end-to-end), as Google and WhatsApp say; never *secara menyeluruh*, which means "thoroughly" |
| settings | setelan |
| tab | tab |
| on / off | aktif / nonaktif (turn on: aktifkan) |
| rule, instruction, pattern | aturan, instruksi, pola |
| issue tracker | pelacak masalah |
| places (raise it by 3) | posisi |

## Names to match

- **Google (google.co.id):** "Ringkasan AI" (AI Overview), "Mode AI", "Orang lain juga bertanya", "Berita utama" (Top stories), "Diskusi dan forum", the tabs "Web", "Semua", "Gambar". Check these against a live google.co.id page with the interface in Indonesian before trusting them; Google renames its AI panels often.
- **Firefox:** "Pengaya" (Add-ons, in the sync settings), "Sinkronkan Sekarang", "Ekstensi" (the puzzle-piece button), "Sematkan ke Bilah Alat", "bilah alamat".
- **Chrome:** "Ekstensi" (the puzzle piece), "Sematkan", "kolom alamat", "Setelan". Edge and Opera say "bilah alamat".
- **The address bar** has no one word right for every browser: Chrome says "kolom alamat"; Firefox, Edge, and Opera say "bilah alamat". Each `welcomePin*` message uses its own browser's word.
- Product names stay: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, InfiniCLOUD, Nextcloud, Duck.ai, WebDAV, GitHub. GitHub's own terms stay English ("pull request", "gist"), as GitHub doesn't translate them. Quoted English UI from sites with no Indonesian version stays English: Brave's “Find elsewhere”, Startpage's “Block creepy ads, not private search”.

## What machine translation gets wrong here

- **Plural forms.** Indonesian has only `_other`, which also serves a count of 1. Every `_other` message must read right for 1: "1 jawaban AI", "1 hasil". So no *semua* ("all") or *masing-masing* ("each") in a count message unless it can't be 1: `summaryUnchanged_other` is "Anubis membiarkan $1 hasil apa adanya." (no *semua*), while `summaryUnchangedPages` may say "semua $1 hasil di $2 halaman" since pages are always 2 or more. `choiceRaise_other` says "per tag" rather than "masing-masing", because it also fires for one tag.
- **No reduplication after numbers.** "60 situs", not "60 situs-situs". Reduplication is for an unnumbered plural only: `tagEffectLists` says "Daftar-daftar tersebut", since no number is attached.
- **Sentences built from parts.** The verb parts are active meN- forms with the agent in front:
  - `summaryActed` + `summaryPinned`…: "Anubis menyematkan 1, menaikkan 2, dan menyembunyikan 3 dari 14 hasil di 2 halaman." The results part uses *di* for pages (`summaryResultsPages_other`), so the sentence doesn't say *dari* twice.
  - `tagMarks` + `tagEffectOneList` + `tagListRaises_other`: "Menandai 3 situs Anda dan 60 situs dari Official docs. Official docs menaikkan 51 dan menyembunyikan 2 di antaranya."
  - `menuReason` + `reason*`: "Official docs menaikkannya 3 posisi dan memberinya tag “Docs”." The -nya object suffix stands for the result; keep it on every `reason*` and `choice*` verb.
  - `reasonYourTagSettings` + `choiceTotal`: "Setelan tag Anda menaikkannya 5 posisi per tag karena “Docs” dan “Reference” dan menurunkannya 5 posisi per tag karena “Paywalled”, jadi hasil ini naik 5 posisi."
  - The hidden line, site + `hiddenMore_other` + `barHidden*_other`: "fandom.com dan 2 lainnya disembunyikan karena diberi tag “AI slop”". The passive needs no agreement, so one form serves any count.
  - `popupHintLists` + a chip + list names: "Disembunyikan oleh Official docs. Pilih salah satu untuk menentukan sendiri." With `popupYourTagSettings`, kept in lower case: "Dinaikkan oleh setelan tag Anda."
  - `weighLabelRanked` lower-cases a chip: "Sembunyikan, beri peringkat, atau beri tag fandom.com (diturunkan)".
- **Passive for after-the-fact notices.** English "Hid fandom.com." becomes "fandom.com disembunyikan.", not a subjectless "Menyembunyikan fandom.com.", which reads as an ongoing action or a button.
- **Affixes.** Machine output drops or doubles them: "sembunyikan" (button) versus "menyembunyikan" (verb in a sentence) versus "disembunyikan" (state); "menaikan" for "menaikkan" (two k's: naik + -kan); "mengunduh", not "men-download". Root plus *-kan* doubles a final *k*: "naikkan", "sematkan", "turunkan".
- **Malay and old words.** "tetapan" (settings), "carian" (search), "pautan" (link), "muat turun" (download), and "kata laluan" (password) are Malaysian; use "setelan", "penelusuran", "link", "unduh", and "sandi". "Pencarian" is understood but Google says "penelusuran".
- **Over-literal English.** "Ranking" left as "ranking", "backup" as "backup", "subscribe" as "subscribe"; and "bergabung" or "mendaftar" for subscribe, which mean join or register.
- **Length.** Indonesian runs 20–40% longer than English. "Tampilkan yang disembunyikan" and "Disembunyikan" are the long ones; watch the summary's buttons, the chips, and the popup at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); counts have `_other` only, and each reads right for 1.
3. Glossary and register hold: search for "kamu", "-mu", "tetapan", "carian", "ranking", "backup", and a lower-case "anda".
4. Typography: curly quotes, the serial comma in built lists, the soft hyphens in "Sem­bu­nyi­kan".
5. Read the built sentences aloud: the summary, the hidden line, the ⚖ menu's Why, Settings → Tags' effect lines, and Settings → Lists' facts ("51 instruksi, 3 tag, oleh X, diperbarui 5 menit yang lalu.").

## Fixing

Edit `locales/id/messages.json`, then `node scripts/locales.mjs record id <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Indonesian in `docs/guide/translate.md`.
