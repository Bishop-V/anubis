# Troubleshooting

If nothing here helps, [report it](#reporting-a-problem).

## Anubis does nothing on a search page

- Is the toolbar icon grey? Turn Anubis on in the popup.
- Is the engine on in **Settings → Search engines**?
- Built from source in Firefox? Load it again from `about:debugging` after each restart.

## Something was hidden and I don't know why

Press **Show hidden**, then open the result's menu: it says which list or tag hid it. If a list got it wrong, [suggest a change](./lists.md#suggest-changes-to-a-list).

## AI answers or panels still show

Check the switch is on in **Settings → Remove panels**; they all start off. If it is, the engine has changed its page. On Google, **Always open the Web tab** works in the meantime.

::: details To help fix it, copy what the page shows
Paste this into the browser console (<kbd>F12</kbd>), and add what it copies to [an issue](https://github.com/Bishop-V/anubis/issues):

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```
:::

## Some results have no tags or button

The engine has probably changed its page. [Report it](#reporting-a-problem) with the engine's domain (like `google.de`), a search, and a screenshot. Don't attach a saved page: it contains your account details.

::: details On Google, also copy what the page shows
Paste this into the console (<kbd>F12</kbd>), and add what it copies to your report:

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```
:::

## Load more results loads nothing

The summary says why. Usually it's a [robot check](./more-results.md#robot-checks).

## A list won't update or subscribe

- Check the link opens the list's text.
- For lists outside GitHub, choose **Allow** when the browser asks.
- **Settings → Lists** shows each list's last error. **Update all** tries again.

## Google always opens the Web tab

That's **Settings → Remove panels → Always open the Web tab**. Turn it off, or choose **All** above the results.

## I can't see the Anubis icon in Chrome

Open the puzzle-piece menu and pin Anubis.

## Reporting a problem

**Report a problem**, in the popup and the Settings sidebar, opens a GitHub issue with your version, browser, and engine filled in. Add what happened and a screenshot.
