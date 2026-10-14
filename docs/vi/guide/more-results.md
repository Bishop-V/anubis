# Tải thêm kết quả

Các công cụ tìm kiếm gửi từng trang kết quả một, nên Anubis chỉ có thể xếp hạng lại những gì có trên trang đó. **Tải thêm kết quả**, trong bản tóm tắt phía trên kết quả, đưa trang tiếp theo lên trang hiện tại và xếp hạng mọi thứ cùng nhau. Một trang web bạn đã ghim mà chỉ xuất hiện ở trang 3 sẽ lên đầu sau hai lần nhấn. Trên điện thoại, nút này nằm trong **Chi tiết** của bản tóm tắt.

Kết quả từ các trang sau được đánh dấu “Từ trang 2” và tương tự, bằng một dấu rỗng nhỏ, dưới tiêu đề. Chúng nằm ngay sau kết quả cuối cùng, nên các liên kết trang của chính công cụ tìm kiếm vẫn ở cuối.

## Tự động

**Cài đặt → Giao diện → Tự động tải thêm kết quả** tải số trang bổ sung bạn nhập, từ 0 (tắt) đến 20, trong mọi lần tìm kiếm. Mặc định là tắt. Mỗi trang bổ sung là thêm một yêu cầu gửi đến công cụ tìm kiếm và làm lần tìm kiếm chậm thêm khoảng một giây. Công cụ tìm kiếm có thể hiện CAPTCHA hoặc làm chậm nếu nhận quá nhiều yêu cầu, và hầu hết ngừng gửi trang trước khi đến 20. Cài đặt cho biết con số bạn nhập sẽ tốn bao nhiêu. Việc tải bắt đầu khi liên kết “Next” hoặc nút “More results” của chính công cụ tìm kiếm đã xuất hiện ở cuối trang, và nút trong bản tóm tắt cũng hiện từ lúc đó.

## Cách hoạt động

- **DuckDuckGo:** Anubis nhấn nút “More results” của chính DuckDuckGo.
- **Google, Bing và Yahoo:** Anubis theo liên kết “Next” của trang trong nền và thêm các kết quả vào trang hiện tại.
- **Brave Search và Ecosia:** Anubis yêu cầu trang tiếp theo theo cách các liên kết của chính trang đó làm.

Các yêu cầu chỉ gửi đến công cụ tìm kiếm bạn đang dùng, và các trang được tải lần lượt từng trang với một khoảng nghỉ ngắn giữa chúng. Nếu công cụ tìm kiếm gửi một trang không có kết quả, thường là vì nó muốn bạn xác nhận mình không phải là robot, Anubis thử lại một lần bằng cách mở trang đó khuất tầm nhìn, như thể bạn tự mở, rồi đóng nó lại.

## Khi nào nó dừng

Khi một trang không đến, bản tóm tắt cho biết lý do dưới dòng đầu tiên, ví dụ “Bing không gửi kết quả nào cho trang 3”, và **Mở trang 3** mở trang đó trong một thẻ mới để bạn xem công cụ tìm kiếm đã gửi gì. Nếu nó yêu cầu bạn xác nhận mình không phải là robot, hãy làm điều đó ở đó, rồi nhấn **Tải thêm kết quả** lần nữa. Một công cụ tìm kiếm yêu cầu Anubis chậm lại sẽ được thử thêm một lần sau một lúc chờ ngắn. Khi công cụ tìm kiếm chỉ gửi những kết quả đã có trên trang, nghĩa là không còn thêm nữa, và nút biến mất. Startpage, Kagi, Yandex, Mojeek và các phiên bản HTML và Lite của DuckDuckGo chưa hỗ trợ tính năng này.
