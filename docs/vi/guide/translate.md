# Giúp dịch

::: warning Bản dịch máy: hãy dùng cẩn thận
Anubis được viết bằng tiếng Anh, ngôn ngữ duy nhất nó hỗ trợ đầy đủ. Anubis cũng có bản **tiếng Ả Rập, Bengal, Trung (giản thể), Trung (phồn thể), Pháp, Đức, Hindi, Indonesia, Ý, Nhật, Hàn, Bồ Đào Nha (Brazil), Nga, Tây Ban Nha, Thổ Nhĩ Kỳ, Urdu và Việt**, nhưng các bản dịch đó do máy dịch và chưa có người nói ngôn ngữ ấy kiểm tra. Một số từ có thể sai hoặc khó hiểu, nên hãy dùng cẩn thận. Khi bạn xếp hạng hoặc ẩn các trang web, **Lý do** trong menu của kết quả và bản tóm tắt phía trên kết quả cho biết chính xác điều gì đã xảy ra; nếu bản dịch khiến bạn không chắc, hãy xem bản tiếng Anh. Để xem Anubis bằng tiếng Anh, hãy đặt ngôn ngữ của trình duyệt là tiếng Anh.
:::

Giao diện của Anubis bằng tiếng Anh. Mọi từ nó hiển thị đều có thể dịch: cửa sổ bật lên trên thanh công cụ, phần cài đặt, trang chào mừng và những gì nó thêm vào trang tìm kiếm. Trình duyệt chọn bản dịch theo ngôn ngữ của chính nó, và bất cứ thứ gì bản dịch bỏ sót vẫn ở tiếng Anh. Ở mọi ngôn ngữ trừ tiếng Anh, Cài đặt, trang chào mừng và cửa sổ bật lên trên thanh công cụ đều nói rằng bản dịch là của máy, kèm liên kết đến trang này.

Wiki này cũng có bản tiếng Việt (bản dịch máy, chưa được người nói tiếng Việt kiểm tra) trong thư mục `docs/vi/` của kho. Các trang kỹ thuật dành cho người xuất bản danh sách và người đóng góp, như định dạng danh sách, thư mục danh sách, trang đăng ký và các thử nghiệm, vẫn bằng tiếng Anh.

## Các ngôn ngữ dịch máy

| Ngôn ngữ | Thư mục | Đã được người nói kiểm tra |
| --- | --- | --- |
| Tiếng Ả Rập | `ar` | Chưa |
| Tiếng Bengal | `bn` | Chưa |
| Tiếng Trung (giản thể) | `zh_CN` | Chưa |
| Tiếng Trung (phồn thể) | `zh_TW` | Chưa |
| Tiếng Pháp | `fr` | Chưa |
| Tiếng Đức | `de` | Chưa |
| Tiếng Hindi | `hi` | Chưa |
| Tiếng Indonesia | `id` | Chưa |
| Tiếng Ý | `it` | Chưa |
| Tiếng Nhật | `ja` | Chưa |
| Tiếng Hàn | `ko` | Chưa |
| Tiếng Bồ Đào Nha (Brazil) | `pt_BR` | Chưa |
| Tiếng Nga | `ru` | Chưa |
| Tiếng Tây Ban Nha | `es` | Chưa |
| Tiếng Thổ Nhĩ Kỳ | `tr` | Chưa |
| Tiếng Urdu | `ur` | Chưa |
| Tiếng Việt | `vi` | Chưa |

Chrome không có giao diện tiếng Urdu riêng, nên tiếng Urdu chỉ hiện trong Firefox.

Chúng được dịch máy từ tiếng Anh với một bộ từ cố định: năm thứ hạng, “nhãn”, “danh sách” và tên mà các công cụ tìm kiếm đặt cho các khung của chúng trong từng ngôn ngữ. Khi bản tiếng Anh của một thông điệp thay đổi, bản dịch của nó đã lỗi thời, và Anubis hiện thông điệp đó bằng tiếng Anh cho đến khi có người dịch lại, nên bạn không bao giờ đọc phải nghĩa cũ. Các danh sách và nhãn chúng gắn cho trang web do tác giả của chúng viết, thường bằng tiếng Anh, nên tên nhãn giữ nguyên như danh sách đã viết.

Nếu bạn nói một trong các ngôn ngữ này, sửa bản dịch là việc hữu ích nhất để làm trước: xem bên dưới.

## Cách dịch

Một bản dịch là một thư mục, `locales/<ngôn ngữ>/` trong [kho của Anubis](https://github.com/Bishop-V/anubis), chứa `messages.json`, theo định dạng trình duyệt dùng cho mọi tiện ích, và `sources.json`, bản tiếng Anh mà mỗi thông điệp được dịch từ đó. Cho đến khi có dự án dịch thuật được lưu trữ, hãy gửi bản dịch dưới dạng pull request:

1. Sao chép `public/_locales/en/messages.json` sang `locales/<ngôn ngữ>/messages.json`, trong thư mục đặt theo mã ngôn ngữ của bạn, với dấu gạch dưới trước mã vùng: `de`, `fr`, `pt_BR`, `zh_CN`, `zh_TW`. Trình duyệt chỉ dùng [các mã chúng biết](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales).
2. Dịch từng `message`. Bạn có thể bỏ các `description`; trong tiếng Anh, phần mô tả cho biết văn bản xuất hiện ở đâu và mỗi `$1` hay `$2` đại diện cho gì.
3. Đặt `langCode` là mã ngôn ngữ của bạn, giống tên thư mục.
4. Chạy `node scripts/locales.mjs record <ngôn ngữ>`. Lệnh này ghi `sources.json`, để về sau Anubis biết khi nào tiếng Anh đã thay đổi.
5. Mở một pull request. Một bước kiểm tra bảo đảm mọi khóa đều có trong tiếng Anh, mọi ký hiệu giữ chỗ được giữ lại, và mỗi thông điệp cho biết nó đến từ bản tiếng Anh nào.

Bạn không cần dịch mọi thứ cùng lúc: bỏ qua một thông điệp thì nó hiện bằng tiếng Anh.

### Sửa một bản dịch máy

Hãy sửa `message` trong `locales/<ngôn ngữ>/messages.json`, và nói trong pull request rằng bạn nói ngôn ngữ đó. Khi bạn đã đọc hết một ngôn ngữ, hãy đổi “Chưa” trong bảng ở trên. `node scripts/locales.mjs status` liệt kê các thông điệp có bản tiếng Anh đã thay đổi kể từ khi được dịch; hãy dịch lại từng thông điệp, rồi chạy `node scripts/locales.mjs record <ngôn ngữ> <khóa>` cho nó.

## Những gì cần giữ

- **Ký hiệu giữ chỗ.** `$1`, `$2` và tiếp theo được điền bằng một trang web, một số hoặc một tên. Hãy giữ từng ký hiệu, theo thứ tự ngôn ngữ của bạn cần. Dấu đô la không phải ký hiệu giữ chỗ được viết là `$$`.
- **Số đếm.** Các thông điệp kết thúc bằng `_one` và `_other` là các dạng của số đếm: “1 danh sách”, “2 danh sách”. Hãy thêm các dạng ngôn ngữ của bạn dùng, đặt tên theo [quy tắc số nhiều của Unicode](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html): `_zero`, `_one`, `_two`, `_few`, `_many` và `_other`. Tiếng Việt chỉ có `_other`.
- **Tên riêng.** Anubis, các công cụ tìm kiếm, các trình duyệt và những dự án khác (uBlacklist, HOHSER, Brave Goggles) giữ nguyên tên. Khi một thông điệp gọi tên một phần của trang công cụ tìm kiếm, như “AI Overview” hay “People also ask” của Google, hãy dùng tên mà công cụ hiện trong ngôn ngữ của bạn.
- **Các từ chỉ thứ hạng.** Thứ hạng của một trang web luôn là Ẩn, Hạ, Bình thường, Nâng hoặc Ghim ở mọi nơi trong Anubis. Hãy chọn một từ cho mỗi thứ hạng và dùng nhất quán. Với ngôn ngữ có từ dài, hãy đặt dấu gạch nối mềm (U+00AD) trong đó, để hàng thứ hạng trong menu của kết quả có thể ngắt chúng đúng chỗ.

## Những gì vẫn bằng tiếng Anh

- **Báo cáo và đề xuất gửi cho người duy trì danh sách.** Khi bạn báo cáo lỗi của một danh sách hoặc đề xuất một trang web cho nó, issue mà Anubis điền sẵn bằng tiếng Anh, vì người duy trì danh sách có thể không đọc ngôn ngữ của bạn.
- **Tệp danh sách.** Danh sách của riêng bạn, như Anubis khởi tạo, và các danh sách bạn đăng ký do tác giả của chúng viết.
- **Các trang kỹ thuật của wiki và trang giới thiệu trên cửa hàng.** Các trang này được dịch riêng, sau.

## Kiểm tra bản dịch của bạn

Hãy dựng Anubis với tệp của bạn (`npm run build`; xem [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)), và tải nó trong một trình duyệt đặt sang ngôn ngữ của bạn; `ANUBIS_LANG=<mã> node e2e/run.mjs responsive` kiểm tra Cài đặt ở chiều rộng điện thoại trong ngôn ngữ đó. Trong Firefox, thêm ngôn ngữ của bạn tại Cài đặt → Chung → Ngôn ngữ; trong Chrome, chọn nó tại Cài đặt → Ngôn ngữ, hoặc khởi động Chrome với `--lang=<mã>`. Hãy xem cửa sổ bật lên và phần cài đặt ở chiều rộng hẹp, vì một từ dài hơn có thể đẩy nút xuống dòng thứ hai.

Tiếng Ả Rập và tiếng Urdu được viết từ phải sang trái: các trang của Anubis, và những gì nó thêm vào trang tìm kiếm, đổi hướng theo. Hãy kiểm tra cả ngôn ngữ viết từ phải sang trái ở chiều rộng hẹp.
