# Listen abonnieren

Eine Liste versieht Websites für dich mit Tags, stuft sie ein oder blendet sie aus. Jeder kann eine als Textdatei im Web veröffentlichen.

Anubis startet mit neun Listen. Die meisten versehen offizielle Dokumentation, Diskussionen, Nachschlagewerke, Paywalls, freie Software oder KI-Inhalte mit Tags; eine wertet unabhängige Wikis über Fandom auf. Das [Listenverzeichnis](../../lists.md) (auf Englisch) markiert sie. Schalte jede unter **Einstellungen → Listen** aus.

<!-- Maintainer: German translation of docs/guide/lists.md. The screenshots are the English ones. -->

![Einstellungen, Listen](../../img/options-lists.png)

## Abonnieren

- Drücke unter **Einstellungen → Listen → Weitere Listen** auf **Abonnieren**.
- Oder drücke **Abonnieren** im [Listenverzeichnis](../../lists.md) oder auf der eigenen Seite einer Liste.
- Oder füge die Adresse einer Liste unter **Liste hinzufügen** ein. Links zu GitHub, GitLab, Codeberg, Gists und Goggles funktionieren.

Eine Liste außerhalb von GitHub bittet um die Erlaubnis, diese eine Website zu lesen.

## Welche Listen funktionieren

- Anubis-Listen (`.anubis`)
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- [uBlacklist](https://github.com/iorate/ublacklist)-Regelsätze
- Einfache Domainlisten und Hosts-Dateien

Regeln, die Anubis nicht nutzen kann, werden übersprungen und gezählt.

::: warning Linsen
Manche Goggles sind *Linsen*: Sie blenden jede Website aus, die sie nicht nennen. Anubis markiert sie mit „Linse“.
:::

## Deine Listen verwalten

- **Ausschalten oder abbestellen:** Jede Liste hat einen Schalter und eine Schaltfläche zum Abbestellen. Um eine Liste bei einer Website zu überstimmen, [stufe die Website](./ranking.md) selbst ein.
- **Ordnen:** Ziehe eine Liste an den Punkten an ihrem Anfang, oder setze den Fokus darauf und drücke die Pfeiltasten nach oben und unten. Tags aus weiter oben stehenden Listen kommen bei Ergebnissen zuerst.
- **Aktualisieren:** Listen werden etwa einmal am Tag aktualisiert. **Alle aktualisieren** prüft sofort.

## Änderungen an einer Liste vorschlagen

Das Menü eines Ergebnisses nennt die Listen hinter seiner Einstufung. Um einer davon eine Website hinzuzufügen, eine zu entfernen oder etwas anderes zu melden, drücke **Änderungen vorschlagen** neben der Liste unter **Einstellungen → Listen**. Anubis öffnet im Tracker der Liste ein ausgefülltes Issue, und nichts wird gesendet, bis du es dort absendest.

## Listen aus anderen Projekten

Diese werden jede Woche aus den Daten anderer Projekte neu erstellt. Um eine zu ändern, trage zu ihrer Quelle bei.

| Liste | Quelle | Was sie tut |
| --- | --- | --- |
| **AI content** | [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist) von laylavish (CC0) | Markiert KI-generierte Websites. |
| **DevDocs** | [DevDocs](https://github.com/freeCodeCamp/devdocs) von seinen Mitwirkenden (MPL-2.0) | Markiert rund 210 Dokumentationsseiten und wertet sie leicht auf. |
| **Self-hosted FOSS** | [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) von seinen Mitwirkenden (CC BY-SA 3.0) | Markiert rund 1.000 selbst hostbare Programme als FOSS. |
| **Independent wikis** | [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy) von Kevin Payravi (MIT) | Wertet unabhängige Wikis auf und die Fandom-Wikis ab, die sie ersetzen. |
