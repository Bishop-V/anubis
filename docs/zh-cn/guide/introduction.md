# 简介

Anubis 是一款适用于 Firefox 和 Chrome 的浏览器扩展，会改变搜索结果页面。它会隐藏你永远不想看到的网站，提升你信任的网站，为结果加上标签，让你一眼就能区分它们，还会移除你没有要求的 AI 回答和其他面板。

Anubis 可用于你已在使用的搜索引擎。你的选择和你订阅的列表对每次搜索都有效。

<!-- Maintainer: this is the Simplified Chinese translation of docs/guide/introduction.md. HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page in English. -->

<HideDemo />

<div class="github-only">

![搜索结果页面上方的 Anubis：一行摘要说明隐藏和提升了什么，每个标题下方有标签](../../img/summary.png)

<p class="caption">显示在一个英文测试页面上。</p>

</div>

## 功能

- **直接在结果中为任何网站排名。** 用任意结果上的刻度盘隐藏、降低、提升或置顶一个网站。[为网站排名](./ranking.md)
- **标签。** 结果带有“Official docs”“Discussion”“Paywalled”“AI-generated”或“Independent wiki”之类的标签。每个标签有什么作用由你决定，从只显示标签，到隐藏带有该标签的所有结果。[标签](./tags.md)
- **任何人都能发布的列表。** 订阅能替你标记网站并为其排名的列表。列表是 Git 仓库中的一个文本文件，所以任何人都能发布列表，也能对列表提出修改建议。Brave Goggles、uBlacklist 规则集和纯域名列表无需修改即可使用。有些列表每周根据其他项目的数据生成，例如 HUGE AI Blocklist 和 Indie Wiki Buddy，并会注明来源。[订阅列表](./lists.md)和[发布列表](./publish-a-list.md)
- **移除面板。** 在每次搜索中移除 AI 回答、视频面板、“相关问题”等。[移除面板](./clean-up.md)
- **不止一页结果。** 把后面的页面并入第一页，一起排名，这样你在第 3 页置顶的网站也会升到最前面。[加载更多结果](./more-results.md)
- **同步。** 你的网站和设置通过浏览器自带的同步功能跟着你走，在 Firefox 和 Chrome 之间则通过 WebDAV 服务器同步。[在多台电脑间同步](./sync.md)
- **带上你的旧列表。** 把你在 uBlacklist、HOHSER 或 Brave Goggle 中的网站迁移过来。[从其他工具迁移](./import-and-backup.md)
- **容易撤销。** 结果上方的一行摘要会说明 Anubis 做了哪些更改，“显示已隐藏”会让该页面的一切恢复原样，“撤销”会取消你的上一次更改。

::: warning 语言
Anubis 以英文编写。它也有阿拉伯语、孟加拉语、中文（简体）、中文（繁体）、法语、德语、印地语、印度尼西亚语、意大利语、日语、韩语、巴西葡萄牙语、俄语、西班牙语、土耳其语、乌尔都语和越南语版本，但这些都是机器翻译，尚未经过说这些语言的人检查，也没有得到完整支持：请谨慎使用。[帮助翻译](./translate.md)会进一步说明，以及如何修正这些翻译。
:::

Anubis 支持 Google、DuckDuckGo、Bing、Brave Search、Startpage、Ecosia、Kagi、Yahoo 和 Yandex。Mojeek 还处于实验阶段：它尚未在真实网站上试过。详情见[搜索引擎](./search-engines.md)。

## 名字的由来

在古埃及神话中，阿努比斯（Anubis）会把每一颗心脏和一根羽毛放在天平上称量。这款扩展对搜索结果做同样的事，没通过称量的网站会被隐藏。每个结果上菜单里的天平是对此的致意；其他一切都直截了当地说明它的作用。

## 现状

Anubis 还很年轻，可从 [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) 和 [Chrome 应用商店](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi)获取。Edge Add-ons 尚未上架。带标签的 [GitHub Releases](https://github.com/Bishop-V/anubis/releases) 包含带版本号的安装包，以及指向最新 Firefox 和 Chrome 构建的稳定链接。大多数搜索引擎已在真实页面上检查过，其余的只在按其布局搭建的测试页面上检查过；[搜索引擎](./search-engines.md)会说明是哪些。[开始使用](./getting-started.md)介绍如何安装。如果真实搜索页面上有什么地方不对，请参阅[疑难解答](./troubleshooting.md)。
