# 简介

Anubis 是一款 Firefox 和 Chrome 扩展，用来改变搜索结果。它会隐藏你不想看到的网站，提升你信任的网站，给结果加上标签，并移除 AI 回答和其他面板。它适用于你平时使用的搜索引擎。

<!-- Maintainer: Simplified Chinese translation of docs/guide/introduction.md. HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page in English. -->

<HideDemo />

<div class="github-only">

![结果页上方的 Anubis：一行摘要说明它隐藏和提升了什么，每个标题下方都有标签](../../img/summary.png)

<p class="caption">在英文测试页面上展示。</p>

</div>

## 功能

- **直接在结果中为任何网站排名。** 用任意结果旁的按钮隐藏、降低、提升或置顶一个网站。[为网站排名](./ranking.md)
- **标签。** 每个标题下方的“Official docs”或“Paywalled”等标签。由你决定每个标签起什么作用。[标签](./tags.md)
- **人人都能发布的列表。** 订阅为你给网站加标签和排名的列表，包括 Brave Goggles 和 uBlacklist 规则集。[订阅列表](./lists.md) 和 [发布列表](./publish-a-list.md)
- **移除面板。** 从每次搜索中去掉 AI 回答、视频面板和“相关问题”。[移除面板](./clean-up.md)
- **不止一页结果。** 把后面的页面拉到第一页，一起排名。[加载更多结果](./more-results.md)
- **同步。** 通过浏览器自带的同步，或借助 WebDAV 服务器在 Firefox 和 Chrome 之间同步。[在多台电脑间同步](./sync.md)
- **带上旧列表。** 从 uBlacklist、HOHSER 或 Brave Goggle 导入。[从其他工具迁移](./import-and-backup.md)
- **轻松撤销。** 结果上方的摘要说明 Anubis 改了什么，“显示已隐藏”可以恢复。

::: warning 语言
Anubis 以英语编写。其他所有语言（包括中文）都是尚未经人检查的机器翻译：请谨慎使用。参见 [帮助翻译](./translate.md)。
:::

Anubis 适用于 Google、DuckDuckGo、Bing、Brave Search、Startpage、Ecosia、Kagi、Yahoo 和 Yandex；Mojeek 为实验性支持。参见 [搜索引擎](./search-engines.md)。

## 名字的由来

在埃及神话中，阿努比斯用一根羽毛称量每一颗心。没有通过称量的网站会被隐藏。

## 现状

Anubis 还很年轻。可以从 [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) 或 [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi) 获取；[GitHub Releases](https://github.com/Bishop-V/anubis/releases) 也提供安装包。参见 [开始使用](./getting-started.md)，如果有什么不对劲，参见 [疑难解答](./troubleshooting.md)。
