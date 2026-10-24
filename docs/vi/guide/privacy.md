# Quyền riêng tư và quyền hạn

Anubis không có máy chủ và không thu thập gì. Nó đọc kết quả tìm kiếm và địa chỉ của thẻ hiện tại ngay trong trình duyệt để áp dụng lựa chọn của bạn, và không bao giờ gửi chúng cho nhà phát triển.

## Cách Anubis dùng dữ liệu

Dữ liệu từ quyền của trình duyệt chỉ được dùng cho các tính năng của Anubis: xếp hạng và gắn nhãn kết quả, hiện trang web hiện tại trong cửa sổ bật lên, tải danh sách của bạn, và đồng bộ với máy chủ WebDAV bạn kết nối. Nó không bao giờ được gửi cho nhà phát triển hay dùng cho quảng cáo.

Việc sử dụng này tuân thủ Chính sách dữ liệu người dùng của Chrome Web Store, bao gồm các yêu cầu Sử dụng giới hạn (Limited Use).

## Những gì được lưu, và ở đâu

- **Trang web, cài đặt, lựa chọn nhãn và đăng ký của bạn:** trong bộ nhớ đồng bộ của trình duyệt, mà trình duyệt có thể sao chép sang máy khác. Xem [Đồng bộ hóa giữa các máy tính](./sync.md).
- **Địa chỉ, thông tin đăng nhập và cụm mật khẩu của máy chủ đồng bộ:** chỉ trong trình duyệt đó, không bao giờ trong đồng bộ trình duyệt hay tệp đồng bộ.
- **Danh sách đã tải:** chỉ trên máy này.

## Anubis kết nối tới đâu

Chỉ những nơi sau:

- **Các danh sách bạn đăng ký**, khoảng mỗi ngày một lần. Anubis bắt đầu với chín danh sách lưu trên GitHub; tắt chúng trong **Cài đặt → Danh sách**.
- **Thư mục danh sách** trên GitHub, khi bạn mở **Cài đặt → Danh sách**.
- **Công cụ tìm kiếm bạn đang dùng**, cho [Tải thêm kết quả](./more-results.md). Trên Ecosia, biểu tượng trang web của các kết quả đó đến từ dịch vụ biểu tượng của Ecosia.
- **Máy chủ WebDAV của bạn**, nếu bạn kết nối. Nó nhận trang web, cài đặt, lựa chọn nhãn và đăng ký của bạn, được mã hóa theo mặc định. Không mã hóa thì người vận hành đọc được.
- **Trình theo dõi issue**, khi bạn chọn **Báo cáo sự cố** (điền sẵn phiên bản Anubis, trình duyệt và công cụ tìm kiếm) hoặc **Đề xuất thay đổi** của một danh sách. Chúng mở trong thẻ mới, và không gì được gửi cho tới khi bạn tự gửi.

Nơi lưu danh sách thấy địa chỉ IP của bạn và tệp nào được yêu cầu, như mọi lượt tải. Không gửi gì khác.

## Quyền hạn

- **Các trang của công cụ tìm kiếm**, để thay đổi trang kết quả.
- **[Trang đăng ký](../../subscribe.md) của wiki này** (`bishop-v.github.io`), để liên kết đăng ký hoạt động. Anubis chỉ đọc địa chỉ của liên kết ở đó.
- **Bộ nhớ**, cho trang web và cài đặt của bạn.
- **Thẻ hiện tại, khi bạn mở cửa sổ bật lên** (`activeTab`), để đọc địa chỉ trang web.

Anubis không chạy trên trang nào khác. Nó chỉ xin đọc thêm một trang khi bạn đăng ký danh sách lưu ngoài GitHub, hoặc kết nối máy chủ đồng bộ. Trên Firefox, Anubis khai báo không thu thập dữ liệu bắt buộc nào, và chỉ xin đồng ý về hoạt động duyệt web khi bạn kết nối máy chủ đồng bộ; **Ngắt kết nối** rút lại sự đồng ý đó.

## Câu hỏi

Trang này là chính sách quyền riêng tư của Anubis; các trang trên cửa hàng liên kết tới [bản tiếng Anh](../../guide/privacy.md). Các thay đổi nằm trong [lịch sử trên GitHub](https://github.com/Bishop-V/anubis/commits/main/docs/guide/privacy.md). Hỏi bất cứ điều gì bằng cách [mở issue](https://github.com/Bishop-V/anubis/issues).
