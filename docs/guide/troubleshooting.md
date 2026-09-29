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

On Google, you can also include the structure around each result's title. Open the browser's console on that results page (<kbd>F12</kbd>, then **Console**), paste this and press <kbd>Enter</kbd>:

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

It copies one line per title: whether Anubis found it, where its link goes (without the details), and the element names and classes around it. Paste it into the issue.

Please don't attach a saved copy of the page. Search pages include your account name, your location and more.

## I can't see the Anubis icon in Chrome

Chrome hides new extensions behind the puzzle-piece icon in the toolbar. Open it and pin Anubis.

## AI answers or panels still show

Check that the switch in **Settings → Clean up** is on; they all start off. If it is and an AI answer, a video panel or another panel still shows (or only its heading goes), the search engine has probably changed how it's built. On Google, **Settings → Clean up → Always open the Web tab** removes all of them for certain in the meantime.

To help fix it, open the browser's console on that results page (<kbd>F12</kbd>, then **Console**), paste this and press <kbd>Enter</kbd>:

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

It copies the structure around those panels' headings: element names, classes and roles, no text from the page. Paste it into [a new issue](https://github.com/Bishop-V/anubis/issues).

## Google always opens the Web tab

That's **Settings → Clean up → Always open the Web tab**. Choose **All** above the results to see the usual page for one search, or turn the switch off.

## A list won't update or subscribe

- Check that the link opens the list's text in your browser.
- For a list hosted outside GitHub or a gist, Anubis needs permission to read from that site. Subscribe again and choose **Allow** when your browser asks.
- **Settings → Lists** shows the last update error under each list. **Update all** tries again.

## Something was hidden and I don't know why

Open the ⇅ menu on the result. **Why** lists each list or tag behind the decision. Your own ranking beats all of them. If a list got it wrong, "Wrong? Report it to *list name*" tells the list's maintainers ([Report a mistake in a list](./lists.md#report-a-mistake-in-a-list)).
