# Bei der Übersetzung helfen

::: warning Maschinell übersetzt: mit Vorsicht verwenden
Anubis ist auf Englisch geschrieben, der einzigen Sprache, die es vollständig unterstützt. Es gibt es auch auf **Arabisch, Bengalisch, Chinesisch (vereinfacht), Chinesisch (traditionell), Französisch, Deutsch, Hindi, Indonesisch, Italienisch, Japanisch, Koreanisch, Brasilianisch-Portugiesisch, Russisch, Spanisch, Türkisch, Urdu und Vietnamesisch**, aber diese Übersetzungen hat eine Maschine gemacht, und noch hat sie niemand geprüft, der die Sprache spricht. Manche Wörter könnten falsch oder unklar sein, also verwende sie mit Vorsicht. Wenn du Websites einstufst oder ausblendest, sagen **Warum** im Menü des Ergebnisses und die Zusammenfassung über den Ergebnissen genau, was passiert ist; wenn dich eine Übersetzung unsicher lässt, prüfe das Englische. Um Anubis auf Englisch zu sehen, stelle die Sprache deines Browsers auf Englisch.
:::

Die Oberfläche von Anubis ist auf Englisch. Jedes Wort, das sie zeigt, lässt sich übersetzen: das Symbolleisten-Popup, die Einstellungen, die Willkommensseite und was sie zu Suchseiten hinzufügt. Dein Browser wählt die Übersetzung für seine eigene Sprache, und alles, was eine Übersetzung auslässt, bleibt Englisch. In jeder Sprache außer Englisch sagen die Einstellungen, die Willkommensseite und das Symbolleisten-Popup, dass die Übersetzung von einer Maschine stammt, mit einem Link zu dieser Seite.

Dieses Wiki gibt es ebenfalls auf Deutsch (maschinelle Übersetzung, noch nicht von Muttersprachlern geprüft) im Ordner `docs/de/` des Repositorys. Die technischen Seiten für Listen-Autoren und Mitwirkende, wie das Listenformat, das Listenverzeichnis, die Abo-Seite und die Experimente, bleiben auf Englisch.

## Maschinell übersetzte Sprachen

| Sprache | Ordner | Von Muttersprachlern geprüft |
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

Chrome hat keine eigene Urdu-Oberfläche, daher erscheint Urdu nur in Firefox.

Sie wurden maschinell aus dem Englischen übersetzt, mit einem festen Satz an Wörtern: den fünf Einstufungen, „Tag“, „Liste“ und den Namen, die Suchmaschinen ihren eigenen Bereichen in jeder Sprache geben. Wenn sich das Englische einer Nachricht ändert, ist ihre Übersetzung veraltet, und Anubis zeigt diese Nachricht auf Englisch, bis jemand sie neu übersetzt, damit du nie eine alte Bedeutung liest. Listen und die Tags, die sie Websites geben, schreiben ihre Autoren, meist auf Englisch, daher bleiben Tag-Namen so, wie die Listen sie geschrieben haben.

Wenn du eine dieser Sprachen sprichst, ist sie zu korrigieren das Nützlichste, was du zuerst tun kannst: siehe unten.

## So übersetzt du

Eine Übersetzung ist ein Ordner, `locales/<Sprache>/` im [Repository von Anubis](https://github.com/Bishop-V/anubis), mit `messages.json` im Format, das Browser für jede Erweiterung verwenden, und `sources.json`, dem Englisch, aus dem jede Nachricht übersetzt wurde. Bis ein gehostetes Übersetzungsprojekt startet, sende sie als Pull Request:

1. Kopiere `public/_locales/en/messages.json` nach `locales/<Sprache>/messages.json`, in einen Ordner, der nach dem Code deiner Sprache benannt ist, mit einem Unterstrich vor einer Region: `de`, `fr`, `pt_BR`, `zh_CN`, `zh_TW`. Browser verwenden nur [die Codes, die sie kennen](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales).
2. Übersetze jede `message`. Die `description`s kannst du weglassen; im Englischen sagt eine Beschreibung, wo der Text erscheint und wofür jedes `$1` oder `$2` steht.
3. Setze `langCode` auf den Code deiner Sprache, derselbe wie der Name des Ordners.
4. Führe `node scripts/locales.mjs record <Sprache>` aus. Es schreibt `sources.json`, damit Anubis später erkennen kann, wann sich das Englische geändert hat.
5. Eröffne einen Pull Request. Eine Prüfung stellt sicher, dass jeder Schlüssel im Englischen existiert, jeder Platzhalter erhalten ist und jede Nachricht sagt, aus welchem Englisch sie stammt.

Du musst nicht alles auf einmal übersetzen: Lasse eine Nachricht aus, und sie erscheint auf Englisch.

### Eine maschinelle Übersetzung korrigieren

Ändere die `message` in `locales/<Sprache>/messages.json` und sage im Pull Request, dass du die Sprache sprichst. Wenn du eine ganze Sprache durchgelesen hast, ändere „Noch nicht“ in der Tabelle oben. `node scripts/locales.mjs status` listet die Nachrichten auf, deren Englisch sich seit der Übersetzung geändert hat; übersetze jede neu und führe dann `node scripts/locales.mjs record <Sprache> <Schlüssel>` dafür aus.

## Was zu erhalten ist

- **Platzhalter.** `$1`, `$2` und so weiter werden mit einer Website, einer Zahl oder einem Namen gefüllt. Behalte jeden, in der Reihenfolge, die deine Sprache braucht. Ein Dollarzeichen, das kein Platzhalter ist, wird `$$` geschrieben.
- **Zählungen.** Nachrichten, die auf `_one` und `_other` enden, sind die Formen einer Zählung: „1 Liste“, „2 Listen“. Füge die Formen hinzu, die deine Sprache verwendet, benannt, wie die [Pluralregeln von Unicode](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) sie nennen: `_zero`, `_one`, `_two`, `_few`, `_many` und `_other`.
- **Namen.** Anubis, die Suchmaschinen, die Browser und andere Projekte (uBlacklist, HOHSER, Brave Goggles) behalten ihre Namen. Wo eine Nachricht einen Teil der Seite einer Suchmaschine nennt, etwa Googles „AI Overview“ oder „People also ask“, verwende den Namen, den die Suchmaschine in deiner Sprache zeigt.
- **Die Wörter für eine Einstufung.** Die Einstufung einer Website ist überall in Anubis Ausblenden, Abwerten, Normal, Aufwerten oder Anheften. Wähle für jede ein Wort und verwende es durchgehend. Setze in Sprachen mit langen Wörtern weiche Trennstriche (U+00AD) hinein, damit die Reihe der Einstufungen im Menü des Ergebnisses sie dort trennen kann, wo sie getrennt werden sollen.

## Was auf Englisch bleibt

- **Meldungen und Vorschläge an die Betreuer einer Liste.** Wenn du einen Fehler einer Liste meldest oder ihr eine Website vorschlägst, ist das Issue, das Anubis ausfüllt, auf Englisch, da die Betreuer der Liste deine Sprache vielleicht nicht lesen.
- **Listendateien.** Deine eigene Liste, wie Anubis sie anlegt, und die Listen, die du abonnierst, schreiben ihre Autoren.
- **Die technischen Seiten des Wikis und die Store-Einträge.** Sie werden separat übersetzt.

## Deine Übersetzung prüfen

Baue Anubis mit deiner Datei (`npm run build`; siehe [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)) und lade es in einen Browser, der auf deine Sprache eingestellt ist; `ANUBIS_LANG=<Code> node e2e/run.mjs responsive` prüft die Einstellungen darin bei Smartphone-Breiten. Füge in Firefox deine Sprache unter Einstellungen → Allgemein → Sprache hinzu; wähle sie in Chrome unter Einstellungen → Sprachen oder starte Chrome mit `--lang=<Code>`. Sieh dir das Popup und die Einstellungen bei schmaler Breite an, denn ein längeres Wort kann eine Schaltfläche in eine zweite Zeile drücken.

Arabisch und Urdu werden von rechts nach links geschrieben: Die Seiten von Anubis und was es zu Suchseiten hinzufügt, drehen sich entsprechend. Prüfe auch eine Sprache von rechts nach links bei schmaler Breite.
