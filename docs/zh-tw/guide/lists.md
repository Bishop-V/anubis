# 訂閱清單

清單會替你給網站加標籤、排名或隱藏網站。任何人都可以把清單作為文字檔案釋出在網上。

Anubis 一開始就帶有這些清單：**Official docs**、**Discussions**、**Reference**、**Paywalls**、**FOSS tools**、**AI content** 和 **Independent wikis**。可以在**設定 → 清單**中關閉任意一個。

<!-- Maintainer: Traditional Chinese translation of docs/guide/lists.md. The screenshots are the English ones. -->

![設定，清單](../../img/options-lists.png)

## 訂閱

- **設定 → 清單 → 更多清單**，然後點選**訂閱**。
- 或在 [清單目錄](../../lists.md) 或清單自己的頁面上點選**訂閱**。
- 或把它的地址貼上到**新增清單**中。GitHub、GitLab、Codeberg、gist 和 Goggle 連結都可以。

託管在 GitHub 以外的清單會請求讀取該網站的許可權。

## 哪些清單可用

- Anubis 清單（`.anubis`）
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- [uBlacklist](https://github.com/iorate/ublacklist) 規則集
- 普通域名清單和 hosts 檔案

Anubis 無法使用的規則會被跳過並計數。

::: warning 濾鏡
有些 Goggle 是*濾鏡*：它們會隱藏所有未列出的網站。Anubis 會給它們標上“lens”。
:::

## 更新

清單大約每天更新一次。**設定 → 清單**中的**全部更新**會立即檢查。

## 來自其他專案的清單

這些清單每週根據其他專案的資料重新生成。若要修改，請向它的來源貢獻。

| 清單 | 來源 | 作用 |
| --- | --- | --- |
| **AI content** | laylavish 的 [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist)（CC0） | 給 AI 生成的網站加標籤。 |
| **DevDocs** | [DevDocs](https://github.com/freeCodeCamp/devdocs) 及其貢獻者（MPL-2.0） | 給約 210 個文件網站加標籤並略微提升。 |
| **Self-hosted FOSS** | [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) 及其貢獻者（CC BY-SA 3.0） | 給約 1,000 個可自託管的程式加上 FOSS 標籤。 |
| **Independent wikis** | Kevin Payravi 的 [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy)（MIT） | 提升獨立 wiki，降低被它們取代的 Fandom wiki。 |

## 關閉或取消訂閱

每個清單都有一個開關和一個取消訂閱按鈕。若要在某個網站上推翻清單，請自己給該網站排名。

## 報告清單中的錯誤

結果的選單會列出決定其排名的清單。點選**設定 → 清單**中清單旁的**建議更改**，選擇**從清單中移除**或**其他**，並說明原因。

## 向清單推薦網站

點選**設定 → 清單**中清單旁的**建議更改**，輸入網站並選擇一個標籤。Anubis 會在該清單的問題追蹤器上開啟一個 issue，並填好要新增的規則。在你自己提交之前不會傳送任何內容。
