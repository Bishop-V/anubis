---
name: review-it
description: 'Review or correct Anubis''s Italian translation (locales/it/messages.json). Use when asked to review, proofread, fix, or extend the Italian interface text, or when English messages changed and Italian needs retranslating. Covers register (tu), typography (caporali, the typographic apostrophe), the fixed glossary, gender and number agreement in built sentences, the names browsers and Google use in Italian, and the mistakes machine translation makes.'
---

# Reviewing the Italian translation

The Italian interface is `locales/it/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. It is standard Italian as used in Italy and Switzerland, and it is what every browser set to Italian sees. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=it node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=it node e2e/run.mjs docs` (don't commit those).

## Register and tone

- **tu** everywhere, as most modern Italian software does (Google, Firefox, Chrome speak to the user with tu). Imperatives in the tu form: «Scegli», «Premi», «Incolla». Never «Lei», «Suo», «Scelga».
- Buttons and menu items are tu imperatives, which read like the bare verb: «Nascondi», «Aggiungi una lista», «Salva», «Annulla». Don't switch some of them to infinitives («Nascondere»).
- Avoid wording that assumes the reader's gender. «Sei iscritto», «Benvenuto» are masculine; the file uses «le liste a cui ti iscrivi», «Non hai ancora nessuna iscrizione», «$1 è già tra le tue liste», «Ti diamo il benvenuto in Anubis». Keep it that way.
- Short and plain. Sentence case: only the first word and proper names take a capital («Carica altri risultati», not «Carica Altri Risultati»).

## Typography

- Caporali «» for quotation marks, with no spaces inside: «$1». The `quoted` message is «$1». Never "…" or “…” in the Italian.
- Typographic apostrophe ’ everywhere: «l’etichetta», «un’etichetta», «com’era», «Di’». Never the straight '.
- The ellipsis character … («Caricamento…»).
- Accented capitals are written with the accent: «È solo un’etichetta», never «E’».
- Units: «KB», «MB», with a space after the number.
- None of the five ranking words is longer than eight letters («Nascondi» is the longest), so they carry no soft hyphens.
- «AI», not «IA», in the interface, because Google's own Italian names say «Panoramica AI» and «Modalità AI»; mixing the two in one sentence reads badly.

## Glossary

| English | Italian |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | Nascondi / Abbassa / Normale / Alza / Fissa |
| Hidden / Lowered / Raised / Pinned | nascosto / abbassato / alzato / fissato (agree: nascosti, «Nascosto» for a site) |
| ranking (a site's) | classificazione (feminine); to rank: classificare |
| rerank, reranking | riordinare, riordinamento |
| tag (noun, verb) | etichetta (feminine), etichettare; tagged: con l’etichetta «X», etichettato |
| list, your list | lista, la tua lista («La tua lista» as a list's name) |
| subscribe, unsubscribe, subscription | iscriversi a, annullare l’iscrizione a, iscrizione |
| site, result, search page | sito, risultato, pagina di ricerca |
| search engine | motore di ricerca |
| panel (clean-up) | riquadro; Remove panels: Rimuovi riquadri |
| summary | riepilogo |
| lens | lente |
| Show hidden | Mostra nascosti |
| Load more results | Carica altri risultati |
| Undo (and Cancel) | Annulla |
| sync, backup | sincronizzazione (sincronizzare), backup (masculine, invariable) |
| passphrase | frase segreta |
| settings | impostazioni |
| tab (browser or Google) | scheda |
| directory (of lists) | catalogo |
| pattern (list format) | schema |

«elenco» is used only for the page's own lists («un elenco di domande», «elenchi di ricerche correlate»), so «lista» always means an Anubis list.

## Names to match

- **Google (google.it):** «Panoramica AI», «Modalità AI», «Altre domande», «Notizie principali», «Discussioni e forum», the tabs «Web», «Tutti», «Immagini». These are the best-known names, not checked against a live Italian Google page: confirm them first.
- **Firefox** (checked against Firefox's Italian localisation): the sync option «Componenti aggiuntivi», «Sincronizza adesso», the extension menu's Pin to Toolbar «Aggiungi alla barra degli strumenti» (not «Fissa…»), the «Estensioni» button (the puzzle piece) and the gear «ingranaggio». Firefox for Android: the menu's «Estensioni».
- **Chrome and Edge:** «Estensioni» (the puzzle piece, «il pezzo di puzzle»), the pin «la puntina», Edge's eye «l’occhio». Opera's cube is «il cubo».
- Product names stay. Quoted English UI from other sites stays English when the site shows no Italian version: Brave's «Find elsewhere», Startpage's «Block creepy ads, not private search».

## What machine translation gets wrong here

- **Agreement with gendered nouns.** «etichetta», «lista», «classificazione», «impostazioni», «iscrizione» and «frase segreta» are feminine; «sito», «risultato», «riquadro» are masculine. Pronouns and participles follow: «Nessun sito la porta ancora» (the tag), «l’hai tolta da 3 siti» (the tag), «Le impostazioni … restano», «$1 è aggiornata» (a list). `listsUpdated` is «aggiornata $1» because it describes a list.
- **Hidden lines agree with how many results they stand for.** `barHidden*_one` is «nascosto», `_other` «nascosti»: «fandom.com nascosto perché ha l’etichetta «AI slop»», «fandom.com e altri 3 nascosti perché Docs only non li include». `hiddenMore_one` is «e $1 altro» («fandom.com e 1 altro nascosti dalla tua lista»), since the count must stay.
- **Sentences built from parts.**
  - `summaryActed` is «Anubis ha $1 su $2.» and its parts are past participles after «ha»: «Anubis ha fissato 1, alzato 2 e nascosto 2 su 7 risultati.» The browser joins parts with «e» and no serial comma, which is right for Italian.
  - `summaryAlsoRemoved` with the `summaryRemoved*` parts: «Ha anche rimosso una risposta AI, 2 riquadri video e un elenco di domande.» The `_one` forms carry their own article («un», «una»).
  - `tagMarks` with `tagEffect*`: «Contrassegna 2 dei tuoi siti e 60 siti di Official docs. Li alza nelle tue ricerche.» «Li» is the masculine plural for the sites.
  - `tagEffectOneList` is «$1 $2 ne $3.», and `tagEffectLists` «$1 Le liste ne $2.»: the partitive «ne» stands for «of them» and carries over every joined verb: «Official docs ne alza 51 e nasconde 3.», «Le liste ne alzano 51 e abbassano 1.» The `tagList*` parts are third person singular, the `tagLists*` parts plural.
  - `menuReason` with `reason*`: «Official docs lo alza di 3 e lo etichetta come «Docs» e «Ref».» «lo» is the result. After `reasonYourTagSettings` the `choice*` verbs are plural: «Le tue impostazioni delle etichette lo alzano di 5 ciascuna per «A» e «B» e lo abbassano di 5 per «C», quindi sale di 5 posizioni.» «ciascuna» agrees with «etichetta».
  - `importRead` is «Letto come $2. Siti aggiunti: $1; aggiornati: $3.»: the plural follows $1, so a participle agreeing with $3 («e 1 aggiornati») would break.
  - `popupHintLists` is «$1 secondo $2.» on purpose: «da» would have to contract with the article of `popupYourTagSettings` («dalle tue impostazioni»), which a placeholder can't do. «Nascosto secondo Official docs e Copycats.», «Alzato secondo le tue impostazioni delle etichette.»
  - `popupTagFrom` is «Secondo $1» for the same reason: its lists can include «La tua lista», and «Da La tua lista» can't contract.
  - `weighLabelRanked` takes a chip in lower case: «Nascondi, classifica o etichetta fandom.com (abbassato)».
- **Articles before numbers.** «i 8» is wrong («gli 8», «gli 11»), and a placeholder can't choose. Messages avoid an article right before a number: «com’erano tutti e $1 i risultati», «$1 KB su $2 KB», «è più lunga di $1 caratteri». Keep it so in new messages.
- **Prepositions before names.** «a A» needs a euphonic «ad», which a placeholder can't add. `menuSuggest` and `menuReport` say «a chi cura $1» (whoever maintains the lists), which also reads naturally. «ad Anubis» is written out, since the name is known.
- **Anglicisms.** «tag» for etichetta, «ranking» for classificazione, «pinnare» for fissare, «settare» for impostare. «backup», «pull request», «repository», «gist», «end-to-end», «self-hosted» and «link» are the usual Italian words and stay.
- **Length.** Italian runs 10–25% longer than English. Watch buttons and the popup at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks); counts have `_one`, `_many`, and `_other`. `_many` is for large round numbers like 1 000 000 and matches `_other`.
3. Glossary and register hold: search for «Lei», «Suo», «iscritto», «tag», «ranking», «pannello», and «IA».
4. Typography: «» quotes, ’ apostrophes, no straight quotes, no «E’».
5. Gender and number agree once the placeholders are filled in, and no article stands right before a number.
6. Read the built sentences aloud: the summary, the hidden lines, the ⚖ menu's Why, and Settings → Tags' effect lines.

## Fixing

Edit `locales/it/messages.json`, then `node scripts/locales.mjs record it <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change "Not yet" for Italian in `docs/guide/translate.md`.
