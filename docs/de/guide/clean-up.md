# Bereiche entfernen

Suchseiten tragen vieles, was keine Ergebnisse sind: KI-Antworten, Videobereiche, „Ähnliche Fragen“. **Einstellungen → Bereiche entfernen** entfernt die, die du einschaltest, bei jeder Suche: Ein eingeschalteter Schalter heißt, dass Anubis diesen Teil entfernt, ausgeschaltet lässt ihn auf der Seite.

<!-- Maintainer: German translation of docs/guide/clean-up.md. The screenshots are the English ones, from mock pages. -->

![Einstellungen, Bereiche entfernen](../../img/options-cleanup.png)

| Schalter | Was er entfernt |
| --- | --- |
| **KI-Antworten** | Googles Übersicht mit KI und den Tab „KI-Modus“, die KI-gestützten Antworten von DuckDuckGo mit seinem Tab und seinen Schaltflächen für Duck.ai, die KI-Antwort von Bing am Seitenanfang (mit dem Video und den Links daneben) und die KI-Antworten von Brave. |
| **Videobereiche** | Bereiche mit Videos und Kurzvideos zwischen den Ergebnissen, wie Bings „Videos of…“. |
| **Ähnliche Fragen** | Listen mit Fragen anderer Leute und aufklappbaren Antworten. |
| **Diskussionsbereiche** | Bereiche mit Forenthemen zwischen den Ergebnissen, wie Googles „Diskussionen und Foren“ und Braves „Discussions“. Forenseiten unter den Ergebnissen bleiben. |
| **Top-Meldungen** | Nachrichtenbereiche zwischen den Ergebnissen. |
| **Bilderzeilen** | Bilderreihen zwischen den Ergebnissen. Der Tab „Bilder“ funktioniert weiterhin. |
| **Ähnliche Suchanfragen** | Listen mit anderen Suchen, meist am Seitenende, Bings „Related searches based on your browsing“ und das Feld „People also search for“, das Bing und Google unter einem Ergebnis einblenden, das du besucht hast und von dem du zurückgekehrt bist. Die Links zu späteren Seiten bleiben. |
| **Andere Suchmaschinen** | Reihen von Schaltflächen, die deine Suche in einer anderen Suchmaschine wiederholen, wie Braves „Find elsewhere“ mit Google, Bing und Mojeek. |
| **Bitten, Werbung zuzulassen** | Banner, die dich bitten, deinen Werbeblocker auszuschalten oder Werbung zuzulassen, wie Startpages „Block creepy ads, not private search“ mit seiner Schaltfläche **Allow Startpage ads**. |

Alle sind anfangs ausgeschaltet. **Alle davon** oben in jedem Abschnitt schaltet jeden Schalter in diesem Abschnitt auf einmal ein oder aus.

## Was entfernt wurde

Die Zusammenfassung über den Ergebnissen, oder über einer KI-Antwort, wenn es eine gibt, sagt, was weg ist: „Außerdem hat es eine KI-Antwort und einen Videobereich entfernt.“ **Ausgeblendete zeigen** bringt entfernte Bereiche auf dieser Seite zurück, mit gestricheltem Rand, damit du sie erkennst.

![Die Zusammenfassung nach dem Aufräumen](../../img/cleanup-summary.png)

## Wie Bereiche gefunden werden

Anubis erkennt einen Bereich an seiner Überschrift („AI Overview“, „Videos“, „People also ask“) statt an den internen Namen, die die Suchmaschine dafür verwendet und die sich oft ändern. Es entfernt nur Bereiche zwischen den Ergebnissen. Das Seitenfeld rechts von Googles Ergebnissen bleibt unberührt, ebenso alles, was ein Ergebnis, das Suchfeld oder die Links zu späteren Seiten enthält.

Überschriften werden auf Englisch und in einigen verbreiteten Übersetzungen erkannt (Französisch, Deutsch, Spanisch, Portugiesisch, Italienisch und Niederländisch). Wenn ein Bereich in deiner Sprache nicht entfernt wird, [eröffne ein Issue](https://github.com/Bishop-V/anubis/issues) mit dem genauen Text der Überschrift.

## KI-Antworten an der Quelle stoppen

Einen Bereich zu entfernen, nachdem die Suchmaschine ihn gesendet hat, hängt davon ab, ihn zu erkennen. Google hat eine eigene Ansicht ohne KI, und Anubis kann sie nutzen:

- **Google:** **Immer den Tab „Web“ öffnen** öffnet Googles eigene Ansicht „Web“ (die unter **Mehr → Web**), die einfache Links ohne Übersicht mit KI und ganz ohne Bereiche zeigt. Das ist ein eigener Schalter, weil er alles entfernt, was kein Link ist, auch Bereiche, die du vielleicht willst. Um die übliche Seite für eine Suche zu sehen, wähle **Alle** über den Ergebnissen.
