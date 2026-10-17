# Khắc phục sự cố

## Báo cáo sự cố

**Báo cáo sự cố**, trong cửa sổ bật lên và thanh bên của Cài đặt, mở một issue trên GitHub đã điền sẵn phiên bản, trình duyệt và công cụ tìm kiếm của bạn. Thêm những gì đã xảy ra và một ảnh chụp màn hình.

## Anubis không làm gì trên trang tìm kiếm

- Biểu tượng trên thanh công cụ có màu xám? Bật Anubis trong cửa sổ bật lên.
- Công cụ tìm kiếm có bật trong **Cài đặt → Công cụ tìm kiếm** không?
- Tự dựng từ mã nguồn trên Firefox? Nạp lại từ `about:debugging` sau mỗi lần khởi động lại.

## Một số kết quả không có nhãn hoặc nút

Có lẽ công cụ tìm kiếm đã đổi trang. Hãy [báo cáo](https://github.com/Bishop-V/anubis/issues) kèm tên miền của công cụ (như `google.de`), một lượt tìm kiếm và ảnh chụp màn hình. Đừng đính kèm trang đã lưu: nó chứa thông tin tài khoản của bạn.

Trên Google, hãy dán thêm đoạn này vào bảng điều khiển của trình duyệt (<kbd>F12</kbd>), và thêm những gì nó sao chép:

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

## Tôi không thấy biểu tượng Anubis trên Chrome

Mở menu mảnh ghép và ghim Anubis.

## Câu trả lời AI hoặc khung vẫn hiện

Kiểm tra công tắc đã bật trong **Cài đặt → Gỡ khung**; tất cả đều tắt lúc đầu. Nếu đã bật, công cụ tìm kiếm đã đổi trang: trên Google, **Luôn mở thẻ Web** dùng được trong lúc chờ. Để giúp sửa, hãy dán đoạn này vào bảng điều khiển (<kbd>F12</kbd>) và thêm những gì nó sao chép vào [một issue](https://github.com/Bishop-V/anubis/issues):

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

## Tải thêm kết quả không tải được gì

Bản tóm tắt cho biết lý do. Thường là [kiểm tra robot](./more-results.md).

## Google luôn mở thẻ Web

Đó là **Cài đặt → Gỡ khung → Luôn mở thẻ Web**. Hãy tắt nó, hoặc chọn **All** phía trên kết quả.

## Danh sách không cập nhật hoặc không đăng ký được

- Kiểm tra liên kết có mở ra văn bản của danh sách không.
- Với danh sách ngoài GitHub, chọn **Cho phép** khi trình duyệt hỏi.
- **Cài đặt → Danh sách** hiện lỗi gần nhất của mỗi danh sách. **Cập nhật tất cả** thử lại.

## Có gì đó bị ẩn mà tôi không biết vì sao

Nhấn **Hiện mục đã ẩn**, rồi mở menu của kết quả: nó cho biết danh sách hay nhãn nào đã ẩn nó. Nếu danh sách sai, hãy [báo cáo](./lists.md).
