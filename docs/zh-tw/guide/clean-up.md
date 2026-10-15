# 移除面板

搜尋頁面上有許多不是結果的內容：AI 回答、影片面板、“相關問題”。**設定 → 移除面板**會在每次搜尋中移除你開啟的那些：開關開啟表示 Anubis 會移除該部分，關閉則讓它留在頁面上。

<!-- Maintainer: Simplified Chinese translation of docs/guide/clean-up.md. The screenshots are the English ones, from mock pages. -->

![設定，移除面板](../../img/options-cleanup.png)

| 開關 | 它移除什麼 |
| --- | --- |
| **AI 回答** | Google 的“AI 總覽”及其“AI 模式”分頁，DuckDuckGo 的 AI 輔助回答及其 Duck.ai 分頁和按鈕，Bing 頁面頂部的 AI 回答（連同旁邊的影片和連結），以及 Brave 的 AI 回答。 |
| **影片面板** | 夾在結果之間的影片和短影片面板，如 Bing 的“Videos of…”。 |
| **相關問題** | 其他人提出的問題清單，帶有可展開的回答。 |
| **討論面板** | 夾在結果之間的論壇帖子面板，如 Google 的“討論和論壇”和 Brave 的“Discussions”。結果中的論壇頁面會保留。 |
| **焦點新聞** | 夾在結果之間的新聞面板。 |
| **圖片行** | 夾在結果之間的圖片行。“圖片”分頁仍可正常使用。 |
| **相關搜尋** | 其他搜尋的清單（通常在頁面底部）、Bing 的“Related searches based on your browsing”，以及 Bing 和 Google 在你存取某個結果後返回時，在該結果下方新增的“People also search for”框。指向後面頁面的連結會保留。 |
| **其他搜尋引擎** | 在另一個搜尋引擎上重複你的搜尋的一排按鈕，如 Brave 的“Find elsewhere”，帶有 Google、Bing 和 Mojeek。 |
| **允許廣告的請求** | 要求你關閉廣告攔截器或允許廣告的橫幅，如 Startpage 的“Block creepy ads, not private search”及其 **Allow Startpage ads** 按鈕。 |

它們一開始全部是關閉的。每個部分頂部的**全部**會一次性開啟或關閉該部分的所有開關。

## 移除了什麼

結果上方的摘要，或者在有 AI 回答時，AI 回答上方的摘要，會說明移除了什麼：“它還移除了一個 AI 回答和一個影片面板。”**顯示已隱藏**會把被移除的面板在該頁面上找回來，並帶有虛線輪廓，方便你區分。

![清理之後的摘要](../../img/cleanup-summary.png)

## 如何找到面板

Anubis 透過面板的標題（“AI Overview”“Videos”“People also ask”）來識別它，而不是透過搜尋引擎給它起的內部名稱，因為這些名稱經常變化。Anubis 只會移除夾在結果之間的面板。Google 結果右側的側邊面板不受影響，包含結果、搜尋框或指向後面頁面的連結的任何內容也不受影響。

標題可識別英文和一些常見的翻譯（法語、德語、西班牙語、葡萄牙語、義大利語和荷蘭語）。如果你所用語言的某個面板沒有被移除，請[提交一個 issue](https://github.com/Bishop-V/anubis/issues)，並附上該標題的確切文字。

## 從源頭阻止 AI 回答

在搜尋引擎發出面板之後再移除它，要依賴對它的識別。Google 有自己不帶 AI 的檢視，Anubis 可以利用它：

- **Google：** **始終開啟“網頁”分頁**會開啟 Google 自己的“網頁”檢視（位於**更多 → 網頁**下），它只顯示純連結，沒有“AI 總覽”，也完全沒有面板。這是一個單獨的開關，因為它會移除所有不是連結的內容，包括你可能想要的面板。若要檢視某次搜尋的常規頁面，請選擇結果上方的**全部**。
