# Xếp hạng trang web

Mỗi trang web có một *thứ hạng*, do bạn chọn từ vòng chỉ báo trên bất kỳ kết quả nào của nó, từ cửa sổ bật lên trên thanh công cụ, hoặc trong **Cài đặt → Trang web của bạn**.

<!-- Maintainer: Vietnamese translation of docs/guide/ranking.md. RankDemo (docs/.vitepress/theme/rank-demo.ts) draws a site being pinned and another lowered, and the picture below, for reading on GitHub, is hidden. The screenshots are the English ones. -->

<RankDemo />

<div class="github-only">

![Một kết quả với các nhãn, và vòng chỉ báo quanh biểu tượng của trang web](../../img/result.png)

</div>

Trên máy tính, mỗi kết quả có một vòng chỉ báo: một nửa vòng tròn quanh biểu tượng của trang web, với một chiếc vương miện nhỏ ở bên trái. Nhấn vào vương miện để mở menu của kết quả. Nửa vòng tròn được tô từ giữa theo thứ hạng của trang web: lên trên với trang được nâng và xuống dưới với trang bị hạ, trang di chuyển càng nhiều bậc thì tô càng xa, và kín cả vòng với trang được ghim. Với trang Bình thường hoặc bị ẩn, nó để trống. Khi kết quả không có biểu tượng trang web, vòng chỉ báo bao quanh một hình tròn màu xám trơn. Trên kết quả hình ảnh và video, vòng chỉ báo là một ô nhỏ màu tối ở góc trên bên phải của ảnh, với cùng chiếc vương miện và một vạch dọc được tô theo cùng cách. Trên điện thoại, kết quả có một nút ⚖ ở cuối tiêu đề thay vào đó, với chiếc cân nghiêng theo thứ hạng. Kết quả không có nhãn “Đã nâng” hay “Đã hạ” riêng, vì vòng chỉ báo đã cho thấy thứ hạng của nó. Một nhãn làm kết quả di chuyển hoặc bị ẩn [hiện điều đó thay cho hình thoi của nó](./tags.md).

Chiếc cân trong menu cân nhắc mọi thứ cùng nhau: thứ hạng của bạn, các nhãn của bạn và các danh sách của bạn. Kết quả di chuyển càng xa thì cân nghiêng càng nhiều, nên một trang web bạn đã nâng hai lần, hoặc có hai nhãn bạn đặt là Nâng, nghiêng nhiều hơn một lần nâng.

| Thứ hạng | Điều xảy ra với kết quả của trang web |
| --- | --- |
| **Ẩn** | Chúng biến mất, hoặc thu lại thành một dòng bạn có thể mở (xem phần Kết quả bị ẩn bên dưới). |
| **Hạ** | Chúng xuống năm bậc. Chọn lại để xuống mười bậc, và mũi tên có thêm mũi tên thứ hai. Lần nhấn thứ ba đưa về như cũ. |
| **Bình thường** | Bỏ thứ hạng do bạn đặt, nên các nhãn và danh sách của bạn cân nhắc trang web như khi không có nó. |
| **Nâng** | Chúng lên năm bậc. Chọn lại để lên mười bậc, và mũi tên có thêm mũi tên thứ hai. Lần nhấn thứ ba đưa về như cũ. |
| **Ghim** | Chúng lên đầu, với viền xám mảnh. |

Nâng và Hạ cộng với mọi thứ khác cân nhắc trang web: các danh sách của bạn và [các nhãn bạn đặt là Ghim, Nâng hoặc Hạ](./tags.md). Nếu một danh sách hạ một trang web 3 bậc và bạn nâng nó, nó lên 2 bậc, và một nhãn nâng nó vẫn giữ dấu của mình. Ghim và Ẩn thay thế những gì các danh sách nói. Một nhãn bạn đặt là Ẩn không ẩn trang web mà bạn đã tự xếp hạng, nên xếp hạng một trang web là cách để giữ lại một trang mà nhãn Ẩn lẽ ra sẽ ẩn. Khi bạn đã xếp hạng một trang web, **Danh sách của bạn** xuất hiện trong các nhãn của nó trong menu, kèm dấu thứ hạng bạn đặt.

Sau một thay đổi từ menu, bản tóm tắt phía trên kết quả cho biết bạn đã làm gì (“Đã ẩn fandom.com.”) cùng nút **Hoàn tác**. Hoàn tác đưa trang web về như trước khi bạn mở menu của nó, gồm cả nhãn, kể cả sau nhiều thay đổi. Nút này tồn tại đến lần tìm kiếm tiếp theo, hoặc đến khi bạn thay đổi trang web khác.

## Phạm vi của trang web

Một thứ hạng áp dụng cho một trang web và mọi tên miền phụ của nó. Tên ở đầu menu chọn mức: chọn `wikipedia.org` áp dụng cho Wikipedia của mọi ngôn ngữ, còn `en.wikipedia.org` chỉ cho bản tiếng Anh. Lựa chọn cụ thể nhất thắng, nên bạn có thể ẩn `fandom.com` mà vẫn nâng `minecraft.fandom.com`.

Với các dịch vụ mà ai cũng có thể xuất bản trang web riêng, như `github.io` hoặc `blogspot.com`, các lựa chọn dừng ở trang web của người đó: `someone.github.io` không đề xuất toàn bộ `github.io`. Nếu bạn đã xếp hạng cả dịch vụ từ trước, nó vẫn được đề xuất để bạn thay đổi.

## Xếp hạng lại

Anubis sắp xếp lại các kết quả đã có trên trang; nó không thể lấy các kết quả mà công cụ tìm kiếm không gửi. Một kết quả được nâng từ cuối trang 1 sẽ lên, nhưng một trang web chỉ có ở trang 3 cần [Tải thêm kết quả](./more-results.md) trước.

Để giữ thứ tự của công cụ tìm kiếm và chỉ dùng nhãn và việc ẩn, hãy tắt **Cài đặt → Giao diện → Xếp hạng lại kết quả**.

## Kết quả bị ẩn

**Cài đặt → Giao diện → Kết quả bị ẩn** đặt cách kết quả bị ẩn trông như thế nào:

- **Gỡ bỏ** (mặc định): biến mất khỏi trang. Bản tóm tắt phía trên kết quả đếm chúng, và **Hiện mục đã ẩn** đưa chúng trở lại.
- **Thu gọn**: một dòng ghi tên trang web và lý do bị ẩn, cùng nút **Hiện**. Các kết quả bị ẩn liên tiếp dùng chung một dòng (“fandom.com và 5 kết quả khác bị ẩn bởi danh sách của bạn”), và **Hiện** của dòng đó đưa tất cả trở lại.
- **Làm mờ**: giữ nguyên chỗ, ở dạng mờ.

## Trang web của bạn

**Cài đặt → Trang web của bạn** liệt kê mọi trang web bạn đã xếp hạng, cùng nhãn của chúng. Hãy đổi thứ hạng ở đó, thêm một trang web theo tên, hoặc chỉnh sửa cả danh sách dạng văn bản.

![Cài đặt, Trang web của bạn](../../img/options-sites.png)

Các trang web của bạn được lưu thành một danh sách theo [định dạng danh sách Anubis](../../list-format.md) (trang này bằng tiếng Anh), nên bạn có thể [xuất bản](./publish-a-list.md) để người khác đăng ký. Danh sách được giữ trong bộ nhớ đồng bộ hóa của trình duyệt, nên nó đi theo bạn sang các máy tính khác nơi bạn đã đăng nhập cùng tài khoản trình duyệt ([tìm hiểu thêm về đồng bộ hóa](./sync.md)).
