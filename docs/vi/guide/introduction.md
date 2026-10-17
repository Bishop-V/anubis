# Giới thiệu

Anubis là tiện ích cho Firefox và Chrome thay đổi kết quả tìm kiếm. Nó ẩn các trang web bạn không muốn thấy, nâng các trang bạn tin tưởng, gắn nhãn cho kết quả, và gỡ câu trả lời AI cùng các khung khác. Nó hoạt động trên công cụ tìm kiếm bạn vẫn dùng.

<!-- Maintainer: Vietnamese translation of docs/guide/introduction.md. HideDemo (docs/.vitepress/theme/hide-demo.ts) draws a site being hidden, and the picture below, for reading on GitHub, is hidden. The picture is a generated screenshot from a mock page in English. -->

<HideDemo />

<div class="github-only">

![Anubis phía trên một trang kết quả: bản tóm tắt một dòng cho biết nó đã ẩn và nâng gì, và các nhãn dưới mỗi tiêu đề](../../img/summary.png)

<p class="caption">Hiển thị trên một trang thử nghiệm bằng tiếng Anh.</p>

</div>

## Tính năng

- **Xếp hạng bất kỳ trang web nào ngay từ kết quả.** Ẩn, hạ, nâng hoặc ghim một trang web bằng nút bên cạnh bất kỳ kết quả nào. [Xếp hạng trang web](./ranking.md)
- **Nhãn.** Các nhãn như “Official docs” hay “Paywalled” dưới mỗi tiêu đề. Bạn chọn mỗi nhãn làm gì. [Nhãn](./tags.md)
- **Danh sách ai cũng có thể xuất bản.** Đăng ký các danh sách gắn nhãn và xếp hạng trang web giùm bạn, kể cả Brave Goggles và bộ quy tắc uBlacklist. [Đăng ký danh sách](./lists.md) và [Xuất bản danh sách](./publish-a-list.md)
- **Gỡ khung.** Bỏ câu trả lời AI, khung video và “Mọi người cũng hỏi” khỏi mọi lần tìm kiếm. [Gỡ khung](./clean-up.md)
- **Nhiều hơn một trang kết quả.** Kéo các trang sau lên trang đầu và xếp hạng chung. [Tải thêm kết quả](./more-results.md)
- **Đồng bộ hóa.** Qua tính năng đồng bộ của trình duyệt, hoặc giữa Firefox và Chrome bằng máy chủ WebDAV. [Đồng bộ hóa giữa các máy tính](./sync.md)
- **Mang theo danh sách cũ.** Nhập từ uBlacklist, HOHSER hoặc một Brave Goggle. [Chuyển từ công cụ khác](./import-and-backup.md)
- **Dễ hoàn tác.** Bản tóm tắt phía trên kết quả cho biết Anubis đã thay đổi gì, và “Hiện mục đã ẩn” đưa chúng trở lại.

::: warning Ngôn ngữ
Anubis được viết bằng tiếng Anh. Mọi ngôn ngữ khác, kể cả tiếng Việt, là bản dịch máy chưa ai kiểm tra: hãy dùng thận trọng. Xem [Giúp dịch](./translate.md).
:::

Anubis hoạt động trên Google, DuckDuckGo, Bing, Brave Search, Startpage, Ecosia, Kagi, Yahoo và Yandex; Mojeek đang thử nghiệm. Xem [Công cụ tìm kiếm](./search-engines.md).

## Nguồn gốc cái tên

Trong thần thoại Ai Cập, Anubis cân mỗi trái tim với một chiếc lông vũ. Những trang web không qua được phép cân sẽ bị ẩn.

## Tình trạng

Anubis còn mới. Bạn có thể tải nó từ [Firefox Add-ons](https://addons.mozilla.org/addon/anubis-search/) hoặc [Chrome Web Store](https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi); [GitHub Releases](https://github.com/Bishop-V/anubis/releases) cũng có các gói. Xem [Bắt đầu](./getting-started.md), và [Khắc phục sự cố](./troubleshooting.md) nếu có gì không ổn.
