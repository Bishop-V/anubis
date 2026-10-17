# Xuất bản danh sách

Danh sách là một tệp văn bản trong kho mã công khai. Mọi người đóng góp qua issue và pull request.

## 1. Viết

Bắt đầu từ **Cài đặt → Sao lưu → Tải danh sách của tôi xuống**, hoặc tự viết:

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

Thêm nó vào một kho mã công khai trên GitHub, GitLab hoặc Codeberg, hoặc một gist. Tên kết thúc bằng `.anubis` sẽ dễ nhận ra.

## 3. Chia sẻ liên kết

Mọi người dán nó vào **Cài đặt → Danh sách → Thêm danh sách**, hoặc dùng [liên kết đăng ký](../../subscribe.md#make-a-subscribe-link) một lần nhấn.

## 4. Nhận báo lỗi và đề xuất trang web

Đặt `! issues:` thành trình theo dõi của bạn, và người đăng ký sẽ có nút **đề xuất thay đổi**.

## 5. Thêm vào thư mục

Mở một pull request thêm nó vào [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json). Xem [Thư mục danh sách](../../lists.md).
