# 发布列表

列表是公开代码仓库中的一个文本文件。大家通过 issue 和拉取请求来贡献。

## 1. 编写

从**设置 → 备份 → 下载我的列表**开始，或者自己写一个：

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

给每个加了标签的网站写一条 `#` 注释说明原因。只加标签的列表最友好：订阅者自己决定标签的作用。在合适的地方复用 [已有的标签 ID](../../list-format.md#tags)，ID 一旦发布就不要更改。参见 [列表格式](../../list-format.md)（英文）。

## 2. 放到网上

把它加到 GitHub、GitLab 或 Codeberg 上的公开代码仓库，或一个 gist 中。以 `.anubis` 结尾的文件名更容易识别。

## 3. 分享链接

大家可以把它粘贴到**设置 → 列表 → 添加列表**中，或使用一键 [订阅链接](../../subscribe.md#make-a-subscribe-link)。

## 4. 让大家建议更改

把 `! issues:` 设为你的问题跟踪器。订阅者就会看到**建议更改**按钮，点击后会在那里打开一个填好内容的 issue，用来添加网站或报告错误。

## 5. 加入目录

提交一个拉取请求，把它加到 [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json) 中。参见 [列表目录](../../lists.md)。
