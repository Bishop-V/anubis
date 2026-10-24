# Erste Schritte

Installiere Anubis, suche wie immer und blende deine erste Website aus.

## Installieren

- **Firefox:** [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/).
- **Chrome, Brave, Vivaldi, Opera und Edge:** [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). Wähle in Edge zuerst **Erweiterungen aus anderen Stores zulassen**.
- **Firefox für Android** (experimentell): [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) auf dem Smartphone, dann öffne Anubis über das Menü von Firefox. Google, DuckDuckGo und Bing funktionieren; andere Suchmaschinen vielleicht noch nicht.

Anubis funktioniert auch ohne seine Schaltfläche in der Symbolleiste. Wenn du sie in Chrome dort haben möchtest, öffne das Puzzleteil-Menü und hefte sie an.

## Wie gewohnt suchen

Suche in einer beliebigen [unterstützten Suchmaschine](./search-engines.md). Anubis startet mit Listen, die offizielle Dokumentation, Diskussionen, Nachschlagewerke, Paywalls, FOSS-Werkzeuge und KI-generierte Inhalte mit Tags versehen. Eine weitere wertet unabhängige Wikis über Fandom auf.

Eine Zusammenfassung über den Ergebnissen sagt, was Anubis getan hat. Auf dem Smartphone zeigt **Details** den Rest.

![Die Zusammenfassung über den Ergebnissen](../../img/summary.png)

## Eine Website ausblenden

Drücke die runde Schaltfläche links neben einem Ergebnis und wähle **Ausblenden**. Diese Website ist bei jeder Suche weg, und **Rückgängig** in der Zusammenfassung holt sie zurück. Auf dem Smartphone ist die Schaltfläche das ⚖ am Ende des Titels.

![Das Menü an einem Ergebnis: Ausblenden, Abwerten, Normal, Aufwerten und Anheften, darunter Tags](../../img/menu.png)

- **Ausgeblendete zeigen** in der Zusammenfassung zeigt die ausgeblendeten Ergebnisse dieser Seite.
- Um eine Website dauerhaft wieder einzublenden, zeige sie, öffne ihr Menü und wähle **Normal**.
- Damit an jedem ausgeblendeten Ergebnis eine Zeile bleibt, wähle **Einklappen** unter **Einstellungen → Darstellung → Ausgeblendete Ergebnisse**.

![Ein ausgeblendetes Ergebnis im Stil Einklappen: eine Zeile mit einer Schaltfläche Zeigen](../../img/hidden.png)

## Die aktuelle Website einstufen

Drücke auf einer beliebigen Website die Schaltfläche von Anubis in der Symbolleiste, um diese Website einzustufen oder mit Tags zu versehen. Auf einer Suchseite zeigt das Pop-up stattdessen, was Anubis getan hat.

<img src="../../img/popup.png" width="364" alt="Das Pop-up der Symbolleiste auf wikipedia.org: Das Tag Reference ist unter den Tags der Website ausgewählt und unterstrichen">

## Tastenkürzel

- **Alt+Umschalt+O** schaltet Anubis ein oder aus.
- **Alt+Umschalt+H** zeigt die ausgeblendeten Ergebnisse oder blendet sie wieder aus.

Auf dem Mac drückst du Control statt Alt. Ändern kannst du sie unter `chrome://extensions/shortcuts` oder in Firefox unter `about:addons` → Zahnrad → **Tastenkombinationen für Erweiterungen verwalten**.

## Weiter

- [Websites einstufen](./ranking.md): Websites abwerten, aufwerten oder anheften, und wählen, wie viel der Website eine Einstufung erfasst.
- [Tags](./tags.md): Websites selbst mit Tags versehen und wählen, was jedes Tag bewirkt.
- [Listen abonnieren](./lists.md): Listen hinzufügen, die Websites für dich mit Tags versehen und einstufen.
- [Bereiche entfernen](./clean-up.md): KI-Antworten und andere Bereiche aus jeder Suche nehmen.

## Von Hand laden

Lade ein Paket von [GitHub Releases](https://github.com/Bishop-V/anubis/releases) herunter oder baue es mit [Node.js](https://nodejs.org) 22.12 oder neuer:

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox
npm run build:chrome   # Chrome, Edge und andere Chromium-Browser
```

- **Firefox:** Wähle in `about:debugging` **Dieser Firefox → Temporäres Add-on laden** und wähle `.output/firefox-mv2/manifest.json`. Es verschwindet, wenn Firefox geschlossen wird.
- **Chrome oder Edge:** Schalte in `chrome://extensions` oder `edge://extensions` den **Entwicklermodus** ein, wähle **Entpackte Erweiterung laden** und wähle `.output/chrome-mv3` oder das entpackte Paket.

::: warning Sprachen
Anubis verwendet die Sprache deines Browsers, wenn es eine Übersetzung gibt. Nur Englisch wird vollständig unterstützt; die anderen Sprachen, auch Deutsch, sind maschinelle Übersetzungen, also verwende sie mit Vorsicht. [Bei der Übersetzung helfen](./translate.md) sagt mehr.
:::
