# 为网站排名

每个网站都有一个*排名*。可以通过任意结果旁的按钮、工具栏弹出窗口或**设置 → 你的网站**来设置。

<!-- Maintainer: Simplified Chinese translation of docs/guide/ranking.md. RankDemo (docs/.vitepress/theme/rank-demo.ts) draws a site being pinned and another lowered, and the picture below, for reading on GitHub, is hidden. The screenshots are the English ones. -->

<RankDemo />

<div class="github-only">

![一个结果，带有标签，左侧一栏中是它的按钮](../../img/result.png)

</div>

每个结果左侧的按钮显示它的排名，并打开菜单。在图片和视频上，按钮位于右上角；在手机上，则是标题后的 ⚖。

| 排名 | 效果 |
| --- | --- |
| **隐藏** | 隐藏该网站的结果。 |
| **降低** | 下移五位。再点一次下移十位，点第三次取消。 |
| **正常** | 清除你的排名；标签和列表仍然生效。 |
| **提升** | 上移五位。再点一次上移十位，点第三次取消。 |
| **置顶** | 移到最上面。 |

提升和降低会与列表和标签的作用叠加。置顶和隐藏优先于它们。摘要中的**撤销**会撤回你的上一次更改。

## 网站的范围

排名适用于该网站及其子域名。菜单顶部的名称用来选择范围，例如 `en.wikipedia.org` 或整个 `wikipedia.org`。最具体的那个优先。

## 重新排序

Anubis 只会重新排列页面上已有的结果。若要排到后面的页面，请使用 [加载更多结果](./more-results.md)。若要保留搜索引擎的顺序，请关闭**设置 → 外观 → 重新排序结果**。

## 已隐藏的结果

**设置 → 外观 → 已隐藏的结果**决定它们的样子：

- **移除**（默认）：消失，并在摘要中计数。
- **折叠**：一行文字和一个**显示**按钮。
- **淡化**：原地变淡。

## 你的网站

**设置 → 你的网站**列出你排过名的每个网站。可以在那里逐个编辑，或作为文本编辑。这个列表会随浏览器同步，也可以 [发布](./publish-a-list.md)。

![设置，你的网站](../../img/options-sites.png)
