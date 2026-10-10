---
name: review-tr
description: 'Review or correct Anubis''s Turkish translation (locales/tr/messages.json). Use when asked to review, proofread, fix, or extend the Turkish interface text, or when English messages changed and Turkish needs retranslating. Covers register (sen), typography (curly quotes, apostrophes), the fixed glossary, vowel harmony and suffixing in Turkish, the names browsers and Google use in Turkish, and the mistakes machine translation makes.'
---

# Reviewing the Turkish translation

The Turkish interface is `locales/tr/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is standard Turkish as used in Turkey and by Turkish speakers worldwide. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=tr node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=tr node e2e/run.mjs docs` (don't commit those).

## Register and tone

- **Sen / direct imperative** everywhere, as modern Turkish browser and web software does (Google, Firefox, Chrome). Imperatives: “Seç”, “Ekle”, “Kaydet”, “Gizle”, “Yükselt”. Avoid overly formal or bureaucratic phrasing (“siz”, “yapınız”, “seçiniz”).
- Buttons and menu actions are bare imperatives: “Gizle”, “Site ekle”, “Daha fazla sonuç yükle”, “Abonelikten çık”, “Geri al”.
- Short and plain. Sentence case: only the first word and proper nouns take a capital letter.
- Actions completed use past tense: “Gizlendi”, “Yükseltildi”, “Sabitlendi”, “Kaydedildi”, “Senkronize edildi”. Progress uses “-iyor”: “Yükleniyor…”, “Senkronize ediliyor…”.

## Typography

- Quotes: standard double quotes “$1” in Turkish running text. The `quoted` message is “$1”.
- The typographic apostrophe ’ for proper nouns when suffixed (e.g. Anubis’i, Google’da).
- The ellipsis character … without preceding space: “Yükleniyor…”.
- Units: “KB”, “MB” with a half-width space after numbers: “12 karakter”, “5 MB”.

## Glossary

| English | Turkish |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | Gizle / Düşür / Normal / Yükselt / Sabitle |
| Hidden / Lowered / Raised / Pinned | Gizlendi / Düşürüldü / Yükseltildi / Sabitlendi |
| ranking (a site's); to rank | sıralama; sıralamak |
| rerank | yeniden sırala |
| tag (noun, verb) | etiket, etiketle |
| list, your list | liste, listeniz |
| your lists (subscribed) | abone olduğunuz listeler / listeleriniz |
| subscribe, unsubscribe | abone ol, abonelikten çık |
| site, result, search page | site, sonuç, arama sayfası |
| search engine | arama motoru |
| panel (clean-up); Remove panels | panel; Panelleri kaldır |
| summary | özet |
| lens | mercek |
| Show hidden | Gizlenenleri göster |
| Load more results | Daha fazla sonuç yükle |
| Undo | Geri al |
| sync, backup | senkronizasyon, yedekleme |
| passphrase | şifreleme parolası |
| settings | ayarlar |
| tab (browser or Google) | sekme (never etiket) |

## Names to match

- **Google (google.com.tr):** “Yapay zekâ genel bakışı”, “İlgili sorular”, “Başlıca haberler”, “Tartışmalar ve forumlar”, sekmeler “Web”, “Tümü”, “Görseller”.
- **Firefox:** “Eklentiler”, “Şimdi senkronize et”, “Araç Çubuğuna Sabitle”.
- **Chrome / Edge:** “Uzantılar” (yapboz parçası), “Sabitle” (raptiye / göz).
- Product names stay: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, WebDAV.

## What machine translation gets wrong here

- **Agglutinative suffixes on placeholders:** Turkish suffixes attach depending on vowel harmony (e.g. -e/-a, -i/-ı/-u/-ü). Since placeholder names vary, sentences are structured with prepositions or apposition (e.g. “$1 sitesi için”, “$1 listesi tarafından”) rather than raw bare suffixes directly attached to placeholders where harmony could clash.
- **Plural forms:** In Turkish, counts use the singular noun (“1 liste”, “5 liste”).
- **Tab vs Tag:** A browser/page tab is always “sekme”, while a metadata label is “etiket”.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); counts have `_one` and `_other`.
3. Glossary and register hold: no overly formal “siz”, “sekme” used for tabs and “etiket” for tags.
4. Read built sentences aloud: summary bar, hidden results notice, and ⚖ menu reasons.

## Fixing

Edit `locales/tr/messages.json`, then `node scripts/locales.mjs record tr <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Turkish in `docs/guide/translate.md`.
