# Công cụ tìm kiếm

Anubis hoạt động trên kết quả web của các công cụ này. Hãy tắt bất kỳ công cụ nào trong **Cài đặt → Công cụ tìm kiếm**.

| Công cụ | Hỗ trợ | Tải thêm kết quả | Đã kiểm tra trên trang thật |
| --- | --- | --- | --- |
| Google (tên miền của mọi quốc gia) | Được hỗ trợ | Có | Có, kết quả và dọn dẹp. Bố cục điện thoại thì chưa. |
| DuckDuckGo | Được hỗ trợ | Có | Có |
| DuckDuckGo HTML và Lite | Được hỗ trợ | Không | Có |
| Bing | Được hỗ trợ | Có* | Có |
| Brave Search | Được hỗ trợ | Có | Có |
| Startpage | Được hỗ trợ | Có | Có |
| Ecosia | Được hỗ trợ | Có* | Có |
| Kagi | Được hỗ trợ | Không | Có |
| Yahoo | Được hỗ trợ | Có* | Có |
| Yandex | Được hỗ trợ | Có* | Có |
| Mojeek | Thử nghiệm | Không | Chưa |

Trên Firefox cho Android, nơi hỗ trợ còn ở mức thử nghiệm, Google, DuckDuckGo và Bing gửi cho điện thoại một bố cục riêng, và Anubis đọc từng bố cục. Ba công cụ này đã được thử trên điện thoại; bố cục điện thoại của các công cụ khác thì chưa.

**Được hỗ trợ** nghĩa là đã được thử trên trang thật. **Thử nghiệm** nghĩa là nó theo bố cục mà các công cụ khác có tài liệu mô tả nhưng chưa được thử trên trang thật, nên một số thứ có thể không hoạt động.

\* Bing, Ecosia, Yahoo và Yandex đôi khi trả lời yêu cầu lấy trang tiếp theo bằng bước kiểm tra “xác nhận bạn không phải là robot”. Khi đó Tải thêm kết quả dừng lại mà không nói lý do. Nếu điều đó xảy ra, hãy dùng liên kết Next của chính công cụ tìm kiếm.

Kết quả web chính được cân nhắc ở mọi nơi. Ngoài ra:

- **Các thẻ Hình ảnh, Video và Tin tức** được cân nhắc trên DuckDuckGo, Bing, Brave Search, Ecosia, Kagi, Startpage và Yandex (chỉ Video), và trên các thẻ Hình ảnh và Tin tức của Google. Thẻ Video của Google liệt kê kết quả như web, nên được cân nhắc như kết quả web. Hình ảnh và video được gắn nhãn và ẩn nhưng không sắp xếp lại, để lưới giữ nguyên hình dạng. Các mục bị ẩn không để lại khoảng trống. Chưa có thẻ nào trong số này được kiểm tra trên trang thật.
- **Được để yên:** các thẻ của Yahoo và Mojeek, các thẻ khác của Yandex, và mọi thẻ mua sắm.

## Cách tìm ra kết quả

Các công cụ tìm kiếm thay đổi diện mạo trang của chúng thường xuyên, và các tên nội bộ chúng dùng cũng đổi theo. Khi có thể, Anubis tìm kết quả qua hình dạng của chúng: một tiêu đề, liên kết bao quanh nó và khối nhỏ nhất chỉ chứa kết quả đó. Những thay đổi thiết kế nhỏ không làm hỏng cách này.

Với các công cụ mà tiêu đề không phải là phần tử heading, Anubis dùng các bố cục kết quả mà dự án [uBlacklist](https://github.com/ublacklist/builtin) luôn cập nhật.

## Khi một công cụ hỏng

Nếu kết quả trên một công cụ ngừng có nhãn hoặc nút, hoặc bản tóm tắt nằm sai chỗ, xem [Khắc phục sự cố](./troubleshooting.md).
