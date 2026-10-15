# 疑难解答

## 报告问题

工具栏弹出窗口底部和“设置”侧边栏中的**报告问题**会在 GitHub 上打开一个新的 issue，其中填好了 Anubis 的版本、你的浏览器和你所在的搜索引擎。请说明你做了什么、看到了什么、期望什么，并附上截图。在你提交之前，不会发送任何内容。提交需要 GitHub 账号。

## Anubis 在搜索页面上什么也没做

- **它开着吗？** 工具栏图标是灰色，表示 Anubis 已关闭。请用工具栏弹出窗口中的开关打开它。
- **这个搜索引擎开着吗？** 检查**设置 → 搜索引擎**。
- **是网页结果吗？** Anubis 不会处理图片、视频、新闻和购物标签页。
- **扩展还在加载吗？** 如果是从源代码安装的，Firefox 每次关闭时都会把它移除。请从 `about:debugging` 重新加载它。

## 有些结果没有标签或 ⚖ 按钮

搜索引擎会不经通知地更改页面，新的布局可能让 Anubis 找不到某些结果。请[报告](https://github.com/Bishop-V/anubis/issues)，并附上：

- 搜索引擎，以及你所在国家的版本（例如 `google.de`），
- 一次能显示问题的搜索，
- 一张截图。

在 Google 上，你还可以附上每个结果标题周围的结构。请在该结果页面上打开浏览器的控制台（<kbd>F12</kbd>，然后选择**控制台**），粘贴下面的代码并按 <kbd>Enter</kbd>：

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

它会为每个标题复制一行：Anubis 是否找到了它、它的链接指向哪里（不含细节），以及它周围的元素名称和类名。请把它粘贴到 issue 中。

请不要附上页面的保存副本。搜索页面包含你的账号名称、位置等信息。

## 我在 Chrome 中看不到 Anubis 图标

Chrome 会把新扩展藏在工具栏的拼图图标后面。请打开它，并固定 Anubis。

## AI 回答或面板仍然显示

请检查**设置 → 移除面板**中的开关是否已打开；它们一开始都是关闭的。如果已经打开，而 AI 回答、视频面板或其他面板仍然显示（或只是它的标题消失了），那很可能是搜索引擎更改了它的构建方式。在 Google 上，**设置 → 移除面板 → 始终打开“网页”标签页**在这期间一定能把它们全部移除。

为了帮助修复，请在该结果页面上打开浏览器的控制台（<kbd>F12</kbd>，然后选择**控制台**），粘贴下面的代码并按 <kbd>Enter</kbd>：

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

它会复制这些面板标题周围的结构：元素名称、类名和角色，不包含页面上的任何文字。请把它粘贴到[新的 issue](https://github.com/Bishop-V/anubis/issues) 中。

## 加载更多结果什么也没加载

摘要会在它的第一行下方说明原因，并附有指向 Anubis 尝试过的页面的链接。最常见的情况是搜索引擎想让你确认自己不是机器人：请打开该页面，完成确认，然后再次点击**加载更多结果**。参见[加载更多结果](./more-results.md)。

## Google 总是打开“网页”标签页

这是**设置 → 移除面板 → 始终打开“网页”标签页**。请选择结果上方的**全部**来查看某次搜索的常规页面，或者关闭这个开关。

## 列表无法更新或订阅

- 检查该链接在你的浏览器中能否打开列表的文本。
- 对于托管在 GitHub 或 gist 之外的列表，Anubis 需要读取该网站的权限。请重新订阅，并在浏览器询问时选择**允许**。
- **设置 → 列表**会在每个列表下方显示最近一次的更新错误。**全部更新**会重试。

## 有东西被隐藏了，我不知道为什么

打开结果上的 ⚖ 菜单。**原因**会列出决定背后的每个列表或标签。你自己设的排名优先于列表和你设为隐藏的标签，并叠加到你设为置顶、提升或降低的标签上。如果某个列表弄错了，“有误？报告给 *列表名称*”会告知该列表的维护者（[报告列表中的错误](./lists.md)）。
