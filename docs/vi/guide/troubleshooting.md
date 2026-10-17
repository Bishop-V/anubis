# Khắc phục sự cố

## Báo cáo sự cố

**Báo cáo sự cố**, ở cuối cửa sổ bật lên trên thanh công cụ và trong thanh bên Cài đặt, mở một issue mới trên GitHub, điền sẵn phiên bản Anubis, trình duyệt của bạn và công cụ tìm kiếm bạn đang dùng. Hãy nói bạn đã làm gì, thấy gì và mong đợi gì, và thêm ảnh chụp màn hình. Không có gì được gửi cho đến khi bạn gửi. Bạn cần một tài khoản GitHub để gửi.

## Anubis không làm gì trên trang tìm kiếm

- **Anubis có đang bật không?** Biểu tượng xám trên thanh công cụ nghĩa là Anubis đang tắt. Hãy bật bằng công tắc trong cửa sổ bật lên trên thanh công cụ.
- **Công cụ tìm kiếm có đang bật không?** Kiểm tra **Cài đặt → Công cụ tìm kiếm**.
- **Đó có phải kết quả web không?** Anubis để yên các thẻ hình ảnh, video, tin tức và mua sắm.
- **Tiện ích có còn được tải không?** Khi cài từ mã nguồn, Firefox gỡ nó mỗi lần đóng. Hãy tải lại từ `about:debugging`.

## Một số kết quả không có nhãn hoặc vòng chỉ báo

Các công cụ tìm kiếm thay đổi trang của chúng mà không báo trước, và một bố cục mới có thể làm kết quả không còn thấy được với Anubis. Hãy [báo cáo](https://github.com/Bishop-V/anubis/issues) kèm:

- công cụ tìm kiếm và phiên bản theo quốc gia của bạn (ví dụ `google.de`),
- một lần tìm kiếm cho thấy sự cố,
- một ảnh chụp màn hình.

Trên Google, bạn cũng có thể gửi kèm cấu trúc xung quanh tiêu đề của từng kết quả. Hãy mở bảng điều khiển của trình duyệt trên trang kết quả đó (<kbd>F12</kbd>, rồi **Console**), dán đoạn sau và nhấn <kbd>Enter</kbd>:

```js
copy([...document.querySelectorAll('#rso h3')].map((h) => { const a = h.closest('a[href]') || h.querySelector('a[href]'); const u = a && new URL(a.href); const chain = []; for (let el = h.parentElement; el && el.id !== 'rso'; el = el.parentElement) chain.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '') + (el.hasAttribute('data-anubis-result') ? '[result]' : '') + (el.hasAttribute('data-anubis-removed') ? '[removed]' : '') + ' ' + el.querySelectorAll('h3').length); return [h.closest('[data-anubis-result]') ? 'found' : 'MISSED', a ? u.hostname + u.pathname + ' ?' + [...u.searchParams.keys()].join(',') : 'no link', h.closest('.MjjYud')?.querySelector('cite') ? 'cite' : 'no cite', chain.join(' < ')].join(' | '); }).join('\n'));
```

Nó sao chép mỗi tiêu đề một dòng: Anubis có tìm thấy nó không, liên kết của nó dẫn đến đâu (không kèm chi tiết), và tên cùng lớp của các phần tử xung quanh. Hãy dán nó vào issue.

Xin đừng đính kèm bản lưu của trang. Trang tìm kiếm chứa tên tài khoản, vị trí của bạn và nhiều thứ khác.

## Tôi không thấy biểu tượng Anubis trong Chrome

Chrome giấu các tiện ích mới sau biểu tượng mảnh ghép trên thanh công cụ. Hãy mở nó và ghim Anubis.

## Câu trả lời AI hoặc các khung vẫn hiện

Hãy kiểm tra nút gạt trong **Cài đặt → Gỡ khung** đã bật chưa; tất cả đều bắt đầu ở trạng thái tắt. Nếu đã bật mà một câu trả lời AI, khung video hoặc khung khác vẫn hiện (hoặc chỉ mất tiêu đề của nó), nhiều khả năng công cụ tìm kiếm đã đổi cách dựng trang. Trên Google, **Cài đặt → Gỡ khung → Luôn mở thẻ Web** chắc chắn gỡ được tất cả trong lúc chờ.

Để giúp sửa, hãy mở bảng điều khiển của trình duyệt trên trang kết quả đó (<kbd>F12</kbd>, rồi **Console**), dán đoạn sau và nhấn <kbd>Enter</kbd>:

```js
copy([...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && /^\s*(AI Overview|AI Mode|Search Assist|Duck\.ai|Videos|Short videos|People also ask|Discussions( and forums)?|Top stories|Related (searches|queries)|People also search for)\s*$/i.test(n.nodeValue))).map((el) => { const chain = []; for (let a = el; a && a !== document.body; a = a.parentElement) chain.push(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className.trim() ? '.' + a.className.trim().split(/\s+/).join('.') : '') + (a.getAttribute('role') ? `[role=${a.getAttribute('role')}]` : '') + [...a.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}]`).join('')); return chain.join(' < '); }).join('\n\n'));
```

Nó sao chép cấu trúc xung quanh tiêu đề của các khung đó: tên phần tử, lớp và vai trò, không có văn bản nào từ trang. Hãy dán nó vào [một issue mới](https://github.com/Bishop-V/anubis/issues).

## Tải thêm kết quả không tải gì

Bản tóm tắt cho biết lý do dưới dòng đầu tiên, kèm liên kết đến trang Anubis đã thử. Thường gặp nhất là công cụ tìm kiếm muốn bạn xác nhận mình không phải là robot: hãy mở trang, làm điều đó, rồi nhấn **Tải thêm kết quả** lần nữa. Ecosia thường xuyên yêu cầu điều này. Xem [Tải thêm kết quả](./more-results.md).

## Google luôn mở thẻ Web

Đó là **Cài đặt → Gỡ khung → Luôn mở thẻ Web**. Hãy chọn **Tất cả** phía trên kết quả để xem trang thông thường cho một lần tìm kiếm, hoặc tắt nút gạt đó.

## Danh sách không cập nhật hoặc không đăng ký được

- Kiểm tra liên kết có mở ra nội dung văn bản của danh sách trong trình duyệt không.
- Với danh sách lưu trữ ngoài GitHub hoặc gist, Anubis cần quyền đọc từ trang web đó. Hãy đăng ký lại và chọn **Cho phép** khi trình duyệt hỏi.
- **Cài đặt → Danh sách** cho thấy lỗi cập nhật gần nhất dưới mỗi danh sách. **Cập nhật tất cả** thử lại.

## Có gì đó bị ẩn và tôi không biết vì sao

Hãy mở menu của kết quả. **Lý do** liệt kê từng danh sách hoặc nhãn đứng sau quyết định. Thứ hạng do chính bạn đặt thắng các danh sách và các nhãn bạn đặt là Ẩn, và cộng với các nhãn bạn đặt là Ghim, Nâng hoặc Hạ. Nếu một danh sách làm sai, “Sai? Báo cáo với *tên danh sách*” báo cho những người duy trì danh sách đó ([Báo cáo lỗi trong danh sách](./lists.md)).
