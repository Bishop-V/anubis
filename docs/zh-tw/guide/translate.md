# 幫助翻譯

::: warning 機器翻譯：請謹慎使用
Anubis 以英語編寫，英語是它唯一完整支援的語言。下面的語言都是機器翻譯，還沒有母語者檢查過。如果某個翻譯讓你拿不準，請把瀏覽器設為英語。
:::

Anubis 使用瀏覽器的語言。翻譯中缺少的訊息，或英文原文已經改變的訊息，會以英語顯示。標籤名稱保持清單作者寫的樣子。

## 機器翻譯的語言

| 語言 | 資料夾 | 已由母語者檢查 |
| --- | --- | --- |
| 阿拉伯語 | `ar` | 尚未 |
| 孟加拉語 | `bn` | 尚未 |
| 中文（簡體） | `zh_CN` | 尚未 |
| 中文（繁體） | `zh_TW` | 尚未 |
| 法語 | `fr` | 尚未 |
| 德語 | `de` | 尚未 |
| 印地語 | `hi` | 尚未 |
| 印度尼西亞語 | `id` | 尚未 |
| 義大利語 | `it` | 尚未 |
| 日語 | `ja` | 尚未 |
| 韓語 | `ko` | 尚未 |
| 葡萄牙語（巴西） | `pt_BR` | 尚未 |
| 俄語 | `ru` | 尚未 |
| 西班牙語 | `es` | 尚未 |
| 土耳其語 | `tr` | 尚未 |
| 烏爾都語 | `ur` | 尚未 |
| 越南語 | `vi` | 尚未 |

烏爾都語只在 Firefox 中顯示。如果你會說其中一種語言，糾正它是最有幫助的。

## 如何翻譯

每種語言都是 [程式碼倉庫](https://github.com/Bishop-V/anubis) 中的一個資料夾 `locales/<code>/`，其中有 `messages.json`。請以Pull Request的形式提交更改。

- **糾正一種語言：** 編輯它的 `messages.json`，然後對每條改過的訊息執行 `node scripts/locales.mjs record <code> <key>`。在Pull Request中說明你會說這種語言。
- **新增一種語言：** 把 `public/_locales/en/messages.json` 複製到 `locales/<code>/`（程式碼如 `de` 或 `pt_BR`），翻譯每條 `message`，設定 `langCode`，然後執行 `node scripts/locales.mjs record <code>`。

`node scripts/locales.mjs status` 會列出英文原文已改變的訊息。

## 需要保留的內容

- **佔位符**，如 `$1`，順序不限。真正的美元符號寫作 `$$`。
- **計數：** 新增你的語言使用的複數形式（`_one`、`_few`、`_other` 等）。
- **名稱**：Anubis、搜尋引擎和瀏覽器的名稱。對於“People also ask”等搜尋引擎面板，請使用搜尋引擎在你的語言中顯示的名稱。
- **每種排名一個詞：** 隱藏、降低、正常、提升和釘選。

## 保持英文的內容

發給清單維護者的報告、清單檔案，以及 wiki 中面向清單釋出者的頁面。wiki 的指南也有越南語、德語和中文的機器翻譯版本。

## 檢查你的翻譯

用 `npm run build` 構建（參見 [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)），然後在設為你的語言的瀏覽器中載入。在較窄的寬度下檢查彈出視窗和設定。
