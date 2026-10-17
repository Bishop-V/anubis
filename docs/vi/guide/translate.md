# Giúp dịch

::: warning Dịch máy: hãy dùng thận trọng
Anubis được viết bằng tiếng Anh, ngôn ngữ duy nhất được hỗ trợ đầy đủ. Các ngôn ngữ dưới đây là bản dịch máy chưa được người bản ngữ nào kiểm tra. Nếu một bản dịch khiến bạn không chắc, hãy đặt trình duyệt sang tiếng Anh.
:::

Anubis dùng ngôn ngữ của trình duyệt. Thông điệp mà bản dịch thiếu, hoặc có tiếng Anh đã thay đổi, sẽ hiện bằng tiếng Anh. Tên nhãn giữ nguyên như danh sách đã viết.

## Các ngôn ngữ dịch máy

| Ngôn ngữ | Thư mục | Người bản ngữ đã kiểm tra |
| --- | --- | --- |
| Tiếng Ả Rập | `ar` | Chưa |
| Tiếng Bengal | `bn` | Chưa |
| Tiếng Trung (Giản thể) | `zh_CN` | Chưa |
| Tiếng Trung (Phồn thể) | `zh_TW` | Chưa |
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

Tiếng Urdu chỉ có trên Firefox. Nếu bạn nói một trong các ngôn ngữ này, sửa nó là việc giúp ích nhất.

## Cách dịch

Mỗi ngôn ngữ là một thư mục trong [kho mã](https://github.com/Bishop-V/anubis), `locales/<code>/`, chứa `messages.json`. Gửi thay đổi dưới dạng pull request.

- **Sửa một ngôn ngữ:** sửa `messages.json` của nó, rồi chạy `node scripts/locales.mjs record <code> <key>` cho mỗi thông điệp bạn đã đổi. Ghi trong pull request rằng bạn nói ngôn ngữ đó.
- **Thêm một ngôn ngữ:** sao chép `public/_locales/en/messages.json` vào `locales/<code>/` (mã như `de` hoặc `pt_BR`), dịch mỗi `message`, đặt `langCode`, rồi chạy `node scripts/locales.mjs record <code>`.

`node scripts/locales.mjs status` liệt kê các thông điệp có tiếng Anh đã thay đổi.

## Những gì cần giữ

- **Chỗ giữ chỗ** như `$1`, theo bất kỳ thứ tự nào. Viết ký hiệu đô la thật là `$$`.
- **Số đếm:** thêm các dạng số nhiều ngôn ngữ của bạn dùng (`_one`, `_few`, `_other`, v.v.).
- **Tên** của Anubis, công cụ tìm kiếm và trình duyệt. Với các khung của công cụ tìm kiếm như “People also ask”, hãy dùng tên mà công cụ hiện trong ngôn ngữ của bạn.
- **Một từ cho mỗi thứ hạng:** Ẩn, Hạ, Bình thường, Nâng và Ghim.

## Những gì giữ bằng tiếng Anh

Báo cáo gửi cho người duy trì danh sách, tệp danh sách, và các trang wiki dành cho người xuất bản danh sách. Phần hướng dẫn của wiki cũng có bản dịch máy tiếng Việt, tiếng Đức và tiếng Trung.

## Kiểm tra bản dịch

Dựng bằng `npm run build` (xem [`DEVELOPMENT.md`](https://github.com/Bishop-V/anubis/blob/main/DEVELOPMENT.md)) và nạp vào trình duyệt đặt sang ngôn ngữ của bạn. Kiểm tra cửa sổ bật lên và Cài đặt ở chiều rộng hẹp.
