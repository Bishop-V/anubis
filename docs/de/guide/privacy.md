# Datenschutz und Berechtigungen

::: warning Übersetzung
Dies ist eine maschinelle Übersetzung der Datenschutzerklärung von Anubis. Wenn sich Übersetzung und [englische Fassung](../../guide/privacy.md) unterscheiden, gilt die englische.
:::

Anubis hat keinen vom Entwickler betriebenen Server. Es liest Suchergebnisse und die Adresse des aktuellen Tabs in deinem Browser, um deine Entscheidungen anzuwenden; es sendet diese Browsing-Daten nicht an den Entwickler. Deine Einstellungen bleiben in deinem Browser, es sei denn, du verbindest einen eigenen Speicherserver, um zwischen Browsern zu synchronisieren.

## Wie Anubis Daten verwendet

Anubis verwendet Informationen, auf die es über Browser-Berechtigungen zugreift, nur für seine nutzerseitigen Funktionen: deine Einstufungen und Tags auf Suchergebnisse anwenden, die Einstellungen der aktuellen Website im Popup zeigen, abonnierte Listen herunterladen und mit einem WebDAV-Server synchronisieren, den du verbindest. Es sendet diese Informationen nicht an den Entwickler und nutzt sie nicht für Werbung. Anubis hat keinen eigenen Sync-Server.

Diese Verwendung entspricht der User Data Policy des Chrome Web Store, einschließlich ihrer Limited-Use-Anforderungen.

## Was gespeichert wird und wo

- **Deine Liste, Einstellungen, Tag-Entscheidungen und Abonnements** liegen im Sync-Speicher deines Browsers. Wenn du in deinem Browser angemeldet bist (mit einem Firefox- oder Google-Konto) und die Synchronisierung an ist, kopiert der Browser sie auf deine anderen Computer. Anubis sieht sie nie. Wenn deine Liste für den Sync-Speicher zu groß wird, bleibt sie nur auf diesem Computer. Siehe [Zwischen Computern synchronisieren](./sync.md).
- **Adresse und Zugangsdaten eines Sync-Servers**, falls du einen verbindest, um zwischen Browsern zu synchronisieren, werden nur in diesem Browser gespeichert, nie in der Browser-Synchronisierung. Anubis sendet die Zugangsdaten zur Anmeldung an diesen Server; sie sind nicht Teil der Sync-Datei. Wenn du Ende-zu-Ende-Verschlüsselung aktivierst, wird ihre Passphrase ebenfalls nur in diesem Browser gespeichert, damit die automatische Synchronisierung die Datei ver- und entschlüsseln kann.
- **Heruntergeladene Listen** liegen nur auf diesem Computer und werden anderswo erneut heruntergeladen.

## Womit sich Anubis verbindet

Nur mit diesen:

- **Den Listen, die du abonnierst**, von wo sie gehostet werden, um einmal am Tag auf neue Versionen zu prüfen, oder seltener, wenn eine Liste es sagt (die eigenen Listen von Anubis: einmal pro Woche). Das beginnt bei der Installation von Anubis, weil es dich auf sieben Listen abonniert, die in seinem GitHub-Repository liegen: fünf eigene und zwei, die es aus den Daten anderer Projekte macht. Du kannst sie unter **Einstellungen → Listen** ausschalten.
- **Dem Listenverzeichnis** auf GitHub, wenn du **Einstellungen → Listen** öffnest, damit **Weitere Listen** die neuesten zeigt.
- **Der Suchmaschine, auf der du bist**, für [Mehr Ergebnisse laden](./more-results.md), das ihre nächste Seite lädt, wie es der Link „Next“ täte. Wenn die Suchmaschine eine Seite ohne Ergebnisse sendet, öffnet Anubis diese Seite noch einmal außer Sicht, was dem Selbstöffnen gleichkommt.
- **Dem WebDAV-Server, den du zum Synchronisieren zwischen Browsern verbindest**, falls du das tust. Anubis sendet deine eingestuften Websites, Einstellungen, Tag-Entscheidungen und Abonnements an die HTTPS-Adresse, die du angibst, und nirgendwohin sonst. Ende-zu-Ende-Verschlüsselung ist für neue Verbindungen standardmäßig an: Wenn aktiviert, erhält der Server eine verschlüsselte Datei, die er nicht lesen kann. Du kannst sie beim Verbinden ausschalten; bestehende unverschlüsselte Verbindungen bleiben unverschlüsselt, bis du sie aktivierst. Ohne Verschlüsselung kann der Betreiber des Servers die Datei lesen. Siehe [Zwischen Browsern](./sync.md).
- **Dem Issue-Tracker von Anubis auf GitHub**, wenn du **Problem melden** wählst. Das öffnet in einem neuen Tab ein neues Issue, in dem die Version von Anubis, dein Browser und seine Version und die Suchmaschine, auf der du bist, ausgefüllt sind, und nichts von der Seite selbst. Nichts wird gesendet, es sei denn, du schickst das Issue selbst ab.
- **Issue-Trackern**, wenn du „Melde es …“ oder „Schlage es … vor“ wählst. Das öffnet in einem neuen Tab eine Seite mit der Adresse des Ergebnisses (ohne alles nach `?`, das Details deines Besuchs enthalten kann) und der Regel, die gegriffen hat; nichts wird gesendet, es sei denn, du schickst das Issue selbst ab.

Eine Liste herunterzuladen funktioniert wie jeder andere Download: Die Website, die sie hostet, sieht deine IP-Adresse und welche Datei angefragt wurde. Anubis sendet nichts anderes mit: keine Cookies, keine Kennung und nichts über deine Suchen.

## Berechtigungen

Wenn du Anubis installierst, fragt dein Browser nach:

- **Zugriff auf die Websites der Suchmaschinen**, damit Anubis ihre Ergebnisseiten ändern kann.
- **Zugriff auf die [Abo-Seite](../../subscribe.md) dieses Wikis**, damit ein Abo-Link die Einstellungen von Anubis mit einer ausgefüllten Liste öffnen kann. Dein Browser benennt sie nach der Website, auf der dieses Wiki liegt, `bishop-v.github.io`. Anubis liest dort nur die Adresse des Links.
- **Speicher**, um deine Liste und Einstellungen zu behalten.
- **Dem aktuellen Tab, wenn du das Symbolleisten-Popup öffnest** (`activeTab` genannt). Das lässt das Popup die Adresse der Website lesen, auf der du bist, damit du sie einstufen kannst. Es zeigt keine Warnung bei der Installation und gilt, bis dieser Tab zu einer anderen Seite wechselt.

Anubis läuft auf keinen anderen Websites.

Anubis kann dich außerdem im Moment des Abonnierens bitten, von **einer Website zu lesen**, die eine Liste hostet. Das ist für Listen nötig, die irgendwo anders als auf GitHub oder in einem Gist liegen. Dasselbe fragt es bei einem Sync-Server, im Moment des Verbindens. Beides kannst du in den Erweiterungseinstellungen deines Browsers zurücknehmen.

In unterstützten Firefox-Versionen erklärt Anubis, keine Datenerhebung vorauszusetzen, und bittet nur um die optionale Einwilligung zur Browsing-Aktivität, wenn du einen Sync-Server verbindest. Firefox fragt dann, ob Anubis deine Liste dorthin senden darf. **Trennen** nimmt diese Einwilligung zurück.

## Fragen

Diese Seite ist die Datenschutzerklärung von Anubis, und die Einträge im Chrome Web Store und bei Firefox Add-ons verlinken auf ihre englische Fassung. Wenn sie sich ändert, steht die Änderung im [Verlauf der Seite auf GitHub](https://github.com/Bishop-V/anubis/commits/main/docs/guide/privacy.md). Stelle jede Frage dazu, indem du [ein Issue eröffnest](https://github.com/Bishop-V/anubis/issues).
