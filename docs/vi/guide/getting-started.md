# Bắt đầu

::: warning Ngôn ngữ
Anubis dùng ngôn ngữ của trình duyệt khi có bản dịch. Chỉ tiếng Anh được hỗ trợ đầy đủ; các ngôn ngữ khác, kể cả tiếng Việt, là bản dịch máy, nên hãy dùng thận trọng. [Giúp dịch](./translate.md) nói thêm.
:::

## Cài đặt trên Firefox

Tải [Anubis từ Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/).

## Cài đặt trên Firefox cho Android

Đang thử nghiệm. Cài từ [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) trên điện thoại, rồi mở nó từ menu của Firefox. Google, DuckDuckGo và Bing hoạt động; các công cụ khác có thể chưa. Mỗi kết quả có nút ⚖ ở cuối tiêu đề.

## Cài đặt trên Chrome

Tải [Anubis từ Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi).

## Trình duyệt khác

Brave, Vivaldi, Opera và Edge cài nó từ [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). Trên Edge, hãy chọn **Cho phép tiện ích mở rộng từ các cửa hàng khác** trước.

Để tự nạp, hãy tải một gói từ [GitHub Releases](https://github.com/Bishop-V/anubis/releases), hoặc tự dựng với [Node.js](https://nodejs.org) 22.12 trở lên:

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox
npm run build:chrome   # Chrome, Edge và các trình duyệt Chromium khác
```

- **Firefox:** trong `about:debugging`, chọn **Firefox này → Tải tiện ích tạm thời** và chọn `.output/firefox-mv2/manifest.json`. Nó bị gỡ khi Firefox đóng.
- **Chrome hoặc Edge:** trong `chrome://extensions` hoặc `edge://extensions`, bật **Chế độ dành cho nhà phát triển**, chọn **Tải tiện ích đã giải nén**, rồi chọn `.output/chrome-mv3` hoặc gói đã giải nén.

Anubis vẫn hoạt động khi không có nút trên thanh công cụ. Nếu muốn đặt nút ở đó, hãy mở menu mảnh ghép và ghim nó.

## Tìm kiếm như thường lệ

Hãy tìm kiếm trên bất kỳ [công cụ được hỗ trợ](./search-engines.md) nào. Anubis bắt đầu với các danh sách gắn nhãn tài liệu chính thức, thảo luận, trang tham khảo, tường phí, công cụ mã nguồn mở và nội dung do AI tạo, và nâng các wiki độc lập lên trên Fandom.

Bản tóm tắt phía trên kết quả cho biết Anubis đã làm gì. Trên điện thoại, **Chi tiết** hiện phần còn lại.

![Bản tóm tắt phía trên kết quả](../../img/summary.png)

## Ẩn một trang web

Nhấn nút tròn bên trái một kết quả và chọn **Ẩn**. Mọi kết quả từ trang web đó giờ bị ẩn, trong mọi lần tìm kiếm. **Hoàn tác** trong bản tóm tắt đưa nó trở lại.

![Menu trên một kết quả: Ẩn, Hạ, Bình thường, Nâng và Ghim, với các nhãn bên dưới](../../img/menu.png)

- **Hiện mục đã ẩn** trong bản tóm tắt hiện các kết quả đã ẩn trên trang này.
- Để bỏ ẩn một trang web, hãy hiện nó, mở menu của nó và chọn **Bình thường**.
- Để chừa một dòng thay cho mỗi kết quả bị ẩn, chọn **Thu gọn** trong **Cài đặt → Giao diện → Kết quả bị ẩn**.

![Một kết quả bị ẩn theo kiểu Thu gọn: một dòng với nút Hiện](../../img/hidden.png)

## Xếp hạng trang web bạn đang xem

Nhấn nút Anubis trên thanh công cụ ở bất kỳ trang web nào để xếp hạng hoặc gắn nhãn cho trang đó. Trên trang tìm kiếm, cửa sổ bật lên thay vào đó cho biết Anubis đã làm gì.

<img src="../../img/popup.png" width="364" alt="Cửa sổ bật lên trên thanh công cụ ở wikipedia.org: nhãn Reference được chọn và gạch chân giữa các nhãn của trang web">

## Tắt Anubis

Dùng công tắc trong cửa sổ bật lên. Biểu tượng chuyển sang màu xám.

## Phím tắt

- **Alt+Shift+O** bật hoặc tắt Anubis.
- **Alt+Shift+H** hiện hoặc ẩn lại các kết quả đã ẩn.

Trên Mac, dùng Control thay cho Alt. Đổi chúng trong `chrome://extensions/shortcuts`, hoặc trên Firefox ở `about:addons` → bánh răng → **Quản lý phím tắt tiện ích**.

## Trợ giúp

**Trợ giúp** trong cửa sổ bật lên mở wiki này, và mỗi mục trong **Cài đặt** liên kết tới trang của nó.

## Tiếp theo

- [Xếp hạng trang web](./ranking.md)
- [Nhãn](./tags.md)
- [Đăng ký danh sách](./lists.md)
- [Gỡ khung](./clean-up.md)
