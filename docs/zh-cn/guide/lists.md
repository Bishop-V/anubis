# 订阅列表

列表会替你给网站加标签、排名或隐藏网站。任何人都可以把列表作为文本文件发布在网上。

Anubis 一开始就带有这些列表：**Official docs**、**Discussions**、**Reference**、**Paywalls**、**FOSS tools**、**AI content** 和 **Independent wikis**。可以在**设置 → 列表**中关闭任意一个。

<!-- Maintainer: Simplified Chinese translation of docs/guide/lists.md. The screenshots are the English ones. -->

![设置，列表](../../img/options-lists.png)

## 订阅

- **设置 → 列表 → 更多列表**，然后点击**订阅**。
- 或在 [列表目录](../../lists.md) 或列表自己的页面上点击**订阅**。
- 或把它的地址粘贴到**添加列表**中。GitHub、GitLab、Codeberg、gist 和 Goggle 链接都可以。

托管在 GitHub 以外的列表会请求读取该网站的权限。

## 哪些列表可用

- Anubis 列表（`.anubis`）
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- [uBlacklist](https://github.com/iorate/ublacklist) 规则集
- 普通域名列表和 hosts 文件

Anubis 无法使用的规则会被跳过并计数。

::: warning 滤镜
有些 Goggle 是*滤镜*：它们会隐藏所有未列出的网站。Anubis 会给它们标上“lens”。
:::

## 更新

列表大约每天更新一次。**设置 → 列表**中的**全部更新**会立即检查。

## 来自其他项目的列表

这些列表每周根据其他项目的数据重新生成。若要修改，请向它的来源贡献。

| 列表 | 来源 | 作用 |
| --- | --- | --- |
| **AI content** | laylavish 的 [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist)（CC0） | 给 AI 生成的网站加标签。 |
| **Official docs (DevDocs)** | [DevDocs](https://github.com/freeCodeCamp/devdocs) 及其贡献者（MPL-2.0） | 给约 210 个文档网站加标签并略微提升。 |
| **Self-hosted FOSS** | [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) 及其贡献者（CC BY-SA 3.0） | 给约 1,000 个可自托管的程序加上 FOSS 标签。 |
| **Independent wikis** | Kevin Payravi 的 [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy)（MIT） | 提升独立 wiki，降低被它们取代的 Fandom wiki。 |

## 关闭或取消订阅

每个列表都有一个开关和一个取消订阅按钮。若要在某个网站上推翻列表，请自己给该网站排名。

## 报告列表中的错误

结果的菜单会列出决定其排名的列表。点击**设置 → 列表**中列表旁的**建议更改**，告诉它的维护者。

## 向列表推荐网站

使用**设置 → 列表**中列表旁的**建议更改**。
