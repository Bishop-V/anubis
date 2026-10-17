# 釋出清單

清單是公開程式碼倉庫中的一個文字檔案。大家透過 issue 和Pull Request來貢獻。

## 1. 編寫

從**設定 → 備份 → 下載我的清單**開始，或者自己寫一個：

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

給每個加了標籤的網站寫一條 `#` 註釋說明原因。只加標籤的清單最友好：訂閱者自己決定標籤的作用。在合適的地方複用 [已有的標籤 ID](../../list-format.md#tags)，ID 一旦釋出就不要更改。參見 [清單格式](../../list-format.md)（英文）。

## 2. 放到網上

把它加到 GitHub、GitLab 或 Codeberg 上的公開程式碼倉庫，或一個 gist 中。以 `.anubis` 結尾的檔名更容易識別。

## 3. 分享連結

大家可以把它貼上到**設定 → 清單 → 新增清單**中，或使用一鍵 [訂閱連結](../../subscribe.md#make-a-subscribe-link)。

## 4. 瞭解錯誤，接受推薦

把 `! issues:` 設為你的問題追蹤器，訂閱者就會看到**建議更改**按鈕。

## 5. 加入目錄

提交一個Pull Request，把它加到 [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json) 中。參見 [清單目錄](../../lists.md)。
