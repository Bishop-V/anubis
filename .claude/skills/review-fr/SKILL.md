---
name: review-fr
description: 'Review or correct Anubis''s French translation (locales/fr/messages.json). Use when asked to review, proofread, fix, or extend the French interface text, or when English messages changed and French needs retranslating. Covers register, typography (spaces before punctuation, guillemets), the fixed glossary, the names browsers and Google use in French, and the mistakes machine translation makes.'
---

# Reviewing the French translation

The French interface is `locales/fr/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=fr node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=fr node e2e/run.mjs docs` (don't commit those).

## Register and tone

- **vous** everywhere, as the browsers' own French does. Imperatives in the vous form: « Cliquez », « Choisissez ». Never tutoyer.
- Buttons and switches are infinitives (« Masquer », « Ajouter une liste »).
- Short and plain. Sentence case: only the first word and proper names take a capital (« Charger plus de résultats », not « Charger Plus de Résultats »).

## Typography

- Guillemets with a no-break space inside: « $1 ». The `quoted` message is « $1 ». Use U+00A0 (no-break space) or U+202F (narrow no-break space), never a plain space, so a line never starts with » or :.
- A no-break space (U+202F narrow, or U+00A0) before : ; ! ? and after « and before ».
- Typographic apostrophe ’ (« l’étiquette »), and the ellipsis character … with no space before it (« Chargement… »).
- Accented capitals: « Étiquettes », « À la une », « Épingler ».
- Numbers with units take a no-break space: « 12 caractères », « 5 Mo ». Megabytes are « Mo », kilobytes « Ko ».
- The ranking words carry soft hyphens (U+00AD) for the ⚖ menu's row: « Mas­quer », « Rétro­gra­der », « Pro­mou­voir », « Épin­gler ». Keep them.

## Glossary

| English | French |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | Masquer / Rétrograder / Normal / Promouvoir / Épingler |
| Hidden / Lowered / Raised / Pinned | masqué / rétrogradé / promu / épinglé |
| ranking (a site's) | classement; to rank: classer |
| rerank | reclasser |
| tag (noun, verb) | étiquette (feminine), étiqueter; tagged: étiqueté |
| list, subscribe, unsubscribe | liste, s’abonner à, se désabonner de |
| your list | votre liste |
| site, result, search page | site, résultat, page de recherche |
| panel (clean-up) | panneau; Remove panels: Retirer des panneaux |
| summary | résumé |
| lens | lentille |
| Show hidden | Afficher les masqués |
| Load more results | Charger plus de résultats |
| Undo | Annuler |
| sync, backup | synchronisation, sauvegarde |
| passphrase | phrase secrète |
| settings | paramètres |

## Names to match

- **Google (google.fr):** « Aperçu IA », « Mode IA », « Autres questions posées », « À la une », « Discussions et forums », the tabs « Web », « Tous », « Images ».
- **Firefox:** « Modules complémentaires », « Synchroniser maintenant », « Épingler à la barre d’outils », « Extensions ».
- **Chrome:** « Extensions » (the puzzle piece).
- Product names stay. Quoted English UI from other sites stays English when the site shows no French version.

## What machine translation gets wrong here

- **Agreement.** « étiquette » is feminine: « une étiquette », « celle-ci », « Vos étiquettes ». Past participles agree with what they describe (« listes vérifiées »). Built sentences must still agree once filled in.
- **Sentences built from parts.** `summaryActed` reads « Anubis a épinglé 1, promu 2 et masqué 3 sur 7 résultats. »: the parts are past participles after « a ». `tagEffectOneList` reads « Official docs en promeut 51 ». Check the frame and the parts together.
- **Spaces before punctuation** turn into line breaks before « : » and « ? » if they're plain spaces.
- **Anglicisms:** « tag » for étiquette, « backup » for sauvegarde, « reset » for réinitialiser.
- **Length.** French runs 15–30% longer. Watch buttons and the popup at 320px.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks), counts have `_one` and `_other` (French uses `_one` for 0 and 1).
3. Glossary and register hold: search for « tu », « ton », « tag », « Ranking ».
4. Typography: no plain space before : ; ! ? or inside « », no straight quotes or apostrophes.
5. Read the built sentences aloud: the summary, the ⚖ menu's Why, Settings → Tags' effect lines.

## Fixing

Edit `locales/fr/messages.json`, then `node scripts/locales.mjs record fr <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change « Not yet » for French in `docs/guide/translate.md`.
