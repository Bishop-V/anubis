# 發布清單

清單是公開程式碼倉庫中的一個文字檔案。大家透過 issue 和Pull Request來貢獻。

## 1. 編寫

在**設定 → 備份 → 發布你的清單**中填寫名稱、說明和作者，然後點選**下載我的清單**。或者自己寫一個：

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

給每個加了標籤的網站寫一條 `#` 註釋說明原因。只加標籤的清單最友好：訂閱者自己決定標籤的作用。在合適的地方複用 [已有的標籤 ID](../../list-format.md#tags)，ID 一旦發布就不要更改。參見 [清單格式](../../list-format.md)（英文）。

## 2. 放到網上

把它上傳到一個 [gist](https://gist.github.com/)，或 GitHub、GitLab 或 Codeberg 上的公開程式碼倉庫。以 `.anubis` 結尾的檔名更容易識別。

## 3. 分享連結

大家可以把它貼上到**設定 → 清單 → 新增清單**中，或使用一鍵 [訂閱連結](../../subscribe.md#make-a-subscribe-link)。

## 4. 讓大家建議更改

下載前在**建議回報**中填寫你的問題追蹤器網址，或寫在 `! issues:` 行中。訂閱者就會看到**建議更改**按鈕，點選後會在那裡開啟一個填好內容的 issue，用來新增網站或回報錯誤。

## 5. 加入目錄

提交一個Pull Request，把它加到 [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json) 中。參見 [清單目錄](../../lists.md)。
