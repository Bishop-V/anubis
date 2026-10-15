# 簡介

Anubis 是一款適用於 Firefox 和 Chrome 的瀏覽器擴充功能，會改變搜尋結果頁面。它會隱藏你永遠不想看到的網站，提升你信任的網站，為結果加上標籤，讓你一眼就能區分它們，還會移除你沒有要求的 AI 回答和其他面板。

Anubis 可用於你已在使用的搜尋引擎。你的選擇和你訂閱的清單對每次搜尋都有效。

<!-- Maintainer: this is the Simplified Chinese translation of docs/guide/introduction.md. HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page in English. -->

<HideDemo />

<div class="github-only">

![搜尋結果頁面上方的 Anubis：一行摘要說明隱藏和提升了什麼，每個標題下方有標籤](../../img/summary.png)

<p class="caption">顯示在一個英文測試頁面上。</p>

</div>

## 功能

- **直接在結果中為任何網站排名。** 用任意結果上的按鈕隱藏、降低、提升或釘選一個網站。[為網站排名](./ranking.md)
- **標籤。** 結果帶有“Official docs”“Discussion”“Paywalled”“AI-generated”或“Independent wiki”之類的標籤。每個標籤有什麼作用由你決定，從只顯示標籤，到隱藏帶有該標籤的所有結果。[標籤](./tags.md)
- **任何人都能發布的清單。** 訂閱能替你標記網站併為其排名的清單。清單是 Git 儲存庫中的一個文字檔案，所以任何人都能發布清單，也能對清單提出修改建議。Brave Goggles、uBlacklist 規則集和純網域清單無需修改即可使用。有些清單每週根據其他專案的資料生成，例如 HUGE AI Blocklist 和 Indie Wiki Buddy，並會註明來源。[訂閱清單](./lists.md)和[發布清單](./publish-a-list.md)
- **移除面板。** 在每次搜尋中移除 AI 回答、影片面板、“相關問題”等。[移除面板](./clean-up.md)
- **不止一頁結果。** 把後面的頁面併入第一頁，一起排名，這樣你在第 3 頁釘選的網站也會升到最前面。[載入更多結果](./more-results.md)
- **同步。** 你的網站和設定透過瀏覽器自帶的同步功能跟著你走，在 Firefox 和 Chrome 之間則透過 WebDAV 伺服器同步。[在多臺電腦間同步](./sync.md)
- **帶上你的舊清單。** 把你在 uBlacklist、HOHSER 或 Brave Goggle 中的網站遷移過來。[從其他工具遷移](./import-and-backup.md)
- **容易復原。** 結果上方的一行摘要會說明 Anubis 做了哪些更改，“顯示已隱藏”會讓該頁面的一切還原原樣，“復原”會取消你的上一次更改。

::: warning 語言
Anubis 以英文編寫。它也有阿拉伯語、孟加拉語、中文（簡體）、中文（繁體）、法語、德語、印地語、印尼語、義大利語、日語、韓語、巴西葡萄牙語、俄語、西班牙語、土耳其語、烏爾都語和越南語版本，但這些都是機器翻譯，尚未經過說這些語言的人檢查，也沒有得到完整支援：請謹慎使用。[幫助翻譯](./translate.md)會進一步說明，以及如何修正這些翻譯。
:::

Anubis 支援 Google、DuckDuckGo、Bing、Brave Search、Startpage、Ecosia、Kagi、Yahoo 和 Yandex。Mojeek 還處於實驗階段：它尚未在真實網站上試過。詳情見[搜尋引擎](./search-engines.md)。

## 名字的由來

在古埃及神話中，阿努比斯（Anubis）會把每一顆心臟和一根羽毛放在天平上稱量。這款擴充功能對搜尋結果做同樣的事，沒透過稱量的網站會被隱藏。每個結果上選單裡的天平是對此的致意；其他一切都直截了當地說明它的作用。

## 現狀

Anubis 還很年輕，可從 [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) 和 [Chrome 應用商店](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi)獲取。Edge Add-ons 尚未上架。帶標籤的 [GitHub Releases](https://github.com/Bishop-V/anubis/releases) 包含帶版本號的安裝包，以及指向最新 Firefox 和 Chrome 構建的穩定連結。大多數搜尋引擎已在真實頁面上檢查過，其餘的只在按其佈局搭建的測試頁面上檢查過；[搜尋引擎](./search-engines.md)會說明是哪些。[開始使用](./getting-started.md)介紹如何安裝。如果真實搜尋頁面上有什麼地方不對，請參閱[疑難解答](./troubleshooting.md)。
