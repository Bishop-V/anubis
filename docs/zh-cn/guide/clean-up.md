# 移除面板

搜索页面上有许多不是结果的内容：AI 回答、视频面板、“相关问题”。**设置 → 移除面板**会在每次搜索中移除你打开的那些：开关打开表示 Anubis 会移除该部分，关闭则让它留在页面上。

<!-- Maintainer: Simplified Chinese translation of docs/guide/clean-up.md. The screenshots are the English ones, from mock pages. -->

![设置，移除面板](../../img/options-cleanup.png)

| 开关 | 它移除什么 |
| --- | --- |
| **AI 回答** | Google 的“AI 概览”及其“AI 模式”标签页，DuckDuckGo 的 AI 辅助回答及其 Duck.ai 标签页和按钮，Bing 页面顶部的 AI 回答（连同旁边的视频和链接），以及 Brave 的 AI 回答。 |
| **视频面板** | 夹在结果之间的视频和短视频面板，如 Bing 的“Videos of…”。 |
| **相关问题** | 其他人提出的问题列表，带有可展开的回答。 |
| **讨论面板** | 夹在结果之间的论坛帖子面板，如 Google 的“讨论和论坛”和 Brave 的“Discussions”。结果中的论坛页面会保留。 |
| **头条新闻** | 夹在结果之间的新闻面板。 |
| **图片行** | 夹在结果之间的图片行。“图片”标签页仍可正常使用。 |
| **相关搜索** | 其他搜索的列表（通常在页面底部）、Bing 的“Related searches based on your browsing”，以及 Bing 和 Google 在你访问某个结果后返回时，在该结果下方添加的“People also search for”框。指向后面页面的链接会保留。 |
| **其他搜索引擎** | 在另一个搜索引擎上重复你的搜索的一排按钮，如 Brave 的“Find elsewhere”，带有 Google、Bing 和 Mojeek。 |
| **允许广告的请求** | 要求你关闭广告拦截器或允许广告的横幅，如 Startpage 的“Block creepy ads, not private search”及其 **Allow Startpage ads** 按钮。 |

它们一开始全部是关闭的。每个部分顶部的**全部**会一次性打开或关闭该部分的所有开关。

## 移除了什么

结果上方的摘要，或者在有 AI 回答时，AI 回答上方的摘要，会说明移除了什么：“它还移除了一个 AI 回答和一个视频面板。”**显示已隐藏**会把被移除的面板在该页面上找回来，并带有虚线轮廓，方便你区分。

![清理之后的摘要](../../img/cleanup-summary.png)

## 如何找到面板

Anubis 通过面板的标题（“AI Overview”“Videos”“People also ask”）来识别它，而不是通过搜索引擎给它起的内部名称，因为这些名称经常变化。Anubis 只会移除夹在结果之间的面板。Google 结果右侧的侧边面板不受影响，包含结果、搜索框或指向后面页面的链接的任何内容也不受影响。

标题可识别英文和一些常见的翻译（法语、德语、西班牙语、葡萄牙语、意大利语和荷兰语）。如果你所用语言的某个面板没有被移除，请[提交一个 issue](https://github.com/Bishop-V/anubis/issues)，并附上该标题的确切文字。

## 从源头阻止 AI 回答

在搜索引擎发出面板之后再移除它，要依赖对它的识别。Google 有自己不带 AI 的视图，Anubis 可以利用它：

- **Google：** **始终打开“网页”标签页**会打开 Google 自己的“网页”视图（位于**更多 → 网页**下），它只显示纯链接，没有“AI 概览”，也完全没有面板。这是一个单独的开关，因为它会移除所有不是链接的内容，包括你可能想要的面板。若要查看某次搜索的常规页面，请选择结果上方的**全部**。
