---
name: review-es
description: 'Review or correct Anubis''s Spanish translation (locales/es/messages.json). Use when asked to review, proofread, fix, or extend the Spanish interface text, or when English messages changed and Spanish needs retranslating. Covers register, typography (¿¡, comillas), the fixed glossary, Spain and Latin American usage, the names browsers and Google use in Spanish, and the mistakes machine translation makes.'
---

# Reviewing the Spanish translation

The Spanish interface is `locales/es/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=es node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=es node e2e/run.mjs docs` (don't commit those).

## Which Spanish

`es` is shown to every Spanish browser that has no closer match, including Latin American ones (`es_419`, `es_MX`). Keep it neutral where that costs nothing: prefer words understood on both sides (« buscador », « computadora »/« ordenador » avoided by saying « dispositivo »), and avoid « vosotros » and regional slang. Where Spain and Latin America differ in a way that matters, Spain's form is acceptable until an `es_419` translation exists.

## Register and tone

- **tú** everywhere, as most modern apps do. Imperatives in the tú form: « Pulsa », « Elige », « Escribe ». Never « usted ».
- Buttons and switches are infinitives (« Ocultar », « Añadir una lista »).
- Short and plain. Sentence case.

## Typography

- Opening ¿ and ¡ on every question and exclamation: « ¿Suscribirte a $1? ».
- Comillas latinas «$1», with no space inside. The `quoted` message is «$1».
- The ellipsis character … with no space before it (« Cargando… »).
- Numbers with units take a space: « 12 caracteres », « 5 MB ».

## Glossary

| English | Spanish |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | Ocultar / Bajar / Normal / Subir / Fijar |
| Hidden / Lowered / Raised / Pinned | oculto / bajado / subido / fijado |
| ranking (a site's) | clasificación; to rank: clasificar |
| rerank | reordenar |
| tag (noun, verb) | etiqueta, etiquetar |
| list, subscribe, unsubscribe | lista, suscribirse a, cancelar la suscripción a |
| your list | tu lista |
| site, result, search page | sitio, resultado, página de búsqueda |
| search engine | buscador |
| panel (clean-up) | panel; Remove panels: Quitar paneles |
| summary | resumen |
| lens | lente |
| Show hidden | Mostrar ocultos |
| Load more results | Cargar más resultados |
| Undo | Deshacer |
| sync, backup | sincronización, copia de seguridad |
| passphrase | frase de contraseña |
| settings | ajustes |

## Names to match

- **Google:** « Visión general creada por IA », « Modo IA », « Más preguntas », « Noticias destacadas », « Debates y foros », the tabs « Web », « Todo », « Imágenes ». Google's Spanish varies by country; prefer google.es.
- **Firefox:** « Complementos », « Sincronizar ahora », « Fijar a la barra de herramientas », « Extensiones ».
- **Chrome:** « Extensiones » (the puzzle piece).
- Product names stay. Quoted English UI from other sites stays English when the site shows no Spanish version.

## What machine translation gets wrong here

- **Agreement.** « etiqueta » and « lista » are feminine: « Activada », « Ninguna lista todavía ». Built sentences must still agree once filled in.
- **Sentences built from parts.** `summaryActed` reads « Anubis ha fijado 1, subido 2 y ocultado 3 de 7 resultados. ». `tagEffectOneList` reads « Official docs sube 51 de ellos ». Check frame and parts together.
- **Ambiguous « que »/« qué »** and missing accents (« más », « aún », « sólo » no longer takes one: « solo »).
- **Anglicisms:** « tag », « backup », « resetear ».
- **Length.** Spanish runs 15–25% longer.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks), counts have `_one` and `_other`.
3. Glossary and register hold: search for « usted », « su lista », « vosotros », « tag ».
4. Typography: ¿¡ opened, «» quotes, no straight quotes.
5. Read the built sentences aloud: the summary, the ⚖ menu's Why, Settings → Tags' effect lines.

## Fixing

Edit `locales/es/messages.json`, then `node scripts/locales.mjs record es <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change « Not yet » for Spanish in `docs/guide/translate.md`.
