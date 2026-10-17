# Đăng ký danh sách

Một danh sách gắn nhãn, nâng, hạ hoặc ẩn các trang web giúp bạn. Ai cũng có thể xuất bản một danh sách: đó là một tệp văn bản trong kho Git, một gist, hoặc bất kỳ địa chỉ web công khai nào. Không có máy chủ Anubis nào ở giữa.

Anubis bắt đầu với năm danh sách nhỏ đi kèm: **Official docs**, **Discussions**, **Reference**, **Paywalls** và **FOSS tools**. Chúng chủ yếu thêm nhãn. **FOSS tools** gắn nhãn FOSS cho LibreSpeed và cobalt.tools, và làm cho nhãn **AI slop** có sẵn cho các trang web bạn tự chọn để gắn nhãn.

Anubis cũng bắt đầu với hai [danh sách được tạo từ các dự án khác](#danh-sách-được-tạo-từ-các-dự-án-khác), được tải xuống khi cài đặt: **AI content** và **Independent wikis**. Các bản Anubis đã cài trước khi hai danh sách này ra đời sẽ đăng ký chúng, và bật lại mọi danh sách khởi đầu, một lần, khi cập nhật. Hãy tắt bất kỳ danh sách nào trong **Cài đặt → Danh sách**.

<!-- Maintainer: Vietnamese translation of docs/guide/lists.md. The screenshot is the English one, from the mock Settings page. -->

![Cài đặt, Danh sách](../../img/options-lists.png)

## Đăng ký

- **Từ thư mục:** **Cài đặt → Danh sách → Danh sách khác** hiện các danh sách người khác đã xuất bản. Nhấn **Đăng ký** ở một danh sách. Thư mục bỏ qua những danh sách bạn đã có, và những danh sách được tạo từ cùng nguồn với một danh sách bạn có.
- **Từ web:** **Subscribe** trên trang [Thư mục danh sách](../../lists.md) (bằng tiếng Anh), hoặc một liên kết đăng ký trên trang riêng của danh sách, mở cài đặt của Anubis với danh sách đã điền sẵn. Hãy kiểm tra đó là danh sách bạn mong đợi, rồi nhấn **Đăng ký** ở đó để thêm nó.
- **Từ địa chỉ:** dán địa chỉ của danh sách vào **Thêm danh sách** và nhấn **Đăng ký**. Liên kết đến trang của một tệp trên GitHub, GitLab hoặc Codeberg, liên kết gist và liên kết Goggle của Brave Search đều dùng được; Anubis tìm ra tệp gốc.

Các danh sách lưu trữ trên GitHub hoặc trong gist được tải xuống ngay. Với danh sách lưu trữ ở nơi khác, trình duyệt sẽ hỏi bạn có cho phép Anubis đọc từ trang web đó hay không.

## Danh sách nào dùng được

- Danh sách Anubis (tệp `.anubis`)
- [Brave Goggles](https://github.com/brave/goggles-quickstart)
- Bộ quy tắc [uBlacklist](https://github.com/iorate/ublacklist)
- Danh sách tên miền thuần túy, mỗi dòng một tên, và tệp hosts

Anubis tự nhận ra định dạng. Các quy tắc nó không dùng được, như biểu thức tiêu đề của uBlacklist, bị bỏ qua và được đếm dưới danh sách trong phần cài đặt.

::: warning Lăng kính
Một số Brave Goggle là *lăng kính*: chúng ẩn mọi kết quả mà chúng không nhắc đến, nên lần tìm kiếm chỉ hiện các trang web có trong danh sách. Anubis đánh dấu chúng bằng “lăng kính” để bạn không đăng ký một danh sách như vậy ngoài ý muốn.
:::

## Cập nhật

Anubis kiểm tra các phiên bản mới của danh sách khi trình duyệt khởi động và khi bạn tìm kiếm, tối đa mỗi 30 phút một lần. Mỗi danh sách cho biết nó muốn được kiểm tra bao lâu một lần (thường là mỗi ngày). **Cập nhật tất cả** trong **Cài đặt → Danh sách** kiểm tra ngay lập tức.

## Danh sách được tạo từ các dự án khác

Một số danh sách trong thư mục được tạo từ dữ liệu mà các dự án khác thu thập. Mỗi tuần, Anubis biến dữ liệu đó thành một danh sách và xuất bản, nên nó luôn cập nhật giữa các bản phát hành của Anubis. Mỗi danh sách ghi tên nguồn và liên kết đến nguồn trong **Cài đặt → Danh sách**.

| Danh sách | Được tạo từ | Nó làm gì |
| --- | --- | --- |
| **AI content** | [HUGE AI Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist) của laylavish (CC0) | Gắn nhãn **AI-generated** cho các trang web chủ yếu gồm văn bản hoặc hình ảnh do AI tạo, và **Some AI content** cho các trang web pha trộn giữa tác phẩm thật và do AI tạo. Các trang web mà blocklist xếp vào nhóm trang nội dung rác hoặc thư rác cũng được gắn nhãn **AI slop**. Danh sách không bao giờ di chuyển hay ẩn gì trừ khi bạn chọn điều đó cho một nhãn. |
| **Official docs (DevDocs)** | [DevDocs](https://github.com/freeCodeCamp/devdocs) của những người đóng góp (MPL-2.0) | Gắn nhãn **Official docs** cho các trang tài liệu mà DevDocs tập hợp và nâng chúng lên một chút, như danh sách Official docs. Danh sách bao gồm khoảng 210 trang web, trong đó có MDN và tài liệu của Python, Rust và React. |
| **Self-hosted FOSS** | [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) của những người đóng góp (CC BY-SA 3.0) | Gắn nhãn **FOSS** cho trang web của khoảng 1.000 chương trình miễn phí bạn có thể tự chạy, cùng nhãn với danh sách FOSS tools. Các chương trình theo giấy phép không tự do bị loại. Danh sách không bao giờ di chuyển hay ẩn gì. |
| **Independent wikis** | [Indie Wiki Buddy](https://github.com/KevinPayravi/indie-wiki-buddy) của Kevin Payravi (MIT) | Nâng các wiki độc lập, gắn nhãn **Independent wiki**, và hạ các wiki Fandom, Fextralife và Neoseeker mà chúng thay thế, gắn nhãn **Has independent wiki**. |

Để thêm một trang web vào một trong các danh sách này, hoặc để gỡ một trang, hãy đóng góp cho dự án nguồn của nó qua các liên kết ở trên. Anubis sao chép dữ liệu nguyên trạng, và bản cập nhật hằng tuần tiếp theo sẽ đưa thay đổi vào. **Sai? Báo cáo** trong menu của kết quả mở một issue trên trình theo dõi vấn đề của dự án đó.

Để ngừng dùng một danh sách, hãy hủy đăng ký hoặc tắt nó như mọi danh sách. Để giữ danh sách nhưng bỏ một nhãn của nó, hãy tắt nhãn đó trong **Cài đặt → Nhãn**, hoặc chọn nhãn làm gì ở đó.

## Tắt, hoặc hủy đăng ký

Mỗi danh sách trong **Các danh sách của bạn** có một nút gạt để tắt tạm thời và một nút để hủy đăng ký. Việc hủy đăng ký diễn ra ngay, với **Hoàn tác** bên cạnh thông báo trong vài giây. Thứ hạng do chính bạn đặt luôn thắng mọi danh sách, nên để bác bỏ một danh sách về một trang web, hãy tự xếp hạng trang web đó.

## Báo cáo lỗi trong danh sách

Nếu một danh sách ẩn, xếp hạng hoặc gắn nhãn sai một trang web, hãy mở menu của kết quả. Dưới **Lý do**, “Sai? Báo cáo với *tên danh sách*” mở một issue điền sẵn trên trình theo dõi vấn đề của danh sách, kèm quy tắc đã khớp và địa chỉ của kết quả. Hãy nói điều gì cần thay đổi, rồi gửi. Không có gì được gửi cho đến khi chính bạn gửi nó.

Điều này dùng được cho các danh sách xuất bản trong kho GitHub, GitLab hoặc Codeberg, và cho các danh sách tự nêu trình theo dõi vấn đề của mình. Để bác bỏ một danh sách ngay lập tức, hãy tự xếp hạng trang web; một báo cáo giúp danh sách được sửa cho mọi người.

## Đề xuất một trang web cho danh sách

Khi bạn đã tự xếp hạng hoặc gắn nhãn cho một trang web, menu của kết quả đề xuất “Đề xuất với *tên danh sách*” cho các danh sách nhận đề xuất mà chưa nhắc đến trang web đó. Nó mở một issue điền sẵn trên GitHub, GitLab hoặc Codeberg để bạn kiểm tra và gửi. Không có gì được gửi cho đến khi chính bạn gửi nó.
