# Giới thiệu

Anubis là tiện ích mở rộng cho Firefox và Chrome, thay đổi trang kết quả tìm kiếm. Nó ẩn những trang web bạn không bao giờ muốn thấy, nâng những trang bạn tin cậy, gắn nhãn cho kết quả để bạn phân biệt chúng chỉ trong một cái liếc mắt, và gỡ các câu trả lời AI cùng những khung khác bạn không yêu cầu.

Anubis hoạt động trên công cụ tìm kiếm bạn vẫn dùng. Lựa chọn của bạn và các danh sách bạn đăng ký áp dụng cho mọi lần tìm kiếm.

<!-- Maintainer: this is the Vietnamese translation of docs/guide/introduction.md. HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page in English. -->

<HideDemo />

<div class="github-only">

![Anubis phía trên một trang kết quả: bản tóm tắt một dòng cho biết nó đã ẩn và nâng những gì, cùng các nhãn dưới mỗi tiêu đề](../../img/summary.png)

<p class="caption">Hiển thị trên một trang thử nghiệm bằng tiếng Anh.</p>

</div>

## Tính năng

- **Xếp hạng bất kỳ trang web nào từ kết quả.** Ẩn, hạ, nâng hoặc ghim một trang web bằng nút trên bất kỳ kết quả nào. [Xếp hạng trang web](./ranking.md)
- **Nhãn.** Kết quả có các nhãn như “Official docs”, “Discussion”, “Paywalled”, “AI-generated” hoặc “Independent wiki”. Bạn quyết định mỗi nhãn làm gì, từ chỉ hiện nhãn đến ẩn mọi kết quả có nhãn đó. [Nhãn](./tags.md)
- **Danh sách ai cũng có thể xuất bản.** Đăng ký các danh sách gắn nhãn và xếp hạng trang web giúp bạn. Danh sách là một tệp văn bản trong kho Git, nên ai cũng có thể xuất bản một danh sách và đề xuất thay đổi cho danh sách. Brave Goggles, bộ quy tắc uBlacklist và danh sách tên miền thuần túy dùng được nguyên trạng. Một số danh sách được tạo mỗi tuần từ dữ liệu của các dự án khác, như HUGE AI Blocklist và Indie Wiki Buddy, và ghi công các dự án đó. [Đăng ký danh sách](./lists.md) và [Xuất bản danh sách](./publish-a-list.md)
- **Gỡ khung.** Gỡ câu trả lời AI, khung video, “Mọi người cũng hỏi” và nhiều thứ khác khỏi mọi lần tìm kiếm. [Gỡ khung](./clean-up.md)
- **Nhiều hơn một trang kết quả.** Đưa các trang tiếp theo lên trang đầu và xếp hạng chúng cùng nhau, để trang web bạn đã ghim ở trang 3 lên đầu. [Tải thêm kết quả](./more-results.md)
- **Đồng bộ hóa.** Các trang web và cài đặt của bạn đi theo bạn qua tính năng đồng bộ hóa của trình duyệt, và giữa Firefox với Chrome qua máy chủ WebDAV. [Đồng bộ hóa giữa các máy tính](./sync.md)
- **Mang theo danh sách cũ.** Chuyển các trang web của bạn từ uBlacklist, HOHSER hoặc một Brave Goggle sang. [Chuyển từ công cụ khác](./import-and-backup.md)
- **Dễ hoàn tác.** Bản tóm tắt một dòng phía trên kết quả cho biết Anubis đã thay đổi gì, “Hiện mục đã ẩn” đưa mọi thứ trở lại trên trang đó, và “Hoàn tác” lấy lại thay đổi gần nhất của bạn.

::: warning Ngôn ngữ
Anubis có bản tiếng Anh. Anubis cũng có bản tiếng Ả Rập, Bengal, Trung (giản thể), Trung (phồn thể), Pháp, Đức, Hindi, Indonesia, Ý, Nhật, Hàn, Bồ Đào Nha (Brazil), Nga, Tây Ban Nha, Thổ Nhĩ Kỳ, Urdu và Việt, nhưng đó đều là bản dịch máy, chưa được người nói các ngôn ngữ ấy kiểm tra và chưa được hỗ trợ đầy đủ: hãy dùng cẩn thận. [Giúp dịch](./translate.md) nói thêm về việc này và cách sửa các bản dịch.
:::

Anubis hoạt động trên Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo và Yandex. Mojeek còn ở mức thử nghiệm: chưa được thử trên trang thật. Xem [Công cụ tìm kiếm](./search-engines.md) để biết chi tiết.

## Tên gọi từ đâu ra

Trong thần thoại Ai Cập, Anubis cân từng trái tim với một chiếc lông vũ. Tiện ích này làm điều tương tự với kết quả tìm kiếm, và những trang web không qua được phép cân sẽ bị ẩn. Chiếc cân trong menu trên mỗi kết quả là một lời gợi nhắc đến điều đó; mọi thứ còn lại nói thẳng nó làm gì.

## Tình trạng

Anubis còn non trẻ, và có trên [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) và [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi). Edge Add-ons chưa có Anubis. [Bản phát hành trên GitHub](https://github.com/Bishop-V/anubis/releases) được gắn tag gồm các gói có phiên bản và liên kết ổn định đến bản dựng Firefox và Chrome mới nhất. Hầu hết công cụ tìm kiếm đã được kiểm tra trên trang thật, số còn lại chỉ trên các trang thử nghiệm dựng theo bố cục của chúng; [Công cụ tìm kiếm](./search-engines.md) cho biết công cụ nào. [Bắt đầu](./getting-started.md) hướng dẫn cách cài đặt. Nếu có gì trông sai trên trang tìm kiếm thật, xem [Khắc phục sự cố](./troubleshooting.md).
