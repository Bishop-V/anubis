import { createI18n } from '@inglorious/i18n';
import { wikiWords } from '../../docs/.vitepress/locales.ts';

const extras = {
  en: {
    breadcrumb: "Breadcrumb", searchEnter: "Enter to open", searchBrowse: "↑ ↓ to browse", copyCode: "Copy code", codeCopied: "Code copied", copyCodeFailed: "Select and copy the code.",
    mainNavigation: 'Main navigation', wikiNavigation: 'Wiki navigation', adjacentPages: 'Adjacent pages',
    searchTitle: 'Search the wiki', searchLabel: 'Search guides', searchError: 'Search could not load.', searchRetry: 'Try again',
    searching: 'Searching…', searchNone: 'No results', searchClose: 'Close', notices: 'Third-party notices',
    platformWatch: 'Platform watch', replay: 'Play again',
    rankCaption: 'Pinning one site and lowering another from the button beside each result.',
    hideCaption: 'Hiding a site from the button beside its result.',
  },
  de: {
    breadcrumb: "Brotkrümelnavigation", searchEnter: "Mit Eingabetaste öffnen", searchBrowse: "Mit ↑ ↓ navigieren", copyCode: "Code kopieren", codeCopied: "Code kopiert", copyCodeFailed: "Code markieren und kopieren.",
    mainNavigation: 'Hauptnavigation', wikiNavigation: 'Wiki-Navigation', adjacentPages: 'Benachbarte Seiten',
    searchTitle: 'Wiki durchsuchen', searchLabel: 'Anleitungen durchsuchen', searchError: 'Suche konnte nicht geladen werden.', searchRetry: 'Erneut versuchen',
    searching: 'Suche läuft…', searchNone: 'Keine Ergebnisse', searchClose: 'Schließen', notices: 'Hinweise zu Drittanbietern',
    platformWatch: 'Plattformbeobachtung (auf Englisch)', replay: 'Erneut abspielen',
    rankCaption: 'Eine Website anheften und eine andere abwerten, über die Schaltfläche neben dem jeweiligen Ergebnis.',
    hideCaption: 'Eine Website über die Schaltfläche neben dem Ergebnis ausblenden.',
  },
  vi: {
    breadcrumb: "Đường dẫn điều hướng", searchEnter: "Nhấn Enter để mở", searchBrowse: "Dùng ↑ ↓ để duyệt", copyCode: "Sao chép mã", codeCopied: "Đã sao chép mã", copyCodeFailed: "Chọn và sao chép mã.",
    mainNavigation: 'Điều hướng chính', wikiNavigation: 'Điều hướng wiki', adjacentPages: 'Trang liền kề',
    searchTitle: 'Tìm trong wiki', searchLabel: 'Tìm hướng dẫn', searchError: 'Không tải được tìm kiếm.', searchRetry: 'Thử lại',
    searching: 'Đang tìm…', searchNone: 'Không có kết quả', searchClose: 'Đóng', notices: 'Thông báo về phần mềm bên thứ ba',
    platformWatch: 'Theo dõi nền tảng (tiếng Anh)', replay: 'Phát lại',
    rankCaption: 'Ghim một trang web và hạ hạng một trang khác bằng nút bên cạnh mỗi kết quả.',
    hideCaption: 'Ẩn một trang web bằng nút bên cạnh kết quả.',
  },
  'zh-cn': {
    breadcrumb: "面包屑导航", searchEnter: "按 Enter 打开", searchBrowse: "用 ↑ ↓ 浏览", copyCode: "复制代码", codeCopied: "已复制代码", copyCodeFailed: "请选择并复制代码。",
    mainNavigation: '主导航', wikiNavigation: '维基导航', adjacentPages: '相邻页面',
    searchTitle: '搜索维基', searchLabel: '搜索指南', searchError: '无法加载搜索。', searchRetry: '重试',
    searching: '正在搜索…', searchNone: '没有结果', searchClose: '关闭', notices: '第三方软件声明',
    platformWatch: '平台观察（英文）', replay: '重播',
    rankCaption: '用结果旁的按钮置顶一个网站，并降低另一个网站的排名。',
    hideCaption: '用结果旁的按钮隐藏一个网站。',
  },
  'zh-tw': {
    breadcrumb: "階層導覽", searchEnter: "按 Enter 開啟", searchBrowse: "用 ↑ ↓ 瀏覽", copyCode: "複製程式碼", codeCopied: "已複製程式碼", copyCodeFailed: "請選取並複製程式碼。",
    mainNavigation: '主導覽', wikiNavigation: '維基導覽', adjacentPages: '相鄰頁面',
    searchTitle: '搜尋維基', searchLabel: '搜尋指南', searchError: '無法載入搜尋。', searchRetry: '重試',
    searching: '搜尋中…', searchNone: '沒有結果', searchClose: '關閉', notices: '第三方軟體聲明',
    platformWatch: '平台觀察（英文）', replay: '重播',
    rankCaption: '用結果旁的按鈕置頂一個網站，並降低另一個網站的排名。',
    hideCaption: '用結果旁的按鈕隱藏一個網站。',
  },
};

const english = {
  wiki: 'Wiki', lists: 'Lists', listFormat: 'List format', privacy: 'Privacy',
  startHere: 'Start here', introduction: 'Introduction', gettingStarted: 'Getting started',
  using: 'Using Anubis', ranking: 'Ranking sites', tags: 'Tags', subscribing: 'Subscribing to lists',
  panels: 'Removing panels', more: 'Loading more results', moving: 'Moving from other tools', sync: 'Syncing between computers',
  help: 'Help', troubleshooting: 'Troubleshooting', engines: 'Search engines', privacyFull: 'Privacy and permissions',
  publishing: 'Publishing lists', publish: 'Publish a list', directory: 'Lists directory',
  involved: 'Get involved', translate: 'Help translate', experiments: 'Experiments and decisions',
  contributing: 'Contributing', developing: 'Developing Anubis', editLink: 'Edit this page on GitHub',
  appearance: 'Appearance', toLight: 'Switch to light theme', toDark: 'Switch to dark theme', menu: 'Menu', skip: 'Skip to content', outline: 'On this page', footer: 'Released under the GNU AGPL v3.',
  prev: 'Previous page', next: 'Next page', top: 'Back to top',
  langMenu: 'Change language', search: { button: 'Search' }, lang: 'en', label: 'English',
};

const words = { en: english, ...wikiWords };
export const languages = Object.entries(words).map(([folder, { label, lang }]) => ({ folder, label, lang }));
const toResources = ({ folder, lang }) => [lang, { translation: { ...words[folder], ...extras[folder] } }];
const { t } = createI18n({
  defaultLocale: 'en',
  resources: Object.fromEntries(languages.map(toResources)),
  isServerRendered: true,
});

// The route owns the language. Explicit lookups also keep parallel static builds independent.
export const translate = (lang) => (key) => t(key, { lng: lang });
