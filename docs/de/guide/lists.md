# Listen abonnieren

Eine Liste versieht Websites für dich mit Tags, stuft sie ein oder blendet sie aus. Jeder kann eine als Textdatei im Web veröffentlichen.

Anubis startet mit diesen Listen: **Official docs**, **Discussions**, **Reference**, **Paywalls**, **FOSS tools**, **AI content** und **Independent wikis**. Schalte jede unter **Einstellungen → Listen** aus.

<!-- Maintainer: German translation of docs/guide/lists.md. The screenshots are the English ones. -->

![Einstellungen, Listen](../../img/options-lists.png)

## Abonnieren

- **Einstellungen → Listen → Weitere Listen**, dann **Abonnieren**.
- Oder **Abonnieren** im [Listenverzeichnis](../../lists.md) oder auf der eigenen Seite einer Liste.
- Oder füge ihre Adresse unter **Liste hinzufügen** ein. Links zu GitHub, GitLab, Codeberg, Gists und Goggles funktionieren.

Listen außerhalb von GitHub bitten um die Erlaubnis, diese eine Website zu lesen.

## Welche Listen funktionieren

- Anubis-Listen (`.anubis`)
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- [uBlacklist](https://github.com/iorate/ublacklist)-Regelsätze
- Einfache Domainlisten und Hosts-Dateien

Regeln, die Anubis nicht nutzen kann, werden übersprungen und gezählt.

::: warning Linsen
Manche Goggles sind *Linsen*: Sie blenden jede Website aus, die sie nicht nennen. Anubis markiert sie mit „lens“.
:::

## Aktualisierungen

Listen werden etwa einmal am Tag aktualisiert. **Alle aktualisieren** unter **Einstellungen → Listen** prüft sofort.

## Listen aus anderen Projekten

Diese werden jede Woche aus den Daten anderer Projekte neu erstellt. Um eine zu ändern, trage zu ihrer Quelle bei.

| Liste | Quelle | Was sie tut |
| --- | --- | --- |
| **AI content** | [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist) von laylavish (CC0) | Markiert KI-generierte Websites. |
| **Official docs (DevDocs)** | [DevDocs](https://github.com/freeCodeCamp/devdocs) von seinen Mitwirkenden (MPL-2.0) | Markiert rund 210 Dokumentationsseiten und wertet sie leicht auf. |
| **Self-hosted FOSS** | [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) von seinen Mitwirkenden (CC BY-SA 3.0) | Markiert rund 1.000 selbst hostbare Programme als FOSS. |
| **Independent wikis** | [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy) von Kevin Payravi (MIT) | Wertet unabhängige Wikis auf und die Fandom-Wikis ab, die sie ersetzen. |

## Ausschalten oder abbestellen

Jede Liste hat einen Schalter und eine Schaltfläche zum Abbestellen. Um eine Liste bei einer Website zu überstimmen, stufe die Website selbst ein.

## Einen Fehler in einer Liste melden

Das Menü eines Ergebnisses nennt die Listen hinter seiner Einstufung. Drücke **Änderungen vorschlagen** neben der Liste unter **Einstellungen → Listen**, wähle **Von der Liste entfernen** oder **Etwas anderes** und sag, warum.

## Einer Liste eine Website vorschlagen

Drücke **Änderungen vorschlagen** neben der Liste unter **Einstellungen → Listen**, gib die Website ein und wähle ein Tag. Anubis öffnet im Tracker der Liste ein Issue, in dem die neue Regel schon eingetragen ist. Nichts wird gesendet, bis du es dort absendest.
