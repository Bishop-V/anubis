# 帮助翻译

::: warning 机器翻译：请谨慎使用
Anubis 以英语编写，英语是它唯一完整支持的语言。下面的语言都是机器翻译，还没有母语者检查过。如果某个翻译让你拿不准，请把浏览器设为英语。
:::

Anubis 使用浏览器的语言。翻译中缺少的消息，或英文原文已经改变的消息，会以英语显示。标签名称保持列表作者写的样子。

## 机器翻译的语言

| 语言 | 文件夹 | 已由母语者检查 |
| --- | --- | --- |
| 阿拉伯语 | `ar` | 尚未 |
| 孟加拉语 | `bn` | 尚未 |
| 中文（简体） | `zh_CN` | 尚未 |
| 中文（繁体） | `zh_TW` | 尚未 |
| 法语 | `fr` | 尚未 |
| 德语 | `de` | 尚未 |
| 印地语 | `hi` | 尚未 |
| 印度尼西亚语 | `id` | 尚未 |
| 意大利语 | `it` | 尚未 |
| 日语 | `ja` | 尚未 |
| 韩语 | `ko` | 尚未 |
| 葡萄牙语（巴西） | `pt_BR` | 尚未 |
| 俄语 | `ru` | 尚未 |
| 西班牙语 | `es` | 尚未 |
| 土耳其语 | `tr` | 尚未 |
| 乌尔都语 | `ur` | 尚未 |
| 越南语 | `vi` | 尚未 |

乌尔都语只在 Firefox 中显示。如果你会说其中一种语言，纠正它是最有帮助的。

## 如何翻译

每种语言都是 [代码仓库](https://github.com/Bishop-V/anubis) 中的一个文件夹 `locales/<code>/`，其中有 `messages.json`。请以拉取请求的形式提交更改。

- **纠正一种语言：** 编辑它的 `messages.json`，然后对每条改过的消息运行 `node scripts/locales.mjs record <code> <key>`。在拉取请求中说明你会说这种语言。
- **添加一种语言：** 把 `public/_locales/en/messages.json` 复制到 `locales/<code>/`（代码如 `de` 或 `pt_BR`），翻译每条 `message`，设置 `langCode`，然后运行 `node scripts/locales.mjs record <code>`。

`node scripts/locales.mjs status` 会列出英文原文已改变的消息。

## 需要保留的内容

- **占位符**，如 `$1`，顺序不限。真正的美元符号写作 `$$`。
- **计数：** 添加你的语言使用的复数形式（`_one`、`_few`、`_other` 等）。
- **名称**：Anubis、搜索引擎和浏览器的名称。对于“People also ask”等搜索引擎面板，请使用搜索引擎在你的语言中显示的名称。
- **每种排名一个词：** 隐藏、降低、正常、提升和置顶。

## 保持英文的内容

发给列表维护者的报告、列表文件，以及 wiki 中面向列表发布者的页面。wiki 的指南也有越南语、德语和中文的机器翻译版本。

## 检查你的翻译

用 `npm run build` 构建（参见 [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)），然后在设为你的语言的浏览器中加载。在较窄的宽度下检查弹出窗口和设置。
