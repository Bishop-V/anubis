# Eine Liste veröffentlichen

Eine Liste ist eine Textdatei, die jeder abonnieren kann. Du brauchst weder einen Server noch ein Konto bei Anubis: Ein öffentliches Git-Repository ist die Datenbank, und Issues und Pull Requests sind der Weg, auf dem andere mitwirken.

## 1. Schreiben

Der schnellste Einstieg ist deine eigene Liste. **Einstellungen → Sicherung → Meine Liste herunterladen** speichert jede Website, die du eingestuft und getaggt hast. Oder schreibe eine von Grund auf:

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

Jede Zeile nach dem Kopf ist eine Anweisung: welche Websites und was mit ihnen geschehen soll. Füge jeder Tag-Regel für eine Website, die du hinzufügst, einen kurzen Kommentar mit `#` hinzu, der erklärt, warum die Website passt. Das [Listenformat](../../list-format.md) (auf Englisch) hat die Details.

Listen, die nur taggen und die Einstufung jedem Abonnenten überlassen, sind am freundlichsten zu veröffentlichen: Abonnenten können unter **Einstellungen → Tags** entscheiden, ob dein Tag aufwertet, hervorhebt oder ausblendet.

Verwende eine Tag-ID wieder, die andere Listen schon haben, wo eine passt, damit Abonnenten ein Tag statt zwei mit gleicher Bedeutung sehen; das [Listenformat](../../list-format.md#tags) nennt die, die die Listen von Anubis verwenden. Behalte nach dem Veröffentlichen jede ID bei: Um ein Tag umzubenennen, ändere seine Beschriftung.

## 2. Online stellen

Lege ein öffentliches Repository auf GitHub, GitLab oder Codeberg oder einen Gist an und füge die Datei hinzu. Jeder Dateiname funktioniert; die Endung `.anubis` hilft, sie zu erkennen.

## 3. Den Link teilen

Leute fügen den Link unter **Einstellungen → Listen → Liste hinzufügen** ein. Ein Link zur Seite der Datei funktioniert; Anubis findet die Rohdatei. Listen auf GitHub und Gists werden ohne zusätzliche Berechtigung heruntergeladen.

Für einen Klick teile stattdessen einen [Abo-Link](../../subscribe.md#make-a-subscribe-link): Er öffnet die Einstellungen von Anubis mit deiner ausgefüllten Liste.

## 4. Von Fehlern erfahren und Vorschläge ermöglichen

Wenn deine Liste eine Website falsch behandelt, können Abonnenten im Menü an diesem Ergebnis „Falsch? Melde es *deine Liste*“ wählen. Das öffnet ein vorausgefülltes Issue im Issue-Tracker deines Repositorys, mit der Regel, die gegriffen hat, und der Adresse des Ergebnisses, damit sie es absenden. Bei einer Liste auf GitHub, GitLab oder Codeberg ist dafür keine Einstellung nötig.

Setze `! issues:` auf deinen Issue-Tracker, damit Abonnenten auch Websites vorschlagen können: „Schlage es *deine Liste* vor“ erscheint dann im Menü an Ergebnissen, die deine Liste nicht nennt. Meldungen gehen ebenfalls an `! issues:`, setze es also, wenn die Issues deines Repositorys ausgeschaltet sind. Pull Requests funktionieren wie bei jedem Repository.

## 5. Ins Verzeichnis aufnehmen

Damit deine Liste allen unter **Einstellungen → Listen → Weitere Listen** angeboten wird, eröffne einen Pull Request, der sie zu [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json) hinzufügt. Die Seite [Listenverzeichnis](../../lists.md) (auf Englisch) zeigt, was dort jetzt steht.
