# 疑難解答

## 報告問題

彈出視窗和設定側欄中的**報告問題**會在 GitHub 上開啟一個 issue，預先填好你的版本、瀏覽器和搜尋引擎。請補充發生了什麼，並附上截圖。

## Anubis 在搜尋頁面上沒有任何作用

- 工具列圖示是灰色的嗎？在彈出視窗中開啟 Anubis。
- **設定 → 搜尋引擎**中該搜尋引擎是否已開啟？
- 在 Firefox 中從原始碼構建？每次重啟後都要從 `about:debugging` 重新載入。

## 有些結果沒有標籤或按鈕

搜尋引擎可能改了頁面。請 [報告](https://github.com/Bishop-V/anubis/issues)，附上搜尋引擎的域名（如 `google.de`）、一次搜尋和截圖。不要附上儲存的頁面：其中包含你的賬戶資訊。

在 Google 上，還請把下面這段貼上到瀏覽器控制檯（<kbd>F12</kbd>），並附上它複製的內容：

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

## 我在 Chrome 中看不到 Anubis 圖示

開啟拼圖選單，固定 Anubis。

## AI 回答或面板仍然顯示

檢查**設定 → 移除面板**中的開關是否已開啟；一開始全部關閉。如果已開啟，說明搜尋引擎改了頁面：在 Google 上，可以先用**始終開啟“網頁”分頁**。若要幫忙修復，請把下面這段貼上到控制檯（<kbd>F12</kbd>），並把它複製的內容附在 [issue](https://github.com/Bishop-V/anubis/issues) 中：

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

## 載入更多結果沒有載入任何內容

摘要會說明原因。通常是 [人機驗證](./more-results.md)。

## Google 總是開啟“網頁”分頁

這是**設定 → 移除面板 → 始終開啟“網頁”分頁**。把它關掉，或在結果上方選擇**全部**。

## 清單無法更新或訂閱

- 檢查連結是否能開啟清單的文字。
- 對於 GitHub 以外的清單，瀏覽器詢問時請選擇**允許**。
- **設定 → 清單**會顯示每個清單最近的錯誤。**全部更新**會重試。

## 有內容被隱藏了，我不知道為什麼

點選**顯示已隱藏**，然後開啟該結果的選單：它會說明是哪個清單或標籤隱藏了它。如果清單弄錯了，請 [報告](./lists.md)。
