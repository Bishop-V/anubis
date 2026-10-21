# 開始使用

::: warning 語言
如果有對應的翻譯，Anubis 會使用瀏覽器的語言。只有英語得到完整支援；其他語言（包括中文）都是機器翻譯，請謹慎使用。[幫助翻譯](./translate.md) 有更多說明。
:::

## 在 Firefox 中安裝

獲取 [Firefox Add-ons 上的 Anubis](https://addons.mozilla.org/addon/anubis-search/)。

## 在 Android 版 Firefox 中安裝

實驗性支援。在手機上從 [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) 安裝，然後從 Firefox 的選單中開啟。Google、DuckDuckGo 和 Bing 可以使用；其他搜尋引擎可能還不行。每個結果標題末尾都有一個 ⚖ 按鈕。

## 在 Chrome 中安裝

獲取 [Chrome Web Store 上的 Anubis](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi)。

## 其他瀏覽器

Brave、Vivaldi、Opera 和 Edge 都從 [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi) 安裝。在 Edge 中，請先選擇**允許來自其他應用商店的擴充套件**。

若要手動載入，請從 [GitHub Releases](https://github.com/Bishop-V/anubis/releases) 下載安裝包，或使用 [Node.js](https://nodejs.org) 22.12 或更新版本自行構建：

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox
npm run build:chrome   # Chrome、Edge 和其他 Chromium 浏览器
```

- **Firefox：** 在 `about:debugging` 中選擇**此 Firefox → 臨時載入附加元件**，然後選擇 `.output/firefox-mv2/manifest.json`。Firefox 關閉時它會被移除。
- **Chrome 或 Edge：** 在 `chrome://extensions` 或 `edge://extensions` 中開啟**開發者模式**，選擇**載入已解壓的擴充套件程式**，然後選擇 `.output/chrome-mv3` 或解壓後的安裝包。

Anubis 不需要工具列按鈕也能正常運作。如果想把按鈕放在工具列上，請開啟拼圖選單並固定它。

## 照常搜尋

在任意 [支援的搜尋引擎](./search-engines.md) 上搜尋。Anubis 一開始就帶有一些清單，為官方文件、討論、參考網站、付費牆、FOSS 工具和 AI 生成的內容加標籤，並把獨立 wiki 提升到 Fandom 之上。

結果上方的摘要會說明 Anubis 做了什麼。在手機上，**詳情**會顯示其餘內容。

![結果上方的摘要](../../img/summary.png)

## 隱藏一個網站

點選結果左側的圓形按鈕，選擇**隱藏**。該網站的每個結果現在都會在每次搜尋中被隱藏。摘要中的**復原**可以恢復。

![結果上的選單：隱藏、降低、正常、提升和釘選，下方是標籤](../../img/menu.png)

- 摘要中的**顯示已隱藏**會顯示此頁面上已隱藏的結果。
- 若要取消隱藏一個網站，請把它顯示出來，開啟它的選單，選擇**正常**。
- 若要在每個已隱藏的結果處留下一行，請在**設定 → 外觀 → 已隱藏的結果**中選擇**摺疊**。

![“摺疊”樣式下的已隱藏結果：一行文字和一個“顯示”按鈕](../../img/hidden.png)

## 為當前網站排名

在任何網站上點選工具列中的 Anubis 按鈕，即可為該網站排名或加標籤。在搜尋頁面上，彈出視窗則會顯示 Anubis 做了什麼。

<img src="../../img/popup.png" width="364" alt="wikipedia.org 上的工具列彈出視窗：Reference 標籤在網站的標籤中被選中並加了下劃線">

## 鍵盤快捷鍵

- **Alt+Shift+O** 開啟或關閉 Anubis。
- **Alt+Shift+H** 顯示或重新隱藏已隱藏的結果。

在 Mac 上，用 Control 代替 Alt。可以在 `chrome://extensions/shortcuts` 中修改，或在 Firefox 的 `about:addons` → 齒輪 → **管理擴充套件快捷鍵**中修改。

## 下一步

- [為網站排名](./ranking.md)
- [標籤](./tags.md)
- [訂閱清單](./lists.md)
- [移除面板](./clean-up.md)
