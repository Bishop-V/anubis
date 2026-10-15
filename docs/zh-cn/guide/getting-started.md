# 开始使用

::: warning 语言
Anubis 有翻译时，会用你浏览器的语言显示自己。只有英文得到完整支持：阿拉伯语、孟加拉语、中文（简体）、中文（繁体）、法语、德语、印地语、印度尼西亚语、意大利语、日语、韩语、巴西葡萄牙语、俄语、西班牙语、土耳其语、乌尔都语和越南语都是机器翻译，请谨慎使用。若要用英文使用 Anubis，请把浏览器的语言设为英文。[帮助翻译](./translate.md)会进一步说明。
:::

## 在 Firefox 中安装

正常安装请从 [Firefox Add-ons 获取 Anubis](https://addons.mozilla.org/addon/anubis-search/)。最新的 [Firefox 构建包](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-firefox.zip)和带版本号的安装包也可从 [GitHub Releases](https://github.com/Bishop-V/anubis/releases) 获取。

## 在 Android 版 Firefox 中安装

对 Android 版 Firefox 的支持还处于实验阶段。请在手机上的 Firefox 中，从 [Firefox Add-ons 获取 Anubis](https://addons.mozilla.org/addon/anubis-search/)。它能读取 Google、DuckDuckGo 和 Bing 的手机版布局；其他搜索引擎在手机上可能还不能用。在手机上，⚖ 按钮位于每个结果标题的末尾，它的菜单会从屏幕底部升起。Android 版 Firefox 把附加组件放在菜单里，而不是工具栏上，所以请从那里打开 Anubis。如果有什么地方不对，请附上截图[报告问题](https://github.com/Bishop-V/anubis/issues)。

## 在 Chrome 中安装

正常安装请从 [Chrome 应用商店获取 Anubis](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi)。最新的 [Chrome 构建包](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-chrome.zip)也可从 [GitHub Releases](https://github.com/Bishop-V/anubis/releases) 获取。

## 其他浏览器

大多数其他基于 Chromium 的浏览器，如 Brave、Vivaldi 和 Opera，也可以从 [Chrome 应用商店](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi)安装。在 Edge 中，Chrome 应用商店询问时请选择**允许来自其他商店的扩展**，然后在那里安装。Edge Add-ons 中还没有 Anubis。

若要手动加载安装包，请从 GitHub Releases 下载并解压[最新的 Chrome 构建](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-chrome.zip)，或从源代码构建。从源代码构建需要 [Node.js](https://nodejs.org) 22.12 或更高版本：

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox development build
npm run build:chrome   # for Chrome, Edge, and other Chromium browsers
```

在浏览器中加载开发构建或解压后的安装包：

- **Firefox：** 打开 `about:debugging`，选择 **This Firefox**，再选择 **Load Temporary Add-on**，然后选取 `.output/firefox-mv2/manifest.json`。Firefox 关闭时会移除临时附加组件。
- **Chrome：** 打开 `chrome://extensions`，打开**开发者模式**，选择**加载已解压的扩展程序**，然后选取 `.output/chrome-mv3` 或解压后的发布包。
- **Edge：** 打开 `edge://extensions`，打开**开发人员模式**，选择**加载解压缩的扩展**，然后选取 `.output/chrome-mv3` 或解压后的发布包。

安装 Anubis 后，它会打开一个欢迎标签页，里面有让它的按钮留在工具栏上的步骤、一次可以试试的搜索，以及你初始使用的列表。

浏览器会把新扩展放在地址栏旁边的“扩展”按钮（一块拼图）后面。要让 Anubis 的按钮保持可见：

- **Chrome：** 点击拼图图标，再点击 Anubis 旁边的图钉。
- **Edge：** 点击拼图图标，再点击 Anubis 旁边的眼睛。
- **Firefox：** 点击拼图图标，再点击 Anubis 旁边的齿轮，然后选择**固定到工具栏**。

## 像平常一样搜索

在任何[受支持的搜索引擎](./search-engines.md)上搜索。Anubis 初始带有这样一些列表：为官方文档、讨论、参考网站、付费墙、FOSS 在线工具和自托管软件以及 AI 生成的内容加上标签，并把独立 wiki 提升到它们所取代的 Fandom wiki 之上。**AI slop** 标签可供你自己选择要标记的网站使用。

结果上方的一行摘要会说明 Anubis 做了什么：提升、降低或隐藏了哪些结果，以及页面上有哪些标签。在手机上，摘要只用几个词说明（“Anubis 更改了 9 个结果中的 4 个。”），**详情**会显示其余内容。

<!-- Maintainer: the screenshots on this page are the English ones, from mock pages. -->

![结果上方的摘要](../../img/summary.png)

## 隐藏一个网站

把鼠标悬停在一个结果上，点击它右上角的 ⚖ 按钮。在菜单中选择**隐藏**。在手机上，⚖ 按钮位于结果标题的末尾，菜单会从屏幕底部升起。

![结果上的菜单：隐藏、降低、正常、提升和置顶，下方是标签](../../img/menu.png)

这个结果会消失，之后在每次搜索中，来自该网站的所有结果都会消失。结果上方的摘要始终存在，在 Anubis 做出动作之前显示“Anubis 未改动这 10 个结果”。它会统计被隐藏的内容，并显示“已隐藏 fandom.com。”和一个**撤销**按钮，点击后网站会恢复原样。

- 摘要中的**显示已隐藏**会以淡化的样式显示页面上所有已隐藏的结果，直到你再次点击它或搜索其他内容。
- 若要不再隐藏该网站，请把它显示出来，打开它的菜单，选择**正常**。
- 若要在每个已隐藏的结果原来的位置留下一行，请在**设置 → 外观 → 已隐藏的结果**中选择**折叠**：

![“折叠”样式下的已隐藏结果：一行文字和一个“显示”按钮](../../img/hidden.png)

你的选择适用于整个网站，包括它的子域名。菜单顶部的名称决定覆盖网站的多大范围：`en.wikipedia.org`，还是整个 `wikipedia.org`。

## 为你所在的网站排名

在任何网站上，点击工具栏中的 Anubis 图标。弹出窗口会在天平上方显示该网站的名称：选择今后搜索时它的结果该如何排名，并在**标签**下添加或创建标签。当网站地址有多个部分时，如 `en.wikipedia.org`，点击名称即可选择你的选择覆盖它的哪一部分。

在搜索页面上，弹出窗口改为说明 Anubis 对结果做了什么，并提供**显示已隐藏**、**加载更多结果**和该页面的标签，可只显示带有某个标签的结果。在任何其他页面上，**添加网站**接受一个网站的名称和要给它的排名。

<img src="../../img/popup.png" width="364" alt="wikipedia.org 上的工具栏弹出窗口：在该网站的标签中，Reference 标签被选中并带下划线">

## 关闭 Anubis

工具栏弹出窗口中的开关可以在不卸载的情况下关闭 Anubis。它的图标会变灰，搜索页面保持原样。

## 键盘快捷键

- **Alt+Shift+O** 打开或关闭 Anubis。
- **Alt+Shift+H** 显示页面上已隐藏的结果，再按一次则重新隐藏。

在 Mac 上，请按 Control 代替 Alt。若要更改快捷键，请在 Chrome 中打开 `chrome://extensions/shortcuts`；在 Firefox 中打开 `about:addons`，点击齿轮按钮，选择**管理扩展快捷键**。如果其他扩展已经使用了其中某个键，浏览器会让该快捷键保持为空，直到你为它另选一个键。

## 帮助

工具栏弹出窗口中的**帮助**会打开这个 wiki。在**设置**中，每个部分都链接到它在这里的页面，侧边栏底部的 **Wiki** 会打开首页。

## 接下来

- [为网站排名](./ranking.md)：降低、提升和置顶有什么作用。
- [标签](./tags.md)：为网站添加标签，并决定标签的作用。
- [订阅列表](./lists.md)：让别人的列表替你完成工作。
- [移除面板](./clean-up.md)：从搜索页面上移除 AI 回答和其他面板。
