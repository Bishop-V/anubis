# 開始使用

::: warning 語言
Anubis 有翻譯時，會用你瀏覽器的語言顯示自己。只有英文得到完整支援：阿拉伯語、孟加拉語、中文（簡體）、中文（繁體）、法語、德語、印地語、印尼語、義大利語、日語、韓語、巴西葡萄牙語、俄語、西班牙語、土耳其語、烏爾都語和越南語都是機器翻譯，請謹慎使用。若要用英文使用 Anubis，請把瀏覽器的語言設為英文。[幫助翻譯](./translate.md)會進一步說明。
:::

## 在 Firefox 中安裝

正常安裝請從 [Firefox Add-ons 獲取 Anubis](https://addons.mozilla.org/addon/anubis-search/)。最新的 [Firefox 構建包](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-firefox.zip)和帶版本號的安裝包也可從 [GitHub Releases](https://github.com/Bishop-V/anubis/releases) 獲取。

## 在 Android 版 Firefox 中安裝

對 Android 版 Firefox 的支援還處於實驗階段。請在手機上的 Firefox 中，從 [Firefox Add-ons 獲取 Anubis](https://addons.mozilla.org/addon/anubis-search/)。它能讀取 Google、DuckDuckGo 和 Bing 的手機版佈局；其他搜尋引擎在手機上可能還不能用。在手機上，每個結果的標題末尾都有一個 ⚖ 按鈕，它的選單會從螢幕底部升起。Android 版 Firefox 把附加元件放在選單裡，而不是工具列上，所以請從那裡開啟 Anubis。如果有什麼地方不對，請附上截圖[報告問題](https://github.com/Bishop-V/anubis/issues)。

## 在 Chrome 中安裝

正常安裝請從 [Chrome 應用商店獲取 Anubis](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi)。最新的 [Chrome 構建包](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-chrome.zip)也可從 [GitHub Releases](https://github.com/Bishop-V/anubis/releases) 獲取。

## 其他瀏覽器

大多數其他基於 Chromium 的瀏覽器，如 Brave、Vivaldi 和 Opera，也可以從 [Chrome 應用商店](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi)安裝。在 Edge 中，Chrome 應用商店詢問時請選擇**允許來自其他商店的擴充功能**，然後在那裡安裝。Edge Add-ons 中還沒有 Anubis。

若要手動載入安裝包，請從 GitHub Releases 下載並解壓[最新的 Chrome 構建](https://github.com/Bishop-V/anubis/releases/latest/download/anubis-chrome.zip)，或從原始碼構建。從原始碼構建需要 [Node.js](https://nodejs.org) 22.12 或更高版本：

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox development build
npm run build:chrome   # for Chrome, Edge, and other Chromium browsers
```

在瀏覽器中載入開發構建或解壓後的安裝包：

- **Firefox：** 開啟 `about:debugging`，選擇 **This Firefox**，再選擇 **Load Temporary Add-on**，然後選取 `.output/firefox-mv2/manifest.json`。Firefox 關閉時會移除臨時附加元件。
- **Chrome：** 開啟 `chrome://extensions`，開啟**開發人員模式**，選擇**載入未封裝項目**，然後選取 `.output/chrome-mv3` 或解壓後的發布包。
- **Edge：** 開啟 `edge://extensions`，開啟**開發人員模式**，選擇**載入解壓縮的擴充功能**，然後選取 `.output/chrome-mv3` 或解壓後的發布包。

安裝 Anubis 後，它會開啟一個歡迎分頁，裡面有讓它的按鈕留在工具列上的步驟、一次可以試試的搜尋，以及你初始使用的清單。

瀏覽器會把新擴充功能放在位址列旁邊的“擴充功能”按鈕（一塊拼圖）後面。要讓 Anubis 的按鈕保持可見：

- **Chrome：** 點選拼圖圖示，再點選 Anubis 旁邊的圖釘。
- **Edge：** 點選拼圖圖示，再點選 Anubis 旁邊的眼睛。
- **Firefox：** 點選拼圖圖示，再點選 Anubis 旁邊的齒輪，然後選擇**固定至工具列**。

## 像平常一樣搜尋

在任何[受支援的搜尋引擎](./search-engines.md)上搜尋。Anubis 初始帶有這樣一些清單：為官方文件、討論、參考網站、付費牆、FOSS 線上工具和自託管軟體以及 AI 生成的內容加上標籤，並把獨立 wiki 提升到它們所取代的 Fandom wiki 之上。**AI slop** 標籤可供你自己選擇要標記的網站使用。

結果上方的一行摘要會說明 Anubis 做了什麼：提升、降低或隱藏了哪些結果，以及頁面上有哪些標籤。在手機上，摘要只用幾個詞說明（“Anubis 更改了 9 個結果中的 4 個。”），**詳情**會顯示其餘內容。

<!-- Maintainer: the screenshots on this page are the English ones, from mock pages. -->

![結果上方的摘要](../../img/summary.png)

## 隱藏一個網站

每個結果的網站圖示周圍都有一個刻度盤：一個半圓，左側有一頂小皇冠。點選皇冠，然後在選單中選擇**隱藏**。在圖片和影片結果上，皇冠位於圖片的右上角。在手機上，請點選結果標題末尾的 ⚖ 按鈕，選單會從螢幕底部升起。

![結果上的選單：隱藏、降低、正常、提升和釘選，下方是標籤](../../img/menu.png)

這個結果會消失，之後在每次搜尋中，來自該網站的所有結果都會消失。結果上方的摘要始終存在，在 Anubis 做出動作之前顯示“Anubis 未改動這 10 個結果”。它會統計被隱藏的內容，並顯示“已隱藏 fandom.com。”和一個**復原**按鈕，點選後網站會還原原樣。

- 摘要中的**顯示已隱藏**會以淡化的樣式顯示頁面上所有已隱藏的結果，直到你再次點選它或搜尋其他內容。
- 若要不再隱藏該網站，請把它顯示出來，開啟它的選單，選擇**正常**。
- 若要在每個已隱藏的結果原來的位置留下一行，請在**設定 → 外觀 → 已隱藏的結果**中選擇**摺疊**：

![“摺疊”樣式下的已隱藏結果：一行文字和一個“顯示”按鈕](../../img/hidden.png)

你的選擇適用於整個網站，包括它的子網域。選單頂部的名稱決定覆蓋網站的多大範圍：`en.wikipedia.org`，還是整個 `wikipedia.org`。

## 為你所在的網站排名

在任何網站上，點選工具列中的 Anubis 圖示。彈出視窗會在天平上方顯示該網站的名稱：選擇今後搜尋時它的結果該如何排名，並在**標籤**下新增或建立標籤。當網站地址有多個部分時，如 `en.wikipedia.org`，點選名稱即可選擇你的選擇覆蓋它的哪一部分。

在搜尋頁面上，彈出視窗改為說明 Anubis 對結果做了什麼，並提供**顯示已隱藏**、**載入更多結果**和該頁面的標籤，可只顯示帶有某個標籤的結果。在任何其他頁面上，**新增網站**接受一個網站的名稱和要給它的排名。

<img src="../../img/popup.png" width="364" alt="wikipedia.org 上的工具列彈出視窗：在該網站的標籤中，Reference 標籤被選中並帶底線">

## 關閉 Anubis

工具列彈出視窗中的開關可以在不解除安裝的情況下關閉 Anubis。它的圖示會變灰，搜尋頁面保持原樣。

## 鍵盤快速鍵

- **Alt+Shift+O** 開啟或關閉 Anubis。
- **Alt+Shift+H** 顯示頁面上已隱藏的結果，再按一次則重新隱藏。

在 Mac 上，請按 Control 代替 Alt。若要更改快速鍵，請在 Chrome 中開啟 `chrome://extensions/shortcuts`；在 Firefox 中開啟 `about:addons`，點選齒輪按鈕，選擇**管理擴充功能快速鍵**。如果其他擴充功能已經使用了其中某個鍵，瀏覽器會讓該快速鍵保持為空，直到你為它另選一個鍵。

## 幫助

工具列彈出視窗中的**說明**會開啟這個 wiki。在**設定**中，每個部分都連結到它在這裡的頁面，側邊欄底部的 **Wiki** 會開啟首頁。

## 接下來

- [為網站排名](./ranking.md)：降低、提升和釘選有什麼作用。
- [標籤](./tags.md)：為網站新增標籤，並決定標籤的作用。
- [訂閱清單](./lists.md)：讓別人的清單替你完成工作。
- [移除面板](./clean-up.md)：從搜尋頁面上移除 AI 回答和其他面板。
