# Xuất bản danh sách

Danh sách là một tệp văn bản mà ai cũng có thể đăng ký. Bạn không cần máy chủ hay tài khoản Anubis: một kho Git công khai là cơ sở dữ liệu, còn issue và pull request là cách người khác đóng góp.

## 1. Viết danh sách

Cách nhanh nhất là bắt đầu từ danh sách của chính bạn. **Cài đặt → Sao lưu → Tải danh sách của tôi xuống** lưu mọi trang web bạn đã xếp hạng và gắn nhãn. Hoặc viết một danh sách từ đầu:

```
! name: Official docs
! description: Tags first-party documentation and nudges it up.
! issues: https://github.com/you/lists/issues
! license: CC0-1.0
! tag: docs | Official docs | #2f5fae

$site=developer.mozilla.org,tag=docs,boost=1 # MDN publishes first-party web platform documentation.
$site=docs.python.org,tag=docs,boost=1 # This is Python's official documentation.
```

Mỗi dòng sau phần đầu là một chỉ thị: những trang web nào, và làm gì với chúng. Hãy thêm một chú thích ngắn bắt đầu bằng `#` vào mọi quy tắc gắn nhãn cho trang web bạn thêm, giải thích vì sao trang web phù hợp. [Định dạng danh sách](../../list-format.md) (bằng tiếng Anh) có chi tiết.

Những danh sách chỉ gắn nhãn, và để mỗi người đăng ký tự quyết định việc xếp hạng, là thân thiện nhất khi xuất bản: người đăng ký có thể quyết định trong **Cài đặt → Nhãn** xem nhãn của bạn nâng, tô sáng hay ẩn.

Hãy dùng lại mã định danh nhãn mà các danh sách khác đã có khi phù hợp, để người đăng ký thấy một nhãn thay vì hai nhãn cùng nghĩa; [định dạng danh sách](../../list-format.md#tags) liệt kê những mã mà các danh sách của Anubis dùng. Sau khi xuất bản, hãy giữ nguyên từng mã định danh: để đổi tên một nhãn, hãy đổi nhãn hiển thị của nó.

## 2. Đưa lên mạng

Tạo một kho công khai trên GitHub, GitLab hoặc Codeberg, hoặc một gist, và thêm tệp vào. Tên tệp nào cũng được; kết thúc bằng `.anubis` giúp mọi người nhận ra nó.

## 3. Chia sẻ liên kết

Mọi người dán liên kết vào **Cài đặt → Danh sách → Thêm danh sách**. Liên kết đến trang của tệp dùng được; Anubis tìm ra tệp gốc. Các danh sách trên GitHub và gist được tải xuống mà không cần xin thêm quyền nào.

Để đăng ký chỉ bằng một lần nhấp, hãy chia sẻ [liên kết đăng ký](../../subscribe.md#make-a-subscribe-link): nó mở cài đặt của Anubis với danh sách của bạn đã điền sẵn.

## 4. Nhận thông tin về lỗi, và để mọi người đề xuất trang web

Khi danh sách của bạn xử lý sai một trang web, người đăng ký có thể chọn “Sai? Báo cáo với *danh sách của bạn*” trong menu trên kết quả đó. Thao tác này mở một issue điền sẵn trên trình theo dõi vấn đề của kho của bạn, kèm quy tắc đã khớp và địa chỉ của kết quả, để họ gửi đi. Điều này không cần cài đặt nào cho danh sách trên GitHub, GitLab hoặc Codeberg.

Hãy đặt `! issues:` là trình theo dõi vấn đề của bạn để người đăng ký cũng có thể đề xuất trang web: “Đề xuất với *danh sách của bạn*” khi đó xuất hiện trong menu trên các kết quả mà danh sách của bạn chưa nhắc đến. Các báo cáo cũng đến `! issues:`, nên hãy đặt nó nếu issue của chính kho của bạn đã bị tắt. Pull request hoạt động như với mọi kho.

## 5. Thêm vào thư mục

Để danh sách của bạn được đề xuất cho mọi người trong **Cài đặt → Danh sách → Danh sách khác**, hãy mở một pull request thêm nó vào [`lists/directory.json`](https://github.com/Bishop-V/anubis/blob/main/lists/directory.json). Trang [Thư mục danh sách](../../lists.md) (bằng tiếng Anh) cho thấy hiện có những gì.
