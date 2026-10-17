# Einführung

Anubis ist eine Browser-Erweiterung für Firefox und Chrome, die Seiten mit Suchergebnissen verändert. Sie blendet Websites aus, die du nie sehen willst, wertet die auf, denen du vertraust, versieht Ergebnisse mit Tags, damit du sie auf einen Blick unterscheiden kannst, und entfernt KI-Antworten und andere Bereiche, um die du nicht gebeten hast.

Anubis funktioniert mit der Suchmaschine, die du ohnehin benutzt. Deine Entscheidungen und die Listen, die du abonniert hast, gelten für jede Suche.

<!-- Maintainer: this is the German translation of docs/guide/introduction.md. HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page in English. -->

<HideDemo />

<div class="github-only">

![Anubis über einer Seite mit Ergebnissen: eine einzeilige Zusammenfassung, was ausgeblendet und aufgewertet wurde, und Tags unter jedem Titel](../../img/summary.png)

<p class="caption">Gezeigt auf einer englischen Testseite.</p>

</div>

## Funktionen

- **Jede Website direkt im Ergebnis einstufen.** Blende eine Website mit der Skala an einem beliebigen Ergebnis aus, werte sie ab oder auf, oder hefte sie an. [Websites einstufen](./ranking.md)
- **Tags.** Ergebnisse tragen Beschriftungen wie „Official docs“, „Discussion“, „Paywalled“, „AI-generated“ oder „Independent wiki“. Du entscheidest, was jedes Tag bewirkt, von bloßer Beschriftung bis zum Ausblenden aller Ergebnisse mit diesem Tag. [Tags](./tags.md)
- **Listen, die jeder veröffentlichen kann.** Abonniere Listen, die Websites für dich mit Tags versehen und einstufen. Eine Liste ist eine Textdatei in einem Git-Repository, also kann jeder eine veröffentlichen und Änderungen daran vorschlagen. Brave Goggles, uBlacklist-Regelsätze und einfache Domainlisten funktionieren unverändert. Einige Listen entstehen jede Woche aus den Daten anderer Projekte, etwa der HUGE AI Blocklist und Indie Wiki Buddy, und nennen diese als Quelle. [Listen abonnieren](./lists.md) und [Eine Liste veröffentlichen](./publish-a-list.md)
- **Bereiche entfernen.** Nimm KI-Antworten, Videobereiche, „Ähnliche Fragen“ und mehr aus jeder Suche. [Bereiche entfernen](./clean-up.md)
- **Mehr als eine Ergebnisseite.** Hole die nächsten Seiten auf die erste und stufe sie gemeinsam ein, damit eine Website, die du auf Seite 3 angeheftet hast, nach oben rückt. [Mehr Ergebnisse laden](./more-results.md)
- **Synchronisierung.** Deine Websites und Einstellungen folgen dir über die Synchronisierung deines Browsers und zwischen Firefox und Chrome über einen WebDAV-Server. [Zwischen Computern synchronisieren](./sync.md)
- **Alte Listen mitnehmen.** Hole deine Websites aus uBlacklist, HOHSER oder einem Brave Goggle herüber. [Von anderen Werkzeugen umziehen](./import-and-backup.md)
- **Leicht rückgängig zu machen.** Eine einzeilige Zusammenfassung über den Ergebnissen sagt, was Anubis geändert hat, „Ausgeblendete zeigen“ bringt auf dieser Seite alles zurück, und „Rückgängig“ nimmt deine letzte Änderung zurück.

::: warning Sprachen
Anubis ist auf Englisch geschrieben. Es gibt auch Übersetzungen ins Arabische, Bengalische, Chinesische (vereinfacht), Chinesische (traditionell), Französische, Deutsche, Hindi, Indonesische, Italienische, Japanische, Koreanische, Brasilianisch-Portugiesische, Russische, Spanische, Türkische, Urdu und Vietnamesische, aber das sind maschinelle Übersetzungen, die noch keine Muttersprachler geprüft haben und die nicht vollständig unterstützt werden: Verwende sie mit Vorsicht. [Bei der Übersetzung helfen](./translate.md) sagt mehr dazu und wie du sie korrigierst.
:::

Anubis funktioniert mit Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo und Yandex. Mojeek ist experimentell: Es wurde noch nicht auf der echten Website ausprobiert. Details stehen unter [Suchmaschinen](./search-engines.md).

## Woher der Name kommt

In der ägyptischen Mythologie wog Anubis jedes Herz gegen eine Feder auf. Diese Erweiterung tut das Gleiche mit Suchergebnissen, und Websites, die die Wägung nicht bestehen, werden ausgeblendet. Die Waage im Menü an jedem Ergebnis ist eine Anspielung darauf; alles andere sagt klar, was es tut.

## Stand

Anubis ist jung und erhältlich bei [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) und im [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). In Edge Add-ons ist es noch nicht gelistet. Mit Tags versehene [GitHub Releases](https://github.com/Bishop-V/anubis/releases) enthalten Pakete mit Versionsnummer und stabile Links zu den neuesten Firefox- und Chrome-Builds. Die meisten Suchmaschinen wurden auf ihren echten Seiten geprüft, die übrigen nur auf Testseiten, die ihrem Layout nachgebaut sind; [Suchmaschinen](./search-engines.md) sagt, welche. [Erste Schritte](./getting-started.md) erklärt die Installation. Wenn auf einer echten Suchseite etwas falsch aussieht, siehe [Fehlerbehebung](./troubleshooting.md).
