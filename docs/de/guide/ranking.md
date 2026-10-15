# Websites einstufen

Jede Website hat eine *Einstufung*, die du über die Schaltfläche ⚖ an einem ihrer Ergebnisse, im Symbolleisten-Popup oder unter **Einstellungen → Deine Websites** wählst.

<!-- Maintainer: German translation of docs/guide/ranking.md. RankDemo (docs/.vitepress/theme/rank-demo.ts) draws a site being pinned and another lowered, and the picture below, for reading on GitHub, is hidden. The screenshots are the English ones. -->

<RankDemo />

<div class="github-only">

![Ein Ergebnis mit seinen Tags und der Schaltfläche ⚖](../../img/result.png)

</div>

Die Waage der Schaltfläche neigt sich mit der Einstufung der Website: links nach unten bei einer abgewerteten Website, nach oben bei einer aufgewerteten und waagerecht bei allen anderen. Die Schaltfläche einer angehefteten Website zeigt eine goldene Stecknadel, die einer ausgeblendeten (sobald du sie zeigst) ein durchgestrichenes Auge. Das Ergebnis trägt kein eigenes Etikett „Aufgewertet“ oder „Abgewertet“, denn die Schaltfläche zeigt seine Einstufung bereits. Ein Tag, das das Ergebnis verschiebt oder ausblendet, [zeigt das anstelle seiner Raute](./tags.md).

Die Waage im Menü wägt alles zusammen: deine Einstufung, deine Tags und deine Listen. Je weiter sich ein Ergebnis bewegt, desto weiter neigt sie sich, also neigt sich eine Website, die du zweimal aufgewertet hast oder die zwei Tags mit Aufwerten hat, weiter als bei einer einzelnen Aufwertung.

| Einstufung | Was mit den Ergebnissen der Website passiert |
| --- | --- |
| **Ausblenden** | Sie verschwinden oder schrumpfen zu einer Zeile, die du öffnen kannst (siehe den Abschnitt „Ausgeblendete Ergebnisse“ weiter unten). |
| **Abwerten** | Sie rutschen fünf Plätze nach unten. Wähle es erneut für zehn Plätze, und der Pfeil bekommt einen zweiten Pfeil. Ein dritter Klick nimmt es zurück. |
| **Normal** | Nimmt deine eigene Einstufung zurück, sodass deine Tags und Listen die Website so wägen, als gäbe es sie nicht. |
| **Aufwerten** | Sie rücken fünf Plätze nach oben. Wähle es erneut für zehn Plätze, und der Pfeil bekommt einen zweiten Pfeil. Ein dritter Klick nimmt es zurück. |
| **Anheften** | Sie wandern ganz nach oben, mit einem dünnen goldenen Rand (grau mit den schlichten Farben unter **Einstellungen → Darstellung**). |

Aufwerten und Abwerten addieren sich zu allem anderen, was die Website wägt: deine Listen und [die Tags, die du auf Anheften, Aufwerten oder Abwerten gesetzt hast](./tags.md). Wenn eine Liste eine Website um 3 abwertet und du sie aufwertest, rückt sie 2 Plätze nach oben, und ein Tag, das sie aufwertet, behält sein Zeichen. Anheften und Ausblenden ersetzen, was die Listen sagen. Ein Tag, das du auf Ausblenden gesetzt hast, blendet keine Website aus, die du selbst eingestuft hast; eine Website einzustufen ist also der Weg, eine einzelne Website zu behalten, die ein Ausblenden-Tag ausblenden würde. Sobald du eine Website eingestuft hast, erscheint **Deine Liste** im Menü unter ihren Tags, mit dem Zeichen deiner Einstufung.

Nach einer Änderung aus dem Menü sagt die Zusammenfassung über den Ergebnissen, was du getan hast („fandom.com ausgeblendet.“), mit einer Schaltfläche **Rückgängig**. Rückgängig setzt die Website so zurück, wie sie war, bevor du ihr Menü geöffnet hast, Tags eingeschlossen, auch nach mehreren Änderungen. Sie bleibt bis zu deiner nächsten Suche oder bis du eine andere Website änderst.

## Wie viel von der Website

Eine Einstufung deckt eine Website und alle ihre Subdomains ab. Der Name oben im Menü wählt die Ebene: `wikipedia.org` deckt die Wikipedia jeder Sprache ab, `en.wikipedia.org` nur die englische. Die spezifischste Wahl gewinnt, du kannst also `fandom.com` ausblenden und `minecraft.fandom.com` trotzdem aufwerten.

Bei Diensten, auf denen jeder seine eigene Website veröffentlichen kann, wie `github.io` oder `blogspot.com`, enden die Auswahlmöglichkeiten bei der Website dieser Person: `someone.github.io` bietet nicht das ganze `github.io` an. Wenn du den ganzen Dienst schon eingestuft hattest, wird er weiterhin angeboten, damit du ihn ändern kannst.

## Neu ordnen

Anubis ordnet die Ergebnisse neu, die schon auf der Seite sind; es kann keine Ergebnisse holen, die die Suchmaschine nicht gesendet hat. Ein aufgewertetes Ergebnis vom Ende von Seite 1 rückt nach oben, aber eine Website, die nur auf Seite 3 steht, braucht zuerst [Mehr Ergebnisse laden](./more-results.md).

Um die Reihenfolge der Suchmaschine zu behalten und nur Tags und Ausblenden zu nutzen, schalte **Einstellungen → Darstellung → Ergebnisse neu ordnen** aus.

## Ausgeblendete Ergebnisse

**Einstellungen → Darstellung → Ausgeblendete Ergebnisse** legt fest, wie ausgeblendete Ergebnisse aussehen:

- **Entfernen** (Standard): von der Seite verschwunden. Die Zusammenfassung über den Ergebnissen zählt sie, und **Ausgeblendete zeigen** holt sie zurück.
- **Einklappen**: eine Zeile mit dem Namen der Website und dem Grund fürs Ausblenden, mit einer Schaltfläche **Zeigen**. Aufeinanderfolgende ausgeblendete Ergebnisse teilen sich eine Zeile („fandom.com und 5 weitere von deiner Liste ausgeblendet“), und ihr **Zeigen** bringt alle zurück.
- **Abblenden**: bleiben an ihrem Platz, abgeblendet.

## Deine Websites

**Einstellungen → Deine Websites** listet jede Website auf, die du eingestuft hast, mit ihren Tags. Ändere dort eine Einstufung, füge eine Website per Namen hinzu oder bearbeite die ganze Liste als Text.

![Einstellungen, Deine Websites](../../img/options-sites.png)

Deine Websites werden als Liste im [Anubis-Listenformat](../../list-format.md) (diese Seite ist auf Englisch) gespeichert, sodass du sie [veröffentlichen](./publish-a-list.md) kannst, damit andere sie abonnieren. Sie liegt im Sync-Speicher deines Browsers und folgt dir daher auf andere Computer, auf denen du mit demselben Browserkonto angemeldet bist ([mehr zur Synchronisierung](./sync.md)).
