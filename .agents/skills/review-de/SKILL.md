---
name: review-de
description: 'Review or correct Anubis''s German translation (locales/de/messages.json). Use when asked to review, proofread, fix, or extend the German interface text, or when English messages changed and German needs retranslating. Covers register, typography, the fixed glossary, the names browsers and Google use in German, and the mistakes machine translation makes.'
---

# Reviewing the German translation

The German interface is `locales/de/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=de node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=de node e2e/run.mjs docs` (don't commit those) show it on the pages.

## Register and tone

- **du**, lower case, everywhere, as most modern apps and the friendly English do. Imperatives in the du form: „Klicke“, „Wähle“, „Gib … ein“. Never mix in „Sie“. The browsers' own German says „Sie“; that's fine, Anubis is its own voice.
- Short and plain, like the English. No „bitte“, no exclamation marks.
- Buttons and switches are infinitives („Ausblenden“, „Liste hinzufügen“), not imperatives.

## Typography

- Quotation marks „…“ (the `quoted` message is „$1“). Apostrophe ’, as in „Anubis’ Version“.
- Ellipsis with a space before it when it stands for missing words: „Wird geladen …“.
- English loanwords joined with a hyphen: „Tag-Einstellungen“, „Sync-Datei“, „Issue-Tracker“, „WebDAV-Server“.
- Numbers with units take a space: „12 Zeichen“, „5 MB“.
- The ranking words carry soft hyphens (U+00AD) so the ⚖ menu's row of five can break them: „Aus­blen­den“, „Ab­wer­ten“, „Auf­wer­ten“, „An­hef­ten“. Keep them when editing.

## Glossary

One word per concept, everywhere: Settings, the popup, the ⚖ menu, the summary, and errors.

| English | German |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | Ausblenden / Abwerten / Normal / Aufwerten / Anheften |
| Hidden / Lowered / Raised / Pinned | ausgeblendet / abgewertet / aufgewertet / angeheftet |
| ranking (a site's) | Einstufung; to rank: einstufen |
| rerank | neu ordnen |
| tag (noun, verb) | das Tag, taggen; tagged: getaggt |
| list, subscribe, unsubscribe | Liste, abonnieren, abbestellen |
| your list | deine Liste |
| site | Website |
| result, search page | Ergebnis, Suchseite |
| panel (clean-up) | Bereich; Remove panels: Bereiche entfernen |
| summary | Zusammenfassung |
| lens | Linse |
| Show hidden | Ausgeblendete zeigen |
| Load more results | Mehr Ergebnisse laden |
| Undo | Rückgängig |
| sync, backup | Synchronisierung, Sicherung |
| passphrase | Passphrase |

## Names to match

- **Google (google.de):** „Übersicht mit KI“, „KI-Modus“, „Ähnliche Fragen“, „Top-Meldungen“, „Diskussionen und Foren“, the tabs „Web“, „Alle“, „Bilder“.
- **Firefox:** „Add-ons“, „Jetzt synchronisieren“, „An Symbolleiste anheften“, „Erweiterungen“.
- **Chrome:** „Erweiterungen“ (the puzzle piece).
- Product names stay: Anubis, Brave Goggles, uBlacklist, HOHSER, Koofr, Nextcloud, Duck.ai. Quoted English UI from other sites stays English when the site shows no German version (Brave's „Find elsewhere“, Startpage's banner).

## What machine translation gets wrong here

- **Case after prepositions inside built sentences.** `summaryActed` puts `summaryResults` after „von“, so the plural is dative („von 7 Ergebnissen“). `summaryAlsoRemoved` takes accusative parts („einen Videobereich“). Check every message that fills `$1` with another message.
- **Sentences built from parts.** German word order breaks part-by-part translation. `tagEffectOneList` reads „Official docs: 51 aufgewertet“, not a literal „raises 51 of them“. Keep the frame and the parts in step.
- **Gender of „Tag“.** Neuter: „das Tag“, „ein Tag“, „dieses Tag“, „es“.
- **False friends:** „Bereich“ not „Panel“; „Sicherung“ not „Backup“ where a German word is usual; „Website“ (the whole site) vs „Seite“ (one page).
- **Length.** German runs 30% longer. Watch buttons and the popup at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become (read the description).
2. Placeholders kept (`npm test` checks), counts have `_one` and `_other`.
3. Glossary and register hold: search for stray „Sie“, „Ihr“, „Panel“, „Ranking“, „Label“.
4. Typography: „…“ quotes, no straight quotes.
5. Read the built sentences aloud: the summary, the ⚖ menu's Why, Settings → Tags' effect lines.

## Fixing

Edit `locales/de/messages.json`, then `node scripts/locales.mjs record de <key>…` for each message you changed, so it's marked as translated from today's English. `npm test` checks keys, placeholders, and records. Once a speaker has read the whole language through, change „Not yet“ for German in `docs/guide/translate.md`.
