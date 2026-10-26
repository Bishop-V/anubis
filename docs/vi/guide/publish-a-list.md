# Xuất bản danh sách

Danh sách là một tệp văn bản trong kho mã công khai. Mọi người đóng góp qua issue và pull request.

## 1. Viết

Trong **Cài đặt → Sao lưu → Xuất bản danh sách của bạn**, điền tên, mô tả và tác giả, rồi nhấn **Tải danh sách của tôi xuống**. Hoặc tự viết:

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

Cho mỗi trang web được gắn nhãn một chú thích `#` nói lý do. Danh sách chỉ gắn nhãn là thân thiện nhất: người đăng ký tự chọn nhãn làm gì. Dùng lại [mã nhãn có sẵn](../../list-format.md#tags) khi phù hợp, và không bao giờ đổi một mã đã xuất bản. Xem [định dạng danh sách](../../list-format.md) (bằng tiếng Anh).

## 2. Đưa lên mạng

Tải nó lên một [gist](https://gist.github.com/), hoặc lên một kho mã công khai trên GitHub, GitLab hoặc Codeberg. Tên kết thúc bằng `.anubis` sẽ dễ nhận ra.

## 3. Chia sẻ liên kết

Mọi người dán nó vào **Cài đặt → Danh sách → Thêm danh sách**, hoặc dùng [liên kết đăng ký](../../subscribe.md#make-a-subscribe-link) một lần nhấn.

## 4. Cho phép đề xuất thay đổi

Điền địa chỉ trình theo dõi vấn đề của bạn vào **Nơi góp ý** trước khi tải xuống, hoặc vào dòng `! issues:`. Người đăng ký sẽ có nút **Đề xuất thay đổi** mở một issue điền sẵn tại đó, để thêm một trang web hoặc báo lỗi.

## 5. Thêm vào thư mục

Mở một pull request thêm nó vào [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json). Xem [Thư mục danh sách](../../lists.md).
