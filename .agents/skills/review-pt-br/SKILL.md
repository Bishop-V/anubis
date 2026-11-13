---
name: review-pt-br
description: 'Review or correct Anubis''s Brazilian Portuguese translation (locales/pt_BR/messages.json). Use when asked to review, proofread, fix, or extend the Portuguese interface text, or when English messages changed and Portuguese needs retranslating. Covers register, typography, the fixed glossary, Brazilian rather than European usage, the names browsers and Google use in Portuguese, and the mistakes machine translation makes.'
---

# Reviewing the Brazilian Portuguese translation

The Portuguese interface is `locales/pt_BR/messages.json`, machine translated from `public/_locales/en/messages.json` and not yet read through by a native speaker. Review it against English message by message; each English message has a `description` saying where it shows and what `$1`, `$2` stand for. Read it in place too: `ANUBIS_LANG=pt_BR node e2e/run.mjs responsive` and the screenshots of `ANUBIS_LANG=pt_BR node e2e/run.mjs docs` (don't commit those).

## Which Portuguese

Brazilian. Browsers set to European Portuguese (`pt_PT`) don't get it and see English. Use Brazilian words and grammar: « arquivo » (not « ficheiro »), « tela », « baixar », « salvar », « aplicativo »/« app », gerund forms (« carregando »), « você ».

## Register and tone

- **você**, with the verb in the third person: « Clique », « Escolha », « Digite ». Never « tu » or « o senhor ».
- Buttons and switches are infinitives (« Ocultar », « Adicionar uma lista »).
- Short and plain. Sentence case. « O Anubis » takes the article in running text, as Brazilian Portuguese does with product names.

## Typography

- Curly quotes “$1”. The `quoted` message is “$1”.
- The ellipsis character … with no space before it (« Carregando… »).
- Numbers with units take a space: « 12 caracteres », « 5 MB ».

## Glossary

| English | Portuguese (Brazil) |
| --- | --- |
| Hide / Lower / Normal / Raise / Pin (rankings) | Ocultar / Rebaixar / Normal / Elevar / Fixar |
| Hidden / Lowered / Raised / Pinned | oculto / rebaixado / elevado / fixado |
| ranking (a site's) | classificação; to rank: classificar |
| rerank | reordenar |
| tag (noun, verb) | etiqueta, etiquetar |
| list, subscribe, unsubscribe | lista, assinar, cancelar a assinatura |
| your list | sua lista |
| site, result, search page | site, resultado, página de busca |
| search engine | buscador |
| panel (clean-up) | painel; Remove panels: Remover painéis |
| summary | resumo |
| lens | lente |
| Show hidden | Mostrar ocultos |
| Load more results | Carregar mais resultados |
| Undo | Desfazer |
| sync, backup | sincronização, backup |
| passphrase | frase secreta |
| settings | configurações |
| tab (browser or Google) | aba (« guia » is also used; pick one) |

## Names to match

- **Google (google.com.br):** « Visão geral criada por IA », « Modo IA », « As pessoas também perguntam », « Principais notícias », « Discussões e fóruns », the tabs « Web », « Todas », « Imagens ».
- **Firefox:** « Extensões », « Sincronizar agora », « Fixar na barra de ferramentas ».
- **Chrome:** « Extensões » (the puzzle piece).
- Product names stay. Quoted English UI from other sites stays English when the site shows no Portuguese version.

## What machine translation gets wrong here

- **European forms creeping in:** « ficheiro », « ecrã », « registo », « carregar em » (for click), « está a carregar ».
- **Agreement.** « etiqueta », « lista » are feminine: « Ligada », « Nenhuma lista ainda ». Built sentences must agree once filled in.
- **Sentences built from parts.** `summaryActed` reads « O Anubis fixou 1, elevou 2 e ocultou 3 de 7 resultados. ». `tagEffectOneList` reads « Official docs eleva 51 deles ». Check frame and parts together.
- **Pronoun placement** (« Desligue isto », « Baixe-a ») and crase (« às suas configurações »).
- **Length.** Portuguese runs 15–30% longer.

## Checklist

1. Every message matches its English meaning, including what `$1`, `$2` become.
2. Placeholders kept (`npm test` checks), counts have `_one` and `_other`.
3. Glossary, register, and Brazilian usage hold: search for « ficheiro », « ecrã », « tu », « guia » and « aba » mixed.
4. Typography: “ ” quotes, no straight quotes.
5. Read the built sentences aloud: the summary, the ⚖ menu's Why, Settings → Tags' effect lines.

## Fixing

Edit `locales/pt_BR/messages.json`, then `node scripts/locales.mjs record pt_BR <key>…` for each message you changed. `npm test` checks keys, placeholders, and records. Once a speaker has read it through, change « Not yet » for Portuguese in `docs/guide/translate.md`.
