# Zwischen Computern synchronisieren

Deine Websites, Einstellungen, Tag-Einstellungen und Abonnements werden über deinen Browser synchronisiert. Um zwischen Firefox und Chrome zu synchronisieren, verbinde einen WebDAV-Server. Abonnierte Listen werden nicht kopiert; jeder Browser lädt seine eigene.

## Browser-Synchronisierung

Von Anfang an an, über dein Browserkonto:

- **Firefox:** Melde dich an und setze in den Einstellungen von Firefox unter **Sync** ein Häkchen bei **Add-ons**.
- **Chrome:** Melde dich mit eingeschalteter Synchronisierung an und lass **Erweiterungen** synchronisieren.

Sie erreicht nur denselben Browser auf anderen Computern. Firefox für Android synchronisiert keine Daten von Add-ons.

## Zwischen Browsern

Verbinde in jedem Browser denselben WebDAV-Speicher. Anubis legt dort eine Datei ab, `anubis-sync.json`.

### Adresse und Passwort besorgen

Du brauchst die WebDAV-Adresse des Dienstes, deinen Benutzernamen und ein App-Passwort.

| Dienst | Adresse | App-Passwort |
| --- | --- | --- |
| **Koofr** (10 GB kostenlos) | `https://app.koofr.net/dav/Koofr` | **Preferences → Password → App passwords**. Der Benutzername ist deine E-Mail-Adresse. |
| **InfiniCLOUD** (20 GB kostenlos) | Auf deiner Kontoseite unter **Apps Connection** | Dieselbe Seite. |
| **Nextcloud** | `https://your-server/remote.php/dav/files/your-user-name/` | **Einstellungen → Sicherheit → Geräte & Sitzungen**. |

Jeder WebDAV-Server über `https://` funktioniert.

### Verbinden

![Einstellungen, Synchronisierung](../../img/options-sync.png)

1. Gib unter **Einstellungen → Synchronisierung → Zwischen Browsern** die Adresse, den Benutzernamen und das Passwort ein.
2. Lass **Die Sync-Datei Ende-zu-Ende verschlüsseln** an und wähle eine Passphrase mit mindestens 12 Zeichen. Verwende in jedem Browser dieselbe.
3. Drücke **Verbinden** und erlaube, worum der Browser fragt.
4. Wiederhole das in deinem anderen Browser.

Die Datei wird mit AES-256-GCM verschlüsselt, sodass der Server sie nicht lesen kann. Vergisst du die Passphrase, lässt sich die Kopie auf dem Server nicht wiederherstellen, aber jeder Browser behält seine Daten.

### Die Passphrase ändern

Verwende **Verschlüsselungs-Passphrase ändern** unter **Einstellungen → Synchronisierung** und gib die neue dann in jedem anderen Browser ein.

### Wann synchronisiert wird

Ein paar Sekunden nach einer Änderung, beim Start des Browsers und bei einer Suche, höchstens alle 5 Minuten. **Jetzt synchronisieren** synchronisiert sofort.

### Änderungen aus beiden Browsern

Änderungen aus beiden Browsern werden zusammengeführt. Ändern beide dasselbe, gewinnt der, der zuletzt synchronisiert.

### Trennen

**Trennen** beendet die Synchronisierung in diesem Browser. Deine Daten bleiben, und die Datei auf dem Server auch.

## Grenzen

- Die Browser-Synchronisierung fasst etwa 10.000 Websites. Darüber hinaus bleiben deine Websites auf diesem Computer; WebDAV hat keine Grenze.
- Eine Liste außerhalb von GitHub braucht in jedem Browser eine Erlaubnis: Drücke ihr ↻ unter **Einstellungen → Listen**.
- Um nur einmal umzuziehen, [exportiere eine Sicherung](./import-and-backup.md) und stelle sie wieder her.

## Datenschutz

Die Browser-Synchronisierung läuft über dein Browserkonto. Ein WebDAV-Server bekommt die Sync-Datei und deine Anmeldedaten. Die Passphrase wird nie gesendet. Siehe [Datenschutz und Berechtigungen](./privacy.md).
