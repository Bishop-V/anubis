# Bắt đầu

Cài Anubis, tìm kiếm như mọi khi, và ẩn trang web đầu tiên của bạn.

## Cài đặt

- **Firefox:** [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/).
- **Chrome, Brave, Vivaldi, Opera và Edge:** [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). Trên Edge, hãy chọn **Cho phép tiện ích mở rộng từ các cửa hàng khác** trước.
- **Firefox cho Android** (đang thử nghiệm): [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) trên điện thoại, rồi mở Anubis từ menu của Firefox. Google, DuckDuckGo và Bing hoạt động; các công cụ khác có thể chưa.

Anubis vẫn hoạt động khi không có nút trên thanh công cụ. Nếu muốn đặt nút ở đó trên Chrome, hãy mở menu mảnh ghép và ghim nó.

## Tìm kiếm như thường lệ

Hãy tìm kiếm trên bất kỳ [công cụ được hỗ trợ](./search-engines.md) nào. Anubis bắt đầu với các danh sách gắn nhãn tài liệu chính thức, thảo luận, trang tham khảo, tường phí, công cụ mã nguồn mở và nội dung do AI tạo. Một danh sách khác nâng các wiki độc lập lên trên Fandom.

Trang mở ra khi bạn cài Anubis có ba lựa chọn để bắt đầu: gỡ câu trả lời AI, ẩn trang web do AI tạo và hạ các trang web có tường phí. Mỗi lựa chọn cũng có trong Cài đặt.

Bản tóm tắt phía trên kết quả cho biết Anubis đã làm gì. Trên điện thoại, **Chi tiết** hiện phần còn lại.

![Bản tóm tắt phía trên kết quả](../../img/summary.png)

## Ẩn một trang web

Nhấn nút tròn bên trái một kết quả và chọn **Ẩn**. Trang web đó biến mất khỏi mọi lần tìm kiếm, và **Hoàn tác** trong bản tóm tắt đưa nó trở lại. Trên điện thoại, nút này là ⚖ ở cuối tiêu đề.

![Menu trên một kết quả: Ẩn, Hạ, Bình thường, Nâng và Ghim, với các nhãn bên dưới](../../img/menu.png)

- **Hiện mục đã ẩn** trong bản tóm tắt hiện các kết quả đã ẩn trên trang này.
- Để bỏ ẩn hẳn một trang web, hãy hiện nó, mở menu của nó và chọn **Bình thường**.
- Để chừa một dòng thay cho mỗi kết quả bị ẩn, chọn **Thu gọn** trong **Cài đặt → Giao diện → Kết quả bị ẩn**.

![Một kết quả bị ẩn theo kiểu Thu gọn: một dòng với nút Hiện](../../img/hidden.png)

## Xếp hạng trang web bạn đang xem

Nhấn nút Anubis trên thanh công cụ ở bất kỳ trang web nào để xếp hạng hoặc gắn nhãn cho trang đó. Trên trang tìm kiếm, cửa sổ bật lên thay vào đó cho biết Anubis đã làm gì.

<img src="../../img/popup.png" width="364" alt="Cửa sổ bật lên trên thanh công cụ ở wikipedia.org: nhãn Reference được chọn và gạch chân giữa các nhãn của trang web">

## Phím tắt

- **Alt+Shift+O** bật hoặc tắt Anubis.
- **Alt+Shift+H** hiện hoặc ẩn lại các kết quả đã ẩn.

Trên Mac, dùng Control thay cho Alt. Đổi chúng trong `chrome://extensions/shortcuts`, hoặc trên Firefox ở `about:addons` → bánh răng → **Quản lý phím tắt tiện ích**.

## Tiếp theo

- [Xếp hạng trang web](./ranking.md): hạ, nâng hoặc ghim một trang web, và chọn thứ hạng áp dụng cho bao nhiêu phần của trang.
- [Nhãn](./tags.md): tự gắn nhãn cho trang web, và chọn mỗi nhãn làm gì.
- [Đăng ký danh sách](./lists.md): thêm các danh sách gắn nhãn và xếp hạng trang web giùm bạn.
- [Gỡ khung](./clean-up.md): bỏ câu trả lời AI và các khung khác khỏi mọi lần tìm kiếm.

## Tự nạp

Tải một gói từ [GitHub Releases](https://github.com/Bishop-V/anubis/releases), hoặc tự dựng với [Node.js](https://nodejs.org) 22.12 trở lên:

```sh
git clone https://github.com/Bishop-V/anubis.git
cd anubis
npm install
npm run build          # Firefox
npm run build:chrome   # Chrome, Edge và các trình duyệt Chromium khác
```

- **Firefox:** trong `about:debugging`, chọn **Firefox này → Tải tiện ích tạm thời** và chọn `.output/firefox-mv2/manifest.json`. Nó bị gỡ khi Firefox đóng.
- **Chrome hoặc Edge:** trong `chrome://extensions` hoặc `edge://extensions`, bật **Chế độ dành cho nhà phát triển**, chọn **Tải tiện ích đã giải nén**, rồi chọn `.output/chrome-mv3` hoặc gói đã giải nén.

::: warning Ngôn ngữ
Anubis dùng ngôn ngữ của trình duyệt khi có bản dịch. Chỉ tiếng Anh được hỗ trợ đầy đủ; các ngôn ngữ khác, kể cả tiếng Việt, là bản dịch máy, nên hãy dùng thận trọng. [Giúp dịch](./translate.md) nói thêm.
:::
