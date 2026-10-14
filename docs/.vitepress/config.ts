import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig, type MarkdownEnv } from 'vitepress';
import { REPO_URL as repo } from '../../utils/links';

// The documentation site, built from the Markdown in docs/ with VitePress and
// published to GitHub Pages by .github/workflows/docs.yml. The pages read fine on
// GitHub too, so keep links relative between pages.

// GitHub Pages serves a project site under /<repo>/. DOCS_BASE overrides it, for a
// custom domain ("/") or a fork.
const base = process.env.DOCS_BASE ?? '/anubis/';

// Screenshots come in light and dark: result.png and result-dark.png, made by
// `node e2e/run.mjs docs`. Pages link to the light one, which is what GitHub shows;
// here every image with a dark twin next to it gets both, and brand.css shows the
// one that matches the site's mode.
const withDark = (html: string, env: MarkdownEnv) =>
  html.replace(/<img\b([^>]*?)\bsrc="([^":]+)\.png"([^>]*)>/g, (img, before: string, src: string, after: string) =>
    existsSync(resolve(dirname(env.realPath ?? env.path), `${src}-dark.png`))
      ? `<img class="light-only"${before}src="${src}.png"${after}><img class="dark-only"${before}src="${src}-dark.png"${after}>`
      : img,
  );

// VitePress follows the browser's light or dark mode until you pick one with its
// switch, but it reads a browser that reports neither as light. This runs before
// VitePress's own check and, for such a browser only, makes the dark query match,
// so the first paint and VitePress's Auto mode both come out dark.
export const darkWhenUnknown = `(() => {
  const query = window.matchMedia?.bind(window);
  if (!query || query('(prefers-color-scheme: light)').matches || query('(prefers-color-scheme: dark)').matches) return;
  window.matchMedia = (media) => query(media.replace(/\\(\\s*prefers-color-scheme\\s*:\\s*dark\\s*\\)/g, '(min-width: 0px)'));
})()`;

// The Vietnamese wiki (docs/vi/): the home page and the guide. Pages for people who
// publish lists or work on Anubis (the lists directory, the list format, the
// subscribe page, and the experiments) stay in English, so these links lead to the
// English pages.
const vietnamese = {
  label: 'Tiếng Việt',
  lang: 'vi',
  link: '/vi/',
  description: 'Tiện ích mở rộng trình duyệt để ẩn, xếp hạng và gắn nhãn kết quả tìm kiếm, với các danh sách ai cũng có thể xuất bản.',
  themeConfig: {
    nav: [
      { text: 'Wiki', link: '/vi/guide/introduction', activeMatch: '^/vi/guide/(?!privacy)' },
      { text: 'Danh sách (tiếng Anh)', link: '/lists' },
      { text: 'Định dạng danh sách (tiếng Anh)', link: '/list-format' },
      { text: 'Quyền riêng tư', link: '/vi/guide/privacy' },
    ],
    sidebar: [
      {
        text: 'Bắt đầu',
        items: [
          { text: 'Giới thiệu', link: '/vi/guide/introduction' },
          { text: 'Bắt đầu', link: '/vi/guide/getting-started' },
        ],
      },
      {
        text: 'Dùng Anubis',
        items: [
          { text: 'Xếp hạng trang web', link: '/vi/guide/ranking' },
          { text: 'Nhãn', link: '/vi/guide/tags' },
          { text: 'Đăng ký danh sách', link: '/vi/guide/lists' },
          { text: 'Gỡ khung', link: '/vi/guide/clean-up' },
          { text: 'Tải thêm kết quả', link: '/vi/guide/more-results' },
          { text: 'Chuyển từ công cụ khác', link: '/vi/guide/import-and-backup' },
          { text: 'Đồng bộ hóa giữa các máy tính', link: '/vi/guide/sync' },
        ],
      },
      {
        text: 'Xuất bản danh sách',
        items: [
          { text: 'Xuất bản danh sách', link: '/vi/guide/publish-a-list' },
          { text: 'Định dạng danh sách (tiếng Anh)', link: '/list-format' },
          { text: 'Thư mục danh sách (tiếng Anh)', link: '/lists' },
        ],
      },
      {
        text: 'Giới thiệu thêm',
        items: [
          { text: 'Công cụ tìm kiếm', link: '/vi/guide/search-engines' },
          { text: 'Quyền riêng tư và quyền hạn', link: '/vi/guide/privacy' },
          { text: 'Khắc phục sự cố', link: '/vi/guide/troubleshooting' },
          { text: 'Giúp dịch', link: '/vi/guide/translate' },
          { text: 'Thử nghiệm và quyết định (tiếng Anh)', link: '/experiments' },
          { text: 'Đóng góp (tiếng Anh)', link: `${repo}/blob/main/CONTRIBUTING.md` },
          { text: 'Phát triển Anubis (tiếng Anh)', link: `${repo}/blob/main/DEVELOPMENT.md` },
        ],
      },
    ],
    editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Sửa trang này trên GitHub' },
    outline: { level: [2, 3] as [number, number], label: 'Trên trang này' },
    footer: { message: 'Phát hành theo GNU AGPL v3. Bản dịch máy, chưa được người nói tiếng Việt kiểm tra.' },
    docFooter: { prev: 'Trang trước', next: 'Trang sau' },
    lastUpdated: { text: 'Cập nhật lần cuối' },
    langMenuLabel: 'Đổi ngôn ngữ',
    returnToTopLabel: 'Về đầu trang',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Giao diện',
    lightModeSwitchTitle: 'Chuyển sang giao diện sáng',
    darkModeSwitchTitle: 'Chuyển sang giao diện tối',
    skipToContentLabel: 'Chuyển đến nội dung',
  },
};

export default defineConfig({
  title: 'Anubis',
  description: 'A browser extension that hides, ranks, and tags search results, with lists anyone can publish.',
  lang: 'en',
  base,
  cleanUrls: true,
  lastUpdated: true,
  locales: { root: { label: 'English', lang: 'en' }, vi: vietnamese },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}anubis.svg` }],
    ['script', { id: 'dark-when-unknown' }, darkWhenUnknown],
  ],
  themeConfig: {
    logo: '/anubis.svg',
    nav: [
      // Privacy has its own item, so Wiki isn't lit up there too.
      { text: 'Wiki', link: '/guide/introduction', activeMatch: '^/guide/(?!privacy)' },
      { text: 'Lists', link: '/lists' },
      { text: 'List format', link: '/list-format' },
      { text: 'Privacy', link: '/guide/privacy' },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Using Anubis',
        items: [
          { text: 'Ranking sites', link: '/guide/ranking' },
          { text: 'Tags', link: '/guide/tags' },
          { text: 'Subscribing to lists', link: '/guide/lists' },
          { text: 'Removing panels', link: '/guide/clean-up' },
          { text: 'Loading more results', link: '/guide/more-results' },
          { text: 'Moving from other tools', link: '/guide/import-and-backup' },
          { text: 'Syncing between computers', link: '/guide/sync' },
        ],
      },
      {
        text: 'Publishing lists',
        items: [
          { text: 'Publish a list', link: '/guide/publish-a-list' },
          { text: 'List format', link: '/list-format' },
          { text: 'Lists directory', link: '/lists' },
        ],
      },
      {
        text: 'About',
        items: [
          { text: 'Search engines', link: '/guide/search-engines' },
          { text: 'Privacy and permissions', link: '/guide/privacy' },
          { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          { text: 'Help translate', link: '/guide/translate' },
          { text: 'Experiments and decisions', link: '/experiments' },
          { text: 'Contributing', link: `${repo}/blob/main/CONTRIBUTING.md` },
          { text: 'Developing Anubis', link: `${repo}/blob/main/DEVELOPMENT.md` },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: repo }],
    editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Edit this page on GitHub' },
    search: {
      provider: 'local',
      options: {
        locales: {
          vi: {
            translations: {
              button: { buttonText: 'Tìm kiếm', buttonAriaLabel: 'Tìm kiếm' },
              modal: {
                displayDetails: 'Hiện chi tiết',
                resetButtonTitle: 'Xóa tìm kiếm',
                backButtonTitle: 'Đóng tìm kiếm',
                noResultsText: 'Không có kết quả cho',
                footer: { selectText: 'chọn', selectKeyAriaLabel: 'enter', navigateText: 'di chuyển', navigateUpKeyAriaLabel: 'mũi tên lên', navigateDownKeyAriaLabel: 'mũi tên xuống', closeText: 'đóng', closeKeyAriaLabel: 'esc' },
              },
            },
          },
        },
      },
    },
    outline: { level: [2, 3], label: 'On this page' },
    footer: { message: 'Released under the GNU AGPL v3.' },
  },
  markdown: {
    config(md) {
      for (const rule of ['image', 'html_block', 'html_inline'] as const) {
        const render = md.renderer.rules[rule]!;
        md.renderer.rules[rule] = (tokens, idx, options, env, self) => withDark(render(tokens, idx, options, env, self), env);
      }
    },
  },
  vite: {
    // The lists page reads lists/directory.json from outside docs/.
    server: { fs: { allow: ['..'] } },
  },
});
