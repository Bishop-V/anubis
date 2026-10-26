# Websites einstufen

Jede Website hat eine *Einstufung*. Lege sie über die Schaltfläche neben einem Ergebnis fest, im Pop-up der Symbolleiste oder unter **Einstellungen → Deine Websites**.

<!-- Maintainer: German translation of docs/guide/ranking.md. RankDemo (docs/.vitepress/theme/rank-demo.ts) draws a site being pinned and another lowered, and the picture below, for reading on GitHub, is hidden. The screenshots are the English ones. -->

<RankDemo />

<div class="github-only">

![Ein Ergebnis mit seinen Tags und seiner Schaltfläche in der Spalte links davon](../../img/result.png)

</div>

Die Schaltfläche links neben jedem Ergebnis zeigt seine Einstufung und öffnet das Menü. Bei Bildern und Videos sitzt sie oben rechts, auf dem Smartphone ist es das ⚖ nach dem Titel.

| Einstufung | Was passiert |
| --- | --- |
| **Ausblenden** | Die Ergebnisse der Website werden ausgeblendet. |
| **Abwerten** | Fünf Plätze nach unten. Noch einmal drücken für zehn, ein drittes Mal zum Zurücknehmen. |
| **Normal** | Hebt deine Einstufung auf; Tags und Listen gelten weiter. |
| **Aufwerten** | Fünf Plätze nach oben. Noch einmal drücken für zehn, ein drittes Mal zum Zurücknehmen. |
| **Anheften** | Ganz nach oben. |

Aufwerten und Abwerten kommen zu dem hinzu, was deine Listen und Tags bewirken. Anheften und Ausblenden haben Vorrang vor ihnen. **Rückgängig** in der Zusammenfassung nimmt deine letzte Änderung zurück.

## Wie viel von der Website

Eine Einstufung gilt für die Website und ihre Subdomains. Der Name oben im Menü wählt die Ebene, etwa `en.wikipedia.org` oder ganz `wikipedia.org`. Die genaueste gewinnt.

Auf Reddit, YouTube, Medium, GitHub und ähnlichen Websites bietet es auch den Teil an, der jemandem selbst gehört, etwa `reddit.com/r/rust` oder `youtube.com/@name`, wenn die Adresse ihn nennt. Die Adresse eines YouTube-Videos nennt seinen Kanal nicht, deshalb wird ein Video mit ganz YouTube eingestuft.

## Neu ordnen

Anubis ordnet nur Ergebnisse neu, die schon auf der Seite stehen. Für spätere Seiten verwende [Mehr Ergebnisse laden](./more-results.md). Um die Reihenfolge der Suchmaschine zu behalten, schalte **Einstellungen → Ergebnisse → Ergebnisse neu ordnen** aus.

## Ausgeblendete Ergebnisse

**Einstellungen → Darstellung → Ausgeblendete Ergebnisse** legt fest, wie sie aussehen:

- **Entfernen** (Standard): weg, und in der Zusammenfassung gezählt.
- **Einklappen**: eine Zeile mit einer Schaltfläche **Zeigen**.
- **Abblenden**: blass an ihrem Platz.

## Deine Websites

**Einstellungen → Deine Websites** listet jede Website, die du eingestuft hast. Bearbeite sie dort einzeln oder als Text. Die Liste wird mit deinem Browser synchronisiert und kann [veröffentlicht](./publish-a-list.md) werden.

![Einstellungen, Deine Websites](../../img/options-sites.png)
