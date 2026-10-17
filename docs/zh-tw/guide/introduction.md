# 簡介

Anubis 是一款 Firefox 和 Chrome 擴充套件，用來改變搜尋結果。它會隱藏你不想看到的網站，提升你信任的網站，給結果加上標籤，並移除 AI 回答和其他面板。它適用於你平時使用的搜尋引擎。

<!-- Maintainer: Traditional Chinese translation of docs/guide/introduction.md. HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page in English. -->

<HideDemo />

<div class="github-only">

![結果頁上方的 Anubis：一行摘要說明它隱藏和提升了什麼，每個標題下方都有標籤](../../img/summary.png)

<p class="caption">在英文測試頁面上展示。</p>

</div>

## 功能

- **直接在結果中為任何網站排名。** 用任意結果旁的按鈕隱藏、降低、提升或釘選一個網站。[為網站排名](./ranking.md)
- **標籤。** 每個標題下方的“Official docs”或“Paywalled”等標籤。由你決定每個標籤起什麼作用。[標籤](./tags.md)
- **人人都能釋出的清單。** 訂閱為你給網站加標籤和排名的清單，包括 Brave Goggles 和 uBlacklist 規則集。[訂閱清單](./lists.md) 和 [釋出清單](./publish-a-list.md)
- **移除面板。** 從每次搜尋中去掉 AI 回答、影片面板和“相關問題”。[移除面板](./clean-up.md)
- **不止一頁結果。** 把後面的頁面拉到第一頁，一起排名。[載入更多結果](./more-results.md)
- **同步。** 透過瀏覽器自帶的同步，或藉助 WebDAV 伺服器在 Firefox 和 Chrome 之間同步。[在多臺電腦間同步](./sync.md)
- **帶上舊清單。** 從 uBlacklist、HOHSER 或 Brave Goggle 匯入。[從其他工具遷移](./import-and-backup.md)
- **輕鬆復原。** 結果上方的摘要說明 Anubis 改了什麼，“顯示已隱藏”可以恢復。

::: warning 語言
Anubis 以英語編寫。其他所有語言（包括中文）都是尚未經人檢查的機器翻譯：請謹慎使用。參見 [幫助翻譯](./translate.md)。
:::

Anubis 適用於 Google、DuckDuckGo、Bing、Brave Search、Startpage、Ecosia、Kagi、Yahoo 和 Yandex；Mojeek 為實驗性支援。參見 [搜尋引擎](./search-engines.md)。

## 名字的由來

在埃及神話中，阿努比斯用一根羽毛稱量每一顆心。沒有透過稱量的網站會被隱藏。

## 現狀

Anubis 還很年輕。可以從 [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) 或 [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi) 獲取；[GitHub Releases](https://github.com/Bishop-V/anubis/releases) 也提供安裝包。參見 [開始使用](./getting-started.md)，如果有什麼不對勁，參見 [疑難解答](./troubleshooting.md)。
