# 订阅列表

列表会替你为网站加标签、提升、降低或隐藏它们。任何人都能发布列表：它是 Git 仓库、gist 或任何公开网址上的一个文本文件。中间没有 Anubis 的服务器。

Anubis 初始订阅了随它一起提供的五个小列表：**Official docs**、**Discussions**、**Reference**、**Paywalls** 和 **FOSS tools**。它们主要是添加标签。**FOSS tools** 把 LibreSpeed 和 cobalt.tools 标为 FOSS，并让 **AI slop** 标签可供你自己选择要标记的网站使用。

它还初始带有两个根据其他项目生成的列表（见下方），它们会在安装时下载：**AI content** 和 **Independent wikis**。在这两个列表出现之前安装的 Anubis 副本，会在更新时订阅它们，并一次性重新打开所有初始列表。你可以在**设置 → 列表**中再次关闭其中任何一个。

<!-- Maintainer: Simplified Chinese translation of docs/guide/lists.md. The screenshot is the English one, from the mock Settings page. -->

![设置，列表](../../img/options-lists.png)

## 订阅

- **从目录：** **设置 → 列表 → 更多列表**会显示其他人已发布的列表。点击其中一个的**订阅**。目录会略过你已有的列表，以及与你已有的某个列表来自同一来源的列表。
- **从网页：** [列表目录](../../lists.md)页面（英文）上的 **Subscribe**，或某个列表自己页面上的订阅链接，会打开 Anubis 的设置，并填好该列表。请确认它是你想要的列表，然后在那里点击**订阅**来添加它。
- **通过地址：** 把列表的地址粘贴到**添加列表**中，然后点击**订阅**。指向 GitHub、GitLab 或 Codeberg 上某个文件页面的链接、gist 链接和 Brave Search Goggle 链接都可以；Anubis 会找到原始文件。

托管在 GitHub 或 gist 上的列表会立即下载。对于托管在其他地方的列表，你的浏览器会询问是否允许 Anubis 读取那一个网站。

## 哪些列表可用

- Anubis 列表（`.anubis` 文件）
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- [uBlacklist](https://github.com/iorate/ublacklist) 规则集
- 纯域名列表（每行一个）和 hosts 文件

Anubis 会自己识别格式。它无法使用的规则，如 uBlacklist 的标题表达式，会被跳过，并在设置中列表下方计数。

::: warning 滤镜
有些 Brave Goggle 是*滤镜*：它们会隐藏所有它们没有提到的结果，所以一次搜索只会显示列表上的网站。Anubis 会用“滤镜”标出这些列表，免得你不小心订阅了一个。
:::

## 更新

Anubis 会在浏览器启动时以及你搜索时检查你的列表是否有新版本，最多每 30 分钟一次。每个列表会说明它希望多久被检查一次（通常是每天一次）。**设置 → 列表**中的**全部更新**会立即检查。

## 根据其他项目生成的列表

目录中的一些列表，是根据其他项目收集的数据生成的。每周，Anubis 都会把这些数据转换成列表并发布，所以它在 Anubis 两次发布之间也保持最新。每个列表都会在**设置 → 列表**中注明它的来源并链接到来源。

| 列表 | 生成自 | 它的作用 |
| --- | --- | --- |
| **AI content** | laylavish 的 [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist)（CC0） | 把主要由 AI 生成的文字或图片构成的网站标为 **AI-generated**，把混合了真实作品和 AI 生成作品的网站标为 **Some AI content**。被该屏蔽列表归为内容农场或垃圾内容的网站也会被标为 **AI slop**。除非你为某个标签选择了这样做，否则它绝不会移动或隐藏任何内容。 |
| **Official docs (DevDocs)** | 其贡献者的 [DevDocs](https://github.com/freeCodeCamp/devdocs)（MPL-2.0） | 把 DevDocs 收录的文档网站标为 **Official docs**，并略微提升它们，和 Official docs 列表一样。它涵盖约 210 个网站，其中有 MDN 以及 Python、Rust 和 React 的文档。 |
| **Self-hosted FOSS** | 其贡献者的 [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data)（CC BY-SA 3.0） | 把约 1,000 个可以自己运行的自由软件的网站标为 **FOSS**，与 FOSS tools 列表的标签相同。采用非自由许可证的软件不包括在内。它绝不会移动或隐藏任何内容。 |
| **Independent wikis** | Kevin Payravi 的 [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy)（MIT） | 提升独立 wiki，标为 **Independent wiki**，并降低它们所取代的 Fandom、Fextralife 和 Neoseeker wiki，标为 **Has independent wiki**。 |

若要在这些列表中添加某个网站，或让某个网站被移除，请通过上面的链接向它所来自的项目贡献。Anubis 会原样复制数据，下一次每周更新就会带来这项更改。⚖ 菜单中的**有误？报告**会在该项目的问题跟踪器上打开一个 issue。

若要不再使用其中一个，请像对待任何列表一样取消订阅或关闭它。若要保留某个列表但不要它的某个标记，请在**设置 → 标签**中关闭该标签，或在那里选择它的作用。

## 关闭或取消订阅

**你订阅的列表**中的每个列表都有一个开关，可暂时关闭它，还有一个取消订阅的按钮。取消订阅立即生效，消息旁边有**撤销**按钮，持续几秒钟。你自己设的排名永远优先于任何列表，所以若要就某个网站推翻某个列表，请自己为该网站排名。

## 报告列表中的错误

如果某个列表错误地隐藏、排名或标记了某个网站，请打开结果上的 ⚖ 菜单。在**原因**下，“有误？报告给 *列表名称*”会在该列表的问题跟踪器上打开一个预先填好的 issue，其中有匹配的规则和结果的地址。写明应该改什么，然后提交。在你自己提交之前，不会发送任何内容。

这适用于发布在 GitHub、GitLab 或 Codeberg 仓库中的列表，以及说明了自己的问题跟踪器的列表。若要立即推翻某个列表，请自己为该网站排名；报告则能让列表为所有人得到修正。

## 向列表推荐网站

在你自己为某个网站排过名或加过标签之后，⚖ 菜单会对接受推荐、且尚未提到该网站的列表，提供“推荐给 *列表名称*”。它会在 GitHub、GitLab 或 Codeberg 上打开一个预先填好的 issue，供你检查并提交。在你自己提交之前，不会发送任何内容。
