# Đồng bộ hóa giữa các máy tính

Trang web, cài đặt, lựa chọn nhãn và đăng ký của bạn được đồng bộ qua trình duyệt. Để đồng bộ giữa Firefox và Chrome, hãy kết nối máy chủ WebDAV. Danh sách đã đăng ký không được sao chép; mỗi trình duyệt tự tải bản của mình.

## Đồng bộ hóa trình duyệt

Bật sẵn, qua tài khoản trình duyệt của bạn:

- **Firefox:** đăng nhập, và đánh dấu **Tiện ích** trong **Đồng bộ** ở phần cài đặt của Firefox.
- **Chrome:** đăng nhập với đồng bộ bật, và giữ **Tiện ích** trong mục đồng bộ.

Nó chỉ tới cùng loại trình duyệt trên máy khác. Firefox cho Android không đồng bộ dữ liệu tiện ích.

## Giữa các trình duyệt

Kết nối cùng một kho WebDAV trong mỗi trình duyệt. Anubis giữ một tệp ở đó, `anubis-sync.json`.

### Lấy địa chỉ và mật khẩu

Bạn cần địa chỉ WebDAV của dịch vụ, tên người dùng và mật khẩu ứng dụng.

| Dịch vụ | Địa chỉ | Mật khẩu ứng dụng |
| --- | --- | --- |
| **Koofr** (10 GB miễn phí) | `https://app.koofr.net/dav/Koofr` | **Preferences → Password → App passwords**. Tên người dùng là email của bạn. |
| **InfiniCLOUD** (20 GB miễn phí) | Trên trang tài khoản, trong **Apps Connection** | Cùng trang đó. |
| **Nextcloud** | `https://your-server/remote.php/dav/files/your-user-name/` | **Settings → Security → Devices & sessions**. |

Mọi máy chủ WebDAV qua `https://` đều dùng được.

### Kết nối

![Cài đặt, Đồng bộ hóa](../../img/options-sync.png)

1. Trong **Cài đặt → Đồng bộ hóa → Giữa các trình duyệt**, nhập địa chỉ, tên người dùng và mật khẩu.
2. Giữ **Mã hóa đầu cuối tệp đồng bộ hóa** bật, và chọn cụm mật khẩu ít nhất 12 ký tự. Dùng cùng một cụm trong mọi trình duyệt.
3. Nhấn **Kết nối**, và cho phép các yêu cầu của trình duyệt.
4. Làm lại trong trình duyệt kia.

Tệp được mã hóa bằng AES-256-GCM, nên máy chủ không đọc được. Nếu quên cụm mật khẩu, bản trên máy chủ không khôi phục được, nhưng mỗi trình duyệt vẫn giữ dữ liệu của nó.

### Đổi cụm mật khẩu

Dùng **Đổi cụm mật khẩu mã hóa** trong **Cài đặt → Đồng bộ hóa**, rồi nhập cụm mới trong mọi trình duyệt khác.

### Khi nào đồng bộ

Vài giây sau một thay đổi, khi trình duyệt khởi động, và khi bạn tìm kiếm, tối đa mỗi 5 phút. **Đồng bộ hóa ngay** đồng bộ ngay lập tức.

### Thay đổi từ cả hai trình duyệt

Thay đổi từ cả hai trình duyệt được gộp lại. Nếu cả hai đổi cùng một thứ, trình duyệt đồng bộ sau cùng thắng.

### Ngắt kết nối

**Ngắt kết nối** dừng đồng bộ trong trình duyệt đó. Dữ liệu của bạn vẫn còn, tệp trên máy chủ cũng vậy.

## Giới hạn

- Đồng bộ trình duyệt chứa được khoảng 10.000 trang web. Vượt quá, trang web của bạn ở lại máy đó; WebDAV không có giới hạn.
- Danh sách lưu ngoài GitHub cần quyền trong mỗi trình duyệt: nhấn ↻ của nó trong **Cài đặt → Danh sách**.
- Để chuyển một lần, hãy [xuất bản sao lưu](./import-and-backup.md) và khôi phục nó.

## Quyền riêng tư

Đồng bộ trình duyệt đi qua tài khoản trình duyệt của bạn. Máy chủ WebDAV nhận tệp đồng bộ và thông tin đăng nhập của bạn. Cụm mật khẩu không bao giờ được gửi đi. Xem [Quyền riêng tư và quyền hạn](./privacy.md).
