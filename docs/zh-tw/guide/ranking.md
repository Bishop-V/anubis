# 為網站排名

每個網站都有一個*排名*。可以透過任意結果旁的按鈕、工具列彈出視窗或**設定 → 你的網站**來設定。

<!-- Maintainer: Traditional Chinese translation of docs/guide/ranking.md. RankDemo (docs/.vitepress/theme/rank-demo.ts) draws a site being pinned and another lowered, and the picture below, for reading on GitHub, is hidden. The screenshots are the English ones. -->

<RankDemo />

<div class="github-only">

![一個結果，帶有標籤，左側一欄中是它的按鈕](../../img/result.png)

</div>

每個結果左側的按鈕顯示它的排名，並開啟選單。在圖片和影片上，按鈕位於右上角；在手機上，則是標題後的 ⚖。

| 排名 | 效果 |
| --- | --- |
| **隱藏** | 隱藏該網站的結果。 |
| **降低** | 下移五位。再點一次下移十位，點第三次取消。 |
| **正常** | 清除你的排名；標籤和清單仍然生效。 |
| **提升** | 上移五位。再點一次上移十位，點第三次取消。 |
| **釘選** | 移到最上面。 |

提升和降低會與清單和標籤的作用疊加。釘選和隱藏優先於它們。摘要中的**復原**會撤回你的上一次更改。

## 網站的範圍

排名適用於該網站及其子域名。選單頂部的名稱用來選擇範圍，例如 `en.wikipedia.org` 或整個 `wikipedia.org`。最具體的那個優先。

## 重新排序

Anubis 只會重新排列頁面上已有的結果。若要排到後面的頁面，請使用 [載入更多結果](./more-results.md)。若要保留搜尋引擎的順序，請關閉**設定 → 外觀 → 重新排序結果**。

## 已隱藏的結果

**設定 → 外觀 → 已隱藏的結果**決定它們的樣子：

- **移除**（預設）：消失，並在摘要中計數。
- **摺疊**：一行文字和一個**顯示**按鈕。
- **淡化**：原地變淡。

## 你的網站

**設定 → 你的網站**列出你排過名的每個網站。可以在那裡逐個編輯，或作為文字編輯。這個清單會隨瀏覽器同步，也可以 [釋出](./publish-a-list.md)。

![設定，你的網站](../../img/options-sites.png)
