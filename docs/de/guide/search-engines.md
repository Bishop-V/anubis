# Suchmaschinen

Anubis funktioniert mit den Web-Ergebnissen dieser Suchmaschinen. Schalte jede davon unter **Einstellungen → Suchmaschinen** aus.

| Suchmaschine | Unterstützung | Mehr Ergebnisse laden | Auf der echten Website geprüft |
| --- | --- | --- | --- |
| Google (Domain jedes Landes) | Unterstützt | Ja | Ja, Ergebnisse und Aufräumen. Das Smartphone-Layout noch nicht. |
| DuckDuckGo | Unterstützt | Ja | Ja |
| DuckDuckGo HTML und Lite | Unterstützt | Nein | Ja |
| Bing | Unterstützt | Ja* | Ja |
| Brave Search | Unterstützt | Ja | Ja |
| Startpage | Unterstützt | Ja | Ja |
| Ecosia | Unterstützt | Ja* | Ja |
| Kagi | Unterstützt | Nein | Ja |
| Yahoo | Unterstützt | Ja* | Ja |
| Yandex | Unterstützt | Ja* | Ja |
| Mojeek | Experimentell | Nein | Noch nicht |

In Firefox für Android, wo die Unterstützung experimentell ist, senden Google, DuckDuckGo und Bing Smartphones ein eigenes Layout, und Anubis liest jedes davon. Diese drei wurden auf einem Smartphone ausprobiert; die Smartphone-Layouts der anderen Suchmaschinen noch nicht.

**Unterstützt** heißt, dass es auf der echten Website ausprobiert wurde. **Experimentell** heißt, dass es dem Layout folgt, das andere Werkzeuge dokumentieren, aber noch nicht auf der echten Website ausprobiert wurde, sodass manches nicht funktionieren könnte.

\* Bing, Ecosia, Yahoo und Yandex beantworten die Anfrage nach der nächsten Seite manchmal mit einer Prüfung „Bestätige, dass du kein Roboter bist“. Mehr Ergebnisse laden hört dann auf und sagt das, mit einem Link zur Seite: Bestätige dort, dass du kein Roboter bist, und klicke dann erneut auf **Mehr Ergebnisse laden**, oder nutze den eigenen Link „Weiter“ der Suchmaschine. Ecosia fragt oft. Siehe [Mehr Ergebnisse laden](./more-results.md).

Die wichtigsten Web-Ergebnisse werden überall gewogen. Darüber hinaus:

- **Die Tabs Bilder, Videos und News** werden bei DuckDuckGo, Bing, Brave Search, Ecosia, Kagi, Startpage und Yandex (nur Videos) gewogen, sowie bei Googles Tabs Bilder und News. Googles Tab Videos listet Ergebnisse wie das Web, wird also wie Web-Ergebnisse gewogen. Bilder und Videos werden getaggt und ausgeblendet, aber nicht umsortiert, damit das Raster seine Form behält. Ausgeblendete hinterlassen keine Lücke. Keiner dieser Tabs wurde bisher auf den echten Websites geprüft.
- **Unberührt bleiben:** die Tabs von Yahoo und Mojeek, die anderen Tabs von Yandex und jeder Shopping-Tab.

## Wie Ergebnisse gefunden werden

Suchmaschinen ändern das Aussehen ihrer Seiten oft, und die internen Namen, die sie verwenden, ändern sich mit. Wo möglich, findet Anubis Ergebnisse an ihrer Form: einer Überschrift, dem Link darum und dem kleinsten Block, der nur dieses Ergebnis enthält. Kleine Neugestaltungen brechen das nicht.

Für Suchmaschinen, bei denen Titel keine Überschriften sind, verwendet Anubis die Ergebnis-Layouts, die das Projekt [uBlacklist](https://github.com/ublacklist/builtin) aktuell hält.

## Wenn eine Suchmaschine kaputtgeht

Wenn Ergebnisse bei einer Suchmaschine keine Tags oder Schaltflächen mehr bekommen oder die Zusammenfassung an der falschen Stelle landet, siehe [Fehlerbehebung](./troubleshooting.md).
