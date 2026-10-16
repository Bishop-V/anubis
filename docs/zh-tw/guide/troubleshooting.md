# 疑難解答

## 報告問題

工具列彈出視窗底部和“設定”側邊欄中的**報告問題**會在 GitHub 上開啟一個新的 issue，其中填好了 Anubis 的版本、你的瀏覽器和你所在的搜尋引擎。請說明你做了什麼、看到了什麼、期望什麼，並附上截圖。在你提交之前，不會傳送任何內容。提交需要 GitHub 賬號。

## Anubis 在搜尋頁面上什麼也沒做

- **它開著嗎？** 工具列圖示是灰色，表示 Anubis 已關閉。請用工具列彈出視窗中的開關開啟它。
- **這個搜尋引擎開著嗎？** 檢查**設定 → 搜尋引擎**。
- **是網頁結果嗎？** Anubis 不會處理圖片、影片、新聞和購物分頁。
- **擴充功能還在載入嗎？** 如果是從原始碼安裝的，Firefox 每次關閉時都會把它移除。請從 `about:debugging` 重新載入它。

## 有些結果沒有標籤或 ⚖ 按鈕

搜尋引擎會不經通知地更改頁面，新的佈局可能讓 Anubis 找不到某些結果。請[報告](https://github.com/Bishop-V/anubis/issues)，並附上：

- 搜尋引擎，以及你所在國家的版本（例如 `google.de`），
- 一次能顯示問題的搜尋，
- 一張截圖。

在 Google 上，你還可以附上每個結果標題周圍的結構。請在該結果頁面上開啟瀏覽器的主控台（<kbd>F12</kbd>，然後選擇**主控台**），貼上下面的程式碼並按 <kbd>Enter</kbd>：

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

它會為每個標題複製一行：Anubis 是否找到了它、它的連結指向哪裡（不含細節），以及它周圍的元素名稱和類名。請把它貼上到 issue 中。

請不要附上頁面的儲存副本。搜尋頁面包含你的賬號名稱、位置等資訊。

## 我在 Chrome 中看不到 Anubis 圖示

Chrome 會把新擴充功能藏在工具列的拼圖圖示後面。請開啟它，並固定 Anubis。

## AI 回答或面板仍然顯示

請檢查**設定 → 移除面板**中的開關是否已開啟；它們一開始都是關閉的。如果已經開啟，而 AI 回答、影片面板或其他面板仍然顯示（或只是它的標題消失了），那很可能是搜尋引擎更改了它的構建方式。在 Google 上，**設定 → 移除面板 → 始終開啟“網頁”分頁**在這期間一定能把它們全部移除。

為了幫助修復，請在該結果頁面上開啟瀏覽器的主控台（<kbd>F12</kbd>，然後選擇**主控台**），貼上下面的程式碼並按 <kbd>Enter</kbd>：

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

它會複製這些面板標題周圍的結構：元素名稱、類名和角色，不包含頁面上的任何文字。請把它貼上到[新的 issue](https://github.com/Bishop-V/anubis/issues) 中。

## 載入更多結果什麼也沒載入

摘要會在它的第一行下方說明原因，並附有指向 Anubis 嘗試過的頁面的連結。最常見的情況是搜尋引擎想讓你確認自己不是機器人：請開啟該頁面，完成確認，然後再次點選**載入更多結果**。Ecosia 經常要求這樣做。參見[機器人驗證](./more-results.md)。

## Google 總是開啟“網頁”分頁

這是**設定 → 移除面板 → 始終開啟“網頁”分頁**。請選擇結果上方的**全部**來檢視某次搜尋的常規頁面，或者關閉這個開關。

## 清單無法更新或訂閱

- 檢查該連結在你的瀏覽器中能否開啟清單的文字。
- 對於託管在 GitHub 或 gist 之外的清單，Anubis 需要讀取該網站的許可權。請重新訂閱，並在瀏覽器詢問時選擇**允許**。
- **設定 → 清單**會在每個清單下方顯示最近一次的更新錯誤。**全部更新**會重試。

## 有東西被隱藏了，我不知道為什麼

開啟結果上的 ⚖ 選單。**原因**會列出決定背後的每個清單或標籤。你自己設的排名優先於清單和你設為隱藏的標籤，併疊加到你設為釘選、提升或降低的標籤上。如果某個清單弄錯了，“有誤？報告給 *清單名稱*”會告知該清單的維護者（[報告清單中的錯誤](./lists.md)）。
