# Fehlerbehebung

## Ein Problem melden

**Problem melden**, im Pop-up und in der Seitenleiste der Einstellungen, öffnet ein Issue auf GitHub mit deiner Version, deinem Browser und deiner Suchmaschine. Ergänze, was passiert ist, und einen Screenshot.

## Anubis tut nichts auf einer Suchseite

- Ist das Symbol in der Symbolleiste grau? Schalte Anubis im Pop-up ein.
- Ist die Suchmaschine unter **Einstellungen → Suchmaschinen** an?
- Aus dem Quellcode gebaut in Firefox? Lade es nach jedem Neustart wieder über `about:debugging`.

## Manche Ergebnisse haben keine Tags oder Schaltfläche

Die Suchmaschine hat wahrscheinlich ihre Seite geändert. [Melde es](https://github.com/Bishop-V/anubis/issues) mit der Domain der Suchmaschine (etwa `google.de`), einer Suche und einem Screenshot. Häng keine gespeicherte Seite an: Sie enthält deine Kontodaten.

Füge bei Google außerdem dies in die Konsole des Browsers ein (<kbd>F12</kbd>) und ergänze, was es kopiert:

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

## Ich sehe das Symbol von Anubis in Chrome nicht

Öffne das Puzzleteil-Menü und hefte Anubis an.

## KI-Antworten oder Bereiche werden noch angezeigt

Prüfe, ob der Schalter unter **Einstellungen → Bereiche entfernen** an ist; alle sind anfangs aus. Wenn ja, hat die Suchmaschine ihre Seite geändert: Bei Google hilft solange **Immer den Tab „Web“ öffnen**. Um bei der Behebung zu helfen, füge dies in die Konsole ein (<kbd>F12</kbd>) und ergänze, was es kopiert, in [einem Issue](https://github.com/Bishop-V/anubis/issues):

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

## Mehr Ergebnisse laden lädt nichts

Die Zusammenfassung sagt, warum. Meist ist es eine [Roboterprüfung](./more-results.md).

## Google öffnet immer den Tab „Web“

Das ist **Einstellungen → Bereiche entfernen → Immer den Tab „Web“ öffnen**. Schalte es aus, oder wähle **Alle** über den Ergebnissen.

## Eine Liste lässt sich nicht aktualisieren oder abonnieren

- Prüfe, ob der Link den Text der Liste öffnet.
- Wähle bei Listen außerhalb von GitHub **Erlauben**, wenn der Browser fragt.
- **Einstellungen → Listen** zeigt den letzten Fehler jeder Liste. **Alle aktualisieren** versucht es erneut.

## Etwas wurde ausgeblendet, und ich weiß nicht, warum

Drücke **Ausgeblendete zeigen** und öffne dann das Menü des Ergebnisses: Es sagt, welche Liste oder welches Tag es ausgeblendet hat. Wenn eine Liste sich irrt, [melde es](./lists.md).
