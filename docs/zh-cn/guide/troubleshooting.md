# 疑难解答

## 报告问题

弹出窗口和设置侧栏中的**报告问题**会在 GitHub 上打开一个 issue，预先填好你的版本、浏览器和搜索引擎。请补充发生了什么，并附上截图。

## Anubis 在搜索页面上没有任何作用

- 工具栏图标是灰色的吗？在弹出窗口中打开 Anubis。
- **设置 → 搜索引擎**中该搜索引擎是否已开启？
- 在 Firefox 中从源代码构建？每次重启后都要从 `about:debugging` 重新加载。

## 有些结果没有标签或按钮

搜索引擎可能改了页面。请 [报告](https://github.com/Bishop-V/anubis/issues)，附上搜索引擎的域名（如 `google.de`）、一次搜索和截图。不要附上保存的页面：其中包含你的账户信息。

在 Google 上，还请把下面这段粘贴到浏览器控制台（<kbd>F12</kbd>），并附上它复制的内容：

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

## 我在 Chrome 中看不到 Anubis 图标

打开拼图菜单，固定 Anubis。

## AI 回答或面板仍然显示

检查**设置 → 移除面板**中的开关是否已开启；一开始全部关闭。如果已开启，说明搜索引擎改了页面：在 Google 上，可以先用**始终打开“网页”标签页**。若要帮忙修复，请把下面这段粘贴到控制台（<kbd>F12</kbd>），并把它复制的内容附在 [issue](https://github.com/Bishop-V/anubis/issues) 中：

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

## 加载更多结果没有加载任何内容

摘要会说明原因。通常是 [人机验证](./more-results.md)。

## Google 总是打开“网页”标签页

这是**设置 → 移除面板 → 始终打开“网页”标签页**。把它关掉，或在结果上方选择**全部**。

## 列表无法更新或订阅

- 检查链接是否能打开列表的文本。
- 对于 GitHub 以外的列表，浏览器询问时请选择**允许**。
- **设置 → 列表**会显示每个列表最近的错误。**全部更新**会重试。

## 有内容被隐藏了，我不知道为什么

点击**显示已隐藏**，然后打开该结果的菜单：它会说明是哪个列表或标签隐藏了它。如果列表弄错了，请 [报告](./lists.md)。
