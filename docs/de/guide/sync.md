# Zwischen Computern synchronisieren

Anubis hat kein eigenes Konto und keinen eigenen Server. Es speichert deine Daten im Sync-Speicher deines Browsers, und dein Browser kopiert sie auf deine anderen Computer. Um auch zwischen Firefox und Chrome zu teilen, kannst du einen eigenen Speicherdienst verbinden.

## Was synchronisiert wird

- **Deine Liste**: jede Website, die du eingestuft oder getaggt hast
- **Einstellungen**
- **Tag-Entscheidungen**: was jedes Tag bewirkt, sowie sein Name und seine Farbe
- **Abonnements**: welche Listen du abonniert hast

Die Listen, die du abonniert hast, werden nicht zwischen Computern kopiert. Jeder Computer lädt seine eigene Kopie von derselben Adresse.

## Browser-Synchronisierung

Sie ist von Anfang an an, ohne dass du in Anubis etwas einrichten musst. Anubis kann allerdings nicht sehen, ob die Synchronisierung deines Browsers an ist. Wenn eine Änderung auf deinem anderen Computer nicht erscheint, prüfe diese Einstellungen auf beiden.

- **Firefox:** Melde dich mit deinem Mozilla-Konto bei Firefox an. Stelle in den Einstellungen von Firefox unter **Sync** sicher, dass **Add-ons** angehakt ist: Das synchronisiert auch die Daten der Add-ons. Firefox synchronisiert etwa alle 10 Minuten. Um sofort zu synchronisieren, wähle am selben Ort **Jetzt synchronisieren**.
- **Chrome:** Melde dich bei Chrome mit eingeschalteter Synchronisierung an und behalte **Erweiterungen** unter den synchronisierten Dingen (Einstellungen von Chrome, unter **Du und Google**).

Die Browser-Synchronisierung erreicht nur denselben Browser auf deinen anderen Computern. Firefox und Chrome synchronisieren nicht miteinander, und Firefox für Android synchronisiert gar keine Add-on-Daten.

## Zwischen Browsern

Um zwischen Firefox und Chrome oder mit Firefox für Android zu teilen, verbinde in jedem Browser denselben Speicher. Das ist optional, und nichts ändert sich, bis du verbindest. Anubis funktioniert mit jedem Speicherdienst, der **WebDAV** anbietet, eine Standardmethode, mit der Apps dort Dateien speichern. Es hält dort eine Datei, `anubis-sync.json`.

### Eine Adresse und ein Passwort besorgen

Du brauchst vom Dienst drei Dinge: seine WebDAV-Adresse, deinen Benutzernamen und ein Passwort für Apps. Die meisten Dienste akzeptieren hier dein übliches Passwort nicht. Sie lassen dich stattdessen für jede App ein eigenes anlegen, das du zurücknehmen kannst, ohne dein eigenes zu ändern.

| Dienst | Adresse | Passwort |
| --- | --- | --- |
| **Koofr** (10 GB kostenlos) | `https://app.koofr.net/dav/Koofr` | Lege in Koofr unter **Preferences → Password → App passwords** eines an. Dein Benutzername ist deine E-Mail-Adresse. |
| **InfiniCLOUD** (20 GB kostenlos) | Steht auf deiner Kontoseite unter **Apps Connection**, sobald du es einschaltest | Dieselbe Seite zeigt Benutzername und Passwort für Apps. |
| **Nextcloud** | `https://your-server/remote.php/dav/files/your-user-name/` | **Settings → Security → Devices & sessions**: ein App-Passwort anlegen. |

Andere Dienste und dein eigener Server funktionieren auch, wenn sie WebDAV über `https://` anbieten. Jeder Ordner genügt: Gib seine Adresse an, und Anubis legt seine Datei dort ab. Eine Adresse, die auf `.json` endet, wird als die Datei selbst verwendet.

### Verbinden

<!-- Maintainer: German translation of docs/guide/sync.md. The screenshot is the English one, from the mock Settings page. -->

![Einstellungen, Synchronisierung](../../img/options-sync.png)

1. Öffne **Einstellungen → Synchronisierung** und gib unter **Zwischen Browsern** die Adresse, deinen Benutzernamen und das Passwort ein.
2. Lasse **Die Sync-Datei Ende-zu-Ende verschlüsseln** eingeschaltet und wähle eine lange, einmalige Passphrase mit mindestens 12 Zeichen. Verwende in jedem Browser dieselbe Passphrase. Anubis speichert sie im lokalen Erweiterungsspeicher dieses Browsers, damit die Synchronisierung im Hintergrund laufen kann; sie wird nie an den Server gesendet oder von der Browser-Synchronisierung kopiert. Verwende nicht dein WebDAV-Anmeldepasswort.
3. Klicke auf **Verbinden**. Der Browser fragt, ob Anubis diesen Server erreichen darf. Firefox fragt außerdem, ob Anubis deine Liste dorthin senden darf.
4. Mache dasselbe in deinem anderen Browser mit derselben Verschlüsselungs-Passphrase.

**Einstellungen → Synchronisierung** zeigt dann, wann Anubis zuletzt synchronisiert hat oder was schiefgegangen ist. **Jetzt synchronisieren** synchronisiert sofort.

### Warum diese Verschlüsselung

Anubis verwendet **AES-256-GCM**, einen weit unterstützten authentifizierten Verschlüsselungsmodus, der in die Web-Crypto-API der Browser eingebaut ist. AES verschlüsselt die Sync-Datei; GCM prüft zusätzlich, dass der Geheimtext nicht verändert wurde, und verwendet für jeden Schreibvorgang eine neue zufällige Nonce. Der 256-Bit-Schlüssel wird mit **PBKDF2-SHA-256** und einem zufälligen Salt aus deiner Passphrase abgeleitet, sodass Anubis keine eigene Schlüsseldatei sendet oder speichert. Die eingebaute Kryptografie des Browsers zu nutzen vermeidet, eine Krypto-Bibliothek eines Dritten mitzuliefern.

Das schützt den Inhalt der Datei, nicht die Tatsache, dass du dich mit dem Server verbindest. Der Betreiber des Servers kann weiterhin Verbindungsmetadaten sehen und die Datei löschen oder ersetzen; Verschlüsselung verhindert nicht, dass eine ältere verschlüsselte Kopie zurückgehalten oder erneut eingespielt wird. Wenn du die Passphrase vergisst, lässt sich die Kopie auf dem Server nicht wiederherstellen; deine Daten in jedem Browser bleiben verfügbar. Wähle eine lange, einmalige Passphrase und bewahre eine separate Sicherung auf.

Anubis hält die Passphrase im lokalen Erweiterungsspeicher dieses Browsers, um automatisch zu synchronisieren. Sie ist nicht geschützt vor jemandem, der auf dein Browserprofil zugreifen oder Code in deinem Namen ausführen kann. WebDAV-Zugangsdaten werden ebenfalls lokal gespeichert und zur Anmeldung an den Server gesendet.

### Die Passphrase ändern

Verwende unter **Einstellungen → Synchronisierung** **Verschlüsselungs-Passphrase ändern**. Gib eine neue Passphrase mit mindestens 12 Zeichen ein und bestätige sie. Anubis prüft zuerst, dass die aktuelle Passphrase die Datei auf dem Server entschlüsselt, und ersetzt sie dann nur, wenn der Server bestätigt, dass sie in der Zwischenzeit niemand geändert hat. Schlägt diese Prüfung oder das Schreiben fehl, behält Anubis die aktuelle Passphrase und überschreibt die Datei nicht. Synchronisiere zuerst und versuche es erneut, wenn sich die Datei während des Vorgangs geändert hat.

Wenn die Verbindung abbricht, während der Server die neue Datei speichert, liest Anubis die Datei zurück. Öffnet die neue Passphrase sie, speichert Anubis die neue Passphrase. Kann Anubis den Server zur Prüfung nicht erreichen, behält es die alte Passphrase und sagt das. Meldet die nächste Synchronisierung dann eine falsche Passphrase, gib die neue ein.

Gib nach einer erfolgreichen Änderung die neue Passphrase in jedem anderen Browser ein, bevor er synchronisiert. Ein Browser, der noch die alte Passphrase verwendet, kann die verschlüsselte Datei weder lesen noch ändern; er meldet den Passphrase-Fehler und lässt die Datei in Ruhe.

Neue Verbindungen verwenden standardmäßig Verschlüsselung. Um sie auszuschalten, hake die Option beim Verbinden ab; der Betreiber des Servers kann die Datei dann lesen. Bestehende Verbindungen bleiben unverschlüsselt, bis du unter Einstellungen → Synchronisierung eine Passphrase eingibst, bestätigst und **Passphrase speichern und synchronisieren** wählst. Eine verschlüsselte Datei erfordert in jedem Browser die Passphrase; Anubis überschreibt sie nicht, wenn eine Passphrase fehlt oder falsch ist. Einfache Sicherungen, die aus den Einstellungen exportiert werden, werden von dieser Funktion nicht verschlüsselt.

### Wann synchronisiert wird

- Ein paar Sekunden nachdem du etwas änderst
- Wenn der Browser startet
- Wenn du suchst, höchstens alle 5 Minuten

### Änderungen aus beiden Browsern

Anubis führt die Änderungen aus jedem Browser zusammen, sodass nichts verloren geht, wenn du beide benutzt:

- Eine Website, die du in Firefox ausblendest, und eine, die du in Chrome taggst, bleiben beide erhalten.
- Wenn du eine Website in einem Browser aufwertest und im anderen taggst, ist sie am Ende aufgewertet und getaggt.
- Wenn beide Browser dasselbe ändern, bevor sie synchronisiert haben, etwa die Einstufung derselben Website oder dieselbe Einstellung, gewinnt der Browser, der zuletzt synchronisiert.

Beim ersten Verbinden übernimmt ein Browser alles aus der Datei. Websites und Einstellungen, die du in diesem Browser vor dem Verbinden geändert hast, bleiben ebenfalls erhalten, es sei denn, die Datei hat genau diese geändert.

### Trennen

**Trennen** unter **Einstellungen → Synchronisierung** beendet die Synchronisierung in diesem Browser. Deine Liste und Einstellungen bleiben im Browser, und die Datei bleibt auf dem Server. Lösche die Datei dort, wenn du sie loswerden willst.

## Grenzen

- **Größe:** Die Browser-Synchronisierung fasst etwa 100 KB pro Add-on. Anubis komprimiert deine Liste vor dem Speichern, sodass etwa 10.000 Websites hineinpassen. **Einstellungen → Synchronisierung** zeigt, wie viel Platz sie brauchen. Wächst deine Liste darüber hinaus, behält die Browser-Synchronisierung sie nur auf diesem Computer, und die Einstellungen sagen das; Einstellungen, Tag-Entscheidungen und Abonnements werden weiterhin synchronisiert. Die Synchronisierung über einen Server hat diese Grenze nicht.
- **Listen von anderen Hosts:** Wenn du eine Liste abonnierst, die nicht auf GitHub liegt, fragt jeder Browser um Erlaubnis, sie herunterzuladen. Klicke nach dem Synchronisieren im anderen Browser unter **Einstellungen → Listen** auf die Schaltfläche **Jetzt aktualisieren** (↻) dieser Liste, um es dort zu erlauben.
- **Nur einmal umziehen:** Du kannst auch eine [Sicherung exportieren](./import-and-backup.md) und im anderen Browser wiederherstellen. Die Sync-Datei hat dasselbe Format, daher liest **Sicherung wiederherstellen** sie ebenfalls.

## Datenschutz

Die Browser-Synchronisierung läuft über dein Browserkonto, wie deine Lesezeichen. Anubis sieht sie nie.

Wenn du einen Server verbindest, gehen deine Liste, Einstellungen, Tag-Entscheidungen und Abonnements an diesen Server und nirgendwohin sonst. Mit aktivierter Ende-zu-Ende-Verschlüsselung kann der Server die Sync-Datei nicht lesen; ohne sie kann es der Betreiber des Servers. Dein WebDAV-Benutzername und -Passwort werden in diesem Browser gespeichert, zur Anmeldung an den Server gesendet und nie in die Browser-Synchronisierung oder die Sync-Datei gelegt. Die Verschlüsselungs-Passphrase wird lokal in jedem Browser gespeichert, in dem du sie festlegst, und nie an den Server gesendet. Siehe [Datenschutz und Berechtigungen](./privacy.md).
