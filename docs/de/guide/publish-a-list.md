# Eine Liste veröffentlichen

Eine Liste ist eine Textdatei in einem öffentlichen Repository. Über Issues und Pull Requests tragen andere bei.

## 1. Schreiben

Fang mit **Einstellungen → Sicherung → Meine Liste herunterladen** an, oder schreib eine:

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

Gib jeder markierten Website einen `#`-Kommentar, der sagt, warum. Listen, die nur Tags vergeben, sind am freundlichsten: Abonnenten entscheiden, was Tags bewirken. Verwende [vorhandene Tag-IDs](../../list-format.md#tags), wo sie passen, und ändere eine nie, wenn sie veröffentlicht ist. Siehe das [Listenformat](../../list-format.md) (auf Englisch).

## 2. Online stellen

Leg sie in ein öffentliches Repository auf GitHub, GitLab oder Codeberg, oder in einen Gist. Ein Name auf `.anubis` hilft.

## 3. Den Link teilen

Andere fügen ihn unter **Einstellungen → Listen → Liste hinzufügen** ein oder verwenden einen [Abonnieren-Link](../../subscribe.md#make-a-subscribe-link) mit einem Klick.

## 4. Von Fehlern erfahren und Vorschläge annehmen

Setze `! issues:` auf deinen Tracker, dann bekommen Abonnenten eine Schaltfläche **Änderungen vorschlagen**, die dort ein vorausgefülltes Issue öffnet.

## 5. Ins Verzeichnis aufnehmen

Öffne einen Pull Request, der sie zu [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json) hinzufügt. Siehe das [Listenverzeichnis](../../lists.md).
