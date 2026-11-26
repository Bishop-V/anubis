import { createI18n } from '@inglorious/i18n';
import { wikiWords } from '../../docs/.vitepress/locales.ts';

const extras = {
  en: {
    mainNavigation: 'Main navigation', wikiNavigation: 'Wiki navigation', adjacentPages: 'Adjacent pages',
    searchTitle: 'Search the wiki', searchLabel: 'Search guides', searchError: 'Search could not load. Try again.',
    searching: 'Searching…', searchNone: 'No results', searchClose: 'Close', notices: 'Third-party notices',
    platformWatch: 'Platform watch', replay: 'Play again',
    rankCaption: 'Pinning one site and lowering another from the button beside each result.',
    hideCaption: 'Hiding a site from the button beside its result.',
  },
  de: {
    mainNavigation: 'Hauptnavigation', wikiNavigation: 'Wiki-Navigation', adjacentPages: 'Benachbarte Seiten',
    searchTitle: 'Wiki durchsuchen', searchLabel: 'Anleitungen durchsuchen', searchError: 'Suche konnte nicht geladen werden. Versuche es erneut.',
    searching: 'Suche läuft…', searchNone: 'Keine Ergebnisse', searchClose: 'Schließen', notices: 'Hinweise zu Drittanbietern',
    platformWatch: 'Plattformbeobachtung (auf Englisch)', replay: 'Erneut abspielen',
    rankCaption: 'Eine Website anheften und eine andere abwerten, über die Schaltfläche neben dem jeweiligen Ergebnis.',
    hideCaption: 'Eine Website über die Schaltfläche neben dem Ergebnis ausblenden.',
  },
  vi: {
    mainNavigation: 'Điều hướng chính', wikiNavigation: 'Điều hướng wiki', adjacentPages: 'Trang liền kề',
    searchTitle: 'Tìm trong wiki', searchLabel: 'Tìm hướng dẫn', searchError: 'Không tải được tìm kiếm. Hãy thử lại.',
    searching: 'Đang tìm…', searchNone: 'Không có kết quả', searchClose: 'Đóng', notices: 'Thông báo về phần mềm bên thứ ba',
    platformWatch: 'Theo dõi nền tảng (tiếng Anh)', replay: 'Phát lại',
    rankCaption: 'Ghim một trang web và hạ hạng một trang khác bằng nút bên cạnh mỗi kết quả.',
    hideCaption: 'Ẩn một trang web bằng nút bên cạnh kết quả.',
  },
  'zh-cn': {
    mainNavigation: '主导航', wikiNavigation: '维基导航', adjacentPages: '相邻页面',
    searchTitle: '搜索维基', searchLabel: '搜索指南', searchError: '无法加载搜索，请重试。',
    searching: '正在搜索…', searchNone: '没有结果', searchClose: '关闭', notices: '第三方软件声明',
    platformWatch: '平台观察（英文）', replay: '重播',
    rankCaption: '用结果旁的按钮置顶一个网站，并降低另一个网站的排名。',
    hideCaption: '用结果旁的按钮隐藏一个网站。',
  },
  'zh-tw': {
    mainNavigation: '主導覽', wikiNavigation: '維基導覽', adjacentPages: '相鄰頁面',
    searchTitle: '搜尋維基', searchLabel: '搜尋指南', searchError: '無法載入搜尋，請重試。',
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
  appearance: 'Theme', skip: 'Skip to content', outline: 'On this page', footer: 'Released under the GNU AGPL v3.',
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
