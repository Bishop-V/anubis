# 发布列表

列表是一个任何人都能订阅的文本文件。你不需要服务器，也不需要 Anubis 的账号：一个公开的 Git 仓库就是数据库，issue 和 pull request 就是别人参与贡献的方式。

## 1. 编写列表

最快的开始方式是用你自己的列表。**设置 → 备份 → 下载我的列表**会保存你排过名和加过标签的每个网站。或者从头写一个：

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

标题部分之后的每一行都是一条指令：针对哪些网站，以及对它们做什么。请为你添加的每条网站标签规则加上一条简短的 `#` 注释，说明这个网站为什么合适。[列表格式](../../list-format.md)（英文）有详细说明。

只加标签、把排名留给每位订阅者自己决定的列表，是最容易发布的：订阅者可以在**设置 → 标签**中决定你的标签是提升、高亮还是隐藏。

如果其他列表已有合适的标签 ID，请重复使用，这样订阅者看到的就是一个标签，而不是两个含义相同的标签；[列表格式](../../list-format.md#tags)列出了 Anubis 的列表所使用的那些。发布之后，请保持每个 ID 不变：若要重命名标签，请更改它的显示名称。

## 2. 放到网上

在 GitHub、GitLab 或 Codeberg 上创建一个公开仓库，或者创建一个 gist，然后添加这个文件。任何文件名都可以；以 `.anubis` 结尾有助于人们认出它。

## 3. 分享链接

人们会把链接粘贴到**设置 → 列表 → 添加列表**中。指向文件页面的链接也可以；Anubis 会找到原始文件。GitHub 和 gist 上的列表无需额外权限即可下载。

若想一键订阅，请改为分享[订阅链接](../../subscribe.md#make-a-subscribe-link)：它会打开 Anubis 的设置，并填好你的列表。

## 4. 了解错误，并让人们推荐网站

当你的列表把某个网站弄错时，订阅者可以在该结果的菜单中选择“有误？报告给 *你的列表*”。它会在你的仓库的问题跟踪器上打开一个预先填好的 issue，其中有匹配的规则和结果的地址，供他们发送。对于 GitHub、GitLab 或 Codeberg 上的列表，这无需任何设置。

把 `! issues:` 设为你的问题跟踪器，订阅者还可以推荐网站：“推荐给 *你的列表*”随后会出现在你的列表没有提到的结果的菜单中。报告也会发到 `! issues:`，所以如果你的仓库自己的 issue 已关闭，请设置它。Pull request 的用法和任何仓库一样。

## 5. 加入目录

若要让你的列表出现在每个人的**设置 → 列表 → 更多列表**中，请提交一个 pull request，把它添加到 [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json)。[列表目录](../../lists.md)页面（英文）会显示目前有什么。
