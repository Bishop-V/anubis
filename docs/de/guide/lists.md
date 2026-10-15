# Listen abonnieren

Eine Liste versieht Websites für dich mit Tags, wertet sie auf oder ab oder blendet sie aus. Jeder kann eine veröffentlichen: Sie ist eine Textdatei in einem Git-Repository, einem Gist oder unter einer beliebigen öffentlichen Webadresse. Es steht kein Anubis-Server dazwischen.

Anubis startet mit fünf kleinen Listen, die es mitbringt: **Official docs**, **Discussions**, **Reference**, **Paywalls** und **FOSS tools**. Sie fügen vor allem Tags hinzu. **FOSS tools** beschriftet LibreSpeed und cobalt.tools als FOSS und macht das Tag **AI slop** für Websites verfügbar, die du selbst taggen möchtest.

Es startet außerdem mit zwei [Listen, die aus anderen Projekten entstehen](#listen-aus-anderen-projekten), die es bei der Installation herunterlädt: **AI content** und **Independent wikis**. Kopien von Anubis, die vor diesen beiden Listen installiert wurden, abonnieren sie und schalten beim Update einmalig jede Startliste wieder ein. Schalte jede davon unter **Einstellungen → Listen** wieder aus.

<!-- Maintainer: German translation of docs/guide/lists.md. The screenshot is the English one, from the mock Settings page. -->

![Einstellungen, Listen](../../img/options-lists.png)

## Abonnieren

- **Aus dem Verzeichnis:** **Einstellungen → Listen → Weitere Listen** zeigt Listen, die andere veröffentlicht haben. Klicke bei einer auf **Abonnieren**. Das Verzeichnis lässt Listen weg, die du schon hast, und Listen, die aus derselben Quelle wie eine deiner Listen entstehen.
- **Aus dem Web:** **Subscribe** auf der Seite [Listenverzeichnis](../../lists.md) (auf Englisch) oder ein Abo-Link auf der eigenen Seite einer Liste öffnet die Einstellungen von Anubis mit der ausgefüllten Liste. Prüfe, ob es die erwartete Liste ist, und klicke dort auf **Abonnieren**, um sie hinzuzufügen.
- **Über ihre Adresse:** Füge die Adresse der Liste unter **Liste hinzufügen** ein und klicke auf **Abonnieren**. Links zur Seite einer Datei auf GitHub, GitLab oder Codeberg, Gist-Links und Goggle-Links von Brave Search funktionieren alle; Anubis findet die Rohdatei.

Listen auf GitHub oder in einem Gist werden sofort heruntergeladen. Bei einer Liste, die woanders liegt, fragt dein Browser, ob Anubis von dieser einen Website lesen darf.

## Welche Listen funktionieren

- Anubis-Listen (`.anubis`-Dateien)
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- [uBlacklist](https://github.com/iorate/ublacklist)-Regelsätze
- Einfache Listen von Domains, eine pro Zeile, und Hosts-Dateien

Anubis erkennt das Format selbst. Regeln, die es nicht verwenden kann, etwa die Titelausdrücke von uBlacklist, werden übersprungen und in den Einstellungen unter der Liste gezählt.

::: warning Linsen
Manche Brave Goggles sind *Linsen*: Sie blenden jedes Ergebnis aus, das sie nicht nennen, sodass eine Suche nur die Websites der Liste zeigt. Anubis kennzeichnet sie mit „Linse“, damit du nicht versehentlich eine abonnierst.
:::

## Updates

Anubis prüft auf neue Versionen deiner Listen, wenn der Browser startet und während du suchst, höchstens alle 30 Minuten. Jede Liste sagt, wie oft sie geprüft werden möchte (meist einmal am Tag). **Alle aktualisieren** unter **Einstellungen → Listen** prüft sofort.

## Listen aus anderen Projekten

Einige Listen im Verzeichnis entstehen aus Daten, die andere Projekte sammeln. Jede Woche macht Anubis aus diesen Daten eine Liste und veröffentlicht sie, sodass sie zwischen den Releases von Anubis aktuell bleibt. Jede Liste nennt ihre Quelle und verlinkt sie unter **Einstellungen → Listen**.

| Liste | Entstanden aus | Was sie tut |
| --- | --- | --- |
| **AI content** | [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist) von laylavish (CC0) | Beschriftet Websites, die überwiegend aus KI-generierten Texten oder Bildern bestehen, als **AI-generated**, und Websites, die echte und KI-generierte Arbeit mischen, als **Some AI content**. Websites, die die Blocklist als Content-Farmen oder Spam einordnet, bekommen außerdem die Beschriftung **AI slop**. Sie verschiebt oder blendet nie etwas aus, es sei denn, du wählst das für ein Tag. |
| **Official docs (DevDocs)** | [DevDocs](https://github.com/freeCodeCamp/devdocs) von seinen Mitwirkenden (MPL-2.0) | Beschriftet die Dokumentationsseiten, die DevDocs sammelt, als **Official docs** und wertet sie leicht auf, wie die Liste Official docs. Sie umfasst etwa 210 Websites, darunter MDN und die Dokumentation von Python, Rust und React. |
| **Self-hosted FOSS** | [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) von seinen Mitwirkenden (CC BY-SA 3.0) | Beschriftet die Websites von etwa 1.000 freien Programmen, die du selbst betreiben kannst, als **FOSS**, dasselbe Tag wie die Liste FOSS tools. Programme unter nicht freien Lizenzen bleiben außen vor. Sie verschiebt oder blendet nie etwas aus. |
| **Independent wikis** | [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy) von Kevin Payravi (MIT) | Wertet unabhängige Wikis auf, beschriftet als **Independent wiki**, und wertet die Fandom-, Fextralife- und Neoseeker-Wikis ab, die sie ersetzen, beschriftet als **Has independent wiki**. |

Um eine Website zu einer dieser Listen hinzuzufügen oder entfernen zu lassen, trage über die obigen Links zum Projekt bei, aus dem sie stammt. Anubis kopiert die Daten unverändert, und das nächste wöchentliche Update bringt die Änderung. **Falsch? Melde es** im ⚖-Menü öffnet ein Issue im Tracker dieses Projekts.

Um eine nicht mehr zu verwenden, bestelle sie ab oder schalte sie aus wie jede Liste. Um eine Liste zu behalten, aber nicht eine ihrer Beschriftungen, schalte dieses Tag unter **Einstellungen → Tags** aus oder wähle dort, was es bewirkt.

## Ausschalten oder abbestellen

Jede Liste unter **Deine Listen** hat einen Schalter, um sie eine Zeit lang auszuschalten, und eine Schaltfläche zum Abbestellen. Das Abbestellen geschieht sofort, mit **Rückgängig** neben der Meldung für ein paar Sekunden. Deine eigenen Einstufungen schlagen immer jede Liste; um eine Liste bei einer Website zu überstimmen, stufe diese Website selbst ein.

## Einen Fehler in einer Liste melden

Wenn eine Liste eine Website falsch ausblendet, einstuft oder taggt, öffne das ⚖-Menü am Ergebnis. Unter **Warum** öffnet „Falsch? Melde es *Listenname*“ ein vorausgefülltes Issue im Issue-Tracker der Liste, mit der Regel, die gegriffen hat, und der Adresse des Ergebnisses. Sage, was sich ändern sollte, und sende es dann ab. Nichts wird gesendet, bevor du es selbst abschickst.

Das funktioniert für Listen, die in einem GitHub-, GitLab- oder Codeberg-Repository veröffentlicht sind, und für Listen, die ihren eigenen Issue-Tracker nennen. Um eine Liste sofort zu überstimmen, stufe die Website selbst ein; eine Meldung sorgt dafür, dass die Liste für alle korrigiert wird.

## Einer Liste eine Website vorschlagen

Sobald du eine Website selbst eingestuft oder getaggt hast, bietet das ⚖-Menü „Schlage es *Listenname* vor“ für Listen an, die Vorschläge annehmen und die Website noch nicht nennen. Es öffnet ein vorausgefülltes Issue auf GitHub, GitLab oder Codeberg, das du prüfst und absendest. Nichts wird gesendet, bevor du es selbst abschickst.
