# Bei der Übersetzung helfen

::: warning Maschinell übersetzt: Mit Vorsicht verwenden
Anubis ist auf Englisch geschrieben, die einzige Sprache, die es vollständig unterstützt. Die Sprachen unten sind maschinelle Übersetzungen, die noch keine Person geprüft hat, die sie spricht. Wenn dich eine unsicher lässt, stelle deinen Browser auf Englisch.
:::

Anubis verwendet die Sprache deines Browsers. Meldungen, die einer Übersetzung fehlen oder deren Englisch sich seither geändert hat, erscheinen auf Englisch. Tag-Namen bleiben so, wie ihre Listen sie geschrieben haben.

## Maschinell übersetzte Sprachen

| Sprache | Ordner | Von einer Person geprüft, die sie spricht |
| --- | --- | --- |
| Arabisch | `ar` | Noch nicht |
| Bengalisch | `bn` | Noch nicht |
| Chinesisch (vereinfacht) | `zh_CN` | Noch nicht |
| Chinesisch (traditionell) | `zh_TW` | Noch nicht |
| Französisch | `fr` | Noch nicht |
| Deutsch | `de` | Noch nicht |
| Hindi | `hi` | Noch nicht |
| Indonesisch | `id` | Noch nicht |
| Italienisch | `it` | Noch nicht |
| Japanisch | `ja` | Noch nicht |
| Koreanisch | `ko` | Noch nicht |
| Portugiesisch (Brasilien) | `pt_BR` | Noch nicht |
| Russisch | `ru` | Noch nicht |
| Spanisch | `es` | Noch nicht |
| Türkisch | `tr` | Noch nicht |
| Urdu | `ur` | Noch nicht |
| Vietnamesisch | `vi` | Noch nicht |

Urdu gibt es nur in Firefox. Wenn du eine dieser Sprachen sprichst, hilft es am meisten, sie zu korrigieren.

## So übersetzt du

Jede Sprache ist ein Ordner im [Repository](https://github.com/Bishop-V/anubis), `locales/<code>/`, mit `messages.json`. Schick Änderungen als Pull Request.

- **Eine Sprache korrigieren:** Bearbeite ihre `messages.json` und führe dann für jede geänderte Meldung `node scripts/locales.mjs record <code> <key>` aus. Schreib im Pull Request, dass du die Sprache sprichst.
- **Eine Sprache hinzufügen:** Kopiere `public/_locales/en/messages.json` nach `locales/<code>/` (Codes wie `de` oder `pt_BR`), übersetze jede `message`, setze `langCode` und führe `node scripts/locales.mjs record <code>` aus.

`node scripts/locales.mjs status` listet Meldungen, deren Englisch sich geändert hat.

## Was du beibehältst

- **Platzhalter** wie `$1`, in beliebiger Reihenfolge. Ein echtes Dollarzeichen schreibst du `$$`.
- **Anzahlen:** Ergänze die Pluralformen, die deine Sprache verwendet (`_one`, `_few`, `_other` und so weiter).
- **Namen** von Anubis, Suchmaschinen und Browsern. Für Bereiche von Suchmaschinen wie „People also ask“ verwende den Namen, den die Suchmaschine in deiner Sprache zeigt.
- **Ein Wort pro Einstufung:** Ausblenden, Abwerten, Normal, Aufwerten und Anheften.

## Was auf Englisch bleibt

Meldungen an die Betreuer von Listen, Listendateien und die Seiten des Wikis für Listenautoren. Der Leitfaden des Wikis ist auch maschinell übersetzt auf Vietnamesisch, Deutsch und Chinesisch verfügbar.

## Deine Übersetzung prüfen

Baue mit `npm run build` (siehe [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)) und lade es in einem Browser, der auf deine Sprache eingestellt ist. Prüfe das Pop-up und die Einstellungen bei schmaler Breite.
