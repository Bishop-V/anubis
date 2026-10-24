---
layout: home
title: Anubis
titleTemplate: 隱藏、排名和標記搜尋結果

# The homepage is drawn by docs/.vitepress/theme/home.ts from what's below, like the
# English one (docs/index.md). This is its Simplified Chinese translation.
intro:
  title: 隱藏、排名和標記搜尋結果
  lead: 就在你已在使用的搜尋引擎上，還有任何人都能發布的清單。
  # The button for the reader's browser, when the page can tell (home.ts).
  install:
    firefox: 新增至 Firefox
    chrome: 新增至 Chrome
  actions:
    - text: 開始使用
      link: /zh-tw/guide/getting-started
      brand: true
    - text: 瀏覽清單
      link: /lists

highlightsLabel: Anubis 還能做什麼

# The scroll-driven demo's words (docs/.vitepress/theme/scroll-demo.ts); its mock search page stays in English.
demo:
  cue: 向下滾動，看 Anubis 如何整理這次搜尋
  label: Anubis 如何處理一次搜尋
  steps:
    - title: 清除雜亂內容
      text: Anubis 會移除 AI 回答、問題清單以及夾在中間的各種面板。哪些要移除，由你決定。
    - title: 不想再看到某個網站？
      text: 用任意結果旁邊的天平把它隱藏。此後它不會再出現在任何搜尋中，“顯示已隱藏”可以把它找回來。
    - title: 你信任的網站排在前面
      text: 釘選或提升你信任的網站，降低那些你勉強接受的網站。天平會傾斜，顯示每個網站所處的位置。
    - title: 點選之前先心中有數
      text: 來自清單的標籤會標出參考資料網站、付費牆等。摘要會說明發生了哪些變化，“顯示已隱藏”可以復原這些變化。

highlights:
  - title: 直接在結果中為任何網站排名
    details: 在任意結果上隱藏、降低、提升或釘選一個網站。對每次搜尋都有效。
    link: /zh-tw/guide/ranking
    linkText: 排名如何運作
  - title: 可以由你決定作用的標籤
    details: “Official docs”或“Paywalled”之類的標籤。每個標籤的作用由你決定。
    link: /zh-tw/guide/tags
    linkText: 關於標籤
  - title: 任何人都能發布的清單
    details: 清單就是一個文字檔案。Brave Goggles 和 uBlacklist 規則集也能用。
    link: /zh-tw/guide/lists
    linkText: 訂閱清單
  - title: 移除面板
    details: 把 AI 回答、影片面板和“相關問題”從頁面上去掉。去掉哪些由你選擇。
    link: /zh-tw/guide/clean-up
    linkText: 它會移除什麼

closing:
  title: 無需註冊
  details:
    - Anubis 沒有伺服器，也不收集任何內容。你的選擇儲存在你的瀏覽器中。
    - 支援 Google、DuckDuckGo、Bing、Brave Search、Startpage、Ecosia、Kagi、Yahoo 和 Yandex，可用於 Firefox 和 Chrome。
  link: /zh-tw/guide/privacy
  linkText: 隱私與權限
---
