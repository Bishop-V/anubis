# 發布清單

清單是一個任何人都能訂閱的文字檔案。你不需要伺服器，也不需要 Anubis 的賬號：一個公開的 Git 儲存庫就是資料庫，issue 和 pull request 就是別人參與貢獻的方式。

## 1. 編寫清單

最快的開始方式是用你自己的清單。**設定 → 備份 → 下載我的清單**會儲存你排過名和加過標籤的每個網站。或者從頭寫一個：

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

標題部分之後的每一行都是一條指令：針對哪些網站，以及對它們做什麼。請為你新增的每條網站標籤規則加上一條簡短的 `#` 註釋，說明這個網站為什麼合適。[清單格式](../../list-format.md)（英文）有詳細說明。

只加標籤、把排名留給每位訂閱者自己決定的清單，是最容易發布的：訂閱者可以在**設定 → 標籤**中決定你的標籤是提升、醒目標示還是隱藏。

如果其他清單已有合適的標籤 ID，請重複使用，這樣訂閱者看到的就是一個標籤，而不是兩個含義相同的標籤；[清單格式](../../list-format.md#tags)列出了 Anubis 的清單所使用的那些。發布之後，請保持每個 ID 不變：若要重新命名標籤，請更改它的顯示名稱。

## 2. 放到網上

在 GitHub、GitLab 或 Codeberg 上建立一個公開儲存庫，或者建立一個 gist，然後新增這個檔案。任何檔名都可以；以 `.anubis` 結尾有助於人們認出它。

## 3. 分享連結

人們會把連結貼上到**設定 → 清單 → 新增清單**中。指向檔案頁面的連結也可以；Anubis 會找到原始檔案。GitHub 和 gist 上的清單無需額外許可權即可下載。

若想一鍵訂閱，請改為分享[訂閱連結](../../subscribe.md#make-a-subscribe-link)：它會開啟 Anubis 的設定，並填好你的清單。

## 4. 瞭解錯誤，並讓人們推薦網站

當你的清單把某個網站弄錯時，訂閱者可以在該結果的選單中選擇“有誤？報告給 *你的清單*”。它會在你的儲存庫的問題追蹤器上開啟一個預先填好的 issue，其中有匹配的規則和結果的地址，供他們傳送。對於 GitHub、GitLab 或 Codeberg 上的清單，這無需任何設定。

把 `! issues:` 設為你的問題追蹤器，訂閱者還可以推薦網站：“推薦給 *你的清單*”隨後會出現在你的清單沒有提到的結果的選單中。報告也會發到 `! issues:`，所以如果你的儲存庫自己的 issue 已關閉，請設定它。Pull request 的用法和任何儲存庫一樣。

## 5. 加入目錄

若要讓你的清單出現在每個人的**設定 → 清單 → 更多清單**中，請提交一個 pull request，把它新增到 [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json)。[清單目錄](../../lists.md)頁面（英文）會顯示目前有什麼。
