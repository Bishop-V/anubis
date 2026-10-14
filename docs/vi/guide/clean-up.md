# Gỡ khung

Các trang tìm kiếm mang nhiều thứ không phải kết quả: câu trả lời AI, khung video, “Mọi người cũng hỏi”. **Cài đặt → Gỡ khung** gỡ những khung bạn bật, trong mọi lần tìm kiếm: nút gạt bật nghĩa là Anubis gỡ phần đó, còn tắt thì để nó trên trang.

<!-- Maintainer: Vietnamese translation of docs/guide/clean-up.md. The screenshots are the English ones, from mock pages. -->

![Cài đặt, Gỡ khung](../../img/options-cleanup.png)

| Nút gạt | Điều nó gỡ |
| --- | --- |
| **Câu trả lời AI** | Tổng quan do AI tạo của Google và thẻ Chế độ AI, câu trả lời có AI hỗ trợ của DuckDuckGo cùng thẻ và nút Duck.ai, câu trả lời AI của Bing ở đầu trang (cùng video và liên kết bên cạnh), và câu trả lời AI của Brave. |
| **Khung video** | Khung video và video ngắn xen giữa các kết quả, như “Videos of…” của Bing. |
| **Mọi người cũng hỏi** | Danh sách câu hỏi của người khác, kèm câu trả lời bấm để mở rộng. |
| **Khung thảo luận** | Khung các chủ đề diễn đàn xen giữa các kết quả, như “Thảo luận và diễn đàn” của Google và “Discussions” của Brave. Các trang diễn đàn nằm giữa các kết quả vẫn được giữ. |
| **Tin bài hàng đầu** | Khung tin tức xen giữa các kết quả. |
| **Hàng hình ảnh** | Hàng hình ảnh xen giữa các kết quả. Thẻ Hình ảnh vẫn dùng được. |
| **Tìm kiếm liên quan** | Danh sách các lần tìm kiếm khác, thường ở cuối trang, “Related searches based on your browsing” của Bing, và ô “People also search for” mà Bing và Google thêm dưới một kết quả bạn đã vào rồi quay lại. Các liên kết đến những trang sau vẫn được giữ. |
| **Công cụ tìm kiếm khác** | Hàng nút lặp lại lần tìm kiếm của bạn trên công cụ khác, như “Find elsewhere” của Brave với Google, Bing và Mojeek. |
| **Yêu cầu cho phép quảng cáo** | Biểu ngữ yêu cầu bạn tắt trình chặn quảng cáo hoặc cho phép quảng cáo, như “Block creepy ads, not private search” của Startpage cùng nút **Allow Startpage ads**. |

Tất cả đều bắt đầu ở trạng thái tắt. **Tất cả các mục này**, ở đầu mỗi phần, bật hoặc tắt mọi nút gạt trong phần đó cùng lúc.

## Điều đã bị gỡ

Bản tóm tắt phía trên kết quả, hoặc phía trên câu trả lời AI nếu có, cho biết đã gỡ gì: “Anubis cũng đã gỡ một câu trả lời AI và một khung video.” **Hiện mục đã ẩn** đưa các khung đã gỡ trở lại trên trang, kèm viền nét đứt để bạn phân biệt chúng.

![Bản tóm tắt sau khi dọn dẹp](../../img/cleanup-summary.png)

## Cách tìm ra các khung

Anubis nhận ra một khung qua tiêu đề của nó (“AI Overview”, “Videos”, “People also ask”) chứ không qua tên nội bộ mà công cụ tìm kiếm dùng cho nó, vì tên đó thay đổi thường xuyên. Anubis chỉ gỡ các khung xen giữa các kết quả. Khung bên phải trang kết quả của Google được để yên, và bất cứ thứ gì chứa một kết quả, ô tìm kiếm hoặc các liên kết đến những trang sau cũng vậy.

Tiêu đề được nhận ra bằng tiếng Anh và một số bản dịch phổ biến (Pháp, Đức, Tây Ban Nha, Bồ Đào Nha, Ý và Hà Lan). Nếu một khung bằng ngôn ngữ của bạn không bị gỡ, hãy [mở một issue](https://github.com/Bishop-V/anubis/issues) kèm đúng nội dung tiêu đề của khung.

## Chặn câu trả lời AI ngay từ đầu

Việc gỡ một khung sau khi công cụ tìm kiếm gửi nó phụ thuộc vào việc nhận ra khung đó. Google có chế độ xem riêng không có AI, và Anubis có thể dùng nó:

- **Google:** **Luôn mở thẻ Web** mở chế độ xem “Web” riêng của Google (chế độ ở **Thêm → Web**), chỉ hiện các liên kết thuần túy, không có Tổng quan do AI tạo và không có khung nào cả. Đây là một nút gạt riêng vì nó gỡ mọi thứ không phải là liên kết, kể cả các khung bạn có thể muốn. Để xem trang thông thường cho một lần tìm kiếm, hãy chọn **Tất cả** phía trên kết quả.
