# Quyền riêng tư và quyền hạn

::: warning Bản dịch
Đây là bản dịch máy của trang chính sách quyền riêng tư của Anubis. Nếu bản dịch và [bản tiếng Anh](../../guide/privacy.md) khác nhau, bản tiếng Anh được ưu tiên.
:::

Anubis không có máy chủ do nhà phát triển vận hành. Nó đọc kết quả tìm kiếm và địa chỉ của thẻ hiện tại trong trình duyệt của bạn để áp dụng lựa chọn của bạn; nó không gửi dữ liệu duyệt web đó cho nhà phát triển. Cài đặt của bạn nằm trong trình duyệt của bạn, trừ khi bạn kết nối một máy chủ lưu trữ của riêng mình để đồng bộ hóa giữa các trình duyệt.

## Anubis dùng dữ liệu như thế nào

Anubis chỉ dùng thông tin truy cập qua các quyền của trình duyệt cho những tính năng hướng đến người dùng: áp dụng thứ hạng và nhãn của bạn cho kết quả tìm kiếm, hiện cài đặt của trang web hiện tại trong cửa sổ bật lên, tải xuống các danh sách đã đăng ký, và đồng bộ hóa với máy chủ WebDAV bạn kết nối. Anubis không gửi thông tin này cho nhà phát triển và không dùng nó cho quảng cáo. Anubis không có máy chủ đồng bộ hóa riêng.

Việc sử dụng này tuân thủ Chính sách dữ liệu người dùng của Chrome Web Store, gồm cả các yêu cầu về Sử dụng hạn chế.

## Những gì được lưu, và ở đâu

- **Danh sách, cài đặt, lựa chọn nhãn và lượt đăng ký của bạn** được giữ trong bộ nhớ đồng bộ hóa của trình duyệt. Nếu bạn đã đăng nhập trình duyệt (tài khoản Firefox hoặc Google) với đồng bộ hóa đang bật, trình duyệt sao chép chúng sang các máy tính khác của bạn. Anubis không bao giờ thấy chúng. Nếu danh sách của bạn quá lớn so với bộ nhớ đồng bộ hóa, nó chỉ được giữ trên máy tính này. Xem [Đồng bộ hóa giữa các máy tính](./sync.md).
- **Địa chỉ và thông tin đăng nhập của máy chủ đồng bộ hóa**, nếu bạn kết nối một máy chủ để đồng bộ hóa giữa các trình duyệt, chỉ được lưu trong trình duyệt đó, không bao giờ trong đồng bộ hóa của trình duyệt. Anubis gửi thông tin đăng nhập đến máy chủ đó để đăng nhập; nó không nằm trong tệp đồng bộ hóa. Nếu bạn bật mã hóa đầu cuối, cụm mật khẩu của nó cũng chỉ được lưu trong trình duyệt đó để việc đồng bộ hóa tự động có thể giải mã và mã hóa tệp.
- **Các danh sách đã tải xuống** chỉ được giữ trên máy tính này, và được tải lại ở nơi khác.

## Anubis kết nối với những gì

Chỉ những nơi sau:

- **Các danh sách bạn đăng ký**, từ nơi chúng được lưu trữ, để kiểm tra phiên bản mới mỗi ngày một lần, hoặc ít hơn khi danh sách yêu cầu (các danh sách của chính Anubis: mỗi tuần một lần). Việc này bắt đầu khi bạn cài đặt Anubis, vì nó đăng ký cho bạn bảy danh sách được lưu trữ trong kho GitHub của nó: năm danh sách của riêng nó và hai danh sách nó tạo từ dữ liệu của các dự án khác. Bạn có thể tắt chúng trong **Cài đặt → Danh sách**.
- **Thư mục danh sách** trên GitHub, khi bạn mở **Cài đặt → Danh sách**, để **Danh sách khác** hiện những danh sách mới nhất.
- **Công cụ tìm kiếm bạn đang dùng**, cho [Tải thêm kết quả](./more-results.md), tải trang tiếp theo của nó như liên kết “Next” sẽ làm. Nếu công cụ tìm kiếm gửi một trang không có kết quả, Anubis mở trang đó thêm một lần khuất tầm nhìn, giống như bạn tự mở nó.
- **Máy chủ WebDAV bạn kết nối để đồng bộ hóa giữa các trình duyệt**, nếu bạn làm vậy. Anubis gửi các trang web đã xếp hạng, cài đặt, lựa chọn nhãn và lượt đăng ký của bạn đến địa chỉ HTTPS bạn cung cấp, và không đâu khác. Mã hóa đầu cuối được bật theo mặc định cho các kết nối mới: khi được bật, máy chủ nhận một tệp đã mã hóa mà nó không đọc được. Bạn có thể tắt khi kết nối; các kết nối hiện có chưa mã hóa vẫn không mã hóa cho đến khi bạn bật. Nếu không mã hóa, người vận hành máy chủ đọc được tệp. Xem [Giữa các trình duyệt](./sync.md).
- **Trình theo dõi vấn đề của Anubis trên GitHub**, khi bạn chọn **Báo cáo sự cố**. Thao tác đó mở một issue mới trong một thẻ mới, điền sẵn phiên bản Anubis, trình duyệt của bạn cùng phiên bản của nó, và công cụ tìm kiếm bạn đang dùng, và không có gì từ chính trang. Không có gì được gửi trừ khi chính bạn gửi issue.
- **Các trình theo dõi vấn đề**, khi bạn chọn “Báo cáo với…” hoặc “Đề xuất với…”. Thao tác đó mở một trang trong một thẻ mới, với địa chỉ của kết quả (không gồm phần sau `?`, có thể mang chi tiết về lượt truy cập của bạn) và quy tắc đã khớp; không có gì được gửi trừ khi chính bạn gửi issue.

Việc tải một danh sách giống như mọi lượt tải khác: trang web lưu trữ nó thấy địa chỉ IP của bạn và tệp nào được yêu cầu. Anubis không gửi gì khác kèm theo: không cookie, không mã định danh, và không có gì về các lần tìm kiếm của bạn.

## Quyền hạn

Khi bạn cài đặt Anubis, trình duyệt của bạn yêu cầu:

- **Truy cập vào các trang web của công cụ tìm kiếm**, để Anubis có thể thay đổi các trang kết quả của chúng.
- **Truy cập vào [trang đăng ký](../../subscribe.md) của wiki này**, để một liên kết đăng ký có thể mở cài đặt của Anubis với danh sách đã điền sẵn. Trình duyệt gọi nó theo trang web chứa wiki này, `bishop-v.github.io`. Anubis chỉ đọc địa chỉ của liên kết ở đó.
- **Bộ nhớ**, để giữ danh sách và cài đặt của bạn.
- **Thẻ hiện tại, khi bạn mở cửa sổ bật lên trên thanh công cụ** (gọi là `activeTab`). Quyền này cho phép cửa sổ bật lên đọc địa chỉ của trang web bạn đang xem, để bạn xếp hạng nó. Nó không hiện cảnh báo khi cài đặt và kéo dài đến khi thẻ đó chuyển sang trang khác.

Anubis không chạy trên trang web nào khác.

Anubis cũng có thể hỏi, vào lúc bạn đăng ký, để **đọc từ một trang web** lưu trữ danh sách. Điều đó cần thiết cho các danh sách lưu trữ ở bất kỳ nơi nào ngoài GitHub hoặc gist. Anubis hỏi tương tự cho máy chủ đồng bộ hóa, vào lúc bạn kết nối. Bạn có thể thu hồi cả hai trong cài đặt tiện ích của trình duyệt.

Trong các phiên bản Firefox được hỗ trợ, Anubis khai báo không thu thập dữ liệu bắt buộc và chỉ xin sự đồng ý tùy chọn về hoạt động duyệt web khi bạn kết nối máy chủ đồng bộ hóa. Khi đó Firefox hỏi liệu Anubis có được gửi danh sách của bạn đến đó không. **Ngắt kết nối** thu hồi sự đồng ý đó.

## Câu hỏi

Trang này là chính sách quyền riêng tư của Anubis, và các trang giới thiệu trên Chrome Web Store và Firefox Add-ons liên kết đến bản tiếng Anh của nó. Nếu có thay đổi, thay đổi nằm trong [lịch sử của trang trên GitHub](https://github.com/Bishop-V/anubis/commits/main/docs/guide/privacy.md). Hãy hỏi bất cứ điều gì về chính sách này bằng cách [mở một issue](https://github.com/Bishop-V/anubis/issues).
