# Troubleshooting

## Anubis does nothing on a search page

- **Is it on?** A grey toolbar icon means Anubis is off. Turn it on with the switch in the toolbar popup.
- **Is the engine on?** Check **Settings → Search engines**.
- **Is it the web results?** Anubis leaves the image, video, news and shopping tabs alone.
- **Is the extension still loaded?** When it's installed from source, Firefox removes it each time it closes. Load it again from `about:debugging`.

## Some results have no tags or ⇅ button

Search engines change their pages without notice, and a new layout can hide results from Anubis. Please [open an issue](https://github.com/Bishop-V/anubis/issues) with:

- the search engine and your country's version of it (for example `google.de`),
- a search that shows the problem,
- a screenshot.

Please don't attach a saved copy of the page. Search pages include your account name, your location and more.

## I can't see the Anubis icon in Chrome

Chrome hides new extensions behind the puzzle-piece icon in the toolbar. Open it and pin Anubis.

## AI answers still show on Google

Check that **Settings → Clean up → AI answers** is on; it starts off. If it is and Google's AI Overview still shows, Google has probably changed how it's built. **Settings → Clean up → Always open the Web tab** removes it for certain in the meantime.

To help fix it, open the browser's console on that results page (<kbd>F12</kbd>, then **Console**), paste this and press <kbd>Enter</kbd>:

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*AI (Overview|Mode)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

It copies the structure around the "AI Overview" label: element names, classes and roles, no text from the page. Paste it into [a new issue](https://github.com/Bishop-V/anubis/issues).

## Google always opens the Web tab

That's **Settings → Clean up → Always open the Web tab**. Choose **All** above the results to see the usual page for one search, or turn the switch off.

## DuckDuckGo moved to noai.duckduckgo.com

That's **Settings → Clean up → AI answers**, which sends DuckDuckGo searches to DuckDuckGo's own version without AI features. Turn it off to stay on `duckduckgo.com`.

## A list won't update or subscribe

- Check that the link opens the list's text in your browser.
- For a list hosted outside GitHub or a gist, Anubis needs permission to read from that site. Subscribe again and choose **Allow** when your browser asks.
- **Settings → Lists** shows the last update error under each list. **Update all** tries again.

## Something was hidden and I don't know why

Open the ⇅ menu on the result. **Why** lists each list or tag behind the decision. Your own ranking beats all of them.
