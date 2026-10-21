# 开始使用

::: warning 语言
如果有对应的翻译，Anubis 会使用浏览器的语言。只有英语得到完整支持；其他语言（包括中文）都是机器翻译，请谨慎使用。[帮助翻译](./translate.md) 有更多说明。
:::

## 在 Firefox 中安装

获取 [Firefox Add-ons 上的 Anubis](https://addons.mozilla.org/addon/anubis-search/)。

## 在 Android 版 Firefox 中安装

实验性支持。在手机上从 [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) 安装，然后从 Firefox 的菜单中打开。Google、DuckDuckGo 和 Bing 可以使用；其他搜索引擎可能还不行。每个结果标题末尾都有一个 ⚖ 按钮。

## 在 Chrome 中安装

获取 [Chrome Web Store 上的 Anubis](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi)。

## 其他浏览器

Brave、Vivaldi、Opera 和 Edge 都从 [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi) 安装。在 Edge 中，请先选择**允许来自其他应用商店的扩展**。

若要手动加载，请从 [GitHub Releases](https://github.com/Bishop-V/anubis/releases) 下载安装包，或使用 [Node.js](https://nodejs.org) 22.12 或更新版本自行构建：

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox
npm run build:chrome   # Chrome、Edge 和其他 Chromium 浏览器
```

- **Firefox：** 在 `about:debugging` 中选择**此 Firefox → 临时载入附加组件**，然后选择 `.output/firefox-mv2/manifest.json`。Firefox 关闭时它会被移除。
- **Chrome 或 Edge：** 在 `chrome://extensions` 或 `edge://extensions` 中打开**开发者模式**，选择**加载已解压的扩展程序**，然后选择 `.output/chrome-mv3` 或解压后的安装包。

Anubis 不需要工具栏按钮也能正常工作。如果想把按钮放在工具栏上，请打开拼图菜单并固定它。

## 照常搜索

在任意 [支持的搜索引擎](./search-engines.md) 上搜索。Anubis 一开始就带有一些列表，为官方文档、讨论、参考网站、付费墙、FOSS 工具和 AI 生成的内容加标签，并把独立 wiki 提升到 Fandom 之上。

结果上方的摘要会说明 Anubis 做了什么。在手机上，**详情**会显示其余内容。

![结果上方的摘要](../../img/summary.png)

## 隐藏一个网站

点击结果左侧的圆形按钮，选择**隐藏**。该网站的每个结果现在都会在每次搜索中被隐藏。摘要中的**撤销**可以恢复。

![结果上的菜单：隐藏、降低、正常、提升和置顶，下方是标签](../../img/menu.png)

- 摘要中的**显示已隐藏**会显示此页面上已隐藏的结果。
- 若要取消隐藏一个网站，请把它显示出来，打开它的菜单，选择**正常**。
- 若要在每个已隐藏的结果处留下一行，请在**设置 → 外观 → 已隐藏的结果**中选择**折叠**。

![“折叠”样式下的已隐藏结果：一行文字和一个“显示”按钮](../../img/hidden.png)

## 为当前网站排名

在任何网站上点击工具栏中的 Anubis 按钮，即可为该网站排名或加标签。在搜索页面上，弹出窗口则会显示 Anubis 做了什么。

<img src="../../img/popup.png" width="364" alt="wikipedia.org 上的工具栏弹出窗口：Reference 标签在网站的标签中被选中并加了下划线">

## 键盘快捷键

- **Alt+Shift+O** 打开或关闭 Anubis。
- **Alt+Shift+H** 显示或重新隐藏已隐藏的结果。

在 Mac 上，用 Control 代替 Alt。可以在 `chrome://extensions/shortcuts` 中修改，或在 Firefox 的 `about:addons` → 齿轮 → **管理扩展快捷键**中修改。

## 下一步

- [为网站排名](./ranking.md)
- [标签](./tags.md)
- [订阅列表](./lists.md)
- [移除面板](./clean-up.md)
