# Fehlerbehebung

## Ein Problem melden

**Problem melden** unten im Symbolleisten-Popup und in der Seitenleiste der Einstellungen öffnet ein neues Issue auf GitHub, in dem die Version von Anubis, dein Browser und die Suchmaschine, auf der du bist, ausgefüllt sind. Sage, was du getan, was du gesehen und was du erwartet hast, und füge einen Screenshot hinzu. Nichts wird gesendet, bevor du es abschickst. Zum Abschicken brauchst du ein GitHub-Konto.

## Anubis tut auf einer Suchseite nichts

- **Ist es an?** Ein graues Symbolleisten-Symbol heißt, dass Anubis aus ist. Schalte es mit dem Schalter im Symbolleisten-Popup ein.
- **Ist die Suchmaschine an?** Prüfe **Einstellungen → Suchmaschinen**.
- **Sind es die Web-Ergebnisse?** Anubis lässt die Tabs für Bilder, Videos, News und Shopping in Ruhe.
- **Ist die Erweiterung noch geladen?** Wenn sie aus dem Quellcode installiert ist, entfernt Firefox sie bei jedem Schließen. Lade sie erneut über `about:debugging`.

## Manche Ergebnisse haben keine Tags oder keine Skala

Suchmaschinen ändern ihre Seiten ohne Vorankündigung, und ein neues Layout kann Ergebnisse vor Anubis verbergen. Bitte [melde es](https://github.com/Bishop-V/anubis/issues) mit:

- der Suchmaschine und der Version deines Landes (zum Beispiel `google.de`),
- einer Suche, die das Problem zeigt,
- einem Screenshot.

Bei Google kannst du auch die Struktur um den Titel jedes Ergebnisses beilegen. Öffne die Konsole des Browsers auf dieser Ergebnisseite (<kbd>F12</kbd>, dann **Konsole**), füge Folgendes ein und drücke <kbd>Enter</kbd>:

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

Es kopiert eine Zeile pro Titel: ob Anubis ihn gefunden hat, wohin sein Link führt (ohne die Details) und die Elementnamen und Klassen darum herum. Füge es in das Issue ein.

Bitte hänge keine gespeicherte Kopie der Seite an. Suchseiten enthalten deinen Kontonamen, deinen Standort und mehr.

## Ich sehe das Anubis-Symbol in Chrome nicht

Chrome versteckt neue Erweiterungen hinter dem Puzzleteil-Symbol in der Symbolleiste. Öffne es und hefte Anubis an.

## KI-Antworten oder Bereiche erscheinen weiterhin

Prüfe, ob der Schalter unter **Einstellungen → Bereiche entfernen** an ist; alle sind anfangs aus. Wenn er an ist und eine KI-Antwort, ein Videobereich oder ein anderer Bereich trotzdem erscheint (oder nur seine Überschrift verschwindet), hat die Suchmaschine vermutlich geändert, wie sie aufgebaut ist. Bei Google entfernt **Einstellungen → Bereiche entfernen → Immer den Tab „Web“ öffnen** in der Zwischenzeit sicher alle.

Um bei der Behebung zu helfen, öffne die Konsole des Browsers auf dieser Ergebnisseite (<kbd>F12</kbd>, dann **Konsole**), füge Folgendes ein und drücke <kbd>Enter</kbd>:

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

Es kopiert die Struktur um die Überschriften dieser Bereiche: Elementnamen, Klassen und Rollen, keinen Text von der Seite. Füge es in [ein neues Issue](https://github.com/Bishop-V/anubis/issues) ein.

## Mehr Ergebnisse laden lädt nichts

Die Zusammenfassung sagt unter ihrer ersten Zeile, warum, mit einem Link zur Seite, die Anubis versucht hat. Meist will die Suchmaschine, dass du bestätigst, kein Roboter zu sein: Öffne die Seite, tu das und klicke erneut auf **Mehr Ergebnisse laden**. Ecosia fragt oft danach. Siehe [Mehr Ergebnisse laden](./more-results.md).

## Google öffnet immer den Tab „Web“

Das ist **Einstellungen → Bereiche entfernen → Immer den Tab „Web“ öffnen**. Wähle **Alle** über den Ergebnissen, um die übliche Seite für eine Suche zu sehen, oder schalte den Schalter aus.

## Eine Liste lässt sich nicht aktualisieren oder abonnieren

- Prüfe, ob der Link in deinem Browser den Text der Liste öffnet.
- Bei einer Liste, die außerhalb von GitHub oder einem Gist liegt, braucht Anubis die Erlaubnis, von dieser Website zu lesen. Abonniere erneut und wähle **Zulassen**, wenn dein Browser fragt.
- **Einstellungen → Listen** zeigt den letzten Update-Fehler unter jeder Liste. **Alle aktualisieren** versucht es erneut.

## Etwas wurde ausgeblendet, und ich weiß nicht, warum

Öffne das Menü des Ergebnisses. **Warum** listet jede Liste oder jedes Tag hinter der Entscheidung auf. Deine eigene Einstufung schlägt die Listen und die Tags, die du auf Ausblenden gesetzt hast, und addiert sich zu den Tags, die du auf Anheften, Aufwerten oder Abwerten gesetzt hast. Wenn eine Liste es falsch gemacht hat, sagt „Falsch? Melde es *Listenname*“ es den Betreuern der Liste ([Einen Fehler in einer Liste melden](./lists.md)).
