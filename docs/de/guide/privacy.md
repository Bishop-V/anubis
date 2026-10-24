# Datenschutz und Berechtigungen

Anubis hat keinen Server und sammelt nichts. Es liest Suchergebnisse und die Adresse des aktuellen Tabs in deinem Browser, um deine Entscheidungen anzuwenden, und sendet sie nie an den Entwickler.

## Wie Anubis Daten verwendet

Daten aus Browserberechtigungen werden nur für die Funktionen von Anubis verwendet: Ergebnisse einstufen und mit Tags versehen, die aktuelle Website im Pop-up zeigen, deine Listen herunterladen und mit einem WebDAV-Server synchronisieren, den du verbindest. Sie werden nie an den Entwickler gesendet oder für Werbung verwendet.

Diese Verwendung entspricht der Chrome Web Store User Data Policy, einschließlich ihrer Anforderungen an die eingeschränkte Nutzung (Limited Use).

## Was gespeichert wird, und wo

- **Deine Websites, Einstellungen, Tag-Einstellungen und Abonnements:** im Sync-Speicher deines Browsers, den dein Browser auf deine anderen Computer kopieren kann. Siehe [Zwischen Computern synchronisieren](./sync.md).
- **Adresse, Anmeldedaten und Passphrase eines Sync-Servers:** nur in diesem Browser, nie in der Browser-Synchronisierung oder der Sync-Datei.
- **Heruntergeladene Listen:** nur auf diesem Computer.

## Womit Anubis sich verbindet

Nur hiermit:

- **Den Listen, die du abonniert hast**, etwa einmal am Tag. Anubis startet mit neun Listen auf GitHub; schalte sie unter **Einstellungen → Listen** aus.
- **Dem Listenverzeichnis** auf GitHub, wenn du **Einstellungen → Listen** öffnest.
- **Der Suchmaschine, auf der du bist**, für [Mehr Ergebnisse laden](./more-results.md). Bei Ecosia kommen die Website-Symbole dieser Ergebnisse von Ecosias Symboldienst.
- **Deinem WebDAV-Server**, wenn du einen verbindest. Er bekommt deine Websites, Einstellungen, Tag-Einstellungen und Abonnements, standardmäßig verschlüsselt. Ohne Verschlüsselung kann sein Betreiber sie lesen.
- **Issue-Trackern**, wenn du **Problem melden** wählst (vorausgefüllt mit der Version von Anubis, deinem Browser und der Suchmaschine) oder **Änderungen vorschlagen** an einer Liste. Sie öffnen sich in einem neuen Tab, und nichts wird gesendet, bis du absendest.

Wer eine Liste bereitstellt, sieht deine IP-Adresse und welche Datei angefragt wurde, wie bei jedem Download. Sonst wird nichts gesendet.

## Berechtigungen

- **Die Websites der Suchmaschinen**, um ihre Ergebnisseiten zu verändern.
- **Die [Abonnieren-Seite](../../subscribe.md) dieses Wikis** (`bishop-v.github.io`), damit Abonnieren-Links funktionieren. Anubis liest dort nur die Adresse des Links.
- **Speicher**, für deine Websites und Einstellungen.
- **Den aktuellen Tab, wenn du das Pop-up öffnest** (`activeTab`), um die Adresse der Website zu lesen.

Anubis läuft auf keinen anderen Websites. Es bittet nur dann darum, eine weitere Website zu lesen, wenn du eine Liste außerhalb von GitHub abonnierst oder einen Sync-Server verbindest. In Firefox gibt Anubis keine erforderliche Datenerhebung an und bittet nur beim Verbinden eines Sync-Servers um die Einwilligung für Browseraktivität; **Trennen** zieht sie zurück.

## Fragen

Diese Seite ist die Datenschutzerklärung von Anubis; die Store-Einträge verlinken auf ihre [englische Fassung](../../guide/privacy.md). Änderungen stehen in ihrem [Verlauf auf GitHub](https://github.com/Bishop-V/anubis/commits/main/docs/guide/privacy.md). Frag alles, indem du [ein Issue eröffnest](https://github.com/Bishop-V/anubis/issues).
