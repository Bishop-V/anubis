# Erste Schritte

::: warning Sprachen
Anubis zeigt sich in der Sprache deines Browsers, wenn es eine Übersetzung gibt. Nur Englisch wird vollständig unterstützt: Arabisch, Bengalisch, Chinesisch (vereinfacht), Chinesisch (traditionell), Französisch, Deutsch, Hindi, Indonesisch, Italienisch, Japanisch, Koreanisch, Brasilianisch-Portugiesisch, Russisch, Spanisch, Türkisch, Urdu und Vietnamesisch sind maschinelle Übersetzungen, verwende sie also mit Vorsicht. Um Anubis auf Englisch zu verwenden, stelle die Sprache deines Browsers auf Englisch. [Bei der Übersetzung helfen](./translate.md) sagt mehr.
:::

## In Firefox installieren

Für die normale Installation hol dir [Anubis von Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/). Das neueste [Firefox-Build-Paket](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-firefox.zip) und Pakete mit Versionsnummer gibt es auch bei [GitHub Releases](https://github.com/Bishop-V/anubis/releases).

## In Firefox für Android installieren

Die Unterstützung für Firefox für Android ist experimentell. Hol dir [Anubis von Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) auf deinem Smartphone, in Firefox. Es liest die Smartphone-Layouts von Google, DuckDuckGo und Bing; die anderen Suchmaschinen funktionieren dort womöglich noch nicht. Auf dem Smartphone hat jedes Ergebnis eine Schaltfläche ⚖ am Ende seines Titels, und ihr Menü fährt vom unteren Bildschirmrand herauf. Firefox für Android legt Add-ons in sein Menü statt in eine Symbolleiste, also öffne Anubis von dort. Wenn etwas falsch aussieht, [melde es](https://github.com/Bishop-V/anubis/issues) mit einem Screenshot.

## In Chrome installieren

Für die normale Installation hol dir [Anubis aus dem Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). Das neueste [Chrome-Build-Paket](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-chrome.zip) gibt es auch bei [GitHub Releases](https://github.com/Bishop-V/anubis/releases).

## Andere Browser

Die meisten anderen Chromium-Browser wie Brave, Vivaldi und Opera installieren ebenfalls aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). In Edge wähle **Erweiterungen aus anderen Stores zulassen**, wenn der Chrome Web Store fragt, und installiere es dann dort. In Edge Add-ons ist Anubis noch nicht.

Um ein Paket von Hand zu laden, lade das [neueste Chrome-Build](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-chrome.zip) von GitHub Releases herunter und entpacke es, oder baue es aus dem Quellcode. Zum Bauen aus dem Quellcode brauchst du [Node.js](https://nodejs.org) 22.12 oder neuer:

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox development build
npm run build:chrome   # for Chrome, Edge, and other Chromium browsers
```

Lade den Entwicklungs-Build oder das entpackte Paket in deinen Browser:

- **Firefox:** Öffne `about:debugging`, wähle **Dieser Firefox**, dann **Temporäres Add-on laden** und wähle `.output/firefox-mv2/manifest.json`. Firefox entfernt temporäre Add-ons beim Schließen.
- **Chrome:** Öffne `chrome://extensions`, schalte den **Entwicklermodus** ein, wähle **Entpackte Erweiterung laden** und wähle `.output/chrome-mv3` oder das entpackte Release-Paket.
- **Edge:** Öffne `edge://extensions`, schalte den **Entwicklermodus** ein, wähle **Entpackte Erweiterung laden** und wähle `.output/chrome-mv3` oder das entpackte Release-Paket.

Nach der Installation öffnet Anubis einen Willkommens-Tab mit den Schritten, wie du seine Schaltfläche in der Symbolleiste behältst, einer Suche zum Ausprobieren und den Listen, mit denen du startest.

Browser legen neue Erweiterungen hinter die Schaltfläche „Erweiterungen“ (ein Puzzleteil) neben der Adressleiste. So bleibt die Schaltfläche von Anubis sichtbar:

- **Chrome:** Klicke auf das Puzzleteil, dann auf die Stecknadel neben Anubis.
- **Edge:** Klicke auf das Puzzleteil, dann auf das Auge neben Anubis.
- **Firefox:** Klicke auf das Puzzleteil, dann auf das Zahnrad neben Anubis und wähle **An Symbolleiste anheften**.

## Wie gewohnt suchen

Suche auf einer beliebigen [unterstützten Suchmaschine](./search-engines.md). Anubis startet mit Listen, die offizielle Dokumentation, Diskussionen, Nachschlagewerke, Bezahlschranken, freie Online-Werkzeuge und selbst gehostete Software sowie KI-generierte Inhalte mit Tags versehen und unabhängige Wikis über die Fandom-Wikis stellen, die sie ersetzen. Das Tag **AI slop** steht für Websites bereit, die du selbst taggen möchtest.

Eine einzeilige Zusammenfassung über den Ergebnissen sagt, was Anubis getan hat: welche Ergebnisse es aufgewertet, abgewertet oder ausgeblendet hat und welche Tags auf der Seite sind. Auf dem Smartphone sagt sie es in wenigen Worten („Anubis hat 4 von 9 Ergebnissen geändert.“), und **Details** zeigt den Rest.

<!-- Maintainer: the screenshots on this page are the English ones, from mock pages. -->

![Die Zusammenfassung über den Ergebnissen](../../img/summary.png)

## Eine Website ausblenden

Jedes Ergebnis hat eine Skala um das Symbol seiner Website: einen Halbkreis mit einer kleinen Krone links daran. Klicke auf die Krone und wähle im Menü **Ausblenden**. Bei Bild- und Videoergebnissen sitzt die Krone in der oberen rechten Ecke des Bildes. Auf dem Smartphone tippst du auf die Schaltfläche ⚖ am Ende des Ergebnistitels, und das Menü fährt vom unteren Bildschirmrand herauf.

![Das Menü an einem Ergebnis: Ausblenden, Abwerten, Normal, Aufwerten und Anheften, mit Tags darunter](../../img/menu.png)

Das Ergebnis verschwindet, und ab jetzt verschwindet jedes Ergebnis dieser Website bei jeder Suche. Die Zusammenfassung über den Ergebnissen ist immer da und sagt „Anubis hat alle 10 Ergebnisse gelassen, wie sie waren“, bis es etwas getan hat. Sie zählt, was ausgeblendet wurde, und sagt „fandom.com ausgeblendet.“ mit einer Schaltfläche **Rückgängig**, die die Website wieder so setzt, wie sie war.

- **Ausgeblendete zeigen** in der Zusammenfassung zeigt jedes ausgeblendete Ergebnis auf der Seite abgeblendet, bis du erneut klickst oder etwas anderes suchst.
- Um eine Website nicht mehr auszublenden, zeige sie, öffne ihr Menü und wähle **Normal**.
- Um an der Stelle jedes ausgeblendeten Ergebnisses eine Zeile zu lassen, wähle **Einklappen** unter **Einstellungen → Darstellung → Ausgeblendete Ergebnisse**:

![Ein ausgeblendetes Ergebnis im Stil „Einklappen“: eine Zeile mit der Schaltfläche „Zeigen“](../../img/hidden.png)

Deine Wahl gilt für die ganze Website, einschließlich ihrer Subdomains. Der Name oben im Menü legt fest, wie viel von der Website sie abdeckt: `en.wikipedia.org` oder das gesamte `wikipedia.org`.

## Die Website einstufen, auf der du bist

Klicke auf das Anubis-Symbol in der Symbolleiste, während du auf einer beliebigen Website bist. Das Popup zeigt den Namen der Website über der Waage: Wähle, wie ihre Ergebnisse bei künftigen Suchen eingestuft werden sollen, und füge unter **Tags** Tags hinzu oder lege neue an. Wenn die Adresse der Website mehrere Teile hat, wie `en.wikipedia.org`, klicke auf den Namen, um zu wählen, wie viel davon deine Wahl abdeckt.

Auf einer Suchseite sagt das Popup stattdessen, was Anubis mit den Ergebnissen getan hat, mit **Ausgeblendete zeigen**, **Mehr Ergebnisse laden** und den Tags der Seite, um nur die Ergebnisse mit einem davon zu zeigen. Auf jeder anderen Seite nimmt **Website hinzufügen** den Namen einer Website und die Einstufung, die sie bekommen soll.

<img src="../../img/popup.png" width="364" alt="Das Symbolleisten-Popup auf wikipedia.org: Das Tag Reference ist unter den Tags der Website ausgewählt und unterstrichen">

## Anubis ausschalten

Der Schalter im Symbolleisten-Popup schaltet Anubis aus, ohne es zu deinstallieren. Sein Symbol wird grau, und Suchseiten bleiben, wie sie sind.

## Tastenkombinationen

- **Alt+Umschalt+O** schaltet Anubis ein oder aus.
- **Alt+Umschalt+H** zeigt die ausgeblendeten Ergebnisse auf der Seite und blendet sie wieder aus.

Auf einem Mac drücke Control statt Alt. Um sie zu ändern, öffne in Chrome `chrome://extensions/shortcuts`, oder öffne in Firefox `about:addons`, klicke auf das Zahnrad und wähle **Tastenkombinationen für Erweiterungen verwalten**. Wenn eine andere Erweiterung bereits eine dieser Tasten verwendet, lässt dein Browser diese Tastenkombination leer, bis du eine andere Taste dafür wählst.

## Hilfe

**Hilfe** im Symbolleisten-Popup öffnet dieses Wiki. In den **Einstellungen** verweist jeder Bereich auf seine Seite hier, und **Wiki** unten in der Seitenleiste öffnet den Anfang.

## Weiter

- [Websites einstufen](./ranking.md): was Abwerten, Aufwerten und Anheften bewirken.
- [Tags](./tags.md): Websites taggen und entscheiden, was Tags bewirken.
- [Listen abonnieren](./lists.md): Listen anderer Leute die Arbeit machen lassen.
- [Bereiche entfernen](./clean-up.md): KI-Antworten und andere Bereiche von Suchseiten nehmen.
