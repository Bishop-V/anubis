# Tags

Tags sind kleine Beschriftungen unter dem Titel eines Ergebnisses: „Official docs“, „Discussion“, „Paywalled“. Sie stammen aus den Listen, die du abonniert hast, und aus deinen eigenen Entscheidungen.

<!-- Maintainer: German translation of docs/guide/tags.md. The screenshots are the English ones, from mock pages. -->

![Ein Ergebnis mit dem Tag „Reference“](../../img/result.png)

## Eine Website selbst taggen

Öffne auf einer beliebigen Website das Anubis-Popup in der Symbolleiste. Klicke unter **Tags** auf ein Tag, um es der Website hinzuzufügen, oder erneut, um es zu entfernen. Um ein neues Tag für die Website anzulegen, gib seinen Namen unter **Neues Tag** ein und klicke auf **Tag hinzufügen**. Auf Suchseiten bietet das Menü jedes Ergebnisses dieselben Bedienelemente.

Deine eigenen Tags stehen unter **Deine Tags**, und die Tags, die deine Listen verwenden, unter **Tags aus Listen**. Du kannst jeder Website ein Tag aus einer Liste hinzufügen, und das ändert nur deine eigene Liste, nicht die der anderen. Bei mehr als acht Tags klappt der Rest hinter **Mehr Tags zeigen** weg; die Tags der Website bleiben immer sichtbar. Ein Tag, das du der Website gegeben hast, ist fett und in seiner Farbe unterstrichen. Ein Tag, das eine Liste der Website gegeben hat, steht normal, mit dem Namen der Liste dahinter („von Paywalls“): Nur die Liste kann es entfernen, und **Falsch? Melde es** im Menü des Ergebnisses sagt es ihren Betreuern.

## Wem ein Tag gehört

Drei Dinge machen ein Tag aus, und jedes hat einen Besitzer:

| Was | Wer es ändert |
| --- | --- |
| Seine ID, etwa `paywall` | Niemand: Listen, die dieselbe ID verwenden, teilen sich das Tag (siehe den Abschnitt „Gemeinsame Tags“ weiter unten). |
| Sein Name, seine Farbe und seine Beschreibung | Die Liste, die es definiert. Dein Umbenennen oder Umfärben unter **Einstellungen → Tags** liegt über dem der Liste und wird nie überschrieben. |
| Welche Websites es tragen | Jede Liste für ihre eigenen Websites und du für deine. Das Update einer Liste ändert nie deine Websites, und deine Websites ändern nie die Liste. |

Wenn du das Tag einer Liste zu einer deiner Websites hinzufügst, behält deine Liste eine Kopie von Name, Farbe und Beschreibung des Tags. Solange die Liste das Tag definiert, siehst du die Version der Liste, sodass dich ihre Updates erreichen. Wenn die Liste das Tag nicht mehr verwendet oder du sie abbestellst, behalten deine Websites es unter demselben Namen, und es wandert zu **Deine Tags**.

## Sehen, woher ein Tag kommt

**Einstellungen → Tags** hat zwei Gruppen. **Deine Tags** sind die, die du angelegt hast oder die nur deine eigenen Websites verwenden. **Tags aus Listen** sind die, die deine abonnierten Listen Websites geben, und jedes sagt, aus welchen Listen es stammt, zum Beispiel „Von Paywalls“. Ein Tag von dir, das auch eine Liste verwendet, sagt „Auch verwendet von“ und den Namen der Liste. Bestellst du eine Liste ab, verlassen ihre Tags die zweite Gruppe.

## Entscheiden, was ein Tag bewirkt

Eine Liste entscheidet, welche Websites ein Tag bekommen. Du entscheidest, was das Tag bewirkt, unter **Einstellungen → Tags**:

| Wahl | Was mit Ergebnissen mit dem Tag passiert |
| --- | --- |
| **Den Listen folgen** | Was auch immer die Liste sagt (Standard). Die meisten Listen beschriften nur. |
| **Nur Beschriftung** | Die Beschriftung zeigen, die Einstufung nie ändern. |
| **Hervorheben** | Dem Ergebnis einen schwachen Hintergrund in der Farbe des Tags geben. |
| **Anheften** | Das Ergebnis nach ganz oben setzen, als hättest du seine Website angeheftet. |
| **Aufwerten** / **Abwerten** | Das Ergebnis fünf Plätze nach oben oder unten verschieben. |
| **Ausblenden** | Das Ergebnis ausblenden, egal welche Liste es getaggt hat. |

Unter dem Namen jedes Tags sagt eine Zeile, welche Websites es tragen und was mit ihnen passiert, zum Beispiel „Markiert 23 Websites von Paywalls. Nur eine Beschriftung: Die Einstufung der Websites bleibt gleich.“ Die Liste Paywalls beschriftet nur; um Websites mit Bezahlschranke abzuwerten, wähle für das Tag **Abwerten**.

### Sehen, was ein Tag mit einem Ergebnis macht

Unter einem Ergebnis beginnt jedes Tag mit einer Raute in seiner Farbe. Wenn das Tag dieses Ergebnis verschiebt oder ausblendet, tritt eine Stecknadel (es heftet es an), ein Pfeil nach oben (es wertet es auf), ein Pfeil nach unten (es wertet es ab) oder ein durchgestrichenes Auge (es blendet es aus) an die Stelle der Raute. Das zeigt deine Wahl für das Tag oder, wenn du den Listen folgst, was die Liste tut. Dieselben Zeichen erscheinen im Menü des Ergebnisses und im Symbolleisten-Popup.

Schalte **Anzeigen** aus, damit ein Tag weiter wirkt, ohne seine Beschriftung unter den Ergebnissen zu zeigen. Klicke auf die Farbe eines Tags, um sie zu ändern. Um jedes Tag auf Suchseiten grau zu sehen, wähle **Schlicht** unter **Einstellungen → Darstellung → Farben auf Suchseiten**. Tags unterscheiden sich dann durch ihre Namen.

## Websites selbst taggen

Klicke neben einem Tag auf **Bearbeiten**, um es zu öffnen. Dort kannst du:

- es umbenennen und deinen eigenen Tags eine Beschreibung geben;
- deine Websites mit dem Tag sehen und mit × das Tag von einer entfernen;
- weitere Websites taggen: Gib eine ein oder mehrere durch Leerzeichen oder Kommas getrennt und klicke auf **Website hinzufügen**. Du kannst optional eine Erklärung für die Website oder Websites hinzufügen; jede Notiz wird mit der Regel ihrer Website als Kommentar gespeichert;
- die ersten Websites sehen, die jede deiner Listen dem Tag gibt.

Das Menü an einem Suchergebnis taggt die Website dieses Ergebnisses auf dieselbe Weise.

Der Papierkorb neben einem deiner eigenen Tags löscht es und nimmt es von deinen Websites. Anubis fragt nicht vorher: Es sagt, was es gelöscht hat, mit **Rückgängig** daneben für ein paar Sekunden.

![Einstellungen, Tags, mit einem aufgeklappten Tag, das das optionale Erklärungsfeld für eine Website zeigt](../../img/options-tags.png)

### Mehrere Tags an einem Ergebnis

Wenn ein Ergebnis mehrere Tags trägt, die du auf **Aufwerten** oder **Abwerten** gesetzt hast, wägt Anubis sie zusammen: Jedes Aufwerten bewegt es fünf Plätze nach oben und jedes Abwerten fünf Plätze nach unten.

| Tags am Ergebnis | Wohin es geht |
| --- | --- |
| Einmal Aufwerten | Fünf Plätze nach oben |
| Dreimal Aufwerten | Fünfzehn Plätze nach oben |
| Zweimal Aufwerten und einmal Abwerten | Fünf Plätze nach oben, als hätte es ein Aufwerten |
| Einmal Aufwerten und einmal Abwerten | Dort, wo die Suchmaschine es platziert hat |

Ein Tag zählt einmal, egal wie viele deiner Listen es geben. Ein Tag, das auf **Ausblenden** steht, blendet das Ergebnis trotzdem aus, was die anderen auch sagen. **Warum** im Menü des Ergebnisses zeigt den Anteil jedes Tags und wo das Ergebnis landet („wertet es um 5 auf für jedes Tag „Official docs“ und „Reference“ und ab um 5 für „Paywall“, also rückt es 5 Plätze nach oben“).

Eine Einstufung, die du einer Website selbst gegeben hast, addiert sich zu ihren Tags. Wenn du eine Website aufgewertet hast und sie ein Tag mit Abwerten hat, heben sie sich auf. Ein Tag mit Ausblenden blendet keine Website aus, die du selbst eingestuft hast, sodass du eine Website behalten kannst, die das Tag ausblenden würde. Wenn du eine Website selbst ausgeblendet hast, bleibt sie ausgeblendet, was ihre Tags auch sagen.

## Nur ein Tag zeigen

Die Zusammenfassung über den Ergebnissen listet die Tags auf der Seite und wie viele Ergebnisse jedes hat. Klicke auf eines, um nur diese Ergebnisse zu zeigen; klicke auf **Alle zeigen**, um zurückzukehren. Auf dem Smartphone klicke in der Zusammenfassung auf **Details**, um sie zu sehen.

## Gemeinsame Tags

Tags werden durch eine kurze ID wie `ai-slop` erkannt. Wenn zwei Listen dieselbe ID verwenden, siehst du ein Tag, das von beiden gespeist wird, unter dem Namen, den die erste Liste ihm gibt. Es gibt nichts Zusätzliches zu abonnieren: Listen verschiedener Autoren bauen ein gemeinsames Vokabular auf, indem sie dieselben IDs verwenden; siehe [das Listenformat](../../list-format.md#tags) (auf Englisch).
