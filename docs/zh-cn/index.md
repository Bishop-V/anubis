---
layout: home
title: Anubis
titleTemplate: 隐藏、排名和标记搜索结果

# The homepage is drawn by docs/.vitepress/theme/home.ts from what's below, like the
# English one (docs/index.md). This is its Simplified Chinese translation.
intro:
  title: 隐藏、排名和标记搜索结果
  lead: 就在你已在使用的搜索引擎上，还有任何人都能发布的列表。
  actions:
    - text: 开始使用
      link: /zh-cn/guide/getting-started
      brand: true
    - text: 浏览列表
      link: /lists

highlightsLabel: Anubis 还能做什么

# The scroll-driven demo's words (docs/.vitepress/theme/scroll-demo.ts); its mock search page stays in English.
demo:
  cue: 向下滚动，看 Anubis 如何整理这次搜索
  label: Anubis 如何处理一次搜索
  steps:
    - title: 清除杂乱内容
      text: Anubis 会移除 AI 回答、问题列表以及夹在中间的各种面板。哪些要移除，由你决定。
    - title: 不想再看到某个网站？
      text: 用任意结果旁边的天平把它隐藏。此后它不会再出现在任何搜索中，“显示已隐藏”可以把它找回来。
    - title: 你信任的网站排在前面
      text: 置顶或提升你信任的网站，降低那些你勉强接受的网站。天平会倾斜，显示每个网站所处的位置。
    - title: 点击之前先心中有数
      text: 来自列表的标签会标出参考资料网站、付费墙等。摘要会说明发生了哪些变化，“显示已隐藏”可以撤销这些变化。

highlights:
  - title: 直接在结果中为任何网站排名
    details: 用任意结果旁边的按钮隐藏、降低、提升或置顶一个网站。你的选择对每次搜索都有效。
    link: /zh-cn/guide/ranking
    linkText: 排名如何运作
  - title: 可以由你决定作用的标签
    details: 结果带有“Official docs”或“Paywalled”之类的标签。每个标签有什么作用由你决定，从只显示标签，到隐藏带有该标签的所有结果。
    link: /zh-cn/guide/tags
    linkText: 关于标签
  - title: 任何人都能发布的列表
    details: 列表是 Git 仓库中的一个文本文件。Brave Goggles 和 uBlacklist 规则集无需修改即可使用。
    link: /zh-cn/guide/lists
    linkText: 订阅列表
  - title: 移除面板
    details: 在每次搜索中移除 AI 回答、视频面板和“相关问题”。移除哪些，由你选择。
    link: /zh-cn/guide/clean-up
    linkText: 它会移除什么

closing:
  title: 无需注册
  details:
    - Anubis 没有服务器，也不收集任何内容。你的选择保存在你的浏览器中，除非你连接自己的存储服务器，在浏览器之间同步。
    - "Anubis 支持 Google、DuckDuckGo、Bing、Brave Search、Startpage、Ecosia、Kagi、Yahoo 和 Yandex，可用于 Firefox 和 Chrome。Mojeek 和 Edge 还处于实验阶段：它们尚未在真实网站或浏览器中试过。"
  link: /zh-cn/guide/privacy
  linkText: 隐私与权限
---
